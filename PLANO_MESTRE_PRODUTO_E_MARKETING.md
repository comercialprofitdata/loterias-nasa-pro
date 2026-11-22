# Plano Mestre de Produto, ASO, Retenção e Monetização

**Última atualização:** 22/11/2026  
**Objetivo:** Levar o aplicativo ao topo da busca na Google Play Store Brasil na categoria Ferramentas/Loterias e gerar receita recorrente previsível.

---

## 1. Ordem Obrigatória de Execução (Status Atual)

1. **Etapa 1 — Identidade Definitiva & Loja Destravada**
   - [x] Nome definitivo cravado (**LotoLab: Gerador e Loterias**), sem colisão direta.
   - [x] `excluir-conta.html`, ficha da loja, ícone escuro adaptativo e `.aab` enviados automaticamente via API Google Play (`v9 / 2.3.0` em Produção e Teste Interno com `In-App Updates`).

2. **Etapa 2 — Prova Social & Instagram Ativo**
   - [x] Perfil `@lotolab.app` criado, página ponte `https://loterias.pd.dev.br/baixar.html` (`market://` + Play Store + Criar Conta) no ar e 13 artes + 5 Stories + 5 capas de Destaques prontos em `marketing/instagram/`.
   - [ ] Colocar `https://loterias.pd.dev.br/baixar.html` na bio do Instagram, agendar os posts e conquistar as primeiras **15 a 30 avaliações 5★ reais** na Google Play.

3. **Etapa 3 — Evolução do Produto (Diferenciação Real) ✅**
   - [x] **Linguagem Calibrada:** substituído *"comum / incomum"* por *"Calibrado / Fora da curva"* e *"Desvio de calibragem"*, mantendo 100% o compliance.
   - [x] **Bolão Completo:** salva na Carteira, confere automaticamente contra a CAIXA e calcula **prêmio total, prêmio por cota e sua parte**.
   - [x] **5 Loterias:** Mega-Sena e Lotofácil em destaque no topo + **Quina**, **Lotomania** (com 0 acertos!) e **Dia de Sorte** no menu *Mais ▾ / Outras loterias*.

4. **Etapa 4 — Retenção Diária: Quiz + Instagram + Tokens + Avisos ✅**
   - [x] **Quiz Diário (20 perguntas)** com ganho e resgate real de **Tokens** (20 Tokens = +1 geração bônus).
   - [x] **Avisos no topo**, **notícias clicáveis com modal** e **lembretes às 20h30** nos dias de sorteio.

5. **Etapa 5 — Monetização Híbrida & Preço Agressivo**
   - [x] Preços competitivos (**R\$ 6,90/mês** e **R\$ 19,90/ano**) aplicados na UI e no código da Edge Function `criar-cobranca`.
   - [x] Cliente **Google Play Billing** (`js/play-billing.js`, Digital Goods API) + Edge Function `validar-play-billing` prontos e testados (`lotolab_pro_mensal` / `lotolab_pro_anual`).
   - [ ] Publicar `criar-cobranca` e `validar-play-billing` no painel do Supabase (com secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`).
   - [ ] Criar os SKUs `lotolab_pro_mensal` e `lotolab_pro_anual` no Google Play Console e o App ID no Google AdMob.
   - [ ] Ligar **Google Ads** apenas após 15+ avaliações e monetização ativa.
