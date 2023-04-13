function appendChild(container, node) {
  container.appendChild(node);
}

function replaceChild(nextNode, prevNode) {
  prevNode.parentNode.replaceChild(nextNode, prevNode);
}

function removeChild(parentNode, node) {
  parentNode.removeChild(node);
}

function insertBefore(parentNode, node, referenceNode) {
  parentNode.insertBefore(node, referenceNode);
}

export { appendChild, replaceChild, removeChild, insertBefore };
