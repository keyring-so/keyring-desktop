import bitcoin from "@/assets/blockchains/bitcoin/logo.png";
import ethereum from "@/assets/blockchains/ethereum/logo.png";
import polygon from "@/assets/blockchains/polygon/logo.png";
import { LucideIcon, Settings, UserCircle, Key } from "lucide-react";
import { Plus } from "lucide-react";
import React from "react";

const Sidebar = () => {
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
        <SidebarIcon img={bitcoin} text="Bitcoin" />
        <SidebarIcon img={ethereum} text="Ethereum" />
        <SidebarIcon img={polygon} text="Polygon" />
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

type Props = {
  img?: string;
  icon?: LucideIcon;
  text: string;
};

const SidebarIcon = ({ img, icon, text }: Props) => {
  return (
    <div
      className="
            relative flex items-center justify-center
            h-14 w-14 mt-2 mb-2 mx-auto
            bg-gray-300 hover:bg-green-600 dark:bg-gray-800
            text-zinc-600 hover:text-white
            hover:rounded-xl rounded-full
            transition-all duration-200 ease-linear
            cursor-pointer shadow-lg
            group
            "
    >
      { icon ? React.createElement(icon) : <img src={img} />}
      <span
        className="
            absolute w-auto p-2 m-2 min-w-max left-16 rounded-md shadow-md
            text-white bg-gray-900
            text-sm font-bold
            transition-all duration-300 scale-0 origin-left group-hover:scale-100
            "
      >
        {text}
      </span>
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
