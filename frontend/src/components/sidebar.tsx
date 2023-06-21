import {
  LEDGERS
} from "@/constants";
import { Key, Plus, Settings, UserCircle } from "lucide-react";
import SidebarIcon from "./sidebar-icon";

// TODO side bar should comes dynamic from database
// TODO add page to add new chain

type Props = {
  chains: string[];
  lastSelectedChain: string;
};

const Sidebar = ({ chains, lastSelectedChain }: Props) => {
  return (
    <div
      className="
            top-2 left-2 h-screen w-16
            flex flex-col bg-white dark:bg-gray-900 shadow-lg
            "
    >
      <SidebarIcon icon={Key} text="Keyring" />

      <Divider />

      <div className="flex flex-col">
        {chains.map((chain) => {
          const ledger = LEDGERS.get(chain);
          return (
            <SidebarIcon
            img={ledger!.img}
            text={ledger!.name}
            ledger={chain}
            />
          );
        })}
      </div>

      <Divider />

      <SidebarIcon icon={Plus} text="Add a Blockchain" />

      <div className="flex flex-col fixed bottom-2">
        <SidebarIcon icon={UserCircle} text="Accounts" />
        <SidebarIcon icon={Settings} text="Settings" />
      </div>
    </div>
  );
};

const Divider = () => (
  <hr
    className="
        bg-gray-200 dark:bg-gray-800
        border border-gray-200 dark:border-gray-800 rounded-full
        mx-2
        "
  />
);

export default Sidebar;
