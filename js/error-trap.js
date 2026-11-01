// =========================================================================
// MEU VOLANTE PRO — ERROR TRAP & TELEMETRIA SILENCIOSA (OBSERVABILIDADE)
// =========================================================================
(function () {
  'use strict';

  const STORAGE_KEY = 'loterias_nasa_error_logs_v1';
  const MAX_LOGS = 30;

  function obterLogsSalvos() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function salvarLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
    } catch (e) {
      console.warn('[ErrorTrap] Falha ao persistir erro localmente:', e);
    }
  }

  async function registrarErro(tipo, detalhe) {
    const registro = {
      tipo,
      mensagem: String(detalhe.message || detalhe.reason || detalhe),
      arquivo: detalhe.filename || detalhe.source || 'inline',
      linha: detalhe.lineno || null,
      coluna: detalhe.colno || null,
      stack: detalhe.error?.stack || (detalhe.reason?.stack ? String(detalhe.reason.stack) : null),
      url: window.location.href,
      userAgent: navigator.userAgent,
      tela: `${window.innerWidth}x${window.innerHeight}`,
      dataHora: new Date().toISOString()
    };

    // 1. Armazena localmente para auditoria
    const logs = obterLogsSalvos();
    logs.push(registro);
    salvarLogs(logs);

    // 2. Telemetria remota assíncrona (Supabase se disponível)
    try {
      if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
        window.supabaseClient.from('telemetry_errors').insert([registro]).then(({ error }) => {
          if (error && error.code !== '42P01') { // ignora se tabela ainda não criada
            console.debug('[ErrorTrap] Telemetria remota:', error.message);
          }
        }).catch(() => {});
      }
    } catch {
      // Falha silenciosa para não interferir na experiência do usuário
    }
  }

  // Captura erros de execução JS
  window.addEventListener('error', function (event) {
    // Ignora erros de scripts de terceiros ou extensões do Chrome
    if (event.filename && !event.filename.includes(window.location.hostname) && !event.filename.startsWith('http')) {
      return;
    }
    registrarErro('JS_ERROR', event);
  });

  // Captura Promises rejeitadas sem catch
  window.addEventListener('unhandledrejection', function (event) {
    registrarErro('PROMISE_REJECTION', event);
  });

  // API pública de auditoria no console
  window.telemetriaErros = function () {
    const logs = obterLogsSalvos();
    console.group(`[Meu Volante PRO] Log de Telemetria de Erros (${logs.length} registros)`);
    if (logs.length === 0) {
      console.log('✅ Nenhum erro não tratado registrado nesta sessão/dispositivo.');
    } else {
      console.table(logs.map(l => ({
        tipo: l.tipo,
        mensagem: l.mensagem.substring(0, 70),
        arquivo: l.arquivo.split('/').pop(),
        linha: l.linha,
        horario: new Date(l.dataHora).toLocaleTimeString()
      })));
    }
    console.groupEnd();
    return logs;
  };

  window.limparTelemetriaErros = function () {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Log de telemetria limpo com sucesso.');
  };
})();
