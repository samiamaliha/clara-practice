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

  const contract = getContract({
    client,
    chain: defineChain(nft.chainID),
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
        className="relative w-full container mx-auto px-4 pt-24 md:pt-28 pb-8 text-white"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full max-w-5xl mx-auto">
          {/* Loading skeletons */}
          <div className="h-[380px] bg-gradient-to-b from-gray-900/50 to-black/50 rounded-xl animate-pulse"></div>
          <div className="h-[380px] bg-gradient-to-b from-gray-900/50 to-black/50 rounded-xl animate-pulse"></div>
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
      className="relative w-full container mx-auto px-4 pt-24 md:pt-28 pb-8 text-white"
    >
      <Grid className="grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full max-w-5xl mx-auto">

        {/* NFT Image Card - More Compact */}
        <div className="relative group">
          <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-purple-900/30 to-black/70 backdrop-blur-sm">
            {nft.soldOut && (
              <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-xs font-bold text-white backdrop-blur-sm">
                Sold Out
              </div>
            )}

            <FadeInImage
              src={imageURI}
              alt="NFT Preview"
              width={500}
              height={500}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Minting Details - More Compact */}
        <div className="flex flex-col gap-5">
          {/* Header section */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <H1 className="text-2xl md:text-3xl lg:text-4xl  font-bold text-white leading-tight">{title}</H1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-md border border-purple-500/40 text-xs font-semibold text-purple-300">
                  #{nft.hash}
                </span>
                <span className="px-2 py-1 border border-purple-500/40 rounded-md text-xs text-gray-300">
                  {nft.chain}
                </span>
                <button onClick={() => { refetchClaimed(); refetchCondition() }} className="p-1.5 hover:bg-purple-900/30 rounded-md transition-colors">
                  <Loader2 size={16} className={cn("text-purple-400", claimedMintLoading || conditionClaimPending ? "animate-spin" : "")} />
                </button>
              </div>
            </div>

            <P className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizedText }} />

            {/* Compact stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Collection Progress */}
              <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Progress</span>
                  {totalMinted && <span className="text-xs text-purple-300 font-semibold">{totalMinted}/∞</span>}
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((Number(totalMinted) || 0) / 1000000 * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Mint Price */}
              <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-lg p-3 text-center backdrop-blur-sm">
                <div className="text-xs text-gray-400 mb-1">Mint Price</div>
                <div className="text-sm font-bold text-white">
                  {nft.price > 0 ? `${nft.price} ${nft.symbol}` : "Free"}
                </div>
              </div>
            </div>

            {/* Info cards - Ultra Compact */}
            <div className="grid grid-cols-2 gap-2">
              {/* Address copy */}
              <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-lg p-2 backdrop-blur-sm">
                <div className="text-xs text-gray-400 mb-1">Contract</div>
                <CopyToClipboard text={nft.address} label={shortenAddress(nft.address, 4)} />
              </div>
              
              {nft.faucetURI && (
                <Link href={nft.faucetURI} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-lg p-2 h-full flex items-center justify-center hover:border-purple-400/60 transition-all duration-200 backdrop-blur-sm">
                    <Flex className="gap-2 items-center">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                        <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-white font-medium">Faucet</div>
                      </div>
                    </Flex>
                  </div>
                </Link>
              )}
            </div>

            {/* Total Minted and Explorer - Ultra Compact */}
            <div className="grid grid-cols-2 gap-2">
              {typeof totalMinted !== "undefined" && totalMinted > 0 && (
                <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-lg p-2 backdrop-blur-sm">
                  <Flex className="items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{totalMinted}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Minted</div>
                      <div className="text-xs text-white font-medium">{totalMinted} NFTs</div>
                    </div>
                  </Flex>
                </div>
              )}
              
              <Link href={nft.explorerURI} target="_blank" rel="noopener noreferrer" className="group">
                <div className="bg-gradient-to-b from-purple-900/40 to-black/60 border border-purple-500/30 rounded-lg p-2 hover:border-purple-400/60 transition-all duration-200 backdrop-blur-sm">
                  <Flex className="gap-2 items-center">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-r from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                      <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-white font-medium">Explorer</div>
                      <div className="text-xs text-gray-400">View TX</div>
                    </div>
                  </Flex>
                </div>
              </Link>
            </div>
          </div>

          {/* Tasks section - More Compact */}
          {!!nft.tasks && (
            <div className={cn("transition-all duration-300", nft.price === 0 ? "bg-gradient-to-b from-purple-900/30 to-black/50 rounded-lg border border-purple-500/30 p-3" : "")}>
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

          {/* Mint Form - Reduced size */}
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