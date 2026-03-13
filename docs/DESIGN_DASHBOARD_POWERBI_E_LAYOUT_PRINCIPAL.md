# DESIGN DASHBOARD POWERBI E LAYOUT PRINCIPAL

Goal: Registrar a direcao oficial de design para a futura reformulacao visual do `SEC Emendas`, separando o layout operacional principal da visao executiva `Power BI`.
Success: Quando chegar a hora de redesenhar a interface, a equipe ja tera uma base objetiva para prompts, scripts, wireframes e implementacao sem retrabalho conceitual.

## Escopo deste documento
- Este documento e de `analise e direcao`.
- Nao e ordem de implementacao imediata.
- O objetivo e consolidar:
  - referencia visual
  - criterio de uso por perfil
  - o que absorver
  - o que nao copiar
  - o caminho ideal de evolucao do layout

## Contexto atual
- O sistema ja esta em `beta funcional`.
- O layout atual ja atende a operacao, mas ainda esta visualmente misto:
  - parte operacional
  - parte executiva
  - parte beta/homologacao
- O dashboard `Visao Power BI` e o layout principal ainda precisam de consolidacao visual.
- O usuario pretende elaborar prompts, scripts e referencias futuras antes de executar o redesign.

## Referencia A - Dashboard executivo do deputado
Descricao visual:
- cabecalho forte
- foto grande do deputado
- KPIs em cards coloridos
- graficos com leitura imediata
- mapa/regiao
- foco em visao gerencial

### O que essa referencia acerta
- comunica rapidamente que e um painel executivo
- separa blocos de informacao por importancia
- usa cards KPI com hierarquia forte
- cria identidade visual de "gestao"
- funciona bem para `SUPERVISAO`, `POWERBI` e leitura do dono

### O que pode dar errado se copiar literal
- fica pesado demais para a tela operacional
- exige dados que hoje ainda nao existem 100% estruturados:
  - foto oficial do deputado
  - mapa regional confiavel
  - tipologia fechada de obra/projeto
- pode virar painel bonito, mas pouco pratico se misturado com a grade operacional

### O que absorver para o SEC Emendas
- cabecalho executivo mais forte dentro da aba `Visao Power BI`
- cards KPI com cores e estado claro
- area de perfil do deputado quando o filtro estiver aplicado
- diagnostico resumido:
  - total de emendas
  - em andamento
  - concluidas
  - atrasadas/em atencao
  - valor total
  - municipios atendidos
- graficos e ranking com leitura curta

### O que nao absorver agora
- mapa complexo
- ilustracao pesada sem fonte de dado real
- excesso de efeitos visuais que atrapalhem leitura

## Referencia B - Layout principal com sidebar
Descricao visual:
- barra lateral escura
- conteudo principal claro
- filtros no topo
- tabela operacional forte
- acoes rapidas visiveis

### O que essa referencia acerta
- separa navegacao de conteudo
- melhora orientacao do usuario
- deixa a tela operacional mais profissional
- facilita crescimento do sistema por modulos:
  - planilha oficial
  - auditoria
  - governanca
  - suporte

### O que pode dar errado se copiar literal
- sidebar grande pode roubar area util da grade
- visual muito "app admin generico" se nao houver identidade propria
- excesso de botoes no topo pode continuar poluindo a operacao

### O que absorver para o SEC Emendas
- estrutura de navegaÃ§Ã£o lateral ou semi-lateral
- layout principal com foco em:
  - filtros
  - tabela
  - acoes operacionais
- bloco do usuario no canto com papel/perfil claro
- separacao entre:
  - area operacional
  - area executiva
  - governanca

### O que nao absorver agora
- menu grande com secoes que ainda nao existem formalmente
- poluicao de botoes secundarios

## Direcao recomendada: modelo hibrido
O caminho ideal nao e escolher uma referencia e descartar a outra.

O caminho recomendado e:

### 1. Layout principal = referencia B
Usar a logica da referencia B como base do sistema operacional:
- estrutura mais limpa
- foco em filtros e grade
- navegacao por modulos
- menos botoes redundantes no topo

### 2. Dashboard Power BI = referencia A
Usar a logica da referencia A para a `Visao Power BI`:
- cards executivos
- resumo por deputado
- indicadores fortes
- leitura gerencial para reunioes e acompanhamento

## Regra por perfil
### Todos podem visualizar o dashboard
- `APG`
- `CONTABIL`
- `SUPERVISAO`
- `POWERBI`
- `PROGRAMADOR`

### Controle executivo real fica com
- `SUPERVISAO`
- `POWERBI`
- `PROGRAMADOR`

Isso significa:
- todos veem
- nem todos controlam filtros criticos, exportacoes e leitura executiva ampliada

## Como isso se traduz no sistema
### Layout principal futuro
- nome do sistema: `SEC Emendas`
- navegacao estrutural:
  - `Operacao`
  - `Historico`
  - `Visao Power BI`
  - `Ajuda e suporte`
  - `Governanca` ou `Administracao` no futuro
