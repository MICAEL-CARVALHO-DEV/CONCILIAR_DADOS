# RESUMO EXECUTIVO (1 PAGINA) - SEC EMENDAS

## Problema atual
Hoje o processo depende de Excel como sistema principal, o que gera:
- risco de conflito entre usuarios,
- perda de rastreabilidade,
- retrabalho,
- baixa governanca de dados.

## Proposta objetiva
Transformar o fluxo em **sistema controlado** com:
- frontend web para operacao,
- backend Python (FastAPI),
- banco central PostgreSQL como fonte oficial,
- Excel apenas para importar/exportar.

## O que ja esta pronto
- Login e cadastro de usuarios por perfil.
- Perfis: APG, SUPERVISAO, CONTABIL, POWERBI, PROGRAMADOR.
- Status oficial com controle de permissao.
- Timeline por emenda e rastreio por usuario.
- Importacao e exportacao CSV/XLSX.
- Painel inicial com ultimas alteracoes e autores.

## Como sera o controle
Cada acao relevante gera rastro no banco:
- quem fez,
- quando fez,
- o que mudou,
- valor anterior e novo,
- motivo da alteracao,
- origem (UI/API/IMPORT/EXPORT).

## Modelo de arquivos na rede
- `\\servidor\\emendas\\01_historico` -> todas as versoes (imutavel)
- `\\servidor\\emendas\\02_atual` -> ultima versao publicada
- `\\servidor\\emendas\\03_logs` -> comprovantes de import/export

## Beneficio direto para a gestao
- Visao geral do supervisor em tempo real.
- Evidencia de divergencias entre status oficial e marcacoes.
- Rastreio completo para auditoria e prestacao de contas.
- Reducao de conflito e retrabalho operacional.

## Decisoes pendentes com TI
- Host da API na intranet.
- Host do PostgreSQL.
- Liberacao da pasta de rede oficial.
- Politica de backup e retencao.

## Plano de implantacao (resumo)
1. Fechar governanca e lote de importacao/exportacao auditavel.
2. Subir PostgreSQL central + backup.
3. Publicar operacao oficial: banco como fonte, Excel como interface de troca.

## Criterio de sucesso
- 100% das alteracoes rastreaveis por usuario.
- 0 dependencia de Excel como fonte principal.
- Supervisor com visao geral e trilha auditavel fim a fim.
