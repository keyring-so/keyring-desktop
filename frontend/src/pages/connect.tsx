import {
  CheckCardConnection,
  CheckCardInitialized,
  Initialize,
  Pair,
} from "@/../wailsjs/go/main/App";
import Settings from "@/components/settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { accountAtom, showSettingsAtom } from "@/store/state";
import { useAtom, useSetAtom } from "jotai";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

function ConnectPage() {
  const [cardInitialized, setCardInitialized] = useState<boolean>(false);
  const [connectDialog, setConnectDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [puk, setPuk] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [cardName, setCardName] = useState("");
  const [checkSumSize, setCheckSumSize] = useState(4); // TODO advanced setting allow change secretw words count -> select box
  const [mnemonic, setMnemonic] = useState("");

  const setAccount = useSetAtom(accountAtom);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);

  const { toast } = useToast();

  const connect = async () => {
    try {
      const res = await CheckCardConnection();
      if (res) {
        const res = await CheckCardInitialized();
        setCardInitialized(res);
        setConnectDialog(true);
      } else {
        toast({
          description:
            "Card is not detected, make sure it's connected via card reader and try again.",
        });
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const pair = async () => {
    try {
      const res = await Pair(pin, puk, pairingCode, cardName);
      setAccount(res);
      toast({
        title: "Success!",
        description: "Card is paired.",
      });
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const init = async () => {
    try {
      const words = await Initialize(pin, cardName, checkSumSize);
      setMnemonic(words);
      toast({
        title: "Success!",
        description: "Card is initialized.",
      });
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const mnemonicDialog = () => {
    return (
      <Dialog open={true} onOpenChange={() => setMnemonic("")}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Keep your secret words safe!</DialogTitle>
            <DialogDescription>
              Write down the secret words and keep them safe, it's the only way
              to recover your funds if you lose your card and PIN.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4">
            {mnemonic.split(" ").map((word, index) => {
              return (
                <div>
                  <span>{index + 1}. </span>
                  <span className="underline font-medium">{word}</span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const pairDialog = () => {
    return (
      <Dialog open={true} onOpenChange={setConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Great! Your card is alread initialized.</DialogTitle>
            <DialogDescription>
              You need to input the PIN to connect to the card.
            </DialogDescription>
            <DialogDescription>
              Remove the card if you want to connect another one.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin" className="text-right">
              PIN
            </Label>
            <Input
              id="pin"
              type="password"
              className="col-span-3"
              onChange={(e) => setPin(e.target.value)}
            />

            <Label htmlFor="puk" className="text-right">
              PUK
            </Label>
            <Input
              id="puk"
              className="col-span-3"
              onChange={(e) => setPuk(e.target.value)}
            />

            <Label htmlFor="code" className="text-right">
              Pairing Code
            </Label>
            <Input
              id="code"
              className="col-span-3"
              onChange={(e) => setPairingCode(e.target.value)}
            />

            <Label htmlFor="name" className="text-right">
              Card Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={pair}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const initializeDialog = () => {
    return (
      <Dialog open={true} onOpenChange={setConnectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              The card is empty, do you want to initalize it?
            </DialogTitle>
            <DialogDescription>
              Write down the secret words and keep them safe, it's the only way
              to recover your funds if you lose your card and PIN.
            </DialogDescription>
            <DialogDescription>
              PIN is used to protect your card from unauthorized access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin" className="text-right">
              PIN
            </Label>
            <Input
              id="pin"
              type="password"
              className="col-span-3"
              onChange={(e) => setPin(e.target.value)}
            />

            <Label htmlFor="name" className="text-right">
              Card Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={init}>
              Initalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-row justify-evenly h-screen">
      {connectDialog && cardInitialized === false && initializeDialog()}
      {connectDialog && cardInitialized === true && pairDialog()}
      {mnemonic && mnemonicDialog()}
      <div className="flex flex-col justify-center items-center w-1/2">
        <h1 className="text-3xl">Keyring Wallet</h1>
        <h2 className="mt-4 text-6xl">Welcome!</h2>
      </div>
      <div className="flex flex-col bg-gray-300 justify-center items-center w-1/2">
        <Button className="text-2xl w-auto h-auto" onClick={connect}>
          Connect your Keyring Card
        </Button>
      </div>

      <div className="fixed right-6 bottom-6">
        <SettingsIcon onClick={() => setShowSettings(true)} />
      </div>
      {showSettings && <Settings />}
    </div>
  );
}

export default ConnectPage;
