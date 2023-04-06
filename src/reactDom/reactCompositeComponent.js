import instantiateReactComponent from "./instantiateReactComponent";
import reactUpdateQueue from "./reactUpdateQueue";
import { replaceChild } from "./domOperations";
import shouldUpdateReactComponent from "./shouldUpdateReactComponent";
import CallbackQueue from "./callbackQueue";

let mountOrder = 0;

export default class ReactCompositeComponent {
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
      CallbackQueue.queue(
        this._publicInstance.componentDidMount,
        this._publicInstance
      );
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
      {}
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
