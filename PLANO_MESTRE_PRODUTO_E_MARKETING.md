# Plano Mestre LotoLab — Engenharia NASA / MIT / Harvard

**Última atualização:** 22/11/2026  
**Objetivo:** Levar o **LotoLab: Gerador e Loterias** ao topo da Google Play Store Brasil com retenção recorrente (Push real + Quiz) e monetização sustentável (Google Play Billing + AdMob + Web PIX/Cartão).  
**Regra de Ouro (Flight Readiness):** nenhuma fase fecha sem passar em teste automatizado (`npm run ci`) + auditoria visual real em Chrome CDP (mobile 390px + desktop 1280px, Dark & Light, `0` erros JS).

---

## FASE 1 — Integridade Total das 5 Loterias + Home Enxuta ("Zero Defeito") ✅
- [x] **5 Loterias ponta a ponta:** Mega-Sena e Lotofácil em destaque no topo + **Quina (01–80)**, **Lotomania (00–99, 50 dez, 0 acertos)** e **Dia de Sorte (01–31 + Mês da Sorte)** no menu *Mais ▾ / Outras loterias*.
- [x] **Ciência Estatística Real (MIT) nas 5 loterias:** Entropia 2D de Shannon, Qui-Quadrado ($\chi^2$), Z-score exato sem reposição, Paridade/Primos e Quadrantes calibrados em `js/app.js`, `js/gastos.js`, `js/simulador-retrospectivo.js` e `js/analisar-numeros.js`.
- [x] **Carteira, WhatsApp, Ritual e Impressão A4/PDF com identidade própria por loteria:** cor, ícone, rótulo, filtro próprio na Carteira e grade real de impressão (`60 / 25 / 80 / 100 / 31`) em `js/carteira-gestao.js`, `js/whatsapp-share.js`, `js/ritual.js` e `js/volante-impressao.js`.
- [x] **Home ultra-enxuta focada em JOGAR:** removido excesso de avisos acima do Hero (`GERAR JOGO` no topo imediato); banners de instalação ocultos no app Android; manchete dinâmica da CAIXA (expansível) + Quiz compacto de 1 pergunta movidos para **abaixo dos sorteios**.
- [x] **Bolão Completo:** regras oficiais CAIXA para as 5 loterias, divisão por cotas e conferência automática de prêmios.

## FASE 2 — Infraestrutura de Receita & Backend (Contas Externas)
- [x] Código de preços (**R\$ 6,90/mês · R\$ 19,90/ano**) e **Google Play Billing** (`js/play-billing.js` + `supabase/functions/validar-play-billing/index.ts`) prontos e testados.
- [ ] **Supabase:** salvar token em `android/.supabase-token` → publicar `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `criar-cobranca`, `validar-play-billing` e `enviar-push` + rodar `supabase/schema-push-notifications.sql`.
- [ ] **Google Play Console:** criar assinaturas `lotolab_pro_mensal` e `lotolab_pro_anual` + licença de testador.
- [ ] **Google AdMob:** criar App ID + bloco discreto (e vídeo recompensado opcional) apenas para plano grátis.

## FASE 3 — Motor de Retenção: Push REAL em Segundo Plano + Android v10
- [x] **Código de Push Real (custo R\$ 0) pronto:** `supabase/schema-push-notifications.sql`, `supabase/functions/enviar-push/index.ts` (Quiz 09h, Mega Acumulada 18h via CAIXA ao vivo, Resultado 21h15 e Broadcast Admin), `js/push-real.js` e `.github/workflows/push-diario.yml`.
- [ ] **Ativar chaves VAPID** no Supabase (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_ADMIN_SECRET`) e no GitHub Actions (`PUSH_ADMIN_SECRET`) + colocar `vapidPublicKey` em `supabase/config.js`.
- [ ] **Android v10 (`2.4.0`):** ativar `enableNotifications: true` em `android/app/build.gradle` (TWA Notification Delegation), ajustar `In-App Updates` e publicar na Play Store via `npm run play:upload`.

## FASE 4 — Growth Loop & Escala (Harvard)
- [x] Perfil `@lotolab.app`, página ponte `https://loterias.pd.dev.br/baixar.html` e 13 artes + 5 Stories + 5 capas prontas em `marketing/instagram/`.
- [ ] Colocar `baixar.html` na bio do `@lotolab.app`, publicar 3x/semana e conquistar **20–30 avaliações 5★ reais** na Google Play.
- [ ] Ligar **Google Ads (App Campaigns)** somente após Gates 2 e 3 validados, controlando **CAC vs LTV**.
