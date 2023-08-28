import { LogoImageSrc } from "@/components/logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { GWEI, LEDGERS } from "@/constants";
import { useClipboard } from "@/hooks/useClipboard";
import { cn, shortenAddress } from "@/lib/utils";
import { accountAtom, isTestnetAtom, ledgerAtom } from "@/store/state";
import { useAtomValue } from "jotai";
import {
  Check,
  ChevronsUpDown,
  Clipboard,
  ClipboardCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import {
  AddAsset,
  CalculateFee,
  GetAddressAndAssets,
  GetAssetPrices,
  GetChainConfig,
  RemoveAsset,
  Transfer,
  VerifyAddress,
} from "../../wailsjs/go/main/App";
import { main, utils } from "../../wailsjs/go/models";

type SelectToken = {
  value: string;
  symbol: string;
};

function Wallet() {
  const [asset, setAsset] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [chainConfig, setChainConfig] = useState<utils.ChainConfig>();
  const [userAssets, setUserAssets] = useState<main.AssetInfo[]>([]);
  const [openSelectAssets, setOpenSelectAssets] = useState(false);
  const [selectToken, setSelectToken] = useState<SelectToken | undefined>(
    undefined
  );
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingRemoveAsset, setLoadingRemoveAsset] = useState(false);
  const [loadingAddAsset, setLoadingAddAsset] = useState(false);
  const [fee, setFee] = useState<main.FeeInfo>();
  const [tip, setTip] = useState("");
  const [pin, setPin] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [getBalanceErr, setGetBalanceErr] = useState(false);

  const ledger = useAtomValue(ledgerAtom);
  const account = useAtomValue(accountAtom);
  const isTestnet = useAtomValue(isTestnetAtom);

  const { toast } = useToast();

  const { hasCopied, onCopy } = useClipboard();

  // get the address for a specific chain
  useEffect(() => {
    const fn = async () => {
      if (account.id && ledger) {
        try {
          let assets = await GetAddressAndAssets(account.id, ledger);
          setFromAddr(assets.address);
          setUserAssets(assets.assets);
          if (!assets.address) {
            toast({
              title: "Uh oh! Something went wrong.",
              description: `Error happens: address is empty`,
            });
          }

          let prices = await GetAssetPrices(account.id, ledger);
          setUserAssets(prices.assets);
        } catch (err) {
          setGetBalanceErr(true);
          toast({
            title: "Uh oh! Something went wrong.",
            description: `Error happens: ${err}`,
          });
        }
      }
    };

    fn();
  }, [account, ledger, isTestnet]);

  useEffect(() => {
    GetChainConfig(ledger)
      .then((res) => {
        setChainConfig(res);
      })
      .catch((err) => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      });
  }, [ledger]);

  useEffect(() => {
    if (hasCopied) {
      toast({ description: "Copied to clipboard!" });
    }
  }, [hasCopied]);

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
        let fee = await CalculateFee(asset, ledger, fromAddr, toAddr, amount);
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

  const transfer = () => {
    setLoadingTx(true);
    Transfer(asset, ledger, fromAddr, toAddr, amount, tip, pin, account.id)
      .then((resp) => {
        setLoadingTx(false);
        setTransferOpen(false);
        setPin("");
        toast({
          title: "Send transaction successfully.",
          description: `${resp}`,
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

  const receive = () => {
    setReceiveOpen(true);
  };

  const verifyAddr = async () => {
    try {
      let addr = await VerifyAddress(account.id, ledger, pin);
      if (addr === fromAddr) {
        toast({
          title: "Your receive address is verified.",
          description: `${addr}`,
        });
        setVerified(true);
        setPin("");
      } else {
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

  const addAsset = async () => {
    try {
      setLoadingAddAsset(true);
      let res = await AddAsset(account.id, ledger, selectToken!.symbol);
      setLoadingAddAsset(false);
      setFromAddr(res.address);
      setUserAssets(res.assets);
      setSelectToken(undefined);
    } catch (err) {
      setGetBalanceErr(true);
      setLoadingAddAsset(false);
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const removeAsset = async (token: string) => {
    try {
      setLoadingRemoveAsset(true);
      let res = await RemoveAsset(account.id, ledger, token);
      setLoadingRemoveAsset(false);
      setFromAddr(res.address);
      setUserAssets(res.assets);
    } catch (err) {
      setLoadingRemoveAsset(false);
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
                  <Input disabled value={fromAddr} />
                  <Button
                    className="rounded-full"
                    onClick={() => onCopy(fromAddr)}
                  >
                    {hasCopied ? <ClipboardCheck /> : <Clipboard />}
                  </Button>
                </div>
              </div>
              <QRCodeSVG
                value={fromAddr}
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

  const showBalance = (balance: string | undefined) => {
    if (balance) {
      return parseFloat(parseFloat(balance).toFixed(3));
    }
    if (getBalanceErr) {
      return "n/a";
    }
    return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  };

  return (
    <div className="flex flex-col mt-20 gap-20 flex-grow items-center">
      <Tabs defaultValue="assets" className="w-[400px]">
        <TabsList className="grid w-full h-auto p-1 grid-cols-2 bg-gray-200 rounded-lg">
          <TabsTrigger className="text-lg rounded-lg" value="assets">
            Assets
          </TabsTrigger>
          <TabsTrigger className="text-lg rounded-lg" value="transactions">
            Transactions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assets">
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex flex-row justify-between">
              <Label className="text-lg">Total</Label>
              <Label className="text-lg">
                $
                {parseFloat(
                  userAssets
                    .reduce(
                      (temp, asset) =>
                        temp +
                        parseFloat(asset.balance || "0") * (asset.price || 0),
                      0
                    )
                    .toFixed(2)
                )}
              </Label>
            </div>

            <Accordion type="single" collapsible>
              {userAssets.map((userAsset) => {
                return (
                  <AccordionItem value={userAsset.name}>
                    <AccordionTrigger>
                      <div
                        className={`flex flex-row items-center justify-between grow
                        bg-secondary rounded-xl shadow-md p-2 pr-6
                        hover:bg-primary hover:text-white`}
                        onClick={() => setAsset(userAsset.name)}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <img
                            className="h-12"
                            src={`build/assets/${userAsset.name}_logo.png`}
                          />

                          <Label className="text-lg">{userAsset.name}</Label>
                        </div>

                        <Label className="text-lg">
                          {showBalance(userAsset.balance)}
                        </Label>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex gap-2 items-center">
                        <Sheet
                          open={transferOpen}
                          onOpenChange={setTransferOpen}
                        >
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
                                  onChange={(event) =>
                                    setPin(event.target.value)
                                  }
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="advance-fee-mode"
                                  onCheckedChange={calculateFee}
                                />
                                <Label htmlFor="advance-fee-mode">
                                  Fee Options
                                </Label>
                              </div>
                              {fee ? (
                                <div>
                                  <div>
                                    <Label>Base Fee (GWEI)</Label>
                                    <Input
                                      disabled
                                      value={(Number(fee.base) / GWEI).toFixed(
                                        2
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <Label>Tip Fee (GWEI)</Label>
                                    <Input
                                      defaultValue={(
                                        Number(fee.tip) / GWEI
                                      ).toFixed(2)}
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
                        {ledger !== userAsset.name &&
                          (loadingRemoveAsset ? (
                            <Loader2 className="ml-2 animate-spin" />
                          ) : (
                            <Trash2
                              className="ml-2"
                              onClick={() => removeAsset(userAsset.name)}
                            />
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <div className="mt-6 flex flex-row justify-center gap-3">
              <Popover
                open={openSelectAssets}
                onOpenChange={setOpenSelectAssets}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSelectAssets}
                    className="w-[200px] justify-between text-md"
                  >
                    {selectToken ? selectToken.symbol : "Select a token..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search token..." />
                    <CommandEmpty>No token found.</CommandEmpty>
                    <CommandGroup className="overflow-auto max-h-56">
                      {chainConfig?.tokens?.map((token) => (
                        <CommandItem
                          key={token.symbol}
                          onSelect={(currentValue) => {
                            if (
                              selectToken &&
                              selectToken.value === currentValue
                            ) {
                              setSelectToken(undefined);
                            } else {
                              setSelectToken({
                                value: currentValue,
                                symbol: token.symbol,
                              });
                            }
                            setOpenSelectAssets(false);
                          }}
                        >
                          <div className="flex flex-row items-center gap-12">
                            <div className="flex flex-row items-center">
                              <img
                                className="w-6 mr-2"
                                src={`build/assets/${token.symbol}_logo.png`}
                              />
                              <Label>{token.symbol}</Label>
                            </div>
                            <Check
                                className={cn(
                                  "h-5 w-5",
                                  selectToken?.symbol === token.symbol
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {loadingAddAsset ? (
                <Button className="text-md" disabled>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <Button className="text-md" onClick={addAsset}>
                  Add Asset
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="transactions">
          <Label className="text-lg">Transaction History</Label>
        </TabsContent>
      </Tabs>

      <div className="absolute right-16 top-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => onCopy(fromAddr)} className="rounded-3xl">
                <Label className="mr-2">{shortenAddress(fromAddr)}</Label>
                {hasCopied ? <ClipboardCheck /> : <Clipboard />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to copy address</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {receiveOpen && showReceiveAddrQRcode()}
    </div>
  );
}

export default Wallet;
