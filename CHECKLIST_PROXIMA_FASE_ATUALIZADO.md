# CHECKLIST 62 - PRIORIZADO E ENXUTO (SEC EMENDAS)

Legenda de status:
- `[x]` Concluido
- `[~]` Em andamento
- `[ ]` Pendente

Legenda de prioridade:
- `P0` Critico (operacao confiavel)
- `P1` Producao controlada
- `P2` Escala/gestao

Legenda de execucao:
- `COD` Precisa codigo
- `TI` Dependencia de infraestrutura
- `PROC` Processo/documentacao/regra
- `QA` Teste/validacao

## Resumo geral (62 itens)
- Concluidos: 25
- Em andamento: 4
- Pendentes: 33

## P0 - Operacao essencial (codar agora)
- [~] C01 `[P0][PROC]` Banco como fonte principal oficial
- [~] C02 `[P0][PROC]` Excel apenas importacao/exportacao
- [ ] C03 `[P0][PROC]` Regra oficial de versao de arquivo importado
- [ ] C04 `[P0][PROC]` Politica de retencao publicada
- [x] C05 `[P0][COD]` Login de usuario ativo
- [x] C06 `[P0][COD]` Cadastro com nome + perfil
- [x] C07 `[P0][PROC]` Perfis padrao definidos
- [x] C08 `[P0][COD]` Sessao com token + logout
- [x] C09 `[P0][COD]` Bloqueio de usuario inativo
- [x] C10 `[P0][COD]` Permissao APG/SUP/PROG para status oficial
- [x] C11 `[P0][COD]` Motivo obrigatorio em mudanca de status oficial
- [x] C12 `[P0][PROC]` Workflow de transicao definido
- [x] C13 `[P0][COD]` Visao geral supervisor/programador
- [x] C14 `[P0][COD]` Eventos com usuario/perfil/data-hora
- [x] C15 `[P0][COD]` Timeline por emenda
- [x] C16 `[P0][COD]` Painel inicial com ultimas alteracoes
- [x] C17 `[P0][COD]` Origem do evento (UI/API/IMPORT/EXPORT)
- [ ] C18 `[P0][PROC]` Politica append-only homologada
- [x] C19 `[P0][COD]` Importacao operacional (`.xlsx`)
- [x] C20 `[P0][COD]` Resumo de importacao na tela
- [x] C21 `[P0][COD]` Duplicidade por ID/chave
- [x] C22 `[P0][COD]` Lote de importacao com hash e responsavel
- [x] C23 `[P0][COD]` Detalhe por linha importada (`import_linhas`)
- [x] C24 `[P0][COD]` Exportacao operacional (`.xlsx`)
- [~] C25 `[P0][COD]` Exportacao pelo estado consolidado
- [x] C26 `[P0][COD]` Log formal de exportacao
- [ ] C27 `[P0][TI]` Persistir export em pasta oficial
- [x] C28 `[P0][COD]` Estrutura base usuarios/emendas/historico
- [x] C29 `[P0][COD]` Estrutura lotes/import/export
- [x] C30 `[P0][COD]` Indices e constraints finais
- [x] C31 `[P0][COD]` Migracoes Alembic completas
- [x] C32 `[P0][QA]` Testes manuais API documentados
- [~] C33 `[P0][QA]` Regressao por release
- [~] C34 `[P0][QA]` Teste de concorrencia (2-5 usuarios)

## P1 - Producao controlada (codigo + TI)
- [ ] C35 `[P1][TI]` Servidor API na intranet
- [ ] C36 `[P1][TI]` Servidor PostgreSQL central
- [ ] C37 `[P1][TI]` Pasta de rede oficial (historico/atual/logs)
- [ ] C38 `[P1][TI]` CORS e firewall internos
- [ ] C39 `[P1][TI]` HTTPS interno
- [ ] C40 `[P1][TI]` Backup diario automatizado
- [ ] C41 `[P1][QA]` Teste mensal de restauracao
- [ ] C42 `[P1][PROC]` Politica de senha e bloqueio por tentativas
- [ ] C43 `[P1][PROC]` Plano de contingencia operacional
- [ ] C44 `[P1][QA]` Suite automatizada backend
- [x] C45 `[P1][COD]` Visao geral inicial da supervisao
- [x] C46 `[P1][COD]` Alertas de conflito por emenda
- [ ] C47 `[P1][COD]` SLA por etapa
- [ ] C48 `[P1][COD]` Filtros gerenciais avancados
- [ ] C49 `[P1][COD]` Exportacao de relatorio executivo
- [ ] C50 `[P1][COD]` Painel admin (ativar/desativar usuario)

## P2 - Escala e governanca (futuro)
- [x] C51 `[P2][COD]` Sprint 1: lote + hash importacao
- [x] C52 `[P2][COD]` Sprint 1: log de exportacao
- [ ] C53 `[P2][TI]` Sprint 1: persistencia em pasta simulada/rede
- [ ] C54 `[P2][PROC]` Sprint 2: politica de workflow formalizada
- [ ] C55 `[P2][COD]` Sprint 2: painel administrativo completo
- [ ] C56 `[P2][COD]` Sprint 2: bloqueio/reativacao de usuario
- [ ] C57 `[P2][TI]` Sprint 3: PostgreSQL de rede homologado
- [ ] C58 `[P2][TI]` Sprint 3: backup/restore homologado com evidencia
- [ ] C59 `[P2][TI]` Sprint 3: Power BI no banco central
- [ ] C60 `[P2][PROC]` Aceite: 100% rastreio por usuario
- [ ] C61 `[P2][PROC]` Aceite: 0 dependencia de Excel como fonte principal
- [ ] C62 `[P2][PROC]` Aceite: supervisor com governanca em tempo real

## Ordem pratica (enxuta)
1. Fechar todos os `P0` pendentes (`C01-C04`, `C18`, `C25`, `C27`, `C33-C34`).
2. Entrar em `P1` com TI (`C35-C43`) e qualidade (`C44`).
3. Fechar `P1` gestor (`C47-C50`) e depois `P2` (`C53-C62`).

## Regra de foco
- Nao iniciar item `P1/P2` enquanto houver `P0` pendente que impacta operacao.
- Toda entrega fecha com teste + registro em `LOG_ALTERACOES.md` + commit.

