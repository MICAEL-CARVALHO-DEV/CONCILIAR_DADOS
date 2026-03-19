(function (globalScope) {
  "use strict";

  var root = globalScope.SECFrontend = globalScope.SECFrontend || globalScope.SEC_FRONTEND || {};
  globalScope.SEC_FRONTEND = root;

  function pickRandom(arr) {
    if (!arr || !arr.length) return "";
    var i = Math.floor(Math.random() * arr.length);
    return arr[i];
  }

  function buildAuthoritativeImportReport(preview, fallbackFileName) {
    var source = preview && typeof preview === "object" ? preview : {};
    return {
      fileName: source.fileName || fallbackFileName || "importacao.xlsx",
      fileHash: source.fileHash || "",
      totalRows: Number(source.totalRows || 0),
      consideredRows: Number(source.consideredRows || 0),
      skippedRows: Number(source.skippedRows || 0),
      invalidRows: Number(source.invalidRows || 0),
      created: Number(source.created || 0),
      updated: Number(source.updated || 0),
      unchanged: Number(source.unchanged || 0),
      duplicateById: Number(source.duplicateById || 0),
      duplicateByRef: Number(source.duplicateByRef || 0),
      duplicateInFile: Number(source.duplicateInFile || 0),
      conflictIdVsRef: Number(source.conflictIdVsRef || 0),
      sheetNames: Array.isArray(source.sheetNames) ? source.sheetNames.slice() : [],
      rowDetails: Array.isArray(source.rowDetails) ? source.rowDetails.slice() : [],
      validation: source.validation || null,
      newRowsPreview: Array.isArray(source.newRowsPreview) ? source.newRowsPreview.slice() : [],
      planilha1Aoa: Array.isArray(source.planilha1Aoa) ? source.planilha1Aoa : null
    };
  }

  function generateRandomMultiUserDemo(ctx) {
    if (typeof ctx.canUseDemoTools === "function" && !ctx.canUseDemoTools()) {
      globalScope.alert("A demo de usuarios so pode ser aplicada na Pagina de teste.");
      return;
    }
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
    var canImportData = typeof opts.canImportData === "function" ? opts.canImportData : canMutateRecords;

    if (btnReset) {
      btnReset.addEventListener("click", function () {
        if (typeof opts.canUseDemoTools === "function" && !opts.canUseDemoTools()) {
          globalScope.alert("O reset de demo so pode ser usado na Pagina de teste.");
          return;
        }
        if (!canMutateRecords()) {
          globalScope.alert("Perfil atual nao pode resetar dados neste workspace.");
          return;
        }
        if (!globalScope.confirm("Resetar a Pagina de teste para dados DEMO? Isso apaga alteracoes locais deste workspace.")) return;
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
        if (!canImportData()) {
          globalScope.alert("Usuario sem permissao para importar planilhas.");
          fileCsv.value = "";
          return;
        }
        var file = fileCsv.files && fileCsv.files[0];
        if (!file) return;

        try {
          var canUsePreviewApi = typeof opts.canUseImportPreviewApi === "function"
            ? !!opts.canUseImportPreviewApi()
            : (typeof opts.isApiEnabled === "function" && !!opts.isApiEnabled());
          var shouldSyncImportToApi = typeof opts.shouldSyncImportToApi === "function"
            ? !!opts.shouldSyncImportToApi()
            : false;
          if (shouldSyncImportToApi && typeof opts.canOperateCentralData === "function" && !opts.canOperateCentralData()) {
            globalScope.alert(
              (typeof opts.getCentralSyncBlockReason === "function" && opts.getCentralSyncBlockReason())
                || "API indisponivel para importar a planilha oficial."
            );
            return;
          }
          var useBackendPreview = canUsePreviewApi && typeof opts.previewImportXlsx === "function";
          var sourceRows = [];
          var authoritativePreview = null;
          var report = null;
          var previousStateSnapshot = shouldSyncImportToApi ? opts.deepClone(opts.getState()) : null;
          var previousCountersSnapshot = shouldSyncImportToApi ? opts.deepClone(opts.getIdCountersByYear()) : null;

          if (!useBackendPreview) {
            throw new Error("Importacao exige API ativa para preview Python.");
          }

          authoritativePreview = await opts.previewImportXlsx(file);
          sourceRows = Array.isArray(authoritativePreview && authoritativePreview.sourceRows)
            ? authoritativePreview.sourceRows.map(function (item) {
                var source = item && typeof item === "object" ? item : {};
                return {
                  sheetName: source.aba || "XLSX",
                  rowNumber: source.linha != null ? Number(source.linha) : 0,
                  row: source.dados && typeof source.dados === "object" ? source.dados : {}
                };
              })
            : [];

          if (Array.isArray(authoritativePreview && authoritativePreview.planilha1Aoa)) {
            opts.setLastImportedPlanilha1Aoa(authoritativePreview.planilha1Aoa);
          }
          if (typeof opts.setLastImportValidation === "function") {
            opts.setLastImportValidation(authoritativePreview && authoritativePreview.validation ? authoritativePreview.validation : null);
          }
          if (typeof opts.setLastImportedWorkbookTemplate === "function") {
            var templateBuffer = await file.arrayBuffer();
            opts.setLastImportedWorkbookTemplate({
              fileName: file.name || "template.xlsx",
              importedAt: opts.isoNow(),
              buffer: templateBuffer.slice(0)
            });
          }

          report = buildAuthoritativeImportReport(authoritativePreview, file.name);

          if (!sourceRows.length) {
            globalScope.alert("Nenhuma linha valida encontrada no arquivo.");
            opts.hideImportReport();
            return;
          }

          var removedDemo = shouldSyncImportToApi ? opts.purgeDemoBeforeOfficialImport() : 0;
          if (removedDemo > 0) {
            var currentState = opts.getState();
            opts.setIdCountersByYear(opts.buildIdCounters((currentState && currentState.records) || []));
          }

          if (shouldSyncImportToApi && typeof opts.canOperateCentralData === "function" && !opts.canOperateCentralData()) {
            throw new Error(
              (typeof opts.getCentralSyncBlockReason === "function" && opts.getCentralSyncBlockReason())
                || "Base oficial indisponivel. Aguarde a reconexao com a API para importar."
            );
          }

          // Backend preview is authoritative for metrics; JS only applies the classified rows to state.
          opts.processImportedRows(sourceRows, file.name);
          var importChanged = true;
          var importSkipReason = "";
          if (shouldSyncImportToApi) {
            if (typeof opts.syncImportedEmendasToApi === "function") {
              report.centralSync = await opts.syncImportedEmendasToApi(file, report);
            }
            var loteSyncResult = await opts.syncImportBatchToApi(file, report);
            var loteId = null;
            if (loteSyncResult && typeof loteSyncResult === "object") {
              loteId = loteSyncResult.loteId != null ? Number(loteSyncResult.loteId) : null;
              importChanged = loteSyncResult.changed !== false;
              importSkipReason = loteSyncResult.reason ? String(loteSyncResult.reason) : "";
            } else if (loteSyncResult) {
              loteId = Number(loteSyncResult);
            }

            if (loteId && importChanged) {
              await opts.syncImportLinesToApi(loteId, report.rowDetails || []);
              if (typeof opts.refreshImportLots === "function") {
                Promise.resolve(opts.refreshImportLots(false)).catch(function () { /* no-op */ });
              }
            }
            if (typeof opts.refreshRemoteEmendasFromApi === "function") {
              await opts.refreshRemoteEmendasFromApi(true);
            } else {
              opts.saveState();
              opts.syncYearFilter();
              opts.render();
            }
          } else {
            opts.saveState();
            opts.syncYearFilter();
            opts.render();
          }
          opts.showImportReport(report);

          var extraDemoInfo = removedDemo > 0 ? (" | Demos removidos: " + String(removedDemo)) : "";
          var syncInfo = " | Importacao isolada neste workspace (sem enviar lote para API oficial).";
          if (shouldSyncImportToApi) {
            syncInfo = importChanged
              ? " | Sincronizado com API oficial."
              : (
                importSkipReason === "same_hash"
                  ? " | Planilha oficial sem alteracao: lote/linhas nao reenviados."
                  : " | API oficial sem novo lote nesta execucao."
              );
          }
          globalScope.alert("Importacao concluida. Criados: " + report.created + " | Atualizados: " + report.updated + " | Sem alteracao: " + report.unchanged + " | Linhas lidas: " + report.totalRows + extraDemoInfo + syncInfo);
        } catch (err) {
          globalScope.console.error(err);
          if (typeof previousStateSnapshot !== "undefined" && previousStateSnapshot) {
            opts.setState(opts.deepClone(previousStateSnapshot));
            opts.setIdCountersByYear(opts.deepClone(previousCountersSnapshot || {}));
            opts.saveState(true);
            opts.syncYearFilter();
            opts.render();
          }
          var detail = err && err.message ? String(err.message) : "erro desconhecido";
          var hint = detail.includes("Importacao exige API ativa para preview Python")
            ? " Ative a API para usar o preview Python da importacao."
            : (detail.includes("Biblioteca XLSX nao carregada") ? " Dica: abra por http://127.0.0.1:5500 e confirme internet para carregar a biblioteca XLSX." : "");
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

