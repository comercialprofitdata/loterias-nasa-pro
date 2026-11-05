# 📋 Gabarito Oficial de Publicação no Instagram — Meu Volante PRO

Este documento é o nosso padrão oficial para divulgação rápida dos resultados da **Mega-Sena** e **Lotofácil** nas redes sociais (Instagram Feed, Stories e WhatsApp).

---

## 🟢 Modelo 1: MEGA-SENA (Feed & Stories)

### 📝 Texto / Legenda:

```text
🚨 MEGA-SENA #[NUMERO_CONCURSO]: [ACUMULOU! / SAIU O PRÊMIO!] 🚨

Confira o resultado oficial divulgado pela Caixa Econômica Federal do Concurso #[NUMERO_CONCURSO] ([DIA_SEMANA], [DATA]):

🎯 DEZENAS SORTEADAS:
👉 [D1] — [D2] — [D3] — [D4] — [D5] — [D6]

📊 PREMIAÇÃO OFICIAL:
• Sena (6 acertos): [Acumulou! ou X apostas de R$ Y]
• Quina (5 acertos): [QTD] apostas ganhadoras ([R$ VALOR] cada)
• Quadra (4 acertos): [QTD] apostas ganhadoras ([R$ VALOR] cada)

💰 PRÓXIMO SORTEIO:
Concurso #[PROXIMO_NUMERO] • [DIA_SEMANA_PROXIMO], [DATA_PROXIMO] às 20h
Estimativa de Prêmio: R$ [VALOR_ESTIMADO] Milhões!

📲 Audite suas apostas e gere seus jogos calibrados com matemática:
👉 https://loterias.pd.dev.br (Link na Bio)

#MeuVolantePRO #MegaSena #ResultadoMegaSena #LoteriasCaixa #Matematica #Probabilidade #JogoResponsavel #Loterias
```

---

## 🟣 Modelo 2: LOTOFÁCIL (Feed & Stories)

### 📝 Texto / Legenda:

```text
🎯 LOTOFÁCIL #[NUMERO_CONCURSO]: [ACUMULOU! / SAIU O PRÊMIO!] 🎯

Confira o resultado oficial do Concurso #[NUMERO_CONCURSO] realizado pela Caixa Econômica Federal ([DIA_SEMANA], [DATA]):

🟣 DEZENAS SORTEADAS:
👉 [01] - [02] - [03] - [04] - [05]
👉 [06] - [07] - [08] - [09] - [10]
👉 [11] - [12] - [13] - [14] - [15]

📊 RESUMO DA PREMIAÇÃO:
• 15 acertos: [Acumulou! ou X apostas de R$ Y]
• 14 acertos: [QTD] apostas ganhadoras ([R$ VALOR] cada)
• 13 acertos: [QTD] apostas de R$ 35,00
• 12 acertos: [QTD] apostas de R$ 14,00
• 11 acertos: [QTD] apostas de R$ 7,00

💰 PRÓXIMO SORTEIO:
Concurso #[PROXIMO_NUMERO] • [DIA_SEMANA_PROXIMO], [DATA_PROXIMO] às 20h
Estimativa de Prêmio: R$ [VALOR_ESTIMADO] Milhões!

📲 Não jogue no achismo: monte e confira seus jogos na nossa plataforma:
👉 https://loterias.pd.dev.br (Link na Bio)

#MeuVolantePRO #Lotofacil #ResultadoLotofacil #LoteriasCaixa #Matematica #JogoResponsavel #Loterias
```

---

## 🎨 Como Gerar a Arte do Instagram Instantaneamente:

O template padrão em HTML já está em `marketing/instagram/template-gabarito.html`. Para renderizar a imagem em PNG com a resolução exata do Instagram (1080x1350):

```powershell
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--headless=new', '--screenshot="marketing\instagram\resultado-novo.png"', '--window-size=1080,1350', '"file:///C:/Users/vitorio.neto/Documents/Vitório PC/Arquivos BERT/Loterias Nasa/marketing/instagram/template-gabarito.html"' -Wait
```
A imagem sai pronta, formatada e com os gradientes do Meu Volante PRO.
