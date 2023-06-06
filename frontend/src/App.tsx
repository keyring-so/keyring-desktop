import { useState } from "react";
import { Transfer } from "../wailsjs/go/main/App";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "./components/ui/input";

function App() {
  const [txId, setTxId] = useState("");
  const updateTxId = (txId: string) => setTxId(txId);

  function transfer() {
    Transfer(
      "",
      "ETH",
      "0xaac042fc227cf5d12f7f532bd27361d5634c06a7",
      "0x7fd0030d3d21d17fb4056de319fad67a853b3c20",
      "0.005"
    )
      .then(updateTxId)
      .catch((err) => updateTxId(err));
  }

  function receive() {
    console.log("receive");
  }

  return (
    <div className="m-10">
      <h1 className="text-3xl fond-bold">Keyring Wallet</h1>
      <label>To</label>
      <Input />
      <label>Amount</label>
      <Input />

      <Button variant="outline" onClick={transfer}>
        Transfer
      </Button>

      <Button variant="outline" onClick={receive}>
        Receive
      </Button>

      <div>{txId}</div>

      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">
          Show assets here.
        </TabsContent>
        <TabsContent value="records">Show records here.</TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
