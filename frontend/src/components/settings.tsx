import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { showSettingsAtom } from "@/store/state";
import { useSetAtom } from "jotai";
import { GetNetwork, Install, SetNetwork } from "@/../wailsjs/go/main/App";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

const Settings = () => {
  const setShowSettings = useSetAtom(showSettingsAtom);

  const [isTestnet, setIsTestnet] = useState(false);

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

  return (
    <Dialog open={true} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Please only change the settings when needed.
          </DialogDescription>
        </DialogHeader>
        <div className="">
          <Button className="" onClick={resetCard}>
            Card Factory Rest
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
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
