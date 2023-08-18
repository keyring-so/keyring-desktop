import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { showSettingsAtom, isTestnetAtom } from "@/store/state";
import { useAtom, useSetAtom } from "jotai";
import {
  GetCredentials,
  GetNetwork,
  Install,
  SetNetwork,
} from "@/../wailsjs/go/main/App";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { database } from "wailsjs/go/models";
import { errToast } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.png";

const Settings = () => {
  const [credentials, setCredentials] = useState<
    database.AccountCredential | undefined
  >(undefined);

  const setShowSettings = useSetAtom(showSettingsAtom);
  const [isTestnet, setIsTestnet] = useAtom(isTestnetAtom);

  useEffect(() => {
    (async () => {
      const res = await GetNetwork();
      setIsTestnet(res === "testnet");
    })();
  }, []);

  const resetCard = async () => {
    try {
      const _ = await Install();
      toast({
        title: "Success!",
        description: "Card is reset.",
      });
      setShowSettings(false);
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const getCredentials = async () => {
    try {
      const res = await GetCredentials();
      console.log(JSON.stringify(res));
      setCredentials(res);
    } catch (err) {
      errToast(err);
    }
  };

  const setNetwork = async (checked: boolean) => {
    try {
      if (checked) {
        await SetNetwork("testnet");
        setIsTestnet(true);
      } else {
        await SetNetwork("mainnet");
        setIsTestnet(false);
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const showCredentialsQRcode = () => {
    return (
      <Dialog open={true} onOpenChange={() => setCredentials(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credentials</DialogTitle>
            <DialogDescription>
              Please only share the pairing credentials with trusted devices.
            </DialogDescription>
          </DialogHeader>
          <div>
            <QRCodeSVG
              value={JSON.stringify(credentials)}
              size={128}
              imageSettings={{
                src: logo,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div>
      <Dialog open={true} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Please only change the settings when needed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-8 mt-6">
            <div className="flex flex-col gap-2">
              <Label>Connect card to a new device</Label>
              <Button className="w-1/2" onClick={getCredentials}>
                Get credentials
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Reset your card</Label>
              <Button className="w-1/2" onClick={resetCard}>
                Factory Reset
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="testnet-mode"
                onCheckedChange={setNetwork}
                checked={isTestnet}
              />
              <Label htmlFor="testnet-mode">Switch to Testnet</Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {credentials && showCredentialsQRcode()}
    </div>
  );
};

export default Settings;
