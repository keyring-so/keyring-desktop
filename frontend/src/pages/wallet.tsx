import { main, utils } from "@/../wailsjs/go/models";
import Asset from "@/components/asset";
import { LogoImageSrc } from "@/components/logo";
import {
  Accordion
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
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
  RotateCw
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import {
  AddAsset,
  GetAddressAndAssets,
  GetAssetPrices,
  GetChainConfig,
  VerifyAddress
} from "../../wailsjs/go/main/App";

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
  const [nativeSymbol, setNativeSymbol] = useState("");
  const [nativeBalance, setNativeBalance] = useState("");
  const [chainAssets, setChainAssets] = useState<main.ChainAssets>();

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
          setChainAssets(assets);
          if (!assets.address) {
            toast({
              description: `You are ready to add a new blockchain`,
            });
          }

          let prices = await GetAssetPrices(account.id, ledger);
          setUserAssets(prices.assets);
          setChainAssets(prices);
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.location.reload();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
      let res = await AddAsset(account.id, ledger, fromAddr, selectToken!.symbol);
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
              <div className="flex flex-row items-center gap-3">
                <Label className="text-lg">Total</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <RotateCw
                        className="h-5"
                        onClick={() => window.location.reload()}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to refresh</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
              {chainAssets && <Asset symbol={chainAssets?.symbol} balance={chainAssets.balance} />}
              {chainAssets?.assets.map((userAsset) => {
                return (
                  <Asset symbol={userAsset.symbol} balance={userAsset.balance} />
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
                                className="w-6 mr-2 rounded-full"
                                src={`/tokens/${token.symbol}_logo.png`}
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
