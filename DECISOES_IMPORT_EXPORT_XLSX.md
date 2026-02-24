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
