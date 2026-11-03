import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function criarStorage(inicial = {}) {
  const valores = new Map(Object.entries(inicial));
  return {
    getItem: (chave) => valores.get(chave) ?? null,
    setItem: (chave, valor) => valores.set(chave, String(valor)),
    removeItem: (chave) => valores.delete(chave)
  };
}

function carregarIdentidadeSalva({ storage, vip = null } = {}) {
  const codigo = fs.readFileSync('js/app.js', 'utf8');
  const inicio = codigo.indexOf('function carregarUsuarioSalvo() {');
  const fim = codigo.indexOf('function restaurarVisitanteSemConta()', inicio);
  const carregarUsuario = codigo.slice(inicio, fim);
  const executar = new Function(
    'window',
    'localStorage',
    'verificarParametrosVipUrl',
    'atualizarVisualPlano',
    'atualizarPerfilUsuarioUI',
    `let usuarioSessao = null;\nlet planoUsuario = 'free';\n${carregarUsuario}\nreturn { carregarUsuarioSalvo, get usuario() { return usuarioSessao; }, get plano() { return planoUsuario; } };`
  );
  const api = executar(
    { obterVipAtivo: () => vip },
    storage,
    () => {},
    () => {},
    () => {}
  );
  api.carregarUsuarioSalvo();
  return api;
}

function carregarRestauracaoSessao({ session, profile = null, subscription = null, vip = null, contato = null } = {}) {
  const codigo = fs.readFileSync('js/app.js', 'utf8');
  const inicio = codigo.indexOf('function restaurarVisitanteSemConta() {');
  const fim = codigo.indexOf('function atualizarPerfilUsuarioUI()', inicio);
  const restauracao = codigo.slice(inicio, fim);
  const localStorage = criarStorage(contato ? { loterias_nasa_visitor_lead: JSON.stringify(contato) } : {});
  const executar = new Function(
    'window',
    'localStorage',
    'obterClienteSupabase',
    'console',
    `let usuarioSessao = null;\nlet planoUsuario = 'free';\nfunction atualizarVisualPlano() {}\nfunction atualizarPerfilUsuarioUI() {}\nfunction sincronizarHeaderStatusUsuario() {}\nfunction atualizarDadosDrawer() {}\nfunction sincronizarCarteiraNuvem() {}\n${restauracao}\nreturn { restaurarSessaoSupabase, get usuario() { return usuarioSessao; }, get plano() { return planoUsuario; } };`
  );
  const cliente = {
    auth: { getSession: async () => ({ data: { session }, error: null }) },
    from(tabla) {
      let consulta = {
        select() { return consulta; },
        eq() { return consulta; },
        or() { return consulta; },
        order() { return consulta; },
        limit() { return consulta; },
        maybeSingle: async () => ({ data: tabla === 'profiles' ? profile : subscription, error: null })
      };
      return consulta;
    }
  };
  return executar(
    { obterVipAtivo: () => vip },
    localStorage,
    () => cliente,
    { warn() {}, error() {} }
  );
}

function carregarVip({ storage = criarStorage(), resposta, restaurarConta = async () => false } = {}) {
  const arquivo = fs.readFileSync('js/vip.js', 'utf8');
  const eventos = [];
  const window = {
    registrarEvento: (evento) => eventos.push(evento),
    restaurarSessaoSupabase: restaurarConta,
    atualizarVisualPlano() {},
    aplicarGateCientificoNasa() {},
    sincronizarHeaderStatusUsuario() {},
    atualizarDadosDrawer() {}
  };
  const executar = new Function(
    'window',
    'document',
    'localStorage',
    'obterClienteSupabase',
    'idDoAparelho',
    'console',
    `let planoUsuario = 'free';\nlet usuarioSessao = { tipo: 'visitante', plano: 'free' };\n${arquivo}\nreturn { resgatarVip, revalidarVipSalvo, obterVipAtivo, rotuloAcessoVip, get plano() { return planoUsuario; }, set plano(valor) { planoUsuario = valor; }, get usuario() { return usuarioSessao; } };`
  );
  const api = executar(
    window,
    { addEventListener() {} },
    storage,
    () => ({ rpc: async () => resposta }),
    () => 'aparelho-teste',
    { warn() {} }
  );
  window.aplicarPlano = (ehPro) => { api.plano = ehPro ? 'pro' : 'free'; };
  return {
    ...api,
    storage,
    eventos,
    window,
    get plano() { return api.plano; },
    get usuario() { return api.usuario; }
  };
}

test('Dados locais antigos não são tratados como login ou assinatura autenticada', () => {
  const storage = criarStorage({
    loterias_nasa_user: JSON.stringify({ nome: 'Juliana Magalhães', email: 'juliana@example.com', tipo: 'supabase', plano: 'pro' })
  });

  const identidade = carregarIdentidadeSalva({ storage });

  assert.equal(identidade.usuario.tipo, 'visitante');
  assert.equal(identidade.usuario.nome, 'Visitante');
  assert.equal(identidade.plano, 'free');
});

