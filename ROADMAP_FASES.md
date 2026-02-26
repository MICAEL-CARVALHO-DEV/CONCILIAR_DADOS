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

## Fase 6 - Piloto Operacional (3 meses)
- Operacao real com usuarios de negocio e supervisao.
- Medir estabilidade: disponibilidade, erros criticos, tempo de resposta.
- Medir governanca: rastreabilidade, qualidade de import/export, retrabalho.
- Fechar evidencias de uso para aprovacao de TI e gestao.

## Fase 7 - Decisao de Infraestrutura (TI + gestao)
- Cenario A: 100% nuvem gerenciada.
  - Pro: implantacao rapida e menor operacao local.
  - Contra: validacao de compliance e politica de dados.
- Cenario B: servidor interno (on-prem/VM corporativa).
  - Pro: maior aderencia a politicas internas e controle de dados.
  - Contra: provisionamento mais burocratico e dependencia de TI.
- Cenario C: hibrido (banco interno + aplicacao em ambiente controlado).
  - Pro: equilibrio entre controle e agilidade.
  - Contra: maior complexidade de rede e operacao.
- Criterios de escolha:
  - custo total (curto e longo prazo),
  - aderencia de seguranca/compliance,
  - disponibilidade e backup/restore,
  - capacidade da equipe para operar o ambiente.

## Fase 8 - Operacao por Competencia LOA
- Catalogo de competencias `ANO/MES`.
- Importacao oficial por lote (somente perfil autorizado).
- Selecao de cenario apos login (`LOA ANO/MES` ou `IMPORT_RAIZ`).
- Trabalho da equipe sempre em cima do cenario escolhido.
