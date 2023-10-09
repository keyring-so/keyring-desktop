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
import { useAtomValue, useSetAtom } from "jotai";
import { Clipboard, ClipboardCheck, Loader2, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type Props = {
  symbol: string;
  balance?: string;
  address: string;
  onError?: boolean;
};

const Asset = ({ symbol, balance, address, onError }: Props) => {
  const [asset, setAsset] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
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

  const updateToAddr = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddr(event.target.value);
  };

  const updateAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const updateTip = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tipFee = Number(event.target.value) * GWEI;
    setTip(tipFee.toString());
  };

  const calculateFee = async (checked: boolean) => {
    if (checked) {
      try {
        setLoadingTx(true);
        let fee = await CalculateFee(asset, ledger, address, toAddr, amount);
        setLoadingTx(false);
        setFee(fee);
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      }
    } else {
      setFee(undefined);
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

  const transfer = () => {
    setLoadingTx(true);
    Transfer(asset, ledger, address, toAddr, amount, tip, pin, account.id)
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
        console.log(addr, address);
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

  const removeAsset = async (token: string) => {
    try {
      setLoadingRemoveAsset(true);
      await RemoveAsset(account.id, ledger, address, token);
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
            onClick={() => setAsset(symbol)}
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
                    Sending {asset} on {ledgerName()} blockchain
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-10">
                  <div>
                    <Label>To</Label>
                    <Input onChange={updateToAddr} />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input onChange={updateAmount} />
                  </div>

                  <div>
                    <Label>PIN</Label>
                    <Input
                      type="password"
                      value={pin}
                      onChange={(event) => setPin(event.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="advance-fee-mode"
                      onCheckedChange={calculateFee}
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
                    <Button className="w-1/2" onClick={transfer}>
                      Send
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={receive}>Receive</Button>
            {ledger !== symbol &&
              (loadingRemoveAsset ? (
                <Loader2 className="ml-2 animate-spin" />
              ) : (
                <Trash2 className="ml-2" onClick={() => removeAsset(symbol)} />
              ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {receiveOpen && showReceiveAddrQRcode()}
    </div>
  );
};

export default Asset;
