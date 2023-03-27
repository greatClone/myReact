import SyntheticEvent from "./syntheticEvent";
import batchUpdateStrategy from "./batchUpdateStrategy";

function addEvent(node, type, listener) {
  // 收集
  const store = node.store || (node.store = {});
  store[type] = listener;

  // 注册
  if (!document[type]) {
    document[type] = function (event) {
      batchUpdateStrategy.batchUpdate(dispatchEvent, event);
    };
  }
}

function dispatchEvent(event) {
  // 获取合成事件
  const syntheticEvent = SyntheticEvent.getPooled(event);

  // 批量执行
  syntheticEvent._dispatchEventListeners.forEach((listener) => {
    listener(syntheticEvent);
  });

  // 释放
  SyntheticEvent.release(syntheticEvent);
}

export { addEvent };
