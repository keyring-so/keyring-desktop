import { Label } from "@/components/ui/label";
import { useState } from "react";
import { database } from "@/../wailsjs/go/models";

const TransactionHistory = () => {
    const [chainConfig, setChainConfig] = useState<database.DatabaseTransactionInfo>();
    
    return (
        <Label className="text-lg">Transaction History</Label>
    )
};

export default TransactionHistory;
