// ===================================================================
// REDESIGN Meu Volante PRO 3.0 — Mobile-First FinTech & Telemetry Experience
// ===================================================================
// Arquitetura inspirada nas 50 melhores referências globais e nacionais
// (Jackpocket, TuLotero, Loterias CAIXA, 10Dobra, Expert Lotto):
// 1. Header Unificado de 1 linha (56px) com Pill Switcher Global (Mega / Lotofácil)
// 2. Navegação Inferior Nativa de 5 Abas (Início, Gerar, Fechamentos, Análise, Carteira)
// 3. Sub-Abas (Segmented Controls) em Gerar, Análise e Carteira & Bolão (Zero Scroll Infinito)
// 4. Volante Ergonômico (6 colunas na Mega-Sena mobile = bolas de 44px+) com toggle 10x6
// 5. Drawer de Perfil e Configurações (Conta, Créditos, Som, Tema, Sincronizar Caixa, LGPD, Admin)
// ===================================================================

const TABS_CONFIG = [
  { id: 'home', label: 'Início', icon: '🏠', view: 'view-inicio-new', legacyAba: 'inicio' },
  { id: 'gerar', label: 'Gerar', icon: '🎯', view: 'view-volante', legacyAba: 'volante' },
  { id: 'fechamentos', label: 'Fechar', icon: '📐', view: 'view-fechamentos', legacyAba: 'fechamentos' },
  { id: 'analise', label: 'Análise', icon: '📊', view: 'view-calor', legacyAba: 'calor' },
  { id: 'carteira', label: 'Carteira', icon: '💼', view: 'view-carteira', legacyAba: 'carteira' }
];

// Estado das Sub-Abas Mobile para eliminar rolagem infinita
let subAbaGerarAtiva = 'todos'; // 'rapido' | 'volante' | 'testes' | 'todos'
let subAbaCalorAtiva = 'ranking'; // 'ranking' | 'ciclo' | 'termica'
let subAbaCarteiraAtiva = 'bilhetes'; // 'bilhetes' | 'bolao' | 'ferramentas'
let volanteModo10Colunas = false;

document.addEventListener('DOMContentLoaded', function () {
  console.log('🎨 Inicializando Meu Volante PRO Mobile 3.0...');

  document.documentElement.classList.add('redesign');

  // Em telas mobile (<640px), começa na sub-aba focada para evitar scroll gigante
  subAbaGerarAtiva = window.innerWidth <= 640 ? 'rapido' : 'todos';

  criarTopbarUnificada();
  criarSidebarDesktop();
  createBottomTabBar();
  createSimplifiedHome();
  criarDrawerPerfilConfig();

  configurarSubAbasGerar();
  configurarToggleGradeVolante();
  configurarSubAbasAnalise();
  configurarSubAbasCarteiraEBolao();

  interceptarFuncoesLegadas();
  setupTabNavigation();

  sincronizarVisualModalidadeGlobal();
  sincronizarHeaderStatusUsuario();
  atualizarUltimoResultadoHome();
  inicializarPerfilExperiencia();

  activateTab('home');
  console.log('✅ Meu Volante PRO Mobile 3.0 pronto.');
});

// ===================================================================
// 1. TOPBAR UNIFICADA DE 1 LINHA (56PX) + PILL SWITCHER MEGA/LOTOFÁCIL
// ===================================================================
function criarTopbarUnificada() {
  const header = document.querySelector('header');
  if (!header || document.getElementById('nasa-unified-topbar')) return;

  const topbar = document.createElement('div');
  topbar.id = 'nasa-unified-topbar';
  topbar.innerHTML = `
    <!-- Logo Compacto -->
    <button type="button" class="nasa-brand-compact" onclick="activateTab('home'); tocarBeep('click');" title="Ir para o Início">
      <div class="nasa-brand-icon"><img src="./icon-192.png" alt="" width="32" height="32" style="border-radius:8px" /></div>
      <div class="nasa-brand-text">
        <span class="nasa-brand-title">Meu Volante PRO</span>
        
      </div>
    </button>

    <!-- Seletor Global de Loteria (1 toque em qualquer tela) -->
    <div class="nasa-modality-pill" role="tablist" aria-label="Escolher loteria">
      <button type="button" id="nasa-pill-mega" class="nasa-mod-btn active-mega" onclick="trocarModalidade('megasena')">
        <span>Mega</span>
      </button>
      <button type="button" id="nasa-pill-loto" class="nasa-mod-btn" onclick="trocarModalidade('lotofacil')">
        <span>Lotofácil</span>
      </button>
    </div>

    <!-- Ações Rápidas: VIP/Créditos + Menu Drawer -->
    <div class="nasa-header-actions">
      <button type="button" id="nasa-top-vip-btn" class="nasa-vip-chip" onclick="abrirModalPaywall('header')" title="Status do Plano e Créditos">
        <span id="nasa-top-vip-icon">⚡</span>
        <span id="nasa-top-vip-label">PRO</span>
      </button>
      <button type="button" id="nasa-top-drawer-btn" class="nasa-drawer-trigger" onclick="abrirDrawerPerfil()" title="Menu (Configurações, Mestres, Termos & LGPD)" aria-label="Abrir menu de configurações, mestres e conta">
        <span id="nasa-top-avatar" style="font-size: 1.25rem; font-weight: 900; line-height: 1; letter-spacing: -1px;">⋯</span>
      </button>
    </div>
  `;

  header.insertBefore(topbar, header.firstChild);
}

// ===================================================================
// 1.1 SIDEBAR LATERAL DESKTOP (CENTRO DE COMANDO DEFINITIVO)
// ===================================================================
function criarSidebarDesktop() {
  if (document.getElementById('nasa-desktop-sidebar')) return;

  const sidebar = document.createElement('aside');
  sidebar.id = 'nasa-desktop-sidebar';
  sidebar.className = 'nasa-desktop-sidebar';
  sidebar.setAttribute('aria-label', 'Navegação');

  sidebar.innerHTML = `
    <!-- Alça de Redimensionamento Manual (Arraste com o Mouse) -->
    <div class="sidebar-resizer" id="sidebar-resizer" title="Arraste para redimensionar a barra lateral"></div>

    <!-- Topo da Barra Lateral: Logo & Status -->
    <div class="sidebar-brand-box" onclick="activateTab('home'); tocarBeep('click');" role="button" tabindex="0" title="Ir para o Cockpit Inicial">
      <div class="sidebar-brand-icon">🎯</div>
      <div class="sidebar-brand-text">
        <span class="sidebar-brand-title">Meu Volante PRO</span>
        <span class="sidebar-brand-sub">SEUS JOGOS EM ORDEM</span>
      </div>
      <span class="sidebar-version-badge">v3.2</span>
    </div>

    <!-- Barra de Controle de Tamanho (◀ | P | M | G) -->
    <div class="sidebar-size-bar">
      <span class="sidebar-size-title">Barra:</span>
      <div class="sidebar-size-pills">
        <button type="button" id="btn-side-toggle" class="sidebar-size-btn" onclick="ajustarTamanhoSidebar('compacto')" title="Recolher / Expandir Ícones">
          <span id="side-toggle-arrow">◀</span>
        </button>
        <button type="button" id="btn-side-p" class="sidebar-size-btn" onclick="ajustarTamanhoSidebar('P')" title="Estreita (240px)">P</button>
        <button type="button" id="btn-side-m" class="sidebar-size-btn active" onclick="ajustarTamanhoSidebar('M')" title="Média (290px)">M</button>
        <button type="button" id="btn-side-g" class="sidebar-size-btn" onclick="ajustarTamanhoSidebar('G')" title="Ampla (360px)">G</button>
      </div>
    </div>

    <!-- Seletor de Modalidade (Mega-Sena / Lotofácil) -->
    <div class="sidebar-mod-selector">
      <div class="sidebar-mod-pill" role="tablist" aria-label="Escolha a loteria">
        <button type="button" id="sidebar-pill-mega" class="sidebar-mod-btn active-mega" onclick="trocarModalidade('megasena'); tocarBeep('click');">
          <span>Mega-Sena</span>
        </button>
        <button type="button" id="sidebar-pill-loto" class="sidebar-mod-btn" onclick="trocarModalidade('lotofacil'); tocarBeep('click');">
          <span>Lotofácil</span>
        </button>
      </div>
    </div>

    <!-- Seletor de Modo Desktop -->
    <div class="px-3 py-1">
      <button type="button" onclick="abrirModalSeletorPerfil()" class="nasa-modo-chip w-full justify-between" title="Alterar Modo de Experiência">
        <span class="flex items-center gap-1.5">
          <span class="nasa-modo-label font-bold text-[11px]">Estrategista</span>
        </span>
        <span class="text-[9px] text-cyan-400 font-mono">Modo ▾</span>
      </button>
    </div>

    <!-- Links de Navegação da Barra Lateral (SEM TRUNCAMENTO) -->
    <nav class="sidebar-nav-list" role="navigation" aria-label="Menu Principal">
      <button type="button" class="sidebar-nav-btn active" data-tab="home" onclick="activateTab('home'); tocarBeep('click');">
        <span class="sidebar-nav-label">Início</span>
      </button>

      <button type="button" class="sidebar-nav-btn" data-tab="gerar" onclick="activateTab('gerar'); tocarBeep('click');">
        <span class="sidebar-nav-label">Gerador & Volante</span>
      </button>

      <button type="button" class="sidebar-nav-btn" data-tab="fechamentos" onclick="activateTab('fechamentos'); tocarBeep('click');">
        <span class="sidebar-nav-label">Fechamentos</span>
      </button>

      <button type="button" class="sidebar-nav-btn" data-tab="analise" onclick="activateTab('analise'); tocarBeep('click');">
        <span class="sidebar-nav-label">Estatísticas</span>
      </button>

      <button type="button" class="sidebar-nav-btn" data-tab="carteira" onclick="activateTab('carteira'); tocarBeep('click');">
        <span class="sidebar-nav-label">Minha Carteira</span>
        <span class="sidebar-nav-count js-progresso-bilhetes">0</span>
      </button>

      <button type="button" class="sidebar-nav-btn" data-tab="bolao" onclick="irParaCarteiraSubAba('bolao'); tocarBeep('click');">
        <span class="sidebar-nav-label">Bolões & Rateio</span>
      </button>

      <button type="button" id="sidebar-nav-admin" class="sidebar-nav-btn hidden" data-tab="admin" onclick="mudarAba('admin'); tocarBeep('click');" style="color: #fbbf24; border-color: rgba(245, 158, 11, 0.5);">
        <span class="sidebar-nav-label font-black">Painel Admin</span>
      </button>
    </nav>

    <!-- Mini Widget do Próximo Sorteio Oficial -->
    <div class="sidebar-lottery-card" onclick="sincronizarConcursos(); tocarBeep('click');" role="button" tabindex="0" title="Clique para sincronizar resultados com a Caixa">
      <div class="sidebar-lottery-header">
        <span class="sidebar-live-indicator"></span>
        <span id="sidebar-lottery-name" class="font-bold text-[11px] text-emerald-400">MEGA-SENA</span>
        <span class="text-[9px] text-slate-400 font-mono ml-auto" id="sidebar-lottery-time">20h</span>
      </div>
      <div class="sidebar-lottery-prize js-mega-premio" id="sidebar-lottery-prize">—</div>
      <div class="sidebar-lottery-footer">
        <span class="text-[9px] text-slate-400">⏱️ <span class="js-megasena-countdown">Sincronizando...</span></span>
        <span class="text-[9px] text-cyan-400 font-mono">🔄 Caixa</span>
      </div>
    </div>

    <!-- Rodapé da Barra Lateral: Alternador de Tema + Perfil -->
    <div class="sidebar-bottom-actions">
      <!-- Alternador Tema Claro / Escuro -->
      <button type="button" id="sidebar-btn-theme" class="sidebar-action-btn" onclick="alternarTema();" title="Alternar entre Modo Claro e Modo Escuro">
        <span id="sidebar-icon-theme" class="text-base">☀️</span>
        <span id="sidebar-lbl-theme" class="text-xs font-bold">Modo Claro</span>
      </button>

      <!-- Cartão de Identidade / VIP -->
      <div class="sidebar-profile-card" onclick="abrirModalAuthOuPerfil(); tocarBeep('click');" role="button" tabindex="0" title="Gerenciar Conta / Acesso Master">
        <div class="sidebar-profile-avatar" id="sidebar-user-avatar">👤</div>
        <div class="sidebar-profile-info">
          <span class="sidebar-profile-name" id="sidebar-user-name">Visitante</span>
          <span class="sidebar-profile-badge" id="sidebar-user-badge">Plano Gratuito</span>
        </div>
        <button type="button" class="sidebar-profile-opt" title="Opções de Conta">⋯</button>
      </div>
    </div>
  `;

  document.body.insertBefore(sidebar, document.body.firstChild);

  // Restaura preferências salvas de largura da barra
  restaurarConfiguracoesSidebar();
  iniciarResizerSidebar();

  // Inicializa o estado visual do tema na sidebar
  if (typeof carregarTemaSalvo === 'function') {
    carregarTemaSalvo();
  }
}

