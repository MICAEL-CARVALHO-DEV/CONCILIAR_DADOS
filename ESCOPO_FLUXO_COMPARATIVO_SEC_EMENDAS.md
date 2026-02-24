# ESCOPO, FLUXO, CONCEITO E COMPARATIVO - SEC EMENDAS

Data: 2026-02-24

## 1) Conceito do sistema
O sistema SEC Emendas nao e apenas uma planilha online. Ele e um sistema de governanca operacional para emendas, com foco em:
- rastreabilidade por usuario
- historico auditavel
- regras de permissao
- controle de importacao/exportacao

Conceito central:
- Banco de dados = fonte oficial
- XLSX = interface de entrada/saida

## 2) Escopo funcional (o que o sistema faz)
- Login/cadastro com perfil de acesso.
- Registro de eventos (timeline) por emenda.
- Importacao de dados `.xlsx`.
- Edicao controlada com motivo.
- Exportacao `.xlsx` com log.
- Painel de acompanhamento (usuarios, andamento, conflitos).

## 3) Fora de escopo (neste momento)
- SSO/AD corporativo.
- Alta disponibilidade com failover.
- Integracoes externas complexas.
- BI corporativo definitivo (fase posterior).

## 4) Fluxo operacional recomendado
1. Usuario autentica no sistema.
2. Importa planilha oficial `.xlsx`.
3. Sistema valida cabecalho e registra lote de importacao.
4. Dados entram/atualizam base com trilha de eventos.
5. Usuarios marcam andamento, observacoes e alteracoes.
6. Supervisao monitora conflitos, pendencias e progresso.
7. Exportacao gera arquivo `.xlsx` e log de saida.

## 5) Realidade do problema atual
Problema real nao e "abrir Excel". O problema e governanca:
- conflito simultaneo de edicao
- perda de historico confiavel
- falta de dono do processo
- ausencia de regra unica de status
- baixa capacidade de auditoria

Impacto pratico:
- retrabalho
- risco de divergencia
- dificuldade de prestar contas
- dependencia de conhecimento informal

## 6) Pontos positivos da solucao SEC Emendas
- Cada acao relevante fica rastreada.
- Historico deixa de ser "memoria da equipe" e vira evidencia.
- Regras de acesso reduzem alteracao indevida.
- Supervisao ganha visao operacional consolidada.
- Processo fica preparado para auditoria e BI.

## 7) Pontos negativos / limites atuais
- Ainda depende de maturidade operacional (nao e so tecnologia).
- Sem infraestrutura central (TI), operacao local e fragil.
- Demanda disciplina de equipe para usar fluxo oficial.
- Necessita evolucao continua de testes e observabilidade.

## 8) Diferenca para ferramentas genericas (Google Sheets / Excel compartilhado)
Google Sheets/Excel generico ajudam colaboracao, mas nao substituem governanca de processo.

O que ferramenta generica faz bem:
- edicao colaborativa rapida
- baixo custo inicial
- curva de adocao simples

O que geralmente falta no modo generico:
- trilha auditavel estruturada por evento de negocio
- workflow de status com regra por perfil
- controle formal de lote de importacao/exportacao
- separacao clara entre dado oficial e arquivo de troca
- governanca de permissao no nivel do processo

O diferencial do SEC Emendas:
- sistema desenhado para processo de emendas (nao planilha genérica)
- foco em rastreabilidade, controle e prestacao de contas
- preparado para evoluir para banco central + BI

## 9) Valor para gestao
- Menos retrabalho e divergencia
- Mais previsibilidade operacional
- Mais seguranca para decisao
- Evidencia objetiva para auditoria

## 10) Prioridades recomendadas (curto prazo)
1. Fechar itens P0 pendentes do checklist 62.
2. Consolidar padrao oficial de import/export `.xlsx`.
3. Formalizar com TI: servidor, banco, backup e rede.
4. Implantar rotina de manutencao/documentacao continua.

## 11) Mensagem executiva (resumo de 30 segundos)
"A proposta nao e trocar planilha por tela. E trocar operacao sem controle por operacao governada, rastreavel e auditavel. O Excel continua como formato de troca, mas a verdade do processo passa a estar no sistema."
