# Decisoes - Importacao/Exportacao XLSX

Data: 2026-02-24

## Escopo atual
- Aceitar apenas arquivo `.xlsx` na importacao.
- Exportacao principal em `.xlsx`.
- Fluxo alvo: `XLSX original -> importar -> alterar -> exportar`.

## Regras confirmadas
1. Nao usar CSV neste fluxo operacional.
2. Nao misturar dados demo com base oficial.
3. Sempre manter rastreio (lote, linhas importadas, usuario, data/hora).

## Governanca da entrada LOA (futuro aprovado)
- Entrada do arquivo LOA e manual, vindo da rede oficial.
- Importacao de LOA: somente perfis `PROGRAMADOR` e `SUPERVISAO`.
- Cada importacao deve ser registrada por competencia `ANO/MES`.
- Sistema deve manter uma base `IMPORT_RAIZ` (snapshot oficial de referencia).
- Apos login, usuario deve escolher o cenario de trabalho:
  - `LOA ANO/MES` (ambiente operacional da competencia escolhida), ou
  - `IMPORT_RAIZ` (consulta/comparacao/base de referencia).

## Estrategia operacional alvo
- LOA recebido do SEPLAN e importado uma vez por lote oficial.
- Trabalho diario ocorre no sistema (nao na planilha).
- Excel vira formato de entrada/saida (import/export), nao base principal.
- Rede corporativa e usada para guardar:
  - arquivo oficial recebido,
  - exportacoes finais,
  - trilha de evidencias.

## Sobre o total 320 vs 843
- `320` vem da aba `Planilha1` do arquivo original (resumo/pivot).
- `843` apareceu quando a planilha foi reconstruida pela base interna no modo normal.
- Isso nao indica alteracao por terceiros.

## Como preservar o arquivo original
- Usar exportacao em modo `TEMPLATE` para manter estrutura/abas do arquivo original.
- Nesse modo, o sistema altera apenas os dados mapeados.

## Limites tecnicos (importante)
- Precisao de dados: alta (campos/valores).
- Identico visualmente em 100% dos casos: depende de recursos avancados do Excel (formula, estilo, mesclagem, etc.).

## Checklist de validacao rapida (60s)
1. Importar o `.xlsx` oficial.
2. Validar `Total Geral` no resumo por deputado.
3. Alterar 1 valor.
4. Exportar em `TEMPLATE`.
5. Confirmar no arquivo exportado:
   - abas esperadas,
   - valor alterado,
   - resumo coerente com a origem.

## Proximos ajustes (quando necessario)
- Travar exportacao sempre em `TEMPLATE` (sem opcao normal).
- Exibir diagnostico na tela:
  - total da `Planilha1` lida,
  - total da aba `Controle de EPI`,
  - total da base interna.
- Bloquear importacao se colunas criticas estiverem vazias acima do limite definido.
