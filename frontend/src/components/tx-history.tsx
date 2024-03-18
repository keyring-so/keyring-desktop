import { GetTransactionHistory } from "@/../wailsjs/go/main/App";
import { utils } from "@/../wailsjs/go/models";
import { BrowserOpenURL } from "@/../wailsjs/runtime";
import { useToast } from "@/components/ui/use-toast";
import { shortenAddress, showTime } from "@/lib/utils";
import { ledgerAtom } from "@/store/state";
import { useAtomValue } from "jotai";
import {
  ArrowBigLeft,
  ArrowBigRight,
  ExternalLink,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "./ui/label";

type Transaction = {
  from: string;
  to: string;
  value: string;
  timestamp: number;
  hash: string;
  symbol: string;
};

type Props = {
  chain: string;
  address: string;
  config: utils.ChainConfig;
};

const TransactionHistory = ({ chain, address, config }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(6);
  const [total, setTotal] = useState(0);

  const { toast } = useToast();

  const ledger = useAtomValue(ledgerAtom);

  useEffect(() => {
    let responseSubscribed = true;
    const fn = async () => {
      try {
        let txHistory = await GetTransactionHistory(chain, address, 100, 0);
        if (responseSubscribed) {
          let orderedTxs = [
            ...txHistory.transactions.map((tx) => ({
              ...tx,
              symbol: config.symbol,
            })),
            ...txHistory.tokenTransfers,
          ].sort((a, b) => b.timestamp - a.timestamp);
          setTransactions(orderedTxs);
          setTotal(orderedTxs.length);
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
  }, [ledger]);

  const handleNextPage = () => {
    if (end >= total) {
      return;
    }
    setStart(start + 6);
    setEnd(end + 6);
  };

  const handlePreviousPage = () => {
    if (start <= 0) {
      return;
    }
    setStart(start - 6);
    setEnd(end - 6);
  };

  const isSent = (tx: Transaction) => tx.from === address || (tx.from === "" && Number(tx.value) < 0);

  return (
    <div>
      <div className="bg-secondary shadow overflow-hidden rounded-xl mt-8 divide-y divide-gray-200 w-[420px] ml-[-10px]">
        {transactions.slice(start, end).map((tx) => (
          <div className="flex items-start justify-between px-4 py-4">
            <div className="flex items-center">
              {isSent(tx) ? (
                <Minus
                  className="rounded-full bg-red-100 px-2 h-10 w-10"
                  color="#c23000"
                />
              ) : (
                <Plus
                  className="rounded-full px-2 h-10 w-10 bg-green-100"
                  color="green"
                />
              )}
              <div className="ml-4">
                {isSent(tx) ? (
                  <div className="text-sm font-medium text-gray-900">
                    Sent {tx.to ? `to ${shortenAddress(tx.to)}` : ""}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    Received {tx.from ? `from ${shortenAddress(tx.from)}` : ""}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {Math.abs(Number(tx.value)).toLocaleString()} {shortenAddress(tx.symbol)}
                </div>
              </div>
            </div>

            <div className="flex flex-row items-center gap-3">
              <Label className="text-sm text-gray-500">
                {showTime(tx.timestamp)}
              </Label>
              <ExternalLink
                onClick={() =>
                  BrowserOpenURL(
                    `${config.explorer}${config.explorerTx}/${tx.hash}`
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-row mt-3 justify-center gap-6">
        <ArrowBigLeft
          className="rounded-full bg-secondary px-2 h-10 w-10"
          color={start <= 0 ? "#c4c4c4" : "#EEC959"}
          onClick={handlePreviousPage}
        />
        <ArrowBigRight
          className="rounded-full bg-secondary px-2 h-10 w-10"
          color={end >= total ? "#c4c4c4" : "#EEC959"}
          onClick={handleNextPage}
        />
      </div>
    </div>
  );
};

export default TransactionHistory;
