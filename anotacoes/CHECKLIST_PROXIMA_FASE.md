# CHECKLIST - PROXIMA FASE (SEC EMENDAS)

## 1. Governanca do dado (Excel x Sistema)
- [ ] Definir oficialmente que o banco e a fonte principal
- [ ] Definir que Excel sera apenas importacao/exportacao
- [ ] Publicar regra de versao dos arquivos importados (nome, data, responsavel)
- [ ] Publicar politica de retencao (5-10 anos)

## 2. Autenticacao, usuarios e perfis
- [ ] Login obrigatorio para uso do sistema
- [ ] Cadastro de usuario com nome + perfil
- [ ] Perfis ativos: APG, SUPERVISAO, CONTABIL, POWERBI, PROGRAMADOR
- [ ] Sessao com expiracao e logout
- [ ] Bloqueio de usuario inativo

## 3. Regras de permissao
- [ ] Somente APG/SUPERVISAO/PROGRAMADOR alteram status oficial
- [ ] Motivo obrigatorio para mudanca de status oficial
- [ ] Regra de transicao de status documentada (workflow)
- [ ] Visao geral de supervisor/programador habilitada

## 4. Historico e linha do tempo (audit log)
- [ ] Todo evento gravado com: data/hora, usuario, perfil, acao, motivo
- [ ] Gravar antes/depois para mudancas de campo
- [ ] Proibir exclusao de historico (somente append)
- [ ] Timeline por emenda no detalhe
- [ ] Painel na tela inicial com ultimas alteracoes e autores

## 5. Importacao (CSV/XLSX)
- [ ] Registrar lote de importacao (arquivo, hash, usuario, horario)
- [ ] Validar cabecalhos e normalizar aliases
- [ ] Gerar/garantir ID interno (padrao EPI-ANO-000001)
- [ ] Detectar duplicidade por ID e por chave de referencia
- [ ] Registrar erros/linhas ignoradas por lote
- [ ] Salvar resumo da importacao para consulta posterior

## 6. Exportacao (CSV/XLSX)
- [ ] Exportar sempre a partir do banco
- [ ] Registrar log de exportacao (usuario, filtros, horario, quantidade)
- [ ] Incluir aba de audit log no XLSX exportado
- [ ] Garantir que exportacao nao altere dados do sistema

## 7. Estrutura de banco (PostgreSQL)
- [ ] Tabelas base: usuarios, usuarios_sessoes, emendas, historico_eventos
- [ ] Tabelas operacionais: lotes_importacao, import_linhas, export_logs
- [ ] Indices em id_interno, ref_key, status_oficial, updated_at
- [ ] Constraints de integridade (unicidade e not null)
- [ ] Script de migracao versionada (Alembic)

## 8. Infra e rede interna
- [ ] Definir servidor da API na intranet (IP fixo)
- [ ] Definir servidor do banco (acesso restrito)
- [ ] Definir pasta de rede para arquivos importados originais
- [ ] Configurar CORS e firewall para rede interna
- [ ] HTTPS interno (quando TI liberar)

## 9. Backup, seguranca e continuidade
- [ ] Backup diario do PostgreSQL
- [ ] Teste de restauracao mensal
- [ ] Politica de senha minima e rotacao
- [ ] Log de acesso e tentativas de login
- [ ] Plano de contingencia (operacao offline temporaria)

## 10. Qualidade e testes
- [ ] Testes de API (health, auth, import, status, eventos)
- [ ] Testes de permissao por perfil
- [ ] Testes de concorrencia (2-5 usuarios simultaneos)
- [ ] Teste com planilha real anonimizada
- [ ] Teste de regressao antes de cada release

## 11. Painel gestor (supervisao)
- [ ] Indicadores por status oficial
- [ ] Alertas de conflito (status oficial x marcacoes)
- [ ] Ranking de pendencias por setor/usuario
- [ ] SLA: tempo medio por etapa
- [ ] Filtro por periodo, deputado, municipio, orgao

## 12. Plano de execucao por fase
### Fase 1 - Estabilizacao (curto prazo)
- [ ] Fechar login/cadastro + perfis
- [ ] Fechar audit log completo
- [ ] Fechar importacao com lote e resumo

### Fase 2 - Operacao controlada
- [ ] Banco PostgreSQL central na rede
- [ ] Exportacao auditada
- [ ] (apos C25) Edicao em rascunho no modal com Salvar/Descartar antes de gravar
- [ ] Painel de supervisao

### Fase 3 - Escala e BI
- [ ] Power BI conectado direto no banco
- [ ] Politica completa de backup/retencao
- [ ] Governanca formal com TI + areas

## Criterio de aceite da proxima fase
- [ ] 100% das alteracoes rastreaveis por usuario
- [ ] 0 dependencia de Excel como fonte principal
- [ ] Importacao/exportacao com log auditavel
- [ ] Supervisor com visao geral e conflitos em tempo real

