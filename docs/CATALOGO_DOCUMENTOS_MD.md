# CATALOGO DOCUMENTOS MD

Goal: Definir qual arquivo e canonico, qual e apoio e qual e historico, para evitar retrabalho e duplicacao.
Success: Antes de abrir, criar ou atualizar um `.md`, a equipe sabe exatamente onde esse documento entra.

## Entrada diaria canonica
- `../anotacoes/documentacao_raiz/readme.md` - ponto de entrada geral do repositorio
- `../anotacoes/documentacao_raiz/check62.md` - mapa mestre oficial da beta SEC
- `../anotacoes/documentacao_raiz/checkuser.md` - sprint ativa sem duplicidade
- `../checks/check_pendencias_beta_sec.md` - decisoes que dependem do usuario
- `indice_documentacao.md` - indice curado da documentacao

## Documentos tecnicos ativos
- `refatoracao.md`
- `refatoracao_execution_checklist.md`
- `refatoracao_backend_checklist.md`
- `orq_refatoracao_frontend_queue.md`
- `tipos_refatoracao.md`
- `design_dashboard_powerbi_e_layout_principal.md`
- `regras_planilhas_teste_e_oficial.md`
- `mapa_oficial_colunas_loa.md`
- `../backend/MAPA_MAIN.md`
- `../frontend/js/MAPA_APP.md`

## Checks organizados
- Ativos:
  - `../anotacoes/documentacao_raiz/check62.md`
  - `../anotacoes/documentacao_raiz/checkuser.md`
  - `../checks/check_pendencias_beta_sec.md`
- Auxiliares:
  - `../checks/auxiliares/checkmaster.md`
  - `../checks/auxiliares/checksec.md`
  - `../checks/auxiliares/checktest.md`
  - `../checks/auxiliares/checkdeploy.md`
  - `../checks/auxiliares/check_troca_conta_codex.md`

## Operacao, governanca e implantacao
- `../anotacoes/documentacao_raiz/checklist_deploy_final_operacao.md`
- `../anotacoes/documentacao_raiz/deploy.md`
- `../anotacoes/documentacao_raiz/deploy_gratis_render_supabase.md`
- `../anotacoes/documentacao_raiz/deploy_cloudflare_pages.md`
- `../anotacoes/documentacao_raiz/mapa_logico_conciliar_dados.md`
- `../anotacoes/documentacao_raiz/readme_manutencao.md`

## Anotacoes canonicas
- `../anotacoes/README_ANOTACOES.md`
- `../anotacoes/DECISOES_IMPORT_EXPORT_XLSX.md`
- `../anotacoes/ESCOPO_FLUXO_COMPARATIVO_SEC_EMENDAS.md`
- `../anotacoes/TERMO_DE_OPERACAO_E_RESPONSABILIDADES.md`
- `../anotacoes/ORCAMENTO_OPERACAO_SITE_20260305.md`
- `../anotacoes/documentacao_raiz/relatorio_plano_evolucao.md`
- `../anotacoes/ROADMAP_FASES.md`

## Evidencias e relatorios datados
- `../anotacoes/evidencias/`
- `../anotacoes/evidencias/RELATORIO_GO_LIVE_20260305_073042.md`

## Documentos duplicados que exigem cuidado
- `base_continuidade_codex.md` e `anotacoes/base_continuidade_codex.md`
  - Estado: duplicados divergentes
  - Regra atual: nao consolidar sem revisar conteudo
- `plano_etapas_62_itens.md` e `anotacoes/plano_etapas_62_itens.md`
  - Estado: duplicados divergentes
  - Regra atual: usar a versao da raiz como plano operacional principal, ate consolidacao formal
- `readme_manutencao.md` e `anotacoes/readme_manutencao.md`
  - Estado: duplicados identicos
  - Regra atual: preferir a raiz; a copia em `anotacoes/` existe por central de consulta
- `relatorio_plano_evolucao.md` e `anotacoes/relatorio_plano_evolucao.md`
  - Estado: duplicados divergentes
  - Regra atual: preferir `anotacoes/relatorio_plano_evolucao.md` como referencia estrategica

## Regra de manutencao
- Documento oficial novo: criar no lugar certo na primeira vez.
- Documento auxiliar: ir para `checks/`, `docs/` ou `anotacoes/`, nunca competir com o mapa mestre.
- Documento duplicado: registrar aqui antes de tentar consolidar ou apagar.

## Resume from
- Se houver duvida sobre onde atualizar um `.md`, abrir este catalogo e depois confirmar no `indice_documentacao.md`.



