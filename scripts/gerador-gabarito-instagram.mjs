import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Script automatizado para gerar Artes de Resultado de Loterias para o Instagram
 * Uso: node scripts/gerar-card-resultado.mjs [megasena|lotofacil] [numeroConcurso] [dataBR] [dezenas...]
 */

const args = process.argv.slice(2);
const modalidade = args[0] || 'megasena';
const concurso = args[1] || '3081';
const dataBR = args[2] || '04/11/2026';
const acumulou = args[3] !== 'false';
const premioProximo = args[4] || '55 Milhões';

function gerarTemplateHTML(dados) {
  const isMega = dados.modalidade === 'megasena';
  const nomeLoteria = isMega ? 'MEGA-SENA' : 'LOTOFÁCIL';
  const corTema = isMega ? '#10B981' : '#A855F7';
  const corSombra = isMega ? 'rgba(16, 185, 129, 0.45)' : 'rgba(168, 85, 247, 0.45)';
  const bgBadge = isMega ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)';
  const borderBadge = isMega ? 'rgba(16, 185, 129, 0.4)' : 'rgba(168, 85, 247, 0.4)';
  const textBadge = isMega ? '#34D399' : '#C084FC';

  const bolasHtml = dados.dezenas.map(d => `
    <div style="width:${isMega ? '120px' : '90px'};height:${isMega ? '120px' : '90px'};border-radius:50%;background:${corTema};color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:${isMega ? '54px' : '38px'};font-weight:900;box-shadow:0 0 30px ${corSombra}">
      ${String(d).padStart(2, '0')}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1080px;
      height: 1350px;
      background: #0B1220;
      color: #F1F5F9;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand-title { font-size: 34px; font-weight: 900; color: #F1F5F9; letter-spacing: -0.5px; }
    .badge-conc {
      background: ${bgBadge};
      color: ${textBadge};
      font-weight: 900;
      font-size: 24px;
      padding: 12px 28px;
      border-radius: 999px;
      border: 1.5px solid ${borderBadge};
      letter-spacing: 1px;
    }
    .main { display: flex; flex-direction: column; gap: 32px; }
    .subtitle { font-size: 26px; font-weight: 800; color: #22D3EE; letter-spacing: 2px; text-transform: uppercase; }
    .title-destaque { font-size: 92px; font-weight: 900; line-height: 1; color: #FFFFFF; margin-top: 10px; }
    .premio-proximo { font-size: 40px; color: #FBBF24; font-weight: 900; margin-top: 12px; }
    .bolas-container { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0; }
    .premiacao-card {
      background: #0F172A;
      border: 1.5px solid #1E293B;
      border-radius: 28px;
      padding: 32px;
      display: flex;
      justify-content: space-between;
    }
    .premio-col { text-align: center; flex: 1; }
    .faixa-nome { font-size: 22px; color: #94A3B8; font-weight: 700; }
    .faixa-ganhadores { font-size: 30px; font-weight: 900; margin-top: 8px; }
    .faixa-valor { font-size: 20px; color: #CBD5E1; margin-top: 4px; font-weight: 600; }
    .divider { width: 1.5px; background: #334155; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #1E293B;
      padding-top: 28px;
    }
    .footer-desc { font-size: 22px; color: #94A3B8; font-weight: 600; }
    .footer-url { font-size: 26px; font-weight: 900; color: ${corTema}; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <svg width="60" height="60" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" rx="128" fill="${corTema}"/>
        <circle cx="256" cy="256" r="160" stroke="#0B1220" stroke-width="36" stroke-dasharray="24 24"/>
        <circle cx="256" cy="256" r="70" fill="#0B1220"/>
      </svg>
      <span class="brand-title">Meu Volante PRO</span>
    </div>
    <div class="badge-conc">${nomeLoteria} #${dados.concurso}</div>
  </div>

  <div class="main">
    <div>
      <div class="subtitle">Resultado Oficial CAIXA • ${dados.dataBR}</div>
      <div class="title-destaque">${dados.acumulou ? 'ACUMULOU!' : 'SAIU O PRÊMIO!'}</div>
      <div class="premio-proximo">${dados.acumulou ? 'Próximo Prêmio: R$ ' + dados.premioProximo : 'Parabéns aos ganhadores!'}</div>
    </div>

    <div class="bolas-container">
      ${bolasHtml}
    </div>

    <div class="premiacao-card">
      <div class="premio-col">
        <div class="faixa-nome">${isMega ? 'Sena (6 acertos)' : '15 Acertos'}</div>
        <div class="faixa-ganhadores" style="color:${dados.acumulou ? '#F87171' : '#34D399'}">${dados.acumulou ? '0 ganhadores' : dados.ganhadoresFaixa1 + ' ganhador(es)'}</div>
        <div class="faixa-valor" style="color:${dados.acumulou ? '#F87171' : '#CBD5E1'};font-weight:700">${dados.acumulou ? 'Acumulou!' : dados.valorFaixa1}</div>
      </div>
      <div class="divider"></div>
      <div class="premio-col">
        <div class="faixa-nome">${isMega ? 'Quina (5 acertos)' : '14 Acertos'}</div>
        <div class="faixa-ganhadores" style="color:#38BDF8">${dados.ganhadoresFaixa2} apostas</div>
        <div class="faixa-valor">${dados.valorFaixa2} cada</div>
      </div>
      <div class="divider"></div>
      <div class="premio-col">
        <div class="faixa-nome">${isMega ? 'Quadra (4 acertos)' : '13 Acertos'}</div>
        <div class="faixa-ganhadores" style="color:#34D399">${dados.ganhadoresFaixa3} apostas</div>
        <div class="faixa-valor">${dados.valorFaixa3} cada</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-desc">Conferência inteligente e calibragem estatística</div>
    <div class="footer-url">loterias.pd.dev.br</div>
  </div>
</body>
</html>`;
}

// Exemplo padrão exportado
const dadosMega3081 = {
  modalidade: 'megasena',
  concurso: '3081',
  dataBR: '04/11/2026',
  acumulou: true,
  premioProximo: '55 Milhões',
  dezenas: [10, 17, 42, 43, 57, 59],
  ganhadoresFaixa1: 0,
  valorFaixa1: 'Acumulou',
  ganhadoresFaixa2: '63',
  valorFaixa2: 'R$ 26.360,17',
  ganhadoresFaixa3: '3.571',
  valorFaixa3: 'R$ 664,35'
};

const html = gerarTemplateHTML(dadosMega3081);
writeFileSync('marketing/instagram/template-gabarito.html', html, 'utf8');
console.log('✅ Template HTML gerado em marketing/instagram/template-gabarito.html');
