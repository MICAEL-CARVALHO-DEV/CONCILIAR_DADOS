# PLANO PILOTO 3 MESES - VALIDACAO PONTA A PONTA (SEC EMENDAS)

Data base: 2026-02-26

## Objetivo
Validar operacao real multiusuario com estabilidade, rastreabilidade e governanca, antes da decisao final de infraestrutura com TI.

## Escopo do piloto
- Entrada oficial: LOA recebido do SEPLAN.
- Importacao inicial: executada por `PROGRAMADOR` ou `SUPERVISAO`.
- Operacao diaria: equipe trabalha dentro do sistema.
- Exportacao: somente quando necessario para entrega/compartilhamento.
- Fonte oficial: banco de dados do sistema (Excel = entrada/saida).

## Criterios tecnicos minimos
- Login por usuario e perfil.
- Historico completo de alteracoes (quem, quando, o que, motivo).
- Registros de lote de importacao/exportacao.
- Disponibilidade operacional em horario de expediente.
- Plano de backup e evidencia de restauracao.

## Indicadores de aceite (mensais)
- Incidentes criticos de indisponibilidade.
- Falhas de importacao/exportacao.
- Divergencias de dados reportadas.
- Tempo medio para resposta de consulta da supervisao.
- Taxa de retrabalho por falta de rastreio.

## Cenarios de infraestrutura para decisao com TI
### Cenario A - Nuvem (baixo custo, rapido)
- Pro:
  - sobe rapido
  - nao depende do PC pessoal
  - acesso mais simples para equipe
- Contra:
  - exige validacao de compliance/politica de dados
  - depende de fornecedor externo

### Cenario B - Interno (servidor/VM corporativa)
- Pro:
  - aderencia alta a regras internas
  - dados sob governanca direta da TI
- Contra:
  - processo de implantacao mais burocratico
  - lead time maior para provisionamento

### Cenario C - Hibrido
- Pro:
  - equilibrio entre controle e agilidade
  - permite transicao sem parada
- Contra:
  - integracao mais complexa
  - exige desenho de rede e seguranca mais rigido

## Gate de decisao ao final de 3 meses
1. Consolidar metricas e evidencias do piloto.
2. Reuniao Supervisor + TI + responsavel tecnico.
3. Escolher cenario final por custo total, risco e capacidade operacional.
4. Formalizar plano de migracao/continuidade sem perda de dados.

## Plano B obrigatorio
- Se ambiente principal cair:
  - manter acesso de leitura ao ultimo snapshot valido
  - ter rotina de restauracao documentada
  - comunicar janela de retorno e responsavel pela recuperacao

## Resultado esperado
- Sistema aprovado para producao continua sem dependencia de PC pessoal 24h.
- Fluxo anual LOA padronizado:
  - importa 1 vez oficial
  - opera no sistema
  - exporta quando precisar
  - encerra ciclo com backup e inicia novo ano.
