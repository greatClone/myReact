import { appendChild } from "./domOperations";
import instantiateReactComponent from "./instantiateReactComponent";
import batchUpdateStrategy from "./batchUpdateStrategy";
import CallbackQueue from "./callbackQueue";
import Transaction from "./Transaction";

function mount(element, container) {
  // 根据类型生成不同的操作实例
  const componentInstance = instantiateReactComponent(element);
  // 调用实例的mountComponent 生成真实的dom
  const node = componentInstance.mountComponent();
  // 挂载
  appendChild(container, node);
}

const ON_DOM_READY = {
  initialize: () => {},
  close: () => {
    CallbackQueue.notifyAll();
  },
};

function initRender(element, container) {
  const domTransaction = new Transaction([ON_DOM_READY]);
  domTransaction.perform(mount, null, element, container);
}

export default function render(element, container) {
  batchUpdateStrategy.batchUpdate(initRender, element, container);
}
