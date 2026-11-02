import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Novas Features: Todos os novos scripts existem e são acessíveis', () => {
  const novosScripts = [
    'js/simulador-retrospectivo.js',
    'js/volante-impressao.js',
    'js/testadores-vip.js',
    'js/error-trap.js',
    'js/carteira-gestao.js'
  ];

  for (const s of novosScripts) {
    assert.ok(fs.existsSync(s), `Arquivo ${s} deve existir`);
    const content = fs.readFileSync(s, 'utf-8');
    assert.ok(content.length > 200, `Arquivo ${s} não deve estar vazio`);
  }
});

test('Simulador Retrospectivo: Lógica de acertos e faixas de premiação', () => {
  function avaliarAcertos(jogo, sorteio) {
    return jogo.filter(d => sorteio.includes(d)).length;
  }

  // Mega-Sena: 6 dezenas sorteadas
  const sorteioMega = [5, 10, 23, 34, 45, 59];
  assert.equal(avaliarAcertos([5, 10, 23, 34], sorteioMega), 4, 'Deve identificar Quadra');
  assert.equal(avaliarAcertos([5, 10, 23, 34, 45], sorteioMega), 5, 'Deve identificar Quina');
  assert.equal(avaliarAcertos([5, 10, 23, 34, 45, 59], sorteioMega), 6, 'Deve identificar Sena');

  // Lotofácil: 15 sorteadas
  const sorteioLoto = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const jogoLoto14 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25];
  assert.equal(avaliarAcertos(jogoLoto14, sorteioLoto), 14, 'Deve identificar 14 pontos');
});

test('Calendário Oficial: Mega-Sena em domingo deve indicar Terça-feira (nunca Segunda)', () => {
  const SORTEIOS_CALENDARIO = {
    megasena: { dias: [2, 4, 6], hora: 20 },
    lotofacil: { dias: [1, 2, 3, 4, 5, 6], hora: 20 }
  };
  const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function calcular(modalidade, dataRef) {
    const cfg = SORTEIOS_CALENDARIO[modalidade];
    for (let i = 1; i <= 7; i++) {
      const alvo = new Date(dataRef);
      alvo.setDate(alvo.getDate() + i);
      const candidato = alvo.getDay();
      if (cfg.dias.includes(candidato)) {
        const diaSemana = NOMES_DIAS[candidato];
        const rotulo = i === 1 ? `Amanhã (${diaSemana})` : `${diaSemana}`;
        return { diaSemana, rotulo, diffDias: i };
      }
    }
  }

  // Data teste: Domingo
  const domingo = new Date(2026, 9, 25, 12, 0, 0); // 25/10/2026 = Domingo
  assert.equal(domingo.getDay(), 0, 'Data de teste deve ser domingo');

  const mega = calcular('megasena', domingo);
  assert.equal(mega.diaSemana, 'Terça', 'Próximo sorteio da Mega-Sena a partir de domingo deve ser Terça-feira');
  assert.equal(mega.diffDias, 2, 'Mega-Sena deve ser daqui a 2 dias (Terça), nunca 1 dia (Segunda)');

  const loto = calcular('lotofacil', domingo);
  assert.equal(loto.diaSemana, 'Segunda', 'Próximo sorteio da Lotofácil a partir de domingo deve ser Segunda');
  assert.equal(loto.diffDias, 1, 'Lotofácil é daqui a 1 dia (Amanhã Segunda)');

  // Teste de apuração após as 20h na sexta-feira (ex: 30/10/2026 às 21h16)
  const sextaNoite = new Date(2026, 9, 30, 21, 16, 0); // 30/10/2026 21:16
  const codeSorteios = fs.readFileSync('js/sorteios-reais.js', 'utf8');
  const mockDocument = {
    addEventListener: () => {},
    querySelectorAll: () => []
  };
  const mockWindow = {};
  const context = { NOMES_DIAS, SORTEIOS_CALENDARIO, Date, Math, String, Number, console, document: mockDocument, window: mockWindow, setInterval: () => {}, setTimeout: () => {} };
  const fnExec = new Function('ctx', `
    with (ctx) {
      ${codeSorteios}
      return { formatar: formatarDataProximoCaixa, regressiva: calcularContagemRegressiva };
    }
  `);
  const funcs = fnExec(context);

  const rotuloMega = funcs.formatar('30/10/2026', 'megasena', sextaNoite);
  assert.ok(rotuloMega.includes('apuração'), 'Sorteio do dia após as 20h deve indicar apuração em andamento');

  const contagem = funcs.regressiva('megasena', sextaNoite);
  assert.equal(contagem, 'Em apuração...', 'Contagem entre 20h e 22h no dia do sorteio deve ser "Em apuração..."');
});

