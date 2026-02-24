# Termo de Operacao e Responsabilidades - Sistema SEC Emendas

Data: 2026-02-24
Status: Draft para alinhamento com TI, Supervisao e Areas

## 1) Objetivo
Formalizar responsabilidades de operacao, manutencao e governanca do sistema de controle de emendas, garantindo continuidade, seguranca e rastreabilidade.

## 2) Escopo Atual
- Importacao de planilha `.xlsx`
- Edicao controlada de dados no sistema
- Registro de historico/auditoria por usuario
- Exportacao `.xlsx`
- Controle de acesso por login/perfil

Fora do escopo (neste momento):
- Integracao com AD/SSO
- Alta disponibilidade (HA)
- Workflow externo entre sistemas de terceiros

## 3) Papeis e Responsabilidades
### 3.1 Produto/Negocio (SEC)
- Definir regras de negocio e status validos
- Aprovar mudancas funcionais
- Nomear responsavel funcional (dono do processo)

### 3.2 Time de Desenvolvimento
- Implementar melhorias e correcoes
- Garantir versionamento de codigo e changelog
- Executar testes antes de publicacao
- Manter documentacao tecnica atualizada

### 3.3 Infra/TI
- Disponibilizar ambiente (homologacao/producao)
- Gerenciar banco, backup e restore
- Configurar rede, firewall, DNS, HTTPS e acessos
- Monitorar disponibilidade e logs

### 3.4 Usuarios Operacionais
- Usar credenciais individuais (nao compartilhadas)
- Registrar motivos obrigatorios quando exigido
- Reportar inconsistencias com evidencias

## 4) Matriz de Dono (RACI simplificado)
- Regra de negocio: SEC (A), Dev (R), TI (C)
- Deploy: TI (A/R), Dev (C)
- Backup/restore: TI (A/R)
- Correcao de bug: Dev (A/R), SEC (C)
- Homologacao funcional: SEC (A/R)
- Auditoria de uso: SEC + TI (A/R)

## 5) Suporte e Manutencao
- Janela de manutencao: a definir com TI
- Canal de suporte: a definir (email/teams/chamado)
- SLA inicial sugerido:
  - Incidente critico (sistema indisponivel): ate 4h para resposta
  - Incidente alto (fluxo principal quebrado): ate 8h para resposta
  - Incidente medio/baixo: ate 24h para resposta

## 6) Riscos Operacionais
- Queda de servico por desligamento de maquina local
- Divergencia de dados por importacao indevida
- Uso sem validacao de versao/homologacao
- Falta de backup testado

Mitigacoes minimas:
- Ambiente central (servidor TI)
- Backup diario e teste de restauracao
- Checklist de release
- Separacao homologacao x producao

## 7) Criterios de Aceite Operacional
- 100% das alteracoes rastreaveis por usuario/data/hora
- Importacao/exportacao `.xlsx` com validacao
- Login ativo e controle de perfil funcionando
- Processo de backup/restore aprovado por TI
- Documento de rollback disponivel

## 8) Politica de Mudanca (release)
Toda mudanca deve ter:
- descricao
- risco
- plano de teste
- plano de rollback
- aprovacao funcional (SEC)
- aprovacao tecnica (TI)

## 9) Assinaturas (a preencher)
- Responsavel SEC (funcional): __________________
- Responsavel TI (infra): _______________________
- Responsavel Dev (tecnico): ____________________
- Data de vigencia: _____________________________
