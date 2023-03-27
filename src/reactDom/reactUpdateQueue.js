import { enqueue } from "./reactUpdate";

const reactUpdateQueue = {
  enqueueSetState: function (publicInstance, partialState) {
    const internalInstance = publicInstance._internalInstance;
    const queue =
      internalInstance._pendingState || (internalInstance._pendingState = []);
    queue.push(partialState);
    enqueue(internalInstance);
  },
};

export default reactUpdateQueue;
