# CATALOGO CODIGOS PREDEFINIDOS - SEC Emendas

## Perfis de usuario
- `APG`: operacao e acompanhamento
- `SUPERVISAO`: visao geral e validacao
- `CONTABIL`: analise contabil
- `POWERBI`: consumo analitico
- `PROGRAMADOR`: visao tecnica completa

## Tipos de evento (timeline/audit)
- `IMPORT`: registro criado via importacao
- `MARK_STATUS`: marcacao de status por usuario
- `NOTE`: observacao livre
- `EDIT_FIELD`: alteracao de campo
- `OFFICIAL_STATUS`: mudanca de status oficial (se habilitado)

## Status utilizados
- `Recebido`
- `Em analise`
- `Pendente`
- `Aguardando execucao`
- `Em execucao`
- `Aprovado`
- `Concluido`
- `Cancelado`

## Chaves de sessao/storage
- `SEC_SESSION_TOKEN`: token da sessao logada
- `SEC_USER_NAME`: nome do usuario atual
- `SEC_USER_ROLE`: perfil do usuario atual
- `SEC_API_BASE_URL`: URL da API ativa
- `SEC_API_ENABLED`: flag de uso da API
- `SEC_STATE_PING`: sincronizacao entre abas

## Portas locais padrao
- `8000`: API FastAPI
- `8081` (ou `5500`): frontend local

## Scripts e o que fazem
- `scripts/start_tudo.ps1`: sobe API + front com 1 comando
- `scripts/start_api.ps1`: sobe API local
- `scripts/start_front.ps1`: sobe front local
- `scripts/smoke_e2e.ps1`: teste rapido fim-a-fim
- `backend/run_api.ps1`: instala deps e inicia API

## Regra operacional atual
- Fluxo oficial com arquivo `.xlsx`.
- Nao misturar dados demo com dados reais.
