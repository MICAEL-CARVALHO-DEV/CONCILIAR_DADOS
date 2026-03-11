# MAPA OFICIAL COLUNAS LOA

Goal: Definir a estrutura oficial de colunas do arquivo LOA usado pelo SEC Emendas, para que importacao, validacao e governanca sigam a mesma referencia.
Success: O projeto passa a ter uma base unica e explicita de quais abas e colunas sao oficiais, quais campos entram no sistema e quais colunas extras sao apenas toleradas.

## Arquivo de referencia
- `Emendas_EPI_LOA_2026_SEC_29_01_2026 publicada Seplan Atual.xlsx`

## Abas oficiais
- `Controle de EPI` - aba principal de importacao
- `Planilha1` - aba de resumo/conferencia

## Aba principal: Controle de EPI
### Colunas encontradas no arquivo oficial
1. `Emenda`
2. `Emenda  apta`
3. `Cod Subfonte`
4. `Deputado`
5. `Cod. Orgao`
6. `No Orgao`
7. `Sigla do Orgao`
8. `Cod. UO`
9. `UO Orcamentaria`
10. `Nome da UO`
11. `Cod. USP`
12. `UO Executora`
13. `Cod. da Acao`
14. `Descritor da Acao`
15. `Objeto da EPI`
16. `Status`
17. `Funcao`
18. `Municipio / Estado`
19. `TI/Estado`
20. `Condicao da EPI`
21. `Valor Inicial EPI`
22. `Valor Reforcado`
23. `Valor Anulado`
24. `Valor Atual EPI`
25. `Data da Solicitacao`
26. `Processo SEI`
27. `OBSERVACAO`
28. `Status` (duplicada)

## Mapeamento oficial para o sistema
- `Emenda` -> `id`
- `Emenda` -> `identificacao` como fallback quando nao houver coluna dedicada
- `Cod Subfonte` -> `cod_subfonte`
- `Deputado` -> `deputado`
- `Cod. UO` -> `cod_uo`
- `Sigla do Orgao` -> `sigla_uo`
- `Cod. Orgao` -> `cod_orgao`
- `Cod. da Acao` -> `cod_acao`
- `Descritor da Acao` -> `descricao_acao`
- `Municipio / Estado` -> `municipio`
- `Valor Inicial EPI` -> `valor_inicial`
- `Valor Atual EPI` -> `valor_atual`
- `Processo SEI` -> `processo_sei`
- primeiro `Status` -> `status_oficial`

## Colunas toleradas mas nao modeladas como campo oficial
- `Emenda apta`
- `No Orgao`
- `UO Orcamentaria`
- `Nome da UO`
- `Cod. USP`
- `UO Executora`
- `Objeto da EPI`
- `Funcao`
- `TI/Estado`
- `Condicao da EPI`
- `Valor Reforcado`
- `Valor Anulado`
- `Data da Solicitacao`
- `OBSERVACAO`
- segunda coluna `Status` duplicada

## Regra para colunas extras e duplicadas
- Coluna extra nao deve quebrar o import.
- Coluna duplicada nao deve quebrar o import.
- O sistema deve preservar os dados oficiais validos mesmo quando houver coluna repetida.
- `status_oficial` continua sendo o unico status oficial do sistema.
- `Status_2` nao existe como regra de negocio do produto.

## Aba secundaria: Planilha1
### Estrutura oficial encontrada
- `Rotulos de Linha`
- `Contagem de Deputado`

### Uso da Planilha1
- resumo de conferencia
- apoio visual/gerencial
- nao substitui a base oficial da aba `Controle de EPI`

## Regras operacionais derivadas
- A aba `Controle de EPI` e a referencia principal de importacao.
- A aba `Planilha1` e tratada como resumo complementar.
- O sistema deve tolerar pequenas variacoes de acento e pontuacao no cabecalho.
- O sistema deve continuar ignorando colunas desnecessarias sem perder os campos principais.

## Resume from
- Se houver duvida sobre a planilha LOA oficial, usar este documento antes de alterar aliases de importacao ou validacao.
