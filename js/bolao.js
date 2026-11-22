// ===================================================================
// BOLÃO: jogos próprios, cotas, participantes e pagamentos
// ===================================================================
// Cada bolão guarda os seus jogos e a sua lista de pessoas. Fica no
// aparelho (localStorage); ao salvar, os jogos vão para a Carteira.
(function () {
  'use strict';

  const CHAVE = 'meu_volante_boloes';
  const DESTINO_VIRADA = 'Mega da Virada 2026';

  // Regras do Bolão CAIXA, lidas em 14/11/2026 nas páginas oficiais
  // loterias.caixa.gov.br/Paginas/Mega-Sena.aspx e /Lotofacil.aspx.
  // Por quantidade de números: cota mínima, valor mínimo do bolão,
  // máximo de jogos no recibo e máximo de cotas.
  const REGRAS_CAIXA = {
    megasena: {
      nome: 'Mega-Sena', sorteadas: 6, preco: 6, min: 6, max: 20,
      link: 'https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx',
      tabela: {
        6: [7, 18, 10, 100], 7: [8, 42, 10, 100], 8: [8, 168, 10, 100], 9: [8, 504, 10, 100],
        10: [12.6, 1260, 10, 100], 11: [27.72, 2772, 10, 100], 12: [55.44, 5544, 10, 100],
        13: [102.96, 10296, 10, 100], 14: [180.18, 18018, 10, 100], 15: [300.3, 30030, 10, 100],
        16: [480.48, 48048, 7, 100], 17: [742.56, 74256, 4, 100], 18: [1113.84, 111384, 3, 100],
        19: [1627.92, 162792, 2, 100], 20: [2325.6, 232560, 1, 100]
      }
    },
    lotofacil: {
      nome: 'Lotofácil', sorteadas: 15, preco: 3.5, min: 15, max: 20,
      link: 'https://loterias.caixa.gov.br/Paginas/Lotofacil.aspx',
      tabela: {
        15: [4.5, 14, 10, 7], 16: [4.5, 56, 10, 35], 17: [11.9, 476, 10, 40],
        18: [57.12, 2856, 10, 50], 19: [159.6, 13566, 9, 85], 20: [542.64, 54264, 4, 100]
      }
    },
    quina: {
      nome: 'Quina', sorteadas: 5, preco: 2.5, min: 5, max: 15,
      link: 'https://loterias.caixa.gov.br/Paginas/Quina.aspx',
      tabela: {
        5: [3.5, 10, 10, 100], 6: [3.5, 15, 10, 100], 7: [5.25, 52.5, 10, 100],
        8: [7, 140, 10, 100], 9: [10, 315, 10, 100], 10: [12.6, 630, 10, 100],
        11: [23.1, 1155, 10, 100], 12: [39.6, 1980, 10, 100], 13: [64.35, 3217.5, 10, 100],
        14: [100.1, 5005, 10, 100], 15: [150.15, 7507.5, 10, 100]
      }
    },
    lotomania: {
      nome: 'Lotomania', sorteadas: 50, preco: 3.0, min: 50, max: 50,
      link: 'https://loterias.caixa.gov.br/Paginas/Lotomania.aspx',
      tabela: {
        50: [3, 6, 10, 50]
      }
    },
    diadesorte: {
      nome: 'Dia de Sorte', sorteadas: 7, preco: 2.5, min: 7, max: 15,
      link: 'https://loterias.caixa.gov.br/Paginas/Dia-de-Sorte.aspx',
      tabela: {
        7: [4, 12, 10, 50], 8: [4, 20, 10, 50], 9: [5, 90, 10, 50],
        10: [6, 300, 10, 50], 11: [16.5, 825, 10, 50], 12: [39.6, 1980, 10, 50],
        13: [85.8, 4290, 10, 50], 14: [171.6, 8580, 10, 50], 15: [321.75, 16087.5, 10, 50]
      }
    }
  };
  const LIMITE_GRATIS = { boloes: 1, jogos: 3 };

  let boloes = [];
  let ativoId = null;

  const reais = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dois = (n) => String(n).padStart(2, '0');
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const aviso = (texto, icone = '⚠️') => { if (typeof window.toast === 'function') window.toast(texto, icone); };

  function combinacoes(n, k) {
    if (k < 0 || k > n) return 0;
    let total = 1;
    for (let i = 1; i <= k; i++) total = (total * (n - k + i)) / i;
    return Math.round(total);
  }

  function custoPorJogo(bolao) {
    const regra = REGRAS_CAIXA[bolao.modalidade];
    return combinacoes(bolao.dezenas, regra.sorteadas) * regra.preco;
  }

  /** Total, valor da cota e situação das cotas e dos pagamentos de um bolão. */
  function calcularRateio(bolao) {
    const total = custoPorJogo(bolao) * bolao.jogos.length;
    const cotas = Math.max(1, Number(bolao.cotas) || 1);
    const valorCota = total / cotas;
    const distribuidas = bolao.participantes.reduce((s, p) => s + (Number(p.cotas) || 0), 0);
    const pagas = bolao.participantes.filter((p) => p.pagou).reduce((s, p) => s + (Number(p.cotas) || 0), 0);
    return { total, cotas, valorCota, distribuidas, pagas, recebido: pagas * valorCota, falta: Math.max(0, total - pagas * valorCota) };
  }

  /** O que o bolão não cumpre das regras do Bolão CAIXA. Lista vazia = dentro das regras. */
  function avisosDaCaixa(bolao) {
    const regra = REGRAS_CAIXA[bolao.modalidade];
    const linha = regra.tabela[bolao.dezenas];
    if (!linha) return [];
    const [cotaMin, bolaoMin, jogosMax, cotasMax] = linha;
    const { total, cotas, valorCota } = calcularRateio(bolao);
    const avisos = [];
    if (bolao.jogos.length > jogosMax) avisos.push(`Na CAIXA, um bolão de ${bolao.dezenas} números tem no máximo ${jogosMax} ${jogosMax === 1 ? 'jogo' : 'jogos'}.`);
    if (cotas < 2 || cotas > cotasMax) avisos.push(`Na CAIXA, um bolão de ${regra.nome} com ${bolao.dezenas} números tem de 2 a ${cotasMax} cotas.`);
    if (bolao.jogos.length && total < bolaoMin) avisos.push(`Na CAIXA, o bolão de ${regra.nome} com ${bolao.dezenas} números custa no mínimo ${reais(bolaoMin)}. Este soma ${reais(total)}.`);
    if (bolao.jogos.length && valorCota < cotaMin) {
      const cabem = Math.floor(total / cotaMin);
      avisos.push(`Na CAIXA, a cota custa no mínimo ${reais(cotaMin)}. Com ${reais(total)} cabem no máximo ${cabem} ${cabem === 1 ? 'cota' : 'cotas'}.`);
    }
    return avisos;
  }

  /** Pares de jogos iguais dentro do bolão: dinheiro gasto duas vezes na mesma combinação. */
  function jogosRepetidos(bolao) {
    const vistos = new Map();
    const repetidos = [];
    bolao.jogos.forEach((jogo, i) => {
      const chave = [...jogo].sort((a, b) => a - b).join('-');
      if (vistos.has(chave)) repetidos.push([vistos.get(chave) + 1, i + 1]);
      else vistos.set(chave, i);
    });
    return repetidos;
  }

  function carregar() {
    try { boloes = JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch { boloes = []; }
    if (!Array.isArray(boloes)) boloes = [];
    if (!boloes.some((b) => b.id === ativoId)) ativoId = boloes[0]?.id || null;
  }

  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(boloes)); } catch { aviso('Não foi possível guardar o bolão neste aparelho.'); }
  }

  function ehPro() {
    const sessao = typeof usuarioSessao !== 'undefined' ? usuarioSessao : null;
    return (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro')
      || ['master_founder', 'vip_convidado'].includes(sessao?.tipo) || sessao?.plano === 'pro';
  }

  function novoBolao() {
    if (!ehPro() && boloes.length >= LIMITE_GRATIS.boloes) {
      window.abrirModalPaywall?.('multi_jogos');
      return null;
    }
    const modalidade = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
    const bolao = {
      id: Date.now(), nome: '', modalidade, destino: 'proximo', modo: 'caixa',
      dezenas: REGRAS_CAIXA[modalidade].min, cotas: 2, minhasCotas: 1, jogos: [], participantes: [],
      prazo: '', guardiao: '', premioPequeno: 'dividir'
    };
    boloes.unshift(bolao);
    ativoId = bolao.id;
    gravar();
    return bolao;
  }

  const bolaoAtivo = () => boloes.find((b) => b.id === ativoId) || null;

  function gerarUmJogo(bolao) {
    if (typeof gerarJogoCalibradoUnico !== 'function') return null;
    const existentes = new Set(bolao.jogos.map((j) => j.join('-')));
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      const gerado = gerarJogoCalibradoUnico(bolao.modalidade, bolao.dezenas, false);
      if (!gerado) return null;
      const dezenas = [...gerado.dezenas].sort((a, b) => a - b);
      if (!existentes.has(dezenas.join('-'))) return dezenas;
    }
    return null;
  }

  function limiteDeJogos() {
    return ehPro() ? 10 : LIMITE_GRATIS.jogos;
  }

  function gerarJogos(bolao, quantidade, manter = false) {
    if (!ehPro() && quantidade > LIMITE_GRATIS.jogos) {
      window.abrirModalPaywall?.('multi_jogos');
      return;
    }
    const jogos = manter ? bolao.jogos.slice(0, quantidade) : [];
    const rascunho = { ...bolao, jogos };
    while (jogos.length < quantidade) {
      const jogo = gerarUmJogo(rascunho);
      if (!jogo) {
        aviso('Não há dezenas suficientes para gerar os jogos. Revise as fixas e proibidas na aba Jogo.');
        return;
      }
      jogos.push(jogo);
    }
    bolao.jogos = jogos;
    gravar();
    renderizar();
  }

  function infoDestino(bolao) {
    if (bolao.modalidade === 'megasena' && bolao.destino === 'virada') {
      return { concurso: DESTINO_VIRADA, data: 'Data oficial a confirmar', rotulo: DESTINO_VIRADA, virada: true };
    }
    const info = typeof obterInfoProximoSorteio === 'function' ? obterInfoProximoSorteio(bolao.modalidade) : {};
    const rotulo = [info.concurso ? `Concurso ${info.concurso}` : null, info.rotulo || null].filter(Boolean).join(' · ') || 'Próximo concurso';
    return { concurso: info.concurso || 'Próximo', data: info.data || '', rotulo, virada: false };
  }

  function apagarDaNuvem(ids) {
    if (!ids.length) return;
    try {
      const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
      if (!cliente) return;
      cliente.auth.getSession().then(({ data }) => {
        const uid = data?.session?.user?.id;
        if (uid) cliente.from('carteira_apostas').delete().eq('user_id', uid).in('bilhete_id', ids.map(String)).then();
      });
    } catch { /* sem conta, só o aparelho tem os jogos */ }
  }

  /** Leva os jogos do bolão para a Carteira, no concurso certo, trocando os que já tinham ido. */
  function salvarNaCarteira(bolao) {
    if (!bolao.jogos.length) { aviso('Gere os jogos do bolão antes de salvar.'); return; }
    if (!(bolao.modalidade === 'megasena' && bolao.destino === 'virada') && window.proximoConcursoConhecido && !window.proximoConcursoConhecido(bolao.modalidade)) return;
    if (typeof window.exigirLeadAntesDeSalvar === 'function' && !window.exigirLeadAntesDeSalvar()) return;
    if (!Array.isArray(carteiraJogos)) return;

    const outros = carteiraJogos.filter((b) => b.bolaoId !== bolao.id);
    const antigos = carteiraJogos.filter((b) => b.bolaoId === bolao.id).map((b) => b.id);
    window.marcarBilhetesApagados?.(antigos);
    apagarDaNuvem(antigos);
    if (!ehPro() && outros.length + bolao.jogos.length > 10) {
      window.abrirModalPaywall?.('carteira_limite');
      return;
    }
    const destino = infoDestino(bolao);
    const { cotas } = calcularRateio(bolao);
    const parteMinha = Math.min(1, (Number(bolao.minhasCotas) || 0) / cotas);
    const nome = bolao.nome.trim() || 'Bolão';
    const novos = bolao.jogos.map((dezenas, i) => ({
      id: Date.now() + i,
      modalidade: bolao.modalidade,
      nome: `${nome} • Jogo ${i + 1} de ${bolao.jogos.length}`,
      dezenas: [...dezenas],
      data: destino.data,
      concursoAlvo: destino.concurso,
      status: destino.virada ? 'Palpite planejado • não é aposta oficial' : 'Aguardando sorteio',
      tipo: destino.virada ? 'mega_virada_2026' : 'bolao',
      bolaoId: bolao.id,
      // Nos gastos entra só a parte de quem usa o app, não o bolão inteiro.
      custoProprio: Math.round(custoPorJogo(bolao) * parteMinha * 100) / 100,
      dataRegistro: new Date().toISOString()
    }));
    carteiraJogos.splice(0, carteiraJogos.length, ...novos, ...outros);
    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();
    aviso(`${novos.length} ${novos.length === 1 ? 'jogo do bolão salvo' : 'jogos do bolão salvos'} na Carteira (${destino.rotulo}).`, '✅');
  }

  const RODAPE = 'Resumo feito no LotoLab. Não é comprovante da CAIXA. O comprovante oficial é o recibo de cota emitido pela lotérica.';

  function cabecalhoTexto(bolao) {
    const regra = REGRAS_CAIXA[bolao.modalidade];
    const r = calcularRateio(bolao);
    return [
      `*Bolão: ${bolao.nome.trim() || 'sem nome'}*`,
      `${regra.nome} · ${infoDestino(bolao).rotulo}`,
      `${bolao.jogos.length} ${bolao.jogos.length === 1 ? 'jogo' : 'jogos'} de ${bolao.dezenas} dezenas · total ${reais(r.total)}`,
      `${r.cotas} cotas de ${reais(r.valorCota)}`
    ];
  }

  function textoConvite(bolao) {
    const linhas = cabecalhoTexto(bolao);
    if (bolao.prazo) linhas.push(`Pagamento até: ${bolao.prazo.split('-').reverse().join('/')}`);
    if (bolao.guardiao.trim()) linhas.push(`Quem guarda o bilhete: ${bolao.guardiao.trim()}`);
    linhas.push(`Prêmio pequeno: ${bolao.premioPequeno === 'reaplicar' ? 'entra no próximo bolão' : 'é dividido entre as cotas'}`);
    linhas.push(bolao.modo === 'caixa'
      ? 'Aposta: Bolão CAIXA na lotérica, com um recibo para cada cota.'
      : 'Aposta: uma pessoa aposta por todos e envia a foto do bilhete aqui.');
    linhas.push('', '*Combinados*',
      '• Só participa quem pagar até o prazo.',
      '• A lista de quem pagou e os jogos são enviados aqui antes do sorteio.',
      '• A foto do bilhete ou dos recibos é enviada aqui depois da aposta.',
      '• O prêmio é dividido pelo número de cotas de cada pessoa.',
      '• Este bolão vale só para os jogos desta lista.',
      '', RODAPE);
    return linhas.join('\n');
  }

  function textoPagamentos(bolao) {
    const r = calcularRateio(bolao);
    const linhas = cabecalhoTexto(bolao);
    linhas.push('', '*Quem já pagou*');
    if (!bolao.participantes.length) linhas.push('Ninguém na lista ainda.');
    bolao.participantes.forEach((p) => {
      const cotas = Number(p.cotas) || 0;
      linhas.push(`${p.pagou ? '✅' : '⏳'} ${p.nome} · ${cotas} ${cotas === 1 ? 'cota' : 'cotas'} · ${reais(cotas * r.valorCota)}`);
    });
    linhas.push('', `Marcado como pago: ${reais(r.recebido)} de ${reais(r.total)}`, `Cotas distribuídas: ${r.distribuidas} de ${r.cotas}`, '', RODAPE);
    return linhas.join('\n');
  }

  function textoJogos(bolao) {
    const linhas = cabecalhoTexto(bolao);
    linhas.push('', '*Jogos do bolão*');
    bolao.jogos.forEach((jogo, i) => linhas.push(`Jogo ${i + 1}: ${jogo.map(dois).join(' - ')}`));
    linhas.push('', RODAPE);
    return linhas.join('\n');
  }

  function abrirEnvio(bolao) {
    if (!bolao.jogos.length) { aviso('Gere os jogos do bolão antes de enviar.'); return; }
    const fundo = document.createElement('div');
    fundo.className = 'folha-fundo';
    fundo.setAttribute('role', 'dialog');
    fundo.setAttribute('aria-modal', 'true');
    fundo.innerHTML = `
      <div class="folha">
        <h2>O que enviar para o grupo?</h2>
        <button type="button" data-texto="convite">Convite com valor da cota e combinados</button>
        <button type="button" data-texto="pagamentos">Lista de quem já pagou</button>
        <button type="button" data-texto="jogos">Jogos do bolão</button>
        <button type="button" class="folha-sair">Cancelar</button>
      </div>`;
    document.body.appendChild(fundo);
    const fechar = () => fundo.remove();
    fundo.querySelector('.folha-sair').addEventListener('click', fechar);
    fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
    const textos = { convite: textoConvite, pagamentos: textoPagamentos, jogos: textoJogos };
    fundo.querySelectorAll('[data-texto]').forEach((botao) => botao.addEventListener('click', () => {
      fechar();
      window.abrirWhatsApp?.({ texto: textos[botao.dataset.texto](bolao) });
    }));
  }

  /** Soma os resultados conferidos na Carteira para este bolão e calcula o prêmio por cota. */
  function resumoConferenciaBolao(bolao, listaCarteira) {
    const carteira = Array.isArray(listaCarteira)
      ? listaCarteira
      : (typeof carteiraJogos !== 'undefined' && Array.isArray(carteiraJogos) ? carteiraJogos : []);
    const bilhetes = carteira.filter((b) => b && b.bolaoId === bolao.id);
    const conferidos = bilhetes.filter((b) => b.conferido);
    const premiados = conferidos.filter((b) => Number(b.premioGanho) > 0 || (!/Não premiado/i.test(b.status || '') && /SENA|QUINA|QUADRA|TERNO|DUQUE|PONTOS|ACERTOS/i.test(b.status || '')));
    const premioTotal = conferidos.reduce((s, b) => s + (Number(b.premioGanho) || 0), 0);
    const cotas = Math.max(1, Number(bolao.cotas) || 1);
    const minhasCotas = Math.max(0, Number(bolao.minhasCotas) || 0);
    const premioPorCota = premioTotal / cotas;
    return {
      salvos: bilhetes.length,
      conferidos: conferidos.length,
      premiados: premiados.length,
      premioTotal,
      premioPorCota,
      minhaParte: premioPorCota * minhasCotas,
      bilhetes
    };
  }

  function htmlOpcoes(valores, atual, rotulo) {
    return valores.map((v) => `<option value="${v}" ${String(v) === String(atual) ? 'selected' : ''}>${esc(rotulo(v))}</option>`).join('');
  }

  function htmlBolao(bolao) {
    const regra = REGRAS_CAIXA[bolao.modalidade];
    const r = calcularRateio(bolao);
    const conf = resumoConferenciaBolao(bolao);
    const avisos = bolao.modo === 'caixa' ? avisosDaCaixa(bolao) : [];
    const repetidos = jogosRepetidos(bolao);
    const dezenasPossiveis = Array.from({ length: regra.max - regra.min + 1 }, (_, i) => regra.min + i);
    const maxJogos = limiteDeJogos();
    const qtdJogos = Math.min(Math.max(bolao.jogos.length, 1), maxJogos);
    const seletor = boloes.length > 1
      ? `<select data-campo-geral="ativo" aria-label="Escolher bolão">${boloes.map((b) => `<option value="${b.id}" ${b.id === bolao.id ? 'selected' : ''}>${esc(b.nome.trim() || 'Bolão sem nome')}</option>`).join('')}</select>`
      : '';

    return `
      <div class="bolao-card">
        <div class="bolao-topo">
          <h2 class="fluxo-titulo">Como vai ser o bolão</h2>
          <button type="button" class="fluxo-link" data-acao="novo">Novo bolão</button>
        </div>
        ${seletor}
        <label>Nome do bolão
          <input type="text" data-campo="nome" value="${esc(bolao.nome)}" placeholder="Ex: Bolão da família" maxlength="40" />
        </label>
        <div class="bolao-duas">
          <label>Loteria
            <select data-campo="modalidade">${htmlOpcoes(['megasena', 'lotofacil', 'quina', 'lotomania', 'diadesorte'], bolao.modalidade, (v) => REGRAS_CAIXA[v].nome)}</select>
          </label>
          <label>Sorteio
            <select data-campo="destino" ${bolao.modalidade === 'megasena' ? '' : 'disabled'}>
              ${htmlOpcoes(bolao.modalidade === 'megasena' ? ['proximo', 'virada'] : ['proximo'], bolao.destino, (v) => (v === 'virada' ? DESTINO_VIRADA : 'Próximo concurso'))}
            </select>
          </label>
        </div>
        <label>Como vai ser a aposta
          <select data-campo="modo">${htmlOpcoes(['caixa', 'grupo'], bolao.modo, (v) => (v === 'caixa' ? 'Bolão CAIXA na lotérica' : 'Uma pessoa aposta por todos'))}</select>
        </label>
        <div class="bolao-tres">
          <label>Dezenas por jogo
            <select data-campo="dezenas">${htmlOpcoes(dezenasPossiveis, bolao.dezenas, (v) => `${v} · ${reais(combinacoes(v, regra.sorteadas) * regra.preco)}`)}</select>
          </label>
          <label>Jogos
            <select data-campo-geral="qtd-jogos">${htmlOpcoes(Array.from({ length: maxJogos }, (_, i) => i + 1), qtdJogos, (v) => String(v))}</select>
          </label>
          <label>Cotas
            <input type="number" inputmode="numeric" min="2" max="100" data-campo="cotas" value="${esc(bolao.cotas)}" />
          </label>
        </div>
        <details class="fluxo-preferencias">
          <summary>Combinados do grupo · prazo, bilhete e prêmio pequeno</summary>
          <label>Data limite para pagar
            <input type="date" data-campo="prazo" value="${esc(bolao.prazo)}" />
          </label>
          <label>Quem guarda o bilhete
            <input type="text" data-campo="guardiao" value="${esc(bolao.guardiao)}" placeholder="Nome de quem fica com o bilhete" maxlength="40" />
          </label>
          <label>Se sair prêmio pequeno
            <select data-campo="premioPequeno">${htmlOpcoes(['dividir', 'reaplicar'], bolao.premioPequeno, (v) => (v === 'dividir' ? 'Dividir entre as cotas' : 'Usar no próximo bolão'))}</select>
          </label>
          <label>Quantas cotas são suas
            <input type="number" inputmode="numeric" min="0" max="100" data-campo="minhasCotas" value="${esc(bolao.minhasCotas)}" />
          </label>
          <p class="gastos-nota">As suas cotas definem quanto deste bolão entra nos seus gastos do mês.</p>
        </details>
        <p class="gastos-nota">Os jogos usam as dezenas fixas e proibidas que você definiu na aba Jogo.</p>
      </div>

      <div class="fluxo-card-acoes">
        <button type="button" class="fluxo-acao fluxo-acao-principal" data-acao="gerar">${bolao.jogos.length ? 'Gerar de novo' : 'Gerar jogos'}</button>
        <button type="button" class="fluxo-acao fluxo-acao-principal fluxo-acao-salvar" data-acao="salvar">Salvar bolão</button>
        <button type="button" class="fluxo-acao" data-acao="whatsapp">WhatsApp</button>
        <button type="button" class="fluxo-acao" data-acao="pdf">PDF</button>
      </div>

      <div class="bolao-card">
        <h2 class="fluxo-titulo">Rateio</h2>
        <div class="bolao-numeros">
          <div><span>Total dos jogos</span><strong>${reais(r.total)}</strong></div>
          <div><span>Valor por cota</span><strong>${bolao.jogos.length ? reais(r.valorCota) : '—'}</strong></div>
          <div><span>Marcado como pago</span><strong>${reais(r.recebido)}</strong></div>
        </div>
        <p class="gastos-nota">O app só anota quem pagou. Ele não recebe, não guarda e não transfere dinheiro.</p>
        ${avisos.map((a) => `<p class="revisao-aviso">${esc(a)}</p>`).join('')}
        ${bolao.modo === 'caixa' ? `<p class="gastos-nota">A lotérica pode cobrar tarifa de serviço de até 35% por cota. <a href="${regra.link}" target="_blank" rel="noopener">Regras do Bolão CAIXA</a></p>` : '<p class="gastos-nota">Sem registro na lotérica, o bilhete é de quem o tem em mãos. Combine tudo por escrito e envie a foto do bilhete ao grupo.</p>'}
      </div>

      ${bolao.jogos.length ? `
      <div class="bolao-card">
        <div class="bolao-topo">
          <h2 class="fluxo-titulo">Conferência e prêmio por cota</h2>
          <span class="gastos-nota">${conf.salvos ? `${conf.conferidos}/${conf.salvos} conferidos` : 'Não salvo'}</span>
        </div>
        <div class="bolao-numeros">
          <div><span>Prêmio total</span><strong>${conf.conferidos ? reais(conf.premioTotal) : '—'}</strong></div>
          <div><span>Prêmio por cota</span><strong>${conf.conferidos ? reais(conf.premioPorCota) : '—'}</strong></div>
          <div><span>Sua parte (${Number(bolao.minhasCotas) || 0} cota${Number(bolao.minhasCotas) === 1 ? '' : 's'})</span><strong>${conf.conferidos ? reais(conf.minhaParte) : '—'}</strong></div>
        </div>
        <p class="gastos-nota">${conf.salvos === 0
          ? 'Salve o bolão na Carteira para conferir todos os jogos automaticamente após o sorteio.'
          : (conf.conferidos === 0
            ? 'Jogos salvos na Carteira. Toque abaixo para consultar o resultado oficial da CAIXA.'
            : (conf.premiados > 0
              ? `🎉 ${conf.premiados} ${conf.premiados === 1 ? 'jogo premiado' : 'jogos premiados'} neste bolão.`
              : 'Todos os jogos deste bolão foram conferidos contra o resultado oficial.'))}</p>
        <button type="button" class="fluxo-acao" data-acao="conferir">🔍 Conferir jogos do bolão</button>
      </div>` : ''}

      <div class="bolao-card">
        <h2 class="fluxo-titulo">Jogos do bolão</h2>
        ${bolao.jogos.length ? '' : '<p class="gastos-nota">Toque em Gerar jogos para montar os jogos deste bolão.</p>'}
        ${repetidos.map(([a, b]) => `<p class="revisao-aviso">O jogo ${b} é igual ao jogo ${a}: o grupo pagaria duas vezes pela mesma combinação.</p>`).join('')}
        ${bolao.jogos.map((jogo, i) => `
          <div class="bolao-jogo">
            <span class="bolao-jogo-rotulo">Jogo ${i + 1}</span>
            <div class="bolao-bolas">${jogo.map((d) => `<span class="fluxo-bola">${dois(d)}</span>`).join('')}</div>
            <div class="bolao-jogo-acoes">
              <button type="button" class="fluxo-link" data-acao="trocar-jogo" data-indice="${i}">Gerar outro</button>
              <button type="button" class="fluxo-link" data-acao="remover-jogo" data-indice="${i}">Remover</button>
            </div>
          </div>`).join('')}
      </div>

      <div class="bolao-card">
        <div class="bolao-topo">
          <h2 class="fluxo-titulo">Participantes</h2>
          <span class="gastos-nota">${r.distribuidas} de ${r.cotas} cotas</span>
        </div>
        ${r.distribuidas > r.cotas ? '<p class="revisao-aviso">Há mais cotas distribuídas do que o total do bolão.</p>' : ''}
        ${bolao.participantes.map((p, i) => `
          <div class="bolao-pessoa">
            <input type="text" data-pessoa="${i}" data-pessoa-campo="nome" value="${esc(p.nome)}" placeholder="Nome" maxlength="40" aria-label="Nome do participante" />
            <input type="number" inputmode="numeric" min="1" max="100" data-pessoa="${i}" data-pessoa-campo="cotas" value="${esc(p.cotas)}" aria-label="Cotas de ${esc(p.nome)}" />
            <button type="button" class="bolao-pagou ${p.pagou ? 'sim' : ''}" data-acao="pagou" data-indice="${i}" aria-pressed="${p.pagou ? 'true' : 'false'}">${p.pagou ? 'Pagou' : 'Falta pagar'}</button>
            <button type="button" class="fluxo-link" data-acao="remover-pessoa" data-indice="${i}" aria-label="Remover ${esc(p.nome)}">Remover</button>
          </div>`).join('')}
        <button type="button" class="fluxo-acao" data-acao="nova-pessoa">Adicionar participante</button>
        ${bolao.participantes.length ? `<p class="gastos-nota">Faltam ${reais(r.falta)} marcados como pagos para cobrir os jogos.</p>` : ''}
      </div>

      <button type="button" class="fluxo-link" data-acao="excluir">Excluir este bolão</button>`;
  }

  function renderizar() {
    const painel = document.getElementById('gerar-painel-bolao');
    if (!painel) return;
    carregar();
    const bolao = bolaoAtivo();
    if (!bolao) {
      painel.innerHTML = `
        <div class="bolao-card">
          <h2 class="fluxo-titulo">Organizar um bolão</h2>
          <p class="gastos-nota">Monte os jogos do grupo, divida em cotas, marque quem pagou e envie tudo pronto para o WhatsApp.</p>
          <button type="button" class="fluxo-acao fluxo-acao-principal" data-acao="novo">Criar bolão</button>
        </div>`;
      return;
    }
    // Guarda o campo em que a pessoa está digitando para devolver o cursor depois do redesenho.
    const ativo = document.activeElement;
    const seletorAtivo = ativo && painel.contains(ativo)
      ? (ativo.dataset.pessoa !== undefined
        ? `[data-pessoa="${ativo.dataset.pessoa}"][data-pessoa-campo="${ativo.dataset.pessoaCampo}"]`
        : (ativo.dataset.campo ? `[data-campo="${ativo.dataset.campo}"]` : null))
      : null;
    painel.innerHTML = htmlBolao(bolao);
    if (seletorAtivo) painel.querySelector(seletorAtivo)?.focus();
  }
  window.renderizarBolao = renderizar;

  let ponteiroAbaixo = false;
  let redesenhoPendente = false;
  document.addEventListener('pointerdown', () => { ponteiroAbaixo = true; }, true);
  document.addEventListener('pointerup', () => {
    ponteiroAbaixo = false;
    if (!redesenhoPendente) return;
    redesenhoPendente = false;
    setTimeout(renderizar, 0);
  }, true);
  const redesenhar = () => {
    if (ponteiroAbaixo) redesenhoPendente = true;
    else renderizar();
  };

  function aoMudar(evento) {
    const alvo = evento.target;
    const bolao = bolaoAtivo();
    if (!bolao) return;

    if (alvo.dataset.campoGeral === 'ativo') {
      ativoId = Number(alvo.value);
    } else if (alvo.dataset.campoGeral === 'qtd-jogos') {
      gerarJogos(bolao, Number(alvo.value), true);
      return;
    } else if (alvo.dataset.campo) {
      const campo = alvo.dataset.campo;
      const numerico = ['dezenas', 'cotas', 'minhasCotas'].includes(campo);
      bolao[campo] = numerico ? Math.max(0, Math.round(Number(alvo.value) || 0)) : alvo.value;
      if (campo === 'cotas') bolao.cotas = Math.min(100, Math.max(1, bolao.cotas));
      if (campo === 'modalidade') {
        bolao.dezenas = REGRAS_CAIXA[bolao.modalidade].min;
        bolao.destino = 'proximo';
        bolao.jogos = [];
      }
      // Jogos com outra quantidade de dezenas deixam de valer.
      if (campo === 'dezenas') bolao.jogos = [];
    } else if (alvo.dataset.pessoa !== undefined) {
      const pessoa = bolao.participantes[Number(alvo.dataset.pessoa)];
      if (!pessoa) return;
      if (alvo.dataset.pessoaCampo === 'cotas') pessoa.cotas = Math.min(100, Math.max(1, Math.round(Number(alvo.value) || 1)));
      else pessoa.nome = alvo.value;
    } else {
      return;
    }
    gravar();
    redesenhar();
  }

  function aoClicar(evento) {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    const acao = botao.dataset.acao;
    const indice = Number(botao.dataset.indice);

    if (acao === 'novo') {
      if (novoBolao()) renderizar();
      return;
    }
    const bolao = bolaoAtivo();
    if (!bolao) return;

    if (acao === 'gerar') {
      const seletor = document.querySelector('#gerar-painel-bolao [data-campo-geral="qtd-jogos"]');
      gerarJogos(bolao, Number(seletor?.value) || 1);
      return;
    }
    if (acao === 'salvar') { salvarNaCarteira(bolao); return; }
    if (acao === 'conferir') {
      if (!bolao.jogos.length) { aviso('Gere os jogos do bolão antes de conferir.'); return; }
      const conf = resumoConferenciaBolao(bolao);
      if (conf.salvos === 0) salvarNaCarteira(bolao);
      if (resumoConferenciaBolao(bolao).salvos > 0 && typeof window.conferirTodosBilhetesSalvos === 'function') {
        window.conferirTodosBilhetesSalvos();
      }
      return;
    }
    if (acao === 'whatsapp') { abrirEnvio(bolao); return; }
    if (acao === 'pdf') {
      if (!bolao.jogos.length) { aviso('Gere os jogos do bolão antes de imprimir.'); return; }
      const virada = infoDestino(bolao).virada;
      window.imprimirJogosVolante?.(bolao.jogos, bolao.modalidade, virada ? { planejamento: true, titulo: DESTINO_VIRADA } : {});
      return;
    }
    if (acao === 'trocar-jogo') {
      const resto = { ...bolao, jogos: bolao.jogos.filter((_, i) => i !== indice) };
      const novo = gerarUmJogo(resto);
      if (!novo) { aviso('Não foi possível gerar outro jogo com as dezenas disponíveis.'); return; }
      bolao.jogos[indice] = novo;
    } else if (acao === 'remover-jogo') {
      bolao.jogos.splice(indice, 1);
    } else if (acao === 'nova-pessoa') {
      bolao.participantes.push({ nome: '', cotas: 1, pagou: false });
    } else if (acao === 'pagou') {
      const pessoa = bolao.participantes[indice];
      if (pessoa) pessoa.pagou = !pessoa.pagou;
    } else if (acao === 'remover-pessoa') {
      bolao.participantes.splice(indice, 1);
    } else if (acao === 'excluir') {
      if (!window.confirm('Excluir este bolão? Os jogos que já estão na Carteira continuam lá.')) return;
      boloes = boloes.filter((b) => b.id !== bolao.id);
      ativoId = boloes[0]?.id || null;
    } else {
      return;
    }
    gravar();
    renderizar();
    if (acao === 'nova-pessoa') {
      const campos = document.querySelectorAll('#gerar-painel-bolao [data-pessoa-campo="nome"]');
      campos[campos.length - 1]?.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const painel = document.getElementById('gerar-painel-bolao');
    if (!painel) return;
    painel.addEventListener('change', aoMudar);
    painel.addEventListener('click', aoClicar);
    carregar();
  });

  // Para os testes automatizados.
  window.bolaoRegras = { REGRAS_CAIXA, calcularRateio, resumoConferencia: resumoConferenciaBolao, avisosDaCaixa, jogosRepetidos, textoConvite, textoPagamentos, textoJogos };
})();
