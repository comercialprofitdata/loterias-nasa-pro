# 🧪 TESTING CHECKLIST - Meu Volante PRO
## Validação Completa (Manual + Automatizada)

**Data:** 11 de Setembro de 2026  
**Tester:** Você  
**Ambiente:** GitHub Pages + Supabase  

---

## ✅ PRÉ-TESTES (Preparação)

- [ ] **Backup completo**: `git status` limpo
- [ ] **Navegadores testados**: Chrome, Firefox, Safari (se Mac), Edge
- [ ] **Dispositivos testados**:
  - [ ] Desktop (1920x1080)
  - [ ] Tablet (768x1024)
  - [ ] Mobile (375x667 / iPhone)
  - [ ] Mobile (360x800 / Android)
- [ ] **Cache limpo**: Devtools → Network → Disable cache
- [ ] **Console aberto**: F12 → Console (verificar errors)

---

## 🎨 FASE 1: UI/UX REDESIGN (Bottom Tab Bar)

### Home Page
- [ ] Página carrega em < 2 segundos
- [ ] Hero card visível com 1 CTA primário ("Gerar um Jogo")
- [ ] Calendário dos sorteios (Mega-Sena + Lotofácil) aparece
- [ ] Stats do usuário mostram (bilhetes salvos, investimento)
- [ ] Card de upgrade PRO está visível

### Bottom Tab Bar Navigation
- [ ] 4 abas visíveis na parte inferior: Home, Gerar, Análise, Carteira
- [ ] Abas são thumb-friendly (altura mínima 48px)
- [ ] Aba ativa tem cor diferente (gradiente verde/cyan)
- [ ] Ao clicar em aba, muda de view sem lag
- [ ] Transição suave entre abas (< 300ms)

### Mobile Responsividade
- [ ] No mobile (< 640px), bottom bar é 60px altura
- [ ] Cards empilham em 1 coluna
- [ ] Texto legível sem zoom
- [ ] Botões clicáveis com espaço suficiente (44x44px mín)
- [ ] Sem scroll horizontal

### Desktop Responsividade
- [ ] No desktop, conteúdo centralizado em max-width
- [ ] Sem quebras de layout estranhas
- [ ] Espaço extra aproveitado (não pareça móvel)

---

## 💰 FASE 2: UPGRADE MODAL & PAYWALL

### Abrir Modal
- [ ] Botão "Ver Planos" (no home) abre modal
- [ ] Botão "Conhecer recursos" (hero card) abre modal
- [ ] Botão "Status do Plano" (header) abre modal

### Modal Renderização
- [ ] Modal aparece com fade-in animation
- [ ] 4 planos visíveis: FREE, Avulso, Mensal, Anual
- [ ] Plano "Mensal" tem badge "RECOMENDADO" e destaque visual
- [ ] Cores diferenciadas por plano (slate, emerald, cyan, amber)
- [ ] Scroll funciona se conteúdo > viewport

### Interação com Planos
- [ ] Clique em "FREE" → mensagem "Seu plano atual"
- [ ] Clique em "Avulso" (R$ 5,90) → abre checkout PIX
  - [ ] QR Code exibido (simulado)
  - [ ] Botão "Copiar Código PIX" → copia para clipboard
  - [ ] Timeout de 10 minutos visível
  - [ ] Botão "Confirmei Pagamento" → confirmação com celebração
- [ ] Clique em "Mensal" (R$ 29,90) → abre trial
  - [ ] Input de email aparece
  - [ ] Badge "3 DIAS GRÁTIS" visível
  - [ ] Sem cobro de cartão mencionado
  - [ ] Botão "Ativar Teste" → confirmação
- [ ] Clique em "Anual" (R$ 197) → checkout anual
  - [ ] Desconto "45% OFF" destacado
  - [ ] Economia "R$ 161,80/ano" visível

### Modal Closure
- [ ] Botão X fecha modal
- [ ] Clique fora (no backdrop) fecha modal
- [ ] Tecla ESC fecha modal (se implementado)

