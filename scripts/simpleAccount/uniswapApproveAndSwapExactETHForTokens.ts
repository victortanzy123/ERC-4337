import { ethers } from "ethers";
import { Client, Presets } from "userop";
import {
  ERC20_ABI,
  WETH_ABI,
  UNISWAP_V2_ROUTER_ABI,
  CLIOpts,
  getConfig,
} from "../../src";

export default async function main(
  tkn: string,
  uniswapV2RouterAddress: string, //Mainnet & Goerli - 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
  wethAddress: string, //Goerli - 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6
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
  const sender = simpleAccount.getSender();

  const erc20TokenContract = new ethers.Contract(token, ERC20_ABI, provider);

  const weth = ethers.utils.getAddress(wethAddress);
  const wethInterface = new ethers.utils.Interface(WETH_ABI);
  const wethContract = new ethers.Contract(weth, WETH_ABI, provider);

  const [tokenSymbol, tokenDecimals, wethDecimals] = await Promise.all([
    erc20TokenContract.symbol(),
    erc20TokenContract.decimals(),
    wethContract.decimals(),
  ]);

  const amount = ethers.utils.parseUnits(amt, wethDecimals);

  // Functions to be executed
  // 1. Approve WETH
  const approveWeth = wethInterface.encodeFunctionData("approve", [
    uniswapV2RouterAddress,
    amount,
  ]);

  const uniswapV2RouterInterface = new ethers.utils.Interface(
    UNISWAP_V2_ROUTER_ABI
  );
  const amountOutMin = "1"; // For testing purposes, should NOT be 0 as it will allow frontrunning.
  const deadline = (Math.floor(Date.now() / 1000) + 60 * 20).toString(); //20 minutes from current unix time
  const path = [wethAddress, tkn];

  const swapExactETHForTokensCalldata =
    uniswapV2RouterInterface.encodeFunctionData("swapExactETHForTokens", [
      amountOutMin,
      path,
      sender,
      deadline,
    ]);

  // const dest: Array<string> = [wethAddress, uniswapV2RouterAddress];
  // const data: Array<string> = [approveWeth, swapExactETHForTokensCalldata];

  console.log(`Approving and Swapping ${amt} WETH...`);

  const res1 = await client.sendUserOperation(
    simpleAccount.execute(wethAddress, 0, approveWeth),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(`UserOpHash: ${res1.userOpHash}`);

  const ev1 = await res1.wait();
  console.log(`Transaction hash: ${ev1?.transactionHash ?? null}`);

  const res2 = await client.sendUserOperation(
    simpleAccount.execute(
      uniswapV2RouterAddress,
      amount,
      swapExactETHForTokensCalldata
    ),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );

  console.log(`UserOpHash: ${res2.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev2 = await res2.wait();
  console.log(`Transaction hash: ${ev2?.transactionHash ?? null}`);
}

/*
Example Command: yarn run simpleAccount uniswapApproveAndSwap --token 0x65aFADD39029741B3b8f0756952C74678c9cEC93 --routerAddr
ess 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D --weth 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6 --amount 0.00001 --dryRun

Token Used USDC



Getting back 727 - await simpleAccount.proxy.owner()

**NOTES:

--dryRun flag allows previewing of transaction -> Fork logic for staticCall
--SimpleAccount.sol to be used.



Example Transaction hash of swap:
https://goerli.etherscan.io/tx/0xe9e98aff5422cfc5a969d25ed85ae0ed0f6d66ec5cf4d9919d92026aa72e6c5d
*/
