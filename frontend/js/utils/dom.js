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

  function appendRenderedMarkup(container, rendered) {
    if (!container || rendered == null) return;

    var isNode = (typeof Node !== "undefined" && rendered instanceof Node)
      || (typeof DocumentFragment !== "undefined" && rendered instanceof DocumentFragment);
    if (isNode) {
      container.appendChild(rendered);
      return;
    }

    var html = String(rendered);
    if (!html) return;

    if (typeof DOMParser === "function") {
      var parser = new DOMParser();
      var doc = parser.parseFromString("<body>" + html + "</body>", "text/html");
      var body = doc && doc.body;
      if (body && body.childNodes) {
        while (body.firstChild) {
          container.appendChild(body.firstChild);
        }
        return;
      }
    }

    if (typeof document.createRange === "function") {
      var fragment = document.createRange().createContextualFragment(html);
      container.appendChild(fragment);
      return;
    }

    var temp = document.createElement("div");
    temp.innerHTML = html;
    while (temp.firstChild) {
      container.appendChild(temp.firstChild);
    }
  }

  root.domUtils = {
    clearChildren: clearChildren,
    appendRenderedMarkup: appendRenderedMarkup,
    setText: setText,
    toggleHidden: toggleHidden
  };
})(window);
