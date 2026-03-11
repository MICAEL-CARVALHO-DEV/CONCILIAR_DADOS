(function (global) {
  var root = global.SECFrontend = global.SECFrontend || {};

  function buildRowDetail(order, ctx, statusLinha, idInterno, refKey, mensagem) {
    var source = ctx && typeof ctx === "object" ? ctx : {};
    return {
      ordem: order,
      sheet_name: source.sheetName || "XLSX",
      row_number: source.rowNumber != null ? Number(source.rowNumber) : 0,
      status_linha: statusLinha,
      id_interno: idInterno || "",
      ref_key: refKey || "",
      mensagem: mensagem || ""
    };
  }

  function processImportedRows(sourceRows, fileName, records, dependencies) {
    var dep = dependencies && typeof dependencies === "object" ? dependencies : {};
    var rows = Array.isArray(sourceRows) ? sourceRows : [];
    var targetRecords = Array.isArray(records) ? records : [];
    var mapImportRow = typeof dep.mapImportRow === "function" ? dep.mapImportRow : function (ctx) { return ctx || {}; };
    var hasUsefulData = typeof dep.hasUsefulData === "function" ? dep.hasUsefulData : function () { return true; };
    var createRecordFromImport = typeof dep.createRecordFromImport === "function" ? dep.createRecordFromImport : function (incoming) { return incoming; };
    var mergeImportIntoRecord = typeof dep.mergeImportIntoRecord === "function" ? dep.mergeImportIntoRecord : function () { return { changedAny: false }; };
    var report = {
      fileName: fileName,
      totalRows: rows.length,
      consideredRows: 0,
      skippedRows: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      duplicateById: 0,
      duplicateByRef: 0,
      duplicateInFile: 0,
      conflictIdVsRef: 0,
      sheetNames: [],
      rowDetails: [],
      validation: dep.initialValidation || null
    };

    var sheetSet = new Set();
    var existingById = new Map();
    var existingByRef = new Map();
    var seenImportRef = new Set();

    targetRecords.forEach(function (record) {
      if (!record) return;
      existingById.set(record.id, record);
      if (record.ref_key && !existingByRef.has(record.ref_key)) {
        existingByRef.set(record.ref_key, record);
      }
    });

    rows.forEach(function (ctx) {
      sheetSet.add((ctx && ctx.sheetName) || "XLSX");
      var previewStatus = String((((ctx || {}).row || {}).__previewStatus) || "").trim().toUpperCase();
      if (previewStatus === "SKIPPED" || previewStatus === "CONFLICT" || previewStatus === "UNCHANGED") {
        return;
      }
      var incoming = mapImportRow(ctx);

      if (!hasUsefulData(incoming)) {
        report.skippedRows += 1;
        report.rowDetails.push(buildRowDetail(
          report.rowDetails.length + 1,
          ctx,
          "SKIPPED",
          incoming && incoming.id,
          incoming && incoming.ref_key,
          "Linha ignorada: sem dados uteis"
        ));
        return;
      }

      report.consideredRows += 1;

      if (incoming.ref_key) {
        if (seenImportRef.has(incoming.ref_key)) report.duplicateInFile += 1;
        seenImportRef.add(incoming.ref_key);
      }

      var byId = incoming.id ? existingById.get(incoming.id) : null;
      var byRef = incoming.ref_key ? existingByRef.get(incoming.ref_key) : null;

      if (byId) report.duplicateById += 1;
      if (!byId && byRef) report.duplicateByRef += 1;

      var target = byId || byRef || null;
      if (byId && byRef && byId !== byRef) {
        report.conflictIdVsRef += 1;
        target = byId;
      }

      if (!target) {
        var created = createRecordFromImport(incoming, ctx, fileName);
        targetRecords.push(created);
        existingById.set(created.id, created);
        if (created.ref_key && !existingByRef.has(created.ref_key)) {
          existingByRef.set(created.ref_key, created);
        }
        report.created += 1;
        report.rowDetails.push(buildRowDetail(
          report.rowDetails.length + 1,
          ctx,
          "CREATED",
          created.id,
          created.ref_key,
          "Registro criado"
        ));
        return;
      }

      var mergeResult = mergeImportIntoRecord(target, incoming, ctx, fileName);
      if (mergeResult && mergeResult.changedAny) report.updated += 1;
      else report.unchanged += 1;

      report.rowDetails.push(buildRowDetail(
        report.rowDetails.length + 1,
        ctx,
        byId && byRef && byId !== byRef ? "CONFLICT" : ((mergeResult && mergeResult.changedAny) ? "UPDATED" : "UNCHANGED"),
        target.id,
        target.ref_key || incoming.ref_key || "",
        byId && byRef && byId !== byRef
          ? "Conflito ID x chave referencia; aplicado no ID existente"
          : ((mergeResult && mergeResult.changedAny) ? "Registro atualizado" : "Sem alteracao")
      ));

      existingById.set(target.id, target);
      if (target.ref_key) existingByRef.set(target.ref_key, target);
    });

    report.sheetNames = Array.from(sheetSet);
    return report;
  }

  root.importProcessorUtils = {
    processImportedRows: processImportedRows
  };
})(window);
