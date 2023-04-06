class CallbackQueue {
  constructor() {
    this.callbacks = [];
    this.contexts = [];
  }
  reset() {
    this.callbacks = [];
    this.contexts = [];
  }
  queue(callback, context) {
    this.callbacks.push(callback);
    this.contexts.push(context);
  }
  notifyAll() {
    const callbacks = this.callbacks;
    const contexts = this.contexts;
    callbacks.forEach((callback, index) => {
      callback.call(contexts[index]);
    });
    this.reset();
  }
}

export default new CallbackQueue();
