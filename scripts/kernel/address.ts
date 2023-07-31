import { ethers } from "ethers";
import { Presets } from "userop";
// @ts-ignore
import { getConfig } from "../../src";

export default async function main() {
  const config = getConfig();
  const kernel = await Presets.Builder.Kernel.init(
    new ethers.Wallet(config.signingKey),
    config.rpcUrl
  );
  const address = kernel.getSender();

  console.log(`Kernel address: ${address}`);
}
