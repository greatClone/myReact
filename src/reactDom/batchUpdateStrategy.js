import Transaction from "./Transaction";
import { flushBatchUpdate } from "./reactUpdate";

const RESET_BATCH_UPDATE = {
  initialize: () => {},
  close: () => (batchUpdateStrategy.isBatchUpdate = false),
};

const FLUSH_BATCH_UPDATE = {
  initialize: () => {},
  close: () => flushBatchUpdate(),
};

const transaction = new Transaction([FLUSH_BATCH_UPDATE, RESET_BATCH_UPDATE]);

const batchUpdateStrategy = {
  isBatchUpdate: false,
  batchUpdate: function (method, ...params) {
    const alreadyBatchUpdate = batchUpdateStrategy.isBatchUpdate;
    batchUpdateStrategy.isBatchUpdate = true;
    if (alreadyBatchUpdate) {
      method.apply(null, params);
    } else {
      transaction.perform(method, null, ...params);
    }
  },
};

export default batchUpdateStrategy;
