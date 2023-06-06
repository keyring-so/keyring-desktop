import { useState } from "react";
import { Transfer } from "../wailsjs/go/main/App";

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

  return (
    <div>
      <h1 className="text-3xl fond-bold underline">Keyring Wallet</h1>

      <button className="btn" onClick={transfer}>
        Transfer
      </button>

      <div>{txId}</div>

      
    </div>
  );
}

export default App;
