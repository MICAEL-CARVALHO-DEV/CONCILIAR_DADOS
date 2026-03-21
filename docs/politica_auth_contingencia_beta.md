# POLITICA OPERACIONAL DE AUTH E CONTINGENCIA DA BETA

Goal: fechar a regra operacional de autenticacao da beta sem improviso e sem depender de conhecimento tacito.
Success: `C42` e `C43` passam a ter leitura unica entre comportamento real do sistema, operacao da SEC e mapa do projeto.

## Escopo

Esta politica vale para a beta oficial atual do `CONCILIAR_DADOS` com:
- front publicado no Cloudflare Pages
- API publica no Render
- autenticacao local por senha e autenticacao Google convivendo sem dependencia exclusiva do Google
- uso real gradual por usuarios da SEC

## C42 - Politica oficial de senha e bloqueio por tentativas

### 1. Regra de acesso
- login local por senha continua sendo o fallback oficial da plataforma
- login Google e opcional; nao pode virar dependencia unica de acesso
- cadastro publico de `APG`, `SUPERVISAO` e `POWERBI` nasce em `EM_ANALISE`, sem sessao ativa automatica
- `PROGRAMADOR` aprova, recusa, ativa e desativa usuarios

### 2. Politica de senha local
- senha minima: `8` caracteres
- grupos obrigatorios: `4`
- precisa conter:
  - letra maiuscula
  - letra minuscula
  - numero
  - caractere especial
- espacos nao sao permitidos

### 3. Bloqueio por tentativas invalidas
- janela de falhas: `15` minutos
- limite de tentativas invalidas dentro da janela: `5`
- duracao do bloqueio temporario: `15` minutos
- login bem-sucedido zera o contador operacional de falhas
- reset de senha bem-sucedido tambem limpa bloqueio temporario

### 4. Recuperacao de senha
- pedido de recuperacao registra solicitacao mesmo quando a resposta publica e generica
- token de reset vale por `30` minutos
- link direto de debug na resposta so pode existir em ambiente local controlado
- em ambiente publicado, o operador nao deve depender de token exibido em tela

## C43 - Plano de contingencia operacional

### 1. Usuario esqueceu a senha
- usar `Esqueci a senha?`
- se o usuario existir e estiver ativo, o pedido fica registrado
- se o fluxo automatizado nao resolver, o `PROGRAMADOR` faz a triagem operacional

### 2. Conta bloqueada por tentativas
- aguardar `15` minutos e tentar novamente
- se o bloqueio se repetir, abrir chamado interno para o `PROGRAMADOR`
- o `PROGRAMADOR` verifica:
  - se a conta esta ativa
  - se ha padrao de erro de digitacao
  - se ha indicio de tentativa indevida

### 3. Conta em analise ou recusada
- `EM_ANALISE`: usuario aguarda aprovacao do `PROGRAMADOR`
- `RECUSADO`: acesso permanece negado ate revisao formal
- operador comum nao aprova nem desbloqueia conta

### 4. Google indisponivel
- a operacao deve usar login local por senha
- nao bloquear o uso real da SEC por indisponibilidade do Google
- Google continua como conveniencia, nao como ponto unico de falha

### 5. Front ou API indisponivel
- nao fazer edicao manual fora do fluxo oficial do sistema
- preservar a planilha oficial e o ultimo export valido como referencia operacional
- registrar horario, impacto e usuario afetado
- acionar o `PROGRAMADOR` para diagnostico e retorno controlado

### 6. Falha durante importacao oficial
- nao aplicar lote sem preview e revisao
- manter o ultimo lote oficial valido como referencia ativa
- se houver erro na carga nova, corrigir o arquivo e reenviar; nao substituir a base "na marra"

### 7. Falha durante exportacao
- repetir a exportacao a partir da base consolidada atual
- so considerar arquivo oficial apos download valido e conferencia minima
- guardar o arquivo oficial na pasta operacional apos export bem-sucedido

## Responsabilidades

- `PROGRAMADOR`
  - aprovar/recusar usuarios
  - tratar bloqueio recorrente
  - conduzir reset operacional controlado quando houver virada de base
  - manter a politica alinhada ao comportamento real do sistema
- Operacao SEC
  - usar apenas o fluxo oficial
  - nao improvisar senha, desbloqueio ou importacao por fora
  - guardar o arquivo oficial exportado na pasta operacional

## Fonte canonica

Depois deste corte:
- politica viva: `docs/politica_auth_contingencia_beta.md`
- prioridade unica: `PLANO_MESTRE_UNIFICADO.md`
- central da beta: `checks/@deve_de_casa_beta.md`
- mapa historico: `anotacoes/documentacao_raiz/check62.md`
