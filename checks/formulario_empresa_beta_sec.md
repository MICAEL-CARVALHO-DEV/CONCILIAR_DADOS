# FORMULARIO EMPRESA - BETA SEC

Objetivo: preencher as decisoes e validacoes que faltam para fechar a beta sem retrabalho.

Instrucao de uso:
- Responder item por item.
- Se nao souber na hora, marcar como `PENDENTE`.
- Quando voltar, me mandar este formulario preenchido.

---

## BLOCO A - DECISOES QUE FECHAM A BETA

### 1. C19-A - Cadeia oficial de import
O que decidir:
- A base vai funcionar em camadas `raiz -> import2 -> import3`?
- Ou vai funcionar como base consolidada unica?
- O usuario vai escolher lote/import ao entrar?
- Vai existir trilha por lote e por emenda?

Resposta:
- Modelo final:
- Usuario escolhe import/lote ao entrar: SIM / NAO
- Historico por lote: SIM / NAO
- Historico por emenda: SIM / NAO
- Regra final aprovada:
- Observacoes:

---

### 2. C49-A - Regra final da contagem de deputado
O que decidir:
- A contagem vem da base atual?
- Vem do historico?
- Vem de outra origem?
- Ajuste manual vai existir?
- O ajuste vale por import, por planilha ou global?
- Quem pode ajustar?

Resposta:
- Origem da contagem:
- Ajuste manual: SIM / NAO
- Escopo do ajuste:
- Quem pode ajustar:
- Regra final aprovada:
- Observacoes:

---

### 3. C25-B - Fechar oficialmente `objetivo_epi`
O que decidir:
- Vai entrar na beta?
- Se entrar, e campo estrutural ou operacional?
- Qual a origem do dado?

Resposta:
- Entra na beta: SIM / NAO
- Tipo: estrutural / operacional
- Origem do dado:
- Regra final aprovada:
- Observacoes:

---

### 4. C27 - Regra oficial do export
O que decidir:
- O export oficial vai sair em `template mode` por padrao?
- O que e obrigatorio no arquivo final?

Resposta:
- Template mode padrao: SIM / NAO
- Export oficial esperado:
- O que nao pode faltar:
- Regra final aprovada:
- Observacoes:

---

### 5. P-R06 - Servidor interno + Power BI externo
O que decidir:
- Quando entra servidor interno?
- Quando o Power BI passa a ler externamente?
- Isso entra antes ou depois da beta final?

Resposta:
- Servidor interno entra em qual fase:
- Power BI externo entra em qual fase:
- Leitura externa antes da beta final: SIM / NAO
- Regra final aprovada:
- Observacoes:

---

## BLOCO B - VALIDACAO FUNCIONAL NO SISTEMA

### 6. C48 - Filtros fortes do historico operacional
O que validar:
- Ano
- Mes
- Usuario
- Perfil
- Tipo de evento
- Busca textual

Resposta:
- Passou: SIM / NAO
- Filtro que falhou:
- Comportamento esperado:
- Ajuste pedido:
- Observacoes:

---

### 7. C49 - Export do relatorio executivo
O que validar:
- Arquivo gerado
- Abas corretas
- Conteudo correto
- Estrutura util para leitura

Resposta:
- Passou: SIM / NAO
- Arquivo abriu certo: SIM / NAO
- Abas corretas: SIM / NAO
- Problema encontrado:
- Ajuste pedido:
- Observacoes:

---

### 8. C50-A - Aba `Ajuda e suporte`
O que validar:
- Se a aba abre
- Se o fluxo esta claro
- Se a informacao ajuda de verdade

Resposta:
- Passou: SIM / NAO
- O que apareceu:
- O que faltou:
- Ajuste pedido:
- Observacoes:

---

### 9. Warning de acessibilidade do modal `aria-hidden`
O que validar:
- Abrir modal
- Fechar modal
- Salvar
- Trocar foco
- Ver se aparece warning/erro no console

Resposta:
- Passou: SIM / NAO
- Warning apareceu: SIM / NAO
- Caminho que gerou o warning:
- Ajuste pedido:
- Observacoes:

---

### 10. C45-A - Visual final do dashboard Power BI
O que validar:
- Se a leitura visual esta boa
- Se a organizacao ajuda supervisao/power bi
- Se o dashboard conversa com o sistema

Resposta:
- Passou: SIM / NAO
- O que ficou bom:
- O que ficou ruim:
- Ajuste pedido:
- Observacoes:

---

## BLOCO C - POS-BETA / NAO BLOQUEIA

### 11. workspace_id real no backend
- Fazer pos-beta: SIM / NAO
- Prioridade: alta / media / baixa
- Observacoes:

### 12. Fidelidade visual maior do export
- Necessidade real: alta / media / baixa
- Vale codar logo apos beta: SIM / NAO
- Observacoes:

### 13. Redesign do layout principal e dashboard Power BI
- Direcao escolhida:
- Prioridade:
- Observacoes:

### 14. Mapa interativo com hover/preview
- Entra na versao seguinte: SIM / NAO
- Observacoes:

### 15. Migracao para servidor interno
- Depende da infra: SIM / NAO
- Fase prevista:
- Observacoes:

### 16. Leitura externa Power BI fora do sistema
- Vai existir: SIM / NAO
- Quando:
- Observacoes:

### 17. Melhorias finais de acessibilidade e UX
- Itens mais urgentes:
- Observacoes:

---

## ORDEM RECOMENDADA PARA PREENCHER
1. C19-A
2. C49-A
3. C25-B
4. C27
5. P-R06
6. C48
7. C49
8. C50-A
9. warning `aria-hidden`
10. C45-A

---

## MINIMO PARA DESTRAVAR A BETA
Responder pelo menos:
1. C19-A
2. C49-A
3. C25-B
4. C27
5. P-R06

---

## CHECKPOINT
Status:
- [ ] Formulario entregue para a empresa
- [ ] Decisoes do bloco A respondidas
- [ ] Validacoes do bloco B respondidas
- [ ] Itens do bloco C priorizados

Resume from:
- Me devolver este arquivo preenchido para eu transformar em execucao tecnica.
