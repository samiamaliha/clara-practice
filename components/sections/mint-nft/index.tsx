"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { defineChain, getContract } from "thirdweb"
import { useActiveAccount, useReadContract } from "thirdweb/react"
import { ExternalLink, Loader2 } from "lucide-react"

import MintForm from "./form"
import { client } from "@/lib/client"
import TaskHandler from "./task-handler"
import { cn, shortenAddress } from "@/lib/utils"
import { robinhoodTestnet } from "@/configs/chains"

import { Flex, Grid } from "@/components/elements"
import { H1, H2, Lead, P } from "@/components/typo"
import CopyToClipboard from "@/components/elements/clipboard-copy"
import FadeInImage from "@/components/elements/fade-in-image"

const MintSection = ({ nft }: { nft: NFT }) => {
  const [isMounted, setIsMounted] = useState(false)
  const account = useActiveAccount()
  const [tasksCompleted, setCompletedTasks] = useState<number[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Helper function to get the correct chain configuration
  const getChainConfig = (chainId: number) => {
    // Check if it's Robinhood Testnet (replace 39797 with actual chain ID)
    if (chainId === 46630) {
      return robinhoodTestnet;
    }
    // For all other chains, use Thirdweb's defineChain
    return defineChain(chainId);
  };

  const contract = getContract({
    client,
    chain: getChainConfig(nft.chainID),
    address: nft.address,
  })

  const { data: claimedMint, isPending: claimedMintLoading, refetch: refetchClaimed } = useReadContract({
    contract,
    method:
      "function getSupplyClaimedByWallet(uint256 _conditionId, address _claimer) view returns (uint256 supplyClaimedByWallet)",
    params: [BigInt(0), account?.address as string],
    queryOptions: {
      enabled: !!account,
    },
  })

  const { data: conditionClaimdata, isPending: conditionClaimPending, refetch: refetchCondition } = useReadContract({
    contract,
    method:
      "function getClaimConditionById(uint256 _conditionId) view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata) condition)",
    params: [BigInt(0)],
  })

  // Don't render on server
  if (!isMounted) {
    return (
      <section
        id="mint-nft"
        className="relative w-full container mx-auto px-4 pt-20 pb-12 text-white"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full max-w-6xl mx-auto mt-6">
          {/* Loading skeletons */}
          <div className="h-[600px] bg-gradient-to-b from-gray-900/50 to-black/50 rounded-2xl animate-pulse"></div>
          <div className="h-[600px] bg-gradient-to-b from-gray-900/50 to-black/50 rounded-2xl animate-pulse"></div>
        </div>
      </section>
    )
  }

  const title = nft.name
  const sanitizedText = nft.description
  const imageURI = nft.imageURI
  const totalMinted = conditionClaimdata?.supplyClaimed

  return (
    <section
      id="mint-nft"
      className="relative w-full container mx-auto px-4 pt-20 pb-12 text-white"
    >
      {/* Spacer for mobile devices */}
      <div className="h-12 md:hidden"></div>
      
      <Grid className="grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full max-w-6xl mx-auto mt-6">

        {/* NFT Image Card */}
        <div className="relative group mt-6 md:mt-8">
          <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-b from-purple-900/30 to-black/70 backdrop-blur-sm">
            {nft.soldOut && (
              <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-sm font-bold text-white backdrop-blur-sm">
                Sold Out
              </div>
            )}

            <FadeInImage
              src={imageURI}
              alt="NFT Preview"
              width={600}
              height={600}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </div>

        {/* Minting Details */}
        <div className="flex flex-col gap-8 mt-6 md:mt-8">
          {/* Header section */}
          <div className="space-y-8 pt-2">
            <div className="flex items-center gap-4 flex-wrap">
              <H1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{title}</H1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg border border-purple-500/40 text-sm font-semibold text-purple-300">
                  #{nft.hash}
                </span>
                <span className="px-3 py-1.5 border border-purple-500/40 rounded-lg text-sm text-gray-300">
                  {nft.chain}
                </span>
                <button onClick={() => { refetchClaimed(); refetchCondition() }} className="p-2 hover:bg-purple-900/30 rounded-lg transition-colors">
                  <Loader2 size={18} className={cn("text-purple-400", claimedMintLoading || conditionClaimPending ? "animate-spin" : "")} />
                </button>
              </div>
            </div>

            <P className="text-gray-300 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizedText }} />

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Collection Progress */}
              <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">Collection Progress</span>
                  {totalMinted && <span className="text-sm text-purple-300 font-semibold">{totalMinted} / ∞</span>}
                </div>
                <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((Number(totalMinted) || 0) / 1000000 * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Mint Price */}
              <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
                <div className="text-sm text-gray-400 mb-2">Mint Price</div>
                <div className="text-2xl font-bold text-white">
                  {nft.price > 0 ? `${nft.price} ${nft.symbol}` : "Free"}
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address copy */}
              <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-sm text-gray-400 mb-2">Contract Address</div>
                <CopyToClipboard text={nft.address} label={shortenAddress(nft.address)} />
              </div>
              
              {nft.faucetURI && (
                <Link href={nft.faucetURI} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-xl p-4 h-full flex items-center justify-center hover:border-purple-400/60 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                    <Flex className="gap-3 items-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium">Faucet/Bridge</div>
                        <div className="text-sm text-gray-400">Get test tokens</div>
                      </div>
                    </Flex>
                  </div>
                </Link>
              )}
            </div>

            {/* Total Minted and Explorer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typeof totalMinted !== "undefined" && totalMinted > 0 && (
                <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{totalMinted}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-gray-400">Total Minted</div>
                      <div className="text-white font-medium">{totalMinted} NFTs</div>
                    </div>
                  </div>
                </div>
              )}
              
              <Link href={nft.explorerURI} target="_blank" rel="noopener noreferrer" className="group">
                <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400/60 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                  <Flex className="gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-medium">View on Explorer</div>
                      <div className="text-sm text-gray-400">Check transaction</div>
                    </div>
                  </Flex>
                </div>
              </Link>
            </div>
          </div>

          {/* Tasks section */}
          {!!nft.tasks && (
            <div className={cn("transition-all duration-300", nft.price === 0 ? "bg-gradient-to-b from-purple-900/30 to-black/50 rounded-xl border border-purple-500/30 p-5" : "")}>
              <TaskHandler
                tasks={nft.tasks}
                completedTasks={tasksCompleted}
                setCompletedTasks={setCompletedTasks}
                additionalURI={nft.additionalURI}
                className={cn(
                  nft.soldOut ? "pointer-events-none opacity-70" : "",
                  nft.price === 0 ? "custom-free-task-ui" : ""
                )}
              />
            </div>
          )}

          {/* Mint Form */}
          <MintForm
            nft={nft}
            contract={contract}
            claimedMint={claimedMint}
            refetchCondition={() => refetchCondition()}
            refetchClaimedMint={refetchClaimed}
            reservedMints={conditionClaimdata?.quantityLimitPerWallet}
            taskRemaining={!!nft.tasks ? nft.tasks.length - tasksCompleted.length : 0}
          />
        </div>
      </Grid>
    </section>
  )
}

export default MintSection