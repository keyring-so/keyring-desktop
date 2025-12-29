// import { Web3Wallet, IWeb3Wallet } from "@walletconnect/web3wallet";
// import { Core } from "@walletconnect/core";
import { GetWalletConnectProjectId } from "@/../wailsjs/go/main/App";

import { Core } from "@walletconnect/core";
import { WalletKit, IWalletKit } from "@reown/walletkit";

export let web3wallet: IWalletKit;

export const createWeb3Wallet = async () => {
  const projectId = await GetWalletConnectProjectId();
  const core = new Core({
    projectId,
  });

  web3wallet = await WalletKit.init({
    core,
    metadata: {
      name: "Keyring",
      description: "Secure and handy hardware wallet for crypto holders",
      url: "https://keyring.so",
      icons: [
        "https://imagedelivery.net/_aTEfDRm7z3tKgu9JhfeKA/0ba975d7-08d7-4a71-d527-bc7d54bad600/sm",
      ],
    },
  });
  console.log("web3wallet inited", web3wallet);
};
