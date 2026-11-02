// =========================================================================
// MEU VOLANTE PRO — GESTÃO INTELIGENTE DE CARTEIRA (HIGH-CAPACITY UX)
// Suporta de 1 a 500+ apostas com agrupamento por concurso, filtros e busca
// =========================================================================
(function () {
  'use strict';

  window.carteiraFiltros = {
    modalidade: 'todas', // 'todas', 'megasena', 'lotofacil'
    status: 'todos',     // 'todos', 'pendente', 'premiado'
    modo: 'agrupado',    // 'agrupado' (por concurso) ou 'lista' (plano)
    tempo: 'todos',      // 'todos', 'proximo', 'historico'
    busca: '',
    gruposAbertos: {}
  };

  window.concursoOuDataEhPassado = function (concurso, data, modalidade) {
    const mod = modalidade || 'megasena';
    const base = mod === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
    const numConc = concurso ? Number(String(concurso).replace(/\D/g, '')) : null;
    
    // 1. Se concurso existe na base ou é menor/igual ao último apurado conhecido
    if (numConc && base.length > 0) {
      const ultimo = Number(base[0].concurso);
      if (numConc <= ultimo || base.some(c => Number(c.concurso) === numConc)) {
        return true;
      }
    }

    // 2. Se a data é passada (antes de agora ou passou das 20h)
    if (data) {
      const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(data).trim());
      if (partes) {
        const [, dia, mes, ano] = partes;
        const alvo = new Date(Number(ano), Number(mes) - 1, Number(dia), 20, 0, 0);
        return alvo.getTime() <= Date.now();
      }
    }
    return false;
  };

  window.setFiltroTempoCarteira = function (tempo) {
    window.carteiraFiltros.tempo = tempo;
    ['todos', 'proximo', 'historico'].forEach(t => {
      const btn = document.getElementById(`btn-filtro-tempo-${t}`);
      if (btn) {
        if (t === tempo) {
          btn.className = 'px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 transition font-bold';
        } else {
          btn.className = 'px-2 py-0.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition font-medium';
        }
      }
    });
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.alternarModoCarteira = function (novoModo) {
    window.carteiraFiltros.modo = novoModo;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.setFiltroModalidadeCarteira = function (mod) {
    window.carteiraFiltros.modalidade = mod;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.setFiltroStatusCarteira = function (st) {
    window.carteiraFiltros.status = st;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.filtrarCarteiraBusca = function (texto) {
    const limpo = (texto || '').trim();
    const ehMensagemCompleta = limpo.includes('JOGOS') || limpo.includes('Jogo #') || limpo.includes('👉') || (limpo.split(/\n/).length >= 2) || (limpo.match(/\d+/g) || []).length >= 10;
    
    let avisoBox = document.getElementById('aviso-busca-jogos-colados');
    if (ehMensagemCompleta) {
      if (typeof window.parsearJogosTextoCompleto === 'function') {
        const res = window.parsearJogosTextoCompleto(limpo);
        if (res.jogos && res.jogos.length > 0) {
          if (!avisoBox) {
            const inputBusca = document.querySelector('input[oninput*="filtrarCarteiraBusca"]');
            if (inputBusca && inputBusca.parentElement) {
              const div = document.createElement('div');
              div.id = 'aviso-busca-jogos-colados';
              div.className = 'mt-2 p-3 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl flex items-center justify-between gap-2 text-xs font-sans text-emerald-200 shadow-xl';
              div.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                  <span class="truncate">Identificamos <b>${res.jogos.length} jogos</b> colados aqui!</span>
                </div>
                <button type="button" onclick="salvarApostasDaBuscaRapida()" class="px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shrink-0 shadow active:scale-95 transition">
                  Salvar na Carteira
                </button>
              `;
              inputBusca.parentElement.appendChild(div);
            }
          }
          return;
        }
      }
    }
    if (avisoBox) avisoBox.remove();
    window.carteiraFiltros.busca = limpo.toLowerCase();
    window.atualizarPainelCarteira();
  };

  window.salvarApostasDaBuscaRapida = function () {
    const inputBusca = document.querySelector('input[oninput*="filtrarCarteiraBusca"]');
    const texto = inputBusca?.value || '';
    if (typeof window.salvarApostasNaCarteiraAPartirDeTexto === 'function') {
      window.salvarApostasNaCarteiraAPartirDeTexto(texto);
    } else if (typeof window.importarBilheteTexto === 'function') {
      const inputScanner = document.getElementById('textarea-scanner-lote') || document.getElementById('input-scanner-texto');
      if (inputScanner) inputScanner.value = texto;
      window.importarBilheteTexto();
    }
    if (inputBusca) inputBusca.value = '';
    window.carteiraFiltros.busca = '';
    const avisoBox = document.getElementById('aviso-busca-jogos-colados');
    if (avisoBox) avisoBox.remove();
    window.atualizarPainelCarteira();
  };

  window.alternarGrupoCarteira = function (grupoId) {
    window.carteiraFiltros.gruposAbertos[grupoId] = window.carteiraFiltros.gruposAbertos[grupoId] === false;
    if (typeof window.tocarBeep === 'function') window.tocarBeep('click');
    window.atualizarPainelCarteira();
  };

  window.alternarGavetaFerramentas = function () {
    const gaveta = document.getElementById('gaveta-ferramentas-carteira');
    const icone = document.getElementById('icone-gaveta-ferramentas');
    if (!gaveta) return;
    const fechado = gaveta.classList.contains('hidden');
    if (fechado) {
      gaveta.classList.remove('hidden');
      if (icone) icone.innerText = '▴';
    } else {
      gaveta.classList.add('hidden');
      if (icone) icone.innerText = '▾';
    }
  };

  function obterChaveCarteiraAtiva() {
    if (typeof window.obterChaveStorageCarteira === 'function') {
      return window.obterChaveStorageCarteira();
    }
    const sessao = (typeof usuarioSessao !== 'undefined' && usuarioSessao) ? usuarioSessao : null;
    const email = sessao?.email ? sessao.email.toLowerCase().trim() : (sessao?.cupomAtivo ? `vip_${sessao.cupomAtivo}` : 'visitante_anonimo');
    return `loterias_carteira_${email}`;
  }

  function obterListaCarteira() {
    // Se o usuário estiver desconectado/visitante e a lista em memória estiver vazia, não busca dados de outro usuário
    const sessao = (typeof usuarioSessao !== 'undefined' && usuarioSessao) ? usuarioSessao : null;
    const isVisitante = !sessao || sessao.tipo === 'visitante' || !sessao.email;

    if (Array.isArray(window.carteiraJogos)) {
      if (isVisitante && window.carteiraJogos.length === 0) return [];
      if (window.carteiraJogos.length > 0) return window.carteiraJogos;
    }

    try {
      const chave = obterChaveCarteiraAtiva();
      const bruto = localStorage.getItem(chave);
      if (bruto) {
        const dados = JSON.parse(bruto);
        if (Array.isArray(dados)) {
          window.carteiraJogos = dados;
          return dados;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler carteira:', e);
    }
    window.carteiraJogos = [];
    return [];
  }

  function agruparBilhetes(bilhetes) {
    const grupos = {};
    let houveCorrecaoData = false;

    bilhetes.forEach((b) => {
      const mod = b.modalidade || 'megasena';
      let conc = b.concursoAlvo || b.concurso || 'Próximo';
      let data = b.data || 'Sem data';

      // REGRA MESTRA: A data de um sorteio é única por concurso na Caixa!
      // Se o concurso existe na base oficial (ex: #3077 é 28/10/2026),
      // a data de qualquer aposta desse concurso DEVE ser a data oficial dele!
      const numConc = Number(String(conc).replace(/\D/g, ''));
      const base = mod === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
      const enc = numConc > 0 ? base.find(c => Number(c.concurso) === numConc) : null;
      if (enc && enc.data) {
        if (data !== enc.data || b.data !== enc.data) {
          data = enc.data;
          b.data = enc.data;
          houveCorrecaoData = true;
        }
      }

      // Agrupa estritamente por MODALIDADE + CONCURSO (ex: megasena_#3077)
      // Dois bilhetes do mesmo concurso NUNCA mais serão divididos em cartões separados!
      const concNorm = String(conc).trim().startsWith('#') ? String(conc).trim() : `#${String(conc).trim()}`;
      const grupoChave = `${mod}_${concNorm}`;

      if (!grupos[grupoChave]) {
        grupos[grupoChave] = {
          id: grupoChave,
          modalidade: mod,
          concurso: concNorm,
          data: data,
          bilhetes: [],
          totalCusto: 0,
          totalPremio: 0,
          premiadosCount: 0,
          dezenasSorteadas: null
        };
      }

      grupos[grupoChave].bilhetes.push(b);
      grupos[grupoChave].totalCusto += window.custoDoBilhete(b);
      const premio = Number(b.premioGanho || 0);
      grupos[grupoChave].totalPremio += premio;
      if (premio > 0) grupos[grupoChave].premiadosCount++;

      // Identifica o resultado oficial do concurso para exibir no bilhete
      if (!grupos[grupoChave].dezenasSorteadas) {
        if (Array.isArray(b.dezenasSorteadas) && b.dezenasSorteadas.length > 0) {
          grupos[grupoChave].dezenasSorteadas = b.dezenasSorteadas.map(Number);
        } else {
          if (enc && Array.isArray(enc.dezenas) && enc.dezenas.length > 0) {
            grupos[grupoChave].dezenasSorteadas = enc.dezenas.map(Number);
            if (enc.data) grupos[grupoChave].data = enc.data;
          }
        }
      }
    });

    if (houveCorrecaoData && typeof window.salvarCarteiraStorage === 'function') {
      window.salvarCarteiraStorage();
    }

    Object.values(grupos).forEach(g => {
      if (g.dezenasSorteadas && g.dezenasSorteadas.length > 0) {
        g.bilhetes.forEach(b => {
          if (!b.conferido || b.acertos === undefined) {
            const ac = (b.dezenas || []).filter(d => g.dezenasSorteadas.includes(Number(d))).length;
            b.acertos = ac;
            b.conferido = true;
            b.dezenasSorteadas = g.dezenasSorteadas;
          }
        });
      }
    });

    return Object.values(grupos);
  }

  window.imprimirLoteGrupoCarteira = function (grupoId) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo || !grupo.bilhetes.length) return;
    const jogos = grupo.bilhetes.map(b => b.dezenas);
    if (typeof window.imprimirJogosVolante === 'function') {
      window.imprimirJogosVolante(jogos, grupo.modalidade);
    }
  };

  window.compartilharWhatsAppGrupoCarteira = function (grupoId) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo || !grupo.bilhetes.length) return;

    const modNome = grupo.modalidade === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena';
    let msg = `*Meu Volante PRO — Lote de Apostas*\n`;
    msg += `Modalidade: *${modNome}*\n`;
    msg += `Concurso: *${grupo.concurso}* (${grupo.data})\n`;
    msg += `Total de Jogos: *${grupo.bilhetes.length}*\n\n`;

    grupo.bilhetes.forEach((b, idx) => {
      const dezenasFormatadas = b.dezenas.map(n => String(n).padStart(2, '0')).join(' - ');
      msg += `*Jogo #${idx + 1}:* ${dezenasFormatadas}\n`;
    });

    msg += `\n*Meu Volante PRO* — Monte e audite seus bolões:\n👉 https://loterias.pd.dev.br/`;
    if (typeof window.abrirWhatsApp === 'function') {
      window.abrirWhatsApp({ texto: msg });
    } else {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    }
  };

  window.removerLoteGrupoCarteira = function (grupoId) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    // Emite alerta sonoro de aviso para evitar exclusão desatenta
    if (typeof window.tocarSomNasa === 'function') {
      window.tocarSomNasa('alerta');
    } else if (typeof window.tocarBeep === 'function') {
      window.tocarBeep('alert');
    }

    const executarRemocao = () => {
      // Confirmação dupla para lotes expressivos (5 ou mais apostas)
      const totalJogos = grupo.bilhetes.length;
      if (totalJogos >= 5) {
        const confirmacaoFinal = confirm(`⚠️ ATENÇÃO: Você está prestes a apagar ${totalJogos} apostas de uma vez só!\n\nTem certeza absoluta que deseja descartar este lote de jogos?`);
        if (!confirmacaoFinal) return;
      }

      const idsRemover = new Set(grupo.bilhetes.map(b => String(b.id)));
      const novaLista = (window.carteiraJogos || []).filter(b => !idsRemover.has(String(b.id)));
      window.carteiraJogos = novaLista;
      if (typeof carteiraJogos !== 'undefined') carteiraJogos = novaLista;

      const chave = obterChaveCarteiraAtiva();
      try {
        localStorage.setItem(chave, JSON.stringify(novaLista));
        const leg = localStorage.getItem('loterias_carteira_db');
        if (leg) {
          const dadosLeg = JSON.parse(leg);
          if (Array.isArray(dadosLeg)) {
            const limpos = dadosLeg.filter(b => !idsRemover.has(String(b.id)));
            localStorage.setItem('loterias_carteira_db', JSON.stringify(limpos));
          }
        }
      } catch (e) {
        console.warn('Erro ao persistir exclusão de lote:', e);
      }

      // Deleta imediatamente do Supabase na nuvem para não ressuscitar no sync
      try {
        const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
        if (cliente) {
          const idsArr = Array.from(idsRemover);
          cliente.auth.getSession().then(({ data }) => {
            const uid = data?.session?.user?.id;
            if (uid) cliente.from('carteira_apostas').delete().eq('user_id', uid).in('bilhete_id', idsArr).then();
          });
        }
      } catch (e) {
        console.warn('Erro ao deletar da nuvem:', e);
      }

      if (typeof window.salvarCarteiraStorage === 'function') window.salvarCarteiraStorage();
      window.atualizarPainelCarteira();
      if (typeof window.toast === 'function') window.toast(`Lote de ${grupo.bilhetes.length} aposta(s) excluído com sucesso.`, '🗑️');
    };

    const textoAviso = `Deseja realmente apagar todas as ${grupo.bilhetes.length} aposta(s) do Concurso ${grupo.concurso}?`;

    if (typeof window.abrirModalDialog === 'function') {
      window.abrirModalDialog(textoAviso, executarRemocao);
    } else if (confirm(textoAviso)) {
      executarRemocao();
    }
  };

  window.reatribuirConcursoLote = function (grupoId, concursoAlvoDesejado) {
    const bilhetes = obterListaCarteira();
    const grupos = agruparBilhetes(bilhetes);
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    const base = grupo.modalidade === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
    let concursoDestino = concursoAlvoDesejado;

    if (!concursoDestino) {
      const ultimosConc = base.slice(0, 4).map(c => `#${c.concurso}`);
      const sugestao = ultimosConc[0] || '#3077';
      const digitado = prompt(
        `Para qual concurso você deseja mover esta(s) ${grupo.bilhetes.length} aposta(s)?\nSugestões: ${ultimosConc.join(', ')}`,
        sugestao
      );
      if (!digitado || !digitado.trim()) return;
      concursoDestino = digitado.trim();
    }

    const concFormatado = concursoDestino.startsWith('#') ? concursoDestino : `#${concursoDestino}`;
    const numConc = Number(concFormatado.replace(/\D/g, ''));
    const achado = base.find(c => Number(c.concurso) === numConc);
    const novaData = achado?.data || grupo.data;

    const idsGrupo = new Set(grupo.bilhetes.map(b => String(b.id)));
    (window.carteiraJogos || []).forEach(b => {
      if (idsGrupo.has(String(b.id))) {
        b.concursoAlvo = concFormatado;
        b.concurso = concFormatado;
        if (novaData) b.data = novaData;
        b.conferido = false;
        b.status = 'Aguardando conferência';
        b.premioGanho = 0;
        b.acertos = undefined;
      }
    });

    if (typeof window.salvarCarteiraStorage === 'function') window.salvarCarteiraStorage();
    window.atualizarPainelCarteira();

    if (typeof window.conferirSorteiosPassadosAutomatico === 'function') {
      window.conferirSorteiosPassadosAutomatico();
    }

    if (typeof window.toast === 'function') {
      window.toast(`Aposta(s) movida(s) para o Concurso ${concFormatado}!`, '✅');
    }
  };

  // Substitui a renderização padrão da carteira por uma interface de alta escalabilidade
  window.renderizarCarteiraInteligente = function () {
    const container = document.getElementById('container-bilhetes-salvos');
    if (!container) return;

    const listaOriginal = obterListaCarteira();
    const totalEl = document.getElementById('total-bilhetes-salvos');
    if (totalEl) totalEl.innerText = listaOriginal.length;

    // Métricas financeiras da banca
    let totalGasto = 0;
    let totalGanho = 0;
    listaOriginal.forEach(b => {
      const custoPadrao = b.modalidade === 'lotofacil' ? 3.5 : 6.0;
      totalGasto += Number(b.custo || custoPadrao);
      totalGanho += Number(b.premioGanho || 0);
    });

    const fmtBRL = typeof window.formatarReais === 'function' 
      ? window.formatarReais 
      : (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const invEl = document.getElementById('banca-investido');
    const premEl = document.getElementById('banca-premios');
    const lucroEl = document.getElementById('banca-lucro');
    if (invEl) invEl.innerText = fmtBRL(totalGasto);
    if (premEl) premEl.innerText = fmtBRL(totalGanho);
    const lucro = totalGanho - totalGasto;
    if (lucroEl) {
      lucroEl.innerText = fmtBRL(lucro);
      lucroEl.className = lucro >= 0 ? 'text-emerald-400 text-sm block mt-0.5 font-bold' : 'text-rose-400 text-sm block mt-0.5 font-bold';
    }

    if (typeof window.atualizarCalibracaoPortfolio === 'function') {
      try { window.atualizarCalibracaoPortfolio(); } catch (e) {}
    }

    // Filtragem em memória
    let filtrados = [...listaOriginal];

    if (window.carteiraFiltros.modalidade !== 'todas') {
      filtrados = filtrados.filter(b => (b.modalidade || 'megasena') === window.carteiraFiltros.modalidade);
    }

    if (window.carteiraFiltros.tempo === 'proximo') {
      filtrados = filtrados.filter(b => !window.concursoOuDataEhPassado(b.concursoAlvo || b.concurso, b.data, b.modalidade));
    } else if (window.carteiraFiltros.tempo === 'historico') {
      filtrados = filtrados.filter(b => window.concursoOuDataEhPassado(b.concursoAlvo || b.concurso, b.data, b.modalidade));
    }

    if (window.carteiraFiltros.status === 'pendente') {
      filtrados = filtrados.filter(b => !b.conferido || Number(b.premioGanho || 0) === 0);
    } else if (window.carteiraFiltros.status === 'premiado') {
      filtrados = filtrados.filter(b => Number(b.premioGanho || 0) > 0);
    }

    if (window.carteiraFiltros.busca) {
      const q = window.carteiraFiltros.busca;
      filtrados = filtrados.filter(b => {
        const dezenasStr = (b.dezenas || []).join(' ');
        const concStr = String(b.concursoAlvo || b.concurso || '').toLowerCase();
        const nomeStr = String(b.nome || '').toLowerCase();
        return dezenasStr.includes(q) || concStr.includes(q) || nomeStr.includes(q);
      });
    }

    // Atualiza status do botão principal de conferência no topo
    const btnConferir = document.getElementById('btn-conferir-carteira-topo') || document.querySelector('button[onclick*="conferirTodosBilhetesSalvos"]');
    if (btnConferir) {
      if (listaOriginal.length === 0) {
        btnConferir.className = 'px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs rounded-xl shadow cursor-not-allowed opacity-60';
        btnConferir.innerHTML = '<span>Conferir jogos</span>';
      } else {
        const todosConferidos = listaOriginal.every(b => b.conferido);
        const temPendentesPassados = listaOriginal.some(b => !b.conferido && window.concursoOuDataEhPassado(b.concursoAlvo || b.concurso, b.data, b.modalidade));
        if (todosConferidos) {
          btnConferir.className = 'px-3 py-1.5 bg-slate-900 text-emerald-400 border border-emerald-500/40 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5';
          btnConferir.innerHTML = '<span>✓</span> <span>CONFERIDO</span>';
        } else if (temPendentesPassados) {
          btnConferir.className = 'px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition flex items-center gap-1.5 animate-pulse';
          btnConferir.innerHTML = '<span>CONFERIR AGORA</span>';
        } else {
          btnConferir.className = 'px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow active:scale-95 transition flex items-center gap-1.5';
          btnConferir.innerHTML = '<span>Conferir jogos</span>';
        }
      }
    }

    if (filtrados.length === 0) {
      if (listaOriginal.length === 0) {
        container.innerHTML = `
          <div class="py-12 px-4 text-center space-y-4 bg-slate-950/80 rounded-3xl border border-dashed border-slate-800 shadow-xl">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-emerald-950 border border-cyan-800/60 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/10">
              🎟️
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-black text-white">Sua carteira está pronta</h4>
              <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Você ainda não tem apostas registradas. Gere um jogo ou cole suas apostas para começar.
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-2 pt-2">
              <button type="button" onclick="mudarAba('gerador')" class="px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center gap-1.5 font-mono">
                Gerar jogo
              </button>
              <button type="button" onclick="alternarSubAbaCarteira('ferramentas')" class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 active:scale-95 transition flex items-center gap-1.5">
                Colar Apostas
              </button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <p class="text-xs text-slate-400">Nenhum bilhete encontrado com os filtros selecionados.</p>
            <button onclick="window.carteiraFiltros.modalidade='todas'; window.carteiraFiltros.status='todos'; window.carteiraFiltros.busca=''; window.atualizarPainelCarteira();" class="text-cyan-400 text-xs underline font-bold">
              Limpar Filtros (${listaOriginal.length} apostas salvas)
            </button>
          </div>
        `;
      }
      return;
    }

    // MODO 1: AGRUPADO POR CONCURSO / DATA (PADRÃO FINTECH PREMIUM 10/10)
    if (window.carteiraFiltros.modo === 'agrupado') {
      const grupos = agruparBilhetes(filtrados);

      container.innerHTML = grupos.map((g) => {
        const aberto = window.carteiraFiltros.gruposAbertos[g.id] !== false;
        const isMega = g.modalidade === 'megasena';
        const todosConferidos = g.bilhetes.every(b => b.conferido);
        const algumConferido = g.bilhetes.some(b => b.conferido);
        const ehPassado = window.concursoOuDataEhPassado(g.concurso, g.data, g.modalidade);

        let statusBadge = '';
        if (g.totalPremio > 0) {
          statusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">🏆 ${g.premiadosCount} Premiado(s) • ${fmtBRL(g.totalPremio)}</span>`;
        } else if (todosConferidos || algumConferido) {
          const maxAcertos = Math.max(0, ...g.bilhetes.map(b => b.acertos || 0));
          const rotulo = maxAcertos > 0 ? `${maxAcertos} acerto${maxAcertos > 1 ? 's' : ''}` : '0 acertos';
          statusBadge = `<span class="status-badge-apurado px-2.5 py-1 rounded-full text-[10px] font-bold">✅ Apurado • ${rotulo}</span>`;
        } else if (ehPassado) {
          statusBadge = `<button type="button" onclick="event.stopPropagation(); conferirTodosBilhetesSalvos()" class="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-black transition flex items-center gap-1 shadow">⚡ Concurso Apurado • Conferir</button>`;
        } else {
          const modBase = g.modalidade === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
          const ultimoNum = modBase.length > 0 ? `#${modBase[0].concurso}` : '#3077';
          statusBadge = `
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="status-badge-aguardando px-2.5 py-1 rounded-full text-[10px] font-medium">⏳ Aguardando Sorteio</span>
            </div>
          `;
        }

        return `
          <div class="card-concurso-grupo rounded-2xl border overflow-hidden shadow-sm transition">
            <!-- Barra Colorida de Topo (Identidade da Modalidade) -->
            <div class="h-1 bg-gradient-to-r ${isMega ? 'from-emerald-500 via-teal-400 to-cyan-500' : 'from-purple-500 via-fuchsia-400 to-pink-500'}"></div>

            <!-- Cabeçalho do Concurso (Estilo Bilhete Oficial Coeso) -->
            <div class="header-concurso-grupo p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-dashed cursor-pointer select-none" onclick="alternarGrupoCarteira('${g.id}')">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl ${isMega ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'} border flex items-center justify-center text-base flex-shrink-0">
                  ${isMega ? '🍀' : '🟣'}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-xs sm:text-sm font-black font-mono whitespace-nowrap">
                      ${isMega ? 'Mega-Sena' : 'Lotofácil'} ${g.concurso.startsWith('#') ? g.concurso : `#${g.concurso}`}
                    </h4>
                    <span class="data-pill-concurso text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap">📅 ${g.data}</span>
                  </div>
                  <p class="text-[11px] font-sans mt-0.5 text-concurso-sub">
                    ${g.bilhetes.length} aposta${g.bilhetes.length > 1 ? 's' : ''} • <strong class="font-mono text-concurso-custo">${fmtBRL(g.totalCusto)}</strong>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                ${statusBadge}
                <button type="button" onclick="event.stopPropagation(); removerLoteGrupoCarteira('${g.id}')" class="btn-toggle-grupo w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center border text-rose-500 hover:text-rose-600" title="Excluir todas as apostas deste concurso">
                  🗑️
                </button>
                <button type="button" class="btn-toggle-grupo w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center border" title="${aberto ? 'Recolher' : 'Ver Jogos'}">
                  ${aberto ? '▴' : '▾'}
                </button>
              </div>
            </div>

            <!-- Faixa do Resultado Oficial da Caixa (Quando Sorteado) -->
            ${aberto && g.dezenasSorteadas && g.dezenasSorteadas.length > 0 ? `
              <div class="sorteio-oficial-faixa px-3 py-2 flex items-center justify-between gap-2 flex-wrap border-b">
                <span class="sorteio-oficial-rotulo text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                  Sorteio Oficial Caixa:
                </span>
                <div class="flex items-center gap-1 flex-wrap">
                  ${g.dezenasSorteadas.map(d => `<span class="sorteio-bola-dezena w-6 h-6 rounded-md font-black text-[10px] font-mono flex items-center justify-center border shadow-sm">${String(d).padStart(2,'0')}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Lista de Bilhetes do Concurso -->
            ${aberto ? `
              <div class="corpo-bilhetes-grupo p-2 sm:p-3 space-y-1.5 divide-y">
                ${g.bilhetes.map((b, idx) => {
                  const dezenasSorteadas = (b.dezenasSorteadas || g.dezenasSorteadas || []).map(Number);
                  const foiConferido = Boolean(b.conferido || b.acertos !== undefined);
                  const acertos = b.acertos !== undefined ? b.acertos : (dezenasSorteadas.length > 0 ? (b.dezenas || []).filter(d => dezenasSorteadas.includes(Number(d))).length : null);
                  const acertouAlgum = (acertos || 0) > 0;
                  const isLoto = (b.dezenas || []).length > 10;
                  return `
                    <div class="linha-bilhete-item py-2.5 px-2.5 sm:px-3 rounded-xl flex items-center justify-between gap-2 text-xs transition ${b.premioGanho > 0 ? 'linha-premiada' : ''}">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="linha-num-ordem font-mono font-bold text-[10px] w-4 flex-shrink-0">#${idx + 1}</span>
                        <div class="${isLoto ? 'grid grid-cols-5 sm:grid-cols-8 gap-1 items-center' : 'flex flex-wrap gap-1 sm:gap-1.5 items-center'}">
                          ${b.dezenas.map(d => {
                            const acertou = dezenasSorteadas.includes(Number(d));
                            return `<span class="${isLoto ? 'w-5 h-5 sm:w-6 sm:h-6 text-[9px] sm:text-[10px]' : 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs'} rounded-lg font-mono font-bold flex items-center justify-center transition ${
                              acertou
                                ? 'sorteio-bola-acerto'
                                : 'sorteio-bola-padrao'
                            }">${String(d).padStart(2,'0')}</span>`;
                          }).join('')}
                        </div>
                      </div>

                      <div class="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 font-mono">
                        ${b.premioGanho > 0 ? `
                          <span class="status-badge-premiado px-2 py-0.5 rounded-md font-black text-[10px] shadow">
                            🏆 ${fmtBRL(b.premioGanho)}
                          </span>
                        ` : foiConferido && acertos !== null ? `
                          <span class="linha-acertos-rotulo text-[11px] font-bold ${acertouAlgum ? 'linha-acertou' : 'linha-sem-acerto'}">
                            ${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}
                          </span>
                        ` : `
                          <span class="text-[10px] linha-sem-acerto">Pendente</span>
                        `}
                        <button type="button" onclick="event.stopPropagation(); removerBilheteCarteira('${b.id}')" class="btn-remover-bilhete w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-bold transition text-rose-400 hover:text-white hover:bg-rose-600/40 border border-rose-500/30" title="Excluir este jogo">
                          ✕
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Rodapé de Ações do Bilhete (Discreto e Elegante) -->
              <div class="rodape-acoes-grupo px-3.5 py-2 border-t flex justify-between items-center text-[11px] font-sans flex-wrap gap-2">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <button type="button" onclick="compartilharWhatsAppGrupoCarteira('${g.id}')" class="btn-acao-grupo-whats hover:opacity-80 font-bold transition flex items-center gap-1">
                    WhatsApp
                  </button>
                  <span class="divisor-acoes-ponto">•</span>
                  <button type="button" onclick="imprimirLoteGrupoCarteira('${g.id}')" class="btn-acao-grupo-print hover:opacity-80 font-bold transition flex items-center gap-1">
                    Imprimir A4
                  </button>
                  <span class="divisor-acoes-ponto">•</span>
                  <button type="button" onclick="reatribuirConcursoLote('${g.id}')" class="btn-acao-grupo-mudar hover:opacity-80 font-bold transition flex items-center gap-1" title="Corrigir o número do concurso deste lote">
                    Mudar Concurso
                  </button>
                </div>
                <button type="button" onclick="removerLoteGrupoCarteira('${g.id}')" class="btn-acao-grupo-excluir text-[10px] font-bold transition">
                  Excluir lote
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
      return;
    }

    // MODO 2: LISTA PLANA INDIVIDUAL
    container.innerHTML = filtrados.map((b, idx) => {
      const isMega = (b.modalidade || 'megasena') === 'megasena';
      const dezenasSorteadas = (b.dezenasSorteadas || []).map(Number);
      const foiConferido = Boolean(b.conferido || b.acertos !== undefined);
      const acertos = b.acertos !== undefined ? b.acertos : (dezenasSorteadas.length > 0 ? (b.dezenas || []).filter(d => dezenasSorteadas.includes(Number(d))).length : null);
      return `
        <div class="card-bilhete-individual p-3 rounded-2xl border shadow-sm flex items-center justify-between gap-2 text-xs font-mono">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${isMega ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}">${(b.modalidade || 'megasena').toUpperCase()}</span>
              ${b.concursoAlvo ? `<span class="linha-acertos-rotulo text-[10px] font-bold">${b.concursoAlvo}</span>` : ''}
              <span class="linha-sem-acerto text-[10px]">📅 ${b.data || 'Oficial'}</span>
              ${b.premioGanho > 0 ? `<span class="status-badge-premiado text-[10px] px-1.5 py-0.5 rounded font-black">🏆 +${fmtBRL(b.premioGanho)}</span>` : foiConferido ? `<span class="linha-sem-acerto text-[10px]">${acertos || 0} acertos</span>` : '<span class="linha-sem-acerto text-[9px]">Pendente</span>'}
            </div>
            <div class="flex flex-wrap gap-1">
              ${b.dezenas.map(d => {
                const acertou = dezenasSorteadas.includes(Number(d));
                return `<span class="w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center transition ${
                  acertou ? 'sorteio-bola-acerto' : 'sorteio-bola-padrao'
                }">${String(d).padStart(2,'0')}</span>`;
              }).join('')}
            </div>
          </div>
          <button type="button" onclick="removerBilheteCarteira('${b.id}')" class="btn-remover-bilhete w-7 h-7 rounded-lg flex items-center justify-center text-xs transition flex-shrink-0" title="Remover aposta">
            🗑️
          </button>
        </div>
      `;
    }).join('');
  };

  // Garante a substituição suave da função de renderização
  window.atualizarPainelCarteira = function () {
    window.renderizarCarteiraInteligente();
  };

  // =========================================================================
  // SINCRONIZAÇÃO UNIVERSAL DE CARTEIRA ENTRE CELULARES (TRANSFERÊNCIA INSTANTÂNEA)
  // Permite abrir os mesmos jogos em qualquer outro celular via WhatsApp, Link ou Código
  // =========================================================================

  window.compactarCarteiraBase64 = function (lista) {
    try {
      const arr = Array.isArray(lista) ? lista : (window.carteiraJogos || []);
      const compactos = arr.map(b => ({
        id: b.id || Date.now(),
        m: (b.modalidade === 'lotofacil' ? 'l' : 'm'),
        d: (b.dezenas || []).map(Number),
        c: b.concursoAlvo || '',
        dt: b.data || '',
        s: Number(b.score || 98),
        j: b.registradoComoJogado ? 1 : 0
      }));
      const json = JSON.stringify(compactos);
      const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
      return encodeURIComponent(b64);
    } catch (e) {
      console.error('[Sync] Erro ao compactar carteira:', e);
      return '';
    }
  };

  window.descompactarCarteiraBase64 = function (b64url) {
    try {
      if (!b64url) return [];
      let limpo = b64url.trim();
      if (limpo.includes('sync=')) {
        const urlObj = new URL(limpo.startsWith('http') ? limpo : ('https://fake.domain/' + limpo));
        limpo = urlObj.searchParams.get('sync') || '';
      }
      const b64 = decodeURIComponent(limpo);
      const json = decodeURIComponent(atob(b64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) return [];
      return arr.map(c => ({
        id: c.id || (Date.now() + Math.floor(Math.random() * 1000)),
        modalidade: c.m === 'l' ? 'lotofacil' : 'megasena',
        nome: (c.m === 'l' ? 'Lotofácil' : 'Mega-Sena') + ' • ' + ((c.d && c.d.length) || 6) + ' Dezenas',
        dezenas: Array.isArray(c.d) ? c.d.map(Number) : [],
        concursoAlvo: c.c || 'Próximo Oficial',
        data: c.dt || new Date().toLocaleDateString('pt-BR'),
        score: Number(c.s || 98),
        registradoComoJogado: Boolean(c.j),
        dataRegistro: new Date().toISOString()
      }));
    } catch (e) {
      console.error('[Sync] Erro ao descompactar carteira:', e);
      return [];
    }
  };

  window.gerarLinkSincronizacaoCarteira = function () {
    const lista = window.carteiraJogos || [];
    const b64 = window.compactarCarteiraBase64(lista);
    const cupom = (window.usuarioSessao && window.usuarioSessao.cupomAtivo) || localStorage.getItem('loterias_nasa_vip_cupom') || 'VIPVITORIO';
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?sync=${b64}&vip=${encodeURIComponent(cupom)}`;
  };

  window.enviarSincronizacaoWhatsApp = function () {
    const lista = window.carteiraJogos || [];
    if (lista.length === 0) {
      if (typeof window.toast === 'function') window.toast('Sua carteira está vazia! Gere ou salve jogos primeiro.', '⚠️');
      return;
    }
    const link = window.gerarLinkSincronizacaoCarteira();
    const nome = (window.usuarioSessao && window.usuarioSessao.nome) || 'Apostador VIP';
    const total = lista.length;

    const texto = 
      `*Meu Volante PRO — Sincronização de Jogos entre Aparelhos*\n\n` +
      `👤 *Testador VIP:* ${nome}\n` +
      `📦 *Total de Jogos Salvos:* ${total} bilhete(s)\n\n` +
      `👉 *Abra este link no seu outro celular para carregar todos os seus jogos instantaneamente:*\n` +
      `${link}\n\n` +
      `Ao abrir o link no seu outro celular, todos os seus jogos e seu acesso VIP serão ativados automaticamente! 🎯`;

    if (typeof window.abrirWhatsApp === 'function') {
      window.abrirWhatsApp({ texto: texto });
    } else {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(texto)}`;
    }
    if (typeof window.toast === 'function') window.toast('Abrindo WhatsApp para enviar ao outro celular...', '📲');
  };

  window.copiarLinkSincronizacaoCarteira = function () {
    const link = window.gerarLinkSincronizacaoCarteira();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        if (typeof window.toast === 'function') window.toast('Link copiado! Envie para seu outro celular.', '📋');
      }).catch(() => {
        prompt('Copie o link abaixo e abra no outro celular:', link);
      });
    } else {
      prompt('Copie o link abaixo e abra no outro celular:', link);
    }
  };

  window.importarJogosSincronizados = function (jogos, notificar = true) {
    if (!Array.isArray(jogos) || jogos.length === 0) return 0;
    const chaveAtiva = obterChaveCarteiraAtiva();
    let local = Array.isArray(window.carteiraJogos) ? window.carteiraJogos : (JSON.parse(localStorage.getItem(chaveAtiva) || '[]'));
    
    // Deduplicação inteligente
    const assinaturas = new Set(local.map(b => `${b.modalidade}_${b.concursoAlvo || ''}_${(b.dezenas || []).slice().sort((a,b)=>a-b).join('-')}`));
    let novos = 0;

    jogos.forEach(j => {
      const sig = `${j.modalidade}_${j.concursoAlvo || ''}_${(j.dezenas || []).slice().sort((a,b)=>a-b).join('-')}`;
      if (!assinaturas.has(sig)) {
        local.unshift(j);
        assinaturas.add(sig);
        novos++;
      }
    });

    window.carteiraJogos = local;
    localStorage.setItem(chaveAtiva, JSON.stringify(local));
    if (typeof window.salvarCarteiraStorage === 'function') window.salvarCarteiraStorage();
    if (typeof window.atualizarPainelCarteira === 'function') window.atualizarPainelCarteira();
    if (typeof window.renderizarCockpitInicioApostador === 'function') window.renderizarCockpitInicioApostador();

    if (notificar && typeof window.toast === 'function') {
      window.toast(`🎉 ${novos > 0 ? novos : jogos.length} jogos carregados com sucesso neste aparelho!`, '📲');
    }
    return novos;
  };

  window.processarParametroSyncUrl = function () {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncVal = params.get('sync') || params.get('carteira') || params.get('jogos');
      if (syncVal) {
        const jogos = window.descompactarCarteiraBase64(syncVal);
        if (jogos && jogos.length > 0) {
          window.importarJogosSincronizados(jogos, true);
        }
      }
    } catch (e) {
      console.warn('[Sync] Erro ao processar URL sync:', e);
    }
  };

  window.abrirModalSincronizarAparelhos = function () {
    const total = (window.carteiraJogos || []).length;
    let modal = document.getElementById('modal-sincronizar-aparelhos');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-sincronizar-aparelhos';
      modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md hidden items-center justify-center p-4 font-sans';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative animate-scaleUp">
        <button type="button" onclick="fecharModalSincronizarAparelhos()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">✕</button>

        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-2xl shadow-lg">📲</div>
          <div>
            <h3 class="text-base font-black text-white">Sincronizar Entre Celulares</h3>
            <p class="text-xs text-cyan-300 font-mono">Abra seus jogos em qualquer aparelho</p>
          </div>
        </div>

        <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
          <div class="flex items-center justify-between font-bold text-white">
            <span>Jogos Prontos para Enviar:</span>
            <span class="text-emerald-400 font-mono text-sm">${total} aposta(s)</span>
          </div>
          <p class="text-[11px] text-slate-400">
            Você pode mandar o link direto para o seu WhatsApp e abrir no outro aparelho com 1 toque.
          </p>
        </div>

        <div class="space-y-2 pt-1">
          <button type="button" onclick="enviarSincronizacaoWhatsApp(); fecharModalSincronizarAparelhos();" class="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition">
            <span>Enviar para Meu WhatsApp (Abrir no outro celular)</span>
          </button>

          <button type="button" onclick="copiarLinkSincronizacaoCarteira();" class="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-95">
            <span>Copiar Link de Transferência</span>
          </button>
        </div>

        <div class="border-t border-slate-800 pt-3 space-y-2">
          <label class="text-[11px] font-bold text-slate-400 block">📥 Ou Cole o Link/Código do Outro Celular Aqui:</label>
          <div class="flex gap-2">
            <input type="text" id="input-sync-manual" placeholder="Cole o link ou código recebido..." class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono" />
            <button type="button" onclick="submeterImportacaoSyncManual()" class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs shrink-0 transition">Importar</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.fecharModalSincronizarAparelhos = function () {
    const modal = document.getElementById('modal-sincronizar-aparelhos');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  window.submeterImportacaoSyncManual = function () {
    const el = document.getElementById('input-sync-manual');
    const valor = el ? el.value.trim() : '';
    if (!valor) {
      if (typeof window.toast === 'function') window.toast('Cole o link ou código de transferência primeiro.', '⚠️');
      return;
    }
    const jogos = window.descompactarCarteiraBase64(valor);
    if (!jogos || jogos.length === 0) {
      if (typeof window.toast === 'function') window.toast('Código de sincronização inválido ou vazio.', '❌');
      return;
    }
    window.importarJogosSincronizados(jogos, true);
    window.fecharModalSincronizarAparelhos();
  };
})();
