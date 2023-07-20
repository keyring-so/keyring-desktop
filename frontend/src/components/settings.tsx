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
import { Install } from "@/../wailsjs/go/main/App";

const Settings = () => {
  const setShowSettings = useSetAtom(showSettingsAtom);

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
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
