import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EIP155_SIGNING_METHODS } from "@/data/wallet-connect";
import { chainConfigsAtom } from "@/store/state";
import { Core } from "@walletconnect/core";
import { SignClientTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { IWeb3Wallet, Web3Wallet } from "@walletconnect/web3wallet";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
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

let web3wallet: IWeb3Wallet;
const core = new Core({
  projectId: "demoid", // TODO use config
  relayUrl: "wss://relay.walletconnect.com",
});

interface Data {
  proposal?: SignClientTypes.EventArguments["session_proposal"];
}

interface Props {
  address: string;
}

const WalletConnect = ({ address }: Props) => {
  const [initialized, setInitialized] = useState(false);
  const [data, setData] = useState<Data>();
  const [showConnect, setShowConnect] = useState(false);
  const [link, setLink] = useState("");

  const { toast } = useToast();

  const chainConfigs = useAtomValue(chainConfigsAtom);

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

  useEffect(() => {
    if (!initialized) {
      initWalletConnect();
    }
  }, [initialized]);

  const onSessionProposal = (
    proposal: SignClientTypes.EventArguments["session_proposal"]
  ) => {
    console.log("session proposal: ", proposal);
    setData({ proposal });
  };

  const onSessionRequest = async (
    event: SignClientTypes.EventArguments["session_request"]
  ) => {
    console.log("session request: ", event);
    const { topic, params, verifyContext } = event;
    const { request } = params;
  };

  const initWalletConnect = async () => {
    try {
      web3wallet = await Web3Wallet.init({
        core,
        metadata: {
          name: "Keyring",
          description: "Secure and handy hardware wallet for crypto holders",
          url: "https://keyring.so",
          icons: ["https://keyring.so/_next/image?url=%2Flogo.png&w=128&q=75"], // TODO use local image
        },
      });
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    } finally {
      setLink("");
    }

    web3wallet.on("session_proposal", onSessionProposal);
    web3wallet.on("session_request", onSessionRequest);

    setInitialized(true);
  };

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
    const proposal = data?.proposal;

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

        setData({});
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      }
    }
  };

  const onReject = async () => {
    const proposal = data?.proposal;
    if (proposal) {
      try {
        await web3wallet.rejectSession({
          id: proposal.id,
          reason: getSdkError("USER_REJECTED_METHODS"),
        });
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
    const metadata = data!.proposal!.params.proposer.metadata;
    const { icons, name, url } = metadata;
    return (
      <Dialog open={true} onOpenChange={() => setData({})}>
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

  return (
    <div>
      <div
        className="flex flex-col h-12 w-12 rounded-xl bg-secondary-foreground p-3 items-center justify-center"
        onClick={() => setShowConnect(true)}
      >
        <img src="/walletconnect.svg" alt="WalletConnect" />
      </div>
      {showConnect && connectDialog()}
      {data?.proposal && proposalDialog()}
    </div>
  );
};

export default WalletConnect;
