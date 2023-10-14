import { useToast } from "@/components/ui/use-toast";
import { EIP155_SIGNING_METHODS } from "@/data/wallet-connect";
import { walletConnectDataAtom } from "@/store/state";
import { createWeb3Wallet, web3wallet } from "@/utils/WalletConnectUtil";
import { SignClientTypes } from "@walletconnect/types";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false);

  const setWalletConnectData = useSetAtom(walletConnectDataAtom)

  const { toast } = useToast();

  const onSessionProposal = (
    proposal: SignClientTypes.EventArguments["session_proposal"]
  ) => {
    console.log("session proposal: ", proposal);
    setWalletConnectData({ proposal });
  };

  const onSessionRequest = async (
    requestEvent: SignClientTypes.EventArguments["session_request"]
  ) => {
    console.log("session request: ", requestEvent);
    const { topic, params, verifyContext } = requestEvent;
    const { request } = params;
    const requestSession = web3wallet.engine.signClient.session.get(topic);

    switch (request.method) {
      case EIP155_SIGNING_METHODS.ETH_SIGN:
      case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
        return;
      case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
        setWalletConnectData({ requestEvent, requestSession });
        return;
      default:
        return;
    }
  };

  const onInitialize = async () => {
    try {
      await createWeb3Wallet();
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }

    setInitialized(true);
  };
  useEffect(() => {
    if (!initialized) {
      onInitialize();
    } else {
        web3wallet.on("session_proposal", onSessionProposal);
        web3wallet.on("session_request", onSessionRequest);
    }
  }, [initialized, onInitialize]);

  return initialized;
}
