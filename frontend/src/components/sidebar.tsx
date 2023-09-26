import {
  LEDGERS
} from "@/constants";
import { chainConfigsAtom, showNewLedgerAtom, showSidebarItem } from "@/store/state";
import { useSetAtom } from "jotai";
import { Plus, Settings, UserCircle } from "lucide-react";
import { GetChainConfigs } from "../../wailsjs/go/main/App";
import Logo from "./logo";
import SidebarIcon from "./sidebar-icon";
import SidebarLedger from "./sidebar-ledger";

type Props = {
  chains: string[];
  lastSelectedChain: string;
};

const Sidebar = ({ chains, lastSelectedChain }: Props) => {
  const setShowNewLedger = useSetAtom(showNewLedgerAtom);
  const setChainConfigs = useSetAtom(chainConfigsAtom);
  const setShowSidebarItem = useSetAtom(showSidebarItem);

  const clickAddButton = async () => {
    let chainConfigs = await GetChainConfigs();
    setChainConfigs(chainConfigs);
    setShowNewLedger(true);
  };

  return (
    <div
      className="
            top-2 left-2 w-auto h-screen p-2
            flex flex-col bg-gray-100 dark:bg-gray-900 shadow-lg
            items-center
            "
    >
      <SidebarIcon icon={Logo} text="Keyring" onClick={() => console.log("click")} />

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

      {chains.length > 0 && <Divider />}

      <SidebarIcon icon={Plus} text="Add a Blockchain" onClick={clickAddButton} />

      <div className="flex flex-col fixed bottom-2">
        <SidebarIcon icon={UserCircle} text="Accounts" onClick={() => setShowSidebarItem("accounts")} />
        <SidebarIcon icon={Settings} text="Settings" onClick={() => setShowSidebarItem("settings")} />
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
