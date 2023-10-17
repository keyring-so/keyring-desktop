import { CalculateFee } from "@/../wailsjs/go/main/App";
import { main } from "@/../wailsjs/go/models";
import { GWEI } from "@/constants";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";

interface Props {
  contract?: string;
  chainName: string;
  from: string;
  to: string;
  setTip: (tip: string) => void;
}

const GasFee = ({ contract, chainName, from, to, setTip }: Props) => {
  const [fee, setFee] = useState<main.FeeInfo>();
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const updateTip = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tipFee = Number(event.target.value) * GWEI;
    setTip(tipFee.toString());
  };

  const queryFee = async () => {
    try {
      setLoading(true);
      let fee = await CalculateFee(contract || "", chainName, from, to);
      setFee(fee);
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
            }
          }}
        />
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Label htmlFor="advance-fee-mode">Fee Options</Label>
      </div>
      {fee ? (
        <div>
          <div>
            <Label>Base Fee (GWEI)</Label>
            <Input disabled value={(Number(fee.base) / GWEI).toFixed(2)} />
          </div>
          <div>
            <Label>Tip Fee (GWEI)</Label>
            <Input
              defaultValue={(Number(fee.tip) / GWEI).toFixed(2)}
              onChange={updateTip}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GasFee;
