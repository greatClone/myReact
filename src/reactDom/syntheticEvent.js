import { addPollingTo } from "./poolClass";

function SimpleEvent(event) {
  this.nativeEvent = event;
  this._dispatchEventListeners = [];

  for (const key in event) {
    // 处理一些兼容性问题
    this[key] = event[key];
  }

  let { target, type } = event;
  while (target) {
    const { store } = target;
    const listener = store && store["on" + type];
    if (listener) {
      this._dispatchEventListeners.push(listener);
    }
    target = target.parentNode;
  }
}

SimpleEvent.prototype.destructor = function () {
  this.nativeEvent = null;
  this._dispatchEventListeners = [];
};

const SyntheticEvent = addPollingTo(SimpleEvent);

export default SyntheticEvent;
