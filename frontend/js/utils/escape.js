(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#039;");
  }

  root.escapeUtils = {
    escapeHtml: escapeHtml
  };
})(window);
