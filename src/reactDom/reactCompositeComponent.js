import instantiateReactComponent from "./instantiateReactComponent";
import reactUpdateQueue from "./reactUpdateQueue";
import { replaceChild } from "./domOperations";

export default class ReactCompositeComponent {
  constructor(element) {
    this._currentElement = element;
    this._hostNode = null;
    this._pendingState = null;
  }

  // 挂载
  mountComponent() {
    let node = null;
    // 获取真实的dom
    const element = this.getValidatedElement();
    const componentInstance = instantiateReactComponent(element);
    node = componentInstance.mountComponent();
    this._hostNode = node;
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

    // 清理
    const instance = instantiateReactComponent(nextElement);
    const nextNode = instance.mountComponent();
    replaceChild(nextNode, this._hostNode);

    this._batchUpdateNum = null;
  }

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