function ajustarTamanhoSidebar(tamanho) {
  const sidebar = document.getElementById('nasa-desktop-sidebar');
  const seta = document.getElementById('side-toggle-arrow');
  if (!sidebar) return;

  if (typeof tocarBeep === 'function') tocarBeep('click');

  let largura = 290;
  if (tamanho === 'compacto') {
    sidebar.classList.toggle('is-compact');
    const compacta = sidebar.classList.contains('is-compact');
    largura = compacta ? 78 : 290;
    if (seta) seta.innerText = compacta ? '▶' : '◀';
    localStorage.setItem('nasa_sidebar_compact', compacta ? '1' : '0');
  } else {
    sidebar.classList.remove('is-compact');
    if (seta) seta.innerText = '◀';
    localStorage.setItem('nasa_sidebar_compact', '0');
    if (tamanho === 'P') largura = 240;
    else if (tamanho === 'M') largura = 290;
    else if (tamanho === 'G') largura = 360;
  }

  document.documentElement.style.setProperty('--sidebar-width', `${largura}px`);
  localStorage.setItem('nasa_sidebar_width', String(largura));

  ['p', 'm', 'g'].forEach(tam => {
    const b = document.getElementById(`btn-side-${tam}`);
    if (b) b.classList.toggle('active', tam.toUpperCase() === tamanho);
  });
}

function restaurarConfiguracoesSidebar() {
  const larguraSalva = localStorage.getItem('nasa_sidebar_width');
  const compactaSalva = localStorage.getItem('nasa_sidebar_compact') === '1';

  if (compactaSalva) {
    const sidebar = document.getElementById('nasa-desktop-sidebar');
    const seta = document.getElementById('side-toggle-arrow');
    if (sidebar) sidebar.classList.add('is-compact');
    if (seta) seta.innerText = '▶';
    document.documentElement.style.setProperty('--sidebar-width', '78px');
    return;
  }

  if (larguraSalva) {
    const num = parseInt(larguraSalva);
    if (!isNaN(num) && num >= 180 && num <= 500) {
      document.documentElement.style.setProperty('--sidebar-width', `${num}px`);
      ['p', 'm', 'g'].forEach(tam => {
        const b = document.getElementById(`btn-side-${tam}`);
        if (b) {
          const esperado = tam === 'p' ? 240 : (tam === 'm' ? 290 : 360);
          b.classList.toggle('active', Math.abs(num - esperado) < 30);
        }
      });
    }
  }
}

function iniciarResizerSidebar() {
  const resizer = document.getElementById('sidebar-resizer');
  if (!resizer) return;

  let startX = 0;
  let startWidth = 290;

  const onMouseMove = (e) => {
    const novaLargura = Math.max(200, Math.min(480, startWidth + (e.clientX - startX)));
    document.documentElement.style.setProperty('--sidebar-width', `${novaLargura}px`);
    localStorage.setItem('nasa_sidebar_width', String(novaLargura));
    const sidebar = document.getElementById('nasa-desktop-sidebar');
    if (sidebar) sidebar.classList.remove('is-compact');
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    resizer.classList.remove('resizing');
  };

  resizer.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    const current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
    startWidth = !isNaN(current) ? current : 290;
    resizer.classList.add('resizing');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  });
}

function sincronizarVisualModalidadeGlobal() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const pillMega = document.getElementById('nasa-pill-mega');
  const pillLoto = document.getElementById('nasa-pill-loto');

  document.documentElement.classList.toggle('lotofacil-mode', mod === 'lotofacil');

  if (pillMega && pillLoto) {
    if (mod === 'megasena') {
      pillMega.className = 'nasa-mod-btn active-mega';
      pillLoto.className = 'nasa-mod-btn';
    } else {
      pillMega.className = 'nasa-mod-btn';
      pillLoto.className = 'nasa-mod-btn active-loto';
    }
  }

  // Sincroniza o seletor da Sidebar Desktop
  const sidePillMega = document.getElementById('sidebar-pill-mega');
  const sidePillLoto = document.getElementById('sidebar-pill-loto');
  const sideLotteryName = document.getElementById('sidebar-lottery-name');
  if (sidePillMega && sidePillLoto) {
    if (mod === 'megasena') {
      sidePillMega.className = 'sidebar-mod-btn active-mega';
      sidePillLoto.className = 'sidebar-mod-btn';
      if (sideLotteryName) {
        sideLotteryName.innerText = 'MEGA-SENA';
        sideLotteryName.className = 'font-bold text-[11px] text-emerald-400';
      }
    } else {
      sidePillMega.className = 'sidebar-mod-btn';
      sidePillLoto.className = 'sidebar-mod-btn active-loto';
      if (sideLotteryName) {
        sideLotteryName.innerText = 'LOTOFÁCIL';
        sideLotteryName.className = 'font-bold text-[11px] text-purple-400';
      }
    }
  }

  // Sincroniza o badge de contagem regressiva ativa no hero
  const activeCountdown = document.getElementById('home-active-countdown');
  if (activeCountdown) {
    activeCountdown.className = `nasa-countdown-badge js-${mod}-countdown`;
    if (typeof calcularContagemRegressiva === 'function') {
      activeCountdown.innerText = calcularContagemRegressiva(mod);
    }
  }

  // Destaca o card ativo na Home
  const cardMega = document.getElementById('home-card-mega');
  const cardLoto = document.getElementById('home-card-loto');
  if (cardMega && cardLoto) {
    cardMega.className = `nasa-jackpot-mini-card ${mod === 'megasena' ? 'active-mod' : ''}`;
    cardLoto.className = `nasa-jackpot-mini-card ${mod === 'lotofacil' ? 'active-mod-loto' : ''}`;
  }

  if (typeof renderizarPalpiteExpressHome === 'function') {
    gerarPalpiteExpressHome({ silencioso: true });
  }

  // Mostra/esconde botão de alternar 6x10 vs 10x6 apenas na Mega-Sena
  const btnGridToggle = document.getElementById('btn-toggle-volante-cols');
  if (btnGridToggle) {
    btnGridToggle.style.display = mod === 'megasena' ? 'inline-flex' : 'none';
  }

  atualizarUltimoResultadoHome();
}

