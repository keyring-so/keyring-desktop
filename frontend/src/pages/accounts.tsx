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
import { toast } from "@/components/ui/use-toast";
import { accountAtom, showSidebarItem } from "@/store/state";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";

const Accounts = () => {
  const [name, setName] = useState("");

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
              Change the information of your account.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-8 mt-6">
            <div className="flex flex-col gap-2">
              <Label>Account Name: {account.name}</Label>
              <Input
                className="w-2/3"
                onChange={(e) => setName(e.target.value)}
                autoCorrect="off"
              />
              <Button className="w-1/3" onClick={updateAccountName}>
                Change Name
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
