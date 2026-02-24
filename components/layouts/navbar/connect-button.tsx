"use client";

import React from "react";
import { client } from "@/lib/client";
import { createWallet } from "thirdweb/wallets";
import { ConnectButton as ThirdwebConnectButton } from "thirdweb/react";

const ConnectButton = () => {
  const wallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
  ];

  return (
    <ThirdwebConnectButton
      client={client}
      wallets={wallets}
      connectButton={{
        className:
          "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold font-khand text-lg px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300",
        label: "Connect Wallet",
        style: {
          height: "auto",
          width: "max-content",
          minWidth: "max-content",
          background: "linear-gradient(to right, #9333ea, #db2777)",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 24,
          paddingRight: 24,
          fontSize: "18px",
          fontWeight: 700,
          fontFamily: "Khand, sans-serif",
          color: "white",
          borderRadius: "12px",
          textAlign: "center",
          border: "none",
        },
      }}
      detailsButton={{
        className: "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold font-khand px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300",
        style: {
          flexDirection: "row-reverse",
          height: "auto",
          width: "max-content",
          minWidth: "max-content",
          background: "linear-gradient(to right, #9333ea, #db2777)",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 20,
          paddingRight: 20,
          fontSize: "16px",
          fontWeight: 700,
          fontFamily: "Khand, sans-serif",
          color: "white",
          borderRadius: "12px",
          border: "none",
        },
      }}
    />
  );
};

export default ConnectButton;