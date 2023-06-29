import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  accountAtom,
  chainConfigsAtom,
  ledgerAtom,
  showNewLedgerAtom,
} from "@/store/state";
import { useAtom, useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AddLedger, GetChains } from "../../wailsjs/go/main/App";
import Wallet from "./wallet";

function WelcomePage() {
  const [chains, setChains] = useState<string[]>([]);
  const [ledgerCandidate, setLedgerCandidate] = useState("");

  const [showNewLedger, setShowNewLedger] = useAtom(showNewLedgerAtom);
  const [ledger, setLedger] = useAtom(ledgerAtom);
  const account = useAtomValue(accountAtom);
  const chainConfigs = useAtomValue(chainConfigsAtom);

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
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      });
  }, []);

  const addLedger = async () => {
    try {
      let _ = await AddLedger(account, ledgerCandidate);
      let chains = await GetChains(account);
      setChains(chains.chains);
      setLedger(chains.lastSelectedChain);
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
    setShowNewLedger(false);
  };

  const newLedgerDialog = () => {
    return (
      <Dialog open={true} onOpenChange={setShowNewLedger}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add a new Blockchain</DialogTitle>
            <DialogDescription>
              Choose one from the below list.
            </DialogDescription>
          </DialogHeader>
          <div className="ml-20">
            <Select onValueChange={setLedgerCandidate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {chainConfigs.map((chainConfig) => {
                    return (
                      <SelectItem value={chainConfig.symbol}>
                        {chainConfig.name}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={addLedger}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-row gap-20">
      {showNewLedger && newLedgerDialog()}
      <Sidebar chains={chains} lastSelectedChain={ledger} />
      {chains.length === 0 ? <Guide /> : <Wallet />}
    </div>
  );
}

const Guide = () => {
  return (
    <div className="flex flex-col justify-center grow gap-8">
      <h1 className="text-5xl text-center">Welcome</h1>
      <h1 className="text-2xl text-center">
        Click the <Plus className="inline bg-gray-300 rounded-full m-2" />{" "}
        button on left to start!
      </h1>
    </div>
  );
};

export default WelcomePage;
