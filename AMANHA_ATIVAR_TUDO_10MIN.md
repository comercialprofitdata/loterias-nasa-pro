# Checklist de Amanhã — Ligar Receita + Push Real em 10 Minutos

Tudo que não dependia do seu login já foi feito, testado (`84` testes CI + Chrome CDP Dark/Light), compilado (`android/LotoLab-v10.aab` — 4,66 MB assinado), **enviado para revisão em `production` na Google Play (`versionCode 10`, `2.4.0`)** e publicado no GitHub.

Abaixo estão **apenas os 3 passos externos** para ligar **Receita (Google Play Billing)** e **Retenção (Push Real em segundo plano)**.

---

## Passo 1 — Supabase (SQL + Secrets VAPID + Deploy das Edge Functions) — ~4 min

### 1.1 Rodar os 3 arquivos SQL no SQL Editor do Supabase
Abra `https://supabase.com/dashboard/project/kwiagspkzrnculrvtrmp/sql/new` e execute na ordem:
1. `supabase/migration-5-loterias-e-seguranca.sql` *(amplia CHECK para 5 loterias + `purchase_token` único)*
2. `supabase/schema-push-notifications.sql` *(tabela `push_subscriptions` + RPCs `SECURITY DEFINER`)*
3. `supabase/schema-boloes.sql` *(tabela `boloes_usuarios` com sync em nuvem dos bolões)*

### 1.2 Configurar Secrets e subir as 5 Edge Functions (via terminal)
As chaves VAPID já foram geradas e salvas localmente em `android/.vapid-keys.json` (fora do Git). Basta colar este bloco no PowerShell na pasta do projeto:

```powershell
npx supabase login
npx supabase link --project-ref kwiagspkzrnculrvtrmp

$vapid = Get-Content android\.vapid-keys.json -Raw | ConvertFrom-Json
npx supabase secrets set `
  VAPID_PUBLIC_KEY="$($vapid.publicKey)" `
  VAPID_PRIVATE_KEY="$($vapid.privateKey)" `
  VAPID_SUBJECT="mailto:comercial.profitdata@gmail.com" `
  PUSH_CRON_SECRET="$( [guid]::NewGuid().ToString('N') )"

npx supabase functions deploy validar-play-billing
npx supabase functions deploy enviar-push
npx supabase functions deploy sync-historico
npx supabase functions deploy token-whatsapp
npx supabase functions deploy criar-cobranca
```

*(Copie o `PUSH_CRON_SECRET` gerado e salve também em GitHub → Settings → Secrets → Actions → `PUSH_CRON_SECRET` para o cron automático `.github/workflows/push-diario.yml` disparar ter/qui/sáb.)*

---

## Passo 2 — Google Play Console (2 Assinaturas + ASO + 6 Capturas) — ~5 min

1. **Criar os 2 SKUs de Assinatura** (`Monetizar com o Google Play → Produtos → Assinaturas → Criar assinatura`):
   - ID **`lotolab_pro_mensal`** — Plano base mensal **R$ 6,90/mês**
   - ID **`lotolab_pro_anual`** — Plano base anual **R$ 19,90/ano** *(oferta de lançamento)*
2. **Permissão da Service Account para validar recibos:**
   - `Usuários e permissões` → sua conta de serviço (`android/play-service-account.json`) → marcar **Visualizar dados financeiros** + **Gerenciar pedidos e assinaturas**.
3. **Atualizar Presença na Loja (ASO v2.4.0):**
   - Copiar textos prontos de `marketing/ficha-google-play.md`;
   - Arrastar as **6 novas capturas 1080×1920** de `marketing/play/captura-1-jogo.png` até `captura-6-bolao.png`.

---

## Passo 3 — Ligar a Caixa Registradora na Play Store — ~1 min

Assim que os 2 SKUs estiverem ativos no Passo 2:
1. Me diga **"SKUs criados, liga o caixa na Play Store"** → eu desativo o bypass temporário de PRO grátis em `js/contexto-loja.js` e o app v10 (que já vem com `billing:1.2.0` + `DigitalGoodsRequestHandler`) passa a cobrar nativamente via Google Play!
2. **(Opcional — Google 1-toque):** em Supabase → Authentication → Providers → Google, ligar com Client ID/Secret e mudar `googleEnabled: true` em `supabase/config.js`.
3. **(Quando quiser fazer limpeza de segurança pendente):** revogar o token antigo em `https://supabase.com/dashboard/account/tokens` e me avisar para remover o arquivo `.txt` do histórico Git.
