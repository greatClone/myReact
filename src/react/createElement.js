import { REACT_ELEMENT, REACT_TEXT } from "../shared/constants";

function toObject(element) {
  if (typeof element === "string" || typeof element === "number") {
    return {
      content: element,
      $$typeof: REACT_TEXT,
    };
  }
  return element;
}

export default function createElement(type, config, ...children) {
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
