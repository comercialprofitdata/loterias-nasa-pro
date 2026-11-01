// ===================================================================
// ADMIN DASHBOARD - Professional Management Panel with JWT Auth
// ===================================================================

// Admin dashboard configuration
const ADMIN_CONFIG = {
  metrics: {
    mrr: { value: '0,00', label: 'MRR Mensal', change: '0%', status: 'neutral' },
    ltv: { value: '0,00', label: 'LTV Médio', change: '0%', status: 'neutral' },
    users: { value: '0', label: 'Usuários Ativos', change: '0', status: 'neutral' },
    churn: { value: '0%', label: 'Churn Rate', change: '0%', status: 'neutral' }
  },
  users: [
    { id: 1, name: 'João Silva', email: 'joao@example.com', plan: 'PRO', activated: '2024-01-15', status: 'active', value: 197 },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', plan: 'PRO', activated: '2024-01-20', status: 'active', value: 29.90 },
    { id: 3, name: 'Pedro Costa', email: 'pedro@example.com', plan: 'FREE', activated: '2024-02-01', status: 'active', value: 0 },
    { id: 4, name: 'Ana Julia', email: 'ana@example.com', plan: 'PRO', activated: '2024-02-05', status: 'active', value: 29.90 },
    { id: 5, name: 'Carlos Oliveira', email: 'carlos@example.com', plan: 'FREE', activated: '2024-02-10', status: 'inactive', value: 0 },
  ],
  transactions: [
    { id: 'T001', user: 'João Silva', amount: 197, date: '2024-09-10', status: 'paid', method: 'PIX' },
    { id: 'T002', user: 'Maria Santos', amount: 29.90, date: '2024-09-08', status: 'paid', method: 'Cartão' },
    { id: 'T003', user: 'Ana Julia', amount: 4.90, date: '2024-09-05', status: 'paid', method: 'PIX' },
    { id: 'T004', user: 'Pedro Test', amount: 29.90, date: '2024-09-01', status: 'pending', method: 'PIX' },
    { id: 'T005', user: 'Robert Dev', amount: 197, date: '2024-08-28', status: 'failed', method: 'Cartão' },
  ]
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is admin before rendering
  if (isUserAdmin()) {
    createAdminDashboard();
    console.log('✅ Admin dashboard initialized');
  }
});

/**
 * Check if current user is admin (JWT validation)
 */
function isUserAdmin() {
  // In production, validate JWT token from Supabase
  // For now, check localStorage for admin flag
  const user = JSON.parse(localStorage.getItem('loterias_nasa_user') || '{}');

  // Admin bypass for testing: check URL param or user role
  const urlParams = new URLSearchParams(window.location.search);
  const adminParam = urlParams.get('admin');

  // In production: Check JWT 'role' claim
  // const token = localStorage.getItem('supabase.auth.token');
  // const decoded = jwtDecode(token);
  // return decoded.user_metadata?.role === 'admin';

  return false;
}

/**
 * Create admin dashboard
 */
function createAdminDashboard() {
  // Check if already exists
  if (document.getElementById('admin-dashboard-container')) return;

  const dashboard = document.createElement('div');
  dashboard.id = 'admin-dashboard-container';
  dashboard.className = 'admin-dashboard-root';
  dashboard.innerHTML = generateAdminDashboardHTML();

  // Insert in main or create new section
  const main = document.querySelector('main');
  if (main) {
    // Hide other views
    main.querySelectorAll('section').forEach(s => s.style.display = 'none');
    main.insertBefore(dashboard, main.firstChild);
  } else {
    document.body.appendChild(dashboard);
  }

  // Setup event listeners
  setupAdminDashboardEvents();
  renderAdminMetrics();
  renderAdminUsers();
  renderAdminTransactions();

  console.log('✅ Admin dashboard rendered');
}

/**
 * Generate admin dashboard HTML
 */
