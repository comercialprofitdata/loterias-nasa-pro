import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Gerar arte do Instagram para o concurso 3081 da Mega-Sena
const require = createRequire(join(process.cwd(), 'node_modules', 'x.js'));
const { chromium } = require('playwright');
const logo = readFileSync('marketing/logo.svg', 'utf8');

const base = 'margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#0B1220;color:#F1F5F9;';
const marca = '<div style="display:flex;align-items:center;gap:16px"><div style="width:64px;height:64px">LOGO</div><b style="font-size:32px;color:#F1F5F9">Meu Volante PRO</b></div>'.replace('LOGO', logo);

const navegador = await chromium.launch({ channel: 'chrome' });
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1350 } });

const html = `
<body style="${base}width:1080px;height:1350px;overflow:hidden;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;justify-content:space-between;align-items:center">
    ${marca}
    <div style="background:#065F46;color:#6EE7B7;font-weight:900;font-size:22px;padding:10px 24px;border-radius:999px;border:1px solid #10B981">MEGA-SENA #3081</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:32px">
    <div>
      <div style="font-size:26px;font-weight:800;color:#22D3EE;letter-spacing:2px;text-transform:uppercase">Resultado Oficial Caixa • 04/11/2026</div>
      <div style="font-size:76px;font-weight:900;line-height:1.05;margin-top:8px">ACUMULOU!</div>
      <div style="font-size:36px;color:#F59E0B;font-weight:800;margin-top:6px">Próximo Prêmio Estimado: R$ 55 Milhões</div>
    </div>

    <!-- Bolas Sorteadas -->
    <div style="display:flex;gap:20px;justify-content:center;margin:24px 0">
      <div style="width:116px;height:116px;border-radius:50%;background:#10B981;color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;box-shadow:0 0 30px rgba(16,185,129,0.4)">10</div>
      <div style="width:116px;height:116px;border-radius:50%;background:#10B981;color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;box-shadow:0 0 30px rgba(16,185,129,0.4)">17</div>
      <div style="width:116px;height:116px;border-radius:50%;background:#10B981;color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;box-shadow:0 0 30px rgba(16,185,129,0.4)">42</div>
      <div style="width:116px;height:116px;border-radius:50%;background:#10B981;color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;box-shadow:0 0 30px rgba(16,185,129,0.4)">43</div>
      <div style="width:116px;height:116px;border-radius:50%;background:#10B981;color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;box-shadow:0 0 30px rgba(16,185,129,0.4)">57</div>
      <div style="width:116px;height:116px;border-radius:50%;background:#10B981;color:#0B1220;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900;box-shadow:0 0 30px rgba(16,185,129,0.4)">59</div>
    </div>

    <!-- Premiação -->
    <div style="background:#0F172A;border:1px solid #1E293B;border-radius:24px;padding:32px;display:flex;justify-content:space-between">
      <div style="text-align:center;flex:1">
        <div style="font-size:22px;color:#94A3B8;font-weight:700">Sena (6 acertos)</div>
        <div style="font-size:32px;font-weight:900;color:#F87171;margin-top:6px">Acumulou</div>
      </div>
      <div style="width:1px;background:#334155"></div>
      <div style="text-align:center;flex:1">
        <div style="font-size:22px;color:#94A3B8;font-weight:700">Quina (5 acertos)</div>
        <div style="font-size:28px;font-weight:900;color:#38BDF8;margin-top:6px">63 apostas</div>
        <div style="font-size:18px;color:#CBD5E1">R$ 26.360,17</div>
      </div>
      <div style="width:1px;background:#334155"></div>
      <div style="text-align:center;flex:1">
        <div style="font-size:22px;color:#94A3B8;font-weight:700">Quadra (4 acertos)</div>
        <div style="font-size:28px;font-weight:900;color:#A7F3D0;margin-top:6px">3.571 apostas</div>
        <div style="font-size:18px;color:#CBD5E1">R$ 664,35</div>
      </div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1E293B;padding-top:24px">
    <div style="font-size:24px;color:#94A3B8 font-weight:600">Conferência oficial e gestão inteligente de apostas</div>
    <div style="font-size:24px;font-weight:800;color:#10B981">loterias.pd.dev.br</div>
  </div>
</body>
`;

await pagina.setContent(html);
await pagina.screenshot({ path: 'marketing/instagram/post-resultado-mega-3081.png' });
await navegador.close();
console.log('✅ Imagem marketing/instagram/post-resultado-mega-3081.png gerada com sucesso!');
