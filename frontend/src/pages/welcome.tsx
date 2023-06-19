import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCardConnection } from "@/../wailsjs/go/main/App";
import { useToast } from "@/components/ui/use-toast";

function WelcomePage() {
  const [cardConnected, setCardConnected] = useState(false);

  const { toast } = useToast();

  const connect = async () => {
    try {
      const res = await CheckCardConnection();
      console.log(res)
      if (!res) {
        toast({
          description:
            "Card is not detected, make sure it's connected via card reader and try again.",
        });
      }
      setCardConnected(res);
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  return (
    <div className="flex flex-row justify-evenly h-screen">
      <div className="flex flex-col justify-center items-center w-1/2">
        <h1 className="text-3xl">Keyring Wallet</h1>
        <h2 className="mt-4 text-6xl">Welcome!</h2>
      </div>
      <div className="flex flex-col bg-gray-300 justify-center items-center w-1/2">
        <Button className="text-2xl w-auto h-auto" onClick={connect}>
          Connect your Keyring Card
        </Button>
      </div>
    </div>
  );
}

export default WelcomePage;
