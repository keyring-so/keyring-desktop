import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { CurrentAccount } from "../wailsjs/go/main/App";
import ConnectPage from "./pages/connect";
import WelcomePage from "./pages/welcome";
import { accountAtom } from "./store/state";
import useInitialization from "@/hooks/useInitialization";

function App() {
  const [account, setAccount] = useAtom(accountAtom);

  const { toast } = useToast();

  const initialized = useInitialization();

  useEffect(() => {
    CurrentAccount()
      .then((res) => setAccount(res))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      {account.id == -1 ? <ConnectPage /> : <WelcomePage />}
      <Toaster />
    </div>
  );
}

export default App;
