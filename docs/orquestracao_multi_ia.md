# Orquestracao Multi-IA

## Objetivo
Usar varias IAs para acelerar a refatoracao sem perder controle de arquitetura, sem conflito de arquivo e sem quebrar contrato entre frontend e backend.

## Regra central
Varias IAs podem construir.
So a IA ORQ decide a arquitetura final e autoriza integracao.

## Papeis das IAs

### IA ORQ
Responsavel por:

- definir prioridade e ordem de execucao
- dividir tarefas por area
- travar contratos criticos
- revisar coerencia entre entregas
- decidir o que entra agora, o que espera e o que volta para ajuste
- atualizar o plano principal da refatoracao

Arquivos e temas reservados para ORQ:

- contratos de autenticacao
- contratos de lock e concorrencia
- contratos de importacao e exportacao
- organizacao final de `app.js` enquanto a migracao estiver em andamento
- organizacao final de `backend/main.py` enquanto a migracao estiver em andamento
- decisao de nomenclatura e estrutura de pastas

### IA Frontend
Responsavel por:

- modularizacao do frontend
- extracao de utilitarios
- cliente central de API no frontend
- auth store e guard do frontend
- modais, tabela, filtros, renderizacao e componentes de UI

Pode atuar em:

- `frontend/js/*`
- `style.css` quando a mudanca estiver ligada a componente extraido
- paginas front relacionadas ao modulo em refatoracao

Nao deve alterar:

- contrato de resposta da API por conta propria
- regra central de permissao
- fluxo final de auth sem validacao da ORQ

### IA Backend
Responsavel por:

- separar `main.py` em routers, services, core e repositories
- mover auth, usuarios, dominio principal, auditoria e import/export
- padronizar erros e dependencias comuns

Pode atuar em:

- `backend/app/*`
- `backend/main.py` somente quando a ORQ liberar a etapa
- schemas e services do backend

Nao deve alterar:

- payload esperado pelo frontend sem alinhar com ORQ
- naming padrao de rotas sem validacao central

### IA QA e Documentacao
Responsavel por:

- atualizar mapas tecnicos
- manter checklist de regressao
- registrar evidencias de homologacao
- preparar smoke tests manuais e automacoes simples
- documentar riscos, bloqueios e ponto de retomada

Pode atuar em:

- `REFATORACAO_CHECKLIST.md`
- `docs/*.md`
- `frontend/js/MAPA_APP.md`
- `backend/MAPA_MAIN.md`
- `scripts/smoke/*` quando existir essa separacao

Nao deve alterar:

- regra de negocio central
- contrato de API

### IA Dados ou Power BI
Responsavel por:

- leitura de dados para consumo analitico
- documentacao de campos, filtros e origem da informacao
- requisitos de exportacao e visao analitica

Pode atuar em:

- documentacao de dados
- consultas e especificacao de exportacao
- desenho de campos para consumo externo

Nao deve alterar:

- auth
- lock de edicao
- fluxo operacional principal sem revisao da ORQ

## Regra de divisao de tarefas

### Dividir por dominio
Boa divisao:

- frontend em arquivos de frontend
- backend em arquivos de backend
- docs e testes em arquivos de docs e testes

Ma divisao:

- duas IAs no mesmo arquivo
- duas IAs no mesmo fluxo ao mesmo tempo
- uma IA mudando front e back sem coordenacao

### Dividir por arquivo
Uma tarefa so pode ser entregue se os arquivos tocados estiverem claros antes do inicio.

Modelo:

- tarefa
- arquivos permitidos
- arquivos proibidos
- criterio de pronto

## Arquivos criticos com acesso controlado
Enquanto a refatoracao estiver em andamento, estes temas ficam travados pela ORQ:

- autenticacao
- sessao e token
- lock de edicao
- contratos de erro `401`, `403`, `409`
- importacao e exportacao
- bootstrap do frontend
- bootstrap do backend

Se outra IA precisar tocar nesses pontos, a tarefa deve ser marcada como `BLOCKED` e voltar para a ORQ.

