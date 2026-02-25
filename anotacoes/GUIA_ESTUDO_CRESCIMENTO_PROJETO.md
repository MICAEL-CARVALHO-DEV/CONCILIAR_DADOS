# GUIA DE ESTUDO - CRESCIMENTO NO PROJETO SEC EMENDAS

## Objetivo
Evoluir de junior front para full stack com base no proprio sistema, aprendendo no codigo real e registrando evidencia tecnica.

## Regra principal de estudo
Sempre seguir este ciclo:
1. Entender uma parte do sistema.
2. Alterar uma parte pequena.
3. Testar com script.
4. Registrar no log.
5. Explicar com suas palavras o que mudou.

## Roteiro de 12 semanas

### Fase 1 (Semanas 1-3) - Base tecnica do seu projeto
Foco:
- HTML/CSS/JS do front atual
- Fluxo de importacao/exportacao
- Leitura de eventos e timeline

Pratica:
- Mapear funcoes principais em `app.js`.
- Explicar em 1 pagina: "como um clique vira alteracao no sistema".
- Fazer 1 melhoria pequena de UI por semana sem quebrar testes.

Entrega:
- 3 anotacoes em `anotacoes/LOG_ALTERACOES.md` com contexto + acao + resultado.

### Fase 2 (Semanas 4-6) - API e autenticacao
Foco:
- Rotas FastAPI
- Login/token
- Regras de permissao

Pratica:
- Ler `backend/app/main.py` endpoint por endpoint.
- Fazer chamadas manuais no PowerShell (`Invoke-RestMethod`).
- Implementar 1 ajuste simples de validacao backend.

Entrega:
- Documento curto: "quais rotas sao criticas e por que".

### Fase 3 (Semanas 7-9) - Banco e auditoria
Foco:
- Modelos SQLAlchemy
- Alembic migration
- Tabela de historico/export_logs

Pratica:
- Criar 1 migration simples (campo novo de auditoria).
- Validar retrocompatibilidade (default + schema legado).
- Provar no teste que o campo esta sendo salvo.

Entrega:
- Evidencia com comando, resultado e print textual no log.

### Fase 4 (Semanas 10-12) - Operacao e confiabilidade
Foco:
- Scripts de start/teste
- Regressao P0
- Concorrencia C34
- Fluxo de release com git

Pratica:
- Rodar suite antes de todo commit relevante.
- Criar checklist de release em 10 itens.
- Simular queda de ambiente e subir tudo em menos de 5 min.

Entrega:
- Demo tecnica de 3 minutos para supervisor/TI.

## Rotina semanal recomendada
- 3 dias por semana (60 a 90 min por dia)
- Dia A: estudo de codigo
- Dia B: implementacao pequena
- Dia C: teste + documentacao

## Checklist de aprendizagem (marcar progresso)
- [ ] Entendo o fluxo front -> API -> banco.
- [ ] Consigo criar endpoint simples sem ajuda.
- [ ] Consigo criar migration e aplicar sem quebrar.
- [ ] Consigo diagnosticar erro por log.
- [ ] Consigo explicar regra de negocio para supervisor.
- [ ] Consigo preparar release com teste e rollback.

## Como estudar cada arquivo
- `app.js`: regras de tela e integracao API.
- `index.html` e `style.css`: estrutura visual e UX.
- `backend/app/main.py`: rotas e orquestracao.
- `backend/app/models.py`: estrutura de dados persistidos.
- `backend/app/schemas.py`: validacao e contratos da API.
- `scripts/regressao_p0.ps1`: garantia de nao regressao.
- `scripts/concorrencia_c34.ps1`: comportamento multiusuario.

## Template de anotacao por estudo
Use este bloco em `anotacoes/LOG_ALTERACOES.md`:

- Data:
- Tema estudado:
- Arquivo(s):
- O que eu entendi:
- O que eu alterei:
- Como testei:
- Resultado:
- Duvida aberta:

## Marco de carreira dentro deste projeto
Voce estara pronto para nivel pleno inicial quando conseguir:
1. Entregar feature de ponta a ponta (front + API + banco + teste).
2. Corrigir bug sem ajuda direta, usando logs e leitura do fluxo.
3. Defender tecnicamente uma decisao de arquitetura em reuniao.

## Regra de ouro
Nao avance por volume de codigo.
Avance por capacidade de explicar, testar e manter o que voce entregou.
