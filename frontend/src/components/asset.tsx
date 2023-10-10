import {
  CalculateFee,
  RemoveAsset,
  Transfer,
  VerifyAddress,
} from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import { LogoImageSrc } from "@/components/logo";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { GWEI, LEDGERS } from "@/constants";
import { useClipboard } from "@/hooks/useClipboard";
import { accountAtom, ledgerAtom, refreshAtom } from "@/store/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtomValue, useSetAtom } from "jotai";
import { Clipboard, ClipboardCheck, Loader2, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Props = {
  symbol: string;
  balance?: string;
  address: string;
  contract?: string;
  onError?: boolean;
};

const AssetTransferSchema = z.object({
  toAddr: z.string().trim().min(1),
  amount: z.string().trim().min(1),
  tip: z.string().trim().min(1),
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
});

const Asset = ({ symbol, balance, address, contract, onError }: Props) => {
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingRemoveAsset, setLoadingRemoveAsset] = useState(false);
  const [fee, setFee] = useState<main.FeeInfo>();
  const [tip, setTip] = useState("");
  const [pin, setPin] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [verified, setVerified] = useState(false);

  const ledger = useAtomValue(ledgerAtom);
  const account = useAtomValue(accountAtom);
  const setRefresh = useSetAtom(refreshAtom);

  const { toast } = useToast();

  const { hasCopied, onCopy } = useClipboard();

  useEffect(() => {
    if (hasCopied) {
      toast({ description: "Copied to clipboard!" });
    }
  }, [hasCopied]);

  const transferForm = useForm<z.infer<typeof AssetTransferSchema>>({
    resolver: zodResolver(AssetTransferSchema),
  });

  const updateTip = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tipFee = Number(event.target.value) * GWEI;
    setTip(tipFee.toString());
  };

  const queryFee = async (data: z.infer<typeof AssetTransferSchema>) => {
    try {
      setLoadingTx(true);
      let fee = await CalculateFee(
        symbol,
        contract ? contract : "",
        ledger,
        address,
        data.toAddr,
        data.amount
      );
      setLoadingTx(false);
      setFee(fee);
    } catch (err) {
      setLoadingTx(false);
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const ledgerName = () => {
    let ledgerInfo = LEDGERS.get(ledger);
    let name = ledgerInfo ? ledgerInfo.name : "";
    return name;
  };

  const showBalance = (balance: string | undefined) => {
    if (balance) {
      return parseFloat(parseFloat(balance).toFixed(3));
    }
    if (onError) {
      return "n/a";
    }
    return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  };

  const receive = () => {
    setReceiveOpen(true);
  };

  const transfer = (data: z.infer<typeof AssetTransferSchema>) => {
    setLoadingTx(true);
    Transfer(
      symbol,
      contract ? contract : "",
      ledger,
      address,
      data.toAddr,
      data.amount,
      tip,
      data.pin,
      account.id
    )
      .then((resp) => {
        setLoadingTx(false);
        setTransferOpen(false);
        setPin("");
        toast({
          title: "Send transaction successfully.",
          description: `${resp}`,
          action: <Button onClick={() => onCopy(resp)}>Copy</Button>,
        });
      })
      .catch((err) => {
        setLoadingTx(false);
        setPin("");
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      });
  };

  const verifyAddr = async () => {
    try {
      let addr = await VerifyAddress(account.id, ledger, pin);
      if (addr === address) {
        toast({
          title: "Your receive address is verified.",
          description: `${addr}`,
        });
        setVerified(true);
        setPin("");
      } else {
        setPin("");
        toast({
          variant: "destructive",
          title: "Your receive address is hacked.",
          description:
            "Please remove the malicious software, then reset the app and connect with your card again.",
        });
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const showReceiveAddrQRcode = () => {
    return (
      <Dialog
        open={true}
        onOpenChange={() => {
          setReceiveOpen(false);
          setVerified(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Address</DialogTitle>
            <DialogDescription>
              You can verify the address by connecting the card.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 items-start">
            <div className="flex flex-col gap-1">
              <Label>PIN:</Label>
              <Input
                type="password"
                onChange={(event) => setPin(event.target.value)}
                value={pin}
              />
            </div>
            <Button className="w-1/3" onClick={verifyAddr}>
              Verify Address
            </Button>
          </div>
          {verified && (
            <div className="flex flex-col gap-4 mt-6">
              <div>
                <Label>Address:</Label>
                <div className="flex flex-row gap-0">
                  <Input disabled value={address} />
                  <Button
                    className="rounded-full"
                    onClick={() => onCopy(address)}
                  >
                    {hasCopied ? <ClipboardCheck /> : <Clipboard />}
                  </Button>
                </div>
              </div>
              <QRCodeSVG
                value={address}
                size={128}
                imageSettings={{
                  src: LogoImageSrc,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const removeAsset = async () => {
    try {
      setLoadingRemoveAsset(true);
      await RemoveAsset(account.id, ledger, address, symbol, contract!);
      setLoadingRemoveAsset(false);
      setRefresh(true);
    } catch (err) {
      setLoadingRemoveAsset(false);
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  return (
    <div>
      <AccordionItem value={symbol}>
        <AccordionTrigger>
          <div
            className={`flex flex-row items-center justify-between grow
                        bg-secondary rounded-xl shadow-md p-2 pr-6
                        hover:bg-primary hover:text-white`}
          >
            <div className="flex flex-row items-center gap-2">
              <img
                className="h-12 rounded-full"
                src={`/tokens/${symbol}_logo.png`}
              />

              <Label className="text-lg">{symbol}</Label>
            </div>

            <Label className="text-lg">{showBalance(balance)}</Label>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex gap-2 items-center">
            <Sheet open={transferOpen} onOpenChange={setTransferOpen}>
              <SheetTrigger>
                <Button
                  onClick={() => {
                    setTransferOpen(true);
                    setFee(undefined);
                  }}
                >
                  Transfer
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    Sending {symbol} on {ledgerName()} blockchain
                  </SheetTitle>
                </SheetHeader>
                <Form {...transferForm}>
                  <form
                    className="space-y-6 mt-4"
                    onSubmit={transferForm.handleSubmit(transfer)}
                  >
                    <FormField
                      control={transferForm.control}
                      name="toAddr"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input onChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={transferForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input onChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={transferForm.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>PIN</FormLabel>
                          <FormControl>
                            <Input type="password" onChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="advance-fee-mode"
                        onCheckedChange={(checked) => {
                          if (checked) {
                            queryFee(transferForm.getValues());
                          } else {
                            setFee(undefined);
                          }
                        }}
                      />
                      <Label htmlFor="advance-fee-mode">Fee Options</Label>
                    </div>
                    {fee ? (
                      <div>
                        <div>
                          <Label>Base Fee (GWEI)</Label>
                          <Input
                            disabled
                            value={(Number(fee.base) / GWEI).toFixed(2)}
                          />
                        </div>
                        <div>
                          <Label>Tip Fee (GWEI)</Label>
                          <Input
                            defaultValue={(Number(fee.tip) / GWEI).toFixed(2)}
                            onChange={updateTip}
                          />
                        </div>
                      </div>
                    ) : null}

                    {loadingTx ? (
                      <Button className="w-1/2" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </Button>
                    ) : (
                      <Button
                        className="w-1/2"
                        onClick={() => transfer(transferForm.getValues())}
                      >
                        Send
                      </Button>
                    )}
                  </form>
                </Form>
                <div className="flex flex-col gap-6 mt-10"></div>
              </SheetContent>
            </Sheet>
            <Button onClick={receive}>Receive</Button>
            {contract &&
              (loadingRemoveAsset ? (
                <Loader2 className="ml-2 animate-spin" />
              ) : (
                <Trash2 className="ml-2" onClick={() => removeAsset()} />
              ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {receiveOpen && showReceiveAddrQRcode()}
    </div>
  );
};

export default Asset;
