import { CalculateFee } from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Asterisk, Loader2 } from "lucide-react";
import { useState } from "react";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";
import { Badge } from "./ui/badge";

interface Props {
  contract?: string;
  chainName: string;
  nativeSymbol: string;
  from: string;
  to: string;
  setGas: (tip: string) => void;
}

const GasFee = ({
  contract,
  chainName,
  nativeSymbol,
  from,
  to,
  setGas,
}: Props) => {
  const [feeInfo, setFeeInfo] = useState<main.FeeInfo>();
  const [adjustedGas, setAdjustedGas] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const adjustGas = (value: number[]) => {
    if (!feeInfo) return;

    const newFee = Number(feeInfo.gas) * feeInfo.gasLimit * value[0];
    console.log("newFee", newFee);
    console.log("feeInfo.gas", feeInfo.gas);
    console.log("feeInfo.feeInfo.gasLimit", feeInfo.gasLimit);
    console.log("value[0]", value[0]);

    const gasFee = newFee / feeInfo!.gasLimit;
    setAdjustedGas(gasFee.toString());
    setGas(gasFee.toString());
    return;
  };

  const queryFee = async () => {
    try {
      setLoading(true);
      let feeInfo = await CalculateFee(contract || "", chainName);
      setFeeInfo(feeInfo);
      setAdjustedGas(feeInfo.gas);
      setGas(feeInfo.gas);
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: `Error happens: ${err}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center space-x-2">
        <Switch
          id="advance-fee-mode"
          onCheckedChange={async (checked) => {
            if (checked) {
              await queryFee();
            } else {
              setFeeInfo(undefined);
              setGas("");
              setAdjustedGas("");
            }
          }}
        />
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Label htmlFor="advance-fee-mode">Fee Options</Label>
      </div>
      {feeInfo ? (
        <div>
          <div>
            <HoverCard>
              <HoverCardTrigger>
                <div className="flex flex-row">
                  <Label>Transaction Fee:</Label>
                  <Asterisk className="-mt-1" size={16} />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="text-sm flex flex-col w-auto gap-2">
                <Label>Transaction Fee = Gas Price * Gas Limit.</Label>
                <div className="flex flex-col gap-1">
                  <Label>Gas Price:</Label>
                  <Label className="font-light">
                    This is the amount a user is willing to pay per unit of gas.
                  </Label>
                  <Label className="font-light">
                    The Gas Price can vary based on network demand.
                  </Label>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Gas Limit:</Label>
                  <Label className="font-light">
                    This refers to the maximum amount of gas a user is willing
                    to spend on a transaction.
                  </Label>
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="flex flex-row mt-2 justify-center items-center">
              <div className="flex flex-row text-sm text-primary items-center justify-center gap-1">
                <Badge className="border-spacing-7">{nativeSymbol}</Badge>
                <Label className="text-sm text-primary">
                {(Number(adjustedGas) * feeInfo.gasLimit).toFixed(
                  feeInfo.decimals
                )}
              </Label>
              </div>
              <Slider
                className="m-3 w-2/3 bg-yellow"
                defaultValue={[1]}
                max={2}
                step={0.1}
                onValueCommit={adjustGas}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GasFee;
