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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LEDGERS, TOKENS } from "@/constants";
import { cn, shortenAddress } from "@/lib/utils";
import { accountAtom, ledgerAtom } from "@/store/state";
import { useAtomValue } from "jotai";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Clipboard,
  ClipboardCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AddAsset,
  CalculateFee,
  GetAddressAndAssets,
  GetChainConfig,
  Transfer,
} from "../../wailsjs/go/main/App";
import { main, utils } from "../../wailsjs/go/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/useClipboard";
import { Switch } from "@/components/ui/switch";

function Wallet() {
  const [asset, setAsset] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [chainConfig, setChainConfig] = useState<utils.ChainConfig>();
  const [userAssets, setUserAssets] = useState<string[]>([]);
  const [openSelectAssets, setOpenSelectAssets] = useState(false);
  const [selectAssetValue, setSelectAssetValue] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);
  const [fee, setFee] = useState<main.FeeInfo>();
  const [tip, setTip] = useState("");
  const [pin, setPin] = useState("");

  const ledger = useAtomValue(ledgerAtom);
  const account = useAtomValue(accountAtom);

  const { toast } = useToast();

  const { hasCopied, onCopy } = useClipboard();

  // get the address for a specific chain
  useEffect(() => {
    if (account && ledger) {
      GetAddressAndAssets(account, ledger)
        .then((res) => {
          setFromAddr(res.address);
          setUserAssets(res.assets);
          if (!res.address) {
            toast({
              title: "Uh oh! Something went wrong.",
              description: `Error happens: address is empty`,
            });
          }
        })
        .catch((err) => {
          toast({
            title: "Uh oh! Something went wrong.",
            description: `Error happens: ${err}`,
          });
        });
    }
  }, [account, ledger]);

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
    setTip(event.target.value);
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
    Transfer(asset, ledger, fromAddr, toAddr, amount, tip, pin)
      .then((resp) => {
        setLoadingTx(false);
        toast({
          title: "Send transaction successfully.",
          description: `${resp}`,
        });
      })
      .catch((err) => {
        setLoadingTx(false);
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      });
  };

  const receive = () => {
    // TODO verify the address by connecting the card
    // TODO encrypt the address so no one can change the integrity
    console.log("receive");
  };

  const addAsset = async () => {
    try {
      let res = await AddAsset(account, ledger, selectAssetValue);
      setFromAddr(res.address);
      setUserAssets(res.assets);
      setSelectAssetValue("");
    } catch (err) {
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
              <Label className="text-lg">$1099.99</Label>
            </div>

            <Accordion type="single" collapsible>
              {userAssets.map((userAsset) => {
                return (
                  <AccordionItem value={userAsset}>
                    <AccordionTrigger>
                      <div
                        className={`flex flex-row items-center justify-between grow
                        bg-secondary rounded-xl shadow-md p-2 pr-6
                        hover:bg-primary hover:text-white`}
                        onClick={() => setAsset(userAsset)}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <img
                            className="h-12"
                            src={TOKENS.get(userAsset)?.img || ""}
                          />

                          <Label className="text-lg">{userAsset}</Label>
                        </div>

                        <Label className="text-lg">10.99</Label>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex gap-2">
                        <Sheet>
                          <SheetTrigger>
                            <Button>Transfer</Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>
                                Sending {asset} on {ledgerName()} blockchain
                              </SheetTitle>
                              <SheetDescription></SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-col gap-6 mt-10">
                              <div>
                                <label>To</label>
                                <Input onChange={updateToAddr} />
                              </div>
                              <div>
                                <label>Amount</label>
                                <Input onChange={updateAmount} />
                              </div>

                              <div>
                                <label>PIN</label>
                                <Input onChange={(event) => setPin(event.target.value)} />
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
                                    <label>Base Fee (in WEI)</label>
                                    <Input disabled value={fee.base} />
                                  </div>
                                  <div>
                                    <label>Tip Fee (in WEI)</label>
                                    <Input defaultValue={fee.tip} onChange={updateTip} />
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
                    {selectAssetValue
                      ? chainConfig?.tokens.find(
                          (token) => token.symbol === selectAssetValue
                        )?.symbol
                      : "Select a token..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search token..." />
                    <CommandEmpty>No token found.</CommandEmpty>
                    <CommandGroup>
                      {chainConfig?.tokens?.map((token) => (
                        <CommandItem
                          key={token.symbol}
                          onSelect={(currentValue) => {
                            let curr = currentValue.toUpperCase();
                            setSelectAssetValue(
                              curr === selectAssetValue ? "" : curr
                            );
                            setOpenSelectAssets(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectAssetValue === token.symbol
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {token.symbol}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button className="text-md" onClick={addAsset}>
                Add Asset
              </Button>
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
    </div>
  );
}

export default Wallet;
