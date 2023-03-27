import instantiateReactComponent from "./instantiateReactComponent";
import { appendChild } from "./domOperations";
import { addEvent } from "./reactEventListener";

export default class ReactDomComponent {
  constructor(element) {
    this._currentElement = element;
    this._hostNode = null;
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
        if (k === "style") {
          for (const [sk, sv] of Object.entries(v)) {
            node.style[sk] = sv;
          }
          continue;
        }
        if (k.startsWith("on")) {
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

    children.forEach((child) => {
      const componentInstance = instantiateReactComponent(child);
      const childDom = componentInstance.mountComponent();
      appendChild(parentNode, childDom);
    });
  }

  //  更新
  updateComponent() {}

  //  卸载
  unmountComponent() {
    this._currentElement = null;
    this._hostNode = null;
  }
}
