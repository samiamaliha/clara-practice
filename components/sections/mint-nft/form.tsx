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

const formSchema = z.object({
  quantity: z.number()
    .min(1, "Minimum 1 token")
    .max(10, "Maximum 10 tokens per transaction")
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
          toast({ description: "switching network..." })
          await switchChain(defineChain(nft.chainID))
        }

        const { transactionHash } = await sendTransaction({
          transaction,
          account,
        });

        const receipt = await waitForReceipt({ client, chain: defineChain(nft.chainID), transactionHash });

        if (receipt) {
          toast({
            title: "Minted Successfully",
            description: `hash: ${transactionHash}`,
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

  // In the form component, update the form container and elements:

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md rounded-lg space-y-4 min-w-full p-4 bg-gradient-to-b from-gray-900/80 to-black/80 border border-purple-900/40 backdrop-blur-sm">
      
      {/* Mint price info - Reduced size */}
      <div className="bg-gradient-to-b from-purple-900/60 to-purple-950/80 border border-purple-800/50 rounded-lg p-3 backdrop-blur-sm">
        <P className="text-gray-300 text-sm font-medium">
          {taskRemaining < 1 ?
            (quantity > 0 ?
              <Fragment>
                Mint for <b><span className="text-white">{getTotalPrice(quantity, nft.price)}</span>{nft.price > 0 && ` ${nft.symbol}`}</b>
              </Fragment> :
              <Fragment>
                Mint each for <b><span className="text-white">{nft.price}</span> {nft.symbol}</b>
              </Fragment>
            ) :
            <Flex className="items-start gap-2">
              <AlertIcon type={"info"} className="size-4 mt-[4px] flex-shrink-0 text-purple-400" />
              <span className="text-gray-300 text-sm">
                {account ?
                  <Fragment>
                    Complete all tasks before minting
                  </Fragment> :
                  <Fragment>
                    Connect your wallet to mint NFT
                  </Fragment>}
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
            <FormItem className="pb-1">
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Enter number of tokens (1-10)"
                  className="h-10 p-2 px-3 w-full text-sm bg-gradient-to-b from-purple-900/40 to-black/80 border border-purple-800/50 text-white placeholder-gray-500 rounded-lg focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  disabled={!account}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <Flex className="items-center gap-2 mt-2">
                <AlertIcon type={account ? form.formState.errors.quantity ? "error" : "success" : "info"} className="size-4 text-purple-400" />
                <FormDescription className="text-gray-400 text-xs">
                  {account ?
                    form.formState.errors.quantity ?
                      form.formState.errors.quantity.message :
                      claimedMint !== undefined && reservedMints !== undefined && `${claimedMint} of ${reservedMints > 1000000000000 ? "∞" : reservedMints} minted`
                    :
                    "Connect your wallet to mint NFT"
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
        {account ? <PrimaryButton
          type="submit"
          className={cn("w-full py-2.5")}
          disabled={ifDisabled()}
        >
          <Fragment>
            {loading ? (
              <Flex className="relative items-center gap-2" >
                <p className="text-sm tracking-wider text-center grow">
                  Minting...
                </p>
                <Loader2 className="absolute h-3.5 w-3.5 animate-spin right-0" />
              </Flex>
            ) :
              <ActionChild arrowSize={"16px"} text="Mint Now" />
            }
          </Fragment>

        </PrimaryButton>
          :
          <div className="flex justify-center w-full">
            <div className="w-full">
              <ConnectButton />
            </div>
          </div>
        }
      </div>

      {!!nft.tasks && account &&
        <Flex className="items-center gap-2">
          <AlertIcon type={account ? form.formState.errors.quantity ? "error" : "success" : "info"} className="size-4 text-purple-400" />
          <FormDescription className="text-gray-400 text-xs">
            {form.formState.errors.quantity ?
              form.formState.errors.quantity.message :
              claimedMint !== undefined && reservedMints !== undefined && `${claimedMint} of ${reservedMints > 1000000000000 ? "∞" : reservedMints} minted`
            }
          </FormDescription>
        </Flex>
      }
    </form>
  </Form>
);
}