import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  braveWallet,
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { SafeConnector } from "@wagmi/connectors/safe";
import { configureChains } from "wagmi";
import * as chains from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import scaffoldConfig from "~~/scaffold.config";
import { burnerWalletConfig } from "~~/services/web3/wagmi-burner/burnerWalletConfig";
import { getTargetNetwork } from "~~/utils/scaffold-eth";

const configuredNetwork = getTargetNetwork();
const burnerConfig = scaffoldConfig.burnerWallet;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
const enabledChains =
  (configuredNetwork.id as number) === 1 ? [configuredNetwork] : [configuredNetwork, chains.mainnet];

/**
 * Chains for the app
 */
export const appChains = configureChains(
  enabledChains,
  [
    alchemyProvider({
      apiKey: scaffoldConfig.alchemyApiKey,
      priority: 0,
    }),
    publicProvider({ priority: 1 }),
  ],
  {
    stallTimeout: 3_000,
    // Sets pollingInterval if using chain's other than local hardhat chain
    ...(configuredNetwork.id !== chains.hardhat.id
      ? {
          pollingInterval: scaffoldConfig.pollingInterval,
        }
      : {}),
  },
);

const wallets = [
  metaMaskWallet({ chains: appChains.chains, shimDisconnect: true }),
  walletConnectWallet({ chains: appChains.chains }),
  ledgerWallet({ chains: appChains.chains }),
  braveWallet({ chains: appChains.chains }),
  coinbaseWallet({ appName: "scaffold-eth-2", chains: appChains.chains }),
  rainbowWallet({ chains: appChains.chains }),
];

const safeConnector = new SafeConnector({
  chains: enabledChains,
  options: {
    allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/, /multisig.lol$/],
    debug: false,
  },
});

/**
 * Rainbowkit connectors for the wagmi context
 */
export const rainbowKitConnectors = connectorsForWallets([
  {
    groupName: "Supported Wallets",
    wallets: burnerConfig.enabled ? [...wallets, burnerWalletConfig({ chains: [appChains.chains[0]] })] : wallets,
  },
]);

export const wagmiConnectors = [...rainbowKitConnectors(), safeConnector];