- topo mais limpo
- acoes operacionais priorizadas

### Dashboard Power BI futuro
- cabecalho executivo
- card de perfil do deputado filtrado
- avatar ou foto oficial se existir fonte confiavel
- indicadores:
  - total de emendas
  - valor total
  - municipios
  - concluidas
  - em atencao
  - ultima movimentacao
- blocos analiticos:
  - ranking por deputado
  - ranking por municipio
  - status dominante
  - atividade por usuario
  - historico resumido

## Interacao futura: hover no mapa com preview da emenda
Direcao desejada:
- ao passar o mouse em uma area do mapa ou bloco territorial do dashboard
- o sistema mostra um `preview rapido` da emenda relacionada
- sem obrigar o usuario a sair do dashboard ou abrir o modal completo

### Objetivo dessa interacao
- dar leitura rapida para `SUPERVISAO`, `POWERBI` e `PROGRAMADOR`
- conectar o dashboard executivo com a operacao real
- permitir que o usuario entenda:
  - qual emenda esta por tras do ponto/area
  - status atual
  - deputado
  - municipio
  - valor
  - ultima alteracao

### Como deve agir no sistema
#### Nivel 1 - Preview leve
- hover em uma regiao ou marcador
- aparece um card flutuante com:
  - identificacao da emenda
  - deputado
  - municipio
  - status atual
  - valor atual
  - ultima atualizacao

#### Nivel 2 - Acao curta
- o preview pode oferecer:
  - `Ver detalhe`
  - `Filtrar no dashboard`
  - `Abrir na operacao`

### Regra importante
- `hover` nao pode disparar carga pesada toda vez
- os dados de preview devem vir de:
  - cache local do dashboard, ou
  - consulta leve ja preparada

### O que isso resolve
- aproxima o dashboard executivo da emenda real
- reduz cliques
- melhora leitura espacial/territorial
- cria efeito visual util, nao so decorativo

### Riscos
- exagerar no efeito e deixar o dashboard lento
- depender de mapa detalhado sem base territorial confiavel
- mostrar dado demais no hover e poluir a leitura

### Mitigacao recomendada
- preview curto e objetivo
- sem animacao pesada
- sem abrir modal completo no hover
- clique continua sendo a acao de aprofundamento
- usar `tooltip-card` ou `popover` com tamanho controlado

### Exemplo de como isso deve aparecer
Hover em `Salvador` no mapa:
- `EPI 2026 / Fanfarra`
- `Deputado: Dep. Alfa`
- `Status: Em analise`
- `Valor atual: R$ 120.000,00`
- `Ultima atualizacao: 09/03/2026 14:20`
- botoes:
  - `Ver detalhe`
  - `Filtrar`

### Veredito
- esta interacao faz sentido
- deve entrar como `evolucao do dashboard Power BI`
- nao deve ser implementada antes de:
  - fechar a base visual do dashboard
  - confirmar a fonte territorial dos dados
  - estabilizar os filtros executivos

## Foto do deputado
### Direcao correta
- usar foto real somente se houver fonte oficial ou cadastro interno confiavel
- enquanto nao existir fonte segura, usar:
  - avatar por iniciais
  - placeholder neutro

### Regra
- nao inventar dado visual sem base real
- a beta deve priorizar confiabilidade, nao decoracao

## Ajustes de layout que podem ser feitos depois
### Pode mudar sem depender de regra funcional
- cabecalho
- sidebar/navegacao
- hierarquia visual dos botoes
- cards do dashboard
- organizacao da grade
- espacos, cores, tipografia

### Deve esperar definicao funcional
- campos de `objetivo_epi`
- bloco de `Status_2`
- contagem manual de deputado
- cadeia oficial de importacao
- governanca estrutural visivel na tela

## Riscos do redesign futuro
- misturar tela operacional com tela executiva
- criar dashboard bonito sem dado confiavel
- aumentar complexidade visual para APG/CONTABIL
- redesenhar antes de fechar pendencias funcionais

## Mitigacao
- manter dois contextos claros:
  - `Operacao`
  - `Executivo`
- redesenhar primeiro a estrutura, depois a estetica
- testar por perfil
- so usar elementos visuais que correspondam a dado real

## Material que o usuario pretende preparar depois
Quando chegar a hora da execucao, usar este documento junto com:
- prompts de design
- scripts de geracao
- referencias visuais
- regras por perfil
- backlog de layout separado em:
  - `pode mexer agora`
  - `depende de regra`

## Veredito oficial
- O `layout principal` deve seguir a linha da referencia B.
- O `dashboard Power BI` deve seguir a linha da referencia A.
- O sistema nao deve ter uma unica linguagem visual para tudo.
- A parte operacional e a parte executiva devem compartilhar identidade, mas nao a mesma densidade de informacao.

## Resume from
- Quando for iniciar o redesign, abrir este documento primeiro e depois alinhar com `check62.md` e os prompts/scripts que serao elaborados.

