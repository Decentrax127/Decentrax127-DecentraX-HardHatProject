import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "FcmYpFPs6pB_hcMa4cRP6eAxPsJz3qFM",
  network: Network.ARB_MAINNET,
};

const alchemy = new Alchemy(config);

const main = async () => {
  try {
    let blockNumber = await alchemy.core.getBlockNumber();
    console.log("Current block number:", blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }
};

main();

