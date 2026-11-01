// ===================================================================
// SCIENCE GATE - Generous First Experience & Clean Paywall Logic
// ===================================================================

const TESTES_BLOQUEADOS_FREE = [2, 3, 5, 6];

function usuarioEhPro() {
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao && usuarioSessao.tipo === 'master_founder') return true;
  return typeof planoUsuario !== 'undefined' && planoUsuario === 'pro';
}

/**
 * 1º Jogo Sempre 100% Liberado de Cortesia
 * Permite ao usuário experimentar todos os 6 testes e score de telemetria
 * sem nenhum cadeado na primeira vez.
 */
function primeiroJogoLiberado() {
  try {
    const salvo = localStorage.getItem('nasa_primeiro_jogo_visto');
    if (!salvo) {
      return true;
    }
  } catch (e) {}
  return false;
}

function marcarPrimeiroJogoVisto() {
  try {
    localStorage.setItem('nasa_primeiro_jogo_visto', 'true');
  } catch (e) {}
}

function revelarDiagnosticoCompletoComCredito(origem) {
  const revelarTudo = () => {
    TESTES_BLOQUEADOS_FREE.forEach((idx) => {
      removerTravaCientifica(document.getElementById(`teste-card-${idx}`));
    });
    removerTravaCientifica(document.getElementById('painel-score-telemetria'));
  };

  if (typeof tratarCliqueTravaCientifica === 'function') {
    tratarCliqueTravaCientifica(origem, revelarTudo);
    return;
  }
  if (typeof abrirModalPaywall === 'function') abrirModalPaywall(origem);
  if (typeof tocarBeep === 'function') tocarBeep('click');
}

function aplicarTravaCientifica(card, numeroTeste) {
  if (!card || card.querySelector('.science-lock-overlay')) return;
  card.classList.add('science-lock-blurred');

  const overlay = document.createElement('div');
  overlay.className = 'science-lock-overlay';
  overlay.innerHTML = `
    <span class="science-lock-icon">🔒</span>
    <span class="science-lock-label">Teste PRO</span>
  `;
  overlay.onclick = () => revelarDiagnosticoCompletoComCredito('bateria_testes');
  card.appendChild(overlay);
}

function removerTravaCientifica(card) {
  if (!card) return;
  card.classList.remove('science-lock-blurred');
  const overlay = card.querySelector('.science-lock-overlay');
  if (overlay) overlay.remove();
}

/**
 * Aplica trava apenas se não for PRO E já tiver usado a degustação do 1º jogo
 */
function aplicarGateCientificoNasa() {
  const pro = usuarioEhPro();
  const liberadoCortesia = primeiroJogoLiberado();

  TESTES_BLOQUEADOS_FREE.forEach(idx => {
    const card = document.getElementById(`teste-card-${idx}`);
    if (!card) return;
    if (pro || liberadoCortesia) {
      removerTravaCientifica(card);
    } else {
      aplicarTravaCientifica(card, idx);
    }
  });

  const painelScore = document.getElementById('painel-score-telemetria');
  const badgeTotal = document.getElementById('badge-total-testes-ok');

  if (painelScore) {
    if (pro || liberadoCortesia) {
      removerTravaCientifica(painelScore);
    } else if (!painelScore.querySelector('.science-lock-overlay')) {
      painelScore.classList.add('science-lock-blurred');
      const overlay = document.createElement('div');
      overlay.className = 'science-lock-overlay science-lock-overlay-panel';
      overlay.innerHTML = `
        <span class="science-lock-icon">🔬🔒</span>
        <span class="science-lock-label">Score completo é PRO</span>
        <span class="science-lock-sublabel">Veja o diagnóstico dos 6 testes e o score de eficiência combinatória</span>
      `;
      overlay.onclick = () => revelarDiagnosticoCompletoComCredito('score_telemetria');
      painelScore.appendChild(overlay);
    }
  }

  if (badgeTotal) {
    badgeTotal.innerText = (pro || liberadoCortesia) ? '6 indicadores' : '2 de 6 visíveis';
  }
}

(function blindarGeracaoMultipla() {
  const tentarWrap = () => {
    if (typeof gerarMultiplasApostas !== 'function' || gerarMultiplasApostas.__scienceGated) {
      return typeof gerarMultiplasApostas === 'function';
    }

    const original = gerarMultiplasApostas;
    gerarMultiplasApostas = function (qtd, usarVitorio) {
      const qtdSolicitada = typeof qtd === 'number' ? qtd : (typeof qtdApostasDesejada !== 'undefined' ? qtdApostasDesejada : 1);
      if (!usuarioEhPro() && qtdSolicitada > 1) {
        if (typeof qtdApostasDesejada !== 'undefined') qtdApostasDesejada = 1;
        if (typeof abrirModalPaywall === 'function') abrirModalPaywall('multi_jogos');
        return original.call(this, 1, usarVitorio);
      }
      return original.call(this, qtd, usarVitorio);
    };
    gerarMultiplasApostas.__scienceGated = true;
    return true;
  };

  if (!tentarWrap()) {
    document.addEventListener('DOMContentLoaded', tentarWrap);
  }
})();

(function sincronizarGateComPlano() {
  const tentarWrap = () => {
    if (typeof atualizarVisualPlano !== 'function' || atualizarVisualPlano.__scienceGated) {
      return typeof atualizarVisualPlano === 'function';
    }
    const original = atualizarVisualPlano;
    atualizarVisualPlano = function (...args) {
      const resultado = original.apply(this, args);
      aplicarGateCientificoNasa();
      return resultado;
    };
    atualizarVisualPlano.__scienceGated = true;
    return true;
  };

  if (!tentarWrap()) {
    document.addEventListener('DOMContentLoaded', tentarWrap);
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  aplicarGateCientificoNasa();
  console.log('🔬 Science gate generoso ativo (1º jogo livre)');
});
