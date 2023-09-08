import { triggerStacksScript } from "./tests/stacks-script.specs";
require("dotenv").config({ path: ".env" });

const options = {
  // private key for transaction signing
  privateKey: process.env.private_key,
  // wallet address
  recipient: process.env.recipient,
  //how much to increase by, in microSTX
  increaseByStacks1: 10,
  //how much to increase by, in microSTX
  increaseByStacks2: 20,
  // number cycles to extend stacking by
  extendCycles: 1,
  // a BTC address for reward payouts
  poxAddress: process.env.pox_address,
};

// trigger stacks script
triggerStacksScript(options);
