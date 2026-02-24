# RELATORIO - PLANO DE EVOLUCAO SEC EMENDAS

## 1. Objetivo
Transformar o processo atual (Excel manual) em operacao controlada com:
- rastreabilidade por usuario,
- historico auditavel de ponta a ponta,
- controle de importacao/exportacao,
- visao de gestao para supervisao.

## 2. Estado atual (base ja implementada)
### Frontend
- Tela principal com status oficial, conflitos e timeline por emenda.
- Login e cadastro em paginas separadas (`login.html` e `cadastro.html`).
- Painel inicial com ultimas alteracoes e autor da acao.
- Importacao CSV/XLSX com resumo de processamento.

### Backend (Python/FastAPI)
- Endpoints de autenticacao (login, cadastro, sessao).
- Perfis de usuario: `APG`, `SUPERVISAO`, `CONTABIL`, `POWERBI`, `PROGRAMADOR`.
- Endpoints de emendas, mudanca de status e eventos.

## 3. Problema que ainda existe
- Excel ainda pode ser tratado como fonte principal por costume operacional.
- Falta consolidar governanca final de rede, backup e retencao com TI.
- Falta fechar rastreio formal de lote de importacao/exportacao no padrao corporativo.

## 4. Modelo alvo (recomendado)
### Fonte de verdade
- Banco central PostgreSQL = fonte oficial.
- Excel = apenas entrada/saida (import/export).

### Arquivos de rede
- Pasta 1: `\\servidor\\emendas\\01_historico` (imutavel, todas versoes).
- Pasta 2: `\\servidor\\emendas\\02_atual` (snapshot mais recente).
- Pasta 3: `\\servidor\\emendas\\03_logs` (manifestos e comprovantes).

### Auditoria
Cada alteracao deve registrar:
- usuario,
- perfil,
- data/hora,
- tipo do evento,
- valor anterior e novo valor,
- motivo,
- origem (UI/API/IMPORT/EXPORT).

## 5. Fluxo operacional proposto
1. Usuario loga no sistema.
2. Importa planilha (CSV/XLSX).
3. Sistema cria `lote_importacao` com metadados do arquivo.
4. Linhas sao validadas e aplicadas nas `emendas`.
5. Mudancas viram eventos na `timeline`.
6. Exportacao gera arquivo na pasta de rede e log de exportacao.
7. Supervisao acompanha painel geral e divergencias.

## 6. Estruturas de dados alvo
- `usuarios`
- `usuarios_sessoes`
- `emendas`
- `historico_eventos`
- `lotes_importacao`
- `import_linhas` (opcional, recomendado)
- `export_logs`

## 7. Fases futuras
### Fase A - Fechamento de governanca
- Politica oficial: banco como fonte principal.
- Regra oficial de versao de arquivos e retencao.
- Aprovacao de pasta de rede com TI.

### Fase B - Operacao auditavel completa
- Lote de importacao com hash e trilha de erros.
- Log de exportacao com filtros e responsavel.
- Permissoes finas por perfil.

### Fase C - Producao corporativa
- PostgreSQL central na intranet.
- Backup diario + teste de restore.
- Power BI conectado direto ao banco.

## 8. Riscos e mitigacao
- Risco: uso paralelo de Excel fora do sistema.
  - Mitigacao: publicar fluxo unico e bloquear operacao fora do sistema.
- Risco: sem rede liberada no inicio.
  - Mitigacao: usar pasta local simulada e depois trocar apenas caminho base.
- Risco: perda de historico por operacao manual.
  - Mitigacao: historico append-only no banco.

## 9. Criterios de sucesso
- 100% das alteracoes com rastreio por usuario.
- Importacao/exportacao com log auditavel.
- Supervisor com visao geral e conflitos.
- Excel sem papel de fonte principal.

## 10. Decisoes que precisam de aprovacao
- Servidor da API (host interno).
- Servidor do PostgreSQL.
- Caminho de pasta de rede para historico/snapshot.
- Politica de backup e retencao.
