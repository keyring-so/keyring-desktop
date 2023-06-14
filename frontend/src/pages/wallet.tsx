import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";
import { useAtom, useAtomValue } from "jotai";
import { ledgerAtom, accountAtom } from "@/store/state";
import { Transfer, GetAddress } from "../../wailsjs/go/main/App";
import { LEDGERS } from "@/constants";

function Wallet() {
  const [txId, setTxId] = useState("");
  const [asset, setAsset] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");

  const [ledger, setLedger] = useAtom(ledgerAtom);
  const account = useAtomValue(accountAtom);

  // TODO sidebar select other network should update database about the address of new selected network
  useEffect(() => {
    console.log("the selected network....");
    GetAddress(account)
        .then((res) => {
            console.log("select response: ", res);
            setLedger(res.chain);
            setFromAddr(res.address);
        })
        .catch((err) => console.log("error happens: ", err)); // TODO Alert box and remind user to connect card and retry
  }, [])

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
      ledger,
      fromAddr,
      toAddr,
      amount
    )
      .then(updateTxId)
      .catch((err) => updateTxId(err));
  };

  const receive = () => {
    console.log("receive");
  };

  const ledgerName = () => {
    let ledgerInfo = LEDGERS.get(ledger);
    let name = ledgerInfo ? ledgerInfo.name : "";
    return name;
  }

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