function sincronizarHeaderStatusUsuario() {
  const vipBtn = document.getElementById('nasa-top-vip-btn');
  const vipIcon = document.getElementById('nasa-top-vip-icon');
  const vipLabel = document.getElementById('nasa-top-vip-label');
  const topAvatar = document.getElementById('nasa-top-avatar');

  const ehPro = (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro') ||
                (typeof usuarioSessao !== 'undefined' && usuarioSessao?.tipo === 'master_founder');

  const creditos = typeof window.creditosGratisRestantes === 'function'
    ? window.creditosGratisRestantes()
    : (typeof usuarioSessao !== 'undefined' ? Number(usuarioSessao?.creditosGratis || 0) : 0);

  if (vipBtn && vipIcon && vipLabel) {
    if (ehPro) {
      vipBtn.classList.add('is-pro');
      vipIcon.innerText = '👑';
      vipLabel.innerText = 'VIP ATIVO';
    } else if (creditos > 0) {
      vipBtn.classList.remove('is-pro');
      vipIcon.innerText = '🎁';
      vipLabel.innerText = `${creditos} Grátis`;
    } else {
      vipBtn.classList.remove('is-pro');
      vipIcon.innerText = '⚡';
      vipLabel.innerText = 'SEJA PRO';
    }
  }

  if (topAvatar && typeof usuarioSessao !== 'undefined' && usuarioSessao) {
    if (usuarioSessao.tipo === 'master_founder') {
      topAvatar.innerText = '👑';
    } else if (usuarioSessao.tipo !== 'visitante' && usuarioSessao.nome) {
      topAvatar.innerText = (usuarioSessao.nome[0] || 'U').toUpperCase();
    } else {
      topAvatar.innerText = '⋯';
    }
  }

  const desktopAdminBtn = document.getElementById('nasa-desktop-nav-admin');
  const sideAdminBtn = document.getElementById('sidebar-nav-admin');
  const ehMaster = usuarioSessao?.tipo === 'master_founder';

  if (desktopAdminBtn) {
    if (ehMaster) desktopAdminBtn.classList.remove('hidden');
    else desktopAdminBtn.classList.add('hidden');
  }
  if (sideAdminBtn) {
    if (ehMaster) sideAdminBtn.classList.remove('hidden');
    else sideAdminBtn.classList.add('hidden');
  }

  // Sincroniza cartão de perfil da Sidebar Desktop
  const sideAvatar = document.getElementById('sidebar-user-avatar');
  const sideName = document.getElementById('sidebar-user-name');
  const sideBadge = document.getElementById('sidebar-user-badge');

  if (sideAvatar && sideName && sideBadge && typeof usuarioSessao !== 'undefined' && usuarioSessao) {
    if (ehMaster) {
      sideAvatar.innerText = '👑';
      sideName.innerText = usuarioSessao.nome || 'Vitório Bérgamo';
      sideBadge.innerText = 'Master Founder';
      sideBadge.className = 'sidebar-profile-badge master-badge';
    } else if (usuarioSessao.tipo === 'vip_convidado' || ehPro) {
      sideAvatar.innerText = '👑';
      sideName.innerText = usuarioSessao.nome || 'Assinante VIP';
      sideBadge.innerText = 'VIP Vitalício';
      sideBadge.className = 'sidebar-profile-badge vip-badge';
    } else if (usuarioSessao.tipo !== 'visitante') {
      sideAvatar.innerText = (usuarioSessao.nome?.[0] || 'U').toUpperCase();
      sideName.innerText = usuarioSessao.nome.split(' ')[0] || 'Usuário';
      sideBadge.innerText = 'Membro Gratuito';
      sideBadge.className = 'sidebar-profile-badge';
    } else {
      sideAvatar.innerText = '👤';
      sideName.innerText = 'Visitante';
      sideBadge.innerText = 'Toque para Entrar';
      sideBadge.className = 'sidebar-profile-badge';
    }
  }
}

// ===================================================================
// 2. BOTTOM TAB BAR DE 5 ABAS NATIVAS
// ===================================================================
function createBottomTabBar() {
  let tabBar = document.getElementById('bottom-tab-bar');
  if (tabBar) tabBar.remove();

  tabBar = document.createElement('nav');
  tabBar.id = 'bottom-tab-bar';
  tabBar.className = 'bottom-tab-bar';
  tabBar.setAttribute('aria-label', 'Navegação principal');

  TABS_CONFIG.forEach((tab) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bottom-tab-btn';
    btn.id = `bottom-nav-${tab.id}`;
    btn.onclick = () => {
      if (typeof tocarBeep === 'function') tocarBeep('click');
      if (typeof vibrarHaptico === 'function') vibrarHaptico(10);
      activateTab(tab.id);
    };
    btn.innerHTML = `
      <span class="tab-icon">${tab.icon}</span>
      <span class="tab-label">${tab.label}</span>
    `;
    tabBar.appendChild(btn);
  });

  document.body.appendChild(tabBar);
}

// ===================================================================
// 3. NOVA HOME MOBILE-FIRST (DASHBOARD COMPLETO SEM POLUIÇÃO)
// ===================================================================
function createSimplifiedHome() {
  let homeView = document.getElementById('view-inicio-new');
  if (homeView) homeView.remove();

  homeView = document.createElement('section');
  homeView.id = 'view-inicio-new';
  homeView.className = 'active';

  homeView.innerHTML = `
    <div class="nasa-home-grid">

      <!-- 1. HERO CARD: PRÓXIMOS SORTEIOS + AÇÃO IMEDIATA -->
      <div class="nasa-jackpot-hero">
        <div class="nasa-jackpot-top">
          <span class="nasa-live-pill">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span id="home-active-mod-badge">MEGA-SENA ATIVA</span>
          </span>
          <span class="nasa-countdown-badge js-megasena-countdown" id="home-active-countdown">Sorteio às 20h</span>
        </div>

        <!-- Dupla de Cards: Toque para alternar entre Mega-Sena e Lotofácil -->
        <div class="nasa-jackpot-MainRow">
          <div id="home-card-mega" class="nasa-jackpot-mini-card active-mod" onclick="trocarModalidade('megasena')">
            <div class="nasa-mini-label">
              <span class="text-emerald-400">🍀 MEGA-SENA</span>
              <span class="text-[10px] text-slate-400 js-mega-concurso">—</span>
            </div>
            <div class="nasa-mini-prize js-mega-premio">Carregando...</div>
            <div class="nasa-mini-sub">⏱️ <span class="js-megasena-countdown">—</span></div>
          </div>

          <div id="home-card-loto" class="nasa-jackpot-mini-card" onclick="trocarModalidade('lotofacil')">
            <div class="nasa-mini-label">
              <span class="text-purple-400">🟣 LOTOFÁCIL</span>
              <span class="text-[10px] text-slate-400 js-loto-concurso">—</span>
            </div>
            <div class="nasa-mini-prize js-loto-premio">Carregando...</div>
            <div class="nasa-mini-sub">⏱️ <span class="js-lotofacil-countdown">—</span></div>
          </div>
        </div>

        <!-- Botão Principal: Adaptativo por Modo de Experiência -->
        <button type="button" class="nasa-primary-cta" id="home-btn-hero-primary" onclick="iniciarJogo()">
          <span class="text-xl" id="home-hero-btn-icon" hidden></span>
          <span id="home-hero-btn-label">GERAR JOGO</span>
        </button>

        <!-- Botões Secundários: Caminho A ("Já tenho meus números") + Volante Manual -->
        <div class="nasa-secondary-cta-row">
          <button type="button" class="nasa-sec-btn" onclick="irParaVolanteManual()">
            <span>Já tenho meus números</span>
          </button>
        </div>
      </div>

      <!-- 1.1 CARD PALPITE DE OURO EXPRESS (EXCLUSIVO MODO RÁPIDO) -->
      <div id="home-card-palpite-rapido-box" class="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 space-y-2.5 font-sans shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div class="flex items-center gap-1.5">
            <div>
              <h3 class="text-xs font-black text-white uppercase tracking-wide">Jogo rápido</h3>
              <span class="text-[10px] text-amber-300/90 font-mono">Combinação gerada ao acaso. Não aumenta a chance.</span>
            </div>
          </div>
          <span id="home-rapido-score-badge" class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-black">
            
          </span>
        </div>

        <div id="home-rapido-dezenas" class="flex flex-wrap gap-1.5 justify-center py-2">
          <span class="text-xs text-slate-400 font-mono">Gerando palpite express...</span>
        </div>

        <div class="grid grid-cols-3 gap-1.5 pt-1">
          <button type="button" onclick="gerarPalpiteExpressHome()" class="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition">
            Outro
          </button>
          <button type="button" onclick="copiarPalpiteExpressHome()" class="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-800/60 flex items-center justify-center gap-1 active:scale-95 transition">
            Copiar
          </button>
          <button type="button" onclick="salvarPalpiteExpressHome()" class="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 active:scale-95 transition shadow-md shadow-emerald-500/20">
            Salvar
          </button>
        </div>
      </div>

      <!-- 2. ÚLTIMO RESULTADO OFICIAL DA CAIXA (Bolas Reais + Sincronizar) -->
      <div class="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div>
              <h3 class="text-xs font-black text-white uppercase tracking-wide" id="home-ultimo-titulo">Último Resultado Oficial Caixa</h3>
              <span class="text-[10px] text-slate-400 font-mono" id="home-ultimo-sub">Sincronizado em tempo real</span>
            </div>
          </div>
          <button type="button" onclick="sincronizarConcursos()" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold border border-slate-700 flex items-center gap-1 active:scale-95 transition">
            Atualizar
          </button>
        </div>
        <div id="home-ultimo-dezenas" class="flex flex-wrap gap-1.5 pt-0.5">
          <span class="text-xs text-slate-400 font-mono">Buscando último sorteio oficial na Caixa...</span>
        </div>
      </div>

      <!-- 3. ATALHOS PARA TODAS AS FERRAMENTAS DO APP (2x2) -->
      <div class="nasa-quick-tools-grid">
        <button type="button" class="nasa-tool-tile" onclick="activateTab('fechamentos'); tocarBeep('click');">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-cyan-950 text-cyan-300 border border-cyan-800">📐</div>
            
          </div>
          <div class="nasa-tool-title">Fechamentos</div>
          <div class="nasa-tool-desc">Combine de 10 a 20 dezenas em menos apostas. Cobre menos combinações.</div>
        </button>

        <button type="button" class="nasa-tool-tile" onclick="activateTab('analise'); tocarBeep('click');">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-rose-950 text-rose-300 border border-rose-800">🔥</div>
            
          </div>
          <div class="nasa-tool-title">Quentes & Ciclo</div>
          <div class="nasa-tool-desc">Mais sorteadas, atrasadas e dezenas que faltam no ciclo</div>
        </button>

        <button type="button" class="nasa-tool-tile" onclick="irParaCarteiraSubAba('bilhetes')">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-emerald-950 text-emerald-300 border border-emerald-800">💼</div>
            <span class="text-[10px] font-mono font-bold text-emerald-400"><span class="js-progresso-bilhetes">0</span> salvos</span>
          </div>
          <div class="nasa-tool-title">Minha Carteira</div>
          <div class="nasa-tool-desc">Confira seus bilhetes automaticamente na Caixa</div>
        </button>

        <button type="button" class="nasa-tool-tile" onclick="irParaCarteiraSubAba('bolao')">
          <div class="nasa-tool-tile-header">
            <div class="nasa-tool-icon bg-teal-950 text-teal-300 border border-teal-800">👥</div>
            <span class="text-[10px] font-mono font-bold text-teal-400">WhatsApp</span>
          </div>
          <div class="nasa-tool-title">Bolão & Rateio</div>
          <div class="nasa-tool-desc">Divida cotas entre amigos e gere recibo para o grupo</div>
        </button>
      </div>

      
      <!-- SEÇÃO DINÂMICA: APOSTAS ATIVAS DA CARTEIRA -->
      <div id="home-bloco-apostas-ativas" class="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div>
              <h3 class="text-xs font-black text-white">Minhas Apostas Ativas</h3>
              <span class="text-[10px] text-slate-400">Monitoramento e conferência oficial</span>
            </div>
          </div>
          <button type="button" onclick="irParaCarteiraSubAba('bilhetes')" class="px-2 py-1 rounded-xl bg-slate-800 text-cyan-300 text-[10px] font-bold border border-slate-700">
            Ver Carteira →
          </button>
        </div>
        <div id="home-apostas-ativas-conteudo" class="text-xs text-slate-400">
          <span class="text-[11px]">Nenhuma aposta ativa registrada ainda. Gere seu jogo e toque em <b>Salvar este jogo</b></span>
        </div>
      </div>

      

      

    </div>
  `;

  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(homeView, main.firstChild);
  }

  if (typeof carteiraJogos !== 'undefined' && Array.isArray(carteiraJogos)) {
    const totalInvestido = carteiraJogos.reduce((soma, b) => soma + (b.custo || 0), 0);
    atualizarResumoHome(carteiraJogos.length, totalInvestido);
  }
}

