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
      .then((res) => setAllAccounts(res))
      .catch((err) =>
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        })
      );
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
  }

  const addNewCardDialog = () => {
    return cardInitialized ? (
      <PairDialog handleClose={setShowAddCardDialog} />
    ) : (
      <InitializeDialog handleClose={setShowAddCardDialog} />
    );
  };

  return (
    <div>
      <Dialog
        open={true}
        onOpenChange={() => {
          setSidebarItem("");
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Accounts</DialogTitle>
            <DialogDescription>
              Manage your account information for your cards.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-8 mt-6">

            <div className="flex flex-col gap-2">
              <Label className="font-bold text-primary">Set Current Card</Label>
              <Label className="mt-1">Card name: {account.name}</Label>
              <div className="flex flex-row gap-2">
                <Input
                  className="w-1/2"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="input a new name"
                  autoCorrect="off"
                />
                <Button className="" onClick={updateAccountName}>
                  Change Name
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-bold text-primary">Add Another Card</Label>
              <div className="flex flex-col gap-3">
                <Label>Make sure the new card is connected.</Label>
                <Button className="w-1/3" onClick={addCard}>
                  Add Card
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-bold text-primary">Switch Cards</Label>
              <div className="flex flex-row gap-2">
                <Select onValueChange={(v) => setSwitchToCard(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="select a card" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAccounts.map((account) => (
                      <SelectItem value={account.id.toString()}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSwitch}>Confirm</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {showAddCardDialog && addNewCardDialog()}
    </div>
  );
};

export default Accounts;
