import { StudioConfig, StudioV1 } from "mbd-studio-sdk";

export function createStudio(wallet?: string) {
  const config = new StudioConfig({ apiKey: process.env.MBD_API_KEY! });
  const mbd = new StudioV1({ config });
  if (wallet) mbd.forUser("polymarket-wallets", wallet);
  return mbd;
}
