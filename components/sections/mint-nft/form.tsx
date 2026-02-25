import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { claimTo } from "thirdweb/extensions/erc721";
import { ContractOptions, defineChain, sendTransaction, waitForReceipt } from "thirdweb";
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";

import { cn } from "@/lib/utils";
import { P } from "@/components/typo";
import { client } from "@/lib/client";
import { Flex } from "@/components/elements";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import AlertIcon from "@/components/elements/icon";
import { zodResolver } from "@hookform/resolvers/zod";
import ConnectButton from "@/components/layouts/navbar/connect-button";
import { ActionChild, PrimaryButton, PrimaryButtonProto } from "@/components/elements/button";
import { Form, FormControl, FormDescription, FormField, FormItem } from "@/components/ui/form";
import { robinhoodTestnet } from "@/configs/chains";

const formSchema = z.object({
  quantity: z.number()
    .min(1, "Min 1")
    .max(10, "Max 10")
});

export default function MintForm(
  {
    nft,
    contract,
    claimedMint,
    reservedMints,
    refetchCondition,
    taskRemaining = 0,
    refetchClaimedMint,
  }
    :
    {
      nft: NFT,
      taskRemaining?: number,
      refetchCondition: () => void,
      refetchClaimedMint: () => void,
      claimedMint?: bigint | undefined,
      reservedMints?: bigint | undefined,
      contract: Readonly<ContractOptions<[], `0x${string}`>>
    }
) {
  const { toast } = useToast()
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1
    },
  });

  const { quantity } = form.watch()

  const getTotalPrice = (quantity: number, price: number) => {
    const totalPrice = quantity * price
    return totalPrice > 0 ? totalPrice : "free"
  }

  // Helper function to get chain configuration
  const getChainConfig = (chainId: number) => {
    if (chainId === 46630) { // Robinhood Testnet
      return robinhoodTestnet;
    }
    return defineChain(chainId);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.quantity > 0 && account?.address) {
      const transaction = claimTo({
        contract,
        to: account.address,
        quantity: BigInt(values.quantity),
      });

      try {
        setLoading(true)

        if (activeChain?.id !== nft.chainID) {
          toast({ description: "switching..." })
          await switchChain(getChainConfig(nft.chainID))
        }

        const { transactionHash } = await sendTransaction({
          transaction,
          account,
        });

        const receipt = await waitForReceipt({ 
          client, 
          chain: getChainConfig(nft.chainID), 
          transactionHash 
        });

        if (receipt) {
          toast({
            title: "Minted",
            description: `hash: ${transactionHash.substring(0, 10)}...`,
            variant: "default"
          })
          refetchCondition()
          refetchClaimedMint()
        }

      } catch (er) {
        console.log(er)
        toast({
          title: "Error",
          description: (er as Error).message || "Something went wrong",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const ifDisabled = (): boolean => {
    if (nft.soldOut) return true
    if (!!nft.tasks) {
      if (claimedMint !== undefined && reservedMints !== undefined) {
        if (!!form.formState.errors.quantity || claimedMint >= reservedMints || taskRemaining > 0) {
          return true
        } else {
          return false
        }
      } else {
        return true
      }
    }
    if (loading || taskRemaining > 0) return true
    return false
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md rounded-lg space-y-3 min-w-full p-4 bg-gradient-to-b from-gray-900/80 to-black/80 border border-purple-900/40 backdrop-blur-sm">
        
        {/* Mint price info - Ultra Compact */}
        <div className="bg-gradient-to-b from-purple-900/60 to-purple-950/80 border border-purple-800/50 rounded-lg p-2 backdrop-blur-sm">
          <P className="text-gray-300 text-xs font-medium">
            {taskRemaining < 1 ?
              (quantity > 0 ?
                <Fragment>
                  Mint for <b><span className="text-white">{getTotalPrice(quantity, nft.price)}</span>{nft.price > 0 && ` ${nft.symbol}`}</b>
                </Fragment> :
                <Fragment>
                  Mint <b><span className="text-white">{nft.price}</span> {nft.symbol}</b>
                </Fragment>
              ) :
              <Flex className="items-start gap-1.5">
                <AlertIcon type={"info"} className="size-3.5 mt-[2px] flex-shrink-0 text-purple-400" />
                <span className="text-gray-300 text-xs">
                  {account ?
                    "Complete tasks first" :
                    "Connect wallet"}
                </span>
              </Flex>
            }
          </P>
        </div>

        {!nft.tasks &&
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Qty (1-10)"
                    className="h-9 p-2 px-3 w-full text-xs bg-gradient-to-b from-purple-900/40 to-black/80 border border-purple-800/50 text-white placeholder-gray-500 rounded-lg focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    disabled={!account}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <Flex className="items-center gap-1.5 mt-1.5">
                  <AlertIcon type={account ? form.formState.errors.quantity ? "error" : "success" : "info"} className="size-3.5 text-purple-400" />
                  <FormDescription className="text-gray-400 text-xs">
                    {account ?
                      form.formState.errors.quantity ?
                        form.formState.errors.quantity.message :
                        claimedMint !== undefined && reservedMints !== undefined && `${claimedMint}/${reservedMints > 1000000000000 ? "∞" : reservedMints}`
                      :
                      "Connect wallet"
                    }
                  </FormDescription>
                </Flex>
              </FormItem>
            )}
          />
        }

        <div className={cn(
          "space-y-1 min-w-full",
          (!!form.formState.errors.quantity || loading || taskRemaining > 0) && account ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        )}
        >
          {account ? 
            <PrimaryButton
              type="submit"
              className={cn("w-full py-2 text-xs")}
              disabled={ifDisabled()}
            >
              <Fragment>
                {loading ? (
                  <Flex className="items-center gap-1.5 justify-center">
                    <span>Minting...</span>
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </Flex>
                ) : (
                  <span>Mint Now</span>
                )}
              </Fragment>
            </PrimaryButton>
            :
            <div className="flex justify-center w-full">
              <ConnectButton />
            </div>
          }
        </div>

        {!!nft.tasks && account &&
          <Flex className="items-center gap-1.5">
            <AlertIcon type={account ? form.formState.errors.quantity ? "error" : "success" : "info"} className="size-3.5 text-purple-400" />
            <FormDescription className="text-gray-400 text-xs">
              {form.formState.errors.quantity ?
                form.formState.errors.quantity.message :
                claimedMint !== undefined && reservedMints !== undefined && `${claimedMint}/${reservedMints > 1000000000000 ? "∞" : reservedMints}`
              }
            </FormDescription>
          </Flex>
        }
      </form>
    </Form>
  );
}
