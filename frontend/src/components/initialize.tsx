import { Initialize } from "@/../wailsjs/go/main/App";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  open: boolean;
  handleClose: (open: boolean) => void;
};

const InitializeDialog = ({ open, handleClose }: Props) => {
  const [connectDialog, setConnectDialog] = useState(true);
  const [cardName, setCardName] = useState("");
  const [mnemonic, setMnemonic] = useState("");

  const { toast } = useToast();

  const initForm = useForm<z.infer<typeof InitCardSchema>>({
    resolver: zodResolver(InitCardSchema),
    defaultValues: {
      checksum: "4",
    },
  });

  const initCard = async (data: z.infer<typeof InitCardSchema>) => {
    try {
      const words = await Initialize(
        data.pin,
        data.name,
        parseInt(data.checksum)
      );
      setMnemonic(words);
      setCardName(data.name);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            The card is empty, do you want to initalize it?
          </DialogTitle>
          <DialogDescription>
            Write down the secret words and keep them safe, it's the only way to
            recover your funds if you lose your card and PIN.
          </DialogDescription>
          <DialogDescription>
            PIN is used to protect your card from unauthorized access.
          </DialogDescription>
        </DialogHeader>
        <Form {...initForm}>
          <form
            onSubmit={initForm.handleSubmit(initCard)}
            className="w-2/3 space-y-6"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
  );
};

export default InitializeDialog;
