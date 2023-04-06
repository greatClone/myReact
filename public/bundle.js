(function () {
  'use strict';

  const REACT_ELEMENT = Symbol('react_element');
  const REACT_TEXT = Symbol('react_text');

  function toObject(element) {
    if (typeof element === 'string' || typeof element === 'number') {
      return {
        content: element,
        $$typeof: REACT_TEXT,
      };
    }
    return element;
  }
  function createElement(type, config, ...children) {
    let key = null;
    let ref = null;
    let props = {};

    // key/ref
    if (config) {
      key = config.key || null;
      ref = config.ref || null;
      Reflect.deleteProperty(config, key);
      Reflect.deleteProperty(config, ref);
      // props,
      props = config;
    }
    if (children.length > 0) {
      props.children = children.map((child) => toObject(child));
    }
    // children

    return {
      type,
      key,
      ref,
      props,
      $$typeof: REACT_ELEMENT,
    };
  }

  class Component {
    constructor(props, context, updater) {
      this.props = props;
      this.constext = {};
      this.refs = {};
      this.updater = null;
    }
    static isReactComponent = true;
    setState(partialState) {
      this.updater.enqueueSetState(this, partialState);
    }
  }

  var React = {
    createElement: createElement,
    Component: Component,
  };

  function appendChild(container, node) {
    container.appendChild(node);
  }
  function replaceChild(nextNode, prevNode) {
    prevNode.parentNode.replaceChild(nextNode, prevNode);
  }
  function removeChild(container, node) {
    container.removeChild(node);
  }
  function insertBefore(parentNode, node, referenceNode) {
    parentNode.insertBefore(node, referenceNode);
  }

  class ReactTextComponent {
    constructor(element) {
      this._currentElement = element;
      this._hostNode = null;
    }

    // 挂载
    mountComponent() {
      let textNode = null;
      const { content } = this._currentElement;
      textNode = document.createTextNode(content);
      this._hostNode = textNode;
      return textNode;
    }

    //  更新
    updateComponent(nextElement) {
      const { content } = nextElement;
      const nextNode = document.createTextNode(content);
      replaceChild(nextNode, this._hostNode);
      this._hostNode = nextNode;
    }

    //  卸载
    unmountComponent() {
      this._currentElement = null;
      this._hostNode = null;
    }
  }

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
      const listener = store && store['on' + type];
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
    dirtyComponent.sort((a, b) => b._mountOrder - a._mountOrder);
    // 更新

    dirtyComponent.forEach((component) => {
      if (component._batchUpdateNum === batchUpdateNum) {
        component.updateComponent();
      }
    });
    // 整理
    dirtyComponent = [];
  }

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

  class ReactDomComponent {
    constructor(element) {
      this._currentElement = element;
      this._hostNode = null;
      this._renderChildren = {};
    }

    // 挂载
    mountComponent() {
      let node = null;
      const { type, props } = this._currentElement;
      node = document.createElement(type);
      this._hostNode = node;
      const { children, ...otherProps } = props;

      // 挂载props
      this.updateProperties(null, otherProps);
      // 挂载 children
      this.createInitialChildren(children);
      return node;
    }
    updateProperties(lastProps, nextProps) {
      const node = this._hostNode;
      // 遍历 nextProps
      if (nextProps) {
        for (const [k, v] of Object.entries(nextProps)) {
          if (k === 'style') {
            for (const [sk, sv] of Object.entries(v)) {
              node.style[sk] = sv;
            }
            continue;
          }
          if (k.startsWith('on')) {
            addEvent(node, k.toLowerCase(), v);
            continue;
          }
          // 一般类型
          node[k] = v;
        }
      }
      // 遍历 lastProps
      if (lastProps) {
        for (const k of Object.keys(lastProps)) {
          if (!Reflect.has(nextProps, k)) {
            node[k] = null;
          }
          ////
        }
      }
    }

    createInitialChildren(children) {
      if (!children) {
        return;
      }
      const parentNode = this._hostNode;
      // 获取所有的子节点
      const images = [];
      const childrenMap = this._getFlatChildrenMap(children);
      Object.entries(childrenMap).forEach(([key, element], index) => {
        const componentInstance = instantiateReactComponent(element);
        const childNode = componentInstance.mountComponent();
        images.push(childNode);
        componentInstance._mountIndex = index;
        this._renderChildren[key] = componentInstance;
      });

      // 挂载
      images.forEach((child) => {
        appendChild(parentNode, child);
      });
    }

    // 获取children map
    _getFlatChildrenMap = (children) => {
      const map = {};
      children.forEach((child, index) => {
        if (Array.isArray(child)) {
          child.forEach((subChild, subIndex) => {
            const key = `.${index}:${subChild.key ? '$' + subChild.key : subIndex}`;
            map[key] = subChild;
          });
          return;
        }
        const key = `.${child.key ? '$' + child.key : index}`;
        map[key] = child;
      });
      return map;
    };

    // 获取 dom 元素
    _getDomProps = (element) => {
      const { children, ...domProps } = element.props;
      return domProps;
    };

    //  更新
    updateComponent(nextElement) {
      // 更新 dom 属性
      const prevProps = this._getDomProps(this._currentElement);
      const nextProps = this._getDomProps(nextElement);
      this.updateProperties(prevProps, nextProps);

      // 更新子元素
      this.updateChildren(nextElement);
    }
    updateChildren = (nextElement) => {
      const prevChildren = this._renderChildren;
      const nextElementMap = this._getFlatChildrenMap(nextElement.props.children);
      let lastIndex = 0;
      let lastComponent = null;
      const queue = [];
      // 遍历新数组，完成新增及移动的标记
      Object.entries(nextElementMap).forEach(([key, nextElement], index) => {
        const prevComponent = prevChildren[key];
        if (prevComponent) {
          prevComponent.updateComponent(nextElement);
          if (prevComponent._mountIndex < lastIndex) {
            // 移动
            queue.push({
              type: 'MOVE',
              component: prevComponent,
              lastComponent,
            });
          }
          lastIndex = Math.max(prevComponent._mountIndex, lastIndex);
          prevComponent._mountIndex = index;
          lastComponent = prevComponent;
          return;
        }

        // 新增
        const componentInstance = instantiateReactComponent(nextElement);
        componentInstance.mountComponent();
        componentInstance._mountIndex = index;
        this._renderChildren[key] = componentInstance;
        queue.push({
          type: 'INSERT',
          component: componentInstance,
          lastComponent,
        });
        lastComponent = componentInstance;
      });

      // 遍历老数组，完成删除的标记
      Object.keys(this._renderChildren).forEach((key) => {
        if (!Reflect.has(nextElementMap, key)) {
          queue.push({
            type: 'REMOVE',
            component: this._renderChildren[key],
          });
          Reflect.deleteProperty(this._renderChildren, key);
        }
      });

      // 处理更新
      queue.forEach((action) => {
        switch (action.type) {
          case 'REMOVE':
            const removeNode = action.component._hostNode;
            removeChild(this._hostNode, removeNode);
            break;
          case 'INSERT':
          case 'MOVE':
            const nextNode = action.component._hostNode;
            const referenceNode = action.lastComponent._hostNode.nextSibling;
            insertBefore(this._hostNode, nextNode, referenceNode);
        }
      });
    };

    //  卸载
    unmountComponent() {
      this._currentElement = null;
      this._hostNode = null;
    }
  }

  const reactUpdateQueue = {
    enqueueSetState: function (publicInstance, partialState) {
      const internalInstance = publicInstance._internalInstance;
      const queue = internalInstance._pendingState || (internalInstance._pendingState = []);
      queue.push(partialState);
      enqueue(internalInstance);
    },
  };

  function shouldUpdateReactComponent(prevElement, nextElement) {
    const isSameType = prevElement.type === nextElement.type;
    const isSameKey = prevElement.key === nextElement.key;
    return isSameKey && isSameType;
  }

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
  var CallbackQueue$1 = new CallbackQueue();

  let mountOrder = 0;
  class ReactCompositeComponent {
    constructor(element) {
      this._currentElement = element;
      this._hostNode = null;
      this._pendingState = [];
      this._renderComponent = null;
    }

    // 挂载
    mountComponent() {
      let node = null;
      // 获取真实的dom
      const element = this.getValidatedElement();
      const componentInstance = instantiateReactComponent(element);
      node = componentInstance.mountComponent();
      this._hostNode = node;
      this._renderComponent = componentInstance;
      this._mountOrder = mountOrder++;
      if (this._publicInstance.componentDidMount) {
        CallbackQueue$1.queue(this._publicInstance.componentDidMount, this._publicInstance);
      }
      return node;
    }
    getValidatedElement() {
      let element = null;
      const { type, props } = this._currentElement;
      if (type.isReactComponent) {
        const publicInstance = new type();
        publicInstance.props = props;
        publicInstance.context = {};
        publicInstance.updater = reactUpdateQueue;
        this._publicInstance = publicInstance;
        publicInstance._internalInstance = this;
        element = publicInstance.render();
      } else {
        element = type(props);
      }
      return element;
    }

    //  更新
    updateComponent() {
      //获取最新 state
      const nextState = this.getNextState();
      // 更新
      const publicInstance = this._publicInstance;
      publicInstance.state = nextState;
      const nextElement = publicInstance.render();
      this.updateRenderComponent(nextElement);
      // 清理
      this._batchUpdateNum = null;
    }
    updateRenderComponent = (nextElement) => {
      const prevComponent = this._renderComponent;
      const prevElement = prevComponent._currentElement;
      // 如果类型不同, 卸载老的，加载新的
      if (!shouldUpdateReactComponent(prevElement, nextElement)) {
        const nextComponentInstance = instantiateReactComponent(nextElement);
        const nextNode = nextComponentInstance.mountComponent();
        replaceChild(nextNode, this._hostNode);
        this._hostNode = nextNode;
        this._renderComponent = nextComponentInstance;
        return;
      }
      // 如果类型相同, 则对老组件进行更新
      prevComponent.updateComponent(nextElement);
    };
    getNextState = () => {
      const publicInstance = this._publicInstance;
      const nextState = this._pendingState.reduce(
        (acc, cur) => ({
          ...acc,
          ...cur,
        }),
        {},
      );
      return {
        ...publicInstance.state,
        ...nextState,
      };
    };

    //  卸载
    unmountComponent() {
      this._currentElement = null;
      this._hostNode = null;
    }
  }

  function instantiateReactComponent(element) {
    if (!element) {
      return;
    }
    const { type, $$typeof } = element;
    // 文本节点
    if ($$typeof === REACT_TEXT) {
      return new ReactTextComponent(element);
    }
    //  dom 节点
    if (typeof type === 'string') {
      return new ReactDomComponent(element);
    }
    //  自定义组件
    return new ReactCompositeComponent(element);
  }

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
      CallbackQueue$1.notifyAll();
    },
  };
  function initRender(element, container) {
    const domTransaction = new Transaction([ON_DOM_READY]);
    domTransaction.perform(mount, null, element, container);
  }
  function render(element, container) {
    batchUpdateStrategy.batchUpdate(initRender, element, container);
  }

  var ReactDom = {
    render: render,
  };

  // const element = (
  //   <div
  //     className={"text"}
  //     style={{ color: "red" }}
  //     onClick={() => console.log(3333)}
  //   >
  //     hello world
  //     <h1 onClick={() => console.log(222)}>我是h11</h1>
  //   </div>
  // );

  // function FunctionComponent() {
  //   return element;
  // }

  class Test extends React.Component {
    constructor() {
      super();
      this.state = {
        a: 3,
      };
    }
    componentDidMount() {
      console.log('子节点挂载');
      this.setState({
        a: 8,
      });
      // console.log("子节点", this.state.a);
    }

    render() {
      console.log('render--');
      return /*#__PURE__*/ React.createElement(
        'div',
        {
          onClick: () =>
            this.setState({
              a: 4,
            }),
        },
        '\u6211\u662F Test,',
        this.state.a,
        ' ',
      );
    }
  }
  class ClassComponent extends React.Component {
    constructor() {
      super();
      this.state = {
        a: 1,
        arr: [1, 3, 5],
      };
    }
    componentDidMount() {
      console.log('父节点挂载');
      this.setState({
        a: 6,
      });
      // console.log("父节点", this.state.a);
    }

    render() {
      return /*#__PURE__*/ React.createElement(
        'div',
        {
          className: 'text',
          style: {
            color: 'red',
          },
        },
        /*#__PURE__*/ React.createElement('h1', null, 'hello world -- ', this.state.a),
        /*#__PURE__*/ React.createElement(Test, null),
      );
    }
  }
  console.dir(/*#__PURE__*/ React.createElement(ClassComponent, null));
  ReactDom.render(/*#__PURE__*/ React.createElement(ClassComponent, null), document.getElementById('root'));
})();
//# sourceMappingURL=bundle.js.map
