# Auditoria Multidisciplinar & Benchmark de Mercado (62 Concorrentes) — LotoLab

> Cópia de referência versionada no projeto. Versão completa interativa disponível também nos Artifacts da conversa.

**Data:** 22/11/2026  
**Média Geral Atual do Produto:** **5,7 / 10** · **Potencial Pós-Correções P0/P1:** **9,1 / 10**

## 3 Alertas Vermelhos P0 (Ação Imediata)
1. **Segurança — Token Supabase no Git:** arquivo de PAT do Supabase rastreado na raiz do repositório expõe chave da Management API no próprio nome. **Deixado para revogação/limpeza futura a pedido do fundador** (`supabase.com/dashboard/account/tokens`).
2. **Monetização 100% morta na Google Play (`LTV = R$ 0`):** `js/contexto-loja.js` dá PRO grátis na Play Store e bloqueia o modal de upgrade; `android/app/build.gradle` omite `com.google.androidbrowserhelper:billing`; `supabase/functions/validar-play-billing/index.ts` já foi reescrito na Onda 0 para gravar em `subscriptions` + fazer `acknowledge` (falta apenas deploy no Supabase e criar SKUs no Play Console).
3. **Colisão direta de marca na Google Play:** a **Coreva Tech** (`corevatech.com.br`) já publica **"LotoLab BR" / "LotoLabBR Lotofácil Mega Quina" / "LotoLab 15 Pro"** no mesmo nicho exato. **Decisão do fundador:** manter a marca `LotoLab` e diferenciar pela experiência, Bolão Social, ciência honesta e identidade visual.

## Top Correções Priorizadas

### Onda 0 — P0 (Concluída e Auditada Visualmente em 22/11/2026 — `80/80` CI)
- [ ] *(Adiado pelo fundador)* Revogar token PAT no painel Supabase e remover o arquivo do repositório.
- [x] Remover modal zumbi *"Modo de Experiência"* (`js/redesign.js`) que atropela `#boas-vindas` em 1,5s.
- [x] Liberar 5 gerações manuais sem cadastro (`js/cadastro.js`) + corrigir toast falso `"1 aposta gerada!"` (`js/app.js`).
- [x] Corrigir bugs visíveis: `mudarAba('gerador')` → `'volante'` (`js/carteira-gestao.js`), comentário aberto `<!-- Suporte` (`js/redesign.js`), botão *"Já tenho meus números"* abrir `analisar-numeros.js`, renomear *"Scanner"* → *"Colar Jogos"*, limpar `"Desperdício / Viciado"` (`js/app.js`) e telefone placeholder (`js/feedback-testadores.js`).
- [x] Fechar bugs das 5 loterias: `limparFixosEProibidos` (`js/app.js`), Mapa de Calor Lotomania `00..99` (`js/app.js`), Fechamentos `loto-18-14` + matrizes de Quina/Lotomania/Dia de Sorte (`js/app.js`), conferência do Mês da Sorte (`js/conferencia-real.js`), `concursoAlvo` e limite em `salvarTodosFechamento` (`js/app.js`).
- [x] Completar Modo Claro (contraste AA/AAA verificado tela a tela no Chrome CDP) em `css/fluxo-jogo.css`, `css/upgrade-modal.css` e `css/redesign.css` + botão Voltar fechar `#modal-upgrade-nasa`.
- [x] Corrigir RLS de `push_subscriptions` (RPCs `SECURITY DEFINER`), criar `supabase/migration-5-loterias-e-seguranca.sql` para ampliar `CHECK` para 5 loterias, corrigir `validar-play-billing` com `acknowledge` e remover `download/MeuVolantePRO.apk` do deploy Pages.
- [x] Adicionar link `https://loterias.pd.dev.br/baixar.html` no rodapé do Bolão (`js/bolao.js`), Fechamentos e WhatsApp + suporte iOS em `baixar.html`.

### Onda 1 — P1 (Monetização, Retenção & Bolão Turbo)
- [x] **Onda 1A (Concluída e Validada em 22/11/2026 — `82/82` CI + Gradle Android v10 `BUILD SUCCESSFUL`):**
  - Bolão Turbo: Chave Pix do organizador, botão **"Cobrar pendentes no WhatsApp"**, botão **"Enviar resultado e prêmio por cota"**, e limite ampliado para **50 jogos no PRO**.
  - Resumo consolidado de conferência (`abrirResumoConferencia`) sem obrigar ritual 1 a 1.
  - Toast real (`#toast-container`) reposicionado abaixo do header (`64px`, zero sobreposição), OAuth Google preparado para `supabase.auth.signInWithOAuth`, e script Google GSI removido do carregamento ocioso.
  - Android v10 (`2.4.0`, `versionCode 10`) compilado e validado com `enableNotifications: true`, `POST_NOTIFICATIONS`, `com.google.androidbrowserhelper:billing:1.2.0` + `DigitalGoodsRequestHandler`, `LauncherActivity` sem race de In-App Updates, `mavenCentral()`, e `splash.webp` reduzida em **-95,1%** (`4,32 MB → 213 KB`).
- [ ] **Onda 1B (Caixa Registradora + Push Real no Ar — próximo passo guiado):**
  - Rodar migrações SQL + deploy das Edge Functions (`validar-play-billing`, `enviar-push`, `criar-cobranca`) e gerar chaves VAPID no Supabase.
  - Criar SKUs `lotolab_pro_mensal` (R$ 6,90) e `lotolab_pro_anual` (R$ 19,90) no Google Play Console, gerar o AAB v10 assinado e subir na Play Store.
  - Assim que os SKUs responderem na Play Store, desligar o bypass gratuito em `js/contexto-loja.js` e atualizar ASO da loja + Instagram.

### Onda 2 — P2 (Arquitetura & Liderança)
- [ ] Empacotar com Vite + ES Modules, remover 630 linhas de Admin legado + `Chart.js`, histórico offline das 5 loterias em IndexedDB, reescrever `sw.js` (Cache-First) e remover 8 `MutationObservers`.
- [ ] Avaliar migração do wrapper Android de **Bubblewrap TWA → Capacitor** caso AdMob nativo e Câmera OCR/Código de Barras real sejam prioritários.
- [ ] Decisão estratégica de marca frente à colisão `LotoLab BR` (Coreva Tech).