test('Visitante com cupom continua sem conta, mas mantém o VIP verificado', async () => {
  const identidade = carregarRestauracaoSessao({
    session: null,
    vip: { validoAte: '2027-11-02T00:00:00.000Z' },
    contato: { nome: 'Juliana Magalhães', email: 'juliana@example.com' }
  });

  assert.equal(await identidade.restaurarSessaoSupabase(), false);
  assert.equal(identidade.usuario.tipo, 'visitante');
  assert.equal(identidade.usuario.nome, 'Juliana Magalhães');
  assert.equal(identidade.plano, 'pro');
});

test('Login restaura o nome e diferencia conta gratuita de assinante', async () => {
  const session = { user: { id: 'user-id', email: 'pessoa@example.com', user_metadata: { full_name: 'Pessoa Teste' } } };
  const gratis = carregarRestauracaoSessao({ session, profile: { display_name: 'Pessoa Teste', role: 'user', analises_gratis_restantes: 3 } });
  assert.equal(await gratis.restaurarSessaoSupabase(), true);
  assert.equal(gratis.usuario.tipo, 'supabase');
  assert.equal(gratis.usuario.nome, 'Pessoa Teste');
  assert.equal(gratis.plano, 'free');

  const pro = carregarRestauracaoSessao({
    session,
    profile: { display_name: 'Pessoa Teste', role: 'user', analises_gratis_restantes: 3 },
    subscription: { status: 'active', valid_until: '2027-11-02T00:00:00.000Z', plan_code: 'anual' }
  });
  assert.equal(await pro.restaurarSessaoSupabase(), true);
  assert.equal(pro.usuario.tipo, 'supabase');
  assert.equal(pro.plano, 'pro');
});

test('Cupom VIP concede acesso verificado sem fingir que há conta conectada', async () => {
  const validoAte = '2027-11-02T00:00:00.000Z';
  const app = carregarVip({ resposta: { data: { ok: true, nome: 'Instagram', valido_ate: validoAte }, error: null } });

  const resultado = await app.resgatarVip(' instavip100 ');

  assert.equal(resultado.ok, true);
  assert.equal(app.plano, 'pro');
  assert.equal(app.usuario.tipo, 'visitante');
  assert.deepEqual(app.obterVipAtivo(), { validoAte });
  assert.equal(app.rotuloAcessoVip(app.obterVipAtivo()), `Sem conta • VIP por cupom até ${new Date(validoAte).toLocaleDateString('pt-BR')}`);
  assert.deepEqual(app.eventos, ['resgatou_vip']);
});

test('Cupom rejeitado não concede plano nem cria cache VIP', async () => {
  const app = carregarVip({ resposta: { data: { ok: false, motivo: 'usado' }, error: null } });

  const resultado = await app.resgatarVip('INSTAVIP100');

  assert.equal(resultado.ok, false);
  assert.equal(app.plano, 'free');
  assert.equal(app.obterVipAtivo(), null);
});

test('Cupom revogado remove o acesso VIP quando não existe conta assinante', async () => {
  const storage = criarStorage({
    meu_volante_vip: JSON.stringify({ codigo: 'INSTAVIP100', validoAte: '2027-11-02T00:00:00.000Z' })
  });
  const app = carregarVip({
    storage,
    resposta: { data: { ok: false }, error: null }
  });

  await app.revalidarVipSalvo();

  assert.equal(app.storage.getItem('meu_volante_vip'), null);
  assert.equal(app.plano, 'free');
});

test('Falha temporária de rede mantém o último VIP validado e informa no console', async () => {
  const storage = criarStorage({
    meu_volante_vip: JSON.stringify({ codigo: 'INSTAVIP100', validoAte: '2027-11-02T00:00:00.000Z' })
  });
  const app = carregarVip({ storage, resposta: { error: new Error('offline') } });

  const resultado = await app.revalidarVipSalvo();

  assert.equal(resultado, true);
  assert.equal(app.plano, 'pro');
  assert.ok(app.obterVipAtivo());
});

function carregarEventos({ cliente, avisos = [] }) {
  const arquivo = fs.readFileSync('js/eventos.js', 'utf8');
  const storage = criarStorage();
  const executar = new Function(
    'window',
    'document',
    'localStorage',
    'crypto',
    'obterClienteSupabase',
    'console',
    `${arquivo}\nreturn { registrarEvento };`
  );
  return executar(
    {},
    { addEventListener() {} },
    storage,
    { randomUUID: () => 'aparelho-teste' },
    () => cliente,
    { warn: (...args) => avisos.push(args) }
  );
}

test('Monitoramento confirma gravação e sinaliza falhas do Supabase', async () => {
  const inseridos = [];
  const evento = carregarEventos({
    cliente: { from: (tabela) => ({ insert: async (dados) => { inseridos.push({ tabela, dados }); return { error: null }; } }) }
  });

  assert.equal(await evento.registrarEvento('gerou_jogo', 'megasena'), true);
  assert.equal(inseridos[0].tabela, 'eventos_uso');
  assert.equal(inseridos[0].dados.aparelho, 'aparelho-teste');
  assert.equal(inseridos[0].dados.evento, 'gerou_jogo');

  const avisos = [];
  const falha = carregarEventos({
    cliente: { from: () => ({ insert: async () => ({ error: { message: 'permission denied' } }) }) },
    avisos
  });
  assert.equal(await falha.registrarEvento('abriu_app'), false);
  assert.match(avisos[0][0], /Falha ao registrar evento/);
});
