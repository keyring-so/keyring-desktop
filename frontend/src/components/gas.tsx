import { CalculateFee } from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";
import { Slider } from "./ui/slider";

interface Props {
  contract?: string;
  chainName: string;
  from: string;
  to: string;
  setGas: (tip: string) => void;
}

const GasFee = ({ contract, chainName, from, to, setGas }: Props) => {
  const [fee, setFee] = useState<main.FeeInfo>();
  const [adjustedFee, setAdjustedFee] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const updateGas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const gasFee = Number(event.target.value);
    setAdjustedFee(gasFee.toString());
    setGas(gasFee.toString());
  };

  const adjustGas = (value: number[]) => {
    if (!fee) return;

    const newFee = (Number(fee.gas) * value[0]).toFixed(fee.decimals);
    setAdjustedFee(newFee)
    setGas(newFee);
    return;
  };

  // TODO ethereum custom gas fee is broken, need to fix it
  // TODO walletconnect custom gas fee is broken, need to fix it.
  // TODO lbry custom gas fee is broken, need to fix it.
  const queryFee = async () => {
    try {
      setLoading(true);
      let fee = await CalculateFee(contract || "", chainName);
      setFee(fee);
      setAdjustedFee(fee.gas);
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
              setFee(undefined);
              setAdjustedFee("");
            }
          }}
        />
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Label htmlFor="advance-fee-mode">Fee Options</Label>
      </div>
      {fee ? (
        <div>
          <div>
            <Label>Gas Price</Label>
            <Slider className="m-3 w-2/3 bg-yellow" defaultValue={[1]} max={2} step={0.1} onValueCommit={adjustGas} />
            <Input
              value={Number(adjustedFee).toFixed(fee.decimals).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1')}
              onChange={updateGas}
              disabled={false}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GasFee;
