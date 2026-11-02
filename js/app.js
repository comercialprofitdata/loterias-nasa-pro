    // Formatação BRL sem risco de IEEE 754
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    function formatarReais(valor) {
      return formatadorMoeda.format(valor);
    }

    // Protocolo e Utilitário Universal de Abertura do WhatsApp
    // Garante que no celular abra diretamente o aplicativo nativo (whatsapp://) e não caia na página de download
    if (typeof window.normalizarTelefoneWhatsapp !== 'function') {
      window.normalizarTelefoneWhatsapp = function(fone) {
        if (!fone) return '';
        let limpo = String(fone).replace(/\D/g, '');
        if (!limpo) return '';
        if (limpo.startsWith('0')) limpo = limpo.substring(1);
        if (limpo.length === 10 || limpo.length === 11) {
          limpo = '55' + limpo;
        }
        return limpo;
      };
    }

    if (typeof window.abrirWhatsApp !== 'function') {
      window.abrirWhatsApp = window.dispararWhatsApp = function ({ fone = '', texto = '' } = {}) {
        const foneLimpo = window.normalizarTelefoneWhatsapp(fone);
        let textoDecodificado = texto || '';
        try {
          if (typeof texto === 'string' && (texto.includes('%20') || texto.includes('%0A') || texto.includes('%2A'))) {
            textoDecodificado = decodeURIComponent(texto);
          }
        } catch (_) {
          textoDecodificado = texto;
        }
        const textoFinalEncoded = encodeURIComponent(textoDecodificado);
        const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
          || (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

        if (isMobile) {
          let deepLink = 'whatsapp://send?';
          if (foneLimpo) {
            deepLink += `phone=${foneLimpo}&`;
          }
          deepLink += `text=${textoFinalEncoded}`;
          const a = document.createElement('a');
          a.href = deepLink;
          a.rel = 'noopener';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (a.parentNode) a.parentNode.removeChild(a);
          }, 500);
          return;
        }

        let webUrl = foneLimpo
          ? `https://web.whatsapp.com/send?phone=${foneLimpo}&text=${textoFinalEncoded}`
          : `https://web.whatsapp.com/send?text=${textoFinalEncoded}`;
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      };
    }

    // Rigor Combinatório C(n, k)
    function combinacao(n, k) {
      if (k < 0 || k > n) return 0;
      if (k === 0 || k === n) return 1;
      let c = 1;
      for (let i = 1; i <= k; i++) c = (c * (n - (k - i))) / i;
      return Math.round(c);
    }

    // Configurações Oficiais das Modalidades
    const MEGA_CONFIG = {
      nome: 'Mega-Sena',
      totalNumeros: 60,
      minDezenas: 6,
      maxDezenas: 20,
      precoBase: 6.00,
      totalCombinacoes: combinacao(60, 6),
      primos: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59],
      fechamentos: [
          { id: 'mega_equilibrio_16', nome: 'Matriz de Equilíbrio (4x4 = 16 nºs)', n: 16, k: 6, jogos: 6 },
        { id: 'mega_10_4', nome: '10 Dezenas (combinações reduzidas, sem garantia)', n: 10, k: 6, jogos: 3 },
        { id: 'mega_12_4', nome: '12 Dezenas (combinações reduzidas, sem garantia)', n: 12, k: 6, jogos: 6 },
        { id: 'mega_15_4', nome: '15 Dezenas (combinações reduzidas, sem garantia)', n: 15, k: 6, jogos: 14 }
      ]
    };

    const LOTO_CONFIG = {
      nome: 'Lotofácil',
      totalNumeros: 25,
      minDezenas: 15,
      maxDezenas: 20,
      precoBase: 3.50,
      totalCombinacoes: combinacao(25, 15),
      moldura: [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25],
      miolo: [7, 8, 9, 12, 13, 14, 17, 18, 19],
      primos: [2, 3, 5, 7, 11, 13, 17, 19, 23],
      fechamentos: [
        { id: 'loto_18_14', nome: '18 Dezenas (combinações reduzidas, sem garantia)', n: 18, k: 15, jogos: 8 },
        { id: 'loto_20_13', nome: '20 Dezenas (combinações reduzidas, sem garantia)', n: 20, k: 15, jogos: 12 }
      ]
    };

    // Estado da Aplicação
    let modalidadeAtual = 'megasena';
    let modoToque = 'normal';
    let abaAtual = 'volante';
    let qtdDesejadaMega = 6;
    let qtdDesejadaLoto = 15;
    let qtdApostasDesejada = 3;
    let loteApostasGeradas = [];
    let loteDetalhesAbertos = {};
    let carteiraDetalhesAbertos = {};
    let jogoAuditoriaAtivo = null;
    let testeSequencialInterval = null;
    let audioAtivo = true;

    // Bilhete padrão de demonstração
    let meuJogoMega = [11, 15, 20, 21, 38, 48];
    let meuJogoLoto = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 22, 24, 25];
    let fixosMega = [], proibidosMega = [];
    let fixosLoto = [], proibidosLoto = [];
    let jogosFechamentoGerados = [];

    let baseConcursosMega = [];
    let baseConcursosLoto = [];
    let carteiraJogos = [];
    let modalCallback = null;

    // Sintetizador de Áudio Web Audio API
    let audioCtx = null;
    function tocarBeep(tipo = 'click') {
      if (!audioAtivo) return;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const agora = audioCtx.currentTime;
        if (tipo === 'click') {
          osc.frequency.setValueAtTime(800, agora);
          gain.gain.setValueAtTime(0.04, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.05);
          osc.start(agora);
          osc.stop(agora + 0.05);
        } else if (tipo === 'success') {
          osc.frequency.setValueAtTime(523.25, agora);
          osc.frequency.exponentialRampToValueAtTime(783.99, agora + 0.12);
          gain.gain.setValueAtTime(0.06, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);
          osc.start(agora);
          osc.stop(agora + 0.15);
        } else if (tipo === 'alert') {
          osc.frequency.setValueAtTime(300, agora);
          gain.gain.setValueAtTime(0.07, agora);
          gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.1);
          osc.start(agora);
          osc.stop(agora + 0.1);
        }
      } catch (e) {}
    }

    function alternarAudio() {
      audioAtivo = !audioAtivo;
      document.getElementById('audio-icon').innerText = audioAtivo ? '🔊' : '🔇';
      toast(audioAtivo ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados', '🔊');
    }

    function vibrarHaptico(ms = 15) {
      if ('vibrate' in navigator) navigator.vibrate(ms);
    }

    // O histórico de concursos NÃO é gerado aqui. A versão anterior fabricava
    // os concursos 2650–2796 com Math.random(), e esse histórico inventado
    // alimentava o simulador de desempenho, o mapa de calor e o ranking de
    // dezenas quentes/frias. Agora js/historico-real.js carrega os sorteios
    // oficiais do Supabase; enquanto não houver dados, as bases ficam vazias
    // e as análises informam que o histórico está indisponível.
    function gerarHistoricoInicial() {
      baseConcursosMega = [];
      baseConcursosLoto = [];

      carregarCarteiraPorUsuario();
    }

    function obterChaveStorageCarteira() {
      const email = (typeof usuarioSessao !== 'undefined' && usuarioSessao?.email)
        ? usuarioSessao.email.toLowerCase().trim()
        : (usuarioSessao?.cupomAtivo ? `vip_${usuarioSessao.cupomAtivo}` : 'visitante_anonimo');
      return `loterias_carteira_${email}`;
    }

    function carregarCarteiraPorUsuario() {
      const chave = obterChaveStorageCarteira();
      const storageCarteira = localStorage.getItem(chave);
      if (storageCarteira) {
        try { carteiraJogos = JSON.parse(storageCarteira); } catch (e) { carteiraJogos = []; }
      } else {
        // Se for o Founder e a chave antiga existir, migra com segurança
        if (chave.includes('vitorio')) {
          const leg = localStorage.getItem('loterias_carteira_db');
          if (leg) {
            try { carteiraJogos = JSON.parse(leg); } catch (e) { carteiraJogos = []; }
          } else {
            carteiraJogos = [];
          }
        } else {
          carteiraJogos = [];
        }
      }
      window.carteiraJogos = carteiraJogos;
      if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    }

    let syncNuvemTimeout = null;
    function salvarCarteiraStorage() {
      if (window.carteiraJogos && Array.isArray(window.carteiraJogos)) {
        carteiraJogos = window.carteiraJogos;
      } else {
        window.carteiraJogos = carteiraJogos;
      }
      const chave = obterChaveStorageCarteira();
      localStorage.setItem(chave, JSON.stringify(carteiraJogos));

      // Sincronização em nuvem segura com debounce (evita chamadas excessivas)
      clearTimeout(syncNuvemTimeout);
      syncNuvemTimeout = setTimeout(() => {
        if (typeof sincronizarCarteiraNuvem === 'function') {
          sincronizarCarteiraNuvem(false);
        }
      }, 1500);
    }

    function realizarLogin() {
      toast("O login seguro ainda precisa ser conectado ao servidor de autenticação.", "🔒");
      tocarBeep('alert');
    }

    function sincronizarIconesTemaUI(modo) {
      const isDark = modo === 'dark';
      // Atualiza todos os botões de tema espalhados pela interface
      const icon = document.getElementById('theme-icon');
      if (icon) icon.innerText = isDark ? '🌙' : '☀️';

      const sideIcon = document.getElementById('sidebar-icon-theme');
      const sideLbl = document.getElementById('sidebar-lbl-theme');
      if (sideIcon) sideIcon.innerText = isDark ? '☀️' : '🌙';
      if (sideLbl) sideLbl.innerText = isDark ? 'Modo Claro' : 'Modo Escuro';

      const topThemeIcon = document.getElementById('nasa-top-theme-icon');
      if (topThemeIcon) topThemeIcon.innerText = isDark ? '☀️' : '🌙';

      const drawerThemeIcon = document.getElementById('drawer-theme-icon');
      if (drawerThemeIcon) drawerThemeIcon.innerText = isDark ? '☀️' : '🌙';
    }

    function alternarTema() {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nasa_theme', 'light');
        sincronizarIconesTemaUI('light');
        toast("Modo Claro ativado!", "☀️");
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('nasa_theme', 'dark');
        sincronizarIconesTemaUI('dark');
        toast("Modo Escuro (Deep Space) ativado!", "🌙");
      }
      tocarBeep('click');
    }

    function carregarTemaSalvo() {
      const tema = localStorage.getItem('nasa_theme');
      if (tema === 'light') {
        document.documentElement.classList.remove('dark');
        sincronizarIconesTemaUI('light');
      } else {
        document.documentElement.classList.add('dark');
        sincronizarIconesTemaUI('dark');
      }
    }

    // GESTÃO DE PLANOS SAAS (FREE vs. PRO)
    // A autoridade do plano deve vir de uma sessão validada no servidor.
    let planoUsuario = 'free';

    // Existia um segundo modal de paywall (#modal-paywall-pro) com um código
    // PIX copia-e-cola FIXO no HTML, sem relação com nenhuma cobrança real.
    // O botão de confirmação já dizia "protótipo ainda não conectado" — não
    // mentia — mas o QR/copia-e-cola exibido antes disso induzia o usuário a
    // tentar pagar um código que nunca compensaria em lugar nenhum. Removido
    // esse modal e suas 5 funções de apoio; abrirModalPaywall() agora só
    // explica o motivo (toast) e abre o checkout real (js/checkout-asaas.js).
    function abrirModalPaywall(origem = 'geral') {
      const motivos = {
        multi_jogos: 'A geração simultânea de 2, 3 ou 5 apostas com verificação cruzada é exclusiva do Plano PRO.',
        carteira_limite: 'Você atingiu o limite de 2 bilhetes salvos no Plano Grátis. Faça upgrade para salvar bilhetes ilimitados.',
        lote_salvar: 'O salvamento e exportação em lote de todas as apostas requer o Plano PRO.',
        bateria_testes: 'Este indicador faz parte do plano Pro. O Plano Grátis mostra 2 dos 6 testes.',
        score_telemetria: 'O resumo dos 6 indicadores está disponível no plano Pro.'
      };

      if (origem !== 'header' && origem !== 'home' && origem !== 'drawer' && origem !== 'banner_volante' && motivos[origem]) { toast(motivos[origem], '🔒'); }
      tocarBeep('alert');

      if (typeof abrirModalUpgrade === 'function') {
        abrirModalUpgrade(origem);
      }
    }

    function atualizarVisualPlano() {
      const btnStatus = document.getElementById('btn-status-plano');
      const labelTopo = document.getElementById('label-plano-topo');
      const iconeTopo = document.getElementById('icone-plano-topo');
      const bannerCta = document.getElementById('banner-cta-pro-volante');

      if (planoUsuario === 'pro') {
        if (btnStatus) {
          btnStatus.className = 'cursor-pointer text-[9px] px-2 py-0.5 rounded font-black border transition active:scale-95 flex items-center gap-1 bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
        }
        if (iconeTopo) iconeTopo.innerText = '👑';
        if (labelTopo) labelTopo.innerText = 'PLANO PRO';
        if (bannerCta) bannerCta.classList.add('hidden');
      } else {
        if (btnStatus) {
          btnStatus.className = 'cursor-pointer text-[9px] px-2 py-0.5 rounded font-black border transition active:scale-95 flex items-center gap-1 bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)] animate-pulse';
        }
        if (iconeTopo) iconeTopo.innerText = '⚡';
        if (labelTopo) labelTopo.innerText = 'FREE • SEJA PRO';
        if (bannerCta) bannerCta.classList.remove('hidden');
      }

      [2, 3, 5].forEach(q => {
        const selo = document.getElementById(`selo-pro-qtd-${q}`);
        if (selo) selo.style.display = planoUsuario === 'pro' ? 'none' : 'inline-block';
      });
    }

    window.addEventListener('DOMContentLoaded', () => {

      // Limpeza imediata de cache de dados fakes em celulares que abriram o app anteriormente
      try {
        const cacheAdmin = localStorage.getItem('loterias_nasa_admin_users');
        if (cacheAdmin && (cacheAdmin.includes('admin@example.invalid') || cacheAdmin.includes('carlos.ed@gmail.com'))) {
          localStorage.removeItem('loterias_nasa_admin_users');
        }
      } catch (_) {}

      carregarTemaSalvo();
      carregarUsuarioSalvo();
      restaurarSessaoSupabase();
      const configSupabase = window.NASA_SUPABASE_CONFIG;
      const botaoGoogle = document.getElementById('btn-auth-google');
      if (botaoGoogle && !configSupabase?.googleEnabled) {
        botaoGoogle.classList.add('hidden');
      }
      atualizarVisualPlano();
      
      const hojeIso = new Date().toISOString().slice(0, 10);
      const inputDataAlvo = document.getElementById('input-data-jogo-alvo');
      const inputImportData = document.getElementById('input-import-data');
      if (inputDataAlvo) inputDataAlvo.value = hojeIso;
      if (inputImportData) inputImportData.value = hojeIso;

      gerarHistoricoInicial();
      renderizarTelaCompleta();

      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('aba')) {
          setTimeout(() => mudarAba(params.get('aba')), 200);
        } else if (window.location.hash && window.location.hash.length > 1) {
          setTimeout(() => mudarAba(window.location.hash.substring(1)), 200);
        } else {
          mudarAba('inicio');
        }
      } catch(e) {
        mudarAba('inicio');
      }

      // Registrar Service Worker com Verificação Imediata de Atualizações
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js?v=20261102.9', { scope: './' })
          .then((reg) => {
            console.log('[Meu Volante PRO] Service Worker registrado. Verificando atualizações...');
            reg.update(); // força verificação no servidor imediatamente
            reg.onupdatefound = () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.onstatechange = () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[Meu Volante PRO] Nova versão instalada pelo navegador.');
                    if (typeof toast === 'function') toast('Nova versão instalada! Recarregando...', '🔄');
                    setTimeout(() => window.location.reload(), 800);
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[Meu Volante PRO] Falha ao registrar Service Worker:', err);
          });
      }
    });

    window.forcarAtualizacaoPWA = async function () {
      if (typeof toast === 'function') toast('Limpando cache e forçando atualização...', '🔄');
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        localStorage.removeItem('loterias_nasa_historico_v2');
      } catch (e) {
        console.warn('Erro ao limpar cache:', e);
      }
      window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
    };

    function trocarModalidade(mod) {
      modalidadeAtual = mod;
      tocarBeep('click');
      const btnMega = document.getElementById('btn-mod-mega');
      const btnLoto = document.getElementById('btn-mod-loto');
      const labelTopo = document.getElementById('modalidade-label');

      if (mod === 'megasena') {
        btnMega.className = 'px-3 py-1 rounded-lg text-xs font-black transition bg-emerald-600 text-slate-950 shadow';
        btnLoto.className = 'px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';
        labelTopo.className = 'text-xs font-black uppercase tracking-wider text-emerald-400 block font-mono';
        labelTopo.innerText = '🎯 MEGA-SENA ANALYTICS';
      
      carregarOpcoesFechamento();
    } else {
        btnLoto.className = 'px-3 py-1 rounded-lg text-xs font-black transition bg-purple-600 text-white shadow';
        btnMega.className = 'px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';
        labelTopo.className = 'text-xs font-black uppercase tracking-wider text-purple-400 block font-mono';
        labelTopo.innerText = '🟣 LOTOFÁCIL ANALYTICS';
      }

      renderizarTelaCompleta();
      // Toast redundante removido
    }

    function getJogoAtual() { return modalidadeAtual === 'megasena' ? meuJogoMega : meuJogoLoto; }
    function setJogoAtual(novo) { if (modalidadeAtual === 'megasena') meuJogoMega = novo; else meuJogoLoto = novo; }
    function getFixos() { return modalidadeAtual === 'megasena' ? fixosMega : fixosLoto; }
    function getProibidos() { return modalidadeAtual === 'megasena' ? proibidosMega : proibidosLoto; }
    function getConfigAtual() { return modalidadeAtual === 'megasena' ? MEGA_CONFIG : LOTO_CONFIG; }
    function getBaseAtual() { return modalidadeAtual === 'megasena' ? baseConcursosMega : baseConcursosLoto; }

    function alternarCard(idConteudo, idSeta) {
      const conteudo = document.getElementById(idConteudo);
      const seta = document.getElementById(idSeta);
      if (!conteudo) return;
      tocarBeep('click');
      vibrarHaptico(10);
      const estaOculto = conteudo.classList.contains('hidden');
      if (estaOculto) {
        conteudo.classList.remove('hidden');
        if (seta) seta.innerText = '⯆';
      } else {
        conteudo.classList.add('hidden');
        if (seta) seta.innerText = '⯈';
      }
    }

    function setQtdJogosParaGerar(qtd) {
      if (qtd > 1 && !verificarAcessoRecursoVip('Geração de Múltiplos Jogos Simultâneos')) return;
      if (qtd > 1 && planoUsuario !== 'pro') {
        abrirModalPaywall('multi_jogos');
        return;
      }
      qtdApostasDesejada = qtd;
      tocarBeep('click');
      vibrarHaptico(15);
      [1, 2, 3, 5].forEach(q => {
        const btn = document.getElementById(`btn-qtd-jogos-${q}`);
        if (btn) {
          if (q === qtd) {
            btn.className = 'py-1 rounded-xl text-xs font-black transition bg-emerald-600 text-slate-950 shadow';
          } else {
            btn.className = 'py-1 rounded-xl text-xs font-bold transition bg-slate-950 text-slate-400 border border-slate-800 hover:text-white';
          }
        }
      });
      const lbl = document.getElementById('label-qtd-jogos-ativa');
      if (lbl) lbl.innerText = `${qtd} jogo${qtd > 1 ? 's' : ''}`;
      
      const txtBtn = document.getElementById('txt-btn-gerar-principal');
      if (txtBtn) {
        txtBtn.innerText = qtd === 1 
          ? 'GERAR APOSTA (MATRIZ 4x4 + 6 TESTES)' 
          : `GERAR ${qtd} APOSTAS (MATRIZ 4x4 + 6 TESTES)`;
      }
      toast(`Configurado para gerar ${qtd} jogo${qtd > 1 ? 's' : ''}!`, "🎯");
    }

    function renderizarAbasJogosGeradosTela1() {
      const container = document.getElementById('container-abas-jogos-gerados');
      const lista = document.getElementById('lista-abas-jogos-gerados');
      const badgeTotal = document.getElementById('badge-total-jogos-gerados');
      if (!container || !lista) return;

      if (!loteApostasGeradas || loteApostasGeradas.length <= 1) {
        container.classList.add('hidden');
        return;
      }

      container.classList.remove('hidden');
      const jogoAtualStr = getJogoAtual().join('-');

      lista.innerHTML = loteApostasGeradas.map((aposta, idx) => {
        const ativo = aposta.dezenas.join('-') === jogoAtualStr;
        const score = aposta.analise ? aposta.analise.score : 99;
        const aprovados = aposta.analise ? aposta.analise.aprovadosCount : 6;
        const estilo = ativo 
          ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-500/20' 
          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500';
        return `
          <button type="button" onclick="selecionarJogoDoLoteTela1(${idx})" class="px-2.5 py-1.5 rounded-xl border text-xs whitespace-nowrap transition flex items-center gap-1.5 ${estilo}">
            <span>Jogo ${aposta.id}</span>
          </button>
        `;
      }).join('');

      const jogoAtivoIdx = loteApostasGeradas.findIndex(a => a.dezenas.join('-') === jogoAtualStr);
      if (badgeTotal) {
        badgeTotal.innerText = `${jogoAtivoIdx !== -1 ? jogoAtivoIdx + 1 : 1} de ${loteApostasGeradas.length}`;
      }
      
      const labelJogo = document.getElementById('label-titulo-jogo-ativo');
      if (labelJogo) {
        labelJogo.innerText = `Dezenas do Jogo #${jogoAtivoIdx !== -1 ? jogoAtivoIdx + 1 : 1} ativo:`;
      }
    }

    function selecionarJogoDoLoteTela1(idx) {
      if (!loteApostasGeradas || !loteApostasGeradas[idx]) return;
      tocarBeep('click');
      vibrarHaptico(15);
      const aposta = loteApostasGeradas[idx];
      setJogoAtual([...aposta.dezenas]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      renderizarAbasJogosGeradosTela1();
      toast(`Exibindo Jogo #${aposta.id} no volante e testes!`, "🎯");
    }

    function setModoToque(modo) {
      modoToque = modo;
      tocarBeep('click');
      vibrarHaptico(15);
      ['normal', 'fixo', 'proibido'].forEach(m => {
        const btn = document.getElementById(`btn-modo-${m}`);
        if (btn) {
          if (m === modo) {
            btn.className = m === 'normal'
              ? 'px-2.5 py-1 rounded-xl bg-cyan-500 text-slate-950 font-black text-[10px] border border-cyan-300 shadow'
              : m === 'fixo'
              ? 'px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-[10px] border border-emerald-300 shadow'
              : 'px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-[10px] border border-rose-400 shadow';
          } else {
            btn.className = 'px-2.5 py-1 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold text-[10px] border border-slate-800';
          }
        }
      });
      toast(`Modo Volante: ${modo === 'normal' ? 'SELEÇÃO NORMAL' : (modo === 'fixo' ? 'FIXAR DEZENAS' : 'PROIBIR/EXCLUIR')}`, "🎯");
    }

    function limparFixosEProibidos() {
      if (modalidadeAtual === 'megasena') {
        fixosMega = [];
        proibidosMega = [];
      } else {
        fixosLoto = [];
        proibidosLoto = [];
      }
      tocarBeep('click');
      vibrarHaptico(20);
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      toast("Regras de Fixos e Proibidos limpas com sucesso!", "🧹");
    }

    function removerFixo(num) {
      const fixos = getFixos();
      const idx = fixos.indexOf(num);
      if (idx !== -1) fixos.splice(idx, 1);
      tocarBeep('click');
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      toast(`Dezena ${String(num).padStart(2,'0')} desmarcada de fixa.`, "📌");
    }

    function removerProibido(num) {
      const proibidos = getProibidos();
      const idx = proibidos.indexOf(num);
      if (idx !== -1) proibidos.splice(idx, 1);
      tocarBeep('click');
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      toast(`Dezena ${String(num).padStart(2,'0')} liberada dos proibidos!`, "🔓");
    }

    function renderizarTelaCompleta() {
      renderizarSeletoresQtd();
      atualizarControlesQtdApostas();
      renderizarOpcoesFechamento();
      renderizarVolante();
      atualizarDisplayJogo();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      renderizarLoteApostas();
      renderizarBarraJogosTesteRapido();
      if (typeof atualizarRotuloBotaoWhatsapp === 'function') atualizarRotuloBotaoWhatsapp();
      renderizarMapaCalor();
      atualizarPainelCarteira();
      calcularRateioBolao();
    }

    function renderizarSeletoresQtd() {
      const config = getConfigAtual();
      const container = document.getElementById('container-seletores-qtd');
      const labelAtiva = document.getElementById('label-qtd-ativa');
      container.innerHTML = '';

      const qtdAtiva = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;
      labelAtiva.innerText = `${qtdAtiva} números`;

      const corAtiva = modalidadeAtual === 'megasena'
        ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
        : 'bg-purple-600 text-white font-black shadow-lg shadow-purple-500/20';

      for (let q = config.minDezenas; q <= config.maxDezenas; q++) {
        const btn = document.createElement('button');
        const ativo = q === qtdAtiva;
        btn.innerText = `${q} nºs`;
        btn.className = `px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
          ativo ? corAtiva : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
        }`;
        btn.onclick = () => {
          tocarBeep('click');
          if (modalidadeAtual === 'megasena') qtdDesejadaMega = q;
          else qtdDesejadaLoto = q;
          renderizarSeletoresQtd();
          atualizarControlesQtdApostas();
          gerarMultiplasApostas(qtdApostasDesejada, false);
        };
        container.appendChild(btn);
      }
    }

    function renderizarOpcoesFechamento() {
      const config = getConfigAtual();
      const select = document.getElementById('select-tipo-fechamento');
      if (select) {
        select.innerHTML = config.fechamentos.map(f => `
          <option value="${f.id}">${f.nome} - ${f.jogos} apostas (${formatarReais(f.jogos * config.precoBase)})</option>
        `).join('');
      }
    }

    function renderizarVolante() {
      const config = getConfigAtual();
      const jogo = getJogoAtual();
      const fixos = getFixos();
      const proibidos = getProibidos();
      const grid = document.getElementById('volante-grid');
      const destacarSubgrid = document.getElementById('chk-destaque-subgrid')?.checked ?? true;
      grid.innerHTML = '';

      // Renderiza o painel de status de regras ativas
      const painelRegras = document.getElementById('painel-regras-ativas');
      if (painelRegras) {
        const chips = [];
        if (fixos.length > 0) {
          chips.push(`
            <span class="text-emerald-400 font-bold">Fixos (${fixos.length}):</span>
            ${fixos.map(f => `<button type="button" onclick="removerFixo(${f})" class="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold hover:bg-rose-950 hover:text-rose-300 transition" title="Clique para desmarcar fixo">${String(f).padStart(2,'0')} ✕</button>`).join(' ')}
          `);
        }
        if (proibidos.length > 0) {
          chips.push(`
            <span class="text-rose-400 font-bold">Proibidos (${proibidos.length}):</span>
            ${proibidos.map(p => `<button type="button" onclick="removerProibido(${p})" class="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold hover:bg-emerald-950 hover:text-emerald-300 transition" title="Clique para liberar dezena">${String(p).padStart(2,'0')} ✕</button>`).join(' ')}
          `);
        }
        painelRegras.innerHTML = chips.length > 0 
          ? chips.join('<span class="text-slate-600 mx-1">•</span>')
          : '<span class="text-[10px] text-slate-500 italic">Dica: Use "Fixar" para dezenas obrigatórias ou "Proibir" para excluir. Clique em qualquer dezena para alternar.</span>';
      }

      const linhasAtivas = new Set(jogo.map(n => Math.floor((n - 1) / 10) + 1));
      const colunasAtivas = new Set(jogo.map(n => ((n - 1) % 10) + 1));

      if (modalidadeAtual === 'megasena') {
        const qCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
        jogo.forEach(n => {
          const l = Math.floor((n - 1) / 10) + 1;
          const c = ((n - 1) % 10) + 1;
          const q = l <= 3 ? (c <= 5 ? 'Q1' : 'Q2') : (c <= 5 ? 'Q3' : 'Q4');
          qCounts[q] = (qCounts[q] || 0) + 1;
        });

        grid.className = 'grid grid-cols-10 gap-1 text-center font-mono';
        document.getElementById('volante-titulo-tipo').innerText = 'Volante Mega-Sena (1 a 60)';
        document.getElementById('legenda-volante').innerHTML = `
          <div class="legenda-quad-box q1" title="Quadrante 1 (Noroeste): Linhas 1 a 3, Colunas 1 a 5 (15 dezenas)">
            <span class="legenda-quad-title">Q1 Top-Esq</span>
            <span class="legenda-quad-count">${qCounts.Q1} no jogo</span>
          </div>
          <div class="legenda-quad-box q2" title="Quadrante 2 (Nordeste): Linhas 1 a 3, Colunas 6 a 10 (15 dezenas)">
            <span class="legenda-quad-title">Q2 Top-Dir</span>
            <span class="legenda-quad-count">${qCounts.Q2} no jogo</span>
          </div>
          <div class="legenda-quad-box q3" title="Quadrante 3 (Sudoeste): Linhas 4 a 6, Colunas 1 a 5 (15 dezenas)">
            <span class="legenda-quad-title">Q3 Base-Esq</span>
            <span class="legenda-quad-count">${qCounts.Q3} no jogo</span>
          </div>
          <div class="legenda-quad-box q4" title="Quadrante 4 (Sudeste): Linhas 4 a 6, Colunas 6 a 10 (15 dezenas)">
            <span class="legenda-quad-title">Q4 Base-Dir</span>
            <span class="legenda-quad-count">${qCounts.Q4} no jogo</span>
          </div>
        `;
      } else {
        let molduraCount = 0, mioloCount = 0;
        jogo.forEach(n => {
          const l = Math.floor((n - 1) / 5) + 1;
          const c = ((n - 1) % 5) + 1;
          const ehM = (l === 1 || l === 5 || c === 1 || c === 5);
          if (ehM) molduraCount++;
          else mioloCount++;
        });

        grid.className = 'grid grid-cols-5 gap-1.5 text-center max-w-xs mx-auto font-mono';
        document.getElementById('volante-titulo-tipo').innerText = 'Volante Lotofácil (5x5)';
        document.getElementById('legenda-volante').innerHTML = `
          <div class="col-span-2 legenda-quad-box q4" title="Moldura Externa: 16 dezenas de contorno">
            <span class="legenda-quad-title">Moldura (16 dezenas)</span>
            <span class="legenda-quad-count">${molduraCount} no jogo</span>
          </div>
          <div class="col-span-2 legenda-quad-box q2" title="Miolo Central: 9 dezenas centrais">
            <span class="legenda-quad-title">Miolo (9 dezenas)</span>
            <span class="legenda-quad-count">${mioloCount} no jogo</span>
          </div>
        `;
      }

      const ehPro = planoUsuario === 'pro' || (usuarioSessao && usuarioSessao.tipo === 'master_founder');

      // Números bloqueados a partir do 2º jogo gratuito (o 1º jogo é sempre 100% liberado)
      const numerosBloqueadosRaw = !ehPro ? localStorage.getItem('nasa_numeros_bloqueados') : null;
      const numerosBloqueados = numerosBloqueadosRaw ? new Set(JSON.parse(numerosBloqueadosRaw)) : new Set();

      for (let i = 1; i <= config.totalNumeros; i++) {
        const btn = document.createElement('button');
        const marcado = jogo.includes(i);
        const ehFixo = fixos.includes(i);
        const ehProibido = proibidos.includes(i);
        const ehNumeroBloqueado = numerosBloqueados.has(i) && marcado;
        const numStr = String(i).padStart(2, '0');

        const linhaNum = Math.floor((i - 1) / 10) + 1;
        const colNum = ((i - 1) % 10) + 1;
        const estaNoSubgrid = modalidadeAtual === 'megasena' && destacarSubgrid && linhasAtivas.has(linhaNum) && colunasAtivas.has(colNum);

        // Atribui o estilo do quadrante oficial
        let estilo = '';
        if (modalidadeAtual === 'megasena') {
          const qId = linhaNum <= 3 ? (colNum <= 5 ? 'q1' : 'q2') : (colNum <= 5 ? 'q3' : 'q4');
          estilo = `volante-quad-${qId}`;
        } else {
          const lotoLinha = Math.floor((i - 1) / 5) + 1;
          const lotoCol = ((i - 1) % 5) + 1;
          const ehMoldura = (lotoLinha === 1 || lotoLinha === 5 || lotoCol === 1 || lotoCol === 5);
          estilo = ehMoldura ? 'volante-quad-q4' : 'volante-quad-q2';
        }

        if (estaNoSubgrid && !marcado && !ehFixo && !ehProibido) {
          estilo += ' subgrid-active-cell';
        }

        if (ehFixo) estilo = 'bg-emerald-900/90 text-emerald-300 border-2 border-emerald-400 font-black shadow';
        else if (ehProibido) estilo = 'bg-rose-950/90 text-rose-400 border-2 border-rose-600 line-through opacity-60';
        else if (ehNumeroBloqueado) estilo = 'bg-amber-950/90 text-amber-300 border-2 border-amber-400 font-black scale-105 shadow-md shadow-amber-500/30';
        else if (marcado) estilo = modalidadeAtual === 'megasena' ? 'volante-marcado-mega' : 'volante-marcado-loto';

        if (ehNumeroBloqueado) {
          btn.innerHTML = `<span class="flex items-center gap-0.5">${numStr}<span class="text-[8px]">🔒</span></span>`;
          btn.title = 'Dezena bloqueada! Assine PRO para desbloquear gerações ilimitadas.';
        } else {
          btn.innerText = numStr;
        }

        btn.className = `volante-btn rounded-xl font-bold text-xs transition active:scale-90 flex items-center justify-center ${estilo}`;
        btn.onclick = () => {
          if (ehNumeroBloqueado) {
            toast('Você alcançou o limite de gerações gratuitas. Assine PRO para gerar quantas apostas quiser!', '🔒');
            abrirModalPaywall('multi_jogos');
            return;
          }
          clicarNumeroVolante(i);
        };
        grid.appendChild(btn);
      }
    }

    function clicarNumeroVolante(num) {
      tocarBeep('click');
      vibrarHaptico(12);
      const fixos = getFixos();
      const proibidos = getProibidos();
      let jogo = [...getJogoAtual()];

      if (modoToque === 'fixo') {
        if (fixos.includes(num)) {
          fixos.splice(fixos.indexOf(num), 1);
          toast(`Dezena ${String(num).padStart(2,'0')} desmarcada de fixa.`, "📌");
        } else {
          fixos.push(num);
          if (proibidos.includes(num)) proibidos.splice(proibidos.indexOf(num), 1);
          if (!jogo.includes(num)) jogo.push(num);
          toast(`Dezena ${String(num).padStart(2,'0')} fixada no bilhete!`, "📌");
        }
      } else if (modoToque === 'proibido') {
        if (proibidos.includes(num)) {
          proibidos.splice(proibidos.indexOf(num), 1);
          toast(`Dezena ${String(num).padStart(2,'0')} liberada dos proibidos!`, "🔓");
        } else {
          proibidos.push(num);
          if (fixos.includes(num)) fixos.splice(fixos.indexOf(num), 1);
          if (jogo.includes(num)) jogo = jogo.filter(n => n !== num);
          toast(`Dezena ${String(num).padStart(2,'0')} excluída/proibida!`, "🚫");
        }
      } else {
        // Modo Normal: se o usuário clicar num número proibido, desmarca ele imediatamente!
        if (proibidos.includes(num)) {
          proibidos.splice(proibidos.indexOf(num), 1);
          toast(`Dezena ${String(num).padStart(2,'0')} liberada dos proibidos!`, "🔓");
        } else if (jogo.includes(num)) {
          jogo = jogo.filter(n => n !== num);
          if (fixos.includes(num)) fixos.splice(fixos.indexOf(num), 1);
        } else {
          jogo.push(num);
        }
      }

      setJogoAtual(jogo.sort((a,b)=>a-b));
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
    }

    let jogoGratisCortesiaUsado = false;
    try {
      jogoGratisCortesiaUsado = localStorage.getItem('loterias_nasa_cortesia_usada') === 'true';
    } catch(e) {}

    function resgatarJogoGratisCortesia() {
      jogoGratisCortesiaUsado = true;
      try { localStorage.setItem('loterias_nasa_cortesia_usada', 'true'); } catch(e) {}
      atualizarDisplayJogo();
      renderizarVolante();
      toast('🎁 Jogo de Cortesia ativado! Todas as dezenas foram 100% reveladas.', '🎉');
    }

    function atualizarDisplayJogo() {
      const jogo = getJogoAtual();
      const config = getConfigAtual();
      const display = document.getElementById('display-meu-jogo');
      
      document.getElementById('qtd-selecionadas').innerText = jogo.length;
      document.getElementById('max-selecao-label').innerText = config.maxDezenas;

      display.innerHTML = '';
      if (jogo.length === 0) {
        display.innerHTML = '<span class="text-slate-500 text-xs italic px-1 font-mono">Nenhum número selecionado.</span>';
        document.getElementById('custo-jogo-selecionado').innerText = formatarReais(0);
        return;
      }

      const ehPro = planoUsuario === 'pro' || (usuarioSessao && usuarioSessao.tipo === 'master_founder');
      const numerosBloqueadosRaw = !ehPro ? localStorage.getItem('nasa_numeros_bloqueados') : null;
      const numerosBloqueados = numerosBloqueadosRaw ? new Set(JSON.parse(numerosBloqueadosRaw)) : new Set();

      jogo.forEach((num) => {
        const ehFixo = getFixos().includes(num);
        const ehNumeroBloqueado = numerosBloqueados.has(num);
        const cor = ehFixo
          ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300'
          : (modalidadeAtual === 'megasena' ? 'bg-emerald-600 text-slate-950 font-black' : 'bg-purple-600 text-white');

        if (ehNumeroBloqueado) {
          const btnVip = document.createElement('button');
          btnVip.type = 'button';
          btnVip.onclick = () => abrirModalPaywall('desbloquear_dezenas');
          btnVip.className = 'w-10 h-10 rounded-xl bg-amber-950/90 border-2 border-amber-400 text-amber-300 font-black text-[10px] flex items-center justify-center shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition font-mono cursor-pointer';
          btnVip.title = 'Dezena bloqueada! Clique para desbloquear';
          btnVip.innerHTML = '🔒';
          display.appendChild(btnVip);
        } else {
          const badge = document.createElement('button');
          badge.type = 'button';
          badge.className = `w-10 h-10 rounded-xl ${cor} font-bold text-xs flex items-center justify-center shadow-sm font-mono relative active:scale-90 transition cursor-pointer`;
          badge.title = ehFixo ? 'Dezena Fixada (toque para soltar)' : 'Toque para fixar (📌) esta dezena nos próximos sorteios';
          badge.innerHTML = ehFixo
            ? `${String(num).padStart(2, '0')}<span class="absolute -top-1 -right-1 text-[8px] leading-none">📌</span>`
            : String(num).padStart(2, '0');
          badge.onclick = () => {
            const fixos = getFixos();
            if (fixos.includes(num)) {
              fixos.splice(fixos.indexOf(num), 1);
              toast(`Dezena ${String(num).padStart(2, '0')} liberada.`, '🔓');
            } else {
              fixos.push(num);
              toast(`Dezena ${String(num).padStart(2, '0')} travada (📌) para os próximos giros!`, '📌');
            }
            tocarBeep('click');
            atualizarDisplayJogo();
            renderizarVolante();
          };
          display.appendChild(badge);
        }
      });

      if (numerosBloqueados.size > 0) {
        const banner = document.createElement('div');
        banner.className = 'w-full mt-2 p-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between gap-2 font-sans text-xs';
        banner.innerHTML = `
          <div class="text-left">
            <div class="text-amber-300 font-bold text-[11px]">🔒 ${numerosBloqueados.size} dezenas bloqueadas</div>
            <div class="text-slate-300 text-[10px]">Desbloqueie gerações ilimitadas no Plano PRO</div>
          </div>
          <button type="button" onclick="abrirModalPaywall('desbloquear_todas')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] shadow active:scale-95 transition whitespace-nowrap">
            👑 Desbloquear
          </button>
        `;
        display.appendChild(banner);
      }

      if (jogo.length >= config.minDezenas) {
        const k = modalidadeAtual === 'megasena' ? 6 : 15;
        const totalApostas = combinacao(jogo.length, k);
        const custo = totalApostas * config.precoBase;
        document.getElementById('custo-jogo-selecionado').innerText = `${formatarReais(custo)} (${totalApostas} aposta${totalApostas > 1 ? 's' : ''})`;
      } else {
        document.getElementById('custo-jogo-selecionado').innerText = `Mínimo de ${config.minDezenas} dezenas`;
      }

      verificarJogoNaCarteira(jogo, modalidadeAtual);
    }

    function verificarJogoNaCarteira(jogo, mod) {
      const container = document.getElementById('alerta-jogo-ja-jogado');
      if (!container) return;

      if (!Array.isArray(jogo) || jogo.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
      }

      const config = typeof getConfigAtual === 'function' ? getConfigAtual() : { minDezenas: mod === 'lotofacil' ? 15 : 6 };
      if (jogo.length < config.minDezenas) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
      }

      const modAtual = mod || modalidadeAtual;
      const jogosCarteira = (carteiraJogos || []).filter(b => (b.modalidade || 'megasena') === modAtual);

      if (jogosCarteira.length === 0) {
        container.innerHTML = ``;
        container.classList.remove('hidden');
        return;
      }

      const jogoSet = new Set(jogo.map(Number));
      let matchExato = null;
      let matchParcial = null;
      let maxIntersecao = 0;

      for (const b of jogosCarteira) {
        const dezB = (b.dezenas || []).map(Number);
        const intersecao = dezB.filter(d => jogoSet.has(d));
        if (dezB.length === jogo.length && intersecao.length === jogo.length) {
          matchExato = b;
          break;
        }
        if (intersecao.length > maxIntersecao) {
          maxIntersecao = intersecao.length;
          matchParcial = { bilhete: b, qtd: intersecao.length };
        }
      }

      if (matchExato) {
        const conc = matchExato.concursoAlvo || matchExato.concurso || '—';
        const acertosTxt = matchExato.acertos !== undefined ? ` • ${matchExato.acertos} acertos` : '';
        const statusTxt = matchExato.conferido ? `Apurado${acertosTxt}` : (matchExato.status || 'Registrado');
        container.innerHTML = `
          <div class="p-2.5 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-300 text-xs flex items-center justify-between gap-2 font-mono">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-base flex-shrink-0">⚠️</span>
              <div class="min-w-0">
                <div class="font-black text-amber-300 text-[11px] leading-tight">Você já jogou exatamente estas dezenas!</div>
                <div class="text-[10px] text-amber-200/90 truncate">Concurso ${conc} (${matchExato.data || '—'}) • ${statusTxt}</div>
              </div>
            </div>
            <button type="button" onclick="mudarAba('carteira'); if(typeof filtrarCarteiraBusca === 'function') { const inp = document.getElementById('input-busca-carteira'); if(inp) { inp.value='${conc}'; filtrarCarteiraBusca(inp.value); } }" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] whitespace-nowrap active:scale-95 transition flex-shrink-0 cursor-pointer">
              Ver na Carteira
            </button>
          </div>
        `;
        container.classList.remove('hidden');
        return;
      }

      // Mega-Sena: 5 de 6. Lotofácil: 13 ou 14 de 15.
      const limiarAlta = modAtual === 'megasena' ? 5 : 13;
      if (matchParcial && matchParcial.qtd >= limiarAlta) {
        const conc = matchParcial.bilhete.concursoAlvo || matchParcial.bilhete.concurso || '—';
        container.innerHTML = `
          <div class="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs flex items-center justify-between gap-2 font-mono">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm flex-shrink-0">ℹ️</span>
              <div class="text-[11px] min-w-0">
                <strong class="text-cyan-200">${matchParcial.qtd} dezenas coincidem</strong> com seu bilhete do Concurso ${conc}.
              </div>
            </div>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 font-bold flex-shrink-0">Alta Afinidade</span>
          </div>
        `;
        container.classList.remove('hidden');
        return;
      }

      container.innerHTML = `
        <div class="p-2 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center justify-between gap-2 font-mono">
          <div class="flex items-center gap-1.5">
            <span class="text-xs">✨</span>
            <span>Jogo inédito no seu histórico pessoal (${jogosCarteira.length} apostas cadastradas).</span>
          </div>
          <button type="button" onclick="mudarAba('carteira')" class="text-[9px] text-cyan-400 hover:underline">Ver Histórico</button>
        </div>
      `;
      container.classList.remove('hidden');
    }

    function limparSelecao() {
      setJogoAtual([]);
      tocarBeep('click');
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      toast("Volante limpo.", "🧹");
    }

    function setQtdApostas(qtd) {
      qtdApostasDesejada = Math.max(1, Math.min(50, parseInt(qtd) || 1));
      atualizarControlesQtdApostas();
      tocarBeep('click');
    }

    function atualizarControlesQtdApostas() {
      [1, 2, 3, 5, 10].forEach(q => {
        const btn = document.getElementById(`btn-qtd-ap-${q}`);
        if (btn) {
          const ativo = q === qtdApostasDesejada;
          const cor = modalidadeAtual === 'megasena' ? 'bg-emerald-600 text-slate-950 font-black shadow' : 'bg-purple-600 text-white font-black shadow';
          btn.className = ativo ? `flex-1 py-1 rounded-lg text-xs font-black transition ${cor}` : 'flex-1 py-1 rounded-lg text-xs font-bold transition bg-slate-950 text-slate-400 border border-slate-800 hover:text-white';
        }
      });

      const inputCustom = document.getElementById('input-qtd-apostas-custom');
      if (inputCustom) inputCustom.value = qtdApostasDesejada;

      const labelApostas = document.getElementById('label-qtd-apostas-ativa');
      if (labelApostas) {
        labelApostas.innerText = `${qtdApostasDesejada} aposta${qtdApostasDesejada > 1 ? 's' : ''}`;
      }

      const config = getConfigAtual();
      const k = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;
      const kMin = modalidadeAtual === 'megasena' ? 6 : 15;
      const combinacoes = combinacao(k, kMin);
      const custoUnitario = combinacoes * config.precoBase;
      const custoTotal = qtdApostasDesejada * custoUnitario;

      const elResumo = document.getElementById('resumo-custo-apostas');
      if (elResumo) elResumo.innerText = `(${formatarReais(custoTotal)})`;

      const txtBtnMultiplas = document.getElementById('txt-btn-gerar-multiplas');
      if (txtBtnMultiplas) {
        txtBtnMultiplas.innerText = `Gerar ${qtdApostasDesejada} Aposta${qtdApostasDesejada > 1 ? 's' : ''}`;
      }

      const txtBtnVit = document.getElementById('txt-btn-gerar-vitorio');
      if (txtBtnVit) {
        txtBtnVit.innerText = `Gerar ${qtdApostasDesejada} pela 4x4`;
      }
    }

    
    // SINTETIZADOR DE ÁUDIO WEB AUDIO API (EFEITOS DE CABINE E FOGUETE)
    function getAudioContext() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function tocarSomNasa(tipo = 'beep') {
      if (!audioAtivo) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (tipo === 'ignicao') {
          // Efeito de ignição de foguete / turbina subindo
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.35);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } else if (tipo === 'beep') {
          // Bip sci-fi de telemetria
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.06);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.14);
        } else if (tipo === 'sucesso') {
          // Bip duplo harmônico
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.05));
            gain.gain.setValueAtTime(0.15, ctx.currentTime + (idx * 0.05));
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx * 0.05) + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + (idx * 0.05));
            osc.stop(ctx.currentTime + (idx * 0.05) + 0.16);
          });
        }
      } catch (e) {
        console.warn('Áudio não inicializado:', e);
      }
    }

