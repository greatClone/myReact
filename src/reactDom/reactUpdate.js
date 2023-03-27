import batchUpdateStrategy from "./batchUpdateStrategy";

let dirtyComponent = [];
let batchUpdateNum = 0;

function enqueue(internalInstance) {
  if (!batchUpdateStrategy.isBatchUpdate) {
    batchUpdateStrategy.batchUpdate(enqueue, internalInstance);
    return;
  }
  dirtyComponent.push(internalInstance);
  if (!internalInstance._batchUpdateNum) {
    internalInstance._batchUpdateNum = batchUpdateNum + 1;
  }
}

function flushBatchUpdate() {
  batchUpdateNum++;

  // 排序
  // 更新
  dirtyComponent.forEach((component) => {
    if (component._batchUpdateNum === batchUpdateNum) {
      component.updateComponent();
    }
  });
  // 整理
  dirtyComponent = [];
}

export { enqueue, flushBatchUpdate };
