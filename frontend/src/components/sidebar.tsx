import {
  LEDGERS
} from "@/constants";
import { chainConfigsAtom, showNewLedgerAtom } from "@/store/state";
import { useSetAtom } from "jotai";
import { Key, Plus, Settings, UserCircle } from "lucide-react";
import SidebarLedger from "./sidebar-ledger";
import SidebarIcon from "./sidebar-icon";
import { GetChainConfigs } from "../../wailsjs/go/main/App";

type Props = {
  chains: string[];
  lastSelectedChain: string;
};

const Sidebar = ({ chains, lastSelectedChain }: Props) => {
  const setShowNewLedger = useSetAtom(showNewLedgerAtom);
  const setChainConfigs = useSetAtom(chainConfigsAtom);

  const clickAddButton = async () => {
    let chainConfigs = await GetChainConfigs();
    setChainConfigs(chainConfigs);
    setShowNewLedger(true);
  };

  return (
    <div
      className="
            top-2 left-2 h-screen w-16
            flex flex-col bg-white dark:bg-gray-900 shadow-lg
            items-center
            "
    >
      <SidebarIcon icon={Key} text="Keyring" onClick={() => console.log("click")} />

      <Divider />

      <div className="flex flex-col">
        {chains.map((chain) => {
          const ledger = LEDGERS.get(chain);
          return (
            <SidebarLedger
            img={ledger!.img}
            text={ledger!.name}
            ledger={chain}
            />
          );
        })}
      </div>

      <Divider />

      <SidebarIcon icon={Plus} text="Add a Blockchain" onClick={clickAddButton} />

      <div className="flex flex-col fixed bottom-2">
        <SidebarIcon icon={UserCircle} text="Accounts" onClick={() => console.log("click")} />
        <SidebarIcon icon={Settings} text="Settings" onClick={() => console.log("click")} />
      </div>
    </div>
  );
};

const Divider = () => (
  <hr
    className="
        bg-gray-200 dark:bg-gray-800
        border border-gray-200 dark:border-gray-800 rounded-full
        mx-2 w-4/5
        "
  />
);

export default Sidebar;
