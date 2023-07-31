import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { Presets } from "userop";
// @ts-ignore
import { getConfig } from "../../src";

export default async function main() {
  const { rpcUrl, signingKey } = getConfig();
  console.log("See signing key", signingKey);

  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new ethers.Wallet(signingKey),
    rpcUrl
  );
  const address = simpleAccount.getSender();

  console.log(`SimpleAccount address: ${address}`);
}

// Address: 0x2db75364436D41e2a97d533C92873Efa653902Db
