import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LEDGERS } from "@/constants";
import { accountAtom, ledgerAtom } from "@/store/state";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { GetAddressAndAssets, Transfer } from "../../wailsjs/go/main/App";

function Wallet() {
  const [txId, setTxId] = useState("");
  const [asset, setAsset] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [userAssets, setUserAssets] = useState<string[]>([]);

  const ledger = useAtomValue(ledgerAtom);
  const account = useAtomValue(accountAtom);

  const { toast } = useToast();

  // get the address for a specific chain
  useEffect(() => {
    if (account && ledger) {
      GetAddressAndAssets(account, ledger)
        .then((res) => {
          setFromAddr(res.address);
          setUserAssets(res.assets);
          if (!res.address) {
            toast({
              title: "Uh oh! Something went wrong.",
              description: `Error happens: address is empty`,
            });
          }
        })
        .catch((err) => {
          toast({
            title: "Uh oh! Something went wrong.",
            description: `Error happens: ${err}`,
          });
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

  const receive = () => {
    // TODO verify the address by connecting the card
    // TODO encrypt the address so no one can change the integrity
    console.log("receive");
  };

  const ledgerName = () => {
    let ledgerInfo = LEDGERS.get(ledger);
    let name = ledgerInfo ? ledgerInfo.name : "";
    return name;
  };

  return (
    <div className="flex flex-row mt-6 gap-20">
      <div className="mt-6">
        <h2 className="text-3xl">Assets</h2>

        <div className="mt-10 grid grid-cols-1 gap-4">
          {userAssets.map((userAsset) => {
            return (
              <Button onClick={() => setAsset(userAsset)}>{userAsset}</Button>
            );
          })}
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

        <div>Address: {fromAddr}</div>
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
