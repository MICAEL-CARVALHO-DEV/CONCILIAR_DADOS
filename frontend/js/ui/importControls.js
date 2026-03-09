(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function pickRandom(arr) {
    if (!arr || !arr.length) return "";
    var i = Math.floor(Math.random() * arr.length);
    return arr[i];
  }

  function generateRandomMultiUserDemo(ctx) {
    var currentState = ctx.getState();
    if (!Array.isArray(currentState.records) || currentState.records.length === 0) {
      ctx.setState({ records: ctx.deepClone(ctx.DEMO).map(ctx.normalizeRecordShape) });
      currentState = ctx.getState();
    }

    var sampleSize = Math.min(currentState.records.length, 20);
    var targets = currentState.records.slice(0, sampleSize);

    targets.forEach(function (rec, idx) {
      for (var i = 0; i < ctx.DEMO_MULTI_USERS.length; i += 1) {
        var u = ctx.DEMO_MULTI_USERS[i];
        var st = pickRandom(ctx.STATUS);
        var note = pickRandom(ctx.DEMO_NOTES) + " [demo #" + String(idx + 1) + "]";
        rec.eventos.unshift(ctx.mkEvent("MARK_STATUS", {
          to: st,
          note: note,
          actor_user: u.name,
          actor_role: u.role
        }));
      }
      rec.updated_at = ctx.isoNow();
      ctx.syncCanonicalToAllFields(rec);
    });

    ctx.saveState();
    ctx.syncYearFilter();
    ctx.render();
    globalScope.alert("Demo aplicada: 4 usuarios com eventos aleatorios em " + String(sampleSize) + " emendas.");
  }

  function bindImportControls(options) {
    var opts = options || {};
    var btnReset = opts.btnReset || null;
    var fileCsv = opts.fileCsv || null;
    var canMutateRecords = typeof opts.canMutateRecords === "function" ? opts.canMutateRecords : function () { return false; };

    if (btnReset) {
      btnReset.addEventListener("click", function () {
        if (!canMutateRecords()) {
          globalScope.alert("Perfil SUPERVISAO nao pode resetar dados.");
          return;
        }
        if (!globalScope.confirm("Resetar para dados DEMO? Isso apaga alteracoes locais.")) return;
        opts.setState({ records: opts.deepClone(opts.DEMO).map(opts.normalizeRecordShape) });
        var nextState = opts.getState();
        opts.setIdCountersByYear(opts.buildIdCounters(nextState.records));
        opts.assignMissingIds(nextState.records, opts.getIdCountersByYear());
        opts.syncReferenceKeys(nextState.records);
        opts.saveState();
        opts.syncYearFilter();
        opts.render();
        opts.closeModal();
        opts.hideImportReport();
        opts.setLastImportedPlanilha1Aoa(null);
      });
    }

    if (fileCsv) {
      fileCsv.addEventListener("change", async function () {
        if (!canMutateRecords()) {
          globalScope.alert("Perfil SUPERVISAO nao pode importar planilhas.");
          fileCsv.value = "";
          return;
        }
        var file = fileCsv.files && fileCsv.files[0];
        if (!file) return;

        try {
          var sourceRows = await opts.parseInputFile(file);
          if (!sourceRows.length) {
            globalScope.alert("Nenhuma linha valida encontrada no arquivo.");
            opts.hideImportReport();
            return;
          }

          var removedDemo = opts.purgeDemoBeforeOfficialImport();
          if (removedDemo > 0) {
            var currentState = opts.getState();
            opts.setIdCountersByYear(opts.buildIdCounters((currentState && currentState.records) || []));
          }

          var report = opts.processImportedRows(sourceRows, file.name);
          opts.saveState();
          opts.syncYearFilter();
          opts.render();
          opts.showImportReport(report);
          var loteId = await opts.syncImportBatchToApi(file, report);
          if (loteId) {
            await opts.syncImportLinesToApi(loteId, report.rowDetails || []);
          }

          var extraDemoInfo = removedDemo > 0 ? (" | Demos removidos: " + String(removedDemo)) : "";
          globalScope.alert("Importacao concluida. Criados: " + report.created + " | Atualizados: " + report.updated + " | Sem alteracao: " + report.unchanged + " | Linhas lidas: " + report.totalRows + extraDemoInfo);
        } catch (err) {
          globalScope.console.error(err);
          var detail = err && err.message ? String(err.message) : "erro desconhecido";
          var hint = detail.includes("Biblioteca XLSX nao carregada") ? " Dica: abra por http://127.0.0.1:5500 e confirme internet para carregar a biblioteca XLSX." : "";
          globalScope.alert("Falha ao importar arquivo. Detalhe: " + detail + hint);
        } finally {
          fileCsv.value = "";
        }
      });
    }
  }

  root.importControlsUtils = {
    generateRandomMultiUserDemo: generateRandomMultiUserDemo,
    bindImportControls: bindImportControls
  };
})(typeof window !== "undefined" ? window : globalThis);

