import {
  CheckCardConnection,
  CheckCardInitialized,
  Initialize,
  Pair,
} from "@/../wailsjs/go/main/App";
import Settings from "@/components/settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { accountAtom, showSettingsAtom } from "@/store/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useSetAtom } from "jotai";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const InitCardSchema = z.object({
  name: z.string().min(2).max(20),
  pin: z.string().transform((val, ctx) => {
    if (val.length !== 6 || isNaN(Number(val))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PIN must have 6 digits",
      });

      return z.NEVER;
    }
    return val;
  }),
  checksum: z.enum(["4", "6", "8"], {
    required_error: "You need to choose the count of words.",
  }),
});

function ConnectPage() {
  const [cardInitialized, setCardInitialized] = useState<boolean>(false);
  const [connectDialog, setConnectDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [puk, setPuk] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [cardName, setCardName] = useState("");
  const [mnemonic, setMnemonic] = useState("");

  const setAccount = useSetAtom(accountAtom);
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);

  const { toast } = useToast();

  const initForm = useForm<z.infer<typeof InitCardSchema>>({
    resolver: zodResolver(InitCardSchema),
    defaultValues: {
      checksum: "4",
    },
  });

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

  const mnemonicDialog = () => {
    return (
      <AlertDialog
        open={true}
        onOpenChange={() => {
          setMnemonic("");
          setAccount(cardName);
        }}
      >
        <AlertDialogContent className="sm:max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Keep your secret words safe!</AlertDialogTitle>
            <AlertDialogDescription>
              Write down the secret words and keep them safe, it's the only way
              to recover your funds if you lose your card and PIN.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
          <AlertDialogFooter>
            <AlertDialogAction>I've written it down!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  const initCard = async (data: z.infer<typeof InitCardSchema>) => {
    try {
      const words = await Initialize(
        data.pin,
        data.name,
        parseInt(data.checksum)
      );
      setMnemonic(words);
      setCardName(data.name);
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
          <Form {...initForm}>
            <form
              onSubmit={initForm.handleSubmit(initCard)}
              className="w-2/3 space-y-6"
            >
              <FormField
                control={initForm.control}
                name="checksum"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose the count of secret words</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="4" />
                          </FormControl>
                          <FormLabel className="font-normal">12</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="6" />
                          </FormControl>
                          <FormLabel className="font-normal">18</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="8" />
                          </FormControl>
                          <FormLabel className="font-normal">24</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={initForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Input your PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="col-span-3"
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={initForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Name the card</FormLabel>
                    <FormControl>
                      <Input
                        className="col-span-3"
                        onChange={field.onChange}
                        autoCorrect="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
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
