export default function shouldUpdateReactComponent(prevElement, nextElement) {
  const isSameType = prevElement.type === nextElement.type;
  const isSameKey = prevElement.key === nextElement.key;
  return isSameKey && isSameType;
}
