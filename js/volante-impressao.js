// =========================================================================
// MEU VOLANTE PRO — ESPELHO DE VOLANTE EM PDF / IMPRESSÃO A4 (LOTÉRICA)
// =========================================================================
(function () {
  'use strict';

  function formatarGridVolante(dezenas, modalidade) {
    const marcadas = (dezenas || []).map(Number);
    const total = modalidade === 'lotofacil' ? 25 : 60;
    const colunas = modalidade === 'lotofacil' ? 5 : 10;

    let html = `<div style="display: grid; grid-template-columns: repeat(${colunas}, 1fr); gap: 3px; max-width: 320px; margin: 4px auto;">`;

    for (let i = 1; i <= total; i++) {
      const isMarcado = marcadas.includes(i);
      const bg = isMarcado ? '#000000' : '#ffffff';
      const color = isMarcado ? '#ffffff' : '#333333';
      const border = isMarcado ? '2px solid #000' : '1px solid #ccc';
      const weight = isMarcado ? '900' : '500';

      html += `
        <div style="height: 24px; border: ${border}; background-color: ${bg}; color: ${color}; font-weight: ${weight}; font-size: 11px; display: flex; align-items: center; justify-content: center; border-radius: 3px; font-family: monospace;">
          ${String(i).padStart(2, '0')}
        </div>
      `;
    }
    html += `</div>`;
    return html;
  }

  window.imprimirJogosVolante = function (jogosInput, modalidadeInput, contexto = {}) {
    const modalidade = modalidadeInput || window.modalidadeAtual || 'megasena';
    let jogos = jogosInput;

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
        window.toast('Gere ou selecione jogos antes de imprimir!', '⚠️');
      } else {
        alert('Gere jogos para imprimir.');
      }
      return;
    }

    const nomeMod = contexto.planejamento
      ? String(contexto.titulo || 'Palpite planejado').toUpperCase()
      : (modalidade === 'lotofacil' ? 'LOTOFÁCIL' : 'MEGA-SENA');
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const horaHoje = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Janela de impressão isolada para garantir impressão limpa sem a interface do app
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar a folha de impressão / PDF.');
      return;
    }

    const htmlImpressao = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Espelho de Volantes - Meu Volante PRO</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
            color: #000;
            margin: 0;
            padding: 10px;
          }
          .header-doc {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 15px;
          }
          .grid-volantes {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .card-volante {
            border: 1.5px dashed #444;
            padding: 10px;
            border-radius: 6px;
            page-break-inside: avoid;
            background: #fff;
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
            margin-bottom: 6px;
            font-size: 11px;
            font-weight: bold;
          }
          .numeros-lista {
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 1px;
            margin-top: 6px;
            background: #f4f4f4;
            padding: 4px;
            border-radius: 4px;
          }
          .footer-nota {
            margin-top: 20px;
            font-size: 9px;
            color: #666;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 8px;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #e0f2fe; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: bold; color: #0369a1;">📄 Folha Pronta para Impressão ou Salvar como PDF</span>
          <button onclick="window.print()" style="background: #0284c7; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>

        <div class="header-doc">
          <h2 style="margin: 0; font-size: 18px; letter-spacing: 1px;">MEU VOLANTE PRO — ESPELHO DE VOLANTES</h2>
          <p style="margin: 3px 0 0; font-size: 11px; color: #444;">
            Modalidade: <strong>${nomeMod}</strong> | Lote: <strong>${jogos.length} ${contexto.planejamento ? 'Palpites' : 'Apostas'}</strong> | Emissão: ${dataHoje} às ${horaHoje}
          </p>
        </div>

        <div class="grid-volantes">
          ${jogos.map((jogo, idx) => `
            <div class="card-volante">
              <div class="card-header">
                <span>VOLANTE #${idx + 1}</span>
                <span>${nomeMod} (${jogo.length} Dezenas)</span>
              </div>
              ${formatarGridVolante(jogo, modalidade)}
              <div class="numeros-lista">
                ${jogo.map(n => String(n).padStart(2, '0')).join(' - ')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer-nota">
          ${contexto.planejamento
            ? 'Palpite de planejamento do Meu Volante PRO. Este documento não é comprovante nem registro de aposta oficial. Confirme a data, o concurso e a disponibilidade das apostas nos canais oficiais da CAIXA.'
            : 'Documento gerado pelo sistema estatístico Meu Volante PRO. Utilize este espelho para passar as apostas nos volantes oficiais da Caixa ou direto no terminal lotérico. Não possui valor fiscal até validação na Casa Lotérica.'}
        </div>

        <script>
          window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              window.print();
            }, 400);
          });
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlImpressao);
    printWindow.document.close();
  };
})();