async function atualizarUltimoResultadoHome() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const badgeMod = document.getElementById('home-active-mod-badge');
  if (badgeMod) {
    badgeMod.innerText = mod === 'megasena' ? '🍀 MEGA-SENA ATIVA' : '🟣 LOTOFÁCIL ATIVA';
  }

  const tituloEl = document.getElementById('home-ultimo-titulo');
  const subEl = document.getElementById('home-ultimo-sub');
  const dezenasEl = document.getElementById('home-ultimo-dezenas');
  if (!dezenasEl) return;

  const base = mod === 'megasena'
    ? (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : [])
    : (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []);

  let ultimo = base && base.length > 0 ? base[0] : null;

  // Se o histórico ainda não carregou, tenta buscar o último direto da API da Caixa
  if (!ultimo && typeof window.obterUltimoResultadoOficial === 'function') {
    try {
      const res = await window.obterUltimoResultadoOficial(mod);
      if (res && Array.isArray(res.dezenas)) {
        ultimo = res;
      }
    } catch (_) {}
  }

  if (tituloEl) {
    tituloEl.innerText = `Último Resultado • ${mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil'}`;
  }

  if (!ultimo || !Array.isArray(ultimo.dezenas) || ultimo.dezenas.length === 0) {
    const baseLocal = (typeof modalidadeAtual !== 'undefined' && modalidadeAtual === 'lotofacil') ? baseConcursosLoto : baseConcursosMega;
    if (baseLocal?.[0]) {
      if (subEl) subEl.innerText = `Concurso #${baseLocal[0].concurso} • ${baseLocal[0].data}`;
      dezenasEl.innerHTML = baseLocal[0].dezenas.map((d) => `<span class="fluxo-bola">${String(d).padStart(2, '0')}</span>`).join('');
      return;
    }
    if (subEl) subEl.innerText = 'Toque em Atualizar para buscar na Caixa';
    dezenasEl.innerHTML = `<span class="text-xs text-slate-400">Toque em <b>🔄 Atualizar</b> para carregar as dezenas sorteadas.</span>`;
    return;
  }

  if (subEl) {
    subEl.innerText = `Concurso #${ultimo.concurso || '—'} ${ultimo.data ? '• ' + ultimo.data : ''}`;
  }

  const corBola = mod === 'megasena'
    ? 'bg-emerald-600 text-slate-950 border-emerald-400'
    : 'bg-purple-600 text-white border-purple-400';

  if (typeof atualizarProvaDosFatosRedesign === "function") atualizarProvaDosFatosRedesign();
  dezenasEl.innerHTML = ultimo.dezenas.map((d) => `
    <span class="w-8 h-8 rounded-xl ${corBola} border font-mono font-black text-xs flex items-center justify-center shadow-sm">
      ${String(d).padStart(2, '0')}
    </span>
  `).join('');
}

// ===================================================================
// 4. SUB-ABAS NA TELA "GERAR" (ACABA COM O SCROLL DE 4 TELAS)
// ===================================================================
function configurarSubAbasGerar() {
  const secVolante = document.getElementById('view-volante');
  if (!secVolante || document.getElementById('nasa-seg-gerar')) return;

  // Localiza os cartões reais dentro da coluna 1 (sem sobrescrever o container grid desktop)
  const col1 = secVolante.querySelector('.lg\\:col-span-7') || secVolante;
  const col1Cards = col1 ? Array.from(col1.children).filter((c) => c.tagName === 'DIV') : [];
  if (col1Cards[0] && !col1Cards[0].id) col1Cards[0].id = 'card-gerador-rapido';
  if (col1Cards[1] && !col1Cards[1].id) col1Cards[1].id = 'card-volante-manual';

  const segBar = document.createElement('div');
  segBar.id = 'nasa-seg-gerar';
  segBar.className = 'nasa-segmented-bar';
  segBar.innerHTML = `
    <button type="button" id="seg-gerar-rapido" class="nasa-seg-btn active" onclick="alternarSubAbaGerar('rapido')">
      <span>Gerar</span>
    </button>
    <button type="button" id="seg-gerar-volante" class="nasa-seg-btn" onclick="alternarSubAbaGerar('volante')">
      <span>Volante</span>
    </button>
    <button type="button" id="seg-gerar-testes" class="nasa-seg-btn" onclick="alternarSubAbaGerar('testes')">
      <span>Testes (<span id="seg-badge-testes-count">6/6</span>)</span>
    </button>
    <button type="button" id="seg-gerar-todos" class="nasa-seg-btn" onclick="alternarSubAbaGerar('todos')" title="Mostrar tudo na mesma tela">
      <span>Tudo</span>
    </button>
  `;

  secVolante.insertBefore(segBar, secVolante.firstChild);
  aplicarVisibilidadeSubAbaGerar();
}

function alternarSubAbaGerar(modo) {
  subAbaGerarAtiva = modo;
  if (typeof tocarBeep === 'function') tocarBeep('click');
  aplicarVisibilidadeSubAbaGerar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aplicarVisibilidadeSubAbaGerar() {
  subAbaGerarAtiva = 'todos';
  ['rapido', 'volante', 'testes', 'todos'].forEach((m) => {
    const btn = document.getElementById(`seg-gerar-${m}`);
    if (btn) btn.classList.toggle('active', m === subAbaGerarAtiva);
  });

  const cardGerador = document.getElementById('card-gerador-rapido');
  const cardVolante = document.getElementById('card-volante-manual');
  const cardMatriz = document.getElementById('card-matriz-4x4-box');
  const cardScore = document.getElementById('painel-score-telemetria');
  const cardTestes = document.getElementById('card-bateria-testes');
  const cardSugestao = document.getElementById('card-sugestao-troca');
  const cardRetro = document.getElementById('card-simulador-historico');

  const mostrar = (el, visivel) => {
    if (!el) return;
    el.style.display = visivel && !el.hidden ? '' : 'none';
  };

  // No desktop widescreen (>= 1024px), cockpit completo: exibe ambas as colunas sem esconder nada
  if (window.innerWidth >= 1024) {
    [cardGerador, cardVolante, cardMatriz, cardScore, cardTestes, cardSugestao, cardRetro].forEach((el) => mostrar(el, true));
    return;
  }

  if (subAbaGerarAtiva === 'rapido') {
    mostrar(cardGerador, true);
    mostrar(cardScore, true);
    mostrar(cardSugestao, true);
    mostrar(cardVolante, false);
    mostrar(cardMatriz, false);
    mostrar(cardTestes, true);
    mostrar(cardRetro, false);
  } else if (subAbaGerarAtiva === 'volante') {
    mostrar(cardGerador, false);
    mostrar(cardVolante, true);
    mostrar(cardScore, true);
    mostrar(cardSugestao, true);
    mostrar(cardMatriz, true);
    mostrar(cardTestes, true);
    mostrar(cardRetro, false);
    // Garante que a bateria dos 6 testes e a matriz comecem abertas
    const elBat = document.getElementById('conteudo-bateria-testes');
    if (elBat) elBat.classList.remove('hidden');
    const elMat = document.getElementById('conteudo-matriz-vitorio');
    if (elMat) elMat.classList.remove('hidden');
  } else if (subAbaGerarAtiva === 'testes') {
    mostrar(cardGerador, false);
    mostrar(cardVolante, false);
    mostrar(cardScore, true);
    mostrar(cardTestes, true);
    mostrar(cardSugestao, true);
    mostrar(cardMatriz, true);
    mostrar(cardRetro, true);
    ['conteudo-bateria-testes', 'conteudo-matriz-vitorio', 'conteudo-simulador-historico'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    });
  } else {
    // 'todos'
    [cardGerador, cardVolante, cardMatriz, cardScore, cardTestes, cardSugestao, cardRetro].forEach((el) => mostrar(el, true));
  }
}

// Permite alternar o volante da Mega-Sena entre "6 colunas grandes (44px)" e "10 colunas clássico"
function configurarToggleGradeVolante() {
  const cardVolante = document.getElementById('card-volante-manual');
  if (!cardVolante || document.getElementById('btn-toggle-volante-cols')) return;

  const controlsBox = document.getElementById('volante-top-controls') || cardVolante.querySelector('.flex.justify-between.items-center');
  if (!controlsBox) return;

  const btnToggle = document.createElement('button');
  btnToggle.type = 'button';
  btnToggle.id = 'btn-toggle-volante-cols';
  btnToggle.className = 'px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[11px] font-bold transition inline-flex items-center gap-1';
  btnToggle.innerHTML = '<span id="lbl-toggle-cols">Grade 6x10</span>';
  btnToggle.onclick = () => {
    volanteModo10Colunas = !volanteModo10Colunas;
    const grid = document.getElementById('volante-grid');
    const lbl = document.getElementById('lbl-toggle-cols');
    if (grid) grid.classList.toggle('classic-10x6', volanteModo10Colunas);
    if (lbl) lbl.innerText = volanteModo10Colunas ? 'Grade 10x6' : 'Grade 6x10';
    if (typeof tocarBeep === 'function') tocarBeep('click');
  };

  controlsBox.appendChild(btnToggle);
}

// ===================================================================
// 5. SUB-ABAS NA TELA "ANÁLISE / ESTATÍSTICAS" (#view-calor)
// ===================================================================
function configurarSubAbasAnalise() {
  const secCalor = document.getElementById('view-calor');
  if (!secCalor || document.getElementById('nasa-seg-calor')) return;

  const filhos = Array.from(secCalor.children);
  // filhos[0] = Hero estatísticas, filhos[1] = Top 10 Quentes, filhos[2] = Top 10 Frias, filhos[3] = Ciclo, filhos[4] = Grade Térmica
  if (filhos[1]) filhos[1].id = filhos[1].id || 'calor-card-quentes';
  if (filhos[2]) filhos[2].id = filhos[2].id || 'calor-card-frias';
  if (filhos[3]) filhos[3].id = filhos[3].id || 'card-ciclo-dezenas';
  if (filhos[4]) filhos[4].id = filhos[4].id || 'calor-card-termica';

  const segBar = document.createElement('div');
  segBar.id = 'nasa-seg-calor';
  segBar.className = 'nasa-segmented-bar';
  segBar.innerHTML = `
    <button type="button" id="seg-calor-ranking" class="nasa-seg-btn active" onclick="alternarSubAbaCalor('ranking')">
      <span>Quentes & Frias</span>
    </button>
    <button type="button" id="seg-calor-ciclo" class="nasa-seg-btn" onclick="alternarSubAbaCalor('ciclo')">
      <span>Ciclo</span>
    </button>
    <button type="button" id="seg-calor-termica" class="nasa-seg-btn" onclick="alternarSubAbaCalor('termica')">
      <span>Mapa de Calor</span>
    </button>
  `;

  secCalor.insertBefore(segBar, secCalor.firstChild);
  aplicarVisibilidadeSubAbaCalor();
}

