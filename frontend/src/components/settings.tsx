import packageJson from "@/../package.json";
import {
  GetCredentials,
  GetNetwork,
  Install,
  Reset,
  SetNetwork,
} from "@/../wailsjs/go/main/App";
import { database } from "@/../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useClipboard } from "@/hooks/useClipboard";
import { errToast } from "@/lib/utils";
import { accountAtom, isTestnetAtom, showSettingsAtom } from "@/store/state";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { LogoImageSrc } from "./logo";
import { Input } from "./ui/input";

const Settings = () => {
  const [credentials, setCredentials] = useState<
    database.AccountCredential | undefined
  >(undefined);
  const [pin, setPin] = useState("");

  const setShowSettings = useSetAtom(showSettingsAtom);
  const [isTestnet, setIsTestnet] = useAtom(isTestnetAtom);
  const account = useAtomValue(accountAtom);

  const { hasCopied, onCopy } = useClipboard();

  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const res = await GetNetwork();
      setIsTestnet(res === "testnet");
    })();
  }, []);

  const installApplets = async () => {
    try {
      const _ = await Install();
      toast({
        title: "Success!",
        description: "Applets are installed.",
      });
      setShowSettings(false);
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const resetCardAndWallet = async () => {
    try {
      const _ = await Reset(account.id, pin);
      toast({
        title: "Success!",
        description: "Card and wallet is reset.",
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

  const showCredentialsQRcode = () => (
    <Dialog open={true} onOpenChange={() => setCredentials(undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credentials</DialogTitle>
          <DialogDescription>
            Please only share the pairing credentials with trusted devices.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row gap-3 items-start">
          <QRCodeSVG
            value={JSON.stringify(credentials)}
            size={128}
            imageSettings={{
              src: LogoImageSrc,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
          <Button
            className="w-1/5 rounded-3xl"
            onClick={() => onCopy(JSON.stringify(credentials))}
          >
            <Label>Copy </Label>
            {hasCopied ? <ClipboardCheck /> : <Clipboard />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

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
            <Label>
              App Version:{" "}
              <span className="font-bold text-primary">
                {packageJson.version}
              </span>
            </Label>
            <div className="flex flex-col gap-2">
              <Label>Connect card to a new device</Label>
              <Button className="w-fit" onClick={getCredentials}>
                Get credentials
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Reset card and wallet</Label>
              <div className="flex flex-row gap-2 items-center justify-start">
                <Label htmlFor="pin" className="text-right">
                  PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  className="w-fit"
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
              <Button className="w-fit" onClick={resetCardAndWallet}>
                Reset
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Install applets on your card</Label>
              <Button className="w-fit" onClick={installApplets}>
                Install Applets
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
