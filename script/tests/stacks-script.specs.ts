import { StacksTestnet } from "@stacks/network";
import { StackingClient } from "@stacks/stacking";
import { fetchTransaction, wait } from "../utils/helper";
const logger = require("pino")(require("pino-pretty")());

const increaseAmountStacked = async (options: any, client: StackingClient) => {
  const { privateKey, increaseByStacks1, increaseByStacks2 } = options;

  try {
    logger.info("PROCESSING first increase stacked...");
    const option = {
      client,
      increaseByStacks: increaseByStacks1,
      privateKey,
    };
    const firstLockedAmount = await incStacks(option);
    if (!firstLockedAmount) {
      return;
    }
    logger.info("COMPLETED first increase stacked...");

    logger.info("PROCESSING second increase stacked...");
    option.increaseByStacks = increaseByStacks2;
    const secondLockedAmount = await incStacks(option);
    if (!secondLockedAmount) {
      return;
    }
    logger.info("COMPLETED second increase stacked...");

    if (secondLockedAmount - firstLockedAmount !== increaseByStacks2) {
      logger.info("Increase amount stacked did not worked properly");
      return 0;
    }
    const amountObj = {
      initial_locked_amount: firstLockedAmount - increaseByStacks1,
      final_locked_amount: secondLockedAmount,
    };

    logger.info("Increase amount stacked successful");
    logger.info(amountObj);
    return;
  } catch (e) {
    logger.error(
      "An error occurred while processing the Increase amount stacked script"
    );
    logger.error(e);
  }
};

const extendStacking = async (options: any, client: StackingClient) => {
  const { privateKey, extendCycles, poxAddress } = options;

  try {
    logger.info("CREATING the transaction for extend stacking...");
    const stackExtend = await client.stackExtend({
      extendCycles,
      poxAddress,
      privateKey,
    });

    let i = 1, stackExtendTXDetail;
    while (i < 7) {
      logger.info(
        `COUNT ${i}: FETCHING the anchor block transaction details for extend stacking...`
      );

      await wait(5 * 60 * 1000);
      stackExtendTXDetail = await getAnchorBlock(stackExtend.txid);

      if (!stackExtendTXDetail) {
        logger.info(
          "No anchor block transaction detail found for extend stacking"
        );
        i++;
      } else {
        logger.info(
          "COMPLETED fetching the anchor block transaction details for extend stacking..."
        );
        i = 7;
      }
    }

    if (!stackExtendTXDetail) {
      logger.info("TIMEOUT: Fetching anchor block transaction");
      return 0;
    }

    const status = stackExtendTXDetail.tx_status.toLowerCase();
    if(status !== 'success') {
      logger.error(`ERROR: The extending stacks transaction is in ${status} status`);
      return;
    }

    logger.info(`SUCCESS: The extending stacks transaction is in ${status} status`);
    return;
  } catch (e) {
    logger.error(
      "An error occurred while processing the Increase amount stacked script"
    );
    logger.error(e);
  }
};

export async function triggerStacksScript(options: any): Promise<void> {
  logger.info("CREATING client...");
  const network = new StacksTestnet();
  const client = new StackingClient(options.recipient, network);
  logger.info("COMPLETED creating client..");

  logger.info("STARTING script: INCREASE AMOUNT STACKED");
  await increaseAmountStacked(options, client);
  logger.info("COMPLETED script: INCREASE AMOUNT STACKED");

  logger.info("STARTING script: EXTEND STACKING");
  await extendStacking(options, client);
  logger.info("COMPLETED script: EXTEND STACKING");
}

export async function getAnchorBlock(txid: string): Promise<any> {
  const anchorBlockData = await fetchTransaction(txid);
  if (!anchorBlockData) {
    logger.info(`No anchor block data found`);
    return false;
  }
  // for anchor block tx we expect that the is_unanchored: false exist in that tx detail
  if (
    anchorBlockData.hasOwnProperty("is_unanchored") &&
    !anchorBlockData.is_unanchored
  ) {
    return anchorBlockData;
  }
}

async function incStacks(option) {
  logger.info("CREATING the transaction...");
  const increaseObj = await option.client.stackIncrease({
    increaseBy: option.increaseByStacks,
    privateKey: option.privateKey,
  });
  logger.info("COMPLETED creating the transaction...");

  let i = 1,
    firstTXDetail;

  while (i < 7) {
    logger.info(
      `COUNT ${i}: FETCHING the anchor block transaction details for increase stacked...`
    );
    await wait(5 * 60 * 1000);
    firstTXDetail = await getAnchorBlock(increaseObj.txid);

    if (!firstTXDetail) {
      logger.info(
        "No anchor block transaction detail found for increase stacked"
      );
      i++;
    } else {
      logger.info(
        "COMPLETED fetching the anchor block transaction details for increase stacked..."
      );
      i = 7;
    }
  }

  if (!firstTXDetail) {
    logger.info("TIMEOUT: Fetching anchor block transaction");
    return 0;
  }

  const lockedAmountObj = firstTXDetail.events?.find(
    (event) => event.event_type.toLowerCase() === "stx_lock"
  );
  if (!lockedAmountObj) {
    logger.info("No locked amount found for increase stacked");
    return;
  }

  logger.info(
    `Locked Amount: ${lockedAmountObj.stx_lock_event?.locked_amount}`
  );
  const lockedAmount = lockedAmountObj.stx_lock_event?.locked_amount;
  return lockedAmount;
}
