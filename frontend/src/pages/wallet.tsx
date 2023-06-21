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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LEDGERS } from "@/constants";
import { accountAtom, ledgerAtom } from "@/store/state";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GenerateAddress, GetAddress, GetChains, Transfer } from "../../wailsjs/go/main/App";

function Wallet() {
  const [txId, setTxId] = useState("");
  const [asset, setAsset] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
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

  // get the address for a specific chain
  useEffect(() => {
    if (account && ledger) {
      GetAddress(account, ledger)
        .then((address) => {
          console.log("GetAddress response: ", address, ledger);
          setFromAddr(address);
          if (!address) {
            // show dialog to generate a new address
            setShowAddressDialog(true);
          }
        })
        .catch((err) => {
          console.log("GetAddress error happens: ", err);
          toast({
            title: "Uh oh! Something went wrong.",
            description: `Error happens: ${err}`,
          })
        });
    }
  }, [account, ledger]);

  const updateTxId = (txId: string) => setTxId(txId);

  const updateToAddr = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddr(event.target.value);
  };

  const updateAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const transfer = () => {
    Transfer(asset, ledger, fromAddr, toAddr, amount)
      .then(updateTxId)
      .catch((err) => updateTxId(err));
  };

  const generateAddress = () => {
    console.log("generateAddress");
    GenerateAddress(account, ledger)
      .then(address => {
        console.log("GenerateAddress response: ", address);
        setFromAddr(address);
      })
      .catch(err => console.log("GenerateAddress error happens: ", err));
  }

  const receive = () => {
    console.log("receive");
  };

  const ledgerName = () => {
    let ledgerInfo = LEDGERS.get(ledger);
    let name = ledgerInfo ? ledgerInfo.name : "";
    return name;
  };

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
            <Button type="submit" onClick={generateAddress}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-row mt-6 ml-2 gap-20">
      {showAddressDialog && addressDialog()}
      <Sidebar chains={chains} lastSelectedChain={ledger} />

      <div className="mt-6">
        <h2 className="text-3xl">Assets</h2>

        <div className="mt-10 grid grid-cols-1 gap-4">
          <Button onClick={() => setAsset("ETH")}>Ethereum</Button>
          <Button onClick={() => setAsset("USDT")}>USDT</Button>
          <Button onClick={() => setAsset("USDC")}>USDC</Button>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-7 ml-12">
        <h2 className="fond-bold text-xl">
          Send
          <span className="text-3xl text-primary"> {asset} </span>
          from <span className="text-3xl text-primary">{ledgerName()} </span>
          blockchain
        </h2>

        <div className="">
          <label>To</label>
          <Input onChange={updateToAddr} />
          <label>Amount</label>
          <Input onChange={updateAmount} />
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={transfer}>
            Send
          </Button>
          <Button variant="outline" onClick={receive}>
            Receive
          </Button>
        </div>

        <div>TransactionId: {txId}</div>

        <div>
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>
            <TabsContent value="assets">Show assets here.</TabsContent>
            <TabsContent value="records">Show records here.</TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
