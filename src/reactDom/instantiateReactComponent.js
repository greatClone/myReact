import { REACT_TEXT } from "../shared/constants";
import ReactTextComponent from "./reactTextComponent";
import ReactDomComponent from "./reactDomComponent";
import ReactCompositeComponent from "./reactCompositeComponent";

export default function instantiateReactComponent(element) {
  if (!element) {
    return;
  }
  const { type, $$typeof } = element;
  // 文本节点
  if ($$typeof === REACT_TEXT) {
    return new ReactTextComponent(element);
  }
  //  dom 节点
  if (typeof type === "string") {
    return new ReactDomComponent(element);
  }
  //  自定义组件
  return new ReactCompositeComponent(element);
}
