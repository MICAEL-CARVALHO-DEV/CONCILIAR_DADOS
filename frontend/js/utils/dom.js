(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function clearChildren(node) {
    if (!node) return;
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function setText(node, value) {
    if (!node) return;
    node.textContent = value == null ? "" : String(value);
  }

  function toggleHidden(node, hidden) {
    if (!node) return;
    node.classList.toggle("hidden", !!hidden);
    node.setAttribute("aria-hidden", hidden ? "true" : "false");
  }

  root.domUtils = {
    clearChildren: clearChildren,
    setText: setText,
    toggleHidden: toggleHidden
  };
})(window);
