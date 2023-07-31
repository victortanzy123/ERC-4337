import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { CLIOpts } from "../../src";
// @ts-ignore
import { getConfig } from "../../src";

export default async function main(t: string, amt: string, opts: CLIOpts) {
  console.log("t amnt", t, amt, opts);
  const config = getConfig();
  console.log("Config", config);
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

  const target = ethers.utils.getAddress(t);
  const value = ethers.utils.parseEther(amt);
  const res = await client.sendUserOperation(
    simpleAccount.execute(target, value, "0x"),
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
EntryPoint Contract: 0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789

Example Transaction Hash: https://goerli.etherscan.io/tx/0x65bc77cb34523bfff1cdf5bb78e637480d25987c893ba7ebaee6b8916b5cb611

EOA: https://goerli.etherscan.io/address/0x2db75364436d41e2a97d533c92873efa653902db

Receiver: 727

Caller: https://goerli.etherscan.io/address/0x25df024637d4e56c1ae9563987bf3e92c9f534c0


Notes: Need API for RPC methods to:

1. Send UserOperation
2. Estimate UserOperation gas -> to fill in the fields required for UserOperation



GOERLI ERC20 Tokens:
1. AAVE - 0x8153A21dFeB1F67024aA6C6e611432900FF3dcb9
2. USDC - 0x65aFADD39029741B3b8f0756952C74678c9cEC93
3. LINK - 0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29
*/
