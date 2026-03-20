# Critérios de Aceite: Governança de Importação (Corte 2)

**Objetivo:** Garantir que nenhuma importação em massa proveniente de planilhas XLSX seja aplicada diretamente no banco de dados sem passar por um estágio de "Pré-Visualização" (Preview) e revisão manual formalizada (Aprovação Mestre).

## 1. Regras de Fluxo (Workflow)

### 1.1 Fluxo de Preview (Rascunho)
- Todo processamento do botão "Importar XLSX" **NÃO deve** injetar os dados automaticamente no `state.records` global da sessão corrente, muito menos disparar WebSockets para outros usuários.
- Os dados devem ser mapeados em tela apenas para leitura (Planilha 1, Aba de Avisos/Incompletos), permitindo auditoria sumária pelo operador.

### 1.2 Criação do Lote Pendente
- Imediatamente após a validação do XLSX no Front-end, o sistema deve disparar pacote (payload metadata + chunk lines) para a API designando a criação de um **"Lote de Importação"**.
- O Status inicial deste lote no Backend deve obrigatoriamente nascer como `PENDENTE` (ou `PRE_VESSEL`).
- Ao concluir a leitura local, a UI deve apresentar o Card de "Lote Recebido para Governança".

### 1.3 Perfilamento e Gatekeeping
- O botão **[Aprovar e Aplicar Lote Oficial]** e suas variantes só podem ser renderizados se a sessão autenticada pertencer aos perfis de **`SUPERVISAO`** ou **`PROGRAMADOR`**.
- Usuários `OPERADOR` ou estritamente leitores devem visualizar no painel que há um lote pendente na fila, mas não terão autoridade para chancelar.

### 1.4 Fluxo Aprovado (Commit e Merge)
- Ao clicar no botão Mestre de Aprovação, o front-end ativará unicamente um ping seguro ao endpoint de confirmação: `POST /imports/emendas/apply`.
- O payload de apply deve levar o mesmo corpo do preview e o `preview_hash` retornado por `POST /imports/emendas/preview`.
- O back-end é o responsável absoluto por fundir o lote pendente nos dados principais (UPSERT na tabela de Emendas e criação de Logs de Auditoria para as alterações sofridas).
- Com resposta `200 OK` do backend, a sessão local de todos os usuários é atualizada através da fila normal de realtime via WebSocket como "Atualização Geral".

## 2. Cenários Reais de Teste (QA)

#### Cenário A: Trava de Segurança (Subversão Frontend)
1. Fazer upload de um arquivo contendo 5 alterações aleatórias usando a conta de `OPERADOR`.
2. Tentar visualizar ou recarregar a tabela principal.
**Aceite:** A tabela principal (operacional) DEVE permanecer inalterada. As mudanças existem puramente no painel de Preview no Lote Pendente.

#### Cenário B: Tentativa de Forçar a Rota da API
1. Um usuário não-supervisor, usando interceptador de request, tenta disparar um `POST /imports/emendas/apply`.
**Aceite:** O Backend retornará erro `403 Forbidden` ou similar negando veementemente a gravação, e as 5 alterações continuam retidas em Preview.

#### Cenário C: Validação Estrita do Preview Hash
1. Fazer upload de planilha e ler no Preview (Gera `hash_A`).
2. Fazer interceptação de rede e alterar 1 linha do payload original do lote, tentando enviar no Apply sem alterar o `hash_A`.
**Aceite:** O Backend compara a matriz de dados recalculada contra o `hash_A` recebido. Como há divergência (tampering/adulteração em voo), retorna `400 Bad Request` "Hash validation failed" abortando preventivamente o apply. 

#### Cenário D: Bloqueio Definitivo do Sync Legado
1. Um usuário mal intencionado tenta submeter pacote de dados brutos pelo endpoint antigo `POST /api/sync` enviando flag de force import.
**Aceite:** Estando em modo `production_ready=true`, o `health_check` indica `legacy_import_sync_enabled: false`. O endpoint bloqueia o pacote legado com `405 Method Not Allowed` ou restrição explícita, forçando fluxo obrigatório em 2 etapas.

#### Cenário E: Ciclo Ideal Completo (Gatekeeper)
1. Logar como `SUPERVISAO` ou `PROGRAMADOR`.
2. Fazer Upload de um arquivo de tamanho real.
3. Analisar Preview, constatar ausência de corrupção massiva de dados.
4. Clicar no botão `[Aprovar e Aplicar Lote Oficial]`.
5. Visualizar notificação de sucesso e ver a Tabela Operacional ser "puxada" e refrescada via socket.
**Aceite:** Os dados correntes estão em sua nova versão com base no apply do `preview_hash` exato. A auditoria carimba com a identificação do supervisor.

## 3. Limites de Responsabilidade Atuais (Handoff Code e Codex)
A interface front (`app.js`, `importControls.js`) foi adaptada e possui o botão Mestre conectando um helper de API vazio (`apiSyncOps.js`).
Backend já possui a etapa de preview sem escrita através de `POST /imports/emendas/preview`.
Backend já possui o apply governado através de `POST /imports/emendas/apply`.
Para que estes critérios passem por completo, ainda falta ao executor Front ligar o fluxo `preview -> revisar -> aplicar` sem usar o sync direto como atalho.
