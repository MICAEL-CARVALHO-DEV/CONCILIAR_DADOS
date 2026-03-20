# Roteiro de Teste Multiusuario (U01 - Sync Central)

Objetivo:
- validar a resiliencia do WebSocket
- validar concorrencia de edicao entre dois acessos
- validar refresh remoto sem divergencia entre timeline e estado oficial

## Preparacao

- Pre-check automatizado:
  - rodar `python .\scripts\validar_u01_sync_backend.py`
  - se falhar, nao seguir para homologacao manual
- Ambiente:
  - beta/homolog ativo
  - preferencialmente usar o front oficial do Cloudflare
- Usuarios:
  - 3 perfis ativos (A, B, C) com permissao de operacao/supervisao
- Navegadores:
  - abrir 3 sessoes separadas (perfil/anonimo/navegadores diferentes)

## Teste 1 - Presenca e sync de tabela

Acao:
1. Logar A, B e C simultaneamente.
2. Usuario A altera o andamento global de uma linha direto na tabela.

Resultado esperado:
- a alteracao aparece em B e C em menos de 1 segundo, sem `F5`
- nenhuma sessao sofre salto de scroll ou recarregamento abrupto

## Teste 2 - Concorrencia no detalhe da mesma emenda

Acao:
1. Usuario A abre o modal da mesma emenda que o usuario B.
2. Usuario B salva uma alteracao relevante.
3. Usuario A fica com foco em um campo de texto enquanto B salva.

Resultado esperado:
- A ve indicacao de atualizacao remota pendente
- o campo em foco nao pode ser substituido no meio da digitacao
- ao tirar o foco, a tela aplica o estado remoto mais recente com seguranca

## Teste 3 - Queda de conexao e reconexao simultanea

Acao:
1. Colocar A e B em `Offline` via DevTools.
2. Tentar salvar rascunhos nos dois lados.
3. Voltar os dois para `Online` ao mesmo tempo.

Resultado esperado:
- o jitter de reconexao impede thundering herd
- as pendencias sao retransmitidas sem derrubar o fluxo
- os dois acessos convergem para um estado final coerente

## Teste 4 - Fila de refresh sob rede lenta

Acao:
1. Colocar o usuario A em `Slow 3G`.
2. Fazer varias alteracoes rapidas em sequencia.

Resultado esperado:
- a fila processa sem travar permanentemente
- a flag de seguranca do refresh e liberada em no maximo 30 segundos

## Criterio de Fechamento

Se os 4 testes passarem e a tabela atualizar sem refresh manual, o `U01 - Sync central e multiusuario` pode ser marcado como estavel para beta.
