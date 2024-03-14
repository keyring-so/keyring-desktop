import { GetTransactionHistory } from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  chain: string;
  address: string;
};

const TransactionHistory = ({ chain, address }: Props) => {
  const [txHistory, setTxHistory] =
    useState<main.GetTransactionHistoryResponse>();

  const { toast } = useToast();

  useEffect(() => {
    let responseSubscribed = true;
    const fn = async () => {
      try {
        let txHistory = await GetTransactionHistory(chain, address, 10, 0);
        if (responseSubscribed) {
          console.log("history", txHistory);
          setTxHistory(txHistory);
        }
      } catch (err) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Error happens: ${err}`,
        });
      }
    };

    fn();
    return () => {
      responseSubscribed = false;
    };
  }, []);

  return <Label className="text-lg">Transaction History</Label>;
};

export default TransactionHistory;
