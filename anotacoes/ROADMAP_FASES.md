# Plano de Evolucao em Fases (Sem Perda de Dados)

## Fase 1 - Seguranca e Base Multiusuario (concluida)
- Autenticacao por sessao (`login` e `cadastro`).
- Perfis: `APG`, `SUPERVISAO`, `CONTABIL`, `POWERBI`, `PROGRAMADOR`.
- Auditoria com usuario real em cada evento.
- Endpoints protegidos por perfil no backend.

## Fase 2 - UX de Acesso (concluida)
- Tela de login/cadastro no front.
- Cadastro com selecao de funcao em lista fixa.
- Troca de usuario sem perder estado da aplicacao.

## Fase 3 - Governanca de Dados (proximo)
- Politica de senha (minimo, expiracao opcional).
- Bloqueio por tentativas invalidas.
- Cadastro de usuario somente por gestor/programador.

## Fase 4 - Operacao de Equipe (proximo)
- Painel de usuarios (ativar/desativar, resetar senha).
- Filtros por usuario/setor no audit.
- Exportacao de audit por periodo.

## Fase 5 - Producao Corporativa (proximo)
- Banco central PostgreSQL em servidor da rede.
- Backup automatico e trilha de restauracao.
- Integracao com AD/SSO (se TI permitir).