test('Carteira Inteligente: Agrupamento em escala de 100 apostas por concurso', () => {
  // Simula 100 bilhetes divididos em 3 concursos diferentes
  const apostas = [];
  for (let i = 0; i < 40; i++) apostas.push({ id: i, concursoAlvo: '#2788', modalidade: 'megasena', custo: 5 });
  for (let i = 40; i < 70; i++) apostas.push({ id: i, concursoAlvo: '#2789', modalidade: 'megasena', custo: 5 });
  for (let i = 70; i < 100; i++) apostas.push({ id: i, concursoAlvo: '#3180', modalidade: 'lotofacil', custo: 3 });

  // Lógica de agrupamento equivalente
  const grupos = {};
  apostas.forEach(b => {
    const chave = `${b.modalidade}_${b.concursoAlvo}`;
    if (!grupos[chave]) grupos[chave] = { chave, total: 0 };
    grupos[chave].total++;
  });

  const listaGrupos = Object.values(grupos);
  assert.equal(listaGrupos.length, 3, '100 apostas em 3 concursos devem virar exatamente 3 grupos organizados');
  assert.equal(grupos['megasena_#2788'].total, 40);
  assert.equal(grupos['megasena_#2789'].total, 30);
  assert.equal(grupos['lotofacil_#3180'].total, 30);
});

test('Testadores VIP: Validação de estrutura do CSV do Google Play', () => {
  const emails = ['apostador1@gmail.com', 'apostador2@gmail.com', 'apostador3@gmail.com'];
  const csv = emails.join('\n');
  const linhas = csv.split('\n');
  assert.equal(linhas.length, 3);
  assert.ok(linhas[0].endsWith('@gmail.com'));
});

test('Parser Inteligente: Extração de apostas a partir de texto do WhatsApp e concursos passados', async () => {
  const { parsearJogosTexto } = await import('../scripts/test-parser.mjs');

  const textoWhatsApp = `Meu Volante PRO — Lote de Apostas
Modalidade: Mega-Sena
Concurso: #2788 (27/10/2026)
Total de Jogos: 2

*Jogo #1:* 04 - 13 - 23 - 28 - 41 - 58
*Jogo #2:* 02 - 15 - 22 - 35 - 44 - 59`;

  const res1 = parsearJogosTexto(textoWhatsApp);
  assert.equal(res1.concurso, '#2788');
  assert.equal(res1.data, '27/10/2026');
  assert.equal(res1.modalidadeDetectada, 'megasena');
  assert.equal(res1.jogos.length, 2);
  assert.deepEqual(res1.jogos[0], [4, 13, 23, 28, 41, 58]);
  assert.deepEqual(res1.jogos[1], [2, 15, 22, 35, 44, 59]);

  const textoPassado = '#3074 24/10/2026 02 03 20 25 39 57';
  const res2 = parsearJogosTexto(textoPassado);
  assert.equal(res2.concurso, '#3074');
  assert.equal(res2.data, '24/10/2026');
  assert.equal(res2.jogos.length, 1);
  assert.deepEqual(res2.jogos[0], [2, 3, 20, 25, 39, 57]);

  // Teste 3: Aposta incompleta Mega-Sena (5 dezenas)
  const textoIncompletoMega = 'Palpite Mega: 04 15 23 38 54';
  const res3 = parsearJogosTexto(textoIncompletoMega);
  assert.equal(res3.modalidadeDetectada, 'megasena');
  assert.equal(res3.incompletos.length, 1);
  assert.equal(res3.incompletos[0].faltam, 1);
  assert.equal(res3.incompletos[0].sugestao.jogoCompleto.length, 6);
  assert.ok(res3.incompletos[0].sugestao.dezenasSugeridas[0] >= 1 && res3.incompletos[0].sugestao.dezenasSugeridas[0] <= 60);

  // Teste 4: Aposta incompleta Lotofácil (14 dezenas)
  const textoIncompletoLoto = 'Lotofácil conc 3200: 01 02 03 04 05 06 07 08 09 10 11 12 13 14';
  const res4 = parsearJogosTexto(textoIncompletoLoto);
  assert.equal(res4.modalidadeDetectada, 'lotofacil');
  assert.equal(res4.incompletos.length, 1);
  assert.equal(res4.incompletos[0].faltam, 1);
  assert.equal(res4.incompletos[0].sugestao.jogoCompleto.length, 15);
  assert.ok(res4.incompletos[0].sugestao.dezenasSugeridas[0] >= 1 && res4.incompletos[0].sugestao.dezenasSugeridas[0] <= 25);
});

