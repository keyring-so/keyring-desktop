import { useState } from "react";
import { Transfer } from "../wailsjs/go/main/App";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";

function App() {
  const [txId, setTxId] = useState("");
  const [ledger, setLedger] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");

  const updateTxId = (txId: string) => setTxId(txId);

  const updateToAddr = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddr(event.target.value);
  };

  const updateAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const transfer = () => {
    Transfer(
      "",
      ledger,
      "0xaac042fc227cf5d12f7f532bd27361d5634c06a7",
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
    <div className="m-10 flex gap-10">
      <Sidebar />
      <h1 className="text-3xl fond-bold text-center">Keyring Wallet</h1>

      <div className="flex flex-row gap-10">
        {/* sidebar of different coins */}
        <div>
          <h2 className="text-2xl">Ledgers</h2>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <Button onClick={() => setLedger("BTC")}>Bitcoin</Button>
            <Button onClick={() => setLedger("ETH")}>Ethereum</Button>
            <Button onClick={() => setLedger("MATIC")}>Polygon</Button>
          </div>
        </div>

        {/* Assets list, send and receive functions */}
        <div>
          <h2>{ledger}</h2>
          <label>To</label>
          <Input onChange={updateToAddr} />
          <label>Amount</label>
          <Input onChange={updateAmount} />

          <Button variant="outline" onClick={transfer}>
            Send
          </Button>
          <Button variant="outline" onClick={receive}>
            Receive
          </Button>

          <div>{txId}</div>

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
    </div>
  );
}

export default App;