function gerarApostaNasaComMatriz4x4() {
      tocarSomNasa('ignicao');
      tocarBeep('success');
      vibrarHaptico(25);
      const k = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;
      
      // Gera o palpite calibrado com confinamento 4x4 de equilíbrio
      gerarMultiplasApostas(qtdApostasDesejada, true);
      renderizarAbasJogosGeradosTela1();
      
      toast(`${qtdApostasDesejada} aposta${qtdApostasDesejada > 1 ? 's' : ''} gerada${qtdApostasDesejada > 1 ? 's' : ''}!`, "🎯");
    }

function gerarPalpiteInteligente() {
      gerarMultiplasApostas(qtdApostasDesejada, false);
    }

    function gerarPalpiteVitorio() {
      gerarMultiplasApostas(qtdApostasDesejada, true);
    }

    function executarAnaliseVitorio() {
      const jogo = getJogoAtual();
      const elLinhas = document.getElementById('vit-linhas');
      const elColunas = document.getElementById('vit-colunas');
      const elArea = document.getElementById('vit-area');
      const elVazios = document.getElementById('vit-quad-vazios');
      const elBadge = document.getElementById('vit-badge-matriz');
      const elStatus = document.getElementById('vit-status-calibracao');

      if (!jogo || jogo.length < (modalidadeAtual === 'megasena' ? 6 : 15)) {
        if (elLinhas) elLinhas.innerText = '-';
        if (elColunas) elColunas.innerText = '-';
        if (elArea) elArea.innerText = '-';
        if (elVazios) elVazios.innerText = '-';
        if (elBadge) {
          elBadge.innerText = 'Aguardando Jogo';
          elBadge.className = 'text-[9px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-bold ml-1';
        }
        if (elStatus) {
          elStatus.innerText = 'Preencha o volante para calibrar a matriz';
          elStatus.className = 'text-slate-400 font-mono text-[10px]';
        }
        return;
      }

      if (modalidadeAtual === 'megasena') {
        const linhasSet = new Set(jogo.map((n) => Math.floor((n - 1) / 10) + 1));
        const colunasSet = new Set(jogo.map((n) => ((n - 1) % 10) + 1));
        
        const r = linhasSet.size;
        const c = colunasSet.size;
        const area = r * c;

        if (elLinhas) {
          elLinhas.innerText = `${r} Linhas`;
          elLinhas.className = (r >= 3 && r <= 5)
            ? 'text-emerald-400 text-xs block mt-0.5 font-bold'
            : (r <= 2 ? 'text-rose-400 text-xs block mt-0.5 font-bold' : 'text-cyan-400 text-xs block mt-0.5 font-bold');
        }
        if (elColunas) {
          elColunas.innerText = `${c} Colunas`;
          elColunas.className = (c >= 3 && c <= 6)
            ? 'text-teal-400 text-xs block mt-0.5 font-bold'
            : 'text-rose-400 text-xs block mt-0.5 font-bold';
        }
        if (elArea) {
          elArea.innerText = `${area} posições`;
          elArea.className = area <= 24 ? 'text-emerald-400 text-xs block mt-0.5 font-bold' : 'text-amber-400 text-xs block mt-0.5 font-bold';
        }

        const qCount = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
        jogo.forEach((num) => {
          const l = Math.floor((num - 1) / 10);
          const col = (num - 1) % 10;
          qCount[l <= 2 ? (col <= 4 ? 'Q1' : 'Q2') : (col <= 4 ? 'Q3' : 'Q4')]++;
        });
        const vazios = Object.entries(qCount).filter(([_, count]) => count === 0).map(([q]) => q);
        if (elVazios) {
          if (vazios.length === 0) {
            elVazios.innerText = 'Nenhum (cobre os 4 quadrantes)';
            elVazios.className = 'text-emerald-400 text-xs font-bold';
          } else if (vazios.length === 1) {
            elVazios.innerText = `${vazios[0]} sem dezenas`;
            elVazios.className = 'text-cyan-400 text-xs font-bold';
          } else {
            elVazios.innerText = `⚠️ ${vazios.join(', ')} vazios (Aglomeração)`;
            elVazios.className = 'text-rose-400 text-xs font-bold';
          }
        }

        // Calibração Ativa da Regra de 79.4%
        const dentroPadrao79 = (r >= 3 && r <= 5) && (c >= 3 && c <= 6) && (vazios.length <= 1);
        const aglomerado = r <= 2 || c <= 2 || vazios.length >= 2;

        if (elBadge) {
          if (dentroPadrao79) {
            elBadge.innerText = '✅ Dezenas espalhadas';
            elBadge.className = 'text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold ml-1';
          } else if (aglomerado) {
            elBadge.innerText = '⚠️ Dezenas concentradas';
            elBadge.className = 'text-[9px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold ml-1';
          } else {
            elBadge.innerText = '⚖️ Dispersão Atípica';
            elBadge.className = 'text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold ml-1';
          }
        }

        if (elStatus) {
          if (dentroPadrao79) {
            elStatus.innerHTML = `<span class="text-emerald-300 font-bold">Distribuição: ${r} linhas e ${c} colunas</span>`;
          } else if (aglomerado) {
            elStatus.innerHTML = `<span class="text-rose-400 font-bold">⚠️ Risco: Aglomeração em poucas linhas/colunas</span>`;
          } else {
            elStatus.innerHTML = `<span class="text-amber-300 font-bold">⚖️ Dispersão máxima (1 dezena por linha/coluna)</span>`;
          }
        }
      } else {
        // Lotofácil 5x5
        const linhasSet = new Set(jogo.map((n) => Math.floor((n - 1) / 5) + 1));
        const colunasSet = new Set(jogo.map((n) => ((n - 1) % 5) + 1));
        const moldura = jogo.filter((x) => LOTO_CONFIG.moldura.includes(x)).length;
        const miolo = jogo.length - moldura;

        if (elLinhas) elLinhas.innerText = `${linhasSet.size} de 5 Linhas`;
        if (elColunas) elColunas.innerText = `${colunasSet.size} de 5 Colunas`;
        if (elArea) elArea.innerText = `${moldura} Moldura / ${miolo} Miolo`;
        if (elVazios) elVazios.innerText = (moldura >= 9 && moldura <= 11) ? '✅ Proporção Áurea (10/5 ou 9/6)' : '⚠️ Proporção Desbalanceada';

        if (elBadge) {
          const ideal = moldura >= 9 && moldura <= 11 && linhasSet.size === 5 && colunasSet.size === 5;
          elBadge.innerText = ideal ? '✅ 82% Padrão Ouro' : '⚠️ Fora do Padrão';
          elBadge.className = ideal 
            ? 'text-[9px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-bold ml-1'
            : 'text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold ml-1';
        }
        if (elStatus) {
          elStatus.innerHTML = `<span class="text-purple-300 font-bold">🎯 Matriz 5x5: ${moldura} na Moldura / ${miolo} no Miolo</span>`;
        }
      }
    }

    // Avaliador Central e Rigoroso dos 6 Testes Estatísticos
    function avaliarJogo(jogo, modalidade) {
      const config = modalidade === 'megasena' ? MEGA_CONFIG : LOTO_CONFIG;
      const n = jogo.length;
      if (n < config.minDezenas) {
        return {
          score: 0,
          valido: false,
          dezenasEmDatas: 0,
          pctDatas: 0,
          statusManada: 'Incompleto',
          testes: [
            { v: '-', s: 'Aguardando' },
            { v: '-', s: 'Aguardando' },
            { v: '-', s: 'Aguardando' },
            { v: '-', s: 'Aguardando' },
            { v: '-', s: 'Aguardando' },
            { v: '-', s: 'Aguardando' }
          ],
          qCount: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
          zscore: 0,
          maxSeq: 1,
          maxRepFinal: 1,
          finaisCount: {},
          aprovadosCount: 0
        };
      }

      let score = 50;
      const soma = jogo.reduce((a,b)=>a+b, 0);
      const pares = jogo.filter(x => x % 2 === 0).length;
      const impares = n - pares;

      // Análise Anti-Manada (Datas de Aniversário 01 a 31)
      const dezenasEmDatas = jogo.filter(x => x <= 31).length;
      const pctDatas = Math.round((dezenasEmDatas / n) * 100);
      let statusManada = 'Protegido';
      if (dezenasEmDatas >= n - 1 && n >= 6) {
        statusManada = 'Risco';
        score -= 15;
      } else {
        score += 10;
      }

      let t1_status = 'Na faixa comum', t2_status = 'Na faixa comum', t3_status = 'Na faixa comum', t4_status = 'Na faixa comum', t5_status = 'Na faixa comum', t6_status = 'Na faixa comum';
      let t1_val = '', t2_val = '', t3_val = '', t4_val = '', t5_val = '', t6_val = '';
      let qCount = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      let zscore = 0, maxSeq = 1, maxRepFinal = 1, finaisCount = {};

      if (modalidade === 'megasena') {
        jogo.forEach(num => {
          const l = Math.floor((num - 1) / 10);
          const c = (num - 1) % 10;
          qCount[l <= 2 ? (c <= 4 ? 'Q1' : 'Q2') : (c <= 4 ? 'Q3' : 'Q4')]++;
        });

        // 1º TESTE (95,2%): Sequências & Finais
        let seq = 1;
        for (let i = 1; i < jogo.length; i++) {
          if (jogo[i] === jogo[i-1] + 1) { seq++; if (seq > maxSeq) maxSeq = seq; } else seq = 1;
        }
        jogo.forEach(x => { const f = x % 10; finaisCount[f] = (finaisCount[f] || 0) + 1; });
        maxRepFinal = Math.max(...Object.values(finaisCount));
        t1_val = `Max Seq: ${maxSeq} | Finais: ${new Set(jogo.map(x=>x%10)).size}`;
        if (maxSeq >= 3 || maxRepFinal >= 3) {
          t1_status = 'Alerta';
          score -= 22;
        } else {
          score += 15;
        }

        // 2º TESTE (92,8%): Entropia de Shannon Espacial Bidimensional
        const lMap = {}, cMap = {};
        jogo.forEach(num => {
          const l = Math.floor((num - 1) / 10);
          const c = (num - 1) % 10;
          lMap[l] = (lMap[l] || 0) + 1;
          cMap[c] = (cMap[c] || 0) + 1;
        });
        let H_lin = 0, H_col = 0;
        Object.values(lMap).forEach(qtd => { const p = qtd / n; H_lin -= p * Math.log2(p); });
        Object.values(cMap).forEach(qtd => { const p = qtd / n; H_col -= p * Math.log2(p); });
        const H_total = ((H_lin / 2.585) * 0.5 + (H_col / 3.322) * 0.5) * 2.585;
        const pctDisp = Math.min(99, Math.round((H_total / 2.585) * 100));
        t2_val = `${H_total.toFixed(3)} bits (${pctDisp}% disp)`;
        if (H_total < 1.45 || Object.keys(lMap).length <= 2) {
          t2_status = 'Alerta';
          score -= 16;
        } else {
          score += 12;
        }

        // 3º TESTE (87,4%): Aderência Qui-Quadrado Espacial (χ²)
        const espLinha = n / 6;
        let chi2 = 0;
        for (let l = 0; l < 6; l++) {
          const obs = lMap[l] || 0;
          chi2 += Math.pow(obs - espLinha, 2) / espLinha;
        }
        t3_val = `χ² = ${chi2.toFixed(2)} (${chi2 <= 9.24 ? 'p > 0.05' : 'p ≤ 0.05'})`;
        if (chi2 > 9.24) {
          t3_status = 'Alerta';
          score -= 12;
        } else {
          score += 10;
        }

        // 4º TESTE (83,6%): Paridade & Primos
        const qtdPrimos = jogo.filter(x => MEGA_CONFIG.primos.includes(x)).length;
        t4_val = `${pares}P / ${impares}I (${qtdPrimos} Primo${qtdPrimos !== 1 ? 's' : ''})`;
        if (pares === 0 || pares === 6 || qtdPrimos === 0) {
          t4_status = 'Alerta';
          score -= 14;
        } else {
          score += 8;
        }

        // 5º TESTE (81,9%): Curva Normal da Soma
        const varSemReposicao = n * ((60*60 - 1) / 12) * ((60 - n) / 59);
        const desvioExato = Math.sqrt(varSemReposicao);
        zscore = (soma - (n * 30.5)) / desvioExato;
        t5_val = `Soma: ${soma} (Z: ${zscore.toFixed(2)}σ)`;
        if (Math.abs(zscore) > 1.6) {
          t5_status = 'Alerta';
          score -= 8;
        } else {
          score += 8;
        }

        // 6º TESTE (80,8%): Hipergeométrica Setorial
        const k = [qCount.Q1, qCount.Q2, qCount.Q3, qCount.Q4];
        const combFav = combinacao(15, k[0]) * combinacao(15, k[1]) * combinacao(15, k[2]) * combinacao(15, k[3]);
        const prob = ((combFav / config.totalCombinacoes) * 100).toFixed(4);
        t6_val = `${prob}% [Q1:${k[0]} Q2:${k[1]} Q3:${k[2]} Q4:${k[3]}]`;
        if (k.some(x => x >= 4)) {
          t6_status = 'Alerta';
          score -= 8;
        } else {
          score += 7;
        }
      } else {
        const molduraCount = jogo.filter(x => LOTO_CONFIG.moldura.includes(x)).length;
        const mioloCount = n - molduraCount;
        t1_status = t2_status = t3_status = t4_status = t5_status = t6_status = 'Informativo';
        t1_val = `${n} dezenas`;
        t2_val = `${molduraCount} na moldura`;
        t3_val = `${mioloCount} no miolo`;
        t4_val = `${pares}P / ${impares}I (${jogo.filter(x => LOTO_CONFIG.primos.includes(x)).length} Primos)`;
        t5_val = `Soma: ${soma}`;
        t6_val = `${molduraCount} Moldura / ${mioloCount} Miolo`;
        score += 25;
      }

      score = Math.min(99, Math.max(25, score));
      const testes = [
        { v: t1_val, s: t1_status }, { v: t2_val, s: t2_status }, { v: t3_val, s: t3_status },
        { v: t4_val, s: t4_status }, { v: t5_val, s: t5_status }, { v: t6_val, s: t6_status }
      ];
      const aprovadosCount = testes.filter(t => t.s !== 'Alerta').length;

      return {
        score,
        valido: true,
        dezenasEmDatas,
        pctDatas,
        statusManada,
        testes,
        qCount,
        zscore,
        maxSeq,
        maxRepFinal,
        finaisCount,
        aprovadosCount
      };
    }

    function rotuloIndicadores(analise) {
      if (analise?.testes?.[0]?.s === 'Informativo') return 'indicadores descritivos';
      return `${analise?.aprovadosCount ?? 0}/6 na faixa comum`;
    }
    window.rotuloIndicadores = rotuloIndicadores;

    // SIMULADOR DE DESEMPENHO HISTÓRICO (RETRO-TESTE)
    function simularDesempenhoHistorico(jogo, mod) {
      const base = mod === 'megasena' ? baseConcursosMega : baseConcursosLoto;
      const gradeEl = document.getElementById('grade-retro-resultados');
      const detalheEl = document.getElementById('detalhe-retro-melhor-sorteio');
      const badgeResumoEl = document.getElementById('badge-retro-resumo');
      if (!gradeEl || !detalheEl) return;

      // Retro-teste sem sorteios reais não testa nada.
      if (!base || base.length === 0) {
        gradeEl.className = 'grid grid-cols-1 gap-2 font-mono text-center';
        gradeEl.innerHTML = `
          <div class="p-3 rounded-xl bg-slate-950 border border-amber-800/60 text-amber-300 text-[11px] font-sans">
            Histórico oficial ainda não sincronizado — não é possível testar
            este palpite contra concursos anteriores.
          </div>`;
        detalheEl.innerText = '';
        if (badgeResumoEl) badgeResumoEl.innerText = 'Indisponível';
        return;
      }

      const minNec = mod === 'megasena' ? 6 : 15;
      if (!jogo || jogo.length < minNec) {
        if (badgeResumoEl) badgeResumoEl.innerText = `Aguardando ${minNec} dezenas`;
        gradeEl.innerHTML = '<div class="col-span-3 text-slate-500 py-2 text-[10px] font-mono">Complete o volante para verificar histórico oficial.</div>';
        detalheEl.innerText = 'Instrumentos aguardando volante completo...';
        return;
      }

      const ultimos = base.slice(0, 50);
      let quadras = 0, quinas = 0, senas = 0;
      let pontos11 = 0, pontos12 = 0, pontos13 = 0, pontos14 = 0, pontos15 = 0;
      let maxAcertos = 0;
      let melhorConcurso = null;

      ultimos.forEach(c => {
        const acertos = c.dezenas.filter(d => jogo.includes(d)).length;
        if (acertos > maxAcertos) {
          maxAcertos = acertos;
          melhorConcurso = c;
        }
        if (mod === 'megasena') {
          if (acertos === 4) quadras++;
          else if (acertos === 5) quinas++;
          else if (acertos === 6) senas++;
        } else {
          if (acertos === 11) pontos11++;
          else if (acertos === 12) pontos12++;
          else if (acertos === 13) pontos13++;
          else if (acertos === 14) pontos14++;
          else if (acertos === 15) pontos15++;
        }
      });

      const config = getConfigAtual();
      const custoTotal50 = ultimos.length * config.precoBase;
      let premioEstimadoTotal = 0;

      if (mod === 'megasena') {
        premioEstimadoTotal = (quadras * 1100) + (quinas * 45000) + (senas * 35000000);
        const totalPremios = quadras + quinas + senas;
        const saldoFinanceiro = premioEstimadoTotal - custoTotal50;
        const roi = ((saldoFinanceiro / custoTotal50) * 100).toFixed(0);

        if (badgeResumoEl) {
          badgeResumoEl.innerText = totalPremios > 0 ? `${totalPremios}x Premiado • ${formatarReais(premioEstimadoTotal)}` : '0 Prêmios (50 conc.)';
          badgeResumoEl.className = totalPremios > 0 ? 'text-[9px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold' : 'text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold';
        }

        gradeEl.innerHTML = `
          <div class="p-2 bg-slate-950 rounded-xl border ${quadras > 0 ? 'border-emerald-800 bg-emerald-950/20' : 'border-slate-800'}">
            <span class="text-[9px] text-slate-400 block font-bold">QUADRAS (4)</span>
            <strong class="text-sm ${quadras > 0 ? 'text-emerald-400' : 'text-slate-500'}">${quadras}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans mt-0.5">~R$ 1.100 cada</span>
          </div>
          <div class="p-2 bg-slate-950 rounded-xl border ${quinas > 0 ? 'border-cyan-800 bg-cyan-950/20' : 'border-slate-800'}">
            <span class="text-[9px] text-slate-400 block font-bold">QUINAS (5)</span>
            <strong class="text-sm ${quinas > 0 ? 'text-cyan-300' : 'text-slate-500'}">${quinas}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans mt-0.5">~R$ 45.000 cada</span>
          </div>
          <div class="p-2 bg-slate-950 rounded-xl border ${senas > 0 ? 'border-amber-500 bg-amber-950/40 animate-pulse' : 'border-slate-800'}">
            <span class="text-[9px] text-amber-400 block font-black">SENAS (6)</span>
            <strong class="text-sm ${senas > 0 ? 'text-amber-300' : 'text-slate-500'}">${senas}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans mt-0.5">Jackpot Milionário</span>
          </div>
        `;

        // Bloco de Balanço Financeiro em R$
        detalheEl.innerHTML = `
          <div class="space-y-1.5 font-sans">
            <div class="flex justify-between items-center text-xs pb-1 border-b border-slate-800/80">
              <span class="text-slate-400">Investimento Teórico (50 jogos):</span>
              <span class="text-white font-mono font-bold">${formatarReais(custoTotal50)}</span>
            </div>
            <div class="flex justify-between items-center text-xs pb-1 border-b border-slate-800/80">
              <span class="text-slate-400">Retorno Estimado em Prêmios:</span>
              <span class="text-emerald-400 font-mono font-black">${formatarReais(premioEstimadoTotal)}</span>
            </div>
            <div class="flex justify-between items-center text-xs pt-0.5">
              <span class="font-bold ${saldoFinanceiro >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                ${saldoFinanceiro >= 0 ? '🎯 Saldo Líquido Positivo:' : '⚖️ Balanço Estimado:'}
              </span>
              <span class="font-mono font-black text-xs px-2 py-0.5 rounded ${saldoFinanceiro >= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-300 border border-slate-800'}">
                ${saldoFinanceiro >= 0 ? '+' : ''}${formatarReais(saldoFinanceiro)} ${saldoFinanceiro > 0 ? `(+${roi}% ROI)` : ''}
              </span>
            </div>
            ${melhorConcurso ? `
              <div class="text-[10px] text-slate-400 font-mono pt-1">
                Melhor concurso recente: <strong class="text-cyan-300">#${melhorConcurso.concurso}</strong> com <strong class="text-emerald-400">${maxAcertos} acertos</strong> (${melhorConcurso.dezenas.join(' ')})
              </div>
            ` : ''}
          </div>
        `;

      } else {
        // Lotofácil
        premioEstimadoTotal = (pontos11 * 6) + (pontos12 * 12) + (pontos13 * 30) + (pontos14 * 1500) + (pontos15 * 1800000);
        const totalPremios = pontos11 + pontos12 + pontos13 + pontos14 + pontos15;
        const saldoFinanceiro = premioEstimadoTotal - custoTotal50;
        const roi = ((saldoFinanceiro / custoTotal50) * 100).toFixed(0);

        if (badgeResumoEl) {
          badgeResumoEl.innerText = totalPremios > 0 ? `${totalPremios}x Premiado • ${formatarReais(premioEstimadoTotal)}` : '0 Prêmios (50 conc.)';
          badgeResumoEl.className = totalPremios > 0 ? 'text-[9px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-bold' : 'text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold';
        }

        gradeEl.innerHTML = `
          <div class="p-1.5 bg-slate-950 rounded-xl border ${pontos11 > 0 ? 'border-slate-700' : 'border-slate-800'}">
            <span class="text-[9px] text-slate-400 block font-bold">11 Pts</span>
            <strong class="text-xs ${pontos11 > 0 ? 'text-white' : 'text-slate-500'}">${pontos11}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans">R$ 6</span>
          </div>
          <div class="p-1.5 bg-slate-950 rounded-xl border ${pontos12 > 0 ? 'border-blue-800' : 'border-slate-800'}">
            <span class="text-[9px] text-slate-400 block font-bold">12 Pts</span>
            <strong class="text-xs ${pontos12 > 0 ? 'text-blue-300' : 'text-slate-500'}">${pontos12}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans">R$ 12</span>
          </div>
          <div class="p-1.5 bg-slate-950 rounded-xl border ${pontos13 > 0 ? 'border-teal-800' : 'border-slate-800'}">
            <span class="text-[9px] text-slate-400 block font-bold">13 Pts</span>
            <strong class="text-xs ${pontos13 > 0 ? 'text-teal-300' : 'text-slate-500'}">${pontos13}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans">R$ 30</span>
          </div>
          <div class="p-1.5 bg-slate-950 rounded-xl border ${pontos14 > 0 ? 'border-amber-700 bg-amber-950/20' : 'border-slate-800'}">
            <span class="text-[9px] text-amber-400 block font-bold">14 Pts</span>
            <strong class="text-xs ${pontos14 > 0 ? 'text-amber-300' : 'text-slate-500'}">${pontos14}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans">~R$ 1.500</span>
          </div>
          <div class="p-1.5 bg-slate-950 rounded-xl border ${pontos15 > 0 ? 'border-purple-600 bg-purple-950/40 animate-pulse' : 'border-slate-800'} col-span-2">
            <span class="text-[9px] text-purple-400 block font-black">15 PONTOS</span>
            <strong class="text-xs ${pontos15 > 0 ? 'text-purple-300' : 'text-slate-500'}">${pontos15}x</strong>
            <span class="text-[8px] text-slate-500 block font-sans">Jackpot Lotofácil</span>
          </div>
        `;

        detalheEl.innerHTML = `
          <div class="space-y-1.5 font-sans">
            <div class="flex justify-between items-center text-xs pb-1 border-b border-slate-800/80">
              <span class="text-slate-400">Investimento Teórico (50 jogos):</span>
              <span class="text-white font-mono font-bold">${formatarReais(custoTotal50)}</span>
            </div>
            <div class="flex justify-between items-center text-xs pb-1 border-b border-slate-800/80">
              <span class="text-slate-400">Retorno Estimado em Prêmios:</span>
              <span class="text-purple-400 font-mono font-black">${formatarReais(premioEstimadoTotal)}</span>
            </div>
            <div class="flex justify-between items-center text-xs pt-0.5">
              <span class="font-bold ${saldoFinanceiro >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                ${saldoFinanceiro >= 0 ? '🎯 Saldo Líquido Positivo:' : '⚖️ Balanço Estimado:'}
              </span>
              <span class="font-mono font-black text-xs px-2 py-0.5 rounded ${saldoFinanceiro >= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-300 border border-slate-800'}">
                ${saldoFinanceiro >= 0 ? '+' : ''}${formatarReais(saldoFinanceiro)} ${saldoFinanceiro > 0 ? `(+${roi}% ROI)` : ''}
              </span>
            </div>
            ${melhorConcurso ? `
              <div class="text-[10px] text-slate-400 font-mono pt-1">
                Melhor concurso recente: <strong class="text-cyan-300">#${melhorConcurso.concurso}</strong> com <strong class="text-purple-400">${maxAcertos} acertos</strong>
              </div>
            ` : ''}
          </div>
        `;
      }
    }

    // Bateria dos 6 Testes Estatísticos em Tempo Real no Volante
    // Bateria dos 6 Testes Estatísticos em Tempo Real no Volante com Indicadores
    function executarAnaliseDinamicaDoJogo() {
      const jogo = getJogoAtual();
      const config = getConfigAtual();
      const n = jogo.length;

      const elScoreNum = document.getElementById('score-numero');
      const elScoreBarra = document.getElementById('score-barra');
      const elScoreDiag = document.getElementById('score-diagnostico-texto');
      const elSugestao = document.getElementById('conteudo-sugestao-troca');
      const badgeTotal = document.getElementById('badge-total-testes-ok');

      if (n < config.minDezenas) {
        if (elScoreNum) elScoreNum.innerText = '--';
        if (elScoreBarra) elScoreBarra.style.width = '0%';
        if (elScoreDiag) elScoreDiag.innerText = `Selecione pelo menos ${config.minDezenas} números para calibrar os instrumentos de voo.`;
        if (elSugestao) elSugestao.innerHTML = '<span class="text-slate-500 italic font-mono text-xs">Complete o bilhete para receber telemetria de troca e calibração.</span>';
        for (let t = 1; t <= 6; t++) {
          const el = document.getElementById(`val-t${t}`);
          if (el) el.innerText = '-';
          const badge = document.getElementById(`badge-status-t${t}`);
          if (badge) {
            badge.innerText = 'Aguardando';
            badge.className = 'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900 text-slate-500 border border-slate-800';
          }
        }
        if (badgeTotal) {
          badgeTotal.innerText = 'Aguardando';
          badgeTotal.className = 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-900 text-slate-500 border border-slate-800';
        }
        simularDesempenhoHistorico(jogo, modalidadeAtual);
        return;
      }

      const analise = avaliarJogo(jogo, modalidadeAtual);

      const elManada = document.getElementById('manada-qtd-datas');
      if (elManada) elManada.innerText = `${analise.dezenasEmDatas} de ${n} (${analise.pctDatas}%)`;
      const barraManada = document.getElementById('barra-anti-manada');
      if (barraManada) barraManada.style.width = `${analise.pctDatas}%`;
      const badgeManada = document.getElementById('badge-anti-manada');
      if (badgeManada) {
        if (analise.statusManada === 'Risco') {
          badgeManada.innerText = 'Risco de Manada (Prêmio Diluído)';
          badgeManada.className = 'text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800';
        } else {
          badgeManada.innerText = 'Anti-Manada Protegido';
          badgeManada.className = 'text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
        }
      }

      analise.testes.forEach((t, idx) => {
        const elVal = document.getElementById(`val-t${idx+1}`);
        if (elVal) elVal.innerText = t.v;
        const badge = document.getElementById(`badge-status-t${idx+1}`);
        if (badge) {
          badge.innerText = t.s;
          badge.className = t.s !== 'Alerta' 
            ? 'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800' 
            : 'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 animate-pulse';
        }
      });

      if (badgeTotal) {
        badgeTotal.innerText = rotuloIndicadores(analise);
        badgeTotal.className = analise.aprovadosCount === 6 
          ? 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800' 
          : 'text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800';
      }

      if (elScoreNum) elScoreNum.innerText = analise.score;
      if (elScoreBarra) elScoreBarra.style.width = `${analise.score}%`;
      if (elScoreDiag) {
        elScoreDiag.innerHTML = 'Indicadores descritivos: não alteram a chance de nenhuma combinação.';
      }

      if (modalidadeAtual === 'megasena') {
        gerarRecomendacaoTrocaMega(jogo, analise.qCount, analise.zscore, analise.maxSeq, analise.maxRepFinal, analise.finaisCount, analise.dezenasEmDatas, analise);
      } else {
        const molduraCount = jogo.filter(x => LOTO_CONFIG.moldura.includes(x)).length;
        gerarRecomendacaoTrocaLoto(jogo, molduraCount);
      }

      simularDesempenhoHistorico(jogo, modalidadeAtual);

      if (typeof aplicarGateCientificoNasa === 'function') aplicarGateCientificoNasa();
    }

    // Gerador de Jogo Único de Alta Qualidade
    function gerarJogoCalibradoUnico(modalidade, k, usarVitorio = false) {
      const config = modalidade === 'megasena' ? MEGA_CONFIG : LOTO_CONFIG;
      const fixos = modalidade === 'megasena' ? fixosMega : fixosLoto;
      const proibidos = modalidade === 'megasena' ? proibidosMega : proibidosLoto;
      const disponiveis = Array.from({ length: config.totalNumeros }, (_, index) => index + 1)
        .filter(numero => !proibidos.includes(numero));

      if (fixos.length > k || disponiveis.length < k || fixos.some(numero => proibidos.includes(numero))) {
        return null;
      }

      let melhorJogo = null;
      let melhorScore = -1;

      for (let tentativa = 0; tentativa < 80; tentativa++) {
        let dezenas = new Set(fixos);

        if (usarVitorio && modalidade === 'megasena') {
          const linhas = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 4);
          const colunas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => 0.5 - Math.random()).slice(0, 4);
          const subgrid16 = [];
          linhas.forEach(l => colunas.forEach(c => subgrid16.push((l - 1) * 10 + c)));
          const disponiveis = subgrid16.filter(n => !proibidos.includes(n));
          while (dezenas.size < k && disponiveis.length > 0) {
            const rand = disponiveis[Math.floor(Math.random() * disponiveis.length)];
            dezenas.add(rand);
          }
        }

        while (dezenas.size < k) {
          const n = Math.floor(Math.random() * config.totalNumeros) + 1;
          if (!proibidos.includes(n)) dezenas.add(n);
        }

        const jogoArr = Array.from(dezenas).sort((a,b)=>a-b);
        const analise = avaliarJogo(jogoArr, modalidade);
        
        if (analise.score > melhorScore) {
          melhorScore = analise.score;
          melhorJogo = { dezenas: jogoArr, analise };
        }

        if (analise.score >= 94 && analise.aprovadosCount === 6) break;
      }

      return melhorJogo;
    }

    // Gerador de Múltiplas Apostas ("Quero X apostas de Y números")
    function gerarMultiplasApostas(qtd = qtdApostasDesejada, usarVitorio = false) {
      tocarBeep('success');
      vibrarHaptico(25);
      const k = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;
      const apostas = [];
      const hashSet = new Set();

      for (let i = 0; i < qtd; i++) {
        let jogoObj = null;
        for (let t = 0; t < 30; t++) {
          jogoObj = gerarJogoCalibradoUnico(modalidadeAtual, k, usarVitorio);
          if (!jogoObj) break;
          const chave = jogoObj.dezenas.join('-');
          if (!hashSet.has(chave)) {
            hashSet.add(chave);
            break;
          }
        }
        if (!jogoObj) {
          toast('Não há dezenas disponíveis suficientes para gerar este jogo. Revise os números proibidos e fixos.', '⚠️');
          tocarBeep('alert');
          return;
        }
        apostas.push({
          id: i + 1,
          dezenas: jogoObj.dezenas,
          analise: jogoObj.analise,
          tipo: usarVitorio ? 'Matriz 4x4' : 'Gerador'
        });
      }

      loteApostasGeradas = apostas;

      // Carrega automaticamente a 1ª aposta no volante
      setJogoAtual([...apostas[0].dezenas]);

      const ehProUser = typeof planoUsuario !== 'undefined' && planoUsuario === 'pro';
      const ehMasterFounder = typeof usuarioSessao !== 'undefined' && usuarioSessao && usuarioSessao.tipo === 'master_founder';

      if (!ehProUser && !ehMasterFounder) {
        const jogosGratisRecebidos = Number(localStorage.getItem('nasa_jogos_gratis_recebidos') || 0);

        if (jogosGratisRecebidos >= 1) {
          const jogo = apostas[0].dezenas;
          const shuffled = [...jogo].sort(() => Math.random() - 0.5);
          const numeroBloqueados = shuffled.slice(0, 2);
          localStorage.setItem('nasa_numeros_bloqueados', JSON.stringify(numeroBloqueados));
        } else {
          localStorage.removeItem('nasa_numeros_bloqueados');
          localStorage.setItem('nasa_jogos_gratis_recebidos', '1');
        }
      } else {
        localStorage.removeItem('nasa_numeros_bloqueados');
      }

      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();

      // Renderiza o lote e a barra rápida de testes 1 a 1
      renderizarLoteApostas();
      renderizarBarraJogosTesteRapido();
      if (abaAtual === 'auditoria') renderizarTelaAuditoria();

      toast(`${qtd} aposta${qtd > 1 ? 's' : ''} de ${k} números gerada${qtd > 1 ? 's' : ''}!`, "🎯");
    }

    function renderizarLoteApostas() {
      const container = document.getElementById('container-lote-apostas');
      const lista = document.getElementById('lista-lote-apostas');
      const titulo = document.getElementById('titulo-lote-apostas');
      if (!container || !lista) return;

      if (!loteApostasGeradas || loteApostasGeradas.length === 0) {
        container.classList.add('hidden');
        return;
      }

      const k = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;
      if (titulo) titulo.innerText = `${loteApostasGeradas.length} Aposta${loteApostasGeradas.length > 1 ? 's' : ''} de ${k} Números`;
      container.classList.remove('hidden');

      const jogoAtualStr = getJogoAtual().join('-');
      const nomesTestes = ['1º Seq & Finais', '2º Shannon', '3º Qui-Quadrado', '4º Paridade & Primos', '5º Normal Soma', '6º Hipergeométrica'];

      lista.innerHTML = loteApostasGeradas.map((aposta, idx) => {
        const estaNoVolante = aposta.dezenas.join('-') === jogoAtualStr;
        const borderCor = estaNoVolante ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50' : 'border-slate-800 bg-slate-950/90';
        const detalhesAbertos = !!loteDetalhesAbertos[idx];

        return `
          <div class="p-3 rounded-2xl border ${borderCor} space-y-2 transition">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-black text-white text-xs">#${aposta.id}</span>
                  ${estaNoVolante ? '<span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold">🎯 No Volante</span>' : ''}
                  <span class="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    ${rotuloIndicadores(aposta.analise)}
                  </span>
                  <span class="text-[9px] text-slate-500 font-mono">[${aposta.tipo}]</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  ${aposta.dezenas.map(d => `<span class="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-[11px] flex items-center justify-center border border-slate-700 shadow-sm">${String(d).padStart(2,'0')}</span>`).join('')}
                </div>
              </div>
              <div class="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                <button type="button" onclick="alternarDetalhesLote(${idx})" class="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs rounded-lg border border-slate-700 transition flex items-center gap-1">
                  <span>🛡️</span> ${detalhesAbertos ? 'Ocultar' : '6 Testes'}
                </button>
                <button type="button" onclick="testarJogoNaAuditoria(loteApostasGeradas[${idx}].dezenas, 'Lote: Jogo #${aposta.id}')" class="px-2 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold text-xs rounded-lg border border-cyan-800 transition flex items-center gap-1">
                  <span>🔬</span> Testar 1 a 1
                </button>
                <button type="button" onclick="carregarApostaDoLote(${idx})" class="px-2 py-1.5 ${estaNoVolante ? 'bg-cyan-600 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold'} text-xs rounded-lg border border-slate-700 transition flex items-center gap-1">
                  🎯 ${estaNoVolante ? 'Volante' : 'Volante'}
                </button>
                <button type="button" onclick="salvarApostaIndividualLote(${idx})" class="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg shadow transition">
                  💾 Salvar
                </button>
              </div>
            </div>

            <!-- GRADE EXPANSÍVEL DOS 6 TESTES DESTE JOGO -->
            ${detalhesAbertos ? `
              <div class="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[9px]">
                ${aposta.analise.testes.map((t, tIdx) => `
                  <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                    <div class="flex justify-between items-center">
                      <span class="text-slate-400 font-bold">${nomesTestes[tIdx]}</span>
                      <span class="${t.s !== 'Alerta' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${t.s}</span>
                    </div>
                    <div class="text-white text-[9px] truncate">${t.v}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    function carregarApostaDoLote(idx) {
      if (!loteApostasGeradas[idx]) return;
      tocarBeep('click');
      vibrarHaptico(15);
      setJogoAtual([...loteApostasGeradas[idx].dezenas]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      renderizarLoteApostas();
      renderizarBarraJogosTesteRapido();
      toast(`Aposta #${idx + 1} carregada no Volante!`, "🎯");
    }

    function salvarApostaIndividualLote(idx) {
      if (!loteApostasGeradas[idx]) return;
      const config = getConfigAtual();
      const jogo = loteApostasGeradas[idx].dezenas;
      const inputData = document.getElementById('input-data-jogo-alvo')?.value;
      let dataFormatada = new Date().toLocaleDateString('pt-BR');
      if (inputData) {
        const [ano, mes, dia] = inputData.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
      }
      carteiraJogos.unshift({
        id: Date.now() + Math.random(),
        modalidade: modalidadeAtual,
        dezenas: [...jogo],
        data: dataFormatada,
        custo: config.precoBase,
        premioGanho: 0,
        conferido: false,
        status: 'Pendente'
      });
      salvarCarteiraStorage();
      atualizarPainelCarteira();
      tocarBeep('success');
      toast(`Aposta #${idx + 1} salva na Carteira!`, "💾");
    }

    function salvarTodasApostasLote() {
      if (typeof window.exigirLeadAntesDeSalvar === 'function' && !window.exigirLeadAntesDeSalvar()) {
        return;
      }
      if (planoUsuario !== 'pro') {
        abrirModalPaywall('lote_salvar');
        return;
      }
      if (!loteApostasGeradas || loteApostasGeradas.length === 0) return;
      const config = getConfigAtual();
      const inputData = document.getElementById('input-data-jogo-alvo')?.value;
      let dataFormatada = new Date().toLocaleDateString('pt-BR');
      if (inputData) {
        const [ano, mes, dia] = inputData.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
      }

      loteApostasGeradas.forEach(aposta => {
        carteiraJogos.unshift({
          id: Date.now() + Math.random(),
          modalidade: modalidadeAtual,
          dezenas: [...aposta.dezenas],
          data: dataFormatada,
          custo: config.precoBase,
          premioGanho: 0,
          conferido: false,
          status: 'Pendente'
        });
      });

      salvarCarteiraStorage();
      atualizarPainelCarteira();
      tocarBeep('success');
      toast(`Todas as ${loteApostasGeradas.length} apostas salvas na Carteira!`, "💾");
    }

    function copiarTodasApostasLote() {
      if (!loteApostasGeradas || loteApostasGeradas.length === 0) return;
      const txt = loteApostasGeradas.map(a => a.dezenas.map(d => String(d).padStart(2,'0')).join(', ')).join('\n');
      const temp = document.createElement('textarea');
      temp.value = txt;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      tocarBeep('success');
      toast(`${loteApostasGeradas.length} apostas copiadas para a Área de Transferência!`, "📋");
    }

    function gerarRecomendacaoTrocaMega(jogo, qCount, zscore, maxSeq = 1, maxRepFinal = 1, finaisCount = {}, dezenasEmDatas = 0, analise = null) {
      const container = document.getElementById('conteudo-sugestao-troca');
      if (!container) return;

      const pares = jogo.filter(x => x % 2 === 0).length;
      const impares = jogo.length - pares;
      const primos = jogo.filter(x => MEGA_CONFIG.primos.includes(x)).length;

      const setores = [
        { q: 'Q1', nums: [1,2,3,4,5,11,12,13,14,15,21,22,23,24,25], count: qCount.Q1 },
        { q: 'Q2', nums: [6,7,8,9,10,16,17,18,19,20,26,27,28,29,30], count: qCount.Q2 },
        { q: 'Q3', nums: [31,32,33,34,35,41,42,43,44,45,51,52,53,54,55], count: qCount.Q3 },
        { q: 'Q4', nums: [36,37,38,39,40,46,47,48,49,50,56,57,58,59,60], count: qCount.Q4 }
      ].sort((a,b)=>b.count - a.count);

      let sai = null, entra = null, motivo = '', testeAfetado = '';

      // 1. REGRA DE PARIDADE: 6P/0I ou 0P/6I
      if (pares === 6) {
        sai = jogo.filter(x => x % 2 === 0).pop();
        entra = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53].find(x => !jogo.includes(x)) || 37;
        motivo = 'Equilibrar paridade: trocar uma dezena par por uma ímpar/prima (6 pares ocorrem em apenas 1,1% dos sorteios).';
        testeAfetado = '4º Paridade & Primos';
      } else if (pares === 0) {
        sai = jogo.filter(x => x % 2 !== 0).pop();
        entra = [10, 14, 18, 24, 38, 42, 54].find(x => !jogo.includes(x)) || 24;
        motivo = 'Equilibrar paridade: trocar uma dezena ímpar por uma dezena par (6 ímpares ocorrem em apenas 1,2% dos sorteios).';
        testeAfetado = '4º Paridade & Primos';
      }
      // 2. REGRA DE NÚMEROS PRIMOS: 0 Primos
      else if (primos === 0) {
        sai = jogo.filter(x => !MEGA_CONFIG.primos.includes(x)).pop();
        entra = [7, 11, 17, 23, 29, 41, 47, 53].find(x => !jogo.includes(x)) || 17;
        motivo = 'Adicionar dezena prima: em mais de 83% dos concursos históricos há entre 1 e 3 números primos.';
        testeAfetado = '4º Paridade & Primos';
      }
      // 3. REGRA DE SEQUÊNCIAS CONSECUTIVAS LONGAS
      else if (maxSeq >= 3) {
        for (let i = 1; i < jogo.length - 1; i++) {
          if (jogo[i] === jogo[i-1] + 1 && jogo[i+1] === jogo[i] + 1) {
            sai = jogo[i];
            entra = [7, 18, 24, 38, 45, 56].find(x => !jogo.includes(x) && x !== sai - 1 && x !== sai + 1) || 28;
            motivo = 'Quebrar sequência de 3 números consecutivos (ocorre em menos de 5% dos sorteios).';
            testeAfetado = '1º Seq & Finais';
            break;
          }
        }
      }
      // 4. REGRA DE FINAIS REPETIDOS NA MESMA COLUNA VERTICAL
      else if (maxRepFinal >= 3) {
        const finalViciado = parseInt(Object.keys(finaisCount).find(k => finaisCount[k] === maxRepFinal));
        sai = jogo.filter(x => x % 10 === finalViciado).pop();
        entra = [11, 24, 35, 48, 52].find(x => !jogo.includes(x) && x % 10 !== finalViciado) || 18;
        motivo = `Descongestionar coluna vertical: trocar final repetido (${finalViciado}) para dispersar o jogo no volante.`;
        testeAfetado = '1º Seq & Finais';
      }
      // 5. REGRA ANTI-MANADA: Todas as dezenas em datas (<= 31)
      else if (dezenasEmDatas >= jogo.length && jogo.length >= 6) {
        sai = Math.max(...jogo);
        entra = [38, 42, 48, 52, 56].find(x => !jogo.includes(x)) || 48;
        motivo = 'Proteger prêmio individual: adicionar dezena acima de 31 para escapar da manada de aniversários.';
        testeAfetado = 'Anti-Manada';
      }
      // 6. REGRA SETORIAL DOS QUADRANTES
      else if (setores[0].count >= 3 && setores[3].count === 0) {
        sai = jogo.filter(n => setores[0].nums.includes(n)).pop();
        entra = setores[3].nums.filter(n => !jogo.includes(n))[0];
        motivo = `Equilibrar distribuição espacial nos quadrantes (${setores[0].q} com ${setores[0].count} dezenas e ${setores[3].q} vazio).`;
        testeAfetado = '6º Hipergeométrica';
      }
      // 7. REGRA DE SOMA FORA DO CENTRO DA CURVA NORMAL
      else if (Math.abs(zscore) > 1.6) {
        if (zscore > 1.6) {
          sai = Math.max(...jogo);
          entra = [14, 18, 23, 27].find(x => !jogo.includes(x)) || 18;
          motivo = 'Ajustar soma para o centro da Curva Gaussiana (reduzir soma para a faixa ótima de 150 a 210).';
        } else {
          sai = Math.min(...jogo);
          entra = [38, 42, 47, 53].find(x => !jogo.includes(x)) || 42;
          motivo = 'Ajustar soma para o centro da Curva Gaussiana (aumentar soma para a faixa ótima de 150 a 210).';
        }
        testeAfetado = '5º Curva Normal da Soma';
      }

      // CRITICAL GATE: Se não passou nos 6 testes, NUNCA dizer 100% nominal!
      const aprovados = analise ? analise.aprovadosCount : (sai ? 5 : 6);
      if (aprovados < 6 && !sai) {
        sai = jogo[jogo.length - 1];
        entra = [18, 27, 35, 42, 53].find(x => !jogo.includes(x)) || 33;
        motivo = 'Calibrar dezenas para alcançar aprovação plena nos 6 testes estatísticos aeroespaciais.';
        testeAfetado = 'Calibração Geral';
      }

      if (sai && entra && aprovados < 6) {
        container.innerHTML = `
          <div class="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono shadow-lg shadow-amber-950/30">
            <div>
              <div class="flex items-center gap-2 text-xs font-bold text-white flex-wrap">
                <span class="text-amber-400 font-black flex items-center gap-1">⚡ AJUSTE:</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">${testeAfetado}</span>
                <span>Substituir</span>
                <span class="w-6 h-6 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center shadow">${String(sai).padStart(2,'0')}</span>
                <span class="text-slate-400 font-sans">por</span>
                <span class="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center shadow">${String(entra).padStart(2,'0')}</span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1 font-sans leading-snug">${motivo}</p>
            </div>
            <button onclick="aplicarSubstituicao(${sai}, ${entra})" class="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 whitespace-nowrap transition flex items-center gap-1.5 self-start sm:self-center">
              <span>🎯</span> Substituir Agora
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="p-3.5 bg-slate-950 rounded-2xl border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono shadow-lg shadow-emerald-500/10">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center text-base shadow">🎯</span>
              <div>
                <strong class="text-emerald-400 text-xs block font-mono uppercase tracking-wider">6 DE 6 NA FAIXA COMUM</strong>
                <span class="text-[11px] text-slate-300 font-sans block">Esta aposta passou com êxito em todos os 6 testes estatísticos aeroespaciais.</span>
              </div>
            </div>
            <button onclick="gerarApostaNasaComMatriz4x4()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-800/80 active:scale-95 transition ml-auto whitespace-nowrap flex items-center gap-1.5">
              <span>⚡</span> Gerar Outra Aposta
            </button>
          </div>
        `;
      }
    }

    function gerarRecomendacaoTrocaLoto(jogo, molduraCount) {
      const container = document.getElementById('conteudo-sugestao-troca');
      let sai = null, entra = null, motivo = '';
      if (molduraCount > 11) {
        sai = jogo.filter(x => LOTO_CONFIG.moldura.includes(x)).pop();
        entra = LOTO_CONFIG.miolo.filter(x => !jogo.includes(x))[0];
        motivo = `Ajustar para a proporção ideal de Moldura (9 a 11 números).`;
      }

      if (sai && entra) {
        container.innerHTML = `
          <div class="p-3 bg-slate-950 rounded-xl border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div>
              <div class="flex items-center gap-2 text-xs font-bold text-white">
                <span>Substituir</span>
                <span class="w-6 h-6 rounded bg-rose-600 text-white font-black flex items-center justify-center">${String(sai).padStart(2,'0')}</span>
                <span class="text-slate-400 font-sans">por</span>
                <span class="w-6 h-6 rounded bg-purple-600 text-white font-black flex items-center justify-center">${String(entra).padStart(2,'0')}</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 font-sans">${motivo}</p>
            </div>
            <button onclick="aplicarSubstituicao(${sai}, ${entra})" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow whitespace-nowrap transition">
              Substituir Agora
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `<div class="p-2.5 bg-slate-950 rounded-xl border border-emerald-800/40 text-emerald-400 font-semibold text-xs font-mono">✓ Bilhete da Lotofácil perfeitamente balanceado.</div>`;
      }
    }

    function aplicarSubstituicao(sai, entra) {
      tocarBeep('success');
      vibrarHaptico(20);
      let jogo = getJogoAtual().filter(n => n !== sai);
      jogo.push(entra);
      setJogoAtual(jogo.sort((a,b)=>a-b));
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      toast(`Substituído: ${sai} ➔ ${entra}`, "✨");
    }

    function calcularRateioBolao() {
      const cotas = Math.max(1, parseInt(document.getElementById('bolao-cotas')?.value || 10, 10));
      let totalGasto = 0, totalGanho = 0;

      carteiraJogos.forEach(b => {
        totalGasto += b.custo || 0;
        totalGanho += b.premioGanho || 0;
      });

      const valorPorCota = totalGasto / cotas;
      const premioPorCota = totalGanho / cotas;

      const elTotal = document.getElementById('bolao-total-jogos');
      const elValorCota = document.getElementById('bolao-valor-cota');
      const elPremioCota = document.getElementById('bolao-premio-cota');

      if (elTotal) elTotal.innerText = formatarReais(totalGasto);
      if (elValorCota) elValorCota.innerText = formatarReais(valorPorCota);
      if (elPremioCota) elPremioCota.innerText = formatarReais(premioPorCota);
    }

    function incluirJogoAtualNoBolao() {
      salvarJogoNaCarteira();
      calcularRateioBolao();
      toast("Bilhete incluído no bolão!", "👥");
    }

    function exportarRelatorioBolaoZap() {
      if (carteiraJogos.length === 0) { toast("Nenhum bilhete cadastrado para o bolão!", "⚠️"); tocarBeep('alert'); return; }
      const nome = document.getElementById('bolao-nome')?.value || 'Bolão Oficial';
      const cotas = Math.max(1, parseInt(document.getElementById('bolao-cotas')?.value || 10, 10));

      let totalGasto = 0;
      carteiraJogos.forEach(b => totalGasto += b.custo || 0);
      const valorCota = formatarReais(totalGasto / cotas);

      let txt = `🎟️ *COMPROVANTE OFICIAL: ${nome.toUpperCase()}*\n`;
      txt += `━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `👥 *Total de Cotas:* ${cotas} participantes\n`;
      txt += `💵 *Investimento por Cota:* ${valorCota}\n`;
      txt += `💰 *Valor Total do Bolão:* ${formatarReais(totalGasto)}\n`;
      txt += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      txt += `📋 *JOGOS REGISTRADOS NO BOLÃO:*\n`;

      carteiraJogos.forEach((b, idx) => {
        txt += `\n*Aposta #${idx+1} (${b.modalidade.toUpperCase()} - ${b.dezenas.length} nºs):*\n`;
        txt += `👉 ${b.dezenas.map(d => String(d).padStart(2,'0')).join(' - ')}\n`;
      });

      txt += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `⚡ *Gerado e auditado via Meu Volante PRO*\n`;
      txt += `🔗 *Audite seu jogo grátis:* https://vitoriobergamobrazil.github.io/loterias-nasa-pro/\n`;

      window.abrirWhatsApp({ texto: txt });
    }

    window.usuarioEstaIdentificado = function () {
      const sessao = (typeof usuarioSessao !== 'undefined' && usuarioSessao) ? usuarioSessao : (window.usuarioSessao || null);
      if (!sessao) return false;
      if (sessao.tipo === 'master_founder' || sessao.tipo === 'vip_convidado') return true;
      if (sessao.tipo !== 'visitante' && Boolean(sessao.email || sessao.telefone)) return true;
      const lead = JSON.parse(localStorage.getItem('loterias_nasa_visitor_lead') || 'null');
      if (lead && (lead.email || lead.telefone)) return true;
      return false;
    };

    window.exigirLeadAntesDeSalvar = function (mensagem = 'Identifique-se com seu E-mail ou WhatsApp para salvar seus bilhetes!') {
      if (window.usuarioEstaIdentificado()) return true;

      toast(mensagem, '📋');
      tocarBeep('alert');
      setTimeout(() => {
        if (typeof abrirModalAuth === 'function') abrirModalAuth();
        else if (typeof abrirModalAuthOuPerfil === 'function') abrirModalAuthOuPerfil();
      }, 300);
      return false;
    };

    function salvarJogoNaCarteira() {
      // 1. TRAVA DE CAPTURA DE LEAD / LOGIN: O usuário precisa se cadastrar para salvar jogos
      if (!window.exigirLeadAntesDeSalvar()) {
        return;
      }

      if (planoUsuario !== 'pro' && carteiraJogos.length >= 2) {
        abrirModalPaywall('carteira_limite');
        return;
      }
      const jogo = getJogoAtual();
      const config = getConfigAtual();
      if (jogo.length < config.minDezenas) { toast(`Mínimo de ${config.minDezenas} dezenas!`, "⚠️"); tocarBeep('alert'); return; }

      const inputData = document.getElementById('input-data-jogo-alvo')?.value;
      let dataFormatada = new Date().toLocaleDateString('pt-BR');
      if (inputData) {
        const [ano, mes, dia] = inputData.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
      }

      tocarBeep('success');
      carteiraJogos.unshift({
        id: Date.now(),
        modalidade: modalidadeAtual,
        dezenas: [...jogo],
        data: dataFormatada,
        custo: config.precoBase,
        premioGanho: 0,
        conferido: false,
        status: 'Pendente'
      });
      salvarCarteiraStorage();
      atualizarPainelCarteira();
      toast(`Jogo salvo para o concurso de ${dataFormatada}!`, "💾");
    }

    function carregarBilheteNoVolante(id) {
      const b = carteiraJogos.find(item => String(item.id) === String(id));
      if (!b) return;
      if (b.modalidade !== modalidadeAtual) trocarModalidade(b.modalidade);
      setJogoAtual([...b.dezenas]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      mudarAba('volante');

      const elBateria = document.getElementById('conteudo-bateria-testes');
      const setaBateria = document.getElementById('seta-bateria-testes');
      if (elBateria && elBateria.classList.contains('hidden')) {
        elBateria.classList.remove('hidden');
        if (setaBateria) setaBateria.innerText = '⯆';
      }

      const elSim = document.getElementById('conteudo-simulador-historico');
      const setaSim = document.getElementById('seta-simulador-historico');
      if (elSim && elSim.classList.contains('hidden')) {
        elSim.classList.remove('hidden');
        if (setaSim) setaSim.innerText = '⯆';
      }

      tocarBeep('success');
      toast(`Bilhete de ${b.data} carregado no Volante & Indicadores!`, "🎯");
    }

    // AUDITORIA E CALIBRAÇÃO DO PORTFÓLIO DE APOSTAS
    function atualizarCalibracaoPortfolio() {
      const jogosMod = carteiraJogos.filter(b => b.modalidade === modalidadeAtual);
      const totalDezenasConfig = modalidadeAtual === 'megasena' ? 60 : 25;

      const todasDezenas = [];
      const dezenasSet = new Set();
      const contagemQuad = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      const contagemLinhas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

      jogosMod.forEach(b => {
        b.dezenas.forEach(d => {
          todasDezenas.push(d);
          dezenasSet.add(d);

          if (modalidadeAtual === 'megasena') {
            const l = Math.floor((d - 1) / 10) + 1;
            const c = ((d - 1) % 10) + 1;
            contagemLinhas[l] = (contagemLinhas[l] || 0) + 1;
            const q = l <= 3 ? (c <= 5 ? 'Q1' : 'Q2') : (c <= 5 ? 'Q3' : 'Q4');
            contagemQuad[q] = (contagemQuad[q] || 0) + 1;
          }
        });
      });

      const dezenasUnicas = dezenasSet.size;
      const elCobertas = document.getElementById('calibracao-dezenas-cobertas');
      const elGaps = document.getElementById('calibracao-gaps-setores');
      const elRedundancia = document.getElementById('calibracao-taxa-redundancia');
      const elDiag = document.getElementById('calibracao-diagnostico-txt');
      const elBadge = document.getElementById('calibracao-status-badge');

      if (!elCobertas || !elGaps || !elRedundancia || !elDiag) return;

      elCobertas.innerText = `${dezenasUnicas} de ${totalDezenasConfig} (${Math.round((dezenasUnicas/totalDezenasConfig)*100)}%)`;

      if (jogosMod.length === 0) {
        elGaps.innerText = 'Sem apostas ativas';
        elRedundancia.innerText = '0%';
        elDiag.innerText = 'Adicione suas apostas para a IA calcular a calibração de cobertura do portfólio.';
        elBadge.innerText = 'Aguardando';
        elBadge.className = 'text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold';
        return;
      }

      const totalMarcadas = todasDezenas.length;
      const repetidas = totalMarcadas - dezenasUnicas;
      const taxaRedundancia = Math.round((repetidas / Math.max(1, totalMarcadas)) * 100);
      elRedundancia.innerText = `${taxaRedundancia}% repetição`;

      const gaps = Object.entries(contagemQuad).filter(([_, count]) => count === 0).map(([q]) => q);
      elGaps.innerText = gaps.length > 0 ? `Lacuna no ${gaps.join(', ')}` : 'Todos os 4 setores cobertos';

      if (gaps.length > 0 || taxaRedundancia > 35) {
        elBadge.innerText = 'Requer Calibração';
        elBadge.className = 'text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold';
        elDiag.innerHTML = `⚠️ <strong>Diagnóstico de Portfólio:</strong> Seus ${jogosMod.length} bilhetes têm alta concentração e deixaram o <strong>${gaps.join(', ') || 'algumas faixas'}</strong> sem nenhuma cobertura. Clique abaixo para gerar o próximo jogo compensatório.`;
      } else {
        elBadge.innerText = 'Jogos variados';
        elBadge.className = 'text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold';
        elDiag.innerHTML = `✅ <strong>Excelente Cobertura:</strong> Suas apostas estão cobrindo ${dezenasUnicas} números sem desperdício de redundância.`;
      }
    }

    // GERADOR DE JOGO COMPENSATÓRIO CALIBRADO
    function gerarProximoJogoCalibrado() {
      tocarBeep('success');
      vibrarHaptico(25);
      const jogosMod = carteiraJogos.filter(b => b.modalidade === modalidadeAtual);
      const config = getConfigAtual();
      const k = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;

      const freqUsuario = {};
      for (let i = 1; i <= config.totalNumeros; i++) freqUsuario[i] = 0;
      jogosMod.forEach(b => b.dezenas.forEach(d => { if (freqUsuario[d] !== undefined) freqUsuario[d]++; }));

      const nuncaJogados = Object.keys(freqUsuario).filter(n => freqUsuario[n] === 0 && !getProibidos().includes(parseInt(n))).map(Number);
      
      const jogoCalibrado = new Set(getFixos());
      nuncaJogados.sort(() => 0.5 - Math.random());

      nuncaJogados.forEach(n => {
        if (jogoCalibrado.size < k) jogoCalibrado.add(n);
      });

      while (jogoCalibrado.size < k) {
        const r = Math.floor(Math.random() * config.totalNumeros) + 1;
        if (!getProibidos().includes(r)) jogoCalibrado.add(r);
      }

      setJogoAtual(Array.from(jogoCalibrado).sort((a,b)=>a-b));
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      mudarAba('volante');
      toast("Próximo jogo gerado.", "🎯");
    }

    function sugerirDezenasFaltantes(dezenasAtuais, modalidade = 'megasena', qtdFaltam = 1, freqHistorica = null) {
      const max = modalidade === 'lotofacil' ? 25 : 60;
      const atuaisSet = new Set(dezenasAtuais.map(Number));
      const metadeCorte = modalidade === 'lotofacil' ? 13 : 30;

      const paresAtuais = dezenasAtuais.filter(n => n % 2 === 0).length;
      const imparesAtuais = dezenasAtuais.length - paresAtuais;
      const baixosAtuais = dezenasAtuais.filter(n => n <= metadeCorte).length;
      const altosAtuais = dezenasAtuais.length - baixosAtuais;

      const freq = freqHistorica || (typeof calcularFrequenciaHistorica === 'function' ? calcularFrequenciaHistorica() : {});

      const candidatos = [];
      for (let num = 1; num <= max; num++) {
        if (atuaisSet.has(num)) continue;
        let score = 50;
        const motivos = [];

        // 1. Balanceamento Par/Ímpar (Equilíbrio Estatístico Oficial da Caixa)
        const ehPar = num % 2 === 0;
        if (paresAtuais < imparesAtuais && ehPar) {
          score += 25;
          motivos.push('Equilíbrio Par/Ímpar (3/3)');
        } else if (imparesAtuais < paresAtuais && !ehPar) {
          score += 25;
          motivos.push('Equilíbrio Par/Ímpar (3/3)');
        }

        // 2. Metade Baixa / Alta (Distribuição de Quadrantes)
        if (baixosAtuais < altosAtuais && num <= metadeCorte) {
          score += 15;
          motivos.push('Compensação Baixa/Alta');
        } else if (altosAtuais < baixosAtuais && num > metadeCorte) {
          score += 15;
          motivos.push('Compensação Baixa/Alta');
        }

        // 3. Frequência Histórica
        const f = freq[num] || 0;
        score += Math.min(f * 2, 20);

        candidatos.push({
          dezena: num,
          score,
          motivo: motivos.join(' + ') || 'Convergência Estatística'
        });
      }

      candidatos.sort((a,b) => b.score - a.score || a.dezena - b.dezena);
      const escolhidos = candidatos.slice(0, qtdFaltam);
      const dezenasSugeridas = escolhidos.map(c => c.dezena);
      const jogoCompleto = [...dezenasAtuais, ...dezenasSugeridas].sort((a,b) => a-b);

      return {
        dezenasSugeridas,
        justificativa: escolhidos[0]?.motivo || 'Otimização Estatística',
        jogoCompleto
      };
    }

    function parsearJogosTextoCompleto(textoBruto, dataManual = null) {
      const texto = String(textoBruto || '').trim();
      if (!texto) return { erro: 'Texto vazio' };

      // 1. Detecta Concurso do texto
      let concurso = null;
      const matchConc = texto.match(/concurso\s*[:#]?\s*(\d{3,5})/i) || texto.match(/#(\d{3,5})/i) || texto.match(/conc\.?\s*[:#]?\s*(\d{3,5})/i);
      if (matchConc) concurso = '#' + matchConc[1];

      // 2. Detecta Data do texto ou manual
      let data = dataManual;
      if (!data) {
        const matchData = texto.match(/(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/);
        if (matchData) data = `${matchData[1]}/${matchData[2]}/${matchData[3]}`;
      }

      // Se concurso é de um sorteio passado conhecido, busca a data oficial histórica
      if (concurso && !data) {
        const numConc = Number(concurso.replace(/\D/g, ''));
        const achouMega = (baseConcursosMega || []).find(c => Number(c.concurso) === numConc);
        const achouLoto = (baseConcursosLoto || []).find(c => Number(c.concurso) === numConc);
        if (achouMega?.data) data = achouMega.data;
        else if (achouLoto?.data) data = achouLoto.data;
      }

      // 3. Detecta Modalidade do texto
      let modalidadeDetectada = null;
      if (/lotof[aá]cil|loto\s*f[aá]cil/i.test(texto)) modalidadeDetectada = 'lotofacil';
      else if (/mega[- ]?sena|\bmega\b/i.test(texto)) modalidadeDetectada = 'megasena';

      // 4. Divide em linhas para detectar múltiplos jogos
      const linhas = texto.split(/\r?\n/);
      const jogosEncontrados = [];
      const jogosIncompletos = [];

      const processarLinhaDezenas = (dezenasValidas) => {
        const maxNum = Math.max(...dezenasValidas);
        const mod = modalidadeDetectada || (maxNum <= 25 && dezenasValidas.length >= 13 ? 'lotofacil' : (typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena'));

        if (mod === 'lotofacil') {
          if (dezenasValidas.length >= 15 && dezenasValidas.length <= 20) {
            jogosEncontrados.push(dezenasValidas);
          } else if (dezenasValidas.length >= 13 && dezenasValidas.length < 15) {
            const faltam = 15 - dezenasValidas.length;
            const sugestao = sugerirDezenasFaltantes(dezenasValidas, 'lotofacil', faltam);
            jogosIncompletos.push({ dezenas: dezenasValidas, modalidade: 'lotofacil', faltam, sugestao });
          }
        } else {
          // Mega-Sena
          if (dezenasValidas.length >= 6 && dezenasValidas.length <= 20) {
            jogosEncontrados.push(dezenasValidas);
          } else if (dezenasValidas.length >= 4 && dezenasValidas.length < 6) {
            const faltam = 6 - dezenasValidas.length;
            const sugestao = sugerirDezenasFaltantes(dezenasValidas, 'megasena', faltam);
            jogosIncompletos.push({ dezenas: dezenasValidas, modalidade: 'megasena', faltam, sugestao });
          }
        }
      };

      for (let linha of linhas) {
        linha = linha.trim();
        if (!linha) continue;

        if (/^(loterias|modalidade|concurso|total de jogos|gerado|resultado|parab[eé]ns)/i.test(linha)) {
          continue;
        }

        let linhaLimpa = linha.replace(/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/g, ' ')
                              .replace(/#\d{3,5}/g, ' ')
                              .replace(/\b\d{1,2}h\b/gi, ' ')
                              .replace(/\b\d{2}:\d{2}\b/g, ' ')
                              .replace(/r\$\s*[\d\,\.]+/gi, ' ')
                              .replace(/^.*jogo\s*#?\d+\s*[:\-]?\s*/i, ' ')
                              .replace(/^.*aposta\s*#?\d+\s*[:\-]?\s*/i, ' ')
                              .replace(/^.*bilhete\s*#?\d+\s*[:\-]?\s*/i, ' ')
                              .replace(/[\*\_]/g, ' ');

        const nums = (linhaLimpa.match(/\b\d{1,2}\b/g) || []).map(Number);
        const dezenasValidas = Array.from(new Set(nums.filter(n => n >= 1 && n <= 60))).sort((a,b)=>a-b);

        if (dezenasValidas.length >= 4) {
          processarLinhaDezenas(dezenasValidas);
        }
      }

      if (jogosEncontrados.length === 0 && jogosIncompletos.length === 0) {
        let textoGlobalLimpo = texto.replace(/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/g, ' ')
                                    .replace(/#\d{3,5}/g, ' ')
                                    .replace(/\b\d{1,2}h\b/gi, ' ')
                                    .replace(/\b\d{2}:\d{2}\b/g, ' ')
                                    .replace(/r\$\s*[\d\,\.]+/gi, ' ')
                                    .replace(/[\*\_]/g, ' ');

        const nums = (textoGlobalLimpo.match(/\b\d{1,2}\b/g) || []).map(Number);
        const dezenasValidas = Array.from(new Set(nums.filter(n => n >= 1 && n <= 60))).sort((a,b)=>a-b);
        if (dezenasValidas.length >= 4) {
          processarLinhaDezenas(dezenasValidas);
        }
      }

      return { concurso, data, modalidadeDetectada, jogos: jogosEncontrados, incompletos: jogosIncompletos };
    }

    let ultimoIncompletoDetectado = null;

    function renderizarSugestaoIncompleta(incompleto, mod, concFinal, dataFinal) {
      const container = document.getElementById('container-sugestao-inteligente');
      if (!container) return;

      ultimoIncompletoDetectado = { ...incompleto, modalidade: mod, concursoAlvo: concFinal, data: dataFinal };
      window.ultimoIncompletoDetectado = ultimoIncompletoDetectado;

      const modNome = mod === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena';
      const meta = mod === 'lotofacil' ? 15 : 6;
      const sugeridasFormatadas = incompleto.sugestao.dezenasSugeridas.map(d => String(d).padStart(2, '0')).join(', ');

      container.innerHTML = `
        <div class="p-3.5 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 rounded-xl space-y-2.5 animate-fadeIn font-mono">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <span>🧩</span> Aposta Incompleta Identificada!
            </div>
            <span class="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-mono font-bold">
              Falta ${incompleto.faltam} dezena(s) para aposta mínima (${meta})
            </span>
          </div>

          <div class="text-xs text-slate-300">
            Você colou <strong>${incompleto.dezenas.length} dezenas</strong> para ${modNome}:
            <div class="flex flex-wrap gap-1 mt-1 font-bold text-amber-300">
              ${incompleto.dezenas.map(d => `<span class="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">${String(d).padStart(2, '0')}</span>`).join('')}
            </div>
          </div>

          <div class="p-2.5 bg-slate-950/90 rounded-lg border border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="text-[10px] text-cyan-400 font-sans font-bold flex items-center gap-1">
                <span>💡</span> Sugestão Estatística da do app:
              </div>
              <div class="text-slate-300 text-xs mt-0.5 font-sans">${incompleto.sugestao.justificativa}</div>
            </div>
            <div class="sm:text-right">
              <span class="text-[10px] text-slate-400 font-sans">Completar com dezena(s):</span>
              <div class="text-base sm:text-lg font-black text-cyan-400 font-mono">
                ${sugeridasFormatadas}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
            <button type="button" onclick="aceitarSugestaoEImportar()" class="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-[0.98]">
              ✨ Salvar Jogo Completo (${incompleto.sugestao.jogoCompleto.length} dezenas)
            </button>
            <button type="button" onclick="abrirApostaIncompletaNoVolante()" class="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs rounded-xl border border-slate-700 transition">
              🎯 Abrir no Volante para Escolher
            </button>
          </div>
        </div>
      `;
      container.classList.remove('hidden');
    }

    function aceitarSugestaoEImportar() {
      if (!ultimoIncompletoDetectado) return;
      const { sugestao, modalidade, concursoAlvo, data } = ultimoIncompletoDetectado;
      const precoBase = modalidade === 'lotofacil' ? 3.5 : 6.0;

      carteiraJogos.unshift({
        id: Date.now(),
        modalidade: modalidade,
        nome: `${modalidade === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena'} • Aposta gerada (${sugestao.jogoCompleto.length} dez)`,
        dezenas: sugestao.jogoCompleto,
        data: data,
        concursoAlvo: concursoAlvo,
        custo: precoBase,
        premioGanho: 0,
        conferido: false,
        status: 'Aguardando sorteio',
        registradoComoJogado: true,
        dataRegistro: new Date().toISOString()
      });

      salvarCarteiraStorage();
      atualizarPainelCarteira();

      const input = document.getElementById('input-scanner-texto');
      if (input) input.value = '';
      const container = document.getElementById('container-sugestao-inteligente');
      if (container) {
        container.innerHTML = '';
        container.classList.add('hidden');
      }

      tocarBeep('success');
      toast(`✅ Aposta completa salva na carteira com a sugestão da IA!`, "🎯");
      ultimoIncompletoDetectado = null;
      window.ultimoIncompletoDetectado = null;
    }

    function abrirApostaIncompletaNoVolante() {
      if (!ultimoIncompletoDetectado) return;
      const { dezenas, modalidade } = ultimoIncompletoDetectado;

      if (typeof alternarModalidade === 'function' && modalidadeAtual !== modalidade) {
        alternarModalidade(modalidade);
      }

      setJogoAtual([...dezenas]);
      renderizarVolante();
      atualizarDisplayJogo();
      mudarAba('volante');

      const container = document.getElementById('container-sugestao-inteligente');
      if (container) {
        container.innerHTML = '';
        container.classList.add('hidden');
      }

      tocarBeep('click');
      toast(`🎯 ${dezenas.length} dezenas carregadas no volante! Selecione para completar.`, "✏️");
    }

    function importarBilheteTexto() {
      const input = document.getElementById('textarea-scanner-lote') || document.getElementById('input-scanner-texto');
      const inputData = document.getElementById('input-import-data-manual')?.value || document.getElementById('input-import-data')?.value;
      const inputConcManual = document.getElementById('input-import-concurso-manual')?.value?.trim();
      const containerSugestao = document.getElementById('container-sugestao-inteligente');
      if (containerSugestao) {
        containerSugestao.innerHTML = '';
        containerSugestao.classList.add('hidden');
      }

      if (!input || !input.value.trim()) {
        toast("Cole os números ou a mensagem do jogo.", "⚠️");
        tocarBeep('alert');
        return;
      }

      let dataManual = null;
      if (inputData) {
        const [ano, mes, dia] = inputData.split('-');
        if (dia && mes && ano) dataManual = `${dia}/${mes}/${ano}`;
      }

      const res = parsearJogosTextoCompleto(input.value, dataManual);

      if ((!res.jogos || res.jogos.length === 0) && (!res.incompletos || res.incompletos.length === 0)) {
        toast("Nenhuma aposta identificada. Digite ao menos 4 dezenas para a Mega-Sena ou 13 para a Lotofácil.", "⚠️");
        tocarBeep('alert');
        return;
      }

      const mod = res.modalidadeDetectada || (res.jogos?.[0]?.length >= 15 || res.incompletos?.[0]?.modalidade === 'lotofacil' ? 'lotofacil' : modalidadeAtual);
      const precoBase = mod === 'lotofacil' ? 3.5 : 6.0;

      let concFinal = inputConcManual || res.concurso;
      if (concFinal && !concFinal.startsWith('#') && /^\d+$/.test(concFinal)) {
        concFinal = `#${concFinal}`;
      }

      let dataFinal = dataManual || res.data;

      // Se informou concurso mas não informou data, busca data oficial histórica
      const numConc = concFinal ? Number(String(concFinal).replace(/\D/g, '')) : 0;
      const base = mod === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
      const encOficial = numConc > 0 ? base.find(c => Number(c.concurso) === numConc) : null;

      if (encOficial && encOficial.data && !dataFinal) {
        dataFinal = encOficial.data;
      }

      if (!dataFinal) {
        dataFinal = typeof obterInfoProximoSorteio === 'function' ? obterInfoProximoSorteio(mod).data : new Date().toLocaleDateString('pt-BR');
      }
      if (!concFinal) {
        concFinal = typeof obterInfoProximoSorteio === 'function' ? obterInfoProximoSorteio(mod).concurso : 'Oficial';
      }

      // Verifica se é concurso passado
      const ehPassado = typeof window.concursoOuDataEhPassado === 'function'
        ? window.concursoOuDataEhPassado(concFinal, dataFinal, mod)
        : false;

      // Se encontrou jogos completos, salva na carteira
      if (res.jogos && res.jogos.length > 0) {
        res.jogos.forEach((dez, idx) => {
          let conferido = false;
          let status = ehPassado ? 'Sorteio Realizado' : 'Aguardando sorteio';
          let premioGanho = 0;
          let acertos = undefined;
          let dezenasSorteadas = undefined;

          if (encOficial && Array.isArray(encOficial.dezenas) && encOficial.dezenas.length > 0) {
            dezenasSorteadas = encOficial.dezenas.map(Number);
            acertos = dez.map(Number).filter(d => dezenasSorteadas.includes(d)).length;
            conferido = true;
            if (typeof avaliarBilhete === 'function') {
              const av = avaliarBilhete({ modalidade: mod, dezenas: dez }, encOficial);
              status = av.status;
              premioGanho = av.premioGanho || 0;
            } else {
              status = `${acertos} acertos`;
            }
          }

          carteiraJogos.unshift({
            id: Date.now() + idx,
            modalidade: mod,
            nome: `${mod === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena'} • Jogo #${idx + 1} (${dez.length} dez)`,
            dezenas: dez,
            data: dataFinal,
            concursoAlvo: concFinal,
            custo: precoBase,
            premioGanho: premioGanho,
            conferido: conferido,
            status: status,
            acertos: acertos,
            dezenasSorteadas: dezenasSorteadas,
            registradoComoJogado: true,
            dataRegistro: new Date().toISOString()
          });
        });

        salvarCarteiraStorage();
        atualizarPainelCarteira();
        input.value = '';
        tocarBeep('success');
        
        if (encOficial) {
          toast(`✅ ${res.jogos.length} aposta(s) do Concurso ${concFinal} arquivadas e apuradas!`, "🎉");
        } else {
          toast(`✅ ${res.jogos.length} aposta(s) importada(s) para ${concFinal} (${dataFinal})!`, "📥");
          if (ehPassado && typeof conferirSorteiosPassadosAutomatico === 'function') {
            conferirSorteiosPassadosAutomatico();
          }
        }
        if (typeof alternarSubAbaCarteira === 'function') {
          alternarSubAbaCarteira('bilhetes');
        }
      }

      // Se encontrou aposta incompleta, exibe a sugestão inteligente
      if (res.incompletos && res.incompletos.length > 0) {
        renderizarSugestaoIncompleta(res.incompletos[0], mod, concFinal, dataFinal);
        tocarBeep('success');
      }
    }

    function atualizarPainelCarteira() {
      const container = document.getElementById('container-bilhetes-salvos');
      document.getElementById('total-bilhetes-salvos').innerText = carteiraJogos.length;

      let totalGasto = 0, totalGanho = 0;
      carteiraJogos.forEach(b => {
        totalGasto += b.custo || 0;
        totalGanho += b.premioGanho || 0;
      });

      document.getElementById('banca-investido').innerText = formatarReais(totalGasto);
      document.getElementById('banca-premios').innerText = formatarReais(totalGanho);
      const lucro = totalGanho - totalGasto;
      const lucroEl = document.getElementById('banca-lucro');
      lucroEl.innerText = formatarReais(lucro);
      lucroEl.className = lucro >= 0 ? 'text-emerald-400 text-sm block mt-0.5' : 'text-rose-400 text-sm block mt-0.5';

      // Home mostra o mesmo resumo (bilhetes salvos + total investido).
      // Antes era texto fixo "0 / R$ 0" no card, desligado da carteira real.
      if (typeof atualizarResumoHome === 'function') {
        atualizarResumoHome(carteiraJogos.length, totalGasto);
      }

      atualizarCalibracaoPortfolio();

      if (typeof conferirSorteiosPassadosAutomatico === 'function') {
        conferirSorteiosPassadosAutomatico();
      }

      if (carteiraJogos.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500 text-center py-6 font-mono">Nenhum bilhete registrado na carteira.</p>';
        return;
      }

      const nomesTestes = ['1º Seq & Finais', '2º Shannon', '3º Qui-Quadrado', '4º Paridade & Primos', '5º Normal Soma', '6º Hipergeométrica'];

      container.innerHTML = carteiraJogos.map((b) => {
        const analise = avaliarJogo(b.dezenas, b.modalidade || modalidadeAtual);
        const aberto = !!carteiraDetalhesAbertos[b.id];
        const dezenasSorteadas = (b.dezenasSorteadas || []).map(Number);
        const ehPassado = b.data ? (typeof dataBRNoFuturo === 'function' ? !dataBRNoFuturo(b.data) : true) : false;
        return `
          <div class="p-3 bg-slate-950 rounded-2xl border ${b.premioGanho > 0 ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-slate-800'} space-y-2 text-xs font-mono">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span class="px-1.5 py-0.5 rounded font-black text-[9px] ${b.modalidade === 'megasena' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'}">${b.modalidade.toUpperCase()}</span>
                  <span class="text-cyan-300 text-[10px] font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">📅 ${b.data}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${analise.aprovadosCount === 6 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}">
                    ${rotuloIndicadores(analise)}
                  </span>
                  ${b.conferido ? `<span class="text-[9px] font-bold ${b.premioGanho > 0 ? 'text-emerald-400 font-black' : 'text-slate-400'}">${b.status}</span>` : (ehPassado ? '<span class="text-[9px] text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">Sorteio Realizado</span>' : '<span class="text-[9px] text-slate-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Aguardando Sorteio</span>')}
                </div>
                <div class="flex flex-wrap gap-1">
                  ${b.dezenas.map(d => {
                    const acertou = dezenasSorteadas.includes(Number(d));
                    return `<span class="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center font-mono ${acertou ? 'bg-emerald-500 text-slate-950 font-black border border-white scale-105 shadow' : 'bg-slate-800 text-slate-200'}">${String(d).padStart(2,'0')}</span>`;
                  }).join('')}
                </div>
              </div>
              <div class="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                <button type="button" onclick="alternarDetalhesCarteira('${b.id}')" title="Ver 6 Testes" class="text-cyan-400 hover:text-cyan-300 text-[10px] px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 font-bold flex items-center gap-1">
                  <span>🛡️</span> ${aberto ? 'Ocultar Testes' : '6 Testes'}
                </button>
                <button type="button" onclick="carregarBilheteNoVolante('${b.id}')" title="Carregar no Volante e Auditar" class="text-emerald-400 hover:text-emerald-300 text-[10px] px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 font-bold flex items-center gap-1">
                  <span>🎯</span> Volante & Testes
                </button>
                <button type="button" onclick="removerBilheteCarteira('${b.id}')" class="text-rose-400 hover:text-rose-300 text-sm p-1" title="Remover bilhete">🗑️</button>
              </div>
            </div>

            <!-- GRADE EXPANSÍVEL DOS 6 TESTES DESTE BILHETE -->
            ${aberto ? `
              <div class="mt-2 pt-2 border-t border-slate-800/80 space-y-2 font-mono">
                <div class="flex justify-between items-center text-[10px] px-1 font-bold">
                  <span class="text-slate-400">Score de Telemetria:</span>
                  <span class="${analise.aprovadosCount === 6 ? 'text-emerald-400' : 'text-amber-400'}">${analise.score}/100 • ${analise.aprovadosCount} de 6 Aprovados</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[9px]">
                  ${analise.testes.map((t, tIdx) => `
                    <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                      <div class="flex justify-between items-center">
                        <span class="text-slate-400 font-bold truncate">${nomesTestes[tIdx]}:</span>
                        <span class="font-bold ${t.s !== 'Alerta' ? 'text-emerald-400' : 'text-rose-400'}">${t.s}</span>
                      </div>
                      <div class="text-slate-300 font-mono text-[9px] truncate">${t.v}</div>
                    </div>
                  `).join('')}
                </div>
                <button type="button" onclick="carregarBilheteNoVolante('${b.id}')" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-lg text-[10px] shadow flex items-center justify-center gap-1">
                  <span>🎯</span> Carregar no Volante & Indicadores
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    function removerBilheteCarteira(id) {
      if (typeof tocarBeep === 'function') tocarBeep('click');
      const listaBase = (Array.isArray(window.carteiraJogos) && window.carteiraJogos.length > 0)
        ? window.carteiraJogos
        : (Array.isArray(carteiraJogos) ? carteiraJogos : []);

      carteiraJogos = listaBase.filter(b => String(b.id) !== String(id));
      window.carteiraJogos = carteiraJogos;

      const chave = obterChaveStorageCarteira();
      try {
        localStorage.setItem(chave, JSON.stringify(carteiraJogos));
        // Se houver resíduo em chave legada, limpa também
        const leg = localStorage.getItem('loterias_carteira_db');
        if (leg) {
          const dadosLeg = JSON.parse(leg);
          if (Array.isArray(dadosLeg)) {
            const limpos = dadosLeg.filter(b => String(b.id) !== String(id));
            localStorage.setItem('loterias_carteira_db', JSON.stringify(limpos));
          }
        }
      } catch (e) {
        console.warn('Erro ao persistir remoção de bilhete:', e);
      }

      salvarCarteiraStorage();
      atualizarPainelCarteira();
      if (typeof renderizarBarraJogosTesteRapido === 'function') renderizarBarraJogosTesteRapido();
      if (typeof toast === 'function') toast("Bilhete removido!", "🗑️");

      // Remove da nuvem se autenticado no Supabase
      try {
        const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
        if (cliente) {
          cliente.auth.getSession().then(({ data }) => {
            const uid = data?.session?.user?.id;
            if (uid) cliente.from('carteira_apostas').delete().eq('user_id', uid).eq('bilhete_id', String(id)).then();
          });
        }
      } catch (e) {}
    }

    function solicitarLimparCarteira() {
      if (typeof tocarBeep === 'function') tocarBeep('alert');
      const acaoLimpar = () => {
        carteiraJogos = [];
        window.carteiraJogos = [];
        salvarCarteiraStorage();
        atualizarPainelCarteira();
        if (typeof renderizarBarraJogosTesteRapido === 'function') renderizarBarraJogosTesteRapido();
        if (typeof toast === 'function') toast("Carteira limpa com sucesso!", "🧹");

        // Limpa na nuvem se autenticado
        try {
          const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
          if (cliente) {
            cliente.auth.getSession().then(({ data }) => {
              if (data?.session?.user) {
                cliente.from('carteira_apostas').delete().eq('user_id', data.session.user.id).then();
              }
            });
          }
        } catch (e) {}
      };

      if (typeof abrirModalDialog === 'function') {
        abrirModalDialog("Deseja realmente apagar todos os bilhetes registrados na carteira?", acaoLimpar);
      } else if (confirm("Deseja realmente apagar todos os bilhetes registrados na carteira?")) {
        acaoLimpar();
      }
    }

    async function sincronizarCarteiraNuvem(notificar = false) {
      const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
      let accountId = null;

      if (cliente) {
        try {
          const { data: sessaoData } = await cliente.auth.getSession();
          if (sessaoData?.session?.user?.id) {
            accountId = sessaoData.session.user.id;
          }
        } catch (_) {}
      }

      // Se for apenas visitante sem nenhuma conta ou VIP definido, mantém local
      if (!accountId) {
        if (notificar && typeof toast === 'function') {
          toast('Entre na sua conta para sincronizar seus jogos.', '🔒');
        }
        return;
      }

      if (!cliente) {
        if (notificar && typeof toast === 'function') {
          toast('⚠️ Configuração do banco Supabase não inicializada.', '⚠️');
        }
        return;
      }

      try {
        if (notificar && typeof toast === 'function') {
          toast('🔄 Conectando ao banco de dados na nuvem...', '☁️');
        }

        // 1. Busca apostas salvas na nuvem para este usuário / conta
        const { data: apostasNuvem, error } = await cliente
          .from('carteira_apostas')
          .select('*')
          .eq('user_id', accountId);

        if (error) {
          console.warn('[Banco] Erro ao consultar carteira_apostas:', error);
          if (notificar && typeof toast === 'function') {
            toast(`⚠️ Erro no banco de dados: ${error.message || 'Tabela em manutenção'}`, '⚠️');
          }
          return;
        }

        let local = Array.isArray(window.carteiraJogos) ? window.carteiraJogos : (JSON.parse(localStorage.getItem('loterias_carteira_db') || '[]'));
        const mapExistentes = new Map();
        local.forEach(b => mapExistentes.set(String(b.id), b));

        let novasDaNuvem = 0;
        (apostasNuvem || []).forEach(remota => {
          const idStr = String(remota.bilhete_id);
          if (!mapExistentes.has(idStr)) {
            local.push({
              id: remota.bilhete_id,
              modalidade: remota.modalidade,
              nome: remota.nome,
              dezenas: remota.dezenas,
              data: remota.data,
              concursoAlvo: remota.concurso_alvo,
              custo: Number(remota.custo || 5),
              premioGanho: Number(remota.premio_ganho || 0),
              conferido: remota.conferido,
              status: remota.status,
              registradoComoJogado: remota.registrado_como_jogado,
              dataRegistro: remota.data_registro
            });
            mapExistentes.set(idStr, local[local.length - 1]);
            novasDaNuvem++;
          }
        });

        // 2. Envia apostas locais que ainda não subiram para a nuvem
        const idsRemotos = new Set((apostasNuvem || []).map(r => String(r.bilhete_id)));
        const pendentesNuvem = local.filter(b => !idsRemotos.has(String(b.id)));

        if (pendentesNuvem.length > 0) {
          const payload = pendentesNuvem.map(b => ({
            user_id: accountId,
            bilhete_id: String(b.id),
            modalidade: b.modalidade || 'megasena',
            nome: b.nome || 'Aposta',
            dezenas: b.dezenas || [],
            data: b.data || '',
            concurso_alvo: b.concursoAlvo || '',
            custo: Number(b.custo || 5),
            premio_ganho: Number(b.premioGanho || 0),
            conferido: Boolean(b.conferido),
            status: b.status || 'Aguardando sorteio',
            registrado_como_jogado: Boolean(b.registradoComoJogado)
          }));

          const { error: upsertErr } = await cliente.from('carteira_apostas').upsert(payload, { onConflict: 'user_id,bilhete_id' });
          if (upsertErr) {
            console.warn('[Banco] Erro no upsert de apostas:', upsertErr);
          }
        }

        carteiraJogos = local;
        window.carteiraJogos = local;
        const chaveAtiva = obterChaveStorageCarteira();
        localStorage.setItem(chaveAtiva, JSON.stringify(local));
        if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();

        if (notificar && typeof toast === 'function') {
          if (novasDaNuvem > 0) {
            toast(`☁️ ${novasDaNuvem} aposta(s) sincronizada(s) da sua conta!`, '☁️');
          } else {
            toast(`✅ Banco de Dados Atualizado: ${local.length} apostas sincronizadas com sua conta.`, '🎯');
          }
        }
      } catch (err) {
        console.warn('[Banco] Falha de conexão com a base de dados:', err);
        if (notificar && typeof toast === 'function') {
          toast('⚠️ Banco de dados em pausa por inatividade. Reative o projeto no painel do Supabase.', '⚠️');
        }
      }
    }

    function aplicarOrcamentoInteligente(valor) {
      const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
      tocarSomNasa('beep');

      if (mod === 'megasena') {
        if (valor <= 15) {
          setQtdJogosParaGerar(3);
          mudarAba('volante');
          gerarApostaNasaComMatriz4x4();
          toast(`🎯 3 apostas simples geradas.`, '💰');
        } else if (valor <= 30) {
          mudarAba('fechamentos');
          const select = document.getElementById('select-tipo-fechamento');
          if (select) {
            select.value = 'mega-12-quadra';
            atualizarResumoFechamento();
          }
          toast(`🎯 Fechamento 12 Dezenas (Quadra) ativado!`, '💰');
        } else if (valor <= 50) {
          setQtdJogosParaGerar(5);
          mudarAba('volante');
          gerarApostaNasaComMatriz4x4();
          toast(`🎯 5 apostas equilibradas geradas!`, '💰');
        } else {
          mudarAba('fechamentos');
          const select = document.getElementById('select-tipo-fechamento');
          if (select) {
            select.value = 'mega-10-quina';
            atualizarResumoFechamento();
          }
          toast(`🎯 Orçamento VIP: Fechamento 10 Dezenas (Quina) ativado!`, '💰');
        }
      } else {
        if (valor <= 15) {
          setQtdJogosParaGerar(5);
          mudarAba('volante');
          gerarApostaNasaComMatriz4x4();
          toast(`🎯 5 apostas Lotofácil geradas!`, '💰');
        } else if (valor <= 24) {
          mudarAba('fechamentos');
          const select = document.getElementById('select-tipo-fechamento');
          if (select) {
            select.value = 'loto-17-14';
            atualizarResumoFechamento();
          }
          toast(`🎯 Fechamento 17 Dezenas (14 Pontos) ativado!`, '💰');
        } else if (valor <= 48) {
          mudarAba('fechamentos');
          const select = document.getElementById('select-tipo-fechamento');
          if (select) {
            select.value = 'loto-16-total';
            atualizarResumoFechamento();
          }
          toast(`🎯 Fechamento Total 16 Dezenas ativado!`, '💰');
        } else {
          mudarAba('fechamentos');
          const select = document.getElementById('select-tipo-fechamento');
          if (select) {
            select.value = 'loto-18-14';
            atualizarResumoFechamento();
          }
          toast(`🎯 Fechamento 18 Dezenas (14 Pontos) ativado!`, '💰');
        }
      }
    }

    // conferirTodosBilhetesSalvos() vive em js/conferencia-real.js:
    // consulta o resultado oficial da Caixa referente à DATA de cada bilhete.
    // A versão antiga comparava todos os bilhetes com um concurso fixo de
    // 28/11/2024 e podia declarar prêmio para um sorteio que não era o do
    // bilhete.

    function exportarBackupJSON() {
      tocarBeep('click');
      const dados = { carteiraJogos, baseConcursosMega, baseConcursosLoto, timestamp: Date.now() };
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loterias_nasa_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Backup JSON exportado com sucesso!", "💾");
    }

    function importarBackupJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importado = JSON.parse(e.target.result);
          if (importado.carteiraJogos) carteiraJogos = importado.carteiraJogos;
          if (importado.baseConcursosMega) baseConcursosMega = importado.baseConcursosMega;
          if (importado.baseConcursosLoto) baseConcursosLoto = importado.baseConcursosLoto;
          salvarCarteiraStorage();
          renderizarTelaCompleta();
          toast("Backup JSON restaurado com sucesso!", "✅");
          tocarBeep('success');
        } catch (err) {
          toast("Erro ao ler o arquivo JSON.", "🚫");
          tocarBeep('alert');
        }
      };
      reader.readAsText(file);
    }

    function copiarParaLoteriasCaixa() {
      if (carteiraJogos.length === 0) { toast("Carteira vazia!", "⚠️"); tocarBeep('alert'); return; }
      const txt = carteiraJogos.map(b => b.dezenas.map(d => String(d).padStart(2,'0')).join(', ')).join('\n');
      
      const temp = document.createElement('textarea');
      temp.value = txt;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      
      tocarBeep('success');
      toast("Jogos copiados para a Área de Transferência!", "📋");
    }

    function exportarParaWhatsApp() {
      if (carteiraJogos.length === 0) { toast("Carteira vazia!", "⚠️"); tocarBeep('alert'); return; }
      let txt = `🎰 *Meus Jogos Registrados (Meu Volante PRO)*\n\n`;
      carteiraJogos.forEach((b, idx) => {
        txt += `*Jogo ${idx+1} (${b.modalidade.toUpperCase()}):*\n${b.dezenas.map(d => String(d).padStart(2,'0')).join(' - ')}\n\n`;
      });
      txt += `━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `🎯 *Auditado via Meu Volante PRO*\n`;
      txt += `🔗 *Audite seu jogo grátis:* https://vitoriobergamobrazil.github.io/loterias-nasa-pro/\n`;
      window.abrirWhatsApp({ texto: txt });
    }

    function abrirLinkOficialCaixa() {
      window.open('https://www.loteriasonline.caixa.gov.br/silce-web/#/home', '_blank');
    }

    // RADAR DO CICLO DAS DEZENAS
    function calcularCicloDezenas() {
      const config = getConfigAtual();
      const base = getBaseAtual();
      const total = config.totalNumeros; // 60 ou 25
      const sorteadas = new Set();

      for (let c of base) {
        c.dezenas.forEach(d => sorteadas.add(d));
        if (sorteadas.size === total) break;
      }

      const faltantes = [];
      for (let i = 1; i <= total; i++) {
        if (!sorteadas.has(i)) faltantes.push(i);
      }

      if (faltantes.length === 0) {
        const recentes = new Set();
        base.slice(0, modalidadeAtual === 'megasena' ? 6 : 3).forEach(c => c.dezenas.forEach(d => recentes.add(d)));
        for (let i = 1; i <= total; i++) {
          if (!recentes.has(i)) faltantes.push(i);
        }
      }

      return {
        total,
        sorteadas: total - faltantes.length,
        faltantes: faltantes.sort((a, b) => a - b)
      };
    }

    function renderizarCicloDezenas() {
      const dados = calcularCicloDezenas();
      const sorteadasEl = document.getElementById('ciclo-sorteadas-count');
      const faltantesEl = document.getElementById('ciclo-faltantes-count');
      const gridEl = document.getElementById('ciclo-dezenas-faltantes-grid');
      const badgeEl = document.getElementById('badge-status-ciclo');
      if (!sorteadasEl || !faltantesEl || !gridEl) return;

      sorteadasEl.innerText = `${dados.sorteadas} / ${dados.total}`;
      faltantesEl.innerText = `${dados.faltantes.length} dezenas`;
      if (badgeEl) {
        badgeEl.innerText = dados.faltantes.length === 0 ? 'Ciclo Concluído' : `Faltam ${dados.faltantes.length} dezenas`;
      }

      const jogoAtual = getJogoAtual();
      gridEl.innerHTML = dados.faltantes.map(num => {
        const marcada = jogoAtual.includes(num);
        return `
          <button type="button" onclick="clicarNumeroVolante(${num}); renderizarCicloDezenas();" class="px-2 py-1 rounded-lg text-xs font-mono font-bold border transition active:scale-95 flex items-center gap-1 ${marcada ? 'bg-emerald-600 text-slate-950 border-emerald-400 shadow' : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border-slate-800'}">
            <span>${String(num).padStart(2, '0')}</span>
            <span class="text-[9px]">${marcada ? '✓' : '+'}</span>
          </button>
        `;
      }).join('');
    }

    function incluirDezenasCicloNoJogo() {
      const dados = calcularCicloDezenas();
      if (dados.faltantes.length === 0) {
        toast("Todas as dezenas já participaram deste ciclo!", "ℹ️");
        return;
      }
      const config = getConfigAtual();
      let jogo = getJogoAtual();
      let adicionados = 0;
      for (let num of dados.faltantes) {
        if (!jogo.includes(num) && jogo.length < config.minNumeros) {
          jogo.push(num);
          adicionados++;
        }
      }
      jogo.sort((a, b) => a - b);
      setJogoAtual(jogo);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      renderizarCicloDezenas();
      tocarBeep('success');
      toast(`${adicionados} dezenas do ciclo adicionadas ao seu volante!`, "🎯");
    }

    function renderizarMapaCalor() {
      const config = getConfigAtual();
      const base = getBaseAtual();
      const grid = document.getElementById('grid-mapa-calor');
      const rankingQuentesEl = document.getElementById('ranking-pedras-quentes');
      const rankingFriasEl = document.getElementById('ranking-pedras-frias');
      if (!grid) return;

      // Sem histórico oficial toda dezena teria frequência zero, e um mapa
      // de calor uniforme passaria a impressão de análise feita.
      if (!base || base.length === 0) {
        const aviso = `
          <div class="col-span-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-sans text-center space-y-2">
            <div>Sincronizando concursos oficiais da Caixa Econômica Federal...</div>
            <button type="button" onclick="window.historico.carregar()" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-slate-950 font-black text-xs">
              🔄 Sincronizar Agora
            </button>
          </div>`;
        grid.className = 'grid grid-cols-1';
        grid.innerHTML = aviso;
        if (rankingQuentesEl) rankingQuentesEl.innerHTML = aviso;
        if (rankingFriasEl) rankingFriasEl.innerHTML = aviso;
        return;
      }

      renderizarCicloDezenas();

      grid.innerHTML = '';
      grid.className = modalidadeAtual === 'megasena' ? 'grid grid-cols-6 sm:grid-cols-10 gap-1.5 font-mono' : 'grid grid-cols-5 gap-2 max-w-xs mx-auto font-mono';

      const freq = {};
      const atraso = {};
      for (let i = 1; i <= config.totalNumeros; i++) {
        freq[i] = 0;
        atraso[i] = base.length; // se não apareceu nos concursos recentes
      }

      base.forEach((c, idxConcurso) => {
        c.dezenas.forEach(d => {
          if (freq[d] !== undefined) {
            freq[d]++;
            if (atraso[d] === base.length) {
              atraso[d] = idxConcurso; // distância em concursos do último sorteio
            }
          }
        });
      });

      const maxFreq = Math.max(...Object.values(freq), 1);
      const minFreq = Math.min(...Object.values(freq), 0);

      // Ranking Top 10 Pedras Mais Sorteadas (Quentes)
      const ordenadosFreq = Object.keys(freq).map(Number).sort((a, b) => freq[b] - freq[a]);
      const top10Quentes = ordenadosFreq.slice(0, 10);

      if (rankingQuentesEl) {
        rankingQuentesEl.innerHTML = top10Quentes.map((num, rank) => `
          <div class="p-2 rounded-xl bg-slate-950 border border-emerald-800/60 flex flex-col items-center">
            <span class="text-[8px] text-emerald-400 font-bold">#${rank + 1}</span>
            <span class="text-xs font-black text-white my-0.5">${String(num).padStart(2, '0')}</span>
            <span class="text-[9px] text-emerald-300 font-bold">${freq[num]}x</span>
          </div>
        `).join('');
      }

      // Ranking Top 10 Pedras Mais Atrasadas (Frias)
      const ordenadosAtraso = Object.keys(atraso).map(Number).sort((a, b) => atraso[b] - atraso[a]);
      const top10Frias = ordenadosAtraso.slice(0, 10);

      if (rankingFriasEl) {
        rankingFriasEl.innerHTML = top10Frias.map((num, rank) => `
          <div class="p-2 rounded-xl bg-slate-950 border border-blue-900/60 flex flex-col items-center">
            <span class="text-[8px] text-cyan-400 font-bold">#${rank + 1}</span>
            <span class="text-xs font-black text-white my-0.5">${String(num).padStart(2, '0')}</span>
            <span class="text-[9px] text-cyan-300 font-bold">${atraso[num]} conc.</span>
          </div>
        `).join('');
      }

      // Grade Térmica de Todas as Dezenas
      const jogoAtual = getJogoAtual();
      for (let i = 1; i <= config.totalNumeros; i++) {
        const count = freq[i];
        const ratio = (count - minFreq) / (maxFreq - minFreq || 1);
        const estaMarcada = jogoAtual.includes(i);

        let corFundo = 'bg-slate-950';
        let corBorda = 'border-slate-800';
        let corBadge = 'text-slate-400';

        if (ratio >= 0.70) {
          corFundo = 'bg-rose-950/60';
          corBorda = 'border-rose-600/70';
          corBadge = 'text-rose-300 font-bold';
        } else if (ratio >= 0.40) {
          corFundo = 'bg-amber-950/50';
          corBorda = 'border-amber-600/60';
          corBadge = 'text-amber-300 font-bold';
        } else {
          corFundo = 'bg-cyan-950/40';
          corBorda = 'border-cyan-800/50';
          corBadge = 'text-cyan-400';
        }

        if (estaMarcada) {
          corBorda = 'border-emerald-400 ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]';
        }

        const box = document.createElement('button');
        box.type = 'button';
        box.onclick = () => {
          clicarNumeroVolante(i);
          renderizarMapaCalor();
        };
        box.className = `p-1.5 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 active:scale-95 ${corFundo} ${corBorda}`;
        box.innerHTML = `
          <span class="text-xs font-black ${estaMarcada ? 'text-emerald-400 flex items-center justify-center gap-0.5' : 'text-white'}">
            ${String(i).padStart(2, '0')}
            ${estaMarcada ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>' : ''}
          </span>
          <span class="text-[9px] ${corBadge} mt-0.5">${count}x</span>
        `;
        grid.appendChild(box);
      }
    }

    function carregarPedrasMaisQuentesNoVolante() {
      const config = getConfigAtual();
      const base = getBaseAtual();

      // Sem histórico, "mais quentes" seria só as primeiras dezenas da lista:
      // preencher o volante com isso passaria por recomendação estatística.
      if (!base || base.length === 0) {
        toast('Histórico oficial ainda não sincronizado — sem dados de frequência.', '⚠️');
        tocarBeep('alert');
        return;
      }

      const freq = {};
      for (let i = 1; i <= config.totalNumeros; i++) freq[i] = 0;
      base.forEach(c => {
        c.dezenas.forEach(d => {
          if (freq[d] !== undefined) freq[d]++;
        });
      });
      const ordenados = Object.keys(freq).map(Number).sort((a, b) => freq[b] - freq[a]);
      const k = modalidadeAtual === 'megasena' ? qtdDesejadaMega : qtdDesejadaLoto;
      const topK = ordenados.slice(0, k).sort((a, b) => a - b);

      setJogoAtual([...topK]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      mudarAba('volante');
      toast(`Top ${k} pedras mais frequentes carregadas no volante!`, "🔥");
    }

function executarDesdobramento() {
      tocarBeep('success');
      const config = getConfigAtual();
      const tipoId = document.getElementById('select-tipo-fechamento').value;
      const fechamento = config.fechamentos.find(f => f.id === tipoId);
      const fixos = getFixos();
      const proibidos = getProibidos();

      const grupo = new Set(fixos);
      while (grupo.size < fechamento.n) {
        const n = Math.floor(Math.random() * config.totalNumeros) + 1;
        if (!proibidos.includes(n)) grupo.add(n);
      }
      const dezenasGrupo = Array.from(grupo).sort((a,b)=>a-b);

      jogosFechamentoGerados = [];
      const k = modalidadeAtual === 'megasena' ? 6 : 15;

      for (let i = 0; i < fechamento.jogos; i++) {
        const jogoCartao = new Set(fixos);
        const disponiveis = dezenasGrupo.filter(x => !jogoCartao.has(x));
        while (jogoCartao.size < k) {
          const rand = disponiveis[Math.floor(Math.random() * disponiveis.length)];
          jogoCartao.add(rand);
        }
        jogosFechamentoGerados.push(Array.from(jogoCartao).sort((a,b)=>a-b));
      }

      const container = document.getElementById('resultado-fechamento-container');
      const lista = document.getElementById('lista-jogos-fechamento');
      container.classList.remove('hidden');
      document.getElementById('fechamento-qtd-info').innerText = `${fechamento.jogos} Jogos Gerados (Total: ${formatarReais(fechamento.jogos * config.precoBase)})`;

      lista.innerHTML = jogosFechamentoGerados.map((j, idx) => `
        <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
          <span class="font-bold text-slate-400">#${idx + 1}</span>
          <div class="flex gap-1">
            ${j.map(d => `<span class="w-5 h-5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center">${String(d).padStart(2,'0')}</span>`).join('')}
          </div>
        </div>
      `).join('');

      toast(`Fechamento gerado com sucesso!`, "🧮");
    }

    function salvarTodosFechamento() {
      if (typeof window.exigirLeadAntesDeSalvar === 'function' && !window.exigirLeadAntesDeSalvar()) {
        return;
      }
      if (jogosFechamentoGerados.length === 0) return;
      const config = getConfigAtual();
      jogosFechamentoGerados.forEach(j => {
        carteiraJogos.unshift({
          id: Date.now() + Math.random(),
          modalidade: modalidadeAtual,
          dezenas: j,
          data: new Date().toLocaleDateString('pt-BR'),
          custo: config.precoBase,
          premioGanho: 0,
          conferido: false,
          status: 'Pendente'
        });
      });
      salvarCarteiraStorage();
      atualizarPainelCarteira();
      tocarBeep('success');
      toast(`${jogosFechamentoGerados.length} bilhetes salvos na Carteira!`, "💾");
    }

    // Busca o último concurso REAL da Caixa. A versão anterior sorteava as
    // dezenas com Math.random() e inseria o resultado inventado no topo da
    // base como se fosse o sorteio mais recente.
    async function sincronizarConcursos() {
      const icon = document.getElementById('sync-icon');
      if (icon) icon.classList.add('animate-spin');
      toast('Buscando último resultado na Caixa...', '🔄');

      try {
        const resultado = await obterUltimoResultadoOficial(modalidadeAtual);

        if (!resultado) {
          toast('Resultado indisponível agora. Tente novamente.', '⚠️');
          tocarBeep('alert');
          return;
        }

        const base = getBaseAtual();
        const jaTemos = base.some(c => c.concurso === resultado.concurso);

        if (!jaTemos) {
          base.unshift(montarRegistroConcurso(resultado));
          if (typeof salvarCacheHistorico === 'function') {
            salvarCacheHistorico({ megasena: baseConcursosMega, lotofacil: baseConcursosLoto });
          }
          if (typeof atualizarUltimoResultadoHome === 'function') atualizarUltimoResultadoHome();
          if (typeof atualizarProvaDosFatosRedesign === 'function') atualizarProvaDosFatosRedesign();
          if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();
          if (typeof rerenderizarAnalises === 'function') rerenderizarAnalises();
        }

        await conferirTodosBilhetesSalvos();
        tocarBeep('success');
        toast(
          jaTemos
            ? `Concurso #${resultado.concurso} já era o mais recente. Carteira conferida!`
            : `Concurso #${resultado.concurso} (${resultado.data}) sincronizado!`,
          '✅'
        );
      } catch (err) {
        console.error('Falha ao sincronizar concursos:', err);
        toast('Não foi possível sincronizar agora.', '⚠️');
        tocarBeep('alert');
      } finally {
        if (icon) icon.classList.remove('animate-spin');
      }
    }

    function obterTodosJogosDisponiveis() {
      const lista = [];
      const jogoAtual = getJogoAtual();
      const minDez = getConfigAtual().minDezenas;
      
      if (jogoAtual && jogoAtual.length >= minDez) {
        lista.push({
          origem: 'volante',
          titulo: 'Jogo do Volante',
          dezenas: [...jogoAtual],
          modalidade: modalidadeAtual
        });
      }

      if (loteApostasGeradas && loteApostasGeradas.length > 0) {
        loteApostasGeradas.forEach((ap, idx) => {
          lista.push({
            origem: 'lote',
            titulo: `Lote #${ap.id || idx + 1}`,
            dezenas: [...ap.dezenas],
            modalidade: modalidadeAtual
          });
        });
      }

      if (carteiraJogos && carteiraJogos.length > 0) {
        carteiraJogos.forEach((c, idx) => {
          lista.push({
            origem: 'carteira',
            titulo: `Carteira #${idx + 1} (${c.data})`,
            dezenas: [...c.dezenas],
            modalidade: c.modalidade || modalidadeAtual,
            id: c.id
          });
        });
      }

      if (lista.length === 0) {
        lista.push({
          origem: 'volante',
          titulo: 'Jogo Padrão',
          dezenas: [...jogoAtual],
          modalidade: modalidadeAtual
        });
      }

      return lista;
    }

    function renderizarBarraJogosTesteRapido() {
      const container = document.getElementById('barra-jogos-teste-rapido');
      const botoesEl = document.getElementById('botoes-jogos-teste-rapido');
      const badgeEl = document.getElementById('badge-contador-jogos-teste');
      if (!container || !botoesEl) return;

      const jogos = obterTodosJogosDisponiveis();
      if (badgeEl) badgeEl.innerText = `${jogos.length} jogo${jogos.length > 1 ? 's' : ''} para testar`;

      const jogoAtualStr = getJogoAtual().join('-');

      botoesEl.innerHTML = jogos.map((j, idx) => {
        const ativo = j.dezenas.join('-') === jogoAtualStr;
        const cor = ativo 
          ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-500/30' 
          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700';
        return `
          <button type="button" onclick="carregarJogoRapidoNoVolante(${idx})" class="px-2.5 py-1 rounded-lg border text-[10px] whitespace-nowrap transition flex items-center gap-1 shrink-0 ${cor}">
            <span>${j.origem === 'volante' ? '🎯' : (j.origem === 'lote' ? '⚡' : '💼')}</span>
            <span class="font-bold">${j.titulo}</span>
            <span class="text-[9px] opacity-75 font-mono">[${j.dezenas.slice(0, 3).map(d=>String(d).padStart(2,'0')).join(' ')}...]</span>
          </button>
        `;
      }).join('');
    }

    function carregarJogoRapidoNoVolante(idx) {
      const jogos = obterTodosJogosDisponiveis();
      if (!jogos[idx]) return;
      const j = jogos[idx];
      if (j.modalidade && j.modalidade !== modalidadeAtual) {
        trocarModalidade(j.modalidade);
      }
      setJogoAtual([...j.dezenas]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      renderizarBarraJogosTesteRapido();
      renderizarLoteApostas();
      tocarBeep('click');
      vibrarHaptico(15);
      toast(`${j.titulo} carregado no Volante!`, "🎯");
    }

    function renderizarTelaAuditoria(jogoAlvo = null, tituloAlvo = null) {
      const jogos = obterTodosJogosDisponiveis();
      if (jogos.length === 0) return;

      let jogoSelecionado = jogoAlvo;
      let tituloSelecionado = tituloAlvo;

      if (!jogoSelecionado) {
        if (jogoAuditoriaAtivo && jogoAuditoriaAtivo.dezenas) {
          jogoSelecionado = jogoAuditoriaAtivo.dezenas;
          tituloSelecionado = jogoAuditoriaAtivo.titulo;
        } else {
          const primeiro = jogos[0];
          jogoSelecionado = primeiro.dezenas;
          tituloSelecionado = primeiro.titulo;
          jogoAuditoriaAtivo = { dezenas: [...jogoSelecionado], titulo: tituloSelecionado, modalidade: primeiro.modalidade };
        }
      } else {
        jogoAuditoriaAtivo = { dezenas: [...jogoSelecionado], titulo: tituloSelecionado || 'Jogo Selecionado', modalidade: modalidadeAtual };
      }

      // 1. Seletor de Jogos 1 a 1 no topo
      const seletorEl = document.getElementById('seletor-jogos-auditoria');
      if (seletorEl) {
        const jogoStr = jogoSelecionado.join('-');
        const botoesJogos = jogos.map((j, idx) => {
          const ativo = j.dezenas.join('-') === jogoStr;
          const icone = j.origem === 'volante' ? '🎯' : (j.origem === 'lote' ? '⚡' : '💼');
          const estilo = ativo 
            ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-500/20' 
            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700';
          return `
            <button type="button" onclick="selecionarJogoAuditoria(${idx})" class="px-2.5 py-1.5 rounded-xl border text-xs transition flex items-center gap-1.5 ${estilo}">
              <span>${icone}</span>
              <span class="font-bold font-sans">${j.titulo}</span>
              <span class="text-[9px] opacity-75 font-mono font-bold">(${j.dezenas.length} nºs)</span>
            </button>
          `;
        }).join('');

        const estaRodando = !!testeSequencialInterval;
        const btnAuto = `
          <button type="button" id="btn-teste-auto-1a1" onclick="alternarTesteAuto1a1()" class="px-3 py-1.5 rounded-xl ${estaRodando ? 'bg-rose-600 text-white animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 hover:brightness-110'} text-xs font-black font-mono shadow active:scale-95 transition flex items-center gap-1.5 ml-auto">
            <span id="icone-btn-auto">${estaRodando ? '⏹️' : '▶️'}</span>
            <span id="texto-btn-auto">${estaRodando ? 'Parar Teste' : 'Testar 1 a 1 Auto'}</span>
          </button>
        `;

        seletorEl.innerHTML = botoesJogos + btnAuto;
      }

      // 2. Avaliação do Jogo
      const analise = avaliarJogo(jogoSelecionado, jogoAuditoriaAtivo.modalidade || modalidadeAtual);

      const labelEl = document.getElementById('label-auditoria-jogo-ativo');
      if (labelEl) labelEl.innerText = tituloSelecionado || 'Jogo Selecionado';

      const badgeScoreEl = document.getElementById('badge-score-auditoria');
      if (badgeScoreEl) {
        badgeScoreEl.innerText = `${rotuloIndicadores(analise)}`;
        badgeScoreEl.className = analise.aprovadosCount === 6 
          ? 'text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800' 
          : 'text-[10px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800';
      }

      const dezenasEl = document.getElementById('dezenas-jogo-auditoria');
      if (dezenasEl) {
        dezenasEl.innerHTML = jogoSelecionado.map(d => `
          <span class="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center border border-slate-700 shadow-sm">${String(d).padStart(2, '0')}</span>
        `).join('');
      }

      // Atualiza os 6 Cards principais de telemetria
      analise.testes.forEach((t, i) => {
        const valEl = document.getElementById(`audit-val-t${i+1}`);
        const badgeEl = document.getElementById(`audit-badge-t${i+1}`);
        if (valEl) valEl.innerText = t.v;
        if (badgeEl) {
          badgeEl.innerText = t.s;
          badgeEl.className = t.s !== 'Alerta'
            ? 'text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-800'
            : 'text-[9px] px-1.5 py-0.5 rounded font-bold bg-rose-950 text-rose-400 border border-rose-800';
        }
      });

      // 3. Renderiza o comparativo de todos os jogos
      const listaComparativoEl = document.getElementById('lista-todos-jogos-auditoria');
      const badgeTotalEl = document.getElementById('badge-total-jogos-auditados');
      if (badgeTotalEl) badgeTotalEl.innerText = `${jogos.length} jogos avaliados`;

      if (listaComparativoEl) {
        const jogoStr = jogoSelecionado.join('-');
        const nomesTestes = ['1º Seq & Finais', '2º Shannon', '3º Qui-Quadrado', '4º Paridade & Primos', '5º Normal Soma', '6º Hipergeométrica'];

        listaComparativoEl.innerHTML = jogos.map((j, idx) => {
          const analiseItem = avaliarJogo(j.dezenas, j.modalidade || modalidadeAtual);
          const ativo = j.dezenas.join('-') === jogoStr;
          const border = ativo ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500' : 'border-slate-800 bg-slate-950/80';

          return `
            <div class="p-3 rounded-2xl border ${border} space-y-2.5 transition">
              <div class="flex justify-between items-center flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-white">${j.titulo}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${analiseItem.aprovadosCount === 6 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
                    ${rotuloIndicadores(analiseItem)}
                  </span>
                  ${ativo ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">● Auditando</span>' : ''}
                </div>
                <div class="flex items-center gap-1.5">
                  <button type="button" onclick="selecionarJogoAuditoria(${idx})" class="px-2 py-1 ${ativo ? 'bg-cyan-600 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold'} text-[10px] rounded-lg border border-slate-700 transition">
                    🔬 Testar 1 a 1
                  </button>
                  <button type="button" onclick="carregarJogoParaVolanteEAuditar(${idx})" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded-lg border border-slate-700 transition">
                    🎯 No Volante
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap gap-1">
                ${j.dezenas.map(d => `<span class="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-[11px] flex items-center justify-center border border-slate-700">${String(d).padStart(2, '0')}</span>`).join('')}
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                ${analiseItem.testes.map((t, tIdx) => `
                  <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5 text-[9px]">
                    <div class="flex justify-between items-center">
                      <span class="text-slate-400 font-bold">${nomesTestes[tIdx]}</span>
                      <span class="font-bold ${t.s !== 'Alerta' ? 'text-emerald-400' : 'text-rose-400'}">${t.s}</span>
                    </div>
                    <div class="text-white text-[9px] truncate">${t.v}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    function selecionarJogoAuditoria(idx) {
      const jogos = obterTodosJogosDisponiveis();
      if (!jogos[idx]) return;
      const j = jogos[idx];
      jogoAuditoriaAtivo = { dezenas: [...j.dezenas], titulo: j.titulo, modalidade: j.modalidade || modalidadeAtual };
      renderizarTelaAuditoria(j.dezenas, j.titulo);
      tocarBeep('click');
      vibrarHaptico(15);
    }

    function carregarJogoParaVolanteEAuditar(idx) {
      const jogos = obterTodosJogosDisponiveis();
      if (!jogos[idx]) return;
      const j = jogos[idx];
      if (j.modalidade && j.modalidade !== modalidadeAtual) {
        trocarModalidade(j.modalidade);
      }
      setJogoAtual([...j.dezenas]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      mudarAba('volante');
      toast(`${j.titulo} carregado no Volante!`, "🎯");
    }

    function testarJogoNaAuditoria(dezenas, titulo, mod = modalidadeAtual) {
      if (mod && mod !== modalidadeAtual) trocarModalidade(mod);
      setJogoAtual([...dezenas]);
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      mudarAba('volante');

      const elBateria = document.getElementById('conteudo-bateria-testes');
      const setaBateria = document.getElementById('seta-bateria-testes');
      if (elBateria && elBateria.classList.contains('hidden')) {
        elBateria.classList.remove('hidden');
        if (setaBateria) setaBateria.innerText = '⯆';
      }

      const elSim = document.getElementById('conteudo-simulador-historico');
      const setaSim = document.getElementById('seta-simulador-historico');
      if (elSim && elSim.classList.contains('hidden')) {
        elSim.classList.remove('hidden');
        if (setaSim) setaSim.innerText = '⯆';
      }

      tocarBeep('success');
      toast(`${titulo || 'Jogo'} carregado no Volante & Telemetria!`, "🎯");
    }

    function testarJogoNaAuditoriaCarteira(id) {
      carregarBilheteNoVolante(id);
    }

    function alternarTesteAuto1a1() {
      if (testeSequencialInterval) {
        pararTesteSequencialAutomatico();
        return;
      }
      const jogos = obterTodosJogosDisponiveis();
      if (jogos.length <= 1) {
        toast("Gere ou adicione mais apostas para testar em sequência!", "⚠️");
        return;
      }

      let idxAtual = 0;
      if (jogoAuditoriaAtivo && jogoAuditoriaAtivo.dezenas) {
        const s = jogoAuditoriaAtivo.dezenas.join('-');
        const i = jogos.findIndex(j => j.dezenas.join('-') === s);
        if (i !== -1) idxAtual = i;
      }

      tocarBeep('success');
      toast("Iniciando bateria 1 a 1 de todos os jogos...", "🔬");

      testeSequencialInterval = setInterval(() => {
        idxAtual = (idxAtual + 1) % jogos.length;
        selecionarJogoAuditoria(idxAtual);
      }, 1400);

      renderizarTelaAuditoria();
    }

    function pararTesteSequencialAutomatico() {
      if (testeSequencialInterval) {
        clearInterval(testeSequencialInterval);
        testeSequencialInterval = null;
      }
      renderizarTelaAuditoria();
      toast("Teste sequencial pausado.", "⏸️");
    }

    function alternarDetalhesLote(idx) {
      loteDetalhesAbertos[idx] = !loteDetalhesAbertos[idx];
      renderizarLoteApostas();
    }

    function alternarDetalhesCarteira(id) {
      carteiraDetalhesAbertos[id] = !carteiraDetalhesAbertos[id];
      atualizarPainelCarteira();
    }

        function mudarAba(aba) {
          tocarBeep('click');

          // O painel administrativo só existe para uma sessão owner validada.
      if (aba === 'admin') {
        if (!usuarioSessao || usuarioSessao.tipo !== 'master_founder') {
              toast('Área administrativa indisponível para esta conta.', '🔒');
          return;
        }
      }

          abaAtual = aba;

      ['inicio', 'volante', 'fechamentos', 'calor', 'carteira', 'bolao', 'admin'].forEach(a => {
        const el = document.getElementById(`view-${a}`);
        const tab = document.getElementById(`tab-${a}`);
        if (el) el.classList.add('hidden');
        if (tab) {
          if (a === 'admin') {
            tab.className = 'py-1.5 px-0.5 rounded-xl font-bold transition bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 flex items-center justify-center gap-0.5';
          } else {
            tab.className = 'py-1.5 px-0.5 rounded-xl font-bold transition bg-slate-900 text-slate-400 border border-slate-800 hover:text-white flex items-center justify-center gap-0.5 font-mono text-[8px] sm:text-[9px]';
          }
        }
      });

      const elAtivo = document.getElementById(`view-${aba}`);
      const tabAtivo = document.getElementById(`tab-${aba}`);
      if (elAtivo) elAtivo.classList.remove('hidden');

      if (aba === 'admin') {
        if (tabAtivo) tabAtivo.className = 'py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-0.5 font-mono text-[8px] sm:text-[9px] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30';
        renderizarPainelAdmin();
        carregarUsuariosAdminRemotos();
      } else if (aba === 'inicio') {
        if (tabAtivo) tabAtivo.className = 'py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-0.5 font-mono text-[8px] sm:text-[9px] bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow';
        if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();
      } else {
        const cor = modalidadeAtual === 'megasena' ? 'bg-emerald-600 text-slate-950 font-black shadow' : 'bg-purple-600 text-white font-black shadow';
        if (tabAtivo) tabAtivo.className = `py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-0.5 font-mono text-[8px] sm:text-[9px] ${cor}`;
      }
      
      if (aba === 'calor') {
        renderizarMapaCalor();
      } else if (aba === 'carteira') {
        atualizarPainelCarteira();
      } else if (aba === 'bolao') {
        calcularRateioBolao();
      }
    }

function abrirModalDialog(msg, callback) {
      modalCallback = callback;
      document.getElementById('modal-dialog-msg').innerText = msg;
      document.getElementById('modal-dialog').classList.remove('hidden');
    }

    function fecharModalDialog(confirmado) {
      document.getElementById('modal-dialog').classList.add('hidden');
      if (confirmado && typeof modalCallback === 'function') modalCallback();
      modalCallback = null;
    }

    function toast(msg, icon = "⚡") {
      const el = document.getElementById('toast');
      document.getElementById('toast-msg').innerText = msg;
      document.getElementById('toast-icon').innerText = icon;
      el.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
      el.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        el.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
        el.classList.remove('opacity-100', 'translate-y-0');
      }, 3000);
    }
  
    // =========================================================================
    // MOTOR DE FECHAMENTOS COMBINATÓRIOS C(n, k) & AUTO-CALIBRAÇÃO ORBITAL
    // =========================================================================

    const MATRIZES_COMBINATORIAS_NASA = {
      megasena: [
        {
          id: 'mega-10-quadra',
          nome: '10 Dezenas • Combinações reduzidas (3 jogos)',
          n: 10,
          k: 6,
          jogos: 3,
          garantia: 'Cobertura parcial: não garante prêmio',
          economia: 'Menos combinações que o jogo completo, com cobertura menor',
          // Matriz clássica 10-6-4-4
          linhas: [
            [0, 1, 2, 3, 4, 5],
            [0, 1, 2, 6, 7, 8],
            [3, 4, 5, 6, 7, 9]
          ]
        },
        {
          id: 'mega-12-quadra',
          nome: '12 Dezenas • Combinações reduzidas (6 jogos)',
          n: 12,
          k: 6,
          jogos: 6,
          garantia: 'Cobertura parcial: não garante prêmio',
          economia: 'Menos combinações que o jogo completo, com cobertura menor',
          // Matriz clássica 12-6-4-4
          linhas: [
            [0, 1, 2, 3, 4, 5],
            [0, 1, 6, 7, 8, 9],
            [2, 3, 6, 7, 10, 11],
            [4, 5, 8, 9, 10, 11],
            [0, 3, 4, 7, 8, 11],
            [1, 2, 5, 6, 9, 10]
          ]
        },
        {
          id: 'mega-10-quina',
          nome: '10 Dezenas • Combinações reduzidas',
          n: 10,
          k: 6,
          jogos: 14,
          garantia: 'Cobertura parcial: não garante prêmio',
          economia: 'Menos combinações que o jogo completo, com cobertura menor',
          linhas: [
            [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 6, 7], [0, 1, 4, 5, 6, 7],
            [2, 3, 4, 5, 6, 7], [0, 1, 2, 8, 9, 3], [0, 1, 4, 8, 9, 5],
            [0, 1, 6, 8, 9, 7], [2, 3, 4, 8, 9, 5], [2, 3, 6, 8, 9, 7],
            [4, 5, 6, 8, 9, 7], [0, 2, 4, 6, 8, 9], [1, 3, 5, 7, 8, 9],
            [0, 3, 5, 6, 8, 9], [1, 2, 4, 7, 8, 9]
          ]
        }
      ],
      lotofacil: [
        {
          id: 'loto-16-total',
          nome: '16 Dezenas • Desdobramento Total (16-15-15-15)',
          n: 16,
          k: 15,
          jogos: 16,
          garantia: '15 Pontos (apenas se as 15 sorteadas estiverem no grupo)',
          economia: 'Desdobramento oficial de 16 números em 16 bilhetes simples',
          // Exclui cada uma das 16 posições uma por vez
          linhas: Array.from({length: 16}, (_, i) => {
            const linha = [];
            for (let j = 0; j < 16; j++) { if (j !== i) linha.push(j); }
            return linha;
          })
        },
        {
          id: 'loto-17-14',
          nome: '17 Dezenas • Combinações reduzidas',
          n: 17,
          k: 15,
          jogos: 8,
          garantia: 'Cobertura parcial: não garante prêmio',
          economia: 'Menos combinações que o jogo completo, com cobertura menor',
          linhas: [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16],
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 10],
            [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 6, 7],
            [0, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 2, 3],
            [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            [0, 2, 4, 6, 8, 10, 12, 14, 16, 1, 3, 5, 7, 9, 11],
            [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 16]
          ]
        },
        {
          id: 'loto-18-14',
          nome: '18 Dezenas • Combinações reduzidas',
          n: 18,
          k: 15,
          jogos: 24,
          garantia: 'Cobertura parcial: não garante prêmio',
          economia: 'Menos combinações que o jogo completo, com cobertura menor',
          // Amostragem combinatória otimizada 18-15-14-15
          linhas: Array.from({length: 6}, (_, i) => {
            const linha = [];
            const excluidas = [(i * 3) % 18, (i * 3 + 1) % 18, (i * 3 + 2) % 18];
            for (let j = 0; j < 18; j++) {
              if (!excluidas.includes(j)) linha.push(j);
            }
            return linha;
          })
        },
        {
          id: 'loto-20-13',
          nome: '20 Dezenas • Combinações reduzidas',
          n: 20,
          k: 15,
          jogos: 4,
          garantia: 'Cobertura parcial: não garante prêmio',
          economia: 'Apenas 4 jogos para cercar 80% do volante',
          linhas: [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19],
            [0, 1, 2, 3, 4, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
            [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
          ]
        }
      ]
    };

    function carregarOpcoesFechamento() {
      const select = document.getElementById('select-tipo-fechamento');
      if (!select) return;
      const matrizes = MATRIZES_COMBINATORIAS_NASA[modalidadeAtual] || [];
      select.innerHTML = matrizes.map(m => `
        <option value="${m.id}">${m.nome}</option>
      `).join('');
      atualizarResumoFechamento();
    }

    function atualizarResumoFechamento() {
      const select = document.getElementById('select-tipo-fechamento');
      if (!select) return;
      const matrizes = MATRIZES_COMBINATORIAS_NASA[modalidadeAtual] || [];
      const m = matrizes.find(x => x.id === select.value) || matrizes[0];
      if (!m) return;

      const config = getConfigAtual();
      const custoTotal = m.jogos * config.precoBase;

      document.getElementById('matriz-info-dezenas').innerText = `${m.n} dezenas selecionadas`;
      document.getElementById('matriz-info-garantia').innerText = m.garantia;
      document.getElementById('matriz-info-jogos').innerText = `${m.jogos} apostas (${formatarReais(custoTotal)})`;
      document.getElementById('matriz-info-economia').innerText = m.economia;
    }

    function executarDesdobramentoNasa(origem = 'nasa') {
      tocarSomNasa('ignicao');
      vibrarHaptico(25);
      const config = getConfigAtual();
      const select = document.getElementById('select-tipo-fechamento');
      const matrizes = MATRIZES_COMBINATORIAS_NASA[modalidadeAtual] || [];
      const m = matrizes.find(x => x.id === select.value) || matrizes[0];
      if (!m) return;

      let dezenasBase = [];
      const fixos = getFixos();
      const proibidos = getProibidos();

      if (origem === 'volante') {
        dezenasBase = [...getJogoAtual()];
        if (dezenasBase.length < m.n) {
          // Completa com dezenas não proibidas até atingir N
          for (let i = 1; i <= config.totalNumeros; i++) {
            if (!dezenasBase.includes(i) && !proibidos.includes(i)) {
              dezenasBase.push(i);
              if (dezenasBase.length >= m.n) break;
            }
          }
        } else if (dezenasBase.length > m.n) {
          dezenasBase = dezenasBase.slice(0, m.n);
        }
      } else {
        // Gera o grupo de N dezenas usando a Matriz 4x4 da
        const grupo = new Set(fixos);
        const frequencias = calcularFrequenciaHistorica();
        const ordenadas = Object.keys(frequencias).map(Number).sort((a,b) => frequencias[b] - frequencias[a]);
        
        for (const num of ordenadas) {
          if (!proibidos.includes(num)) {
            grupo.add(num);
            if (grupo.size >= m.n) break;
          }
        }
        while (grupo.size < m.n) {
          const rand = Math.floor(Math.random() * config.totalNumeros) + 1;
          if (!proibidos.includes(rand)) grupo.add(rand);
        }
        dezenasBase = Array.from(grupo).sort((a,b)=>a-b);
      }

      // Aplica a matriz combinatória mapeando os índices
      jogosFechamentoGerados = m.linhas.map(linha => {
        const jogo = linha.map(idx => dezenasBase[idx % dezenasBase.length]);
        return Array.from(new Set(jogo)).sort((a,b)=>a-b);
      });

      // Renderiza resultado
      const container = document.getElementById('resultado-fechamento-container');
      const lista = document.getElementById('lista-jogos-fechamento');
      container.classList.remove('hidden');

      const custoTotal = jogosFechamentoGerados.length * config.precoBase;
      document.getElementById('fechamento-qtd-info').innerText = `${jogosFechamentoGerados.length} Apostas Geradas com Sucesso (${formatarReais(custoTotal)})`;
      document.getElementById('fechamento-dezenas-utilizadas').innerText = `Dezenas utilizadas (${dezenasBase.length}): ${dezenasBase.map(d=>String(d).padStart(2,'0')).join(', ')}`;

      lista.innerHTML = jogosFechamentoGerados.map((j, idx) => `
        <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
          <div class="flex items-center gap-2">
            <span class="font-black text-cyan-400 font-mono text-[11px]">#${idx + 1}</span>
            <div class="flex flex-wrap gap-1">
              ${j.map(d => `<span class="w-6 h-6 rounded-lg font-black text-[10px] bg-slate-900 border border-slate-700 text-white flex items-center justify-center">${String(d).padStart(2,'0')}</span>`).join('')}
            </div>
          </div>
          <button type="button" onclick="carregarApostaFechamentoNoVolante(${idx})" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[10px] rounded-lg border border-slate-700 transition" title="Carregar no Volante">
            🎯 Carregar
          </button>
        </div>
      `).join('');

      tocarSomNasa('sucesso');
      toast(`Matriz ${m.nome} gerada com sucesso!`, '🎯');
    }

    function carregarApostaFechamentoNoVolante(idx) {
      if (!jogosFechamentoGerados[idx]) return;
      setJogoAtual([...jogosFechamentoGerados[idx]]);
      mudarAba('volante');
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      tocarSomNasa('beep');
      toast(`Aposta #${idx + 1} carregada no Volante!`, '🎯');
    }

    function copiarFechamentoTxt() {
      if (jogosFechamentoGerados.length === 0) return;
      const texto = jogosFechamentoGerados.map(j => j.map(d => String(d).padStart(2,'0')).join(' ')).join('\n');
      navigator.clipboard.writeText(texto).then(() => {
        tocarSomNasa('beep');
        toast(`${jogosFechamentoGerados.length} apostas copiadas para a Área de Transferência!`, '📋');
      });
    }

    function compartilharFechamentoWhatsapp() {
      if (jogosFechamentoGerados.length === 0) return;
      const config = getConfigAtual();
      const custo = formatarReais(jogosFechamentoGerados.length * config.precoBase);
      let msg = `🎯 *Meu Volante PRO — Fechamento Combinatório*\n`;
      msg += `🎯 *Modalidade:* ${modalidadeAtual.toUpperCase()}\n`;
      msg += `📊 *Total de Apostas:* ${jogosFechamentoGerados.length} (${custo})\n`;
      msg += `📐 *Cobertura Combinatória:* Matriz Otimizada C(n,k)\n\n`;
      jogosFechamentoGerados.slice(0, 10).forEach((j, idx) => {
        msg += `Jogo #${idx + 1}: ${j.map(d=>String(d).padStart(2,'0')).join(' ')}\n`;
      });
      if (jogosFechamentoGerados.length > 10) {
        msg += `... e mais ${jogosFechamentoGerados.length - 10} jogos.\n`;
      }
      msg += `\nGerado com inteligência espacial no Meu Volante PRO.`;
      window.abrirWhatsApp({ texto: msg });
    }

    // =========================================================================
    // AUTO-CALIBRAÇÃO DE JOGO COM IA (1-CLIQUE PARA ALCANÇAR SCORE 100)
    // =========================================================================
    function autoCalibrarJogoComIA() {
      if (!verificarAcessoRecursoVip('Ajuste automático do jogo')) return;
      tocarSomNasa('ignicao');
      vibrarHaptico(30);
      const config = getConfigAtual();
      let jogo = [...getJogoAtual()];
      const fixos = getFixos();
      const proibidos = getProibidos();

      // Itera trocas inteligentes para eliminar alertas e atingir 6/6 testes aprovados
      let melhorJogo = [...jogo];
      let analiseAtual = analisarJogoCompleto(melhorJogo);
      
      if (analiseAtual.aprovadosCount === 6) {
        tocarSomNasa('sucesso');
        toast('Todos os 6 indicadores já estão na faixa comum.', '🌟');
        return;
      }

      for (let ciclo = 0; ciclo < 40; ciclo++) {
        if (analiseAtual.aprovadosCount === 6) break;

        const trocaveis = melhorJogo.filter(n => !fixos.includes(n));
        if (trocaveis.length === 0) break;

        const sai = trocaveis[Math.floor(Math.random() * trocaveis.length)];
        const candidatos = [];
        for (let num = 1; num <= config.totalNumeros; num++) {
          if (!melhorJogo.includes(num) && !proibidos.includes(num)) {
            candidatos.push(num);
          }
        }
        if (candidatos.length === 0) break;
        const entra = candidatos[Math.floor(Math.random() * candidatos.length)];

        const jogoTeste = melhorJogo.map(n => n === sai ? entra : n);
        const analiseTeste = analisarJogoCompleto(jogoTeste);

        if (analiseTeste.aprovadosCount >= analiseAtual.aprovadosCount) {
          melhorJogo = jogoTeste;
          analiseAtual = analiseTeste;
        }
      }

      setJogoAtual(melhorJogo.sort((a,b)=>a-b));
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();

      tocarSomNasa('sucesso');
      toast('Jogo ajustado aos indicadores. Isso não aumenta a chance de acerto.', '✅');
    }


    // =========================================================================
    // SCANNER DE APOSTAS EM LOTE (AUDITORIA EM MASSA)
    // =========================================================================
    let apostasAuditadasScanner = [];

    function executarScannerEmLote() {
      tocarSomNasa('ignicao');
      vibrarHaptico(25);
      const input = document.getElementById('textarea-scanner-lote')?.value.trim();
      if (!input) {
        toast('Cole ou digite ao menos um jogo no campo de texto.', '⚠️');
        return;
      }

      const config = getConfigAtual();
      const linhas = input.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      apostasAuditadasScanner = [];

      linhas.forEach((linha, idx) => {
        const pedras = linha.split(/[\s,;-]+/).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= config.totalNumeros);
        const unicas = Array.from(new Set(pedras)).sort((a,b)=>a-b);
        if (unicas.length >= config.dezenasJogoMin) {
          if (idx >= 2 && !verificarAcessoRecursoVip('Auditoria em Massa ilimitada no Scanner')) return;
          const analise = analisarJogoCompleto(unicas);
          apostasAuditadasScanner.push({
            idx: idx + 1,
            dezenas: unicas,
            analise: analise
          });
        }
      });

      if (apostasAuditadasScanner.length === 0) {
        toast(`Nenhum jogo válido com no mínimo ${config.dezenasJogoMin} dezenas encontrado.`, '⚠️');
        return;
      }

      const container = document.getElementById('resultado-scanner-lote');
      const resumo = document.getElementById('scanner-resumo-info');
      const lista = document.getElementById('scanner-lista-auditoria');
      container.classList.remove('hidden');

      const aprovadas = apostasAuditadasScanner.filter(a => a.analise.aprovadosCount >= 5).length;
      resumo.innerText = `${apostasAuditadasScanner.length} jogos lidos (${aprovadas} com 5 ou mais indicadores na faixa comum)`;

      lista.innerHTML = apostasAuditadasScanner.map(item => {
        const score = Math.round(item.analise.aprovadosCount * 16.6);
        let badgeCor = 'bg-rose-950 text-rose-300 border-rose-800';
        let statusTexto = '🔴 Desperdício / Viciado';
        if (item.analise.aprovadosCount === 6) {
          badgeCor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
          statusTexto = '🟢 6 de 6 na faixa comum';
        } else if (item.analise.aprovadosCount >= 4) {
          badgeCor = 'bg-amber-950 text-amber-300 border-amber-800';
          statusTexto = '🟡 Atenção / Leve Risco';
        }

        return `
          <div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-black text-cyan-400">#${item.idx}</span>
                <span class="text-[9px] px-2 py-0.5 rounded font-black border ${badgeCor}">Score: ${score}/100</span>
                <span class="text-[10px] text-slate-300">${statusTexto}</span>
              </div>
              <div class="flex flex-wrap gap-1">
                ${item.dezenas.map(d => `<span class="w-5 h-5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-white flex items-center justify-center">${String(d).padStart(2,'0')}</span>`).join('')}
              </div>
            </div>
            <button type="button" onclick="carregarJogoScannerNoVolante(${item.idx - 1})" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[10px] rounded-lg border border-slate-700 transition active:scale-95 whitespace-nowrap">
              🎯 Carregar
            </button>
          </div>
        `;
      }).join('');

      tocarSomNasa('sucesso');
      toast(`${apostasAuditadasScanner.length} apostas escaneadas com sucesso!`, '📡');
    }

    function carregarJogoScannerNoVolante(idx) {
      if (!apostasAuditadasScanner[idx]) return;
      setJogoAtual([...apostasAuditadasScanner[idx].dezenas]);
      mudarAba('volante');
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();
      tocarSomNasa('beep');
      toast(`Jogo #${idx + 1} carregado no volante!`, '🎯');
    }

    function salvarAprovadasScannerNaCarteira() {
      const aprovadas = apostasAuditadasScanner.filter(a => a.analise.aprovadosCount >= 5);
      if (aprovadas.length === 0) {
        toast('Nenhum jogo para salvar.', '⚠️');
        return;
      }
      const config = getConfigAtual();
      aprovadas.forEach(a => {
        carteiraJogos.unshift({
          id: Date.now() + Math.random(),
          modalidade: modalidadeAtual,
          dezenas: a.dezenas,
          data: new Date().toLocaleDateString('pt-BR'),
          custo: config.precoBase,
          premioGanho: 0,
          conferido: false
        });
      });
      salvarCarteiraStorage();
      atualizarPainelCarteira();
      tocarSomNasa('sucesso');
      toast(`${aprovadas.length} jogos salvos na carteira.`, '💾');
    }

    function salvarApostasNaCarteiraAPartirDeTexto(texto) {
      if (typeof window.exigirLeadAntesDeSalvar === 'function' && !window.exigirLeadAntesDeSalvar()) {
        return 0;
      }
      if (!texto || !texto.trim()) {
        toast("Cole ou informe o texto das apostas.", "⚠️");
        return 0;
      }

      const manualConcInput = document.getElementById('input-import-concurso-manual')?.value?.trim();
      const manualDataInput = document.getElementById('input-import-data-manual')?.value?.trim();
      let dataManualFormatada = null;
      if (manualDataInput) {
        const [ano, mes, dia] = manualDataInput.split('-');
        if (dia && mes && ano) dataManualFormatada = `${dia}/${mes}/${ano}`;
      }

      const res = parsearJogosTextoCompleto(texto, dataManualFormatada);
      if (!res.jogos || res.jogos.length === 0) {
        toast("Nenhum jogo identificado no texto. Verifique as dezenas.", "⚠️");
        return 0;
      }
      const mod = res.modalidadeDetectada || (res.jogos[0].length >= 15 ? 'lotofacil' : modalidadeAtual);
      const precoBase = mod === 'lotofacil' ? 3.5 : 6.0;

      let concFinal = manualConcInput || res.concurso;
      if (concFinal && !concFinal.startsWith('#') && /^\d+$/.test(concFinal)) {
        concFinal = `#${concFinal}`;
      }

      let dataFinal = dataManualFormatada || res.data;

      // Se informou concurso mas não informou data, busca data oficial histórica
      const numConc = concFinal ? Number(String(concFinal).replace(/\D/g, '')) : 0;
      const base = mod === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
      const encOficial = numConc > 0 ? base.find(c => Number(c.concurso) === numConc) : null;

      if (encOficial && encOficial.data && !dataFinal) {
        dataFinal = encOficial.data;
      }

      if (!dataFinal) {
        dataFinal = typeof obterInfoProximoSorteio === 'function' ? obterInfoProximoSorteio(mod).data : new Date().toLocaleDateString('pt-BR');
      }
      if (!concFinal) {
        concFinal = typeof obterInfoProximoSorteio === 'function' ? obterInfoProximoSorteio(mod).concurso : 'Oficial';
      }

      // Verifica se é concurso passado
      const ehPassado = typeof window.concursoOuDataEhPassado === 'function'
        ? window.concursoOuDataEhPassado(concFinal, dataFinal, mod)
        : false;

      res.jogos.forEach((dez, idx) => {
        let conferido = false;
        let status = ehPassado ? 'Sorteio Realizado' : 'Aguardando sorteio';
        let premioGanho = 0;
        let acertos = undefined;
        let dezenasSorteadas = undefined;

        if (encOficial && Array.isArray(encOficial.dezenas) && encOficial.dezenas.length > 0) {
          dezenasSorteadas = encOficial.dezenas.map(Number);
          acertos = dez.map(Number).filter(d => dezenasSorteadas.includes(d)).length;
          conferido = true;
          if (typeof avaliarBilhete === 'function') {
            const av = avaliarBilhete({ modalidade: mod, dezenas: dez }, encOficial);
            status = av.status;
            premioGanho = av.premioGanho || 0;
          } else {
            status = `${acertos} acertos`;
          }
        }

        carteiraJogos.unshift({
          id: Date.now() + idx + Math.random(),
          modalidade: mod,
          nome: `${mod === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena'} • Jogo #${idx + 1} (${dez.length} dez)`,
          dezenas: dez,
          data: dataFinal,
          concursoAlvo: concFinal,
          custo: precoBase,
          premioGanho: premioGanho,
          conferido: conferido,
          status: status,
          acertos: acertos,
          dezenasSorteadas: dezenasSorteadas,
          registradoComoJogado: true,
          dataRegistro: new Date().toISOString()
        });
      });

      salvarCarteiraStorage();
      atualizarPainelCarteira();
      tocarSomNasa('sucesso');
      
      if (encOficial) {
        toast(`✅ ${res.jogos.length} aposta(s) do Concurso ${concFinal} arquivadas e apuradas!`, "🎉");
      } else {
        toast(`✅ ${res.jogos.length} aposta(s) salvas com sucesso para o concurso ${concFinal}!`, "🎉");
        if (ehPassado && typeof conferirSorteiosPassadosAutomatico === 'function') {
          conferirSorteiosPassadosAutomatico();
        }
      }
      return res.jogos.length;
    }

    function importarJogosDoScannerLote() {
      const el = document.getElementById('textarea-scanner-lote') || document.getElementById('input-scanner-texto');
      const input = el?.value.trim();
      if (!input) {
        toast('Cole ao menos um jogo ou mensagem no campo.', '⚠️');
        return;
      }
      const qtd = salvarApostasNaCarteiraAPartirDeTexto(input);
      if (qtd > 0) {
        if (el) el.value = '';
        if (typeof alternarSubAbaCarteira === 'function') {
          alternarSubAbaCarteira('bilhetes');
        }
      }
    }

    // Funções Utilitárias de Compatibilidade e Avaliação Estatística
    function salvarCarteiraNoStorage() {
      salvarCarteiraStorage();
    }

    function renderizarCarteira() {
      atualizarPainelCarteira();
    }

    function calcularFrequenciaHistorica() {
      const freq = {};
      const historico = modalidadeAtual === 'megasena' ? (baseConcursosMega || []) : (baseConcursosLoto || []);
      const total = modalidadeAtual === 'megasena' ? 60 : 25;
      for (let i = 1; i <= total; i++) freq[i] = 0;
      if (Array.isArray(historico)) {
        historico.forEach(c => {
          if (Array.isArray(c.dezenas)) {
            c.dezenas.forEach(d => { freq[d] = (freq[d] || 0) + 1; });
          }
        });
      }
      return freq;
    }

    function analisarJogoCompleto(jogo, mod = modalidadeAtual) {
      return avaliarJogo(jogo, mod);
    }

    function confirmarAcaoDialog(mensagem, callbackConfirmado, titulo = 'Confirmação', textoBotao = 'Confirmar') {
      if (window.confirm(`${titulo ? '【 ' + titulo + ' 】\n\n' : ''}${mensagem}`)) {
        if (typeof callbackConfirmado === 'function') {
          callbackConfirmado();
        }
      }
    }

    // =========================================================================
    // SISTEMA DE AUTENTICAÇÃO REAL SAAS, GOOGLE SIGN-IN & PERFIL DO USUÁRIO
    // =========================================================================
    let modoAuthAtual = 'entrar'; // 'entrar' ou 'cadastrar'
    let usuarioSessao = null;
    let clienteSupabase = null;

    function obterClienteSupabase() {
      if (clienteSupabase) return clienteSupabase;
      const config = window.NASA_SUPABASE_CONFIG;
      if (!config?.url || !config?.anonKey || !window.supabase?.createClient) return null;
      clienteSupabase = window.supabase.createClient(config.url, config.anonKey);
      return clienteSupabase;
    }

    // Códigos VIP validados no navegador foram desativados: qualquer pessoa os
    // lia no código público. O resgate volta quando existir validação no servidor.
    const CUPONS_HASH_MAP = {};
    function calcularHashCupom() { return ''; }

    function obterConfiguracaoCupom(codigo) {
      const cod = String(codigo || '').toUpperCase().trim();
      if (!cod) return null;

      return null;
    }

    function verificarParametrosVipUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout')) {
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (_) {}
          return;
        }
        const cupom = params.get('cupom') || params.get('vip') || params.get('master');
        if (cupom) {
          const cod = cupom.toUpperCase().trim();
          const cfg = obterConfiguracaoCupom(cod);
          if (cfg) {
            ativarSessaoVipPermanente(cfg.nome, cod, cfg.email, cfg.tipo, cfg.telefone);
            if (typeof sincronizarCarteiraNuvem === 'function') {
              sincronizarCarteiraNuvem(true);
            }
          }
        }

        // Processa sincronização de carteira recebida via link de transferência (?sync=...)
        if (typeof window.processarParametroSyncUrl === 'function') {
          window.processarParametroSyncUrl();
        } else {
          setTimeout(() => {
            if (typeof window.processarParametroSyncUrl === 'function') {
              window.processarParametroSyncUrl();
            }
          }, 300);
        }
      } catch (e) {
        console.warn('Erro ao ler parâmetros VIP/Sync da URL:', e);
      }
    }

    function ativarSessaoVipPermanente(nome = 'Convidado VIP', codigo = '', email = '', tipo = 'vip_convidado', telefone = '') {
      localStorage.setItem('loterias_nasa_vip_cupom', codigo);
      planoUsuario = 'pro';
      const isMaster = false;
      usuarioSessao = {
        nome: nome,
        email: email || 'convidado.vip@loteriasnasa.pro',
        telefone: telefone || '',
        avatar: isMaster ? '👑' : '⭐',
        tipo: isMaster ? 'master_founder' : 'vip_convidado',
        plano: 'pro',
        cupomAtivo: codigo
      };
      localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
      atualizarVisualPlano();
      atualizarPerfilUsuarioUI();
      if (typeof sincronizarHeaderStatusUsuario === 'function') sincronizarHeaderStatusUsuario();
      if (typeof fecharModalUpgrade === 'function') fecharModalUpgrade();
      if (typeof fecharModalAuth === 'function') fecharModalAuth();
      if (typeof tocarSomNasa === 'function') tocarSomNasa('sucesso');
      if (typeof toast === 'function') {
        toast(`👑 Bem-vindo(a), ${nome.split(' ')[0]}! Acesso VIP Vitalício Ativado!`, '🎯');
      }
    }

    function resgatarCupomVip(codigoInformado) {
      const codigo = (codigoInformado || '').toUpperCase().trim();
      if (!codigo) {
        if (typeof toast === 'function') toast('Digite o código do convite VIP', '⚠️');
        return false;
      }

      const cfg = obterConfiguracaoCupom(codigo);
      if (cfg) {
        ativarSessaoVipPermanente(cfg.nome, codigo, cfg.email, cfg.tipo, cfg.telefone);
        if (typeof sincronizarCarteiraNuvem === 'function') {
          sincronizarCarteiraNuvem(true);
        }
        return true;
      } else {
        if (typeof tocarSomNasa === 'function') tocarSomNasa('erro');
        if (typeof toast === 'function') toast('Código ou Cupom VIP inválido ou não cadastrado.', '⚠️');
        return false;
      }
    }

    function carregarUsuarioSalvo() {
      try {
        verificarParametrosVipUrl();
        const salvo = localStorage.getItem('loterias_nasa_user');

        if (salvo) {
          const usuarioLocal = JSON.parse(salvo);
          const emailLower = (usuarioLocal?.email || '').toLowerCase();
          
          // Papel e plano salvos no aparelho não valem: só o servidor os concede.
          if (usuarioLocal?.tipo === 'master_founder' || usuarioLocal?.tipo === 'vip_convidado') {
            localStorage.removeItem('loterias_nasa_vip_cupom');
            usuarioSessao = { ...usuarioLocal, tipo: 'visitante', plano: 'free' };
            planoUsuario = 'free';
          } else {
            usuarioSessao = usuarioLocal;
          }
        } else {
          usuarioSessao = {
            nome: 'Visitante',
            email: 'visitante@loteriasnasa.pro',
            avatar: '🎯',
            tipo: 'visitante',
            plano: 'free'
          };
        }
      } catch(e) {
        usuarioSessao = { nome: 'Visitante', email: '', avatar: '🎯', tipo: 'visitante', plano: 'free' };
      }
      atualizarVisualPlano();
      atualizarPerfilUsuarioUI();
    }

    async function restaurarSessaoSupabase() {
      const cliente = obterClienteSupabase();
      if (!cliente) return;

      const { data, error } = await cliente.auth.getSession();
      if (error || !data.session?.user) return;

      const usuario = data.session.user;
      const { data: perfil } = await cliente
        .from('profiles')
        .select('display_name, role, analises_gratis_restantes')
        .eq('id', usuario.id)
        .maybeSingle();
      const { data: assinatura } = await cliente
        .from('subscriptions')
        .select('status, valid_until, plan_code')
        .eq('user_id', usuario.id)
        .eq('status', 'active')
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('valid_until', { ascending: false })
        .limit(1)
        .maybeSingle();

      usuarioSessao = {
        nome: perfil?.display_name || usuario.user_metadata?.full_name || usuario.email?.split('@')[0] || 'Usuário',
        email: usuario.email || '',
        avatar: 'U',
        tipo: perfil?.role === 'owner' ? 'master_founder' : 'supabase',
        plano: assinatura ? 'pro' : 'free',
        // Créditos de análise grátis (3 por cadastro, sem prazo — ver
        // js/creditos-gratis.js). O default 3 vem da coluna no Supabase;
        // se a linha de profiles ainda não existir por algum motivo,
        // trata como 0 em vez de undefined (evita "0 > 0" virar NaN).
        creditosGratis: perfil?.analises_gratis_restantes ?? 0,
        dataConexao: new Date().toISOString()
      };
      planoUsuario = assinatura ? 'pro' : 'free';
      atualizarVisualPlano();
      atualizarPerfilUsuarioUI();
      if (typeof sincronizarCarteiraNuvem === 'function') {
        sincronizarCarteiraNuvem(false);
      }
    }

    function atualizarPerfilUsuarioUI() {
      if (!usuarioSessao) return;
      const elNome = document.getElementById('nome-user-topo');
      const elAvatar = document.getElementById('avatar-user-topo');
      const tabAdmin = document.getElementById('tab-admin');

      if (usuarioSessao.tipo === 'master_founder') {
        if (elNome) elNome.innerText = 'Administrador';
        if (elAvatar) elAvatar.innerText = '👑';
        if (tabAdmin) {
          tabAdmin.classList.remove('hidden');
          tabAdmin.classList.remove('opacity-70');
          tabAdmin.classList.add('ring-2', 'ring-amber-400', 'shadow-lg', 'shadow-amber-500/30');
        }
      } else {
        if (elNome) elNome.innerText = usuarioSessao.nome.split(' ')[0] || 'Visitante';
        if (elAvatar) {
          if (usuarioSessao.avatar && usuarioSessao.avatar.length <= 2) {
            elAvatar.innerText = usuarioSessao.avatar;
          } else {
            elAvatar.innerText = (usuarioSessao.nome[0] || 'U').toUpperCase();
          }
        }
        if (tabAdmin) {
          tabAdmin.classList.add('hidden');
          tabAdmin.classList.remove('ring-2', 'ring-amber-400', 'shadow-lg');
        }
      }
    }

    function abrirModalAuthOuPerfil() {
      tocarBeep('click');
      if (usuarioSessao && usuarioSessao.tipo === 'master_founder') {
        // Menu administrativo do proprietario autorizado
        if (confirm(`👑 CONTA ADMINISTRATIVA ATIVA\n\n• Clique em OK para ir direto ao PAINEL ADMINISTRATIVO\n• Clique em Cancelar para gerenciar login/sair da conta.`)) {
          mudarAba('admin');
          return;
        }
        confirmarAcaoDialog(
          `Conta administrativa: ${usuarioSessao.nome}. Deseja encerrar a sessão e voltar a Visitante?`,
          () => { fazerLogout(); },
          '👑 Sessão Master',
          'Sair da Conta Master'
        );
        return;
      }

      if (usuarioSessao && usuarioSessao.tipo !== 'visitante') {
        // Usuário já está logado
        confirmarAcaoDialog(
          `Conta conectada: ${usuarioSessao.nome} (${usuarioSessao.email}). Plano: ${usuarioSessao.plano || 'VIP'}. Deseja sair?`,
          () => {
            fazerLogout();
          },
          '👤 Gerenciar Conta',
          'Sair da Conta'
        );
      } else {
        abrirModalAuth();
      }
    }

    function abrirModalAuth() {
      tocarBeep('click');
      const modal = document.getElementById('modal-auth-saas');
      if (modal) modal.classList.remove('hidden');
    }

    function fecharModalAuth() {
      tocarBeep('click');
      const modal = document.getElementById('modal-auth-saas');
      if (modal) modal.classList.add('hidden');
    }

    function alternarAbaAuth(aba) {
      tocarBeep('click');
      modoAuthAtual = aba;
      const tabEntrar = document.getElementById('tab-auth-entrar');
      const tabCadastrar = document.getElementById('tab-auth-cadastrar');
      const campoNome = document.getElementById('campo-auth-nome');
      const titulo = document.getElementById('auth-modal-titulo');
      const subtitulo = document.getElementById('auth-modal-subtitulo');
      const btnTxt = document.getElementById('txt-btn-submit-auth');

      if (aba === 'cadastrar') {
        tabCadastrar.className = 'flex-1 py-1.5 rounded-lg transition bg-cyan-600 text-slate-950 font-black';
        tabEntrar.className = 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-white transition font-bold';
        campoNome.classList.remove('hidden');
        titulo.innerText = 'Crie sua Conta';
        subtitulo.innerText = 'Comece gratuitamente e organize seus bilhetes';
        btnTxt.innerText = 'CRIAR MINHA CONTA GRÁTIS';
      } else {
        tabEntrar.className = 'flex-1 py-1.5 rounded-lg transition bg-cyan-600 text-slate-950 font-black';
        tabCadastrar.className = 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-white transition font-bold';
        campoNome.classList.add('hidden');
        titulo.innerText = 'Acesse sua Conta';
        subtitulo.innerText = 'Acesse seus bilhetes salvos em qualquer dispositivo';
        btnTxt.innerText = 'ENTRAR NA MINHA CONTA';
      }
    }

    function autenticarComGoogle() {
      const config = window.NASA_SUPABASE_CONFIG;
      if (!config?.googleEnabled) {
        toast('O login Google será liberado assim que o provedor Google for configurado.', 'ℹ️');
        return;
      }
      const cliente = obterClienteSupabase();
      if (!cliente) {
        toast('Login Google indisponível: configure o cliente Supabase primeiro.', '🔒');
        tocarBeep('alert');
        return;
      }
      cliente.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: config.googleRedirectUrl } })
        .then(({ error }) => {
          if (error) {
            toast(`Falha no login Google: ${error.message}`, '⚠️');
            tocarBeep('alert');
          }
        });
    }

    async function submeterFormularioAuth(e) {
      if (e) e.preventDefault();
      tocarSomNasa('beep');
      const email = document.getElementById('input-auth-email')?.value.trim();
      const senha = document.getElementById('input-auth-senha')?.value.trim();
      const nome = document.getElementById('input-auth-nome')?.value.trim() || email.split('@')[0];

      if (!email) {
        toast('Preencha o seu e-mail.', '⚠️');
        return;
      }

      if (!senha) {
        toast('Preencha a sua senha.', '⚠️');
        return;
      }

      const cliente = obterClienteSupabase();
      if (!cliente) {
        toast('Autenticação indisponível: configure o cliente Supabase primeiro.', '🔒');
        tocarBeep('alert');
        return;
      }

      const resultado = modoAuthAtual === 'cadastrar'
        ? await cliente.auth.signUp({ email, password: senha, options: { data: { full_name: nome } } })
        : await cliente.auth.signInWithPassword({ email, password: senha });

      if (resultado.error) {
        toast(`Não foi possível autenticar: ${resultado.error.message}`, '⚠️');
        tocarBeep('alert');
        return;
      }

      if (!resultado.data.session) {
        toast('Conta criada. Confirme o e-mail para concluir o acesso.', '📧');
        return;
      }

      usuarioSessao = {
        nome: resultado.data.user.user_metadata?.full_name || email.split('@')[0],
        email: resultado.data.user.email,
        avatar: (nome[0] || 'U').toUpperCase(),
        tipo: 'supabase',
        plano: 'free',
        dataConexao: new Date().toISOString()
      };

      // Busca perfil, assinatura e créditos de análise grátis reais em vez
      // de assumir aqui (evita duplicar a mesma consulta em dois lugares
      // com risco de um deles ficar desatualizado).
      await restaurarSessaoSupabase();

      atualizarPerfilUsuarioUI();
      fecharModalAuth();
      tocarSomNasa('sucesso');
      const nomeExibido = usuarioSessao?.nome || nome;
      toast(
        modoAuthAtual === 'cadastrar'
          ? `Conta criada! Bem-vindo, ${nomeExibido} — você ganhou 3 análises completas grátis.`
          : 'Login efetuado com sucesso!',
        '🎯'
      );
    }

    function abrirCadastroVisitante() {
      const modal = document.getElementById('modal-cadastro-visitante');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.getElementById('input-visitante-nome')?.focus();
      }
    }

    function fecharCadastroVisitante() {
      const modal = document.getElementById('modal-cadastro-visitante');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    async function submeterCadastroVisitante(event) {
      if (event) event.preventDefault();
      const nome = document.getElementById('input-visitante-nome')?.value.trim();
      const email = document.getElementById('input-visitante-email')?.value.trim().toLowerCase();
      const telefone = document.getElementById('input-visitante-telefone')?.value.trim();
      const consentimento = document.getElementById('check-visitante-consentimento')?.checked === true;
      const telefoneNumeros = (telefone || '').replace(/\D/g, '');

      if (!nome || !email || telefoneNumeros.length < 10 || !consentimento) {
        toast('Informe nome, e-mail e celular e confirme a idade.', '⚠️');
        return;
      }

      const lead = {
        nome,
        email,
        telefone,
        aceitePrivacidade: true,
        consentimentoEm: new Date().toISOString()
      };
      localStorage.setItem('loterias_nasa_visitor_lead', JSON.stringify(lead));

      const cliente = obterClienteSupabase();
      let sincronizado = false;
      if (cliente) {
        const { error } = await cliente.from('visitor_leads').insert({
          name: nome,
          email,
          phone: telefone,
          marketing_consent: Boolean(document.getElementById('check-visitante-novidades')?.checked),
          consent_at: lead.consentimentoEm,
          source: 'visitor_trial'
        });
        // E-mail já cadastrado (23505) também conta como contato registrado.
        sincronizado = !error || error.code === '23505';
      }

      entrarComoVisitanteGratis(lead);
      toast(sincronizado ? 'Teste gratuito ativado e contato registrado.' : 'Teste gratuito ativado. Sincronize o Supabase para registrar o contato.', '🎯');
    }

    function entrarComoVisitanteGratis(lead = null) {
      tocarSomNasa('sucesso');
      const contato = lead || JSON.parse(localStorage.getItem('loterias_nasa_visitor_lead') || 'null');
      usuarioSessao = {
        nome: contato?.nome || 'Visitante',
        email: contato?.email || '',
        telefone: contato?.telefone || '',
        avatar: '🎯',
        tipo: 'visitante',
        plano: 'free'
      };
      localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
      atualizarPerfilUsuarioUI();
      fecharCadastroVisitante();
      fecharModalAuth();
      if (!lead) toast('Acesso livre liberado no Modo Teste Grátis!', '✨');
    }

    function fazerLogout() {
      usuarioSessao = { nome: 'Visitante', email: '', avatar: '🎯', tipo: 'visitante', plano: 'free' };
      planoUsuario = 'free';

      // Limpeza completa e definitiva de todas as chaves de autenticação e cupons VIP
      localStorage.removeItem('loterias_nasa_user');
      localStorage.removeItem('loterias_nasa_vip_cupom');
      localStorage.removeItem('loterias_nasa_vip_perfil');
      localStorage.removeItem('loterias_nasa_cupom_ativo');
      sessionStorage.clear();

      const cliente = obterClienteSupabase();
      if (cliente) {
        cliente.auth.signOut().catch(() => {});
      }

      atualizarVisualPlano();
      atualizarPerfilUsuarioUI();
      if (typeof sincronizarHeaderStatusUsuario === 'function') sincronizarHeaderStatusUsuario();
      if (typeof atualizarDadosDrawer === 'function') atualizarDadosDrawer();

      // Descarrega imediatamente os bilhetes da memória para não vazar dados
      carteiraJogos = [];
      window.carteiraJogos = [];
      if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();

      tocarSomNasa('sucesso');
      toast('Desconectado com sucesso! Você agora está como Visitante.', 'ℹ️');

      if (typeof fecharDrawerPerfil === 'function') fecharDrawerPerfil();
      if (typeof fecharModalAuth === 'function') fecharModalAuth();

      // Recarrega o app limpando o estado de memória global
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + '?logout=' + Date.now();
      }, 500);
    }


    // =========================================================================
    // ACESSO MASTER DO FUNDADOR (VITÓRIO) & LIMITES REAIS DO PLANO FREE
    // =========================================================================
    function abrirAcessoMasterDialog() {
      fecharModalAuth();
      toast('O acesso administrativo será liberado somente por uma sessão de proprietário validada no servidor.', '🔒');
      tocarBeep('alert');
    }

    function ativarAcessoMasterFundador() {
      abrirAcessoMasterDialog();
    }

    // Trava para verificar se o usuário pode usar recurso VIP
    function verificarAcessoRecursoVip(recursoNome = 'este recurso') {
      if (usuarioSessao && usuarioSessao.tipo === 'master_founder') {
        return true; // Fundador tem acesso ilimitado a tudo
      }
      if (planoUsuario === 'pro') {
        return true; // Assinante VIP tem acesso
      }
      // Bloqueia e abre o Paywall com o motivo
      abrirModalPaywall(recursoNome);
      return false;
    }


    // =========================================================================
    // PAINEL DE COMANDO DO CEO & CONTROLE DE USUÁRIOS/ASSINATURAS/PAGAMENTOS
    // =========================================================================

    let usuariosAdminRemotos = null;

    async function invocarAcaoAdministrativa(payload) {
      const cliente = obterClienteSupabase();
      if (!cliente) throw new Error('Supabase não configurado');
      const { data: sessaoData } = await cliente.auth.getSession();
      const token = sessaoData.session?.access_token;
      if (!token) throw new Error('Sessão administrativa ausente');
      const { data, error } = await cliente.functions.invoke('admin-action', {
        body: payload,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (error) throw error;
      return data;
    }

    async function carregarUsuariosAdminRemotos() {
      try {
        const resposta = await invocarAcaoAdministrativa({ action: 'list_users' });
        usuariosAdminRemotos = (resposta.users || []).map((user) => {
          const assinatura = user.subscription;
          const perfil = user.profile;
          const vitalicio = assinatura?.status === 'active' && !assinatura.valid_until;
          const ativo = assinatura?.status === 'active' && (vitalicio || new Date(assinatura.valid_until) > new Date());
          return {
            id: user.id,
            nome: perfil?.display_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            telefone: '',
            avatar: ativo ? '🎯' : '🆓',
            plano: vitalicio ? 'lifetime' : (ativo ? 'pro' : 'free'),
            planoNome: vitalicio ? 'Acesso vitalício de teste' : (ativo ? 'VIP ativo' : 'Visitante Free'),
            dataCadastro: user.created_at?.slice(0, 10) || '',
            dataExpiracao: vitalicio ? 'Vitalício' : (assinatura?.valid_until?.slice(0, 10) || '-'),
            status: ativo ? 'ativo' : 'free',
            valorPago: 0,
            obs: user.last_sign_in_at ? `Último acesso: ${user.last_sign_in_at}` : 'Ainda não acessou'
          };
        });
        renderizarPainelAdmin();
      } catch (error) {
        toast(`Não foi possível carregar os usuários: ${error.message}`, '⚠️');
      }
    }

    async function concederAcessoVitalicio(id) {
      try {
        await invocarAcaoAdministrativa({ action: 'grant_lifetime', targetUserId: id });
        toast('Acesso vitalício de teste concedido.', '🎯');
        await carregarUsuariosAdminRemotos();
      } catch (error) {
        toast(`Não foi possível conceder o acesso: ${error.message}`, '⚠️');
      }
    }

    function gerarSementeTestadoresIniciais() {
      return [];
    }

    function carregarBaseUsuariosAdmin() {
      if (usuariosAdminRemotos && Array.isArray(usuariosAdminRemotos) && usuariosAdminRemotos.length > 0) {
        return usuariosAdminRemotos;
      }
      try {
        const salvo = localStorage.getItem('loterias_nasa_admin_users');
        if (salvo) {
          let lista = JSON.parse(salvo);
          if (Array.isArray(lista) && lista.length > 0) {
            // Garante que os 3 testadores de honra estejam presentes
            const codigosPresentes = new Set(lista.map(u => (u.codigoVip || '').toUpperCase()));
            const semente = gerarSementeTestadoresIniciais();
            semente.forEach(s => {
              if (!codigosPresentes.has(s.codigoVip.toUpperCase())) {
                lista.push(s);
              }
            });
            return lista;
          }
        }
      } catch (e) {
        // Segue para a semente
      }

      const inicial = gerarSementeTestadoresIniciais();
      try {
        localStorage.setItem('loterias_nasa_admin_users', JSON.stringify(inicial));
      } catch (_) {}
      return inicial;
    }

    function salvarBaseUsuariosAdmin(base) {
      localStorage.setItem('loterias_nasa_admin_users', JSON.stringify(base || []));
      renderizarPainelAdmin();
    }

    function escaparHtmlSeguro(valor) {
      return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[caractere]));
    }

    function escaparCelulaCsv(valor) {
      const texto = String(valor ?? '').replace(/"/g, '""');
      const protegido = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
      return `"${protegido}"`;
    }

    function alternarSubAbaAdmin(subaba) {
      ['usuarios', 'feedbacks', 'telemetria', 'planos', 'gateways', 'relatorio'].forEach(s => {
        const sec = document.getElementById(`subsecao-admin-${s}`);
        const tab = document.getElementById(`subtab-admin-${s}`);
        if (sec) sec.classList.add('hidden');
        if (tab) {
          tab.className = 'pb-2.5 px-3 font-bold text-xs border-b-2 border-transparent text-slate-400 hover:text-white transition flex items-center gap-1.5 whitespace-nowrap';
        }
      });

      const secAtiva = document.getElementById(`subsecao-admin-${subaba}`);
      const tabAtiva = document.getElementById(`subtab-admin-${subaba}`);
      if (secAtiva) secAtiva.classList.remove('hidden');
      if (tabAtiva) {
        tabAtiva.className = 'pb-2.5 px-3 font-bold text-xs border-b-2 border-amber-400 text-amber-300 transition flex items-center gap-1.5 whitespace-nowrap';
      }

      if (subaba === 'feedbacks' && typeof window.renderizarFeedbacksAdmin === 'function') {
        window.renderizarFeedbacksAdmin();
      }

      if (subaba === 'telemetria' && typeof window.renderizarPainelTelemetriaAdmin === 'function') {
        window.renderizarPainelTelemetriaAdmin();
      }
    }

    function renderizarPainelAdmin() {
      const base = carregarBaseUsuariosAdmin();
      const tbody = document.getElementById('tabela-usuarios-admin-body');
      if (!tbody) return;

      // Calcular Métricas em Tempo Real 100% REAIS
      let mrrTotal = 0;
      let totalVip = 0;
      let totalPagamentos = 0;
      let contMensal = 0;
      let contAnual = 0;
      let contBolao = 0;

      base.forEach(u => {
        if (u.status === 'ativo') {
          if (u.plano === 'pro') {
            mrrTotal += 29.90;
            totalVip++;
            contMensal++;
            totalPagamentos += (Number(u.valorPago) || 29.90);
          } else if (u.plano === 'anual') {
            mrrTotal += (197.00 / 12);
            totalVip++;
            contAnual++;
            totalPagamentos += (Number(u.valorPago) || 197.00);
          } else if (u.plano === 'bolao') {
            mrrTotal += 59.90;
            totalVip++;
            contBolao++;
            totalPagamentos += (Number(u.valorPago) || 59.90);
          }
        }
      });

      const totalUsuarios = base.length;
      const taxaConversao = totalUsuarios > 0 ? ((totalVip / totalUsuarios) * 100).toFixed(1) + '%' : '0,0%';

      // Atualizar KPIs no DOM
      const elMrr = document.getElementById('kpi-admin-mrr');
      if (elMrr) elMrr.innerText = formatarReais(mrrTotal);

      const elVip = document.getElementById('kpi-admin-total-vip');
      if (elVip) elVip.innerText = `${totalVip} Assinantes`;

      const elC1 = document.getElementById('kpi-count-mensal');
      if (elC1) elC1.innerText = String(contMensal);
      const elC2 = document.getElementById('kpi-count-anual');
      if (elC2) elC2.innerText = String(contAnual);
      const elC3 = document.getElementById('kpi-count-bolao');
      if (elC3) elC3.innerText = String(contBolao);

      const elConv = document.getElementById('kpi-admin-conversao');
      if (elConv) elConv.innerText = taxaConversao;

      const elFat = document.getElementById('kpi-admin-faturamento-total');
      if (elFat) elFat.innerText = formatarReais(totalPagamentos);

      const elFatSub = document.getElementById('kpi-admin-fat-sub');
      if (elFatSub) {
        elFatSub.innerText = totalPagamentos > 0 ? 'Conforme histórico de pagamentos' : 'Nenhum pagamento registrado ainda';
      }

      // Atualizar Select do Modal de Webhook
      const selectWebhook = document.getElementById('webhook-user-select');
      if (selectWebhook) {
        selectWebhook.innerHTML = base.map(u => `<option value="${escaparHtmlSeguro(u.id)}">${escaparHtmlSeguro(u.nome)} (${escaparHtmlSeguro(u.email)}) - Plano atual: ${escaparHtmlSeguro(u.planoNome)}</option>`).join('');
      }

      filtrarTabelaUsuariosAdmin();
    }

    function filtrarTabelaUsuariosAdmin() {
      const base = carregarBaseUsuariosAdmin();
      const termo = (document.getElementById('filtro-pesquisa-usuario')?.value || '').toLowerCase().trim();
      const filtroPlano = document.getElementById('filtro-plano-usuario')?.value || 'todos';
      const filtroStatus = document.getElementById('filtro-status-usuario')?.value || 'todos';
      const tbody = document.getElementById('tabela-usuarios-admin-body');
      if (!tbody) return;

      const filtrados = base.filter(u => {
        const matchTermo = !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo) || (u.telefone && u.telefone.includes(termo));
        const matchPlano = filtroPlano === 'todos' || u.plano === filtroPlano;
        const matchStatus = filtroStatus === 'todos' || u.status === filtroStatus;
        return matchTermo && matchPlano && matchStatus;
      });

      const contador = document.getElementById('contador-usuarios-filtrados');
      if (contador) contador.innerText = `Exibindo ${filtrados.length} de ${base.length} clientes cadastrados`;

      if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500 font-sans">Nenhum cliente encontrado com os filtros aplicados.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtrados.map(u => {
        let badgePlano = '';
        if (u.plano === 'master') {
          badgePlano = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">👑 Master Founder</span>';
        } else if (u.plano === 'anual') {
          badgePlano = '<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">💎 VIP Anual Elite</span>';
        } else if (u.plano === 'pro') {
          badgePlano = '<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">🎯 VIP Mensal</span>';
        } else if (u.plano === 'bolao') {
          badgePlano = '<span class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold">👥 Bolão Pro</span>';
        } else {
          badgePlano = '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">🆓 Visitante Free</span>';
        }

        let badgeStatus = '';
        if (u.status === 'ativo') {
          badgeStatus = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ativo</span>';
        } else if (u.status === 'bloqueado') {
          badgeStatus = '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> Bloqueado</span>';
        } else if (u.status === 'expirado') {
          badgeStatus = '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] flex items-center gap-1 w-fit">⚪ Vencido</span>';
        } else {
          badgeStatus = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] flex items-center gap-1 w-fit">🟡 Pendente</span>';
        }

        const codVip = (u.codigoVip || '').toUpperCase().trim();
        const linkVip = `${window.location.origin}${window.location.pathname}?vip=${codVip}`;

        return `
          <tr class="hover:bg-slate-800/40 transition">
            <td class="p-3.5">
              <div class="flex items-center gap-2">
                <span class="text-base">${escaparHtmlSeguro(u.avatar || '👤')}</span>
                <div>
                  <div class="font-bold text-white font-sans flex items-center gap-1.5 flex-wrap">
                    <span>${escaparHtmlSeguro(u.nome)}</span>
                    ${codVip ? `<span class="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-mono font-bold" title="Código VIP: ${codVip}">🔑 ${codVip}</span>` : ''}
                  </div>
                  <div class="text-[10px] text-slate-400 font-sans flex items-center gap-2 flex-wrap mt-0.5">
                    <span>✉️ ${escaparHtmlSeguro(u.email || 'Sem email')}</span>
                    ${u.telefone ? `<span class="text-emerald-400 font-mono font-bold">💬 ${escaparHtmlSeguro(u.telefone)}</span>` : '<span class="text-amber-400/80 italic text-[9px]">⚠️ Sem WhatsApp</span>'}
                  </div>
                </div>
              </div>
            </td>
            <td class="p-3.5">${badgePlano}</td>
            <td class="p-3.5">
              <div class="text-[11px] text-slate-300 font-sans">Expira: <b>${escaparHtmlSeguro(u.dataExpiracao)}</b></div>
              <div class="text-[9px] text-slate-500">Desde: ${escaparHtmlSeguro(u.dataCadastro)}</div>
            </td>
            <td class="p-3.5">${badgeStatus}</td>
            <td class="p-3.5 text-right">
              <div class="flex items-center justify-end gap-1.5 flex-wrap">
                <!-- Ações Prioritárias: WhatsApp & Link Mágico -->
                <button type="button" onclick="enviarConviteWhatsAppAdmin('${u.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-lg text-[10px] shadow transition flex items-center gap-1" title="Enviar convite e link mágico no WhatsApp deste cliente">
                  <span>💬</span> <span>WhatsApp</span>
                </button>
                <button type="button" onclick="copiarLinkVipAdmin('${codVip}')" class="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-bold transition flex items-center gap-1" title="Copiar Link Mágico de Acesso Direto">
                  <span>🔗</span> <span>Link</span>
                </button>
                <button type="button" onclick="abrirModalEditarUsuarioAdmin('${u.id}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold transition" title="Editar dados (WhatsApp, E-mail, Nome)">
                  ✏️
                </button>
                
                <!-- Ações de Licença -->
                <button onclick="concederVipUsuario('${u.id}', 30, 'pro')" class="px-2 py-1 bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 rounded-lg text-[10px] font-bold transition" title="Conceder +30 dias de VIP">
                  +30d
                </button>
                <button onclick="concederVipUsuario('${u.id}', 365, 'anual')" class="px-2 py-1 bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg text-[10px] font-bold transition" title="Upgrade para VIP Anual">
                  💎
                </button>
                <button onclick="alternarBloqueioUsuario('${u.id}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] transition" title="Bloquear ou desbloquear">
                  ${u.status === 'bloqueado' ? '🔓' : '🔒'}
                </button>
                ${u.plano !== 'master' ? `
                <button onclick="excluirUsuarioAdmin('${u.id}')" class="px-1.5 py-1 text-slate-600 hover:text-red-400 transition text-[11px]" title="Excluir da base">
                  🗑️
                </button>` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    function copiarLinkVipAdmin(codigo) {
      if (!codigo) {
        toast('Este usuário não possui código VIP definido.', '⚠️');
        return;
      }
      const link = `${window.location.origin}${window.location.pathname}?vip=${codigo.toUpperCase()}`;
      navigator.clipboard.writeText(link).then(() => {
        toast(`📋 Link VIP copiado: ${link}`, '✨');
        tocarSomNasa('sucesso');
      }).catch(() => {
        prompt('Copie o Link Mágico VIP abaixo:', link);
      });
    }

    function enviarConviteWhatsAppAdmin(userId) {
      const base = carregarBaseUsuariosAdmin();
      const u = base.find(x => x.id === userId);
      if (!u) return;

      let fone = (u.telefone || '').replace(/\D/g, '');
      if (!fone) {
        const informado = prompt(`Informe o WhatsApp de ${u.nome} (com DDD, ex: 11999998888):`);
        if (!informado) return;
        u.telefone = informado.trim();
        salvarBaseUsuariosAdmin(base);
        fone = u.telefone.replace(/\D/g, '');
      }

      const codVip = (u.codigoVip || u.nome.replace(/\s+/g, '').toUpperCase().slice(0, 12)).trim();
      const linkVip = `${window.location.origin}${window.location.pathname}?vip=${codVip}`;

      const texto = 
        `*Convite Exclusivo — Meu Volante PRO*\n\n` +
        `Olá, *${u.nome.split(' ')[0]}*! Aqui é o Vitório Bérgamo.\n\n` +
        `Você foi selecionado como nosso *Testador VIP Pioneiro* no *Meu Volante PRO*! Seu acesso completo com todas as matrizes, filtros orbitais e volante interativo já está 100% liberado.\n\n` +
        `👉 *Acesse agora com 1 toque no seu celular (sem precisar de senha):*\n` +
        `${linkVip}\n\n` +
        `Se preferir ativar manualmente no app, seu código VIP é: *${codVip}*\n\n` +
        `Abra o link, faça seus palpites e depois me diga o que achou das análises! 🎯`;

      window.abrirWhatsApp({ fone: fone, texto: texto });
      toast(`💬 Abrindo WhatsApp para ${u.nome.split(' ')[0]}...`, '📲');
    }

    function abrirModalEditarUsuarioAdmin(userId) {
      const base = carregarBaseUsuariosAdmin();
      const u = base.find(x => x.id === userId);
      if (!u) return;

      let modal = document.getElementById('modal-editar-usuario-admin');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-editar-usuario-admin';
        modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md hidden items-center justify-center p-4 font-sans';
        modal.innerHTML = `
          <div class="bg-slate-900 border-2 border-cyan-500/50 rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-100">
            <button onclick="fecharModalEditarUsuarioAdmin()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold">✕</button>

            <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span class="text-2xl">✏️</span>
              <div>
                <h3 class="text-sm font-black text-white uppercase">Editar Dados do Testador / VIP</h3>
                <p class="text-[10px] text-slate-400">Atualize WhatsApp, e-mail e código de acesso</p>
              </div>
            </div>

            <form id="form-editar-usuario-admin" onsubmit="salvarEdicaoUsuarioAdmin(event)" class="space-y-3 font-mono text-xs">
              <input type="hidden" id="edit-user-id" />

              <div>
                <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Nome Completo</label>
                <input type="text" id="edit-user-nome" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-400 focus:outline-none font-sans" />
              </div>

              <div>
                <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">WhatsApp (com DDD)</label>
                <input type="tel" id="edit-user-telefone" placeholder="Ex: (11) 99999-9999" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold focus:border-cyan-400 focus:outline-none font-sans" />
              </div>

              <div>
                <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">E-mail</label>
                <input type="email" id="edit-user-email" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-400 focus:outline-none font-sans" />
              </div>

              <div>
                <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Código VIP Personalizado</label>
                <input type="text" id="edit-user-codigo-vip" required class="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-300 font-bold uppercase focus:border-amber-400 focus:outline-none font-mono" />
              </div>

              <div>
                <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Observações</label>
                <input type="text" id="edit-user-obs" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:border-cyan-400 focus:outline-none font-sans" />
              </div>

              <div class="pt-2 flex gap-2">
                <button type="button" onclick="fecharModalEditarUsuarioAdmin()" class="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" class="w-1/2 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl shadow-lg transition">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
      }

      document.getElementById('edit-user-id').value = u.id;
      document.getElementById('edit-user-nome').value = u.nome || '';
      document.getElementById('edit-user-telefone').value = u.telefone || '';
      document.getElementById('edit-user-email').value = u.email || '';
      document.getElementById('edit-user-codigo-vip').value = u.codigoVip || '';
      document.getElementById('edit-user-obs').value = u.obs || '';

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function fecharModalEditarUsuarioAdmin() {
      const modal = document.getElementById('modal-editar-usuario-admin');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function salvarEdicaoUsuarioAdmin(e) {
      e.preventDefault();
      const id = document.getElementById('edit-user-id').value;
      const base = carregarBaseUsuariosAdmin();
      const u = base.find(x => x.id === id);
      if (!u) return;

      u.nome = document.getElementById('edit-user-nome').value.trim();
      u.telefone = document.getElementById('edit-user-telefone').value.trim();
      u.email = document.getElementById('edit-user-email').value.trim();
      u.codigoVip = document.getElementById('edit-user-codigo-vip').value.trim().toUpperCase();
      u.obs = document.getElementById('edit-user-obs').value.trim();

      salvarBaseUsuariosAdmin(base);
      fecharModalEditarUsuarioAdmin();
      tocarSomNasa('sucesso');
      toast(`✅ Dados de ${u.nome} atualizados com sucesso!`, '💾');
    }

    function abrirModalNovoUsuarioAdmin() {
      const modal = document.getElementById('modal-novo-usuario-admin');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function fecharModalNovoUsuarioAdmin() {
      const modal = document.getElementById('modal-novo-usuario-admin');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function submeterNovoUsuarioAdmin(e) {
      e.preventDefault();
      const nome = document.getElementById('admin-user-nome').value.trim();
      const telefone = (document.getElementById('admin-user-telefone')?.value || '').trim();
      const email = document.getElementById('admin-user-email').value.trim();
      const plano = document.getElementById('admin-user-plano').value;
      const dias = parseInt(document.getElementById('admin-user-dias').value) || 365;
      const codigoVip = (document.getElementById('admin-user-codigo-vip')?.value || nome.replace(/\s+/g, '').toUpperCase().slice(0, 12)).trim().toUpperCase();
      const obs = document.getElementById('admin-user-obs').value.trim();

      const hoje = new Date();
      const dataExp = new Date();
      dataExp.setDate(hoje.getDate() + dias);

      const nomesPlanos = {
        'pro': 'VIP Mensal (R$ 29,90)',
        'anual': 'VIP Anual (R$ 197,00)',
        'bolao': 'Bolão Pro Sindicato (R$ 59,90)',
        'free': 'Visitante Grátis',
        'master': 'Master Vitalício'
      };

      const avatares = {
        'pro': '🎯',
        'anual': '💎',
        'bolao': '👥',
        'free': '🆓',
        'master': '👑'
      };

      const novo = {
        id: 'usr-' + Date.now(),
        nome,
        email,
        telefone,
        avatar: avatares[plano] || '👤',
        plano,
        planoNome: nomesPlanos[plano] || plano,
        codigoVip,
        dataCadastro: hoje.toISOString().split('T')[0],
        dataExpiracao: dias >= 9000 ? 'Vitalício' : dataExp.toISOString().split('T')[0],
        status: 'ativo',
        valorPago: plano === 'anual' ? 197.00 : (plano === 'pro' ? 29.90 : (plano === 'bolao' ? 59.90 : 0)),
        obs: obs || 'Cadastrado manualmente pelo CEO'
      };

      const base = carregarBaseUsuariosAdmin();
      base.unshift(novo);
      salvarBaseUsuariosAdmin(base);

      fecharModalNovoUsuarioAdmin();
      tocarSomNasa('sucesso');
      toast(`✅ Testador/Cliente ${nome} liberado com código: ${codigoVip}!`, '👑');
      document.getElementById('form-novo-usuario-admin').reset();

      // Já oferece envio no WhatsApp imediatamente se telefone foi informado
      if (telefone) {
        setTimeout(() => {
          if (confirm(`Deseja abrir o WhatsApp agora para enviar o convite VIP para ${nome}?`)) {
            enviarConviteWhatsAppAdmin(novo.id);
          }
        }, 350);
      }
    }

    function concederVipUsuario(id, dias, planoAlvo = 'pro') {
      const base = carregarBaseUsuariosAdmin();
      const u = base.find(x => x.id === id);
      if (!u) return;

      const hoje = new Date();
      const dataExp = new Date();
      dataExp.setDate(hoje.getDate() + dias);

      u.plano = planoAlvo;
      u.planoNome = planoAlvo === 'anual' ? 'VIP Anual' : 'VIP Mensal';
      u.dataExpiracao = dataExp.toISOString().split('T')[0];
      u.status = 'ativo';
      u.avatar = planoAlvo === 'anual' ? '💎' : '🎯';

      salvarBaseUsuariosAdmin(base);
      tocarSomNasa('sucesso');
      toast(`⚡ Acesso VIP de ${u.nome} renovado por +${dias} dias!`, '🌟');
    }

    function alternarBloqueioUsuario(id) {
      const base = carregarBaseUsuariosAdmin();
      const u = base.find(x => x.id === id);
      if (!u) return;
      if (u.plano === 'master') {
        alert('Não é permitido bloquear a conta Master do Fundador.');
        return;
      }

      u.status = u.status === 'bloqueado' ? 'ativo' : 'bloqueado';
      salvarBaseUsuariosAdmin(base);
      toast(`Status de ${u.nome} alterado para: ${u.status.toUpperCase()}`, u.status === 'bloqueado' ? '🔒' : '🔓');
    }

    function excluirUsuarioAdmin(id) {
      if (!confirm('Deseja realmente remover este usuário da base de dados?')) return;
      let base = carregarBaseUsuariosAdmin();
      base = base.filter(x => x.id !== id);
      salvarBaseUsuariosAdmin(base);
      toast('Usuário removido da base com sucesso.', '🗑️');
    }

    function abrirModalSimularWebhook() {
      const modal = document.getElementById('modal-simular-webhook');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    }

    function fecharModalSimularWebhook() {
      const modal = document.getElementById('modal-simular-webhook');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }

    function executarDisparoWebhook() {
      const userId = document.getElementById('webhook-user-select')?.value;
      const gateway = document.getElementById('webhook-gateway')?.value;
      const plano = document.getElementById('webhook-plano')?.value;
      const status = document.getElementById('webhook-status')?.value;

      const base = carregarBaseUsuariosAdmin();
      const u = base.find(x => x.id === userId);
      if (!u) {
        alert('Selecione um usuário válido.');
        return;
      }

      if (status === 'approved') {
        const dias = plano === 'anual' ? 365 : 30;
        const hoje = new Date();
        const dataExp = new Date();
        dataExp.setDate(hoje.getDate() + dias);

        u.plano = plano;
        u.planoNome = plano === 'anual' ? 'VIP Anual' : (plano === 'bolao' ? 'Bolão Pro' : 'VIP Mensal');
        u.status = 'ativo';
        u.dataExpiracao = dataExp.toISOString().split('T')[0];
        u.avatar = plano === 'anual' ? '💎' : '🎯';

        salvarBaseUsuariosAdmin(base);
        tocarSomNasa('sucesso');
        fecharModalSimularWebhook();
        toast(`Pagamento via ${gateway.toUpperCase()} confirmado para ${u.nome}! Plano ativado.`, '⚡');
      } else {
        u.status = 'bloqueado';
        salvarBaseUsuariosAdmin(base);
        fecharModalSimularWebhook();
        toast(`⚠️ WEBHOOK REEMBOLSO: Assinatura de ${u.nome} cancelada.`, '🛑');
      }
    }

    function exportarBaseClientesCSV() {
      const base = carregarBaseUsuariosAdmin();
      let csv = 'ID;Nome;Email;Telefone;Plano;Status;DataCadastro;DataExpiracao;Observacoes\n';
      base.forEach(u => {
        csv += [u.id, u.nome, u.email, u.telefone, u.planoNome, u.status, u.dataCadastro, u.dataExpiracao, u.obs]
          .map(escaparCelulaCsv)
          .join(';') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_loterias_nasa_pro_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('📥 Base de clientes exportada em CSV com sucesso!', '📊');
    }

    function carregarConcursoHistoricoNoVolante(numConcurso, mod = modalidadeAtual) {
      if (mod && mod !== modalidadeAtual && typeof trocarModalidade === 'function') {
        trocarModalidade(mod);
      }
      const base = mod === 'megasena'
        ? (window.baseConcursosMega || baseConcursosMega || [])
        : (window.baseConcursosLoto || baseConcursosLoto || []);
      const conc = base.find((c) => Number(c.concurso) === Number(numConcurso));
      if (!conc) {
        toast(`Concurso #${numConcurso} não encontrado no histórico.`, '⚠️');
        return;
      }

      setJogoAtual([...conc.dezenas].sort((a, b) => a - b));
      atualizarDisplayJogo();
      renderizarVolante();
      executarAnaliseDinamicaDoJogo();
      executarAnaliseVitorio();

      if (typeof activateTab === 'function') {
        activateTab('gerar');
      } else {
        mudarAba('volante');
      }

      if (typeof alternarSubAbaGerar === 'function') {
        alternarSubAbaGerar(window.innerWidth <= 640 ? 'volante' : 'todos');
      }

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

      tocarBeep('success');
      vibrarHaptico(20);
      toast(`🎯 Concurso #${conc.concurso} (${conc.data || ''}) carregado no Volante!`, '🔬');

      setTimeout(() => {
        const display = document.getElementById('display-meu-jogo') || document.getElementById('volante-grid');
        if (display) display.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }

    // ===================================================================
    // EXPOSIÇÃO GLOBAL CONTROLADA PARA MÓDULOS E UI (Meu Volante PRO WINDOW BRIDGE)
    // ===================================================================
    window.carteiraJogos = carteiraJogos;
    window.salvarCarteiraStorage = salvarCarteiraStorage;
    window.removerBilheteCarteira = removerBilheteCarteira;
    window.solicitarLimparCarteira = solicitarLimparCarteira;
    window.atualizarPainelCarteira = atualizarPainelCarteira;
    window.parsearJogosTextoCompleto = parsearJogosTextoCompleto;
    window.sugerirDezenasFaltantes = sugerirDezenasFaltantes;
    window.aceitarSugestaoEImportar = aceitarSugestaoEImportar;
    window.abrirApostaIncompletaNoVolante = abrirApostaIncompletaNoVolante;
    window.mudarAba = mudarAba;
    window.renderizarVolante = renderizarVolante;
    window.atualizarDisplayJogo = atualizarDisplayJogo;
    window.setJogoAtual = setJogoAtual;
    window.getJogoAtual = getJogoAtual;
    window.tocarBeep = tocarBeep;
    window.toast = toast;
    window.sincronizarCarteiraNuvem = sincronizarCarteiraNuvem;
    window.aplicarOrcamentoInteligente = aplicarOrcamentoInteligente;
    window.importarBilheteTexto = importarBilheteTexto;
    window.salvarApostasNaCarteiraAPartirDeTexto = salvarApostasNaCarteiraAPartirDeTexto;
    window.importarJogosDoScannerLote = importarJogosDoScannerLote;
    window.carregarConcursoHistoricoNoVolante = carregarConcursoHistoricoNoVolante;
    window.gerarJogoCalibradoUnico = gerarJogoCalibradoUnico;
    window.avaliarJogo = avaliarJogo;



