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
import { useToast } from "@/components/ui/use-toast";
import { ETHEREUM_INFO, LEDGERS } from "@/constants";
import { cn } from "@/lib/utils";
import { accountAtom, ledgerAtom } from "@/store/state";
import { useAtomValue } from "jotai";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AddAsset,
  GetAddressAndAssets,
  GetChainConfig,
  Transfer,
} from "../../wailsjs/go/main/App";
import { utils } from "../../wailsjs/go/models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Wallet() {
  const [txId, setTxId] = useState("");
  const [asset, setAsset] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [chainConfig, setChainConfig] = useState<utils.ChainConfig>();
  const [userAssets, setUserAssets] = useState<string[]>([]);
  const [openSelectAssets, setOpenSelectAssets] = useState(false);
  const [selectAssetValue, setSelectAssetValue] = useState("");

  const ledger = useAtomValue(ledgerAtom);
  const account = useAtomValue(accountAtom);

  const { toast } = useToast();

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

  const updateTxId = (txId: string) => setTxId(txId);

  const updateToAddr = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddr(event.target.value);
  };

  const updateAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const transfer = () => {
    Transfer(asset, ledger, fromAddr, toAddr, amount)
      .then(updateTxId)
      .catch((err) =>
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        })
      );
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

            <div className="flex flex-col flex-wrap gap-4">
              {userAssets.map((userAsset) => {
                return (
                  <div
                    className="flex flex-row items-center justify-between
                              bg-secondary rounded-xl shadow-md pr-6 hover:bg-primary hover:text-white"
                    onClick={() => setAsset(userAsset)}
                  >
                    <div className="flex flex-row items-center gap-2">
                      <img className="w-16" src={ETHEREUM_INFO.img} />

                      <Label className="text-lg">{userAsset}</Label>
                    </div>

                    <Label className="text-lg">10.99</Label>
                  </div>
                );
              })}
            </div>

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
              <Button className="text-md" onClick={addAsset}>Add Asset</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="transactions">
          <Label className="text-lg">Transaction History</Label>

          <div className="flex flex-col gap-8 mt-7">
            <h2 className="fond-bold text-xl">
              Send
              <span className="text-3xl text-primary"> {asset} </span>
              from{" "}
              <span className="text-3xl text-primary">{ledgerName()} </span>
              blockchain
            </h2>

            <div className="">
              <label>To</label>
              <Input onChange={updateToAddr} />
              <label>Amount</label>
              <Input onChange={updateAmount} />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={transfer}>
                Send
              </Button>
              <Button variant="outline" onClick={receive}>
                Receive
              </Button>
            </div>

            <div>Address: {fromAddr}</div>
            <div>TransactionId: {txId}</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Wallet;
