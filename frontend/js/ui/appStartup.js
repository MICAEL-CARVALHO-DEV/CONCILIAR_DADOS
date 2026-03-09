(function (global) {
  "use strict";

  var root = global.SEC_FRONTEND = global.SEC_FRONTEND || {};

  function noop() {}

  function initializeAppStartup(options) {
    var opts = options || {};
    var configureFrontendModules = typeof opts.configureFrontendModules === "function" ? opts.configureFrontendModules : noop;
    var loadUserConfig = typeof opts.loadUserConfig === "function" ? opts.loadUserConfig : noop;
    var bootstrapAppUi = typeof opts.bootstrapAppUi === "function" ? opts.bootstrapAppUi : null;
    var getAppLifecycleContext = typeof opts.getAppLifecycleContext === "function" ? opts.getAppLifecycleContext : function () { return {}; };
    var initSelects = typeof opts.initSelects === "function" ? opts.initSelects : noop;
    var setupAuthUi = typeof opts.setupAuthUi === "function" ? opts.setupAuthUi : noop;
    var setupCrossTabSync = typeof opts.setupCrossTabSync === "function" ? opts.setupCrossTabSync : noop;
    var render = typeof opts.render === "function" ? opts.render : noop;
    var initializeAuthFlow = typeof opts.initializeAuthFlow === "function" ? opts.initializeAuthFlow : noop;
    var bindUiShellEvents = typeof opts.bindUiShellEvents === "function" ? opts.bindUiShellEvents : null;
    var getUiShellBindingsContext = typeof opts.getUiShellBindingsContext === "function" ? opts.getUiShellBindingsContext : function () { return {}; };
    var bindImportControls = typeof opts.bindImportControls === "function" ? opts.bindImportControls : null;
    var getImportControlsContext = typeof opts.getImportControlsContext === "function" ? opts.getImportControlsContext : function () { return {}; };

    configureFrontendModules();
    loadUserConfig(false);

    if (bootstrapAppUi) {
      bootstrapAppUi(getAppLifecycleContext());
    } else {
      initSelects();
      setupAuthUi();
      setupCrossTabSync();
      render();
      initializeAuthFlow();
    }

    if (bindUiShellEvents) {
      bindUiShellEvents(getUiShellBindingsContext());
    }

    if (bindImportControls) {
      bindImportControls(getImportControlsContext());
    }
  }

  root.appStartupUtils = {
    initializeAppStartup: initializeAppStartup
  };
})(window);
