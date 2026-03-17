# BETA FUNCIONAL EMPRESA

CHECKLIST
Goal: deixar a versao beta operacional e validavel para uso de empresa sem quebrar contrato do front/back.
Success: stack sobe em URL oficial, contratos criticos respondem, smoke passa e existe roteiro simples de execucao.

- [DONE] Mapear base oficial e contratos de pagina (`Operacao`, `Governanca`, `Suporte`, `Power BI`).
- [DONE] Ajustar navegacao para abrir setores no palco principal (sem render dentro da lateral).
- [DONE] Criar scripts de operacao empresarial (subida + validacao de pronto).
- [DONE] Executar validacao automatica e registrar resultado.
- [DOING] Entregar handoff final com comando unico para equipe.

Active: Entregar handoff final com comando unico para equipe.
Risks: ainda depende de validacao manual visual final no navegador por perfil.

CHECKPOINT
Completed:
- scripts/start_beta_empresa.ps1 criado
- scripts/validar_beta_empresa.ps1 criado
- validacao automatica executada com PASSOU (smoke autenticado opcional ficou SKIP por falta de SEC_OWNER_*)

Pending:
- validacao manual visual por perfil (usuario comum e PROGRAMADOR)
- smoke autenticado com credenciais reais (opcional recomendado para pre-producao)

Blocked:
- nenhum bloqueio tecnico atual

Resume from:
- rodar start_beta_empresa.ps1 e depois validar_beta_empresa.ps1 no ambiente da equipe

