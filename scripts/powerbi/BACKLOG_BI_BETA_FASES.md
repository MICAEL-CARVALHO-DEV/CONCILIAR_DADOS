# BACKLOG EXECUTÁVEL - BI BETA (Frente Visual - Cortes 6 e 7)

**Objetivo:** Este backlog é o contrato oficial para a IA Codex VS Code executar a frente visual no `app.js`, `betaPowerBi.js` ou HTML.
> **Status:** Pronto para dev (Visual)

---

## 🔹 FASE 6A: O Básico Operacional Mínimo (Lançamento do Beta)
*Contrato:* Construir cards HTML baseados em arrays pre-calculados do `powerBiData.js` sem estourar o layout ou a memória.

- [ ] **Indicadores Globais (Cards de Topo):**
  - Renderizar no DOM: "Total de Emendas" (apontar para `summary.total`).
  - Renderizar no DOM: "Valor Atualizado" (formatar `summary.valorTotal` com `fmtMoney`).
  - Renderizar Gráfico/Barra: "Em Andamento vs Sem Andamento" (usando CSS puro ou `<progress>`).
- [ ] **Data Model Limpo:**
  - Garantir que o `renderBetaPowerBiPanel()` não faça `.map()` ou `.reduce()` massivos; consumir os `byDeputado`, `byMunicipio` já construídos no State.
- [ ] **Número da Emenda e Linkagem:**
  - Garantir que a grid lista a Identificação.

---

## 🔹 FASE 6B: Filtros Cruzados (Cascata)
*Contrato:* O DOM deve reagir inteligentemente a seletores sem pesados reflows.

- [ ] **Filtro Cascata (Deputado -> Município):**
  - Escutar o seletor `powerBiFilterDeputado`. Quando alterado, limpar e repopular os `options` de `powerBiFilterMunicipio` usando as interseções extraidas de `powerBiData`.
- [ ] **Filtro Cascata (Município -> Deputado):**
  - Escutar `powerBiFilterMunicipio`. Repopular `powerBiFilterDeputado` para mostrar só os atuantes daquele local.
- [ ] **Sync Viewport:**
  - Chamar `rerenderBetaWorkspaceFiltered()` sempre que a cascata for ativada (isso injeta logs nas rotinas certas e invoca repaint leve).

---

## 🔹 FASE 6C: O Mapa Geográfico / Desktop Extendido (Visão Executiva)
*Contrato:* Renderização vetorial visual.

- [ ] **Container do Mapa (DOM):**
  - Desenclausurar a `div#betaMapContainer` no `index.html`.
- [ ] **Renderer Leaflet ou SVG:**
  - Criar função isolada em `betaPowerBi.js` (`renderStateMap(container, boundaries)`) puxando dados agregados de `byMunicipio` do State.
- [ ] **Interatividade Visual (Hover/Click):**
  - Capturar `mouseover` no patch do SVG/GeoJSON e alimentar componente flutuante (`Tooltip`) mostrando "Cidade, R$ Total".
  - Capturar `click` (Bindar para atualizar o Filtro Cascata 6B e chamar re-render).

---
**Notas para a IA Visual (Codex VS Code):** 
Não introduza frameworks pesados (React, Vue, etc). Siga o padrão *Vanilla DOM* da aplicação. Utilize `createDocumentFragment` em listagens grandes.