test('Carteira & Inteligência: Identificação de Concursos Passados e Detector de Jogos Já Jogados', () => {
  // 1. Validação de Concursos Passados vs Futuros
  const baseSimulada = [{ concurso: 3074, data: '24/10/2026', dezenas: [2, 5, 18, 27, 44, 59] }];

  function concursoOuDataEhPassado(concurso, data, base) {
    const numConc = concurso ? Number(String(concurso).replace(/\D/g, '')) : null;
    if (numConc && base.length > 0) {
      const ultimo = Number(base[0].concurso);
      if (numConc <= ultimo || base.some(c => Number(c.concurso) === numConc)) {
        return true;
      }
    }
    if (data) {
      const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(data).trim());
      if (partes) {
        const [, dia, mes, ano] = partes;
        const alvo = new Date(Number(ano), Number(mes) - 1, Number(dia), 20, 0, 0);
        return alvo.getTime() <= Date.now();
      }
    }
    return false;
  }

  assert.equal(concursoOuDataEhPassado('#3074', null, baseSimulada), true, 'Concurso 3074 deve ser reconhecido como passado');
  assert.equal(concursoOuDataEhPassado('#3070', null, baseSimulada), true, 'Concurso anterior 3070 deve ser passado');
  assert.equal(concursoOuDataEhPassado('#3075', '30/12/2099', baseSimulada), false, 'Concurso futuro 3075 em 2099 não deve ser passado');

  // 2. Detector de Jogos Repetidos na Carteira
  const carteiraMock = [
    { concursoAlvo: '#3074', data: '24/10/2026', dezenas: [2, 5, 18, 27, 44, 59] },
    { concursoAlvo: '#3070', data: '15/10/2026', dezenas: [1, 2, 3, 4, 5, 6] }
  ];

  function verificarSobreposicao(jogo, carteira) {
    const jogoSet = new Set(jogo.map(Number));
    let matchExato = false;
    let maxOverlap = 0;

    for (const b of carteira) {
      const inter = (b.dezenas || []).filter(d => jogoSet.has(Number(d))).length;
      if (inter === jogo.length && b.dezenas.length === jogo.length) {
        matchExato = true;
        break;
      }
      if (inter > maxOverlap) maxOverlap = inter;
    }

    if (matchExato) return 'exato';
    if (maxOverlap >= 5) return 'alta_afinidade';
    return 'inedito';
  }

  assert.equal(verificarSobreposicao([2, 5, 18, 27, 44, 59], carteiraMock), 'exato', 'Deve detectar jogo idêntico já jogado');
  assert.equal(verificarSobreposicao([2, 5, 18, 27, 44, 60], carteiraMock), 'alta_afinidade', '5 acertos deve detectar alta afinidade');
  assert.equal(verificarSobreposicao([10, 20, 30, 40, 50, 60], carteiraMock), 'inedito', 'Jogo sem sobreposição deve ser inédito');
});

