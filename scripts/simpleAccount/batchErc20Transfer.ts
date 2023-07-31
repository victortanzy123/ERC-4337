import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { ERC20_ABI, CLIOpts, getConfig } from "../../src";

// This example requires several layers of calls:
// EntryPoint
//  ┕> sender.executeBatch
//    ┕> token.transfer (recipient 1)
//    ⋮
//    ┕> token.transfer (recipient N)
export default async function main(
  tkn: string,
  t: Array<string>,
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
  const erc20 = new ethers.Contract(token, ERC20_ABI, provider);
  const [symbol, decimals] = await Promise.all([
    erc20.symbol(),
    erc20.decimals(),
  ]);
  const amount = ethers.utils.parseUnits(amt, decimals);

  let dest: Array<string> = [];
  let data: Array<string> = [];
  t.map((addr) => addr.trim()).forEach((addr) => {
    dest = [...dest, erc20.address];
    data = [
      ...data,
      erc20.interface.encodeFunctionData("transfer", [
        ethers.utils.getAddress(addr),
        amount,
      ]),
    ];
  });
  console.log(
    `Batch transferring ${amt} ${symbol} to ${dest.length} recipients...`
  );

  const res = await client.sendUserOperation(
    simpleAccount.executeBatch(dest, data),
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
Example Command: yarn run simpleAccount batchErc20Transfer --token 0x65aFADD39029741B3b8f0756952C74678c9cEC93 --to 0x6F17961EE6bbDd1913942c6368C6DCE386F0b7AC,0xa76E79fb4A357A9828e5bA1843A81E253ABB3C5c,0xd8e11DCEf1ff460755E8E494AEb5185a0A3b7954 --amount 1


Example Transaction Hash: https://goerli.etherscan.io/tx/0x0870eb7c03ab61a56f21da1e66f149490a1c736e315b0f4f4fac9e2cbe17c263

*/
