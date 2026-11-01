// =========================================================================
// MEU VOLANTE PRO — SIMULADOR RETROSPECTIVO ("E SE EU TIVESSE JOGADO?")
// =========================================================================
(function () {
  'use strict';

  function obterBaseConcursos(modalidade) {
    if (modalidade === 'lotofacil') {
      return Array.isArray(window.baseConcursosLoto) ? window.baseConcursosLoto : [];
    }
    return Array.isArray(window.baseConcursosMega) ? window.baseConcursosMega : [];
  }

  function avaliarJogoContraConcurso(dezenasJogo, concurso, modalidade) {
    const sorteadas = (concurso.dezenas || []).map(Number);
    const jogo = (dezenasJogo || []).map(Number);
    const acertos = jogo.filter(d => sorteadas.includes(d));
    const qtdAcertos = acertos.length;

    let premiado = false;
    let faixa = null;
    let estimativaPremio = 0;

    if (modalidade === 'lotofacil') {
      if (qtdAcertos === 11) { premiado = true; faixa = '11 Pontos'; estimativaPremio = 6.00; }
      else if (qtdAcertos === 12) { premiado = true; faixa = '12 Pontos'; estimativaPremio = 12.00; }
      else if (qtdAcertos === 13) { premiado = true; faixa = '13 Pontos'; estimativaPremio = 30.00; }
      else if (qtdAcertos === 14) { premiado = true; faixa = '14 Pontos'; estimativaPremio = concurso.premio14 || 1800.00; }
      else if (qtdAcertos === 15) { premiado = true; faixa = '15 Pontos (MÁXIMO)'; estimativaPremio = concurso.premio15 || 1700000.00; }
    } else {
      // Mega-Sena
      if (qtdAcertos === 4) { premiado = true; faixa = 'Quadra'; estimativaPremio = concurso.premioQuadra || 1100.00; }
      else if (qtdAcertos === 5) { premiado = true; faixa = 'Quina'; estimativaPremio = concurso.premioQuina || 45000.00; }
      else if (qtdAcertos === 6) { premiado = true; faixa = 'Sena (PRÊMIO MÁXIMO)'; estimativaPremio = concurso.premioSena || 35000000.00; }
    }

    return {
      concurso: concurso.concurso,
      data: concurso.data || 'Oficial',
      sorteadas,
      acertos,
      qtdAcertos,
      premiado,
      faixa,
      estimativaPremio
    };
  }

  function executarSimulacao(jogos, modalidade, limiteConcursos = 10) {
    const base = obterBaseConcursos(modalidade);
    const listaConcursos = base.slice(0, limiteConcursos);

    if (listaConcursos.length === 0) {
      return { erro: 'Sem histórico de concursos carregado. Sincronize com a Caixa primeiro.' };
    }

    const precoUnitario = modalidade === 'lotofacil' ? 3.00 : 5.00;
    let totalInvestido = 0;
    let totalPremios = 0;
    let totalBilhetesPremiados = 0;
    const historicoSimulado = [];

    listaConcursos.forEach(concurso => {
      const resultadosJogos = jogos.map(j => avaliarJogoContraConcurso(j, concurso, modalidade));
      totalInvestido += jogos.length * precoUnitario;

      resultadosJogos.forEach(res => {
        if (res.premiado) {
          totalBilhetesPremiados++;
          totalPremios += res.estimativaPremio;
        }
      });

      const melhorNoConcurso = [...resultadosJogos].sort((a, b) => b.qtdAcertos - a.qtdAcertos)[0];

      historicoSimulado.push({
        concurso: concurso.concurso,
        data: concurso.data,
        sorteadas: concurso.dezenas,
        melhorJogo: melhorNoConcurso,
        totalAcertosDesteConcurso: resultadosJogos.filter(r => r.premiado).length,
        retornoConcurso: resultadosJogos.reduce((acc, r) => acc + (r.premiado ? r.estimativaPremio : 0), 0)
      });
    });

    const saldo = totalPremios - totalInvestido;
    const roi = totalInvestido > 0 ? ((totalPremios / totalInvestido) * 100) : 0;

    return {
      modalidade,
      totalJogos: jogos.length,
      concursosAnalisados: listaConcursos.length,
      totalInvestido,
      totalPremios,
      saldo,
      roi,
      totalBilhetesPremiados,
      historicoSimulado
    };
  }

  function criarOuObterModalSimulador() {
    let modal = document.getElementById('modal-simulador-retrospectivo');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-simulador-retrospectivo';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md hidden';
      modal.innerHTML = `
        <div class="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
          <div class="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300 text-lg">🔬</span>
              <div>
                <h3 class="font-black text-sm sm:text-base text-cyan-300">Simulador Retrospectivo</h3>
                <p class="text-[11px] text-slate-400">"E se eu tivesse apostado estes jogos nos últimos concursos reais?"</p>
              </div>
            </div>
            <button onclick="fecharModalSimuladorRetrospectivo()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">✕</button>
          </div>
          <div id="corpo-modal-simulador" class="p-4 sm:p-6 overflow-y-auto space-y-4">
            <!-- Conteúdo dinâmico injetado -->
          </div>
          <div class="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-xs">
            <span class="text-slate-400 text-[11px]">Dados oficiais auditados da Caixa Econômica Federal</span>
            <button onclick="fecharModalSimuladorRetrospectivo()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">
              Fechar Simulação
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  window.fecharModalSimuladorRetrospectivo = function () {
    const modal = document.getElementById('modal-simulador-retrospectivo');
    if (modal) modal.classList.add('hidden');
  };

  window.abrirSimuladorRetrospectivo = function (jogosInput, modalidadeInput) {
    const modalidade = modalidadeInput || window.modalidadeAtual || 'megasena';
    let jogos = jogosInput;

    // Fallbacks inteligentes
    if (!jogos || jogos.length === 0) {
      if (Array.isArray(window.jogosFechamentoGerados) && window.jogosFechamentoGerados.length > 0) {
        jogos = window.jogosFechamentoGerados;
      } else if (Array.isArray(window.loteApostasGeradas) && window.loteApostasGeradas.length > 0) {
        jogos = window.loteApostasGeradas.map(a => a.dezenas);
      } else if (typeof window.getJogoAtual === 'function' && window.getJogoAtual().length >= 6) {
        jogos = [window.getJogoAtual()];
      }
    }

    if (!jogos || jogos.length === 0) {
      if (typeof window.toast === 'function') {
        window.toast('Gere um jogo ou fechamento antes de simular!', '⚠️');
      } else {
        alert('Gere ao menos um jogo antes de simular.');
      }
      return;
    }

    const resultado = executarSimulacao(jogos, modalidade, 10);
    const modal = criarOuObterModalSimulador();
    const corpo = document.getElementById('corpo-modal-simulador');

    if (resultado.erro) {
      corpo.innerHTML = `
        <div class="p-6 text-center text-slate-300 space-y-3">
          <p class="text-amber-400 font-bold">⚠️ ${resultado.erro}</p>
          <button onclick="if(typeof sincronizarConcursos === 'function'){ sincronizarConcursos(); } fecharModalSimuladorRetrospectivo();" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-bold text-xs">
            Sincronizar Resultados Oficiais Agora
          </button>
        </div>
      `;
      modal.classList.remove('hidden');
      return;
    }

    const fmtBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const corSaldo = resultado.saldo >= 0 ? 'text-emerald-400' : 'text-amber-400';

    corpo.innerHTML = `
      <!-- Cards de Resumo -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Concursos Testados</span>
          <span class="text-base font-black text-cyan-400">${resultado.concursosAnalisados} últimos</span>
        </div>
        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Bilhetes Premiados</span>
          <span class="text-base font-black text-emerald-400">${resultado.totalBilhetesPremiados} acertos</span>
        </div>
        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Investimento Simulado</span>
          <span class="text-base font-black text-slate-200">${fmtBRL(resultado.totalInvestido)}</span>
        </div>
        <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Retorno / Prêmios</span>
          <span class="text-base font-black ${corSaldo}">${fmtBRL(resultado.totalPremios)}</span>
        </div>
      </div>

      <!-- Badge de Diagnóstico -->
      <div class="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span class="font-bold text-cyan-300">Taxa de Eficiência Estatística: </span>
          <span class="font-black text-white">${resultado.roi.toFixed(1)}%</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full ${resultado.totalBilhetesPremiados > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}">
          ${resultado.totalBilhetesPremiados > 0 ? '🎯 ACERTOS CONFIRMADOS' : 'SEM PREMIAÇÃO NOS ÚLTIMOS 10'}
        </span>
      </div>

      <!-- Tabela dos Concursos Reais -->
      <div class="space-y-2">
        <h4 class="text-xs font-black uppercase text-slate-400 tracking-wider">Histórico Real da Caixa</h4>
        <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
          ${resultado.historicoSimulado.map(h => {
            const premiou = h.melhorJogo.premiado;
            const bgCard = premiou ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-slate-950 border-slate-800/80';
            return `
              <div class="p-2.5 rounded-xl border ${bgCard} text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-black text-cyan-400 text-xs">Concurso #${h.concurso}</span>
                  <span class="text-[10px] text-slate-500">(${h.data})</span>
                  <div class="flex gap-1">
                    ${(h.sorteadas || []).map(num => {
                      const acertou = h.melhorJogo.acertos.includes(num);
                      return `<span class="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${acertou ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}">${String(num).padStart(2,'0')}</span>`;
                    }).join('')}
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-auto">
                  <span class="text-[11px] font-bold ${premiou ? 'text-emerald-400' : 'text-slate-400'}">
                    ${h.melhorJogo.qtdAcertos} acertos ${premiou ? `(${h.melhorJogo.faixa})` : ''}
                  </span>
                  ${h.retornoConcurso > 0 ? `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px]">+${fmtBRL(h.retornoConcurso)}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (typeof window.tocarBeep === 'function') window.tocarBeep('success');
  };
})();
