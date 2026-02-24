import { defineChain } from "thirdweb";

// Define Robinhood Testnet
export const robinhoodTestnet = defineChain({
  id: 46630, // Replace with actual Robinhood Testnet chain ID
  name: "Robinhood Testnet",
  rpc: "https://rpc.testnet.chain.robinhood.com", // Replace with actual RPC URL
  nativeCurrency: {
    name: "Robinhood",
    symbol: "ETH", // Replace with actual symbol
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Robinhood Explorer",
      url: "https://explorer.testnet.chain.robinhood.com/", // Replace with actual explorer URL
    },
  ],
  testnet: true,
});

// Add other custom chains here if needed
export const customChains = {
  robinhoodTestnet,
};