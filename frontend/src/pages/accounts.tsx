import {
  CheckCardConnection,
  CheckCardInitialized,
  GetAllAccounts,
  SwitchAccount,
  UpdateAccountName,
} from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import InitializeDialog from "@/components/initialize";
import PairDialog from "@/components/pair";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { accountAtom, showSidebarItem } from "@/store/state";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

const Accounts = () => {
  const [name, setName] = useState("");
  const [cardInitialized, setCardInitialized] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [allAccounts, setAllAccounts] = useState<main.CardInfo[]>([]);
  const [switchToCard, setSwitchToCard] = useState("");

  const setSidebarItem = useSetAtom(showSidebarItem);
  const [account, setAccount] = useAtom(accountAtom);

  const { toast } = useToast();

  useEffect(() => {
    GetAllAccounts()
      .then((res) => {
        setAllAccounts(res);
      })
      .catch((err) => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      });
  }, [showAddCardDialog]);

  const updateAccountName = async () => {
    try {
      if (name !== "") {
        await UpdateAccountName(account.id, name);
        setAccount({ ...account, name });
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const addCard = async () => {
    try {
      const res = await CheckCardConnection();
      if (res) {
        const res = await CheckCardInitialized();
        setCardInitialized(res);
        setShowAddCardDialog(true);
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

  const handleSwitch = async () => {
    try {
      if (switchToCard !== "" && switchToCard !== account.id.toString()) {
        const res = await SwitchAccount(parseInt(switchToCard));
        setAccount(res);
        setSidebarItem("");
      } else {
        toast({
          description: "Please select a different card.",
        });
      }
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const addNewCardDialog = () => {
    return cardInitialized ? (
      <PairDialog handleClose={setShowAddCardDialog} />
    ) : (
      <InitializeDialog handleClose={setShowAddCardDialog} />
    );
  };

  return (
    <div className="flex flex-col mt-6 ml-20 mr-20 gap-8 items-start flex-grow">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Cards & Accounts</h1>
        <p className="text-lg">
          Manage your account information for your cards.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-xl font-semibold">Your Cards</h2>
        <div className="flex flex-col gap-6 border-solid border-2 p-6 rounded-xl">
          <div className="flex flex-col gap-3">
            <Label className="font-semibold">
              Current card name:{" "}
              <span className="font-bold text-primary">{account.name}</span>
            </Label>
            <div className="flex flex-row gap-2 items-center justify-between">
              <Input
                className="w-fit"
                onChange={(e) => setName(e.target.value)}
                placeholder="input a new name"
                autoCorrect="off"
              />
              <Button className="w-[130px]" onClick={updateAccountName}>
                Change Name
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label className="font-semibold">Choose another card</Label>
            <div className="flex flex-row gap-2 items-center justify-between">
              <Select onValueChange={(v) => setSwitchToCard(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="select a card" />
                </SelectTrigger>
                <SelectContent>
                  {allAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-[130px]" onClick={handleSwitch}>
                Confirm
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-semibold">Add a new card</Label>
            <div className="flex flex-row gap-2 items-center justify-between">
              <Label>Make sure the new card is connected.</Label>
              <Button className="w-[130px]" onClick={addCard}>
                Add Card
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showAddCardDialog && addNewCardDialog()}
    </div>
  );
};

export default Accounts;
