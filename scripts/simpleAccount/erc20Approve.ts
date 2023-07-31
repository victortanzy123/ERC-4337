import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { ERC20_ABI, CLIOpts } from "../../src";

// @ts-ignore
import { getConfig } from "../../src";

export default async function main(
  tkn: string,
  s: string,
  amt: string,
  opts: CLIOpts
) {
  const config = getConfig();
  const paymasterMiddleware = opts.withPM
    ? Presets.Middleware.verifyingPaymaster(
        config.paymaster.rpcUrl,
        config.paymaster.context
      )
    : undefined;
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new ethers.Wallet(config.signingKey),
    config.rpcUrl,
    { paymasterMiddleware, overrideBundlerRpc: opts.overrideBundlerRpc }
  );
  const client = await Client.init(config.rpcUrl, {
    overrideBundlerRpc: opts.overrideBundlerRpc,
  });

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const token = ethers.utils.getAddress(tkn);
  const spender = ethers.utils.getAddress(s);
  const erc20 = new ethers.Contract(token, ERC20_ABI, provider);
  const [symbol, decimals] = await Promise.all([
    erc20.symbol(),
    erc20.decimals(),
  ]);
  const amount = ethers.utils.parseUnits(amt, decimals);
  console.log(`Approving ${amt} ${symbol}...`);

  const res = await client.sendUserOperation(
    simpleAccount.execute(
      erc20.address,
      0,
      erc20.interface.encodeFunctionData("approve", [spender, amount])
    ),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await res.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}

/*
Command: yarn run simpleAccount erc20Approve --token 0x65aFADD39029741B3b8f0756952C74678c9cEC93 --spender 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45 --amount 1000000 --dryRun

USDC (Goerli): 0x65aFADD39029741B3b8f0756952C74678c9cEC93
UniswapV2 Router (Goerli): 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D


Example Transaction Hash: https://goerli.etherscan.io/tx/0xc3153533d66c753d8f827b38a32f8b1bb8d6121fa98449b3c472fe8782d6ba27

1. Transfer of ETH for gas to EntryPoint Contract (789)
2. Refund of leftover gas from EntryPoint contract to external caller (4c0)
*/
