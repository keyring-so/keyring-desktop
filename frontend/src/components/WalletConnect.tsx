import { SendTransaction, SignTypedData } from "@/../wailsjs/go/main/App";
import { BrowserOpenURL } from "@/../wailsjs/runtime";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ETH } from "@/constants";
import { EIP155_SIGNING_METHODS } from "@/data/wallet-connect";
import { useClipboard } from "@/hooks/useClipboard";
import { chainConfigsAtom, walletConnectDataAtom } from "@/store/state";
import { web3wallet } from "@/utils/WalletConnectUtil";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { useAtom, useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GasFee from "./gas";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";

interface Props {
  address: string;
  ledger: string;
  cardId: number;
  explorer: string;
  explorerTx: string;
}

const WalletConnect = ({
  address,
  ledger,
  cardId,
  explorer,
  explorerTx,
}: Props) => {
  const [showConnect, setShowConnect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");
  const [pin, setPin] = useState("");
  const [gas, setGas] = useState("");

  const { toast } = useToast();

  const { hasCopied, onCopy } = useClipboard();

  const chainConfigs = useAtomValue(chainConfigsAtom);
  const [walletConnectData, setWalletConnectData] = useAtom(
    walletConnectDataAtom
  );

  const supportedNamespaces = useMemo(() => {
    const evmChains = chainConfigs
      .filter((chain) => chain.driver === "evm")
      .map((chain) => `eip155:${chain.chainId}`);

    const evmMethods = Object.values(EIP155_SIGNING_METHODS);

    return {
      eip155: {
        chains: evmChains,
        methods: evmMethods,
        events: ["accountsChanged", "chainChanged"],
        accounts: evmChains.map((chain) => `${chain}:${address}`).flat(),
      },
    };
  }, []);

  useEffect(() => {
    if (hasCopied) {
      toast({ description: "Copied to clipboard!" });
    }
  }, [hasCopied]);

  const connect = async () => {
    try {
      setLoading(true);
      await web3wallet.pair({ uri: link });
      setShowConnect(false);
      toast({
        title: "Success!",
        description: "Connected with DApp.",
      });
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async () => {
    const proposal = walletConnectData?.proposal;
    if (proposal) {
      const namespaces = buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces,
      });

      try {
        setLoading(true);
        await web3wallet.approveSession({
          id: proposal.id,
          relayProtocol: proposal.params.relays[0].protocol,
          namespaces,
        });
        toast({
          title: "Success!",
          description: "Session is approved.",
        });

        setWalletConnectData({});
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const onReject = async () => {
    const proposal = walletConnectData?.proposal;
    if (proposal) {
      try {
        await web3wallet.rejectSession({
          id: proposal.id,
          reason: getSdkError("USER_REJECTED_METHODS"),
        });
        setWalletConnectData({});
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      }
    }
  };

  // from string,
  // to string,
  // chainName string,
  // value string,
  // gas string,
  // data string,
  // tip string,
  // pin string,
  // cardId int,
  const onApproveRequest = async () => {
    const requestEvent = walletConnectData?.requestEvent;

    if (requestEvent) {
      const { topic, params, id } = requestEvent;
      const { chainId, request } = params; // TODO check chain id is matched
      const transaction = request.params[0];

      try {
        setLoading(true);
        let result = "";
        switch (request.method) {
          case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
            result = await SendTransaction(
              transaction.from,
              transaction.to,
              ledger,
              transaction.value,
              transaction.gas,
              transaction.data,
              gas,
              pin,
              cardId
            );
            break;
          case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
          case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
          case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
            result = await SignTypedData(
              ledger,
              request.params[1],
              pin,
              cardId
            );
            break;
          default:
            break;
        }

        const response = { id, result: result, jsonrpc: "2.0" };
        await web3wallet.respondSessionRequest({
          topic,
          response,
        });
        toast({
          title: "Send data successfully.",
          description: `${result}`,
          action: (
            <Button
              onClick={() =>
                BrowserOpenURL(`${explorer}${explorerTx}/${result}`)
              }
            >
              Open
            </Button>
          ),
        });
        setWalletConnectData({});
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const onRejectRequest = async () => {
    const requestEvent = walletConnectData?.requestEvent;
    if (requestEvent) {
      const { topic, params, id } = requestEvent;
      const response = {
        id,
        jsonrpc: "2.0",
        error: {
          code: 5000,
          message: "User rejected.",
        },
      };
      try {
        await web3wallet.respondSessionRequest({
          topic,
          response,
        });
        setWalletConnectData({});
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      }
    }
  };

  const connectDialog = () => {
    return (
      <Dialog open={true} onOpenChange={() => setShowConnect(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>WalletConnect</DialogTitle>
            <DialogDescription>
              Copy the connection link from DApp.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-row items-center justify-center gap-4">
            <Label className="text-right">Link:</Label>
            <Input onChange={(e) => setLink(e.target.value)}></Input>
          </div>
          <DialogFooter>
            {loading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connect
              </Button>
            ) : (
              <Button type="submit" onClick={() => connect()}>
                Connect
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const proposalDialog = () => {
    const metadata = walletConnectData!.proposal!.params.proposer.metadata;
    const { icons, name, url } = metadata;
    return (
      <Dialog open={true} onOpenChange={() => setWalletConnectData({})}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Wallet Connect</DialogTitle>
            <DialogDescription>
              Do you want to accept this proposal?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4">
            <Avatar>
              <AvatarImage src={icons[0]} />
              <AvatarFallback>n/a</AvatarFallback>
            </Avatar>
            <Label>{name} wants to connect your wallet.</Label>
          </div>
          <DialogFooter>
            {loading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approve
              </Button>
            ) : (
              <Button type="submit" onClick={onApprove}>
                Approve
              </Button>
            )}

            <Button type="submit" onClick={onReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const sendTransactionModal = () => {
    const metadata = walletConnectData!.requestSession!.peer.metadata;
    const transaction =
      walletConnectData!.requestEvent!.params.request.params[0];
    const { icons, name, url } = metadata;

    return (
      <Dialog open={true} onOpenChange={() => setWalletConnectData({})}>
        <DialogContent className="sm:max-w-[465px]">
          <DialogHeader>
            <DialogTitle>Wallet Connect</DialogTitle>
            <DialogDescription>
              Do you want to approve this request?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-6">
            <Avatar>
              <AvatarImage src={icons[0]} />
              <AvatarFallback>n/a</AvatarFallback>
            </Avatar>
            <Label>{name} wants to request operation from your wallet.</Label>
            <div className="flex flex-col w-full">
              <Label className="mb-2">Send Transaction:</Label>
              <div className="flex flex-row gap-2 items-center justify-center">
                <Label className="w-[50px]">From:</Label>
                <Input value={transaction.from} disabled></Input>
              </div>
              <div className="flex flex-row gap-2 items-center justify-center">
                <Label className="w-[50px]">To:</Label>
                <Input value={transaction.to} disabled></Input>
              </div>
              <div className="flex flex-row gap-2 items-center justify-center">
                <Label className="w-[50px]">Gas:</Label>
                <Input
                  value={BigInt(transaction.gas).toString()}
                  disabled
                ></Input>
              </div>
              <div className="flex flex-row gap-2 items-center justify-center">
                <Label className="w-[50px]">Value:</Label>
                <Input
                  value={(Number(transaction.value || "0") / ETH).toString()}
                  disabled
                ></Input>
              </div>
              <div className="flex flex-row gap-2 items-center justify-center">
                <Label className="w-[50px]">Data:</Label>
                <Input value={transaction.data} disabled></Input>
              </div>
            </div>

            <div className="self-start">
              <GasFee
                chainName={ledger}
                from={transaction.from}
                to={transaction.to}
                setGas={setGas}
              />
            </div>

            <div className="flex flex-row items-center justify-center gap-4">
              <Label className="text-right">PIN</Label>
              <Input
                type="password"
                onChange={(e) => setPin(e.target.value)}
              ></Input>
            </div>
          </div>
          <DialogFooter>
            {loading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approve
              </Button>
            ) : (
              <Button type="submit" onClick={onApproveRequest}>
                Approve
              </Button>
            )}

            <Button type="submit" onClick={onRejectRequest}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const unknownMethodModal = (method: string) => {
    return (
      <Dialog open={true} onOpenChange={() => setWalletConnectData({})}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>WalletConnect</DialogTitle>
          </DialogHeader>
          <div className="flex flex-row items-center justify-center gap-4">
            <Label className="text-right">Unknown method:</Label>
            <Input className="w-auto" disabled value={method} />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={() => setWalletConnectData({})}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const signTypedDataModal = () => {
    const metadata = walletConnectData!.requestSession!.peer.metadata;
    const data = walletConnectData!.requestEvent!.params.request.params[1];
    const { icons, name, url } = metadata;

    return (
      <Dialog open={true} onOpenChange={() => setWalletConnectData({})}>
        <DialogContent className="sm:max-w-[465px]">
          <DialogHeader>
            <DialogTitle>Wallet Connect</DialogTitle>
            <DialogDescription>
              Do you want to approve this request?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-6">
            <Avatar>
              <AvatarImage src={icons[0]} />
              <AvatarFallback>n/a</AvatarFallback>
            </Avatar>
            <Label>{name} wants to sign data from your wallet.</Label>
            <div className="flex flex-col w-full">
              <div className="flex flex-row gap-2 items-center justify-center">
                <Label className="w-[50px]">Data:</Label>
                <Input value={data} disabled></Input>
              </div>
            </div>

            <div className="flex flex-row items-center justify-center gap-4">
              <Label className="text-right">PIN</Label>
              <Input
                type="password"
                onChange={(e) => setPin(e.target.value)}
              ></Input>
            </div>
          </div>
          <DialogFooter>
            {loading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approve
              </Button>
            ) : (
              <Button type="submit" onClick={onApproveRequest}>
                Approve
              </Button>
            )}

            <Button type="submit" onClick={onRejectRequest}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const requestDialog = () => {
    const { params, id } = walletConnectData!.requestEvent!;
    const { chainId, request } = params;

    switch (request.method) {
      case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
        return sendTransactionModal();

      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
        return signTypedDataModal();

      default:
        return unknownMethodModal(request.method);
    }
  };

  return (
    <div>
      <div
        className="flex flex-col h-12 w-12 rounded-xl bg-primary text-white p-3 items-center justify-center"
        onClick={() => setShowConnect(true)}
      >
        <img src="/walletconnect.svg" alt="WalletConnect" />
      </div>
      {showConnect && connectDialog()}
      {walletConnectData?.proposal && proposalDialog()}
      {walletConnectData?.requestEvent && requestDialog()}
    </div>
  );
};

export default WalletConnect;
