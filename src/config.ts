import dotenv from "dotenv";
dotenv.config();

// @ts-ignore
import config from "../config.json";

export type Config = {
  rpcUrl: string;
  signingKey: string;
  paymaster: {
    rpcUrl: string;
    context: any;
  };
};

export function getConfig(): Config {
  let res = config as Config;

  res.rpcUrl = res.rpcUrl.replace(
    "${STACK_UP_API_KEY}",
    process.env.STACK_UP_API_KEY || ""
  );
  res.signingKey = res.signingKey.replace(
    "${PRIVATE_KEY_727}",
    process.env.PRIVATE_KEY_727 || ""
  );
  res.paymaster.rpcUrl = res.paymaster.rpcUrl.replace(
    "${STACK_UP_API_KEY}",
    process.env.STACK_UP_API_KEY || ""
  );

  return res;
}
