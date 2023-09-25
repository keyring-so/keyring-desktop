import {
  CheckCardConnection,
  CheckCardInitialized
} from "@/../wailsjs/go/main/App";
import InitializeDialog from "@/components/initialize";
import PairDialog from "@/components/pair";
import Settings from "@/components/settings";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { accountAtom, showSettingsAtom } from "@/store/state";
import { useAtom, useSetAtom } from "jotai";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import * as z from "zod";

function ConnectPage() {
  const [cardInitialized, setCardInitialized] = useState<boolean>(false);
  const [connectDialog, setConnectDialog] = useState(false);

  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);

  const { toast } = useToast();

  const connect = async () => {
    try {
      const res = await CheckCardConnection();
      if (res) {
        const res = await CheckCardInitialized();
        setCardInitialized(res);
        setConnectDialog(true);
      } else {
        toast({
          description:
            "Card is not detected, make sure it's connected via card reader and try again.",
        });
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  return (
    <div className="flex flex-row justify-evenly h-screen">
      {connectDialog && cardInitialized === false && <InitializeDialog handleClose={setConnectDialog} />}
      {connectDialog && cardInitialized === true && <PairDialog handleClose={setConnectDialog} />}
      <div className="flex flex-col justify-center items-center w-1/2">
        <h1 className="text-3xl font-semibold text-primary">Keyring Wallet</h1>
        <h2 className="mt-4 text-6xl font-medium text-primary">Welcome!</h2>
      </div>
      <div className="flex flex-col bg-gray-300 justify-center items-center w-1/2">
        <Button className="text-2xl w-auto h-auto" onClick={connect}>
          Connect your Keyring Card
        </Button>
      </div>

      <div className="fixed right-6 bottom-6">
        <SettingsIcon onClick={() => setShowSettings(true)} />
      </div>
      {showSettings && <Settings />}
    </div>
  );
}

export default ConnectPage;
