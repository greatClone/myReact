class Transaction {
  constructor(wrappers) {
    this.wrappers = wrappers;
  }

  initializeAll() {
    this.wrappers.forEach((wrapper) => {
      wrapper.initialize();
    });
  }

  perform(method, scope, ...params) {
    this.initializeAll();
    method.apply(scope, params);
    this.closeAll();
  }

  closeAll() {
    this.wrappers.forEach((wrapper) => {
      wrapper.close();
    });
  }
}

export default Transaction;
