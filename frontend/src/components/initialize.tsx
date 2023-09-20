import { CurrentAccount, Initialize } from "@/../wailsjs/go/main/App";
import { accountAtom } from "@/store/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useToast } from "./ui/use-toast";

const InitCardSchema = z.object({
  name: z.string().min(2).max(20),
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
  checksum: z.enum(["4", "6", "8"], {
    required_error: "You need to choose the count of words.",
  }),
});

type Props = {
  handleClose: (open: boolean) => void;
};

const InitializeDialog = ({ handleClose }: Props) => {
  const [mnemonic, setMnemonic] = useState("");

  const setAccount = useSetAtom(accountAtom);

  const { toast } = useToast();

  const initForm = useForm<z.infer<typeof InitCardSchema>>({
    resolver: zodResolver(InitCardSchema),
    defaultValues: {
      checksum: "4",
    },
  });

  const getCurrentAccount = async () => {
    try {
      const res = await CurrentAccount();
      setAccount(res);
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  }

  const initCard = async (data: z.infer<typeof InitCardSchema>) => {
    try {
      const res = await Initialize(
        data.pin,
        data.name,
        parseInt(data.checksum)
      );
      setMnemonic(res.mnemonic);
      toast({
        title: "Success!",
        description: "Card is initialized.",
      });
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    }
  };

  const mnemonicDialog = () => {
    return (
      <AlertDialog
        open={true}
        onOpenChange={() => {
          setMnemonic("");
          handleClose(false);
          getCurrentAccount();
        }}
      >
        <AlertDialogContent className="sm:max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Keep your secret words safe!</AlertDialogTitle>
            <AlertDialogDescription>
              Write down the secret words and keep them safe, it's the only way
              to recover your funds if you lose your card and PIN.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-4 items-center gap-4">
            {mnemonic.split(" ").map((word, index) => {
              return (
                <div>
                  <span>{index + 1}. </span>
                  <span className="underline font-medium">{word}</span>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>I've written it down!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <div>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              The card is empty, do you want to initalize it?
            </DialogTitle>
            <DialogDescription>
              Write down the secret words and keep them safe, it's the only way
              to recover your funds if you lose your card and PIN.
            </DialogDescription>
            <DialogDescription>
              PIN is used to protect your card from unauthorized access.
            </DialogDescription>
          </DialogHeader>
          <Form {...initForm}>
            <form
              onSubmit={initForm.handleSubmit(initCard)}
              className="space-y-6"
            >
              <FormField
                control={initForm.control}
                name="checksum"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose the count of secret words</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="4" />
                          </FormControl>
                          <FormLabel className="font-normal">12</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="6" />
                          </FormControl>
                          <FormLabel className="font-normal">18</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="8" />
                          </FormControl>
                          <FormLabel className="font-normal">24</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={initForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Input your PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="col-span-3 w-2/3"
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={initForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Name the card</FormLabel>
                    <FormControl>
                      <Input
                        className="col-span-3 w-2/3"
                        onChange={field.onChange}
                        autoCorrect="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {mnemonic && mnemonicDialog()}
    </div>
  );
};

export default InitializeDialog;