function alternarSubAbaCalor(modo) {
  subAbaCalorAtiva = modo;
  if (typeof tocarBeep === 'function') tocarBeep('click');
  aplicarVisibilidadeSubAbaCalor();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aplicarVisibilidadeSubAbaCalor() {
  ['ranking', 'ciclo', 'termica'].forEach((m) => {
    const btn = document.getElementById(`seg-calor-${m}`);
    if (btn) btn.classList.toggle('active', m === subAbaCalorAtiva);
  });

  const quentes = document.getElementById('calor-card-quentes');
  const frias = document.getElementById('calor-card-frias');
  const ciclo = document.getElementById('card-ciclo-dezenas');
  const termica = document.getElementById('calor-card-termica');

  const mostrar = (el, v) => { if (el) el.style.display = v ? '' : 'none'; };

  if (subAbaCalorAtiva === 'ranking') {
    mostrar(quentes, true);
    mostrar(frias, true);
    mostrar(ciclo, false);
    mostrar(termica, false);
  } else if (subAbaCalorAtiva === 'ciclo') {
    mostrar(quentes, false);
    mostrar(frias, false);
    mostrar(ciclo, true);
    mostrar(termica, false);
  } else {
    mostrar(quentes, false);
    mostrar(frias, false);
    mostrar(ciclo, false);
    mostrar(termica, true);
  }
}

// ===================================================================
// 6. SUB-ABAS NA TELA "CARTEIRA & BOLÃO" (#view-carteira + #view-bolao)
// ===================================================================
function configurarSubAbasCarteiraEBolao() {
  const secCarteira = document.getElementById('view-carteira');
  const secBolao = document.getElementById('view-bolao');
  if (!secCarteira || document.getElementById('nasa-seg-carteira')) return;

  const segBar = document.createElement('div');
  segBar.id = 'nasa-seg-carteira';
  segBar.className = 'nasa-segmented-bar';
  segBar.innerHTML = `
    <button type="button" id="seg-cart-bilhetes" class="nasa-seg-btn active" onclick="alternarSubAbaCarteira('bilhetes')">
      <span>Bilhetes</span>
    </button>
    <button type="button" id="seg-cart-bolao" class="nasa-seg-btn" onclick="alternarSubAbaCarteira('bolao')">
      <span>Bolão & Cotas</span>
    </button>
    <button type="button" id="seg-cart-ferramentas" class="nasa-seg-btn" onclick="alternarSubAbaCarteira('ferramentas')">
      <span>Scanner</span>
    </button>
  `;

  const wrapperBilhetes = document.getElementById('carteira-subview-bilhetes');
  const wrapperBolao = document.getElementById('carteira-subview-bolao');
  const wrapperFerramentas = document.getElementById('carteira-subview-ferramentas');

  if (wrapperBilhetes && wrapperBolao && wrapperFerramentas) {
    if (secBolao) {
      while (secBolao.firstChild) {
        wrapperBolao.appendChild(secBolao.firstChild);
      }
    }
    secCarteira.insertBefore(segBar, secCarteira.firstChild);
    return;
  }

  // Fallback caso a estrutura dinâmica legada seja utilizada
  const filhosCarteira = Array.from(secCarteira.children);
  const wBilhetes = document.createElement('div');
  wBilhetes.id = 'carteira-subview-bilhetes';
  wBilhetes.className = 'space-y-4';

  const wFerramentas = document.createElement('div');
  wFerramentas.id = 'carteira-subview-ferramentas';
  wFerramentas.className = 'space-y-4 hidden';

  filhosCarteira.forEach((card, idx) => {
    if (idx === 1 || idx === 5 || idx === 0) {
      wBilhetes.appendChild(card);
    } else {
      wFerramentas.appendChild(card);
    }
  });

  const wBolao = document.createElement('div');
  wBolao.id = 'carteira-subview-bolao';
  wBolao.className = 'space-y-4 hidden';

  if (secBolao) {
    while (secBolao.firstChild) {
      wBolao.appendChild(secBolao.firstChild);
    }
  }

  secCarteira.appendChild(segBar);
  secCarteira.appendChild(wBilhetes);
  secCarteira.appendChild(wBolao);
  secCarteira.appendChild(wFerramentas);
}

function alternarSubAbaCarteira(modo) {
  subAbaCarteiraAtiva = modo;
  if (typeof tocarBeep === 'function') tocarBeep('click');

  ['bilhetes', 'bolao', 'ferramentas'].forEach((m) => {
    const btn = document.getElementById(`seg-cart-${m}`);
    if (btn) btn.classList.toggle('active', m === modo);
    const box = document.getElementById(`carteira-subview-${m}`);
    if (box) box.classList.toggle('hidden', m !== modo);
  });

  if (modo === 'bolao' && typeof calcularRateioBolao === 'function') {
    calcularRateioBolao();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.alternarSubAbaCarteira = alternarSubAbaCarteira;

function irParaCarteiraSubAba(subAba) {
  activateTab('carteira');
  alternarSubAbaCarteira(subAba);
}

function irParaGeradorRapido() {
  activateTab('gerar');
  alternarSubAbaGerar('rapido');
  if (typeof gerarApostaNasaComMatriz4x4 === 'function') {
    gerarApostaNasaComMatriz4x4();
  }
}

function irParaVolanteManual() {
  activateTab('gerar');
  alternarSubAbaGerar('volante');
}

// ===================================================================
// 7. DRAWER DE PERFIL, CONFIGURAÇÕES, SOM, TEMA, LGPD E ADMIN
// ===================================================================
function criarDrawerPerfilConfig() {
  if (document.getElementById('nasa-profile-drawer-backdrop')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'nasa-profile-drawer-backdrop';
  backdrop.onclick = (e) => {
    if (e.target === backdrop) fecharDrawerPerfil();
  };

  backdrop.innerHTML = `
    <div class="nasa-profile-sheet" role="dialog" aria-label="Menu de Conta e Configurações">
      <div class="nasa-sheet-handle"></div>

      <!-- Cabeçalho do Usuário -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div id="drawer-user-avatar" class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black text-lg flex items-center justify-center shadow">
            👤
          </div>
          <div>
            <div id="drawer-user-name" class="text-sm font-black text-white">Visitante</div>
            <div id="drawer-user-email" class="text-xs text-slate-400">Modo gratuito</div>
          </div>
        </div>
        <button type="button" onclick="fecharDrawerPerfil()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">✕</button>
      </div>

      <!-- Ações de Conta e Assinatura -->
      <div class="grid grid-cols-2 gap-2 my-3">
        <button type="button" id="drawer-btn-auth" onclick="fecharDrawerPerfil(); abrirModalAuthOuPerfil();" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5">
          <span id="drawer-txt-auth">Entrar / Criar Conta</span>
        </button>
        <button type="button" onclick="fecharDrawerPerfil(); abrirModalPaywall('drawer');" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow">
          <span>Planos VIP PRO</span>
        </button>
      </div>

      <!-- SELETOR DE MODO DE EXPERIÊNCIA NO DRAWER -->
      <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 my-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white flex items-center gap-1.5">
            Modo de Experiência
          </span>
          <span id="drawer-modo-badge" class="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Estrategista
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1.5 pt-1">
          <button type="button" onclick="selecionarModoExperiencia('rapido'); fecharDrawerPerfil();" class="p-2 rounded-xl border border-slate-800 hover:border-amber-500 bg-slate-900 text-center transition active:scale-95">
            <span class="text-[10px] font-bold text-slate-300 block mt-0.5">Rápido</span>
          </button>
          <button type="button" onclick="selecionarModoExperiencia('estrategista'); fecharDrawerPerfil();" class="p-2 rounded-xl border border-slate-800 hover:border-emerald-500 bg-slate-900 text-center transition active:scale-95">
            <span class="text-[10px] font-bold text-slate-300 block mt-0.5">Volante</span>
          </button>
          <button type="button" onclick="selecionarModoExperiencia('cientifico'); fecharDrawerPerfil();" class="p-2 rounded-xl border border-slate-800 hover:border-cyan-500 bg-slate-900 text-center transition active:scale-95">
            <span class="text-[10px] font-bold text-slate-300 block mt-0.5">Científico</span>
          </button>
        </div>
      </div>

      <!-- Preferências Rápidas: Som, Tema e Atualizar Caixa -->
      <div class="space-y-2 pt-2 border-t border-slate-800">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Ajustes do Aplicativo</span>
        <div class="grid grid-cols-3 gap-2">
          
          <button type="button" onclick="alternarAudio(); atualizarDadosDrawer();" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 flex flex-col items-center gap-1">
            <span id="drawer-audio-icon" class="text-base">🔊</span>
            <span>Sons</span>
          </button>
          <button type="button" onclick="fecharDrawerPerfil(); sincronizarConcursos();" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 flex flex-col items-center gap-1">
            <span>Sincronizar</span>
          </button>
        </div>
        <button type="button" onclick="fecharDrawerPerfil(); forcarAtualizacaoPWA();" class="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition">
          <span>Forçar Atualização (Limpar Cache)</span>
        </button>
      </div>

      <!-- Botão Painel Admin (visível apenas para o fundador/admin) -->
      <div id="drawer-admin-row" class="hidden pt-3">
        <button type="button" onclick="fecharDrawerPerfil(); mudarAba('admin');" class="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center justify-center gap-2">
          <span>Abrir Painel Administrativo (CEO)</span>
        </button>
      </div>

      <!-- Canal dos Testadores e Atendimento -->
      <div class="space-y-1.5 pt-3 mt-3 border-t border-slate-800">
        <span class="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">Canal dos Testadores & Suporte</span>

        <button type="button" onclick="fecharDrawerPerfil(); if (typeof window.abrirModalFeedbackTestador === 'function') { window.abrirModalFeedbackTestador(); } else { toast('Abrindo...', '⭐'); }" class="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/30 hover:bg-slate-900 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center justify-between text-left transition shadow">
          <div class="flex items-center gap-2">
            <div>
              <div class="text-white font-black text-xs">Avaliar App & Sugerir Melhorias</div>
              <div class="text-[10px] text-amber-400/90 font-sans font-normal">Sua opinião como testador é fundamental</div>
            </div>
          </div>
          <span class="text-amber-400 text-xs font-bold">Avaliar →</span>
        </button>

        <button type="button" onclick="fecharDrawerPerfil(); const t = 'Olá Meu Volante PRO! Gostaria de registrar números na minha carteira / tirar uma dúvida:'; if (typeof window.abrirWhatsApp === 'function') { window.abrirWhatsApp({ texto: t }); } else { window.location.href = 'whatsapp://send?text=' + encodeURIComponent(t); }" class="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-emerald-500/40 text-xs font-bold text-white flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <div>
              <div class="text-emerald-400 font-black text-xs">Envie seus números pelo WhatsApp</div>
              <div class="text-[10px] text-slate-400 font-sans font-normal">Envie seus números ou fotos de bilhetes</div>
            </div>
          </div>
          <span class="text-emerald-400 text-[10px] font-bold">Abrir ↗</span>
        </button>
      </div>

      <!-- Links Institucionais: Mestres da Loteria, Jurídico & LGPD -->
      <div class="space-y-1.5 pt-3 mt-3 border-t border-slate-800">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Conhecimento & Legal</span>
        
        

        <button type="button" onclick="fecharDrawerPerfil(); abrirModalTermosLGPD('termos');" class="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>Termos de Uso & Isenção de Ganho (CDC)</span>
          </div>
          <span class="text-slate-500 text-[10px]">Ver →</span>
        </button>

        <button type="button" onclick="fecharDrawerPerfil(); abrirModalTermosLGPD('lgpd');" class="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>Privacidade & Proteção de Dados (LGPD)</span>
          </div>
          <span class="text-slate-500 text-[10px]">Ver →</span>
        </button>

        <button type="button" onclick="fecharDrawerPerfil(); abrirModalTermosLGPD('direitos');" class="w-full p-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-xs font-bold text-rose-300 flex items-center justify-between text-left transition">
          <div class="flex items-center gap-2">
            <span>Meus Dados / Exclusão de Conta (Art. 18)</span>
          </div>
          <span class="text-rose-500 text-[10px]">Gerenciar →</span>
        </button>

        <div class="text-[10px] text-slate-500 text-center pt-2 font-mono">
          <span>🔞 +18 • Aposte com responsabilidade • Meu Volante PRO v3.2</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
}

function abrirModalMestresLoteria() {
  if (typeof tocarBeep === 'function') tocarBeep('click');
  const m = document.getElementById('modal-mestres-loteria');
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}

function fecharModalMestresLoteria() {
  const m = document.getElementById('modal-mestres-loteria');
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}
window.abrirModalMestresLoteria = abrirModalMestresLoteria;
window.fecharModalMestresLoteria = fecharModalMestresLoteria;

function abrirDrawerPerfil() {
  if (typeof tocarBeep === 'function') tocarBeep('click');
  atualizarDadosDrawer();
  const backdrop = document.getElementById('nasa-profile-drawer-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

function fecharDrawerPerfil() {
  const backdrop = document.getElementById('nasa-profile-drawer-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function atualizarDadosDrawer() {
  const nameEl = document.getElementById('drawer-user-name');
  const emailEl = document.getElementById('drawer-user-email');
  const avatarEl = document.getElementById('drawer-user-avatar');
  const txtAuth = document.getElementById('drawer-txt-auth');
  const adminRow = document.getElementById('drawer-admin-row');
  const themeIcon = document.getElementById('drawer-theme-icon');
  const audioIcon = document.getElementById('drawer-audio-icon');

  if (typeof usuarioSessao !== 'undefined' && usuarioSessao) {
    if (nameEl) nameEl.innerText = usuarioSessao.nome || 'Visitante';
    if (emailEl) {
      emailEl.innerText = usuarioSessao.tipo === 'visitante'
        ? 'Sem conta conectada'
        : (usuarioSessao.email || 'Conta conectada');
    }
    if (avatarEl) {
      avatarEl.innerText = usuarioSessao.tipo === 'master_founder'
        ? '👑'
        : ((usuarioSessao.nome?.[0] || '👤').toUpperCase());
    }
    if (txtAuth) {
      txtAuth.innerText = usuarioSessao.tipo === 'visitante' ? 'Entrar / Criar Conta' : 'Gerenciar / Sair';
    }
    if (adminRow) {
      adminRow.classList.toggle('hidden', usuarioSessao.tipo !== 'master_founder');
    }
  }

  if (themeIcon) {
    themeIcon.innerText = document.documentElement.classList.contains('dark') ? '🌙' : '☀️';
  }
  if (audioIcon && typeof audioAtivo !== 'undefined') {
    audioIcon.innerText = audioAtivo ? '🔊' : '🔇';
  }
}

// ===================================================================
// 8. INTEGRAÇÃO COM AS FUNÇÕES LEGADAS DO INDEX.HTML
// ===================================================================
function interceptarFuncoesLegadas() {
  // 1. Sincroniza mudarAba('volante' | 'fechamentos' | 'calor' | 'carteira' | 'bolao' | 'admin') com a Bottom Tab Bar
  const mudarAbaOriginal = window.mudarAba;
  if (typeof mudarAbaOriginal === 'function') {
    window.mudarAba = function (aba) {
      if (aba === 'bolao') {
        activateTab('carteira');
        alternarSubAbaCarteira('bolao');
        return;
      }
      if (aba === 'admin') {
        mudarAbaOriginal('admin');
        const allViews = document.querySelectorAll('main > section');
        allViews.forEach((v) => {
          v.classList.remove('active');
          v.style.display = 'none';
        });
        const adminView = document.getElementById('view-admin');
        if (adminView) {
          adminView.classList.remove('hidden');
          adminView.classList.add('active');
          adminView.style.display = 'block';
        }
        return;
      }

      const mapAbaToTab = {
        inicio: 'home',
        volante: 'gerar',
        fechamentos: 'fechamentos',
        calor: 'analise',
        carteira: 'carteira'
      };
      const tabId = mapAbaToTab[aba] || 'home';
      activateTab(tabId);
    };
  }

  // 2. Sincroniza trocarModalidade('megasena' | 'lotofacil') com o Pill Switcher Global
  const trocarModalidadeOriginal = window.trocarModalidade;
  if (typeof trocarModalidadeOriginal === 'function') {
    window.trocarModalidade = function (mod) {
      trocarModalidadeOriginal(mod);
      sincronizarVisualModalidadeGlobal();
    };
  }

  // 3. Sincroniza atualizarVisualPlano() e atualizarPerfilUsuarioUI() com o Header novo
  const atualizarVisualPlanoOriginal = window.atualizarVisualPlano;
  if (typeof atualizarVisualPlanoOriginal === 'function') {
    window.atualizarVisualPlano = function () {
      atualizarVisualPlanoOriginal();
      sincronizarHeaderStatusUsuario();
      const promoHome = document.getElementById('home-promo-pro-card');
      if (promoHome) {
        const ehPro = (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro') ||
                      (typeof usuarioSessao !== 'undefined' && usuarioSessao?.tipo === 'master_founder');
        promoHome.style.display = ehPro ? 'none' : 'flex';
      }
    };
  }

  const atualizarPerfilOriginal = window.atualizarPerfilUsuarioUI;
  if (typeof atualizarPerfilOriginal === 'function') {
    window.atualizarPerfilUsuarioUI = function () {
      atualizarPerfilOriginal();
      sincronizarHeaderStatusUsuario();
    };
  }

  // 4. Atualiza o contador "6/6" no botão da sub-aba de Testes sempre que o jogo muda
  const executarAnaliseOriginal = window.executarAnaliseDinamicaDoJogo;
  if (typeof executarAnaliseOriginal === 'function') {
    window.executarAnaliseDinamicaDoJogo = function () {
      executarAnaliseOriginal();
      const badgeTotal = document.getElementById('badge-total-testes-ok');
      const segBadge = document.getElementById('seg-badge-testes-count');
      if (badgeTotal && segBadge) {
        const match = badgeTotal.innerText.match(/(\d+)\s*de\s*6/);
        segBadge.innerText = match ? `${match[1]}/6` : '6/6';
      }
    };
  }

  // 5. No Volante mobile, respeita a classe classic-10x6 se o usuário escolheu
  const renderizarVolanteOriginal = window.renderizarVolante;
  if (typeof renderizarVolanteOriginal === 'function') {
    window.renderizarVolante = function () {
      renderizarVolanteOriginal();
      const grid = document.getElementById('volante-grid');
      if (grid && volanteModo10Colunas) {
        grid.classList.add('classic-10x6');
      }
    };
  }
}

// ===================================================================
// 9. NAVEGAÇÃO ENTRE AS 5 ABAS PRINCIPAIS
// ===================================================================
function atualizarResumoHome(totalBilhetes, totalInvestido) {
  document.querySelectorAll('.js-progresso-bilhetes').forEach((el) => {
    el.innerText = totalBilhetes;
  });
  document.querySelectorAll('.js-progresso-investimento').forEach((el) => {
    el.innerText = totalInvestido.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  });
}

function activateTab(tabId) {
  document.body.setAttribute('data-active-tab', tabId);

  TABS_CONFIG.forEach((tab) => {
    const btn = document.getElementById(`bottom-nav-${tab.id}`);
    if (btn) {
      btn.classList.toggle('active', tab.id === tabId);
    }
  });

  document.querySelectorAll('.nasa-desktop-nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.sidebar-nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  const allViews = document.querySelectorAll('main > section');
  allViews.forEach((view) => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  const tabConfig = TABS_CONFIG.find((t) => t.id === tabId);
  if (!tabConfig) return;

  if (typeof abaAtual !== 'undefined') {
    abaAtual = tabConfig.legacyAba;
  }

  const targetView = document.getElementById(tabConfig.view);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.add('active');
    targetView.style.display = 'block';
  }

  // Atualiza os dados específicos da aba aberta
  if (tabId === 'home') {
    atualizarUltimoResultadoHome();
  } else if (tabId === 'gerar') {
    aplicarVisibilidadeSubAbaGerar();
  } else if (tabId === 'fechamentos' && typeof carregarOpcoesFechamento === 'function') {
    carregarOpcoesFechamento();
  } else if (tabId === 'analise') {
    if (typeof renderizarMapaCalor === 'function') renderizarMapaCalor();
    aplicarVisibilidadeSubAbaCalor();
  } else if (tabId === 'carteira') {
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof calcularRateioBolao === 'function') calcularRateioBolao();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupTabNavigation() {
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1': e.preventDefault(); activateTab('home'); break;
        case '2': e.preventDefault(); activateTab('gerar'); break;
        case '3': e.preventDefault(); activateTab('fechamentos'); break;
        case '4': e.preventDefault(); activateTab('analise'); break;
        case '5': e.preventDefault(); activateTab('carteira'); break;
      }
    }
  });
}

function getActiveTab() {
  return TABS_CONFIG.find((tab) =>
    document.getElementById(`bottom-nav-${tab.id}`)?.classList.contains('active')
  )?.id || 'home';
}

function navigateTo(tabId) {
  activateTab(tabId);
}



function atualizarProvaDosFatosRedesign() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const base = mod === 'megasena'
    ? (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : [])
    : (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []);

  const containerLista = document.getElementById('home-lista-ultimos-sorteios-avaliados');
  const badgePct = document.getElementById('badge-pct-aprovados-home');
  const resumoEl = document.getElementById('home-prova-fatos-resumo');
  const apostasAtivasEl = document.getElementById('home-apostas-ativas-conteudo');

  // 1. Atualizar resumo de apostas ativas da carteira
  if (apostasAtivasEl) {
    const bilhetes = Array.isArray(carteiraJogos) ? carteiraJogos : [];
    const ehPassadoFn = typeof window.concursoOuDataEhPassado === 'function'
      ? window.concursoOuDataEhPassado
      : () => false;

    const ativos = bilhetes.filter(b => {
      if (b.modalidade !== mod) return false;
      if (b.conferido) return false;
      if (ehPassadoFn(b.concursoAlvo || b.concurso, b.data, b.modalidade)) return false;
      return true;
    });

    if (ativos.length > 0) {
      apostasAtivasEl.innerHTML = `
        <div class="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
          <span class="text-emerald-300 font-bold font-mono text-[11px]">🎯 ${ativos.length} aposta${ativos.length > 1 ? 's' : ''} ativa${ativos.length > 1 ? 's' : ''} em monitoramento</span>
          <span class="text-[10px] text-cyan-300 font-mono font-bold">${ativos[0].concursoAlvo || 'Próximo'}</span>
        </div>
      `;
    } else {
      const totalMod = bilhetes.filter(b => b.modalidade === mod).length;
      if (totalMod > 0) {
        apostasAtivasEl.innerHTML = `
          <div class="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span class="text-[11px] text-slate-400 font-mono">0 ativas • ${totalMod} aposta(s) apurada(s) no histórico</span>
            <button type="button" onclick="irParaCarteiraSubAba('bilhetes')" class="text-cyan-400 text-[10px] font-bold hover:underline">Ver Histórico →</button>
          </div>
        `;
      } else {
        apostasAtivasEl.innerHTML = `<span class="text-[11px] text-slate-400">Nenhuma aposta ativa registrada ainda. Gere seu jogo e toque em <b>Salvar este jogo</b></span>`;
      }
    }
  }

  if (!containerLista) return;

  const ultimos10 = base.slice(0, 10);
  if (ultimos10.length === 0) {
    if (containerLista) containerLista.innerHTML = `<div class="text-center py-2 text-xs text-slate-400">Sincronizando concursos oficiais com a Caixa...</div>`;
    return;
  }

  let aprovadosCount = 0;
  const cardsHtml = ultimos10.map((c) => {
    const ordenado = [...c.dezenas].sort((a,b) => a - b);
    const avaliacao = typeof avaliarJogo === 'function' ? avaliarJogo(ordenado, mod) : { score: null, aprovadosCount: 0 };
    if (avaliacao.aprovadosCount >= 5) aprovadosCount++;

    const bolinhasHtml = ordenado.map(d => `
      <span class="w-5 h-5 rounded-md ${mod === 'megasena' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'} font-black text-[9px] flex items-center justify-center font-mono">
        ${String(d).padStart(2, '0')}
      </span>
    `).join('');

    return `
      <div class="group p-2.5 rounded-2xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/60 cursor-pointer active:scale-[0.98] transition flex items-center justify-between gap-2 shadow-sm"
           onclick="carregarConcursoHistoricoNoVolante(${c.concurso}, '${mod}')"
           title="Toque para carregar o Concurso #${c.concurso} no Volante e ver os 6 testes">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-slate-900 dark:text-white text-[11px] font-mono">#${c.concurso}</span>
            <span class="text-[9px] text-slate-500 dark:text-slate-400 font-mono">${c.data || ''}</span>
            <span class="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-800/60 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
              🎯 Testar no Volante ↗
            </span>
          </div>
          <div class="flex flex-wrap gap-0.5">
            ${bolinhasHtml}
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-[10px] font-black text-cyan-600 dark:text-cyan-400 font-mono">Nota ${avaliacao.score}/100</div>
          <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">✓ ${avaliacao.aprovadosCount}/6 OK</span>
        </div>
      </div>
        </div>
      </div>
    `;
  }).join('');

  const pct = Math.round((aprovadosCount / ultimos10.length) * 100);
  if (badgePct) badgePct.innerText = '';
  if (resumoEl) {
    resumoEl.innerText = `${pct}% dos últimos 10 sorteios oficiais da Caixa atenderam aos 6 filtros orbitais de calibração estatística (toque em qualquer um para auditar no Volante):`;
  }
  if (containerLista) containerLista.innerHTML = cardsHtml;
}

/**
 * Carrega qualquer concurso do histórico diretamente no Volante e aciona a bateria de 6 testes
 */
function carregarConcursoHistoricoNoVolante(numConcurso, modDesejada) {
  const mod = modDesejada || (typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena');
  if (typeof trocarModalidade === 'function' && typeof modalidadeAtual !== 'undefined' && modalidadeAtual !== mod) {
    trocarModalidade(mod);
  }

  const base = mod === 'megasena'
    ? (window.baseConcursosMega || (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : []))
    : (window.baseConcursosLoto || (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []));

  const conc = base.find((c) => Number(c.concurso) === Number(numConcurso));
  if (!conc) {
    if (typeof toast === 'function') toast(`Concurso #${numConcurso} não localizado.`, '⚠️');
    return;
  }

  const dezenas = [...conc.dezenas].sort((a, b) => a - b);
  if (typeof setJogoAtual === 'function') setJogoAtual(dezenas);
  if (typeof atualizarDisplayJogo === 'function') atualizarDisplayJogo();
  if (typeof renderizarVolante === 'function') renderizarVolante();
  if (typeof executarAnaliseDinamicaDoJogo === 'function') executarAnaliseDinamicaDoJogo();
  if (typeof executarAnaliseVitorio === 'function') executarAnaliseVitorio();

  // Navega para a tela 'Gerar' (Volante)
  if (typeof activateTab === 'function') {
    activateTab('gerar');
  } else if (typeof mudarAba === 'function') {
    mudarAba('volante');
  }

  // Ativa a sub-aba adequada para mostrar volante e telemetria
  if (typeof alternarSubAbaGerar === 'function') {
    alternarSubAbaGerar(window.innerWidth <= 640 ? 'volante' : 'todos');
  }

  // Garante que o painel de testes e matriz estejam visíveis e expandidos
  const elBateria = document.getElementById('conteudo-bateria-testes');
  if (elBateria) {
    elBateria.classList.remove('hidden');
    const setaBateria = document.getElementById('seta-bateria-testes');
    if (setaBateria) setaBateria.innerText = '⯆';
  }
  const elMatriz = document.getElementById('conteudo-matriz-vitorio');
  if (elMatriz) {
    elMatriz.classList.remove('hidden');
    const setaMatriz = document.getElementById('seta-matriz-vitorio');
    if (setaMatriz) setaMatriz.innerText = '⯆';
  }

  if (typeof tocarBeep === 'function') tocarBeep('sucesso');
  if (typeof vibrarHaptico === 'function') vibrarHaptico(25);
  if (typeof toast === 'function') {
    toast(`🎯 Concurso #${conc.concurso} (${conc.data || ''}) carregado no Volante! Telemetria e 6 testes calculados.`, '🔬');
  }

  setTimeout(() => {
    const alvo = document.getElementById('display-meu-jogo') || document.getElementById('volante-grid');
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}
window.carregarConcursoHistoricoNoVolante = carregarConcursoHistoricoNoVolante;

// ===================================================================
// MOTOR DE PERSONALIZAÇÃO & PERFIS DE EXPERIÊNCIA DO USUÁRIO
// ===================================================================
const PERFIS_CONFIG = {
  rapido: {
    id: 'rapido',
    nome: 'Rápido & Prático',
    nomeCurto: 'Rápido',
    icon: '⚡',
    tag: '1 CLIQUE',
    cor: 'amber',
    btnLabel: 'GERAR JOGO',
    btnIcon: '⚡',
    acaoSubAba: 'rapido'
  },
  estrategista: {
    id: 'estrategista',
    nome: 'Estrategista do Volante',
    nomeCurto: 'Estrategista',
    icon: '🎯',
    tag: 'VOLANTE VIVO',
    cor: 'emerald',
    btnLabel: 'GERAR JOGO',
    btnIcon: '🎯',
    acaoSubAba: 'volante'
  },
  cientifico: {
    id: 'cientifico',
    nome: 'Científico & Auditor',
    nomeCurto: 'Científico',
    icon: '🔬',
    tag: 'DETALHADO',
    cor: 'cyan',
    btnLabel: 'GERAR JOGO',
    btnIcon: '🔬',
    acaoSubAba: 'todos'
  }
};

let modoExperienciaAtual = 'estrategista';
let palpiteExpressAtual = null;

function obterPerfilExperienciaSalvo() {
  try {
    return localStorage.getItem('nasa_perfil_experiencia') || 'estrategista';
  } catch (_) {
    return 'estrategista';
  }
}

function inicializarPerfilExperiencia() {
  const salvo = obterPerfilExperienciaSalvo();
  aplicarPerfilModo(salvo, { silencioso: true });

  // Gera o primeiro palpite express do dia na Home
  setTimeout(() => {
    gerarPalpiteExpressHome({ silencioso: true });
  }, 350);

  // Se nunca definiu seu perfil, convida com modal sutil após 1.5s
  if (!localStorage.getItem('nasa_perfil_experiencia_definido')) {
    setTimeout(() => {
      abrirModalSeletorPerfil({ onboarding: true });
    }, 1500);
  }
}

function aplicarPerfilModo(modoId, { silencioso = false } = {}) {
  const config = PERFIS_CONFIG[modoId] || PERFIS_CONFIG.estrategista;
  modoExperienciaAtual = config.id;
  try {
    localStorage.setItem('nasa_perfil_experiencia', config.id);
    localStorage.setItem('nasa_perfil_experiencia_definido', 'true');
  } catch (_) {}

  document.documentElement.setAttribute('data-modo-perfil', config.id);
  document.body.setAttribute('data-modo-perfil', config.id);

  // Sincroniza chips em topbar, sidebar e drawer
  document.querySelectorAll('.nasa-modo-chip').forEach((chip) => {
    chip.setAttribute('data-modo', config.id);
    const icon = chip.querySelector('.nasa-modo-icon');
    const label = chip.querySelector('.nasa-modo-label');
    if (icon) icon.innerText = config.icon;
    if (label) label.innerText = config.nomeCurto;
  });

  // Sincroniza botões do seletor segmentado no Hero Card da Home
  const btnRapido = document.getElementById('home-modo-btn-rapido');
  const btnEstrategista = document.getElementById('home-modo-btn-estrategista');
  const btnCientifico = document.getElementById('home-modo-btn-cientifico');
  if (btnRapido && btnEstrategista && btnCientifico) {
    btnRapido.className = `nasa-hero-modo-pill ${config.id === 'rapido' ? 'active-modo-rapido active' : ''}`;
    btnEstrategista.className = `nasa-hero-modo-pill ${config.id === 'estrategista' ? 'active-modo-estrategista active' : ''}`;
    btnCientifico.className = `nasa-hero-modo-pill ${config.id === 'cientifico' ? 'active-modo-cientifico active' : ''}`;
  }

  const drawerBadge = document.getElementById('drawer-modo-badge');
  if (drawerBadge) {
    drawerBadge.innerText = config.nomeCurto;
    drawerBadge.className = `text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-${config.cor}-950 text-${config.cor}-300 border border-${config.cor}-800`;
  }

  // Atualiza botão Hero na Home
  const heroBtnIcon = document.getElementById('home-hero-btn-icon');
  const heroBtnLabel = document.getElementById('home-hero-btn-label');
  if (heroBtnIcon) heroBtnIcon.hidden = true;
  if (heroBtnLabel) heroBtnLabel.innerText = config.btnLabel;

  // Ajusta a sub-aba na tela Gerar
  if (typeof subAbaGerarAtiva !== 'undefined') {
    subAbaGerarAtiva = config.acaoSubAba;
    if (typeof aplicarVisibilidadeSubAbaGerar === 'function') {
      aplicarVisibilidadeSubAbaGerar();
    }
  }

  if (!silencioso) {
    if (typeof tocarBeep === 'function') tocarBeep('sucesso');
    if (typeof vibrarHaptico === 'function') vibrarHaptico(20);
    if (typeof toast === 'function') {
      toast(`${config.icon} Modo ${config.nome} ativado!`, '🧭');
    }
  }
}

function selecionarModoExperiencia(modoId) {
  aplicarPerfilModo(modoId);
  fecharModalSeletorPerfil();
}

function abrirModalSeletorPerfil({ onboarding = false } = {}) {
  let modal = document.getElementById('nasa-modal-perfil-experiencia');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'nasa-modal-perfil-experiencia';
  modal.className = 'fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-5';
  modal.onclick = (e) => {
    if (e.target === modal) fecharModalSeletorPerfil();
  };

  const modoAtivo = obterPerfilExperienciaSalvo();

  modal.innerHTML = `
    <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-800/80 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 font-sans relative">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div class="flex items-center gap-2">
          <div>
            <h3 class="text-sm sm:text-base font-black text-white uppercase tracking-wide">Modo de Experiência</h3>
            <p class="text-[11px] text-cyan-400 font-mono">Como você prefere usar o Meu Volante PRO?</p>
          </div>
        </div>
        <button type="button" onclick="fecharModalSeletorPerfil()" class="text-slate-400 hover:text-white text-lg font-bold p-1">✕</button>
      </div>

      <div class="space-y-2.5">
        <!-- 1. MODO RÁPIDO -->
        <div onclick="selecionarModoExperiencia('rapido')" class="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border ${modoAtivo === 'rapido' ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50' : 'border-amber-500/30'} cursor-pointer transition active:scale-[0.98] space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-white">Rápido & Prático</span>
            </div>
            <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">1 CLIQUE</span>
          </div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Jogos gerados automaticamente na Início, sem fórmulas. Perfeito para jogar em 5 segundos.
          </p>
        </div>

        <!-- 2. MODO ESTRATEGISTA -->
        <div onclick="selecionarModoExperiencia('estrategista')" class="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border ${modoAtivo === 'estrategista' ? 'border-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-400/50' : 'border-emerald-500/30'} cursor-pointer transition active:scale-[0.98] space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-white">Estrategista do Volante</span>
            </div>
            <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">VOLANTE VIVO</span>
          </div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Volante manual no topo, Matriz 4x4 reagindo em tempo real a cada toque (linhas, colunas, área) e resumo dos indicadores.
          </p>
        </div>

        <!-- 3. MODO CIENTÍFICO -->
        <div onclick="selecionarModoExperiencia('cientifico')" class="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border ${modoAtivo === 'cientifico' ? 'border-cyan-400 bg-cyan-950/20 ring-1 ring-cyan-400/50' : 'border-cyan-500/30'} cursor-pointer transition active:scale-[0.98] space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-white">Científico & Auditor</span>
            </div>
            <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">TELEMETRIA TOTAL</span>
          </div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Últimos sorteios da Caixa e os 6 indicadores do jogo abertos e detalhados.
          </p>
        </div>
      </div>

      <div class="pt-1 text-center">
        <span class="text-[10px] text-slate-500">Alterne de modo quando quiser tocando no botão do topo.</span>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function fecharModalSeletorPerfil() {
  const modal = document.getElementById('nasa-modal-perfil-experiencia');
  if (modal) modal.remove();
}

function executarAcaoPrincipalPorModo() {
  const modo = obterPerfilExperienciaSalvo();
  if (modo === 'rapido') {
    gerarPalpiteExpressHome();
    const box = document.getElementById('home-card-palpite-rapido-box');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof toast === 'function') toast('⚡ Novo jogo gerado com sucesso!', '✨');
  } else if (modo === 'estrategista') {
    irParaVolanteManual();
  } else {
    activateTab('gerar');
    if (typeof alternarSubAbaGerar === 'function') alternarSubAbaGerar('todos');
    const alvo = document.getElementById('card-bateria-testes');
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Geração de Palpites Express (Modo Rápido)
function gerarPalpiteExpressHome({ silencioso = false } = {}) {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const k = mod === 'megasena' ? 6 : 15;
  let jogoObj = null;

  if (typeof window.gerarJogoCalibradoUnico === 'function') {
    jogoObj = window.gerarJogoCalibradoUnico(mod, k, true);
  }

  if (!jogoObj || !jogoObj.dezenas || jogoObj.dezenas.length < k) {
    const dezenasPadrao = mod === 'megasena'
      ? [2, 14, 23, 31, 40, 58]
      : [1, 3, 4, 6, 8, 9, 11, 13, 15, 17, 18, 20, 22, 23, 25];
    jogoObj = {
      dezenas: dezenasPadrao,
      analise: null
    };
  }

  palpiteExpressAtual = { ...jogoObj, modalidade: mod };
  renderizarPalpiteExpressHome();

  if (!silencioso) {
    if (typeof tocarBeep === 'function') tocarBeep('sucesso');
    if (typeof vibrarHaptico === 'function') vibrarHaptico(15);
  }
}

function renderizarPalpiteExpressHome() {
  const container = document.getElementById('home-rapido-dezenas');
  const scoreBadge = document.getElementById('home-rapido-score-badge');
  if (!container) return;

  if (!palpiteExpressAtual) {
    gerarPalpiteExpressHome({ silencioso: true });
    return;
  }

  const mod = palpiteExpressAtual.modalidade;
  const corBola = mod === 'megasena'
    ? 'bg-emerald-600 text-slate-950 border-emerald-400'
    : 'bg-purple-600 text-white border-purple-400';

  container.innerHTML = palpiteExpressAtual.dezenas.map((d) => `
    <span class="w-8 h-8 rounded-xl ${corBola} border font-mono font-black text-xs flex items-center justify-center shadow-md">
      ${String(d).padStart(2, '0')}
    </span>
  `).join('');

  if (scoreBadge) {
    scoreBadge.innerText = `NOTA ${palpiteExpressAtual.analise?.score || 99}/100`;
  }
}

function salvarPalpiteExpressHome() {
  // TRAVA DE CAPTURA DE LEAD: Ninguém salva sem se identificar (coleta de e-mail / WhatsApp)
  const naoLogado = !usuarioSessao || usuarioSessao.tipo === 'visitante' || !usuarioSessao.email;
  if (naoLogado) {
    if (typeof toast === 'function') toast('Identifique-se com E-mail ou WhatsApp para salvar o seu bilhete!', '📋');
    if (typeof tocarBeep === 'function') tocarBeep('alert');
    setTimeout(() => {
      if (typeof abrirModalAuth === 'function') abrirModalAuth();
      else if (typeof abrirModalAuthOuPerfil === 'function') abrirModalAuthOuPerfil();
    }, 300);
    return;
  }

  if (!palpiteExpressAtual || !palpiteExpressAtual.dezenas) {
    gerarPalpiteExpressHome();
  }
  const mod = palpiteExpressAtual.modalidade;
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

  let concAlvo = null, dataAlvo = null;
  const base = mod === 'megasena'
    ? (window.baseConcursosMega || (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : []))
    : (window.baseConcursosLoto || (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []));
  if (base && base.length > 0) {
    concAlvo = base[0].proximoConcurso || (base[0].concurso + 1);
    dataAlvo = base[0].dataProximo || '';
  }

  const novoBilhete = {
    id,
    modalidade: mod,
    dezenas: [...palpiteExpressAtual.dezenas].sort((a, b) => a - b),
    score: palpiteExpressAtual.analise?.score || 99,
    aprovadosCount: palpiteExpressAtual.analise?.aprovadosCount || 6,
    concurso: concAlvo || 'Próximo',
    concursoAlvo: concAlvo || 'Próximo',
    data: dataAlvo || new Date().toLocaleDateString('pt-BR'),
    dataCriacao: new Date().toISOString(),
    conferido: false
  };

  if (!Array.isArray(carteiraJogos)) carteiraJogos = [];
  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  if (typeof atualizarProvaDosFatosRedesign === 'function') atualizarProvaDosFatosRedesign();

  if (typeof tocarSomNasa === 'function') tocarSomNasa('sucesso');
  if (typeof vibrarHaptico === 'function') vibrarHaptico(30);
  if (typeof toast === 'function') {
    toast(`✅ Palpite Express salvo na Carteira! Monitoramento ativado.`, '💼');
  }
}

function copiarPalpiteExpressHome() {
  if (!palpiteExpressAtual) return;
  const txt = palpiteExpressAtual.dezenas.map((d) => String(d).padStart(2, '0')).join(' - ');
  navigator.clipboard.writeText(txt).then(() => {
    if (typeof toast === 'function') toast(`📋 Dezenas copiadas: ${txt}`, '📋');
    if (typeof tocarBeep === 'function') tocarBeep('click');
  }).catch(() => {
    if (typeof toast === 'function') toast(`Dezenas: ${txt}`, '📋');
  });
}

window.abrirModalSeletorPerfil = abrirModalSeletorPerfil;
window.fecharModalSeletorPerfil = fecharModalSeletorPerfil;
window.selecionarModoExperiencia = selecionarModoExperiencia;
window.executarAcaoPrincipalPorModo = executarAcaoPrincipalPorModo;
window.gerarPalpiteExpressHome = gerarPalpiteExpressHome;
window.salvarPalpiteExpressHome = salvarPalpiteExpressHome;
window.copiarPalpiteExpressHome = copiarPalpiteExpressHome;
window.obterPerfilExperienciaSalvo = obterPerfilExperienciaSalvo;

