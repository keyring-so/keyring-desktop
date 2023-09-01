import { UpdateAccountName } from "@/../wailsjs/go/main/App";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { accountAtom, showSidebarItem } from "@/store/state";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";

const InitializedFlagY = "initialized-yes";
const InitializedFlagN = "initialized-no";

const Accounts = () => {
  const [name, setName] = useState("");
  const [initialized, setInitialized] = useState(InitializedFlagY);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);

  const setSidebarItem = useSetAtom(showSidebarItem);
  const [account, setAccount] = useAtom(accountAtom);

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

  const handleAddCard = () => {
    return (
      <div>
        <Dialog open={true} onOpenChange={() => setShowAddCardDialog(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add new card</DialogTitle>
              <DialogDescription>test</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
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
              <Label className="text-2xl">Set Current Card</Label>
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
              <Label className="text-2xl">Add Another Card</Label>

              <div className="mt-1">
                <Label>Has the card been initialized?</Label>
                <RadioGroup
                  className="mt-2"
                  defaultValue={initialized}
                  onValueChange={(v) => setInitialized(v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={InitializedFlagY}
                      id={InitializedFlagY}
                    />
                    <Label htmlFor={InitializedFlagY}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={InitializedFlagN}
                      id={InitializedFlagN}
                    />
                    <Label htmlFor={InitializedFlagN}>No</Label>
                  </div>
                </RadioGroup>
                <Button
                  className="mt-3"
                  onClick={() => setShowAddCardDialog(true)}
                >
                  Add Card
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {showAddCardDialog && handleAddCard()}
    </div>
  );
};

export default Accounts;
