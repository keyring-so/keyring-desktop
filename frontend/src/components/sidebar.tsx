import { main } from "@/../wailsjs/go/models";
import {
  chainConfigsAtom,
  isTestnetAtom,
  showNewLedgerAtom,
  showSidebarItem,
} from "@/store/state";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FlaskRound, Plus, Settings, UserCircle } from "lucide-react";
import { GetChainConfigs } from "../../wailsjs/go/main/App";
import Logo from "./logo";
import SidebarIcon from "./sidebar-icon";
import SidebarLedger from "./sidebar-ledger";

type Props = {
  chains: main.ChainDetail[];
  lastSelectedChain: string;
};

const Sidebar = ({ chains, lastSelectedChain }: Props) => {
  const setShowNewLedger = useSetAtom(showNewLedgerAtom);
  const setChainConfigs = useSetAtom(chainConfigsAtom);
  const [sidebarItem, setSidebarItem] = useAtom(showSidebarItem);
  const allowTestnet = useAtomValue(isTestnetAtom);

  const clickAddButton = async () => {
    let chainConfigs = await GetChainConfigs();
    setChainConfigs(chainConfigs);
    setShowNewLedger(true);
  };

  const showledgerItem = (chain: main.ChainDetail) => {
    const isSelected = lastSelectedChain == chain.name;
    if (!chain.testnet) {
      return (
        <SidebarLedger img={chain.img} text={chain.name} ledger={chain.name} selected={isSelected} />
      );
    }

    if (!allowTestnet) {
      return;
    }

    return (
      <div className="relative group">
        <SidebarLedger img={chain.img} text={chain.name} ledger={chain.name} selected={isSelected} />
        <FlaskRound className="absolute top-2 right-0 h-4 w-4 text-zinc-400" />
      </div>
    );
  };

  return (
    <div
      className="
            top-2 left-2 w-auto h-screen p-2
            flex flex-col bg-gray-100 dark:bg-gray-900 shadow-lg
            items-center
            "
    >
      <SidebarIcon
        icon={Logo}
        text="Keyring"
        onClick={() => console.log("click")}
      />

      <Divider />

      <div className="flex flex-col">{chains.map(showledgerItem)}</div>

      {chains.length > 0 && <Divider />}

      <SidebarIcon
        icon={Plus}
        text="Add a Blockchain"
        onClick={clickAddButton}
      />

      <div className="flex flex-col fixed bottom-2">
        <SidebarIcon
          icon={UserCircle}
          text="Accounts"
          onClick={() =>
            sidebarItem == "accounts"
              ? setSidebarItem("")
              : setSidebarItem("accounts")
          }
        />
        <SidebarIcon
          icon={Settings}
          text="Settings"
          onClick={() =>
            sidebarItem == "settings"
              ? setSidebarItem("")
              : setSidebarItem("settings")
          }
        />
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
