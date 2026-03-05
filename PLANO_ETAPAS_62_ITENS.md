# PLANO ETAPAS - 62 ITENS (ANTI OSCILACAO)

Objetivo:
- Concluir todos os itens pendentes por etapas curtas, sem quebrar o que ja funciona.

Regra de execucao (obrigatoria):
1. Nao iniciar etapa nova sem fechar criterio de aceite da etapa atual.
2. Toda etapa termina com: teste manual + checklist atualizado + commit.
3. Mudanca em auth, import ou export exige teste de regressao rapido.
4. Se algo quebrar, rollback da etapa e correcao antes de continuar.

Status atual consolidado:
- 62 itens totais
- 22 concluidos
- 4 em andamento
- 36 pendentes

## Triagem operacional (evitar retrabalho)
Objetivo:
- Separar o que precisa entrar agora, o que deve ser adiado sem prejuizo e o que nao vale energia neste momento.

### Prioridade imediata (executar antes de novo bloco grande)
- [ ] Fechar plano B de autenticacao: senha local obrigatoria tambem no cadastro com Google.
- [ ] Validar fluxo unico de cadastro: Google autentica identidade, mas nao pula formulario de setor/funcao/perfil.
- [ ] Garantir teste local completo antes de publicar: front local + API local + Google com portas autorizadas.
- [ ] Confirmar que login local continua funcionando mesmo se Google ficar indisponivel.
- [ ] Revisar e consolidar mensagens de UX criticas (usuario inexistente, conta em analise, recuperacao).

### Prioridade media (fazer depois que o bloco atual estabilizar)
- [ ] Vincular conta Google apenas dentro do sistema, para usuarios ja aprovados.
- [ ] Criar fila formal de aprovacao para redefinicao de senha por PROGRAMADOR (e opcionalmente SUPERVISAO).
- [ ] Melhorar painel de aprovacao para mostrar cadastro pendente, redefinicao pendente e status de vinculacao Google.
- [ ] Criar checklist curto de validacao pre-deploy e pos-deploy para auth/cadastro.

### Futuro util (nao bloquear agora)
- [ ] Confirmacao de e-mail no cadastro normal (sem Google).
- [ ] Opcao dupla em "Esqueci a senha?": recuperar com Google ou solicitar reset interno.
- [ ] Delegacao parcial de aprovacao para supervisor, com regra clara e limitada.
- [ ] Refinos visuais adicionais em login/cadastro apenas apos o fluxo de auth ficar fechado.

### Adiar / nao gastar energia agora
- [ ] Nao criar dependencia total de Google como unica forma de login.
- [ ] Nao investir em efeitos visuais extras no login se o fluxo de cadastro/aprovacao ainda estiver mudando.
- [ ] Nao abrir nova frente de infra/TI antes de fechar autenticacao, aprovacao e fallback local.

Regra de decisao:
- Se um item nao reduz risco operacional agora, ele nao entra na proxima rodada.
- Se um item depende de Google e ainda nao tem fallback local, ele nao pode substituir o login por senha.
- Se um item mexe em auth e nao fecha fallback, ele e incompleto.

Progresso de execucao:
- [x] Etapa 0 concluida (baseline + scripts start_api/start_front + smoke_e2e)
- [ ] Etapa 1 em execucao

## Etapa 0 - Controle de baseline (1 dia)
Meta:
- Congelar versao atual estavel para referencia.

Entregas:
- Tag/branch de baseline
- Script unico de subida local (front + api)
- Script de smoke test

Aceite:
- Login, lista, import, export e timeline funcionando igual ao baseline.

## Etapa 1 - Fechar itens em andamento (2 a 3 dias)
Meta:
- Converter os 4 itens [~] para [x].

Escopo:
- Workflow de status (transicoes permitidas)
- Origem formal de evento (UI/API/IMPORT/EXPORT)
- Registro formal de lote de importacao
- Exportacao baseada em estado consolidado
- Estrutura ampliada de banco para lotes/logs
- Testes manuais API documentados

Aceite:
- Nenhum item [~] restante.

## Etapa 2 - Import/Export auditavel fim a fim (3 a 5 dias)
Meta:
- Fechar pendencias operacionais de arquivo e rastreio.

Escopo:
- Tabela lotes_importacao
- Tabela import_linhas
- Tabela export_logs
- Hash do arquivo importado
- Persistencia de export em pasta (simulada primeiro)

Aceite:
- Cada import/export gera log consultavel e auditavel.

## Etapa 3 - Governanca e seguranca de usuario (3 a 4 dias)
Meta:
- Fechar controle de acesso corporativo.

Escopo:
- Bloqueio de usuario inativo
- Painel admin de usuarios (ativar/desativar)
- Politica de senha e tentativas
- Politica append-only homologada internamente

Aceite:
- Nenhuma alteracao sem usuario valido e sem trilha de auditoria.

## Etapa 4 - Banco e migrations de producao (2 a 4 dias)
Meta:
- Base pronta para ambiente corporativo.

Escopo:
- Alembic completo e documentado
- Indices e constraints finais
- Fluxo de upgrade/stamp para base existente
- Revisao de performance basica

Aceite:
- Subida limpa em banco vazio e banco legado sem perda.

## Etapa 5 - Infra de rede (dependencia TI) (tempo TI)
Meta:
- Tirar da estacao local e operar em rede.

Escopo:
- Servidor API intranet
- Servidor PostgreSQL
- Pasta oficial de rede (historico/atual/logs)
- CORS, firewall, HTTPS interno

Aceite:
- Usuarios da rede acessam com mesmo comportamento do ambiente local.

## Etapa 6 - Backup e continuidade (2 a 3 dias + TI)
Meta:
- Garantir recuperacao e continuidade operacional.

Escopo:
- Backup diario automatizado
- Restore mensal testado
- Plano de contingencia

Aceite:
- Evidencia de backup e restore com log.

## Etapa 7 - Qualidade e testes (3 a 5 dias)
Meta:
- Reduzir risco de regressao.

Escopo:
- Suite automatizada backend
- Regressao por release
- Teste de concorrencia (2 a 5 usuarios)

Aceite:
- Pipeline de teste minima para merge/release.

## Etapa 8 - Painel gestor completo (3 a 4 dias)
Meta:
- Fechar visao executiva.

Escopo:
- SLA por etapa
- Filtros gerenciais (periodo/deputado/municipio)
- Exportacao de relatorio executivo

Aceite:
- Supervisor consegue monitorar operacao sem abrir planilha.

## Etapa 9 - Fechamento 62/62
Meta:
- Encerrar todas as pendencias e formalizar operacao.

Checklist final:
- 100% rastreavel por usuario
- Excel nao e fonte principal
- Import/export auditavel ponta a ponta
- Visao de supervisao completa

---

Modo de trabalho recomendado (curto):
- Semana 1: Etapas 0 e 1
- Semana 2: Etapas 2 e 3
- Semana 3: Etapas 4 e 5 (com TI)
- Semana 4: Etapas 6, 7 e 8
- Semana 5: Etapa 9 e homologacao final



