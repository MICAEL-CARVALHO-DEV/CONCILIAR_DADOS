# PROMPTS CODEX DUPLO

Goal: Ter prompts prontos para operar `Codex Desktop` e `Codex VS Code` no mesmo projeto sem perder contexto.
Success: O usuario escolhe o cenario, cola o prompt e a sessao ja entra no papel correto.

## Regra de uso
- `Desktop` = analise, arquitetura, checks, Figma, documentacao, revisao.
- `VS Code` = implementacao, testes, ajustes, integracao, commit.
- Se os dois forem codar, informar branch e arquivos liberados.

## Prompt 1 - Desktop para analise de tarefa
```txt
Atue como arquiteto e organizador deste projeto.
Nao implemente codigo agora.
Quero que voce:
1. leia o contexto atual
2. identifique o problema real
3. proponha a melhor estrategia
4. liste riscos
5. monte um plano curto com ordem de execucao

Contexto:
<colar contexto>

Nao codar. So analisar e organizar.
```

## Prompt 2 - Desktop para layout/Figma
```txt
Atue como lider de produto e design funcional do SEC Emendas.
Nao implemente codigo agora.
Quero estruturar a tela com foco em operacao real.

Objetivo:
<descrever tela>

Quero que voce entregue:
1. hierarquia da tela
2. distribuicao de blocos
3. toolbar
4. filtros
5. tabela
6. modais
7. dashboard se fizer sentido
8. prompt final para gerar imagem/Figma

Nao codar. So definir o modelo visual.
```

## Prompt 3 - Desktop para revisao funcional
```txt
Atue como revisor funcional do sistema.
Nao codar.
Quero que voce avalie se a funcionalidade abaixo esta coerente com a operacao da SEC.

Funcionalidade:
<descrever>

Quero:
1. pros
2. contras
3. risco operacional
4. decisao recomendada
5. o que depende do meu veredito
```

## Prompt 4 - VS Code para implementar tarefa
```txt
Implemente esta tarefa no codigo atual do projeto.
Antes de editar:
1. leia os arquivos relacionados
2. entenda o fluxo existente
3. preserve o comportamento que ja funciona

Tarefa:
<descrever tarefa>

Regras:
- nao quebrar login, import, export e auditoria
- manter compatibilidade com a beta atual
- fazer alteracao minima necessaria
- se houver impacto em checks/docs, atualizar tambem

No final:
1. diga o que foi alterado
2. diga o que nao foi alterado
3. diga como validar
```

## Prompt 5 - VS Code para bug fix
```txt
Investigue e corrija este bug no projeto atual.

Bug:
<colar erro>

Quero que voce:
1. localize a causa raiz
2. corrija com a menor mudanca segura
3. preserve o fluxo existente
4. valide se o erro realmente sumiu

No final:
1. causa raiz
2. correcao aplicada
3. como testar
```

## Prompt 6 - VS Code para refatoracao segura
```txt
Refatore esta area do projeto sem mudar regra de negocio.

Escopo:
<arquivo ou modulo>

Objetivo:
<o que organizar>

Regras:
- manter comportamento atual
- extrair funcoes/modulos sem inventar arquitetura desnecessaria
- preservar compatibilidade com o restante do sistema
- atualizar docs se a organizacao mudar

No final:
1. o que foi extraido
2. o que continua igual
3. risco residual
```

## Prompt 7 - Handoff do Desktop para o VS Code
```txt
Objetivo: <o que precisa acontecer>
Arquivos liberados: <arquivos/pastas que podem ser editados>
Feito ate agora: <estado atual>
Nao quebrar: <regras criticas>
Validacao esperada: <como saber que deu certo>
Proximo passo: implementar
```

## Prompt 8 - Handoff do VS Code para o Desktop
```txt
Objetivo executado: <tarefa>
Arquivos alterados: <lista curta>
Resultado: <o que ficou pronto>
Pontos de atencao: <risco ou limite>
Validacao rodada: <teste/manual/script>
Preciso agora: revisao funcional / layout / decisao / documentacao
```

## Prompt 9 - Dois Codex em paralelo
```txt
Estamos operando com duas sessoes de Codex no mesmo projeto.
Seu papel nesta sessao:
<Desktop ou VS Code>

Branch desta sessao:
<nome da branch ou main se so analise>

Arquivos reservados para esta sessao:
<lista>

Arquivos proibidos para esta sessao:
<lista>

Objetivo:
<tarefa>

Respeite estritamente esse escopo.
Se precisar sair dele, pare e sinalize.
```

## Prompt 10 - Prompt curto para o dia a dia
### Desktop
```txt
Analise, organize e me diga a melhor ordem para executar esta tarefa no SEC Emendas. Nao codar.
Tarefa: <descrever>
```

### VS Code
```txt
Implemente esta tarefa no SEC Emendas com seguranca e sem quebrar o que ja funciona.
Tarefa: <descrever>
```

## Modelo recomendado para este projeto
- Layout, checks, Figma, arquitetura: `Desktop`
- Codigo, bug, teste, ajuste fino, commit: `VS Code`

## Resume from
- Quando estiver em duvida, usar `Prompt 1` no `Desktop` e `Prompt 4` no `VS Code`.
