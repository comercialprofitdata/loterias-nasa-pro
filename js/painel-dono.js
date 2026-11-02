// ===================================================================
// PAINEL DO DONO
// ===================================================================
// Os dados só vêm do servidor, que confere o papel da conta. Sem isso, a
// função painel_dono recusa o pedido, mesmo que alguém abra esta tela.

function textoSeguro(valor) {
  const elemento = document.createElement('span');
  elemento.textContent = valor ?? '—';
  return elemento.innerHTML;
}

function dataCurta(valor) {
  return valor ? new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function baixarContatos(contatos) {
  const celula = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Nome', 'E-mail', 'Celular', 'Aceita novidades', 'Cadastro'].map(celula).join(';')];
  contatos.forEach((c) => linhas.push([c.nome, c.email, c.celular, c.novidades ? 'Sim' : 'Não', dataCurta(c.criado_em)].map(celula).join(';')));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
  link.download = 'contatos-meu-volante.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function renderizarVips(area) {
  const { data, error } = await obterClienteSupabase().rpc('listar_codigos_vip');
  if (error) {
    area.innerHTML = '<p class="gastos-nota">Rode o script RODAR-VIP.sql para ativar os códigos.</p>';
    return;
  }
  area.innerHTML = `
    <form id="vip-novo" class="vip-form">
      <input id="vip-nome" required maxlength="120" placeholder="Nome do testador ou da campanha" aria-label="Nome do testador ou da campanha" />
      <input id="vip-usos" type="number" min="1" max="1000" value="1" aria-label="Quantidade de acessos" title="Quantidade de acessos" />
      <select id="vip-dias" aria-label="Validade">
        <option value="30">30 dias</option>
        <option value="90">90 dias</option>
        <option value="365">1 ano</option>
        <option value="">Vitalício</option>
      </select>
      <button type="submit" class="ritual-ver">Criar código</button>
    </form>
    <div class="dono-rolagem"><table class="gastos-tabela">
      <thead><tr><th>Testador</th><th>Código</th><th>Validade</th><th>Usado</th><th></th></tr></thead>
      <tbody>${data.map((v) => `<tr>
        <td>${textoSeguro(v.nome)}</td><td>${textoSeguro(v.codigo)}</td>
        <td>${v.dias ? `${v.dias} dias` : 'Vitalício'}</td><td>${v.usos}/${v.usos_max}</td>
        <td class="vip-acoes">
          <button type="button" class="fluxo-link" data-enviar="${textoSeguro(v.codigo)}" data-nome="${textoSeguro(v.nome)}">WhatsApp</button>
          <button type="button" class="fluxo-link" data-alterar="${textoSeguro(v.codigo)}" data-ativo="${!v.ativo}">${v.ativo ? 'Desativar' : 'Reativar'}</button>
        </td></tr>`).join('') || '<tr><td colspan="5">Nenhum código criado.</td></tr>'}</tbody>
    </table></div>`;

  area.querySelector('#vip-novo').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const dias = area.querySelector('#vip-dias').value;
    const { error: erro } = await obterClienteSupabase().rpc('criar_codigo_vip', {
      p_nome: area.querySelector('#vip-nome').value,
      p_dias: dias ? Number(dias) : null,
      p_usos: Math.max(1, Number(area.querySelector('#vip-usos').value) || 1)
    });
    if (erro) toast('Não foi possível criar o código.', '⚠️');
    renderizarVips(area);
  });
  area.querySelectorAll('[data-enviar]').forEach((botao) => botao.addEventListener('click', () => {
    const link = `${window.location.origin}/?vip=${encodeURIComponent(botao.dataset.enviar)}`;
    const texto = `Seu acesso VIP ao Meu Volante PRO: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  }));
  area.querySelectorAll('[data-alterar]').forEach((botao) => botao.addEventListener('click', async () => {
    await obterClienteSupabase().rpc('alterar_codigo_vip', { p_codigo: botao.dataset.alterar, p_ativo: botao.dataset.ativo === 'true' });
    renderizarVips(area);
  }));
}

function htmlPainel(d) {
  const numero = (rotulo, valor) => `<div class="dono-numero"><strong>${textoSeguro(valor)}</strong><span>${rotulo}</span></div>`;
  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.receita);
  return `
    <div class="dono-grade">
      ${numero('Cadastros', d.cadastros)}
      ${numero('Aparelhos', d.aparelhos)}
      ${numero('Ativos em 7 dias', d.ativos_7d)}
      ${numero('Jogos gerados', d.jogos_gerados)}
      ${numero('Jogos salvos', d.jogos_salvos)}
      ${numero('Pagamentos', d.pagamentos)}
      ${numero('Receita confirmada', moeda)}
      ${numero('Exclusões pendentes', d.exclusoes)}
    </div>

    <h3>Quem está usando</h3>
    <div class="dono-rolagem"><table class="gastos-tabela">
      <thead><tr><th>Pessoa</th><th>Gerados</th><th>Salvos</th><th>Último uso</th></tr></thead>
      <tbody>${d.uso.map((u) => `<tr><td>${textoSeguro(u.pessoa)}</td><td>${u.jogos_gerados}</td><td>${u.jogos_salvos}</td><td>${dataCurta(u.ultimo_uso)}</td></tr>`).join('') || '<tr><td colspan="4">Sem registros ainda.</td></tr>'}</tbody>
    </table></div>

    <h3>Códigos VIP</h3>
    <div id="dono-vips"></div>

    <h3>Contatos</h3>
    <button type="button" class="gastos-editar" id="dono-exportar">Baixar contatos (CSV)</button>
    <div class="dono-rolagem"><table class="gastos-tabela">
      <thead><tr><th>Nome</th><th>E-mail</th><th>Celular</th><th>Novidades</th></tr></thead>
      <tbody>${d.contatos.map((c) => `<tr><td>${textoSeguro(c.nome)}</td><td>${textoSeguro(c.email)}</td><td>${textoSeguro(c.celular)}</td><td>${c.novidades ? 'Sim' : 'Não'}</td></tr>`).join('') || '<tr><td colspan="4">Sem contatos ainda.</td></tr>'}</tbody>
    </table></div>

    <h3>Pedidos de exclusão</h3>
    <div class="dono-rolagem"><table class="gastos-tabela">
      <thead><tr><th>Contato</th><th>Origem</th><th>Pedido em</th></tr></thead>
      <tbody>${d.fila_exclusao.map((f) => `<tr><td>${textoSeguro(f.contato)}</td><td>${textoSeguro(f.origem)}</td><td>${dataCurta(f.solicitado_em)}</td></tr>`).join('') || '<tr><td colspan="3">Nenhum pedido pendente.</td></tr>'}</tbody>
    </table></div>`;
}

async function abrirPainelDono() {
  const tela = document.createElement('div');
  tela.id = 'painel-dono';
  tela.className = 'folha-fundo ritual-tela';
  tela.setAttribute('role', 'dialog');
  tela.setAttribute('aria-modal', 'true');
  tela.innerHTML = `
    <div class="dono-conteudo">
      <div class="dono-topo"><h2>Painel do dono</h2><button type="button" class="gastos-editar" id="dono-fechar">Fechar</button></div>
      <div id="dono-corpo"><p class="gastos-nota">Carregando...</p></div>
    </div>`;
  document.body.appendChild(tela);
  tela.querySelector('#dono-fechar').addEventListener('click', () => tela.remove());

  const corpo = tela.querySelector('#dono-corpo');
  const { data, error } = await obterClienteSupabase().rpc('painel_dono');
  if (error) {
    corpo.innerHTML = '<p class="gastos-nota">Acesso negado. Entre com a conta do dono.</p>';
    return;
  }
  corpo.innerHTML = htmlPainel(data);
  renderizarVips(corpo.querySelector('#dono-vips'));
  corpo.querySelector('#dono-exportar').addEventListener('click', () => baixarContatos(data.contatos));
}
window.abrirPainelDono = abrirPainelDono;

document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  // O painel antigo trazia dados locais e de exemplo: toda entrada leva ao novo.
  const mudar = window.mudarAba;
  window.mudarAba = function (aba, ...resto) {
    if (aba === 'admin') {
      abrirPainelDono();
      return undefined;
    }
    return mudar.call(this, aba, ...resto);
  };

  // Quem já tem conta entra sem passar pelo cadastro novo.
  const formulario = document.querySelector('#modal-cadastro-visitante form');
  if (formulario && !document.getElementById('cadastro-ja-tenho-conta')) {
    const entrar = document.createElement('button');
    entrar.type = 'button';
    entrar.id = 'cadastro-ja-tenho-conta';
    entrar.className = 'fluxo-link';
    entrar.textContent = 'Já tenho conta com senha';
    entrar.addEventListener('click', () => {
      const modal = document.getElementById('modal-cadastro-visitante');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.getElementById('modal-auth-saas')?.classList.remove('hidden');
    });
    formulario.after(entrar);
  }
}, 300));