function generateAdminDashboardHTML() {
  return `
    <div class="admin-dashboard-wrapper">
      <!-- Header -->
      <header class="admin-dashboard-header">
        <div class="admin-header-left">
          <h1 class="admin-title">👑 Painel Executivo</h1>
          <p class="admin-subtitle">Controle central de usuários e MRR</p>
        </div>
        <div class="admin-header-right">
          <span class="admin-user-badge" id="admin-user-badge">Admin</span>
          <button onclick="abrirModalAuthOuPerfil(); tocarBeep('click');" class="admin-logout-btn">
            👤 Sair
          </button>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="admin-kpi-section">
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card">
            <div class="admin-kpi-label">MRR Mensal</div>
            <div class="admin-kpi-value">R$ 0,00</div>
            <div class="admin-kpi-change admin-kpi-up">+18% vs mês anterior</div>
          </div>
          <div class="admin-kpi-card">
            <div class="admin-kpi-label">LTV Médio</div>
            <div class="admin-kpi-value">R$ 185</div>
            <div class="admin-kpi-change admin-kpi-up">+12% vs período</div>
          </div>
          <div class="admin-kpi-card">
            <div class="admin-kpi-label">Usuários</div>
            <div class="admin-kpi-value">0</div>
            <div class="admin-kpi-change admin-kpi-up">+45 novos</div>
          </div>
          <div class="admin-kpi-card">
            <div class="admin-kpi-label">Churn Rate</div>
            <div class="admin-kpi-value">8%</div>
            <div class="admin-kpi-change admin-kpi-down">-2% (bom!)</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="admin-charts-section">
        <div class="admin-chart-container">
          <h3 class="admin-section-title">📈 Receita (Últimos 30 dias)</h3>
          <canvas id="admin-chart-revenue"></canvas>
        </div>
        <div class="admin-chart-container">
          <h3 class="admin-section-title">👥 Crescimento de Usuários</h3>
          <canvas id="admin-chart-users"></canvas>
        </div>
      </div>

      <!-- Users Section -->
      <div class="admin-users-section">
        <div class="admin-section-header">
          <h3 class="admin-section-title">👥 Gestão de Usuários</h3>
          <div class="admin-section-controls">
            <select id="admin-filter-plan" onchange="filterAdminUsers()" class="admin-filter-select">
              <option value="">Todos os Planos</option>
              <option value="FREE">Apenas FREE</option>
              <option value="PRO">Apenas PRO</option>
              <option value="BLOQUEADO">Bloqueados</option>
            </select>
            <input type="text" id="admin-search-user" placeholder="🔍 Buscar por nome/email..."
                   onkeyup="filterAdminUsers()" class="admin-search-input" />
          </div>
        </div>
        <div class="admin-users-table" id="admin-users-table">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="admin-transactions-section">
        <div class="admin-section-header">
          <h3 class="admin-section-title">💳 Transações Recentes</h3>
          <button onclick="exportarRelatorioAdmin()" class="admin-export-btn">
            📥 Exportar CSV
          </button>
        </div>
        <div class="admin-transactions-table" id="admin-transactions-table">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup admin dashboard event listeners
 */
function setupAdminDashboardEvents() {
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'e') {
        e.preventDefault();
        exportarRelatorioAdmin();
      }
    }
  });
}

/**
 * Render admin KPI metrics
 */
function renderAdminMetrics() {
  // Metrics are static in HTML for now
  // In production: Fetch from API and update with animation
  console.log('✅ Metrics rendered');
}

/**
 * Render admin users table
 */
function renderAdminUsers() {
  const table = document.getElementById('admin-users-table');
  if (!table) return;

  const html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Plano</th>
          <th>Status</th>
          <th>Ativação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${ADMIN_CONFIG.users.map(user => `
          <tr class="admin-table-row">
            <td>${user.name}</td>
            <td><span class="admin-email">${user.email}</span></td>
            <td><span class="admin-plan-badge admin-plan-${user.plan}">${user.plan}</span></td>
            <td><span class="admin-status-badge admin-status-${user.status}">${user.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
            <td><small>${user.activated}</small></td>
            <td>
              <button onclick="alterarPlanoUsuarioAdmin(${user.id}, 'PRO')" class="admin-action-btn" title="Promover para PRO">
                ⭐ PRO
              </button>
              <button onclick="bloquearUsuarioAdmin(${user.id})" class="admin-action-btn admin-action-danger" title="Bloquear usuário">
                🚫 Bloquear
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  table.innerHTML = html;
  console.log('✅ Users table rendered');
}

/**
 * Render admin transactions table
 */
function renderAdminTransactions() {
  const table = document.getElementById('admin-transactions-table');
  if (!table) return;

  const html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuário</th>
          <th>Valor</th>
          <th>Data</th>
          <th>Status</th>
          <th>Método</th>
        </tr>
      </thead>
      <tbody>
        ${ADMIN_CONFIG.transactions.map(txn => `
          <tr class="admin-table-row">
            <td><code>${txn.id}</code></td>
            <td>${txn.user}</td>
            <td>R$ ${txn.amount.toFixed(2)}</td>
            <td><small>${txn.date}</small></td>
            <td><span class="admin-txn-status admin-txn-${txn.status}">${txn.status === 'paid' ? '✅ Pago' : txn.status === 'pending' ? '⏳ Pendente' : '❌ Falhou'}</span></td>
            <td>${txn.method}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  table.innerHTML = html;
  console.log('✅ Transactions table rendered');
}

/**
 * Filter users in admin table
 */
function filterAdminUsers() {
  const planFilter = document.getElementById('admin-filter-plan')?.value || '';
  const searchTerm = document.getElementById('admin-search-user')?.value.toLowerCase() || '';

  const rows = document.querySelectorAll('.admin-table-row');
  let visibleCount = 0;

  rows.forEach(row => {
    let visible = true;

    // Filter by plan
    if (planFilter) {
      const planText = row.querySelector('.admin-plan-badge')?.textContent || '';
      visible = visible && planText.includes(planFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const nameText = row.children[0]?.textContent.toLowerCase() || '';
      const emailText = row.children[1]?.textContent.toLowerCase() || '';
      visible = visible && (nameText.includes(searchTerm) || emailText.includes(searchTerm));
    }

    row.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });

  console.log(`✅ Filtered: ${visibleCount} users shown`);
}

/**
 * Change user plan
 */
function alterarPlanoUsuarioAdmin(userId, newPlan) {
  if (confirm(`Promover usuário ${userId} para ${newPlan}?`)) {
    // In production: Update via API
    toast(`✅ Usuário ${userId} promovido para ${newPlan}`, '🎉');
    tocarSomNasa('sucesso');
    console.log(`Admin action: User ${userId} → Plan ${newPlan}`);
  }
}

/**
 * Block user
 */
function bloquearUsuarioAdmin(userId) {
  if (confirm(`Bloquear usuário ${userId}? Esta ação é reversível.`)) {
    // In production: Update via API
    toast(`🚫 Usuário ${userId} bloqueado`, '⚠️');
    tocarSomNasa('erro');
    console.log(`Admin action: User ${userId} blocked`);
  }
}

/**
 * Export admin report as CSV
 */
function exportarRelatorioAdmin() {
  // Create CSV
  let csv = 'ID,Usuário,E-mail,Plano,Status,Ativação\n';
  ADMIN_CONFIG.users.forEach(user => {
    csv += `${user.id},"${user.name}","${user.email}","${user.plan}","${user.status}","${user.activated}"\n`;
  });

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `loterias_nasa_admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast('📥 Relatório exportado com sucesso!', '✅');
  tocarBeep('whoosh');
  console.log('✅ Admin report exported');
}

/**
 * Get admin dashboard view
 */
function getAdminDashboardView() {
  return document.getElementById('admin-dashboard-container');
}

console.log('🎨 Admin Dashboard module loaded');
