function addPollingTo(OriginClass) {
  const Klass = OriginClass;
  Klass.instancePool = [];
  Klass.poolsize = 10;
  Klass.getPooled = pooler;
  Klass.release = release;
  return Klass;
}

function pooler(...params) {
  const Klass = this;
  if (Klass.instancePool.length) {
    const instance = Klass.instancePool.pop();
    Klass.apply(instance, params);
    return instance;
  } else {
    return new Klass(...params);
  }
}

function release(instance) {
  const Klass = this;
  if (instance.destructor) {
    instance.destructor();
  }
  if (Klass.instancePool.length < Klass.poolsize) {
    Klass.instancePool.push(instance);
  }
}

export { addPollingTo };