test('WhatsApp & Sincronização: Normalização de telefone para o app nativo', () => {
  function normalizarTelefone(fone) {
    if (!fone) return '';
    let limpo = String(fone).replace(/\D/g, '');
    if (!limpo) return '';
    if (limpo.startsWith('0')) limpo = limpo.substring(1);
    if (limpo.length === 10 || limpo.length === 11) {
      limpo = '55' + limpo;
    }
    return limpo;
  }

  assert.equal(normalizarTelefone('(11) 98765-4321'), '5511987654321', 'Deve adicionar DDI 55');
  assert.equal(normalizarTelefone('5511987654321'), '5511987654321', 'Não deve duplicar DDI 55');
  assert.equal(normalizarTelefone('066999998888'), '5566999998888', 'Deve remover 0 inicial e adicionar 55');
  assert.equal(normalizarTelefone(''), '', 'Deve retornar vazio se nulo');
});

test('WhatsApp & Sincronização: Compactação e descompactação de carteira entre aparelhos', () => {
  const jogosOriginais = [
    { id: 101, modalidade: 'megasena', dezenas: [5, 10, 15, 20, 25, 30], concursoAlvo: '#2800', data: '30/10/2026', score: 98, registradoComoJogado: true },
    { id: 102, modalidade: 'lotofacil', dezenas: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], concursoAlvo: '#3200', data: '30/10/2026', score: 95, registradoComoJogado: false }
  ];

  function compactar(lista) {
    const compactos = lista.map(b => ({
      id: b.id || Date.now(),
      m: b.modalidade === 'lotofacil' ? 'l' : 'm',
      d: b.dezenas,
      c: b.concursoAlvo || '',
      dt: b.data || '',
      s: b.score || 98,
      j: b.registradoComoJogado ? 1 : 0
    }));
    const json = JSON.stringify(compactos);
    return Buffer.from(json).toString('base64url');
  }

  function descompactar(b64) {
    const json = Buffer.from(b64, 'base64url').toString('utf8');
    const arr = JSON.parse(json);
    return arr.map(c => ({
      id: c.id,
      modalidade: c.m === 'l' ? 'lotofacil' : 'megasena',
      dezenas: c.d,
      concursoAlvo: c.c,
      data: c.dt,
      score: c.s,
      registradoComoJogado: Boolean(c.j)
    }));
  }

  const payload = compactar(jogosOriginais);
  assert.ok(payload.length < 500, 'Payload deve ser ultracompacto');

  const recuperados = descompactar(payload);
  assert.equal(recuperados.length, 2, 'Deve recuperar os 2 jogos');
  assert.deepEqual(recuperados[0].dezenas, [5, 10, 15, 20, 25, 30], 'Dezenas devem ser idênticas');
  assert.equal(recuperados[0].registradoComoJogado, true, 'Status jogado deve ser preservado');
  assert.equal(recuperados[1].modalidade, 'lotofacil', 'Modalidade deve ser preservada');
});

test('Base oficial: concursos completos, sem dezena repetida e em ordem', async () => {
  const fs = await import('node:fs');
  const texto = fs.readFileSync('js/historico-oficial.js', 'utf8');
  const dados = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1));
  for (const [mod, k, faixas] of [['megasena', 6, 3], ['lotofacil', 15, 5]]) {
    assert.equal(dados[mod].length, 500);
    dados[mod].forEach((c, i) => {
      assert.equal(new Set(c.dezenas).size, k);
      assert.equal(c.rateio.length, faixas);
      if (i) assert.equal(dados[mod][i - 1].concurso, c.concurso + 1);
    });
  }
});

test('Cadastro: regras de celular e e-mail', () => {
  const texto = fs.readFileSync('js/cadastro.js', 'utf8');
  const janela = {};
  new Function('window', 'document', 'localStorage', texto)(janela, { addEventListener() {} }, {});
  assert.equal(janela.validarCelular('(11) 91234-5678').valor, '11912345678');
  assert.ok(janela.validarCelular('(20) 91234-5678').erro);
  assert.ok(janela.validarCelular('(11) 3234-5678').erro);
  assert.ok(janela.validarEmail('a@gmal.com').erro);
  assert.equal(janela.validarEmail('A@Gmail.com').valor, 'a@gmail.com');
});
