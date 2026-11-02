// ===================================================================
// CHECKOUT - cobrança real via Asaas (Mobile-First Polish)
// ===================================================================

const CHECKOUT_PLANOS = {
  avulso: { nome: 'Passe de 15 dias', preco: 'R$ 5,90', periodo: 'pagamento único' },
  mensal: { nome: 'Mensal', preco: 'R$ 12,90', periodo: 'por mês' },
  anual: { nome: 'Anual', preco: 'R$ 97', periodo: 'por ano · equivale a R$ 8,08/mês' }
};

/** Valida CPF pelos dígitos verificadores, para não criar cliente inválido no gateway. */
function cpfValido(entrada) {
  const cpf = String(entrada || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (ateIndice) => {
    let soma = 0;
    for (let i = 0; i < ateIndice; i++) {
      soma += Number(cpf[i]) * (ateIndice + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

function formatarCPF(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

async function obterSessaoSupabase() {
  const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
  if (!cliente) return null;

  const { data } = await cliente.auth.getSession();
  return data?.session ?? null;
}

function mostrarCheckoutReal(planId) {
  const plano = CHECKOUT_PLANOS[planId];
  if (!plano) return;

  // Garante que visitante nunca cai direto na tela de CPF/pagamento
  if (!window.__sessaoParaCompra) {
    obterSessaoSupabase().then((sessao) => {
      if (sessao) {
        window.__sessaoParaCompra = true;
        mostrarCheckoutReal(planId);
        window.__sessaoParaCompra = false;
        return;
      }
      pedirContaParaComprar(planId);
    });
    return;
  }

  tocarSomNasa('purchase');

  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal?.querySelector('.modal-upgrade-content');
  if (!content) return;

  const nomeSugerido = (typeof usuarioSessao !== 'undefined' && usuarioSessao?.nome) || '';

  content.innerHTML = `
    <!-- Top Bar -->
    <div class="modal-upgrade-topbar">
      <div class="modal-upgrade-badge">
        <span>🔒</span>
        <span>PAGAMENTO SEGURO</span>
      </div>
      <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar" type="button" onclick="fecharModalUpgrade(); tocarBeep('click');">
        ✕
      </button>
    </div>

    <div class="modal-upgrade-checkout">
      <div class="modal-upgrade-checkout-header">
        <h3>${plano.nome}</h3>
        <p>${plano.preco} • ${plano.periodo}</p>
      </div>

      <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(51,65,85,0.7); border-radius: 1rem; padding: 0.85rem; margin: 0.75rem 0;">
        <label for="checkout-nome" style="display:block; font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700; margin-bottom:0.35rem;">Nome completo</label>
        <input id="checkout-nome" type="text" value="${nomeSugerido}" maxlength="120" placeholder="Como está no documento"
               style="width:100%; box-sizing:border-box; padding:0.65rem 0.75rem; background:rgba(2,6,23,0.8); border:1px solid rgba(71,85,105,0.8); border-radius:0.6rem; color:white; outline:none; font-size:0.85rem;" />

        <label for="checkout-cpf" style="display:block; font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700; margin:0.75rem 0 0.35rem;">CPF</label>
        <input id="checkout-cpf" type="text" inputmode="numeric" maxlength="14" placeholder="000.000.000-00"
               style="width:100%; box-sizing:border-box; padding:0.65rem 0.75rem; background:rgba(2,6,23,0.8); border:1px solid rgba(71,85,105,0.8); border-radius:0.6rem; color:white; outline:none; font-size:0.85rem;" />
        <p style="font-size:0.65rem; color:#64748b; margin:0.35rem 0 0; line-height:1.3;">
          Exigido pelo Asaas, que processa o pagamento.
        </p>
      </div>

      <p class="pagamento-rotulo">Forma de pagamento</p>
      <div class="pagamento-opcoes" role="radiogroup" aria-label="Forma de pagamento">
        <label><input type="radio" name="checkout-metodo" value="PIX" checked /><span>Pix</span></label>
        <label><input type="radio" name="checkout-metodo" value="CREDIT_CARD" /><span>Cartão</span></label>
      </div>
      <p class="gastos-nota" id="checkout-nota-metodo">O QR Code aparece aqui mesmo, e a liberação é automática.</p>

      <div id="checkout-erro" style="display:none; background:rgba(248,113,113,0.12); border:1px solid rgba(248,113,113,0.4); border-radius:0.75rem; padding:0.65rem; margin-top:0.65rem; font-size:0.75rem; color:#fca5a5;"></div>

      <div style="display:grid; grid-template-columns:1fr 1.6fr; gap:0.6rem; margin-top:1rem;">
        <button type="button" onclick="abrirModalUpgrade('voltar'); tocarBeep('click');"
                style="padding:0.65rem; background:rgba(51,65,85,0.8); color:#cbd5e1; border:1px solid rgba(71,85,105,0.8); border-radius:0.75rem; cursor:pointer; font-size:0.8rem; font-weight:700;">
          Voltar
        </button>
        <button type="button" id="checkout-continuar"
                style="padding:0.65rem; background:linear-gradient(135deg, rgb(34,197,94), rgb(6,182,212)); color:rgb(15,23,42); border:none; border-radius:0.75rem; font-weight:800; cursor:pointer; font-size:0.82rem;">
          Continuar
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);

  document.querySelectorAll('input[name="checkout-metodo"]').forEach((opcao) => {
    opcao.addEventListener('change', () => {
      document.getElementById('checkout-nota-metodo').textContent = opcao.value === 'PIX'
        ? 'O QR Code aparece aqui mesmo, e a liberação é automática.'
        : 'Você digita o cartão na página segura do Asaas. Seus dados não passam pelo app.';
    });
  });

  const campoCpf = document.getElementById('checkout-cpf');
  campoCpf?.addEventListener('input', (evento) => {
    evento.target.value = formatarCPF(evento.target.value);
  });

  document
    .getElementById('checkout-continuar')
    ?.addEventListener('click', () => iniciarPagamento(planId));
}

function mostrarErroCheckout(mensagem) {
  const caixa = document.getElementById('checkout-erro');
  if (!caixa) return;
  caixa.textContent = mensagem;
  caixa.style.display = 'block';
}

async function iniciarPagamento(planId) {
  const botao = document.getElementById('checkout-continuar');
  const nome = document.getElementById('checkout-nome')?.value.trim();
  const cpf = document.getElementById('checkout-cpf')?.value.trim();
  const metodo = document.querySelector('input[name="checkout-metodo"]:checked')?.value || 'PIX';

  if (!nome || nome.length < 3) {
    mostrarErroCheckout('Informe seu nome completo.');
    return;
  }

  if (!cpfValido(cpf)) {
    mostrarErroCheckout('CPF inválido. Confira os números.');
    return;
  }

  const sessao = await obterSessaoSupabase();
  if (!sessao) {
    mostrarErroCheckout(
      'Entre com seu e-mail antes de pagar para vincular seu acesso.'
    );
    setTimeout(() => {
      fecharModalUpgrade();
      if (typeof abrirModalAuthOuPerfil === 'function') {
        abrirModalAuthOuPerfil();
      } else if (typeof abrirModalAuth === 'function') {
        abrirModalAuth();
      }
    }, 2000);
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Gerando cobrança...';
  }

  try {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    const resposta = await fetch(`${base}/functions/v1/criar-cobranca`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessao.access_token}`
      },
      body: JSON.stringify({
        plano: planId,
        metodo,
        documento: cpf.replace(/\D/g, ''),
        nome
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok || dados.erro) {
      throw new Error(dados.erro || 'não foi possível gerar a cobrança');
    }

    if (!dados.urlPagamento) {
      throw new Error('cobrança criada, mas sem link de pagamento');
    }

    if (metodo === 'PIX' && dados.pix?.qrCode) {
      mostrarPix(dados);
      return;
    }

    window.open(dados.urlPagamento, '_blank', 'noopener');
    mostrarAguardandoPagamento(dados);
  } catch (err) {
    console.error('Falha no checkout:', err);
    mostrarErroCheckout(`Não foi possível continuar: ${err.message}`);
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Continuar';
    }
  }
}

function mostrarPix(cobranca) {
  const content = document.querySelector('#modal-upgrade-nasa .modal-upgrade-content');
  if (!content) return;

  const valor = Number(cobranca.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  content.innerHTML = `
    <div class="modal-upgrade-topbar">
      <div class="modal-upgrade-badge"><span>PAGAMENTO COM PIX</span></div>
      <button class="modal-upgrade-close" title="Fechar" type="button" onclick="fecharModalUpgrade()">✕</button>
    </div>
    <div class="pix-tela">
      <strong class="pix-valor">${valor}</strong>
      <span class="gastos-nota">VBJ Soluções Empresariais Inteligentes LTDA</span>
      <img id="pix-qr" alt="QR Code Pix" width="220" height="220" />
      <button type="button" class="ritual-ver" id="pix-copiar">Copiar código Pix</button>
      <p class="gastos-nota" id="pix-estado" role="status">Aguardando o pagamento. Pode deixar esta tela aberta.</p>
    </div>`;

  content.querySelector('#pix-qr').src = `data:image/png;base64,${cobranca.pix.qrCode}`;
  content.querySelector('#pix-copiar').addEventListener('click', async (evento) => {
    await navigator.clipboard.writeText(cobranca.pix.copiaECola);
    evento.target.textContent = 'Código copiado';
  });

  aguardarConfirmacaoPagamento({ tentativas: 60, intervaloMs: 5000 }).then((confirmado) => {
    const estado = document.getElementById('pix-estado');
    if (confirmado) fecharModalUpgrade();
    else if (estado) estado.textContent = 'Ainda não recebemos a confirmação. Se já pagou, seu acesso será liberado assim que o banco confirmar.';
  });
}

function mostrarAguardandoPagamento(cobranca) {
  const modal = document.getElementById('modal-upgrade-nasa');
  const content = modal?.querySelector('.modal-upgrade-content');
  if (!content) return;

  content.innerHTML = `
    <!-- Top Bar -->
    <div class="modal-upgrade-topbar">
      <div class="modal-upgrade-badge">
        <span>⏳</span>
        <span>AGUARDANDO CONFIRMAÇÃO</span>
      </div>
      <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar" type="button" onclick="fecharModalUpgrade(); tocarBeep('click');">
        ✕
      </button>
    </div>

    <div class="modal-upgrade-checkout" style="text-align:center;">
      <div style="font-size:2.5rem; margin:0.75rem 0;">⚡</div>
      <h3 style="color:white; margin:0 0 0.35rem; font-size:1.15rem;">Aguardando o Pagamento</h3>
      <p style="color:#cbd5e1; font-size:0.78rem; margin:0 0 1rem; line-height:1.4;">
        Abrimos a página segura do Asaas em outra aba. Assim que o pagamento for confirmado, seu acesso é liberado automaticamente.
      </p>

      <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(51,65,85,0.7); border-radius:0.85rem; padding:0.75rem; text-align:left; font-size:0.74rem; color:#cbd5e1; line-height:1.4;">
        <p style="margin:0 0 0.35rem;"><strong>PIX:</strong> confirma em segundos após o pagamento.</p>
        <p style="margin:0;"><strong>Cartão:</strong> liberação em poucos minutos após análise antifraude.</p>
      </div>

      <a href="${cobranca.urlPagamento}" target="_blank" rel="noopener"
         style="display:inline-block; margin-top:1rem; color:#22d3ee; font-size:0.78rem; text-decoration:underline;">
        A aba não abriu? Clique aqui para abrir a cobrança
      </a>

      <button type="button" onclick="fecharModalUpgrade()"
              style="width:100%; margin-top:1.25rem; padding:0.65rem; background:rgba(51,65,85,0.9); color:white; border:none; border-radius:0.75rem; cursor:pointer; font-size:0.8rem; font-weight:700;">
        Concluir
      </button>
    </div>
  `;

  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);

  if (typeof aguardarConfirmacaoPagamento === 'function') {
    aguardarConfirmacaoPagamento().then((confirmado) => {
      if (confirmado) fecharModalUpgrade();
    });
  }
}

console.log('💳 Checkout Asaas carregado (Mobile-First Polish)');
