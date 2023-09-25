import {
  CurrentAccount,
  Initialize,
  LoadSecrePhrase,
} from "@/../wailsjs/go/main/App";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
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

const LoadSecretWordsSchema = z.object({
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
  words: z.string().transform((val, ctx) => {
    const formatted = val.trim().replace(/\s+/g, " ");
    const length = formatted.split(" ").length;
    if (length < 12 || length > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The secret phrase should consist of 12 to 24 words.",
      });

      return z.NEVER;
    }
    return formatted;
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

  const loadForm = useForm<z.infer<typeof LoadSecretWordsSchema>>({
    resolver: zodResolver(LoadSecretWordsSchema),
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
  };

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

  const loadWords = async (data: z.infer<typeof LoadSecretWordsSchema>) => {
    try {
      const res = await LoadSecrePhrase(data.pin, data.name, data.words);
      setAccount(res.cardInfo);
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
            <AlertDialogTitle>Keep your secret phrase safe!</AlertDialogTitle>
            <AlertDialogDescription>
              Write down the secret phrase and keep them safe, it's the only way
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
              Write down the secret phrase and keep them safe, it's the only way
              to recover your funds if you lose your card and PIN.
            </DialogDescription>
            <DialogDescription>
              PIN is used to protect your card from unauthorized access.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="no-mnemonic" className="">
            <TabsList className="grid h-auto p-1 grid-cols-2 bg-gray-200 rounded-lg">
              <TabsTrigger className="text-md rounded-lg" value="no-mnemonic">
                Generate
              </TabsTrigger>
              <TabsTrigger className="text-md rounded-lg" value="has-mnemonic">
                Load
              </TabsTrigger>
            </TabsList>
            <TabsContent value="has-mnemonic">
              <Form {...loadForm}>
                <form
                  onSubmit={loadForm.handleSubmit(loadWords)}
                  className="space-y-6 mt-4"
                >
                  <FormField
                    control={loadForm.control}
                    name="words"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Input your secret phrase</FormLabel>
                        <FormControl>
                          <Textarea
                            className="col-span-3 w-2/3"
                            onChange={field.onChange}
                            autoCorrect="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loadForm.control}
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
                    control={loadForm.control}
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
            </TabsContent>
            <TabsContent value="no-mnemonic">
              <Form {...initForm}>
                <form
                  onSubmit={initForm.handleSubmit(initCard)}
                  className="space-y-6 mt-4"
                >
                  <FormField
                    control={initForm.control}
                    name="checksum"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Choose the count of secret phrase</FormLabel>
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {mnemonic && mnemonicDialog()}
    </div>
  );
};

export default InitializeDialog;
