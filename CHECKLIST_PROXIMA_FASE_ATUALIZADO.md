# CHECKLIST ATUALIZADO - PROXIMA FASE (SEC EMENDAS)

Legenda:
- `[x]` Concluido
- `[~]` Em andamento
- `[ ]` Pendente

## 1. Governanca do dado (Excel x Sistema)
- [~] Definir oficialmente que o banco e a fonte principal
- [~] Definir que Excel sera apenas importacao/exportacao
- [ ] Publicar regra oficial de versao dos arquivos importados
- [ ] Publicar politica de retencao (5-10 anos)

## 2. Autenticacao, usuarios e perfis
- [x] Login de usuario implementado
- [x] Cadastro de usuario com nome + perfil implementado
- [x] Perfis ativos: APG, SUPERVISAO, CONTABIL, POWERBI, PROGRAMADOR
- [x] Sessao com token + logout
- [ ] Bloqueio de usuario inativo (painel administrativo)

## 3. Regras de permissao
- [x] APG/SUPERVISAO/PROGRAMADOR podem alterar status oficial
- [x] Mudancas de status oficial exigem motivo
- [x] Regras completas de workflow (transicoes permitidas)
- [x] Perfil supervisor/programador com visao geral

## 4. Historico e linha do tempo (audit log)
- [x] Eventos por usuario/perfil/data-hora
- [x] Timeline por emenda no detalhe
- [x] Painel inicial com ultimas alteracoes e autor
- [x] Rastreio formal de origem do evento (UI/API/IMPORT/EXPORT)
- [ ] Politica append-only homologada com TI

## 5. Importacao (CSV/XLSX)
- [x] Importacao de CSV/XLSX funcionando
- [x] Resumo de importacao na tela
- [x] Deteccao de duplicidade por ID/chave de referencia
- [x] Registro formal de lote (arquivo, hash, responsavel)
- [x] Registro detalhado por linha importada (`import_linhas`)

## 6. Exportacao (CSV/XLSX)
- [x] Exportacao CSV/XLSX funcionando
- [~] Exportacao com base no estado consolidado
- [x] Log formal de exportacao (usuario, filtros, quantidade)
- [ ] Persistir arquivo exportado em pasta de rede (historico + atual)

## 7. Estrutura de banco (PostgreSQL)
- [x] Estrutura inicial de usuarios/emendas/historico
- [x] Estrutura ampliada para lotes de importacao/exportacao
- [ ] Indices e constraints finais de producao
- [ ] Migracoes versionadas completas (Alembic)

## 8. Infra e rede interna
- [ ] Definir servidor da API na intranet
- [ ] Definir servidor do PostgreSQL
- [ ] Definir pasta de rede oficial (`historico`, `atual`, `logs`)
- [ ] Configurar CORS/firewall para rede interna
- [ ] Habilitar HTTPS interno (quando TI liberar)

## 9. Backup, seguranca e continuidade
- [ ] Backup diario automatizado
- [ ] Teste de restauracao mensal
- [ ] Politica de senha e bloqueio por tentativas
- [ ] Plano de contingencia para indisponibilidade

## 10. Qualidade e testes
- [~] Testes manuais de API (health/auth/emendas)
- [ ] Suite de testes automatizados backend
- [ ] Testes de concorrencia com 2-5 usuarios reais
- [ ] Testes de regressao por release

## 11. Painel gestor (supervisao)
- [x] Visao geral inicial no front
- [x] Alerta de conflitos por emenda
- [ ] Indicadores de SLA por etapa
- [ ] Filtros gerenciais por periodo/deputado/municipio
- [ ] Exportacao de relatorio executivo

## 12. Proximas entregas (ordem recomendada)
### Sprint 1 - Controle operacional
- [x] Tabela `lotes_importacao` + hash de arquivo
- [x] Log `export_logs`
- [ ] Persistencia de arquivo em pasta simulada de rede

### Sprint 2 - Governanca e seguranca
- [ ] Politica de workflow por status
- [ ] Painel de administracao de usuarios
- [ ] Bloqueio/ativacao de usuario

### Sprint 3 - Producao corporativa
- [ ] PostgreSQL central na rede
- [ ] Backup/restore homologado
- [ ] Power BI conectado ao banco

## Criterios de aceite da fase
- [ ] 100% das alteracoes rastreaveis por usuario
- [ ] 0 dependencia de Excel como fonte principal
- [ ] Importacao/exportacao com trilha auditavel fim a fim
- [ ] Supervisor com visao geral e governanca operacional
