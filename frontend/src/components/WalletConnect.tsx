import { SendTransaction } from "@/../wailsjs/go/main/App";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EIP155_SIGNING_METHODS } from "@/data/wallet-connect";
import { chainConfigsAtom, walletConnectDataAtom } from "@/store/state";
import { web3wallet } from "@/utils/WalletConnectUtil";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
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
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";

interface Props {
  address: string;
  ledger: string;
  cardId: number;
}

const WalletConnect = ({ address, ledger, cardId }: Props) => {
  const [showConnect, setShowConnect] = useState(false);
  const [link, setLink] = useState("");
  const [pin, setPin] = useState("");

  const { toast } = useToast();

  const chainConfigs = useAtomValue(chainConfigsAtom);
  const [walletConnectData, setWalletConnectData] = useAtom(walletConnectDataAtom);

  const supportedNamespaces = useMemo(() => {
    const evmChains = chainConfigs
      .filter((chain) => chain.driver === "evm")
      .map((chain) => `eip155:${chain.chainId}`);

    console.log("evm chains:", evmChains);

    const evmMethods = Object.values(EIP155_SIGNING_METHODS);

    console.log("address:", address);

    return {
      eip155: {
        chains: evmChains,
        methods: evmMethods,
        events: ["accountsChanged", "chainChanged"],
        accounts: evmChains.map((chain) => `${chain}:${address}`).flat(),
      },
    };
  }, []);

  // const onSessionProposal = (
  //   proposal: SignClientTypes.EventArguments["session_proposal"]
  // ) => {
  //   console.log("session proposal: ", proposal);
  //   setWalletConnectData({ proposal });
  // };

  // const onSessionRequest = async (
  //   requestEvent: SignClientTypes.EventArguments["session_request"]
  // ) => {
  //   console.log("session request: ", requestEvent);
  //   const { topic, params, verifyContext } = requestEvent;
  //   const { request } = params;
  //   const requestSession = web3wallet.engine.signClient.session.get(topic);

  //   switch (request.method) {
  //     case EIP155_SIGNING_METHODS.ETH_SIGN:
  //     case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
  //       return;
  //     case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
  //     case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
  //       setWalletConnectData({ requestEvent, requestSession });
  //       return;
  //     default:
  //       return;
  //   }
  // };

  // const initWalletConnect = async () => {
  //   try {
  //     web3wallet = await Web3Wallet.init({
  //       core,
  //       metadata: {
  //         name: "Keyring",
  //         description: "Secure and handy hardware wallet for crypto holders",
  //         url: "https://keyring.so",
  //         icons: ["https://keyring.so/_next/image?url=%2Flogo.png&w=128&q=75"], // TODO use local image
  //       },
  //     });
  //   } catch (err) {
  //     toast({
  //       title: "Uh oh! Something went wrong.",
  //       description: `Error happens: ${err}`,
  //     });
  //   } finally {
  //     setLink("");
  //   }

  //   web3wallet.on("session_proposal", onSessionProposal);
  //   web3wallet.on("session_request", onSessionRequest);

  //   setInitialized(true);
  // };

  const connect = async () => {
    console.log("web3 wallet:", web3wallet);
    try {
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
    }
  };

  const onApprove = async () => {
    console.log("approve");
    const proposal = walletConnectData?.proposal;

    console.log("supportedNamespaces", supportedNamespaces);

    if (proposal) {
      const namespaces = buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces,
      });

      console.log("support name spaces:", namespaces);

      try {
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
    console.log("approve request");
    const requestEvent = walletConnectData?.requestEvent;

    if (requestEvent) {
      const { topic, params, id } = requestEvent;
      const { chainId, request } = params; // TODO check chain id is matched
      const transaction = request.params[0];

      try {
        let result;
        switch (request.method) {
          case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
            result = await SendTransaction(
              transaction.from,
              transaction.to,
              ledger,
              transaction.value,
              transaction.gas,
              transaction.data,
              "", // TODO adjust tip
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
          title: "Success!",
          description: "Reqeust is approved.",
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
            <Button type="submit" onClick={() => connect()}>
              Connect
            </Button>
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
            <Button type="submit" onClick={onApprove}>
              Approve
            </Button>
            <Button type="submit" onClick={onReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const requestDialog = () => {
    const metadata = walletConnectData!.requestSession!.peer.metadata;
    const transaction = walletConnectData!.requestEvent!.params.request.params[0];
    const { icons, name, url } = metadata;

    return (
      <Dialog open={true} onOpenChange={() => setWalletConnectData({})}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Wallet Connect</DialogTitle>
            <DialogDescription>
              Do you want to approve this request?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4">
            <Avatar>
              <AvatarImage src={icons[0]} />
              <AvatarFallback>n/a</AvatarFallback>
            </Avatar>
            <Label>{name} wants to request operation from your wallet.</Label>
            <Textarea>{JSON.stringify(transaction)}</Textarea>
            <div className="flex flex-row items-center justify-center gap-4">
              <Label className="text-right">PIN</Label>
              <Input
                type="password"
                onChange={(e) => setPin(e.target.value)}
              ></Input>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={onApproveRequest}>
              Approve
            </Button>
            <Button type="submit" onClick={onRejectRequest}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div>
      <div
        className="flex flex-col h-12 w-12 rounded-xl bg-secondary-foreground p-3 items-center justify-center"
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
