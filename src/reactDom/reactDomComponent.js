import instantiateReactComponent from "./instantiateReactComponent";
import { appendChild, insertBefore, removeChild } from "./domOperations";
import { addEvent } from "./reactEventListener";
import shouldUpdateReactComponent from "./shouldUpdateReactComponent";

export default class ReactDomComponent {
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

    const childrenMap = this.getChildrenMap(children);

    Object.keys(childrenMap).forEach((key, index) => {
      const element = childrenMap[key];
      const componentInstance = instantiateReactComponent(element);
      const childNode = componentInstance.mountComponent();
      this._renderChildren[key] = componentInstance;
      this._mountIndex = index;
      appendChild(parentNode, childNode);
    });
  }

  getChildrenMap = (children) => {
    let map = {};
    children.forEach((child, index) => {
      if (Array.isArray(child)) {
        child.forEach((subChild, subIndex) => {
          const key = `.${index}:${
            subChild.key ? "$" + subChild.key : subIndex
          }`;
          map[key] = subChild;
        });
      } else if (child) {
        const key = `.${child.key ? "$" + child.key : index}`;
        map[key] = child;
      }
    });
    return map;
  };

  getDomProps = (element) => {
    const { children, ...otherProps } = element;
    return otherProps;
  };

  //  更新
  updateComponent(nextElement) {
    // 更新属性
    const prevProps = this.getDomProps(this._currentElement);
    const nextProps = this.getDomProps(nextElement);
    this.updateProperties(prevProps, nextProps);

    // 更新子元素
    this.renderChildrenDiff(nextElement);
  }

  renderChildrenDiff(nextElement) {
    const prevComponentMap = this._renderChildren;
    const nextElementMap = this.getChildrenMap(nextElement.props.children);

    console.log(1111, prevComponentMap);
    console.log(222, nextElementMap);

    let lastIndex = 0;
    let lastComponent = null;
    let queue = [];

    // 遍历新数组，完成 新增 和 复用
    Object.entries(nextElementMap).forEach(([key, nextElement], index) => {
      const prevComponent = prevComponentMap[key];
      // 复用
      if (
        prevComponent &&
        shouldUpdateReactComponent(prevComponent._currentElement, nextElement)
      ) {
        prevComponent.updateComponent(nextElement);
        if (lastIndex > 0 && prevComponent._mountIndex < lastIndex) {
          queue.push({
            type: "MOVE",
            component: prevComponent,
            lastComponent,
          });
        }
        lastIndex = Math.max(prevComponent._mountIndex, lastIndex);
        lastComponent = prevComponent;
        prevComponent._mountIndex = index;
        return;
      }
      // 新增
      const nextComponentInstance = instantiateReactComponent(nextElement);
      nextComponentInstance.mountComponent();
      queue.push({
        type: "INSERT",
        component: nextComponentInstance,
        lastComponent,
      });
      lastComponent = nextComponentInstance;
      nextComponentInstance._mountIndex = index;
      this._renderChildren[key] = nextComponentInstance;
    });

    // 遍历老数组，完成 删除
    Object.keys(prevComponentMap).forEach((key) => {
      if (!Reflect.has(nextElementMap, key)) {
        queue.push({
          type: "REMOVE",
          component: prevComponentMap[key],
        });
        Reflect.deleteProperty(this._renderChildren, key);
      }
    });

    console.log(9999, queue);

    // 统一挂载
    const parentNode = this._hostNode;
    queue.forEach((action) => {
      switch (action.type) {
        case "REMOVE":
          removeChild(parentNode, action.component._hostNode);
          break;
        case "INSERT":
        case "MOVE":
          const node = action.component._hostNode;
          const referenceNode =
            action.lastComponent?._hostNode.nextSibling ||
            parentNode.firstChild;
          insertBefore(parentNode, node, referenceNode);
          break;
        default:
          break;
      }
    });
  }

  //  卸载
  unmountComponent() {
    this._currentElement = null;
    this._hostNode = null;
  }
}
