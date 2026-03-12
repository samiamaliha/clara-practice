import { defineChain } from "thirdweb";

// Define Robinhood Testnet
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Testnet",
  rpc: "https://rpc.testnet.chain.robinhood.com",
  nativeCurrency: {
    name: "Robinhood",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Robinhood Explorer",
      url: "https://explorer.testnet.chain.robinhood.com/",
    },
  ],
  testnet: true,
});

// Define Pharos Testnet
export const pharosTestnet = defineChain({
  id: 688689,
  name: "Pharos Testnet",
  rpc: "https://atlantic.dplabs-internal.com",
  nativeCurrency: {
    name: "Pharos",
    symbol: "PHRS",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Pharos Explorer",
      url: "https://explorer.pharos-testnet.com", // You may need to update this URL
    },
  ],
  testnet: true,
});

// Add other custom chains here if needed
export const customChains = {
  robinhoodTestnet,
  pharosTestnet,
};
