# @DEVE DE CASA - FECHAMENTO DA BETA SEC

CHECKLIST
Goal: Listar so o que realmente falta para fechar a beta, sem misturar itens ja decididos ou trabalho tecnico ja concluido.
Success: O usuario abre este arquivo e enxerga apenas as decisoes e validacoes finais que ainda faltam para declarar a beta fechada.

## Ja decididos - nao entram mais como pendencia principal
- [DONE] `C12-A` `Status_2` nao entra no sistema; coluna extra/duplicada do Excel sera apenas tolerada.
- [DONE] Import oficial ficou `backend-first`; Python le o `.xlsx` e o front so envia/renderiza.
- [DONE] Governanca de import ficou assim: qualquer usuario importa, `PROGRAMADOR` governa, corrige e remove com auditoria e motivo.
- [DONE] `TESTE x OFICIAL` ficou alinhado para a beta atual: `LOA` focada, `TESTE` isolada no front, `FEDERAL` futura.
- [DONE] Separacao completa por `workspace_id` no backend foi adiada oficialmente para o pos-beta.

## Faltas reais para fechar a beta
- [TODO] `C49-A` Fechar a regra final da contagem de deputado.
  O que falta responder: a contagem automatica nasce da base inteira ou do import atual? O ajuste manual vale por import, por planilha ou global? Quem ajusta e quem so visualiza?
  Recomendacao tecnica: `automatica + ajuste manual auditado`, com ajuste por `import` e permissao de ajuste so para `PROGRAMADOR`.

- [TODO] `C27` Fechar a regra oficial do export.
  O que falta responder: o export oficial da operacao sera sempre em `template mode` para preservar mais o layout do arquivo original?
  Decisao ja tomada: nao precisa pasta de rede; download normal do navegador basta.
  Recomendacao tecnica: `template mode` como export oficial e export normal escondido da operacao.

- [TODO] `C25-B` Encerrar oficialmente `objetivo_epi`.
  Estado atual: o codigo esta coerente sem modelar `objetivo_epi` na beta.
  O que falta responder: vamos fechar isso como `nao entra na beta` e deixar para futura necessidade real?
  Recomendacao tecnica: nao mexer agora e encerrar como `fora da beta`.

- [TODO] `C48` Validacao visual final do historico com filtros fortes.
  Validar no navegador: ano, mes, usuario, perfil, tipo_evento, origem e busca textual.

- [TODO] `C49` Validacao visual final do relatorio executivo / XLSX.
  Validar no navegador: botao, arquivo gerado, abas do arquivo e fidelidade do layout esperado.

- [TODO] `C50-A` Validacao visual final da aba `Ajuda e suporte`.
  Validar no navegador: abrir chamado, responder, fechar e consultar historico.

## Faltas que nao bloqueiam a beta
- [TODO] `workspace_id` real no backend para separar `LOA`, `TESTE` e `FEDERAL` no banco/API.
- [TODO] refinamento do export para preservar layout com fidelidade maior que a atual.
- [TODO] redesign do layout principal e dashboard Power BI.
- [TODO] mapa interativo com hover/preview de emenda no dashboard.
- [TODO] servidor interno / migracao de infraestrutura.
- [TODO] leitura externa por Power BI fora do sistema.
- [TODO] refinamentos de acessibilidade e warnings visuais residuais.
- [TODO] melhorias finas de UX nos paineis de governanca, suporte e dashboard.

## Ordem final recomendada
1. `C49-A`
2. `C27`
3. `C25-B`
4. `C48`
5. `C49`
6. `C50-A`

## Criterio de fechamento da beta
A beta fecha quando:
1. as tres decisoes finais acima estiverem respondidas (`C49-A`, `C27`, `C25-B`)
2. as tres validacoes visuais finais estiverem aprovadas (`C48`, `C49`, `C50-A`)

## Resume from
- Proxima decisao recomendada: `C49-A` contagem de deputado.
- Se quiser pular decisao e validar algo no sistema, comece por `C48`.
