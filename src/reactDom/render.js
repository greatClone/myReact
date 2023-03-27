import { appendChild } from "./domOperations";
import instantiateReactComponent from "./instantiateReactComponent";

export default function render(element, container) {
  // 根据类型生成不同的操作实例
  const componentInstance = instantiateReactComponent(element);
  // 调用实例的mountComponent 生成真实的dom
  const node = componentInstance.mountComponent();
  // 挂载
  appendChild(container, node);
}
