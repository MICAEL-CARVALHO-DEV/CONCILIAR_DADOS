# OPERACAO CODEX DUPLO

Goal: Usar `Codex no VS Code` e `Codex Desktop` no mesmo projeto sem conflito, sem sobrescrever arquivo e sem perder contexto.
Success: Cada sessao sabe o que pode editar, onde registrar decisao e como passar contexto para a outra.

## Regra principal
- Duas sessoes podem atuar no mesmo projeto.
- So uma sessao deve editar codigo critico por vez no mesmo branch.
- Se as duas forem codar ao mesmo tempo, usar branches separadas.

## Modelo recomendado
### Codex VS Code
Responsavel por:
- editar codigo
- rodar front, API e testes
- corrigir bug
- fazer commit
- integrar alteracoes finais

Arquivos preferenciais:
- `app.js`
- `index.html`
- `style.css`
- `frontend/js/*`
- `backend/*`
- `scripts/*`

### Codex Desktop
Responsavel por:
- analise de arquitetura
- prompts para Figma e imagens
- organizacao de checks
- revisao funcional
- documentacao e planejamento
- consolidacao de decisoes

Arquivos preferenciais:
- `checks/*`
- `docs/*`
- `anotacoes/*`

## Modo seguro de uso
### Modo 1 - Melhor para o dia a dia
- `VS Code` codando
- `Desktop` analisando, planejando, organizando e revisando

Quando usar:
- bug fix
- evolucao funcional
- layout em estudo
- fechamento de beta

### Modo 2 - Duas sessoes codando
Usar so quando houver divisao clara por area.

Regra:
- uma branch por sessao
- um escopo por sessao
- nenhum arquivo central compartilhado ao mesmo tempo

Exemplo:
- `VS Code`: `frontend/js/*`
- `Desktop`: `docs/*` + `checks/*` ou `backend/app/services/*`

## Arquivos que nao devem ser editados em paralelo
- `app.js`
- `index.html`
- `style.css`
- `backend/main.py`
- `CHECK62.md`
- `CHECKUSER.md`
- `checks/@DEVE_DE_CASA_BETA.md`

## Fluxo pratico para usar os 2
### Cenario A - Desktop apoia e VS Code executa
1. `Desktop` define a tarefa e o criterio de pronto.
2. `Desktop` registra pendencia ou plano.
3. `VS Code` implementa.
4. `VS Code` roda validacao.
5. `Desktop` revisa resultado.
6. `VS Code` ajusta e fecha.

### Cenario B - Os 2 codando
1. Criar branch da sessao 1.
2. Criar branch da sessao 2.
3. Trancar o escopo por pasta/arquivo.
4. Trabalhar sem sobrepor arquivos.
5. Revisar diff de cada branch.
6. Fazer merge controlado por uma sessao final.

## Comandos minimos
Criar branch da sessao atual:
```powershell
git checkout -b feat/nome-da-frente
```

Ver arquivos alterados antes de continuar:
```powershell
git status --short
```

Ver diff antes de integrar:
```powershell
git diff
```

## Como voce pode "codar os 2"
### Forma correta
- Use o `Desktop` para pedir:
  - analise do problema
  - desenho da solucao
  - checklist
  - prompt de implementacao
  - revisao do que foi feito
- Use o `VS Code` para pedir:
  - implementacao real
  - teste
  - ajuste fino
  - commit

### Exemplo real no seu projeto
- `Desktop`: "estruture o layout beta da LOA e da TESTE, defina blocos e navegacao"
- `VS Code`: "implemente a toolbar, filtros e os cards conforme o plano"

Outro exemplo:
- `Desktop`: "revise o fluxo de import e proponha governanca"
- `VS Code`: "codifique a governanca de import no backend e no front"

## Handoff curto entre uma sessao e outra
Sempre passar:
- objetivo
- arquivo principal
- o que ja foi feito
- o que nao pode quebrar
- proximo passo

Modelo:
```txt
Objetivo: <o que precisa acontecer>
Arquivos: <arquivos que podem ser tocados>
Feito: <estado atual>
Nao quebrar: <regras>
Proximo passo: <acao exata>
```

## O que evitar
- duas sessoes alterando `app.js` ao mesmo tempo
- uma sessao mudando regra de negocio e a outra mudando UI da mesma tela sem alinhamento
- fazer commit sem revisar `git diff`
- usar o `Desktop` para sair editando codigo principal se o `VS Code` ja estiver nessa frente

## Regra final de governanca
- `Desktop` pensa, organiza, revisa e desenha.
- `VS Code` executa, testa e integra.
- Quando os 2 codarem, branch separada e escopo travado.

## Resume from
- Modelo padrao recomendado para este projeto: `Desktop = analise/orquestracao`, `VS Code = execucao/codigo`.
