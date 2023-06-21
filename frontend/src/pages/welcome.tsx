import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { accountAtom, ledgerAtom } from "@/store/state";
import { useAtom, useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { GenerateAddress, GetAddress, GetChains } from "../../wailsjs/go/main/App";

function WelcomePage() {
  const [chains, setChains] = useState<string[]>([]);
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  const [ledger, setLedger] = useAtom(ledgerAtom);
  const account = useAtomValue(accountAtom);

  const { toast } = useToast();

  // get chains of the account
  useEffect(() => {
    GetChains(account)
      .then((chains) => {
        console.log("GetChains response: ", JSON.stringify(chains));
        setLedger(chains.lastSelectedChain);
        setChains(chains.chains);
      })
      .catch((err) => {
        console.log("GetChains error happens: ", err)
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        })
      });
  }, []);

  const addressDialog = () => {
    return (
      <Dialog open={true} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Address for {ledger}</DialogTitle>
            <DialogDescription>
              You need to connect the card to generate the address. Click
              generate when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              PIN Code
            </Label>
            <Input id="name" value="123456" className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit" >Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-row">
      {showAddressDialog && addressDialog()}
      <Sidebar chains={chains} lastSelectedChain={ledger} />
      <div className="flex flex-col justify-center grow gap-8">
        <h1 className="text-5xl text-center">Welcome</h1>
        <h1 className="text-2xl text-center">Click the <Plus className="inline bg-gray-300 rounded-full m-2" /> button on left to start!</h1>
      </div>
    </div>
  );
}

export default WelcomePage;
