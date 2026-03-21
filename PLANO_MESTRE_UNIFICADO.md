# PLANO MESTRE UNIFICADO

Goal: concentrar em um unico ponto o recorte ativo, a ordem de execucao e os gates reais da beta, sem duplicar o papel do `check62.md`, dos checkpoints operacionais e da central de pendencias.
Success: qualquer pessoa entende em menos de 5 minutos qual e o veredito atual da beta, o que bloqueia abertura maior, o que entra no corte imediato e o que fica para pos-beta.

## Papel canonico deste arquivo
- `PLANO_MESTRE_UNIFICADO.md` = prioridade unica, recorte ativo e ordem oficial de execucao.
- `anotacoes/documentacao_raiz/check62.md` = mapa mestre de status historico, aceite e rastreio por item.
- `checks/@deve_de_casa_beta.md` = fonte canonica de pendencias da beta (decisao, validacao e bloqueios).
- `CHECKPOINT_OPERACOES_FINAL.md` = quadro operacional vivo por `U01..U09`.
- `CHECKPOINT_OPERACOES_TABELA.md` = visao rapida da execucao.

## Veredito atual da plataforma
- Data-base: `2026-03-21`
- Backend publico: `OK`, com `production_ready=true`, branch `main` e commit publicado validado.
- Beta fechada/interna: `APROVOU COM RESSALVAS`
- Beta publica/ampliada: `APROVOU COM RESSALVAS`

Pendencia principal da beta publica:
1. consolidar a politica operacional de senha, bloqueio e contingencia (`R06`)

## Quadro sincronizado de ataque

### AGORA - fechar a beta com regra operacional valida
- `R06` Politica operacional de auth e contingencia.
  Necessidade atendida: a operacao deixa de improvisar em senha, bloqueio por tentativa, perda de acesso e indisponibilidade.
  Aceite pratico: politica publicada, alinhada ao comportamento real do sistema e referenciada na central da beta.

### DEPOIS DA BETA FUNCIONANDO - manutencao com o carro em movimento
- `R07` Rotina de backup real + prova de recuperacao.
  Necessidade atendida: backup diario automatizado com dono, horario, log de execucao e destino oficial, mais restore testado com evidencia e roteiro operacional de desastre.
- `R08` Teste automatico para evitar regressao silenciosa.
  Necessidade atendida: smoke de release e suite minima do backend rodando em rotina e servindo como gate.

### FUTURO - depois que a beta estiver estavel e sustentavel
- `R09` BI externo lendo o banco oficial sem depender de planilha.
- `R10` Decisao formal de nuvem vs interno vs hibrido sem reabrir regra de negocio.
- Pendencias preservadas como pos-beta em `checks/@deve_de_casa_beta.md`:
  `workspace_id` real no backend se a estrategia multi-base voltar, refinamento visual do export, redesign maior, mapa interativo, migracao interna, leitura externa Power BI e melhorias finais de acessibilidade/UX.

## Recorte unificado ativo

### BLOCO P0 - destravar beta publica com seguranca

| ID | Trilha | Faz | Aceite objetivo |
| --- | --- | --- | --- |
| R01 | U08/Auth | Remover vazamento do token de reset na API e no front | `POST /auth/recovery-request` nao retorna token utilizavel e o front nao monta link de reset a partir da resposta |
| R02 | U09/Deploy Front | Atualizar o workflow do Cloudflare Pages para publicar a estrutura real (`index.html`, `style.css`, `app.js`, `frontend/`, `assets/`, `vendor/`) | deploy do front sobe a partir de `main` sem depender de arquivos raiz antigos e smoke visual passa |
| R03 | U09/Qualidade | Fazer o gate de lint voltar a ser confiavel | `npm run lint` passa ou fica ajustado oficialmente ao contrato atual do projeto, sem falso erro estrutural |

### BLOCO P1 - endurecimento para beta aberta controlada

| ID | Trilha | Faz | Aceite objetivo |
| --- | --- | --- | --- |
| R04 | U08/Auth | Reduzir persistencia do token de sessao no navegador | sair de `localStorage` amplo para `sessionStorage` ou modo explicito de "lembrar sessao" |
| R05 | C03/C04/C18/C27 | Fechar regras operacionais que ainda estao ambiguas no mapa | regra de versao, retencao, append-only e export oficial documentadas e sem leitura ambigua |
| R06 | C42/C43 | Consolidar politica operacional de senha, bloqueio e contingencia | politica publicada e alinhada com o comportamento real do sistema |

### BLOCO P1 - producao controlada

| ID | Trilha | Faz | Aceite objetivo |
| --- | --- | --- | --- |
| R07 | C40/C41 | Backup e restore com rotina real | backup diario automatizado + restore testado com evidencia |
| R08 | C44 | Suite automatizada minima do backend | smoke de release + testes backend rodando em rotina e servindo como gate |

### BLOCO P2 - pos-beta e escala

| ID | Trilha | Faz | Aceite objetivo |
| --- | --- | --- | --- |
| R09 | U07/C59 | BI externo e camada executiva completa | `Power BI Desktop` lendo o banco oficial sem depender de planilha |
| R10 | Infra futura | Servidor interno/intranet so depois da base estavel | decisao formal de manter nuvem, migrar ou operar hibrido sem reabrir a regra de negocio |

## Ordem oficial de execucao a partir de agora
1. `R06` politica operacional de auth e contingencia
2. `R07` backup diario automatizado + restore testado com evidencia
3. `R08` suite automatizada minima do backend
4. `R09` e `R10` como pos-beta

## O que entra neste corte e o que fica fora

Entra agora:
- `R06`
- politica operacional de auth, bloqueio e contingencia
- consolidacao final das regras que faltam para a beta rodar sem improviso

Fica fora deste corte:
- `R07` e `R08` entram logo depois da beta funcionando, como manutencao em operacao
- redesign grande de layout
- evolucao executiva completa do BI
- migracao para servidor interno
- workspace real no backend

## Regra de atualizacao
- Se a prioridade mudar, atualizar este arquivo primeiro.
- Se o status detalhado do item mudar, refletir em `check62.md`.
- Se nascer nova pendencia da beta, registrar primeiro em `checks/@deve_de_casa_beta.md`.
- Se a execucao de uma operacao mudar, refletir em `CHECKPOINT_OPERACOES_FINAL.md` e `CHECKPOINT_OPERACOES_TABELA.md`.

## Resume from
- executar `R06` como proximo corte de endurecimento operacional da beta
