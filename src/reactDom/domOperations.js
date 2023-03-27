function appendChild(container, node) {
  container.appendChild(node);
}

function replaceChild(nextNode, prevNode) {
  prevNode.parentNode.replaceChild(nextNode, prevNode);
}

export { appendChild, replaceChild };
