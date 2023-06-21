import { useEffect, useState } from "react";
import { Connect } from "../wailsjs/go/main/App";
import Wallet from "./pages/wallet";
import { useAtom } from "jotai";
import { accountAtom } from "./store/state";
import { Toaster } from "@/components/ui/toaster";
import ConnectPage from "./pages/connect";

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
      {!account && <ConnectPage />}
      <Toaster />
    </div>
  );
}

export default App;
