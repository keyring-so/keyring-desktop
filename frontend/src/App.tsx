import { useEffect, useState } from "react";
import { Connect } from "../wailsjs/go/main/App";
import Wallet from "./pages/wallet";
import ConnectComponent from "./pages/connect";
import { useAtom } from "jotai";
import { accountAtom } from "./store/state";

function App() {
  const [account, setAccount] = useAtom(accountAtom);

  useEffect(() => {
    Connect()
      .then((res) => setAccount(res))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      {account && <Wallet />}
      {!account && <ConnectComponent />}
    </div>
  );
}

export default App;
