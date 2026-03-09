# @DEVE DE CASA - BETA SEC

Goal: Reunir, em uma lista simples, as respostas que o usuario precisa elaborar depois para fechar o modo beta sem perder o mapa do sistema.
Success: O usuario abre este arquivo e enxerga rapidamente tudo o que ainda precisa responder, sem misturar isso com execucao tecnica.

## Regra de uso
- Este arquivo e `lista de resposta pendente`, nao check oficial de status.
- Status oficial continua em:
  - `../CHECK62.md`
  - `../CHECKUSER.md`
  - `CHECK_PENDENCIAS_BETA_SEC.md`
- Quando uma resposta for fechada:
  1. atualizar este arquivo
  2. atualizar `CHECK_PENDENCIAS_BETA_SEC.md`
  3. refletir a decisao no item tecnico/funcional correspondente

## O que falta responder para fechar o beta

### 1. `P-R02` - cadeia oficial de import
- O usuario vai escolher a planilha ao entrar ou dentro do sistema?
- Cada import cria uma nova camada (`raiz -> import2 -> import3`) ou substitui o lote ativo?
- O historico oficial de import fica por:
  - lote
  - emenda
  - ou ambos?

### 2. `P-R03` - contagem de deputado
- A contagem nasce da base inteira ou do import atual?
- O ajuste manual vale por:
  - planilha
  - import
  - ou global?
- Quem pode ajustar?
- Quem pode apenas visualizar?

### 3. `P-R01` - `Status_2`
- `Status_2` vai existir de verdade?
- Se sim:
  - qual o objetivo?
  - quem edita?
  - quando aparece?
  - entra em import/export?
- Se nao:
  - limpar da operacao e encerrar a pendencia

### 4. `P-R05` - `objetivo_epi`
- O campo vai entrar no sistema?
- Se entrar:
  - vem de import?
  - digitacao manual?
  - os dois?
- Ele sera:
  - estrutural
  - ou operacional?

### 5. `P-R06` - servidor interno e Power BI externo
- Em qual fase a infraestrutura pode assumir servidor interno?
- O Power BI externo vai ler:
  - do banco em nuvem
  - ou so depois da migracao interna?

### 6. Planilhas `TESTE` x `OFICIAL`
- Vai existir apenas `1` planilha oficial ativa?
- A planilha teste pode nascer como copia da oficial?
- Quem pode criar planilha teste?
- Quem pode arquivar planilha teste?

## Veredito das pendencias
### Validar primeiro no sistema
- `C48` - historico com filtro forte
  - Veredito: quase fechado
  - Falta: validacao visual completa no navegador
- `C49` - relatorio executivo da visao Power BI
  - Veredito: quase fechado
  - Falta: validar botao, arquivo XLSX e leitura do relatorio gerado
- `C50-A` - canal de feedback
  - Veredito: quase fechado
  - Falta: validar a aba `Ajuda e suporte` com usuario comum e perfil de suporte

### Fechar em seguida por decisao funcional
- `C25-B` - decidir `objetivo_epi`
  - Veredito: depende da sua resposta
- `C12-A` - decidir `Status_2`
  - Veredito: depende da sua resposta
- `C19-A` - formalizar cadeia oficial de import
  - Veredito: depende da sua resposta
- `C49-A` - contagem de deputado
  - Veredito: depende da sua resposta
- `C27` - pasta oficial de export
  - Veredito: depende da definicao operacional/infra

## Ordem pratica para fechar o modo beta
### Fechar primeiro
1. `C48`
2. `C49`
3. `C50-A`

### Fechar em seguida
4. `C25-B`
5. `C12-A`
6. `C19-A`
7. `C49-A`
8. `C27`

## Ordem recomendada para responder
1. cadeia oficial de import
2. planilhas `TESTE` x `OFICIAL`
3. contagem de deputado
4. `Status_2`
5. `objetivo_epi`
6. servidor interno + Power BI externo

## Atalhos de leitura
- pendencias oficiais: `CHECK_PENDENCIAS_BETA_SEC.md`
- regra de planilhas: `../docs/REGRAS_PLANILHAS_TESTE_E_OFICIAL.md`
- governanca estrutural: `../docs/FLUXO_CORRECAO_ESTRUTURAL.md`

## Resume from
- Quando for responder depois, voltar por esta ordem: `P-R02` -> `TESTE/OFICIAL` -> `P-R03` -> `P-R01` -> `P-R05` -> `P-R06`.
