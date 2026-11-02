// ===================================================================
// MONITORAMENTO DE USO
// ===================================================================
// Registra o que acontece no app, sem dezenas. O e-mail só entra depois do
// cadastro; antes disso há apenas um identificador aleatório do aparelho.

function idDoAparelho() {
  let id = localStorage.getItem('meu_volante_aparelho');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('meu_volante_aparelho', id);
  }
  return id;
}

// Sessões antigas guardam endereços internos, que não pertencem a ninguém.
function emailReal(email) {
  return email && !String(email).endsWith('@loteriasnasa.pro') ? email : null;
}

function registrarEvento(evento, detalhe = '') {
  try {
    const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
    if (!cliente) return;
    const contato = JSON.parse(localStorage.getItem('loterias_nasa_visitor_lead') || 'null');
    cliente.from('eventos_uso').insert({
      aparelho: idDoAparelho(),
      email: emailReal(contato?.email) || contato?.telefone?.replace(/\D/g, '') || emailReal(typeof usuarioSessao !== 'undefined' && usuarioSessao?.email) || null,
      evento,
      detalhe: String(detalhe).slice(0, 80),
      modalidade: typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : null
    }).then(() => {}, () => {});
  } catch {}
}
window.registrarEvento = registrarEvento;
window.idDoAparelho = idDoAparelho;

function acompanhar(nomeFuncao, evento, detalhe = () => '') {
  const original = window[nomeFuncao];
  if (typeof original !== 'function') return;
  window[nomeFuncao] = function (...args) {
    registrarEvento(evento, detalhe(...args));
    return original.apply(this, args);
  };
}

document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  registrarEvento('abriu_app', window.contextoLoja?.ativo() && document.referrer.startsWith('android-app://') ? 'android' : 'navegador');
  acompanhar('mudarAba', 'abriu_tela', (aba) => aba);
  acompanhar('gerarApostaNasaComMatriz4x4', 'gerou_jogo');
  acompanhar('marcarComoJogadoProximoConcurso', 'salvou_jogo');
  acompanhar('conferirTodosBilhetesSalvos', 'conferiu_jogos');
  acompanhar('calcularRateioBolao', 'usou_bolao');
  acompanhar('abrirCadastroVisitante', 'viu_cadastro');
  acompanhar('entrarComoVisitanteGratis', 'concluiu_cadastro');
  acompanhar('abrirOrcamento', 'abriu_limite');
}, 100));
