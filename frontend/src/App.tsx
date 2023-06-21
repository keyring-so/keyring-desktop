import { Toaster } from "@/components/ui/toaster";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { Connect } from "../wailsjs/go/main/App";
import ConnectPage from "./pages/connect";
import WelcomePage from "./pages/welcome";
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
      {!account && <ConnectPage />}
      {account && <WelcomePage />}
      <Toaster />
    </div>
  );
}

export default App;
