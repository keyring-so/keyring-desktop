import { useState } from "react";
import { Transfer } from "../wailsjs/go/main/App";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";
import { useAtomValue } from "jotai";
import { ledgerAtom } from "./store/state";

function App() {
  const [txId, setTxId] = useState("");
  const [asset, setAsset] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");

  const ledger = useAtomValue(ledgerAtom);

  const updateTxId = (txId: string) => setTxId(txId);

  const updateToAddr = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddr(event.target.value);
  };

  const updateAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const transfer = () => {
    Transfer(
      asset,
      ledger.symbol,
      "0xaac042fc227cf5d12f7f532bd27361d5634c06a7", // TODO: get from keyring when init
      toAddr,
      amount
    )
      .then(updateTxId)
      .catch((err) => updateTxId(err));
  };

  const receive = () => {
    console.log("receive");
  };

  return (
    <div className="flex flex-row mt-6 ml-2 gap-20">
      <Sidebar />

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
          from <span className="text-3xl text-primary">{ledger.name} </span>
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

export default App;
