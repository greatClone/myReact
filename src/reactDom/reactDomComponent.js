import instantiateReactComponent from "./instantiateReactComponent";
import { appendChild, insertBefore, removeChild } from "./domOperations";
import { addEvent } from "./reactEventListener";

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
          const key = `.${index}:${
            subChild.key ? "$" + subChild.key : subIndex
          }`;
          map[key] = subChild;
        });
        return;
      }
      const key = `.${child.key ? "$" + child.key : index}`;
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
            type: "MOVE",
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
        type: "INSERT",
        component: componentInstance,
        lastComponent,
      });
      lastComponent = componentInstance;
    });

    // 遍历老数组，完成删除的标记
    Object.keys(this._renderChildren).forEach((key) => {
      if (!Reflect.has(nextElementMap, key)) {
        queue.push({
          type: "REMOVE",
          component: this._renderChildren[key],
        });
        Reflect.deleteProperty(this._renderChildren, key);
      }
    });

    // 处理更新
    queue.forEach((action) => {
      switch (action.type) {
        case "REMOVE":
          const removeNode = action.component._hostNode;
          removeChild(this._hostNode, removeNode);
          break;
        case "INSERT":
        case "MOVE":
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
