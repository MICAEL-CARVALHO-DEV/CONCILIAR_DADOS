# CATALOGO DOCUMENTOS MD

Goal: Definir qual arquivo e canonico, qual e apoio e qual e historico, para evitar retrabalho e duplicacao.
Success: Antes de abrir, criar ou atualizar um `.md`, a equipe sabe exatamente onde esse documento entra.

## Entrada diaria canonica
- `../README.md` - ponto de entrada geral do repositorio
- `../CHECK62.md` - mapa mestre oficial da beta SEC
- `../CHECKUSER.md` - sprint ativa sem duplicidade
- `../checks/CHECK_PENDENCIAS_BETA_SEC.md` - decisoes que dependem do usuario
- `INDICE_DOCUMENTACAO.md` - indice curado da documentacao

## Documentos tecnicos ativos
- `refatoracao.md`
- `REFATORACAO_EXECUTION_CHECKLIST.md`
- `REFATORACAO_BACKEND_CHECKLIST.md`
- `ORQ_REFATORACAO_FRONTEND_QUEUE.md`
- `tipos_refatoracao.md`
- `DESIGN_DASHBOARD_POWERBI_E_LAYOUT_PRINCIPAL.md`
- `REGRAS_PLANILHAS_TESTE_E_OFICIAL.md`
- `../backend/MAPA_MAIN.md`
- `../frontend/js/MAPA_APP.md`

## Checks organizados
- Ativos:
  - `../CHECK62.md`
  - `../CHECKUSER.md`
  - `../checks/CHECK_PENDENCIAS_BETA_SEC.md`
- Auxiliares:
  - `../checks/auxiliares/CHECKMASTER.md`
  - `../checks/auxiliares/CHECKSEC.md`
  - `../checks/auxiliares/CHECKTEST.md`
  - `../checks/auxiliares/CHECKDEPLOY.md`
  - `../checks/auxiliares/CHECK_TROCA_CONTA_CODEX.md`

## Operacao, governanca e implantacao
- `../CHECKLIST_DEPLOY_FINAL_OPERACAO.md`
- `../DEPLOY.md`
- `../DEPLOY_GRATIS_RENDER_SUPABASE.md`
- `../DEPLOY_CLOUDFLARE_PAGES.md`
- `../MAPA_LOGICO_CONCILIAR_DADOS.md`
- `../README_MANUTENCAO.md`

## Anotacoes canonicas
- `../anotacoes/README_ANOTACOES.md`
- `../anotacoes/DECISOES_IMPORT_EXPORT_XLSX.md`
- `../anotacoes/ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`
- `../anotacoes/TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`
- `../anotacoes/ORCAMENTO_OPERACAO_SITE_20260305.md`
- `../anotacoes/RELATORIO_PLANO_EVOLUCAO.md`
- `../anotacoes/ROADMAP_FASES.md`

## Evidencias e relatorios datados
- `../anotacoes/evidencias/`
- `../anotacoes/evidencias/RELATORIO_GO_LIVE_20260305_073042.md`

## Documentos duplicados que exigem cuidado
- `BASE_CONTINUIDADE_CODEX.md` e `anotacoes/BASE_CONTINUIDADE_CODEX.md`
  - Estado: duplicados divergentes
  - Regra atual: nao consolidar sem revisar conteudo
- `PLANO_ETAPAS_62_ITENS.md` e `anotacoes/PLANO_ETAPAS_62_ITENS.md`
  - Estado: duplicados divergentes
  - Regra atual: usar a versao da raiz como plano operacional principal, ate consolidacao formal
- `README_MANUTENCAO.md` e `anotacoes/README_MANUTENCAO.md`
  - Estado: duplicados identicos
  - Regra atual: preferir a raiz; a copia em `anotacoes/` existe por central de consulta
- `RELATORIO_PLANO_EVOLUCAO.md` e `anotacoes/RELATORIO_PLANO_EVOLUCAO.md`
  - Estado: duplicados divergentes
  - Regra atual: preferir `anotacoes/RELATORIO_PLANO_EVOLUCAO.md` como referencia estrategica

## Regra de manutencao
- Documento oficial novo: criar no lugar certo na primeira vez.
- Documento auxiliar: ir para `checks/`, `docs/` ou `anotacoes/`, nunca competir com o mapa mestre.
- Documento duplicado: registrar aqui antes de tentar consolidar ou apagar.

## Resume from
- Se houver duvida sobre onde atualizar um `.md`, abrir este catalogo e depois confirmar no `INDICE_DOCUMENTACAO.md`.
