import instantiateReactComponent from "./instantiateReactComponent";
import reactUpdateQueue from "./reactUpdateQueue";
import { replaceChild } from "./domOperations";
import shouldUpdateReactComponent from "./shouldUpdateReactComponent";

let mountOrder = 0;

export default class ReactCompositeComponent {
  constructor(element) {
    this._currentElement = element;
    this._hostNode = null;
    this._pendingState = [];
    this._renderComponent = null;
    this._mountOrder = 0;
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
    this.renderUpdateComponent(nextElement);

    // 清理
    this._batchUpdateNum = null;
  }

  renderUpdateComponent(nextElement) {
    const prevElement = this._renderComponent._currentElement;
    if (!shouldUpdateReactComponent(prevElement, nextElement)) {
      const componentInstance = instantiateReactComponent(nextElement);
      const node = componentInstance.mountComponent();
      replaceChild(node, this._hostNode);
      this._hostNode = node;
      this._renderComponent = componentInstance;
      return;
    }

    this._renderComponent.updateComponent(nextElement);
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