## Protocolo curto de entrega

### 1. Atribuicao da tarefa
A ORQ envia a tarefa com este formato:

```md
Tarefa:
Objetivo: <resultado esperado>
Arquivos permitidos: <lista>
Arquivos proibidos: <lista>
Contrato afetado: <nenhum ou qual>
Criterio de pronto: <resultado verificavel>
```

### 2. Execucao pela IA especialista
A IA especialista deve:

- trabalhar apenas nos arquivos permitidos
- manter o padrao de nomes existente ou o padrao definido pela ORQ
- nao mexer em contrato compartilhado sem liberacao
- entregar mudanca pequena e reversivel

### 3. Entrega obrigatoria da IA especialista
Toda entrega deve vir neste formato:

```md
Entrega:
- objetivo atendido
- arquivos tocados
- contrato afetado ou nao
- dependencia para outra IA
- risco de regressao
- testes executados ou nao executados
```

### 4. Revisao pela ORQ
A ORQ deve validar:

- se a entrega respeitou o escopo
- se quebrou contrato entre front e back
- se nomes, estrutura e padrao continuam coerentes
- se a tarefa pode integrar agora ou precisa esperar outra parte

### 5. Atualizacao de controle
Apos integrar, atualizar:

- `docs/refatoracao.md`
- `REFATORACAO_CHECKLIST.md`
- mapas tecnicos que foram afetados

## Regras de integracao

- nao integrar duas entregas conflitantes ao mesmo tempo
- nao aceitar mudanca sem lista clara de arquivos tocados
- nao deixar documentacao atrasada mais de uma etapa
- nao acumular mudanca grande sem checkpoint
- manter commits pequenos e tematicos

## Sinais de alerta
Se acontecer qualquer um desses casos, parar e voltar para a ORQ:

- duas IAs querem editar o mesmo arquivo
- backend mudou payload sem combinar
- frontend passou a depender de nome novo sem contrato aprovado
- uma IA removeu codigo que outra ainda usa
- a documentacao ficou diferente do que foi implementado

## Cadencia recomendada

### Inicio do bloco
- ORQ define tarefas do bloco
- especialistas executam em paralelo por dominio

### Meio do bloco
- ORQ revisa entregas
- QA atualiza checklist e mapa

### Fim do bloco
- smoke rapido
- checkpoint
- ajuste do proximo bloco

## Modelo de quadro

### A fazer
- tarefas aprovadas pela ORQ e ainda nao iniciadas

### Fazendo
- uma tarefa por IA

### Revisao ORQ
- entrega pronta aguardando validacao central

### Feito
- tarefa integrada e registrada no checklist

### Bloqueado
- tarefa parada por conflito, dependencia ou contrato

## Veredito operacional
Multi-IA acelera quando:

- o escopo esta dividido por dominio
- os arquivos estao claramente separados
- a ORQ controla arquitetura e integracao

Multi-IA atrapalha quando:

- varias IAs mexem no mesmo fluxo
- nao existe dono do contrato
- a documentacao nao acompanha a execucao

## Ponto de uso neste projeto
Usar esta regra durante a refatoracao estrutural para:

- desmontar `app.js` com seguranca
- modularizar o backend sem quebrar o frontend
- manter checklist, mapas e homologacao sempre atualizados

## Aplicacao oficial da fase atual
Durante a fase atual do projeto:

- `Codex VS Code` assume `backend + deve de casa tecnico`
- `Codex Desktop` assume `front beta + Figma + layout`
- `Gemini` entra como revisor/contraponto quando a ORQ precisar de segunda opiniao

Check de coordenacao:
- `../checks/@orq_duas_trilhas.md`

Regras praticas:
- backend publica handoff curto para o front sempre que mudar endpoint/payload/campo
- front publica handoff curto para o backend sempre que o layout novo exigir novo dado ou nova area de contexto
- decisoes ainda abertas do `@deve_de_casa_beta.md` continuam voltando para a ORQ antes de virar implementacao definitiva
