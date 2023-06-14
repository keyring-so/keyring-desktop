import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Initialize, Pair } from "../../wailsjs/go/main/App";
import { useSetAtom } from "jotai";
import { accountAtom } from "@/store/state";

function ConnectComponent() {
  const [pairingCode, setPairingCode] = useState("");
  const [pin, setPin] = useState("");
  const [puk, setPuk] = useState("");
  const [accountName, setAccountName] = useState("");
  const [checkSumSize, setCheckSumSize] = useState(4); // TODO select box
  const [mnemonic, setMnemonic] = useState("");

  const setAccount = useSetAtom(accountAtom);

  const pair = () => {
    console.log("pairing");
    Pair(pin, puk, pairingCode, accountName)
      .then((res) => setAccount(res))
      .catch((err) => console.log(err));
  };

  const init = () => {
    console.log("init a new card");
    Initialize(pin, accountName, checkSumSize)
      .then((res) => setMnemonic(res))
      .catch((err) => console.log(err));
  };

  return (
    <div className="flex flex-col gap-4 m-28">
      <div>
        <label>Pairing Code:</label>
        <Input onChange={(e) => setPairingCode(e.target.value)} />
      </div>
      <div>
        <label>PIN:</label>
        <Input onChange={(e) => setPin(e.target.value)} />
      </div>

      <div>
        <label>PUK:</label>
        <Input onChange={(e) => setPuk(e.target.value)} />
      </div>
      <div>
        <label>Account Name:</label>
        <Input onChange={(e) => setAccountName(e.target.value)} />
      </div>

      <Button variant="outline" onClick={pair} className="w-28">
        Pair
      </Button>

      <Button variant="outline" onClick={init} className="w-28">
        Initialize
      </Button>
      <p onClick={() => setMnemonic("")}>{mnemonic}</p>
    </div>
  );
}

export default ConnectComponent;
