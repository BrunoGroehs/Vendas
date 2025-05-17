// app.js: main application entry point for dashboard

document.addEventListener('DOMContentLoaded', () => {
  // Verificar dados mockados
  if (!window.mockDB) {
    console.error('Banco de dados mockado não encontrado!');
    return;
  }
  
  // Check if we're on a page with an "active" navigation item
  const currentPath = window.location.pathname;
  const filename = currentPath.split('/').pop() || 'index.html';
  
  // Update navigation active state
  const navLinks = document.querySelectorAll('.sidebar__nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === filename || (filename === 'index.html' && href === '#')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });  // Initialize all modules
  if (window.ComponentsModule) console.log('Componentes inicializados');
  if (window.DashboardModule) window.DashboardModule.init();
  if (window.CustomersModule) window.CustomersModule.init();
  if (window.ServicesModule) window.ServicesModule.init();
  if (window.ExpensesModule) window.ExpensesModule.init();
  if (window.NotificationsModule) window.NotificationsModule.init();
  
  // Update notification badges
  updateNotificationBadges();
  // Check for notifications every minute
  setInterval(updateNotificationBadges, 60000);
  
  // Set up global search
  const searchInput = document.querySelector('.header__search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      // Dispatch search event for any module to listen
      const event = new CustomEvent('globalSearch', { detail: { query: e.target.value } });
      document.dispatchEvent(event);
      
      // If on dashboard page, update contacts
      if (filename === 'index.html' && window.DashboardModule) {
        window.DashboardModule.renderContacts(e.target.value);
      }
    });
    
    // Adicionar atalho de teclado (Cmd/Ctrl + K)
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
  
  // Set up new sale button
  const newSaleBtn = document.querySelector('.btn--primary');
  if (newSaleBtn && newSaleBtn.textContent.includes('Nova venda')) {
    newSaleBtn.addEventListener('click', () => {
      if (window.ServicesModule && typeof window.ServicesModule.showNewServiceModal === 'function') {
        window.ServicesModule.showNewServiceModal();
      } else {
        showToast('Módulo de vendas em implementação', 'warning');
      }
    });
  }
  
  // If we're on the dashboard page, initialize the dashboard
  if (filename === 'index.html') {
    // Atualizar título da página
    document.title = `Dashboard - ${window.mockDB.settings.companyName}`;
    
    // Wait until modules are loaded
    setTimeout(() => {
      if (window.DashboardModule) {
        window.DashboardModule.renderMetrics();
        window.DashboardModule.renderContacts();
      }
    }, 100);
  }
  
  // Setup navigation links
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === '#') {
      link.addEventListener('click', e => {
        e.preventDefault();
        showToast('Essa funcionalidade está em desenvolvimento!', 'warning');
      });
    }
  });
  
  // Adicionar CSS dinâmico para cores baseadas nas variáveis CSS
  const applyDynamicStyles = () => {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    
    // Pegar cores das variáveis
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const warning = getComputedStyle(document.documentElement).getPropertyValue('--warning').trim();
    const danger = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim();
    
    styleEl.textContent = `
      .btn--primary:hover { background-color: ${primary}dd; }
      .toast--success { background-color: ${accent}; }
      .toast--error { background-color: ${danger}; }
      .toast--warning { background-color: ${warning}; color: #222; }
    `;
  };
  
  applyDynamicStyles();
  
  // Exibe uma mensagem toast
  window.showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };
});
