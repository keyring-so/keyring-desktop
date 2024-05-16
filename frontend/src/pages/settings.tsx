import packageJson from "@/../package.json";
import {
  CheckUpdates,
  ClearData,
  DoUpdate,
  EnableTestnet,
  GetCredentials,
  Install,
  IsTestnetEnabled,
  ResetCard,
  ResetWallet,
} from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import { LogoImageSrc } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useClipboard } from "@/hooks/useClipboard";
import { errToast } from "@/lib/utils";
import { accountAtom, isTestnetAtom, showSidebarItem } from "@/store/state";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

const Settings = () => {
  const [credentials, setCredentials] = useState<
    main.CardCredential | undefined
  >(undefined);
  const [pin, setPin] = useState("");

  const setShowSidebarItem = useSetAtom(showSidebarItem);
  const [isTestnet, setIsTestnet] = useAtom(isTestnetAtom);
  const account = useAtomValue(accountAtom);

  const { hasCopied, onCopy } = useClipboard();

  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const res = await IsTestnetEnabled();
      setIsTestnet(res);
    })();
  }, []);

  const installApplets = async () => {
    try {
      const _ = await Install();
      toast({
        title: "Success!",
        description: "Applets are installed.",
      });
      setShowSidebarItem("");
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const resetCardAndWallet = async () => {
    try {
      const _ = await ResetCard(account.id, pin);
      toast({
        title: "Success!",
        description: "Card and wallet is reset.",
      });
      setShowSidebarItem("");
      window.location.reload();
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const unpairAndClearData = async () => {
    try {
      const _ = await ClearData(account.id, pin);
      toast({
        title: "Success!",
        description: "Card is unpaired.",
      });
      setShowSidebarItem("");
      window.location.reload();
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const walletReset = async () => {
    try {
      const _ = await ResetWallet();
      toast({
        title: "Success!",
        description: "Wallet is reset.",
      });
      setShowSidebarItem("");
      window.location.reload();
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const checkUpdates = async () => {
    try {
      const res = await CheckUpdates();
      if (res.shouldUpdate) {
        toast({
          title: "Update available!",
          description: `Latest version: ${res.latestVersion}`,
        });
      } else {
        toast({
          title: "No updates available.",
          description: `Current version: ${res.currentVersion}`,
        });
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const doUpdate = async () => {
    try {
      await DoUpdate();
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const getCredentials = async () => {
    try {
      const res = await GetCredentials(account.id);
      setCredentials(res);
    } catch (err) {
      errToast(err);
    }
  };

  const setNetwork = async (checked: boolean) => {
    try {
      await EnableTestnet(checked);
      setIsTestnet(checked);
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
    <div className="flex flex-col mt-6 ml-20 mr-20 gap-8 items-start flex-grow">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-lg">Please only change the settings when needed.</p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-xl font-semibold">App Info</h2>
        <div className="flex flex-col gap-3 border-solid border-2 p-4 rounded-xl">
          <Label className="font-semibold">
            Version:{" "}
            <span className="font-bold text-primary">
              {packageJson.version}
            </span>
          </Label>
          <Button className="w-[150px]" onClick={checkUpdates}>
            Check Updates
          </Button>
          <Button className="w-[150px]" onClick={doUpdate}>
            Start Update
          </Button>
          <div className="flex items-center space-x-2">
            <Label className="font-semibold mr-2" htmlFor="testnet-mode">
              Enable test networks
            </Label>
            <Switch
              id="testnet-mode"
              onCheckedChange={setNetwork}
              checked={isTestnet}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-xl font-semibold">Wallet Data</h2>
        <div className="flex flex-col gap-3 border-solid border-2 p-4 rounded-xl">
          <div className="flex flex-row gap-4 items-center justify-between">
            <Label>Connect card to a new device</Label>
            <Button className="w-[150px]" onClick={getCredentials}>
              Get credentials
            </Button>
          </div>
          <div className="flex flex-row gap-4 items-center justify-between">
            <Label>Clear database</Label>
            <Button className="w-[150px]" onClick={walletReset}>
              Clear Data
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-xl font-semibold">Manage Card</h2>
        <div className="border-solid border-2 p-4 rounded-xl">
          <div className="flex flex-col gap-2">
            <Tabs defaultValue="unpair" className="w-[400px]">
              <TabsList className="grid h-auto p-1 grid-cols-3 bg-gray-200 rounded-lg">
                <TabsTrigger className="text-md rounded-lg" value="unpair">
                  Unpair
                </TabsTrigger>
                <TabsTrigger className="text-md rounded-lg" value="reset">
                  Reset
                </TabsTrigger>
                <TabsTrigger className="text-md rounded-lg" value="install">
                  Install
                </TabsTrigger>
              </TabsList>
              <TabsContent value="unpair">
                <div className="flex flex-col gap-4">
                  <Label className="mt-2">Unpair card and clear app data</Label>
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
                  <Button className="w-fit" onClick={unpairAndClearData}>
                    Unpair
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="reset">
                <div className="flex flex-col gap-4">
                  <Label className="mt-2">Reset card and clear app data</Label>
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
              </TabsContent>
              <TabsContent value="install">
                <div className="flex flex-col gap-4">
                  <Label className="mt-2">Install applets on your card</Label>
                  <Button className="w-fit" onClick={installApplets}>
                    Install Applets
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {credentials && showCredentialsQRcode()}
    </div>
  );
};

export default Settings;
