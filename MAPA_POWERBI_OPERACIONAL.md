# MAPA POWER BI OPERACIONAL - ArquitetURA

Objetivo:
- definir como o Power BI entra no sistema
- confirmar a arquitetura com PostgreSQL como banco principal e Views Read-Only

Status:
- documento oficial da camada analitica (Atualizado: U06 e U07)

## 1. Decisao de Arquitetura Oficial

Arquitetura recomendada:
- `Sistema Web` = operacao diaria de escrita / leitura operacional (BI Leve Front)
- `PostgreSQL` = banco de dados transacional e fonte unica da verdade (SSOT)
- `Power BI Desktop` = analise executiva principal, carga pesada e dashboards territoriais
- `BI Leve (Beta BI)` = interface rapida dentro do app web para cruzamentos imediatos de usuario.

Em resumo: a planilha de excel não é mais a fonte de dados analíticos.

## 2. A Camada: Power BI Desktop + PostgreSQL (Visão Read-Only)

Para suportar dashboards complexos sem derrubar o ambiente transacional de nuvem (Render/Supabase):

### O Papel do BI Desktop
Servirá como central de **Inteligência Executiva** processando os KPIs massivos e gerando os painéis geoespaciais e relatórios mensais estáticos sem prejudicar o WebSockets e os Inserts do frontend.

### Governança do PostgreSQL e Views Seguras
O Power BI **NÃO PODE** usar a senha mestre (`postgres` owner) nem ler tabelas cruas com dados sensíveis das credenciais web. 

**Implementação Obrigatória na Nuvem:**
1. Criação da Role Read-Only:
   ```sql
   CREATE ROLE pbi_reader WITH LOGIN PASSWORD '***';
   GRANT CONNECT ON DATABASE app_db TO pbi_reader;
   GRANT USAGE ON SCHEMA public TO pbi_reader;
   ```
2. Desacoplamento via Views (Expor ao PowerBI apenas dados mastigados):
   ```sql
   -- Exemplo de Views OBRIGATORIAS para relatórios no Desktop.
   CREATE VIEW vw_bi_emendas_vigentes AS SELECT ...;
   CREATE VIEW vw_bi_historico_auditoria AS SELECT ...;
   CREATE VIEW vw_bi_resumo_financeiro AS SELECT ...;
   
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO pbi_reader; -- ou restringir strict Views!
   ```

## 3. O Papel Paralelo do "BI Leve" (Frontend Web)

Enquanto o Power BI atende Alta Gestão com mapas complexos elaborados (U07), o **BI Leve** (`betaPowerBi.js` Fase 6A/6B) serve para o operador no front:
- Consultar na mosca quanto um Deputado tem de recurso em um município.
- Responder a telefonemas e consultas usando os filtros em Cascata em menos de 1 segundo.
- Agir em conjunto com a página principal sem abrir abas novas.

`O BI LEVE NUNCA faz Queries SQL complexas` — Ele usa as listas JS cacheadas providas pelas requisições operacionais normais.

## 4. Conclusão da Entrega
Com a consolidação do Cloudflare e do Postgres Oficial, o ecossistema fecha-se na seguinte matriz:
* `Inserção` = App.js e ImportControls.
* `Leitura Tática` = Beta Power BI (Aba Web Leve).
* `Relatório Executivo Típico` = Power BI Desktop conectado na VW Segura do Render.