### Confirmação de Upgrade
- [ ] Tela de sucesso com 🎉 emoji grande
- [ ] Mensagem "Conta Promovida!"
- [ ] Botão "Começar Agora" fecha modal
- [ ] localStorage atualizado (plano_nasa_ativo)

---

## 👑 FASE 3: ADMIN DASHBOARD

### Acesso ao Admin
- [ ] Abrir com `?admin=true` na URL
- [ ] Admin dashboard carrega
- [ ] Header mostra "👑 Painel Executivo"
- [ ] Badge "Admin" visível no topo
- [ ] Botão "Sair" funciona (volta ao app normal)

### KPI Cards
- [ ] 4 cards visíveis: MRR, LTV, Users, Churn
- [ ] Valores exibidos corretamente
- [ ] Indicadores de tendência (up/down) com cores corretas
- [ ] Cards responsivos em mobile (1 coluna)

### Gráficos
- [ ] Chart.js CDN carregado (sem erro)
- [ ] Gráfico de Receita (linha) exibido
  - [ ] Eixo Y formatado em R$ (reais)
  - [ ] Hover mostra tooltip com valor
  - [ ] Cores corretas (emerald gradient)
- [ ] Gráfico de Usuários (barras) exibido
  - [ ] Barras coloridas e responsivas
  - [ ] Hover destaca barra
  - [ ] Legendas visíveis

### Tabela de Usuários
- [ ] Colunas: Nome, E-mail, Plano, Status, Ativação, Ações
- [ ] 5+ linhas de dados exemplo exibidas
- [ ] Badges de plano (FREE/PRO/BLOQUEADO) com cores
- [ ] Badges de status (Ativo/Inativo) com cores
- [ ] Botões de ação (PRO, Bloquear) em cada linha

### Filtros de Usuários
- [ ] Dropdown "Todos os Planos" funciona
  - [ ] "Apenas FREE" → mostra só FREE
  - [ ] "Apenas PRO" → mostra só PRO
  - [ ] "Bloqueados" → mostra bloqueados
- [ ] Input de busca por nome/email funciona
  - [ ] Busca "João" → mostra João Silva
  - [ ] Busca "maria@" → mostra Maria Santos
  - [ ] Busca vazia → mostra todos

### Ações de Admin
- [ ] Clique "⭐ PRO" → confirm dialog
- [ ] Clique "Bloquear" → confirm dialog
- [ ] Ações geram toast de sucesso

### Tabela de Transações
- [ ] Colunas: ID, Usuário, Valor, Data, Status, Método
- [ ] Status badges (Pago ✅, Pendente ⏳, Falhou ❌)
- [ ] Dados ordenados por data descrescente

### Export
- [ ] Botão "📥 Exportar CSV" funciona
- [ ] Download de arquivo `.csv` é acionado
- [ ] Arquivo contém dados corretos
- [ ] Ctrl+E também dispara export (atalho)

---

## 🔊 FASE 4: MICRO-INTERAÇÕES

### Sons
- [ ] Botões emitem "beep" ao clicar
- [ ] Upgrade gera "whoosh" ao abrir
- [ ] Sucesso gera som positivo
- [ ] Erros geram som de aviso
- [ ] Botão toggle áudio (no header) funciona
- [ ] Sem sons se toggle estiver OFF

### Haptic (Vibração)
- [ ] Em Android/Chrome: vibração ao clicar botões
- [ ] Em iOS: Se suportado, vibração leve
- [ ] Padrões diferentes para sucesso/erro
- [ ] Sem erro em dispositivos sem suporte

### Animações
- [ ] Modal abre com slide-up
- [ ] Toast notificações slide-up + slide-down
- [ ] Hover em cards têm efeito visual
- [ ] Botões têm ripple effect (subtle)
- [ ] Transições suaves (< 300ms)

### Celebração
- [ ] Ao confirmar upgrade, confetti cai
- [ ] Emojis (🎉🎯⭐✨🎯) aparecem aleatoriamente
- [ ] Animação dura ~3 segundos
- [ ] Som de sucesso toca

---

## 🛡️ FASE 5: SEGURANÇA & COMPLIANCE

