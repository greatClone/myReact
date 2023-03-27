export default class ReactTextComponent {
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
  updateComponent() {}

  //  卸载
  unmountComponent() {
    this._currentElement = null;
    this._hostNode = null;
  }
}
