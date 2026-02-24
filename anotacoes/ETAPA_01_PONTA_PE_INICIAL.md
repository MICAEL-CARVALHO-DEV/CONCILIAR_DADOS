# Etapa 1 - Pontape Inicial P0 (sem oscilacao)

Objetivo:
Fechar base de validacao antes de mexer em regra sensivel.

## Ordem (obrigatoria)
1. Subir ambiente local
2. Rodar regressao P0
3. Rodar concorrencia C34 (2 a 5 usuarios)
4. Registrar evidencias no log
5. So depois iniciar mudanca funcional (ex.: C25)

## 1) Subir ambiente
```powershell
cd "C:\Users\micae\OneDrive\Area de Trabalho\conciliar Copia"
powershell -ExecutionPolicy Bypass -File .\scripts\start_tudo.ps1
```

## 2) Regressao P0
```powershell
cd "C:\Users\micae\OneDrive\Area de Trabalho\conciliar Copia"
powershell -ExecutionPolicy Bypass -File .\scripts\regressao_p0.ps1
```

Esperado:
- todas as etapas `[OK]`
- status final `Regressao P0: SUCESSO`

## 3) Teste de concorrencia C34
```powershell
cd "C:\Users\micae\OneDrive\Area de Trabalho\conciliar Copia"
powershell -ExecutionPolicy Bypass -File .\scripts\concorrencia_c34.ps1 -Users 4
```

Esperado:
- `Teste C34 concorrencia: SUCESSO`
- 4 usuarios distintos registrados no audit

## 4) Evidencia obrigatoria
- salvar print/saida dos scripts
- registrar no `anotacoes/LOG_ALTERACOES.md`:
  - data/hora
  - quem executou
  - resultado regressao P0
  - resultado concorrencia C34

## 5) Proxima acao recomendada
Com testes verdes, iniciar primeira mudanca funcional P0:
- C25 (exportacao pelo estado consolidado)

Regra:
- nao iniciar C25 se regressao ou concorrencia falhar.