### LGPD
- [ ] Modal de Termos/LGPD acessível no rodapé
- [ ] 3 abas: Termos, LGPD, Direitos
- [ ] Botão "Exportar Dados" funciona (JSON download)
- [ ] Botão "Excluir Conta" limpa localStorage

### Disclaimer +18
- [ ] No home, aviso +18 está visível
- [ ] Modal de termos aparece no primeiro acesso
- [ ] Texto claro sobre jogo responsável

### Dados Privados
- [ ] Email/senha não exibidos em console
- [ ] Tokens JWT não visíveis em localStorage (checar DevTools)
- [ ] Supabase key é pública (anonKey ok)

---

## 📊 FASE 6: PERFORMANCE

### Velocidade
- [ ] Home carrega em < 2s (Lighthouse)
- [ ] Modal abre em < 500ms
- [ ] Admin dashboard carrega em < 1s
- [ ] Sem "jank" (stuttering) ao navegar

### Lighthouse Score
Abra DevTools → Lighthouse → Generate report:
- [ ] Performance: > 80
- [ ] Accessibility: > 85
- [ ] Best Practices: > 90
- [ ] SEO: > 90

### Network
- [ ] Todos os scripts carregam (F12 → Network)
- [ ] Sem 404 errors
- [ ] Supabase API calls funcionam
- [ ] Sem console errors vermelhos

---

## 🧩 FASE 7: FLUXOS CRÍTICOS

### Fluxo de Conversão
1. [ ] Visitante abre home
2. [ ] Vê hero card + 1 CTA
3. [ ] Clica "Gerar um Jogo" → vai pra aba Gerar
4. [ ] Clica "Ver Planos" → modal upgrade
5. [ ] Seleciona "Mensal" → trial flow
6. [ ] Confirma → sucesso com celebração

### Fluxo de Admin
1. [ ] Abrir com `?admin=true`
2. [ ] Admin dashboard renderiza
3. [ ] Ver KPIs, gráficos, tabelas
4. [ ] Filtrar usuários
5. [ ] Promover usuário to PRO
6. [ ] Exportar CSV

### Fluxo Offline (PWA)
1. [ ] Abrir app
2. [ ] Desativar internet (F12 → Offline)
3. [ ] App ainda funciona (static pages)
4. [ ] Desabilitar service worker (F12 → Application → Service Workers)
5. [ ] Recarregar → offline indicator (se impl.)

---

## 🎯 FASE 8: PLAY STORE READINESS

- [ ] assetlinks.json existe em `.well-known/`
- [ ] PLAY_STORE_READINESS.md documento completo
- [ ] manifest.json tem todos os campos
- [ ] Service Worker pronto para caching
- [ ] Ícones PWA (192px, 512px) presentes

---

## 📋 RESULTADO FINAL

### Bugs Encontrados
```
[ ] Bug #1: Descrição
[ ] Bug #2: Descrição
[ ] Bug #3: Descrição
```

### Score de Satisfação
- UI/UX Redesign: ___ / 10
- Upgrade Modal: ___ / 10
- Admin Dashboard: ___ / 10
- Micro-interações: ___ / 10
- Performance: ___ / 10

**Score Geral: ___ / 50**

**Pronto para Go-Live?** [ ] SIM [ ] NÃO (descrever why)

---

## 💾 APÓS TESTES

- [ ] Commit todos os testes/screenshots
- [ ] Push para GitHub Pages
- [ ] Verificar deploy automático
- [ ] Testar link ao vivo: https://vitoriobergamobrazil.github.io/loterias-nasa-pro/
- [ ] Testar em mobile real (não apenas emulação)

---

## 🐛 REPORTAR BUGS

Formato de bug report:
```
**Bug:** [Título curto]
**Reproduzir:**
1. Faça X
2. Clique em Y
3. Esperado: Z
4. Obtido: W

**Screenshots:** [Se possível]
**Severidade:** [Critical | High | Medium | Low]
```

---

## 📞 Suporte

Perguntas durante testes?
- Verifique console (F12) para erros
- Limpe cache (Ctrl+Shift+Delete)
- Tente em outro navegador
- Tente em modo anônimo (sem extensões)

**Happy testing!** 🎉
