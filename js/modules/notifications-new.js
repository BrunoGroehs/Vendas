// filepath: c:\Users\I753372\Desktop\projetos\TesteGPT\js\modules\notifications.js
// Notifications module - Gerencia notificações para recontatos agendados
const NotificationsModule = (() => {
  // Cache de elementos DOM
  let notificationsTable;
  let sendNotificationBtn;
  let upcomingNotifications;
    // Formatação de datas
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    // Verifica se a data tem informação de hora (formato com T)
    if (dateStr.includes('T')) {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR');
  };
  
  // Inicialização do módulo
  const init = () => {
    const isNotificationsPage = window.location.pathname.includes('recontato.html');
    
    if (isNotificationsPage) {
      notificationsTable = document.querySelector('.notifications-table tbody');
      upcomingNotifications = document.querySelector('.upcoming-notifications');
      sendNotificationBtn = document.querySelector('#runNotificationBtn');
      
      if (sendNotificationBtn) {
        sendNotificationBtn.addEventListener('click', batchSendNotifications);
      }
      
      // Renderizar kanban board
      renderKanbanBoard();
      
      // Adicionar event listener para o campo de busca
      const searchInput = document.getElementById('appointmentSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          renderKanbanBoard(e.target.value);
        });
      }
    }
    
    // Verificar notificações a enviar automaticamente
    checkPendingNotifications();
  };
  
  // Verifica notificações pendentes de envio com base nos dias configurados
  const checkPendingNotifications = () => {
    const db = window.mockDB;
    if (!db) return;
    
    const today = new Date();
    const notificationDaysAhead = db.settings.notificationDaysAhead || 7;
    
    // Calcular data para notificação
    const notificationDate = new Date();
    notificationDate.setDate(today.getDate() + notificationDaysAhead);
    
    // Filtrar agendamentos próximos (dentro do período de notificação)
    const upcomingAppointments = db.appointments.filter(appointment => {
      // Apenas status pendente
      if (appointment.status !== 'PENDING') return false;
      
      // Verificar se já foi notificado
      const wasNotified = db.notifications.some(
        notification => notification.appointmentId === appointment.id
      );
      
      if (wasNotified) return false;
      
      // Verificar se está no período para notificação
      const appointmentDate = new Date(appointment.scheduledFor);
      const timeDiff = appointmentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff <= notificationDaysAhead && daysDiff > 0;
    });
    
    // Contador de notificações necessárias
    if (upcomingAppointments.length > 0) {
      // Criar badge de notificação no menu
      updateNotificationBadge(upcomingAppointments.length);
    }
  };
  
  // Atualiza badge de notificação no menu
  const updateNotificationBadge = (count) => {
    const menuItem = document.querySelector('.sidebar__nav a[href="recontato.html"]');
    if (!menuItem) return;
    
    // Remover badge existente
    const existingBadge = menuItem.querySelector('.notification-badge');
    if (existingBadge) {
      menuItem.removeChild(existingBadge);
    }
    
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.textContent = count;
      menuItem.appendChild(badge);
    }
  };
  
  // Renderiza tabela de notificações enviadas
  const renderNotificationsTable = () => {
    if (!notificationsTable) return;
    
    const db = window.mockDB;
    if (!db) return;
    
    // Limpar tabela
    notificationsTable.innerHTML = '';
    
    // Filtrar e ordenar notificações (mais recentes primeiro)
    const allNotifications = [...db.notifications]
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    
    // Adicionar notificações à tabela
    allNotifications.forEach(notification => {
      // Encontrar agendamento relacionado
      const appointment = db.appointments.find(a => a.id === notification.appointmentId);
      if (!appointment) return;
      
      // Encontrar cliente
      const customer = db.customers.find(c => c.id === appointment.customerId);
      if (!customer) return;
      
      // Criar linha
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(notification.sentAt)}</td>
        <td>${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${formatDate(appointment.scheduledFor)}</td>
        <td>${notification.channel}</td>
        <td>
          <span class="status-badge ${notification.status === 'SENT' ? 'success' : 'error'}">
            ${notification.status === 'SENT' ? 'Enviado' : 'Falha'}
          </span>
        </td>
        <td>
          <button class="btn btn--small btn--details" data-appointment-id="${appointment.id}">
            Ver Agendamento
          </button>
        </td>
      `;
      
      // Evento de clique para o botão de detalhes
      const detailsBtn = tr.querySelector('.btn--details');
      detailsBtn.addEventListener('click', () => {
        showAppointmentDetails(appointment.id);
      });
      
      notificationsTable.appendChild(tr);
    });
    
    // Mensagem se não houver resultados
    if (allNotifications.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'Nenhuma notificação enviada até o momento';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      notificationsTable.appendChild(tr);
    }
  };
  
  // Renderiza lista de próximas notificações a enviar
  const renderUpcomingNotifications = () => {
    if (!upcomingNotifications) return;
    
    const db = window.mockDB;
    if (!db) return;
    
    // Limpar conteúdo
    upcomingNotifications.innerHTML = '';
    
    const today = new Date();
    const notificationDaysAhead = db.settings.notificationDaysAhead || 7;
    
    // Filtrar agendamentos próximos (dentro do período de notificação)
    const upcomingAppointments = db.appointments.filter(appointment => {
      // Apenas status pendente
      if (appointment.status !== 'PENDING') return false;
      
      // Verificar se já foi notificado
      const wasNotified = db.notifications.some(
        notification => notification.appointmentId === appointment.id
      );
      
      if (wasNotified) return false;
      
      // Verificar se está no período para notificação
      const appointmentDate = new Date(appointment.scheduledFor);
      const timeDiff = appointmentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff <= notificationDaysAhead && daysDiff > 0;
    });
    
    // Ordenar por data de agendamento (mais próximos primeiro)
    upcomingAppointments.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    
    // Criar o título
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = `Notificações a Enviar (${upcomingAppointments.length})`;
    upcomingNotifications.appendChild(title);
    
    // Criar tabela
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = 'data-table upcoming-notifications-table';
    
    const tableHead = document.createElement('thead');
    tableHead.innerHTML = `
      <tr>
        <th>Data Agendamento</th>
        <th>Cliente</th>
        <th>Telefone</th>
        <th>Canal</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    `;
    
    const tableBody = document.createElement('tbody');
    
    // Adicionar agendamentos à tabela
    upcomingAppointments.forEach(appointment => {
      // Encontrar cliente
      const customer = db.customers.find(c => c.id === appointment.customerId);
      if (!customer) return;
      
      // Dias restantes até o agendamento
      const appointmentDate = new Date(appointment.scheduledFor);
      const timeDiff = appointmentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let urgencyClass = '';
      if (daysDiff <= 3) {
        urgencyClass = 'warning-date';
      }
      
      // Criar linha
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="${urgencyClass}">
          ${formatDate(appointment.scheduledFor)} 
          <small>(${daysDiff} dias)</small>
        </td>
        <td>${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${customer.preferredChannel}</td>
        <td>Pendente</td>
        <td>
          <button class="btn btn--small btn--accent send-notification" data-appointment-id="${appointment.id}">
            Enviar
          </button>
          <button class="btn btn--small btn--details" data-appointment-id="${appointment.id}">
            Detalhes
          </button>
        </td>
      `;
      
      // Evento de clique para o botão de enviar
      const sendBtn = tr.querySelector('.send-notification');
      sendBtn.addEventListener('click', () => {
        sendNotification(appointment.id);
      });
      
      // Evento de clique para o botão de detalhes
      const detailsBtn = tr.querySelector('.btn--details');
      detailsBtn.addEventListener('click', () => {
        showAppointmentDetails(appointment.id);
      });
      
      tableBody.appendChild(tr);
    });
    
    // Mensagem se não houver resultados
    if (upcomingAppointments.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'Nenhuma notificação pendente';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tableBody.appendChild(tr);
    }
    
    table.appendChild(tableHead);
    table.appendChild(tableBody);
    tableContainer.appendChild(table);
    upcomingNotifications.appendChild(tableContainer);
    
    // Atualizar contagem de notificações
    updateNotificationBadge(upcomingAppointments.length);
  };
  
  // Renderiza quadro Kanban de recontatos
  const renderKanbanBoard = (filterText = '') => {
    const db = window.mockDB;
    if (!db) return;
    
    const today = new Date();
    
    // Containers do Kanban
    const overdueContainer = document.getElementById('overdueContainer');
    const upcomingContainer = document.getElementById('upcomingContainer');
    const futureContainer = document.getElementById('futureContainer');
    
    if (!overdueContainer || !upcomingContainer || !futureContainer) return;
    
    // Limpar containers
    overdueContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';
    futureContainer.innerHTML = '';
    
    // Filtrar agendamentos pendentes
    let appointments = db.appointments.filter(a => a.status === 'PENDING');
    
    // Aplicar filtro de texto
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      appointments = appointments.filter(a => {
        const customer = db.customers.find(c => c.id === a.customerId);
        if (!customer) return false;
        
        return customer.name.toLowerCase().includes(lowerFilter) ||
               customer.phone.toLowerCase().includes(lowerFilter) ||
               customer.email?.toLowerCase().includes(lowerFilter) ||
               a.notes?.toLowerCase().includes(lowerFilter);
      });
    }
    
    // Contadores
    let overdueCount = 0;
    let upcomingCount = 0;
    let futureCount = 0;
    
    // Processar cada agendamento
    appointments.forEach(appointment => {
      const customer = db.customers.find(c => c.id === appointment.customerId);
      if (!customer) return;
      
      const appointmentDate = new Date(appointment.scheduledFor);
      const timeDiff = appointmentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Criar card para o agendamento
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = `
        <div class="kanban-card-title">${customer.name}</div>
        <div class="kanban-card-info">${customer.phone}</div>
        <div class="kanban-card-date">${formatDate(appointment.scheduledFor)}</div>
        <div class="kanban-card-actions">
          <button class="btn btn--small btn--accent send-notif-btn" data-id="${appointment.id}">Notificar</button>
          <button class="btn btn--small btn--details details-btn" data-id="${appointment.id}">Detalhes</button>
        </div>
      `;
      
      // Eventos dos botões
      const sendBtn = card.querySelector('.send-notif-btn');
      sendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sendNotification(appointment.id);
      });
      
      const detailsBtn = card.querySelector('.details-btn');
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAppointmentDetails(appointment.id);
      });
      
      // Card clicável
      card.addEventListener('click', () => {
        showAppointmentDetails(appointment.id);
      });
      
      // Adicionar ao container apropriado
      if (daysDiff < 0) {
        // Vencido
        overdueContainer.appendChild(card);
        overdueCount++;
      } else if (daysDiff <= 7) {
        // Próximos 7 dias
        upcomingContainer.appendChild(card);
        upcomingCount++;
      } else {
        // Futuro
        futureContainer.appendChild(card);
        futureCount++;
      }
    });
    
    // Mostrar mensagem se não houver agendamentos em cada seção
    if (overdueCount === 0) {
      overdueContainer.innerHTML = '<div class="empty-message">Nenhum agendamento vencido</div>';
    }
    
    if (upcomingCount === 0) {
      upcomingContainer.innerHTML = '<div class="empty-message">Nenhum agendamento nos próximos 7 dias</div>';
    }
    
    if (futureCount === 0) {
      futureContainer.innerHTML = '<div class="empty-message">Nenhum agendamento futuro</div>';
    }
    
    // Atualizar contadores
    document.getElementById('overdueCount').textContent = overdueCount;
    document.getElementById('upcomingCount').textContent = upcomingCount;
    document.getElementById('futureCount').textContent = futureCount;
  };
  
  // Exibe detalhes de um agendamento
  const showAppointmentDetails = (appointmentId) => {
    if (window.DashboardModule && typeof window.DashboardModule.showAppointmentDetails === 'function') {
      window.DashboardModule.showAppointmentDetails(appointmentId);
    } else {
      window.showToast('Visualização de agendamento em implementação', 'warning');
    }
  };
  
  // Envia uma notificação para um agendamento
  const sendNotification = (appointmentId) => {
    const db = window.mockDB;
    if (!db) return;
    
    const appointment = db.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
      window.showToast('Agendamento não encontrado', 'error');
      return;
    }
    
    const customer = db.customers.find(c => c.id === appointment.customerId);
    if (!customer) {
      window.showToast('Cliente não encontrado', 'error');
      return;
    }
    
    // Verificar se já foi enviada notificação
    const alreadyNotified = db.notifications.some(n => n.appointmentId === appointmentId);
    if (alreadyNotified) {
      window.showToast('Notificação já enviada para este agendamento', 'warning');
      return;
    }
    
    // Simular envio de notificação
    const success = Math.random() > 0.1; // 90% de chance de sucesso
    
    // Criar registro de notificação
    const newNotification = {
      id: generateId(),
      appointmentId,
      channel: customer.preferredChannel,
      sentAt: new Date().toISOString().split('T')[0],
      status: success ? 'SENT' : 'FAILED'
    };
    
    // Adicionar ao banco de dados
    db.notifications.push(newNotification);
    
    // Exibir mensagem de sucesso/erro
    if (success) {
      window.showToast(`Notificação enviada para ${customer.name}`, 'success');
      
      // Se implementado, registrar log da notificação
      if (window.AppModule && window.AppModule.logActivity) {
        window.AppModule.logActivity(
          `Notificação enviada: ${customer.name} - ${formatDate(appointment.scheduledFor)}`
        );
      }
    } else {
      window.showToast(`Falha ao enviar notificação para ${customer.name}`, 'error');
    }
    
    // Atualizar interfaces
    renderNotificationsTable();
    renderUpcomingNotifications();
  };
  
  // Envia notificações em lote para todos os agendamentos pendentes
  const batchSendNotifications = () => {
    const db = window.mockDB;
    if (!db) return;
    
    const today = new Date();
    const notificationDaysAhead = db.settings.notificationDaysAhead || 7;
    
    // Filtrar agendamentos próximos (dentro do período de notificação)
    const upcomingAppointments = db.appointments.filter(appointment => {
      // Apenas status pendente
      if (appointment.status !== 'PENDING') return false;
      
      // Verificar se já foi notificado
      const wasNotified = db.notifications.some(
        notification => notification.appointmentId === appointment.id
      );
      
      if (wasNotified) return false;
      
      // Verificar se está no período para notificação
      const appointmentDate = new Date(appointment.scheduledFor);
      const timeDiff = appointmentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff <= notificationDaysAhead && daysDiff > 0;
    });
    
    if (upcomingAppointments.length === 0) {
      window.showToast('Não há notificações pendentes para envio', 'warning');
      return;
    }
    
    // Confirmar envio em lote
    if (!confirm(`Deseja enviar ${upcomingAppointments.length} notificações?`)) {
      return;
    }
    
    // Contadores
    let successCount = 0;
    let failCount = 0;
    
    // Enviar notificações
    upcomingAppointments.forEach(appointment => {
      const customer = db.customers.find(c => c.id === appointment.customerId);
      if (!customer) {
        failCount++;
        return;
      }
      
      // Simular envio de notificação
      const success = Math.random() > 0.1; // 90% de chance de sucesso
      
      // Criar registro de notificação
      const newNotification = {
        id: generateId(),
        appointmentId: appointment.id,
        channel: customer.preferredChannel,
        sentAt: new Date().toISOString().split('T')[0],
        status: success ? 'SENT' : 'FAILED'
      };
      
      // Adicionar ao banco de dados
      db.notifications.push(newNotification);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    });
    
    // Exibir resultado
    window.showToast(`Notificações enviadas: ${successCount} sucesso, ${failCount} falha`, 'success');
    
    // Atualizar interfaces
    renderNotificationsTable();
    renderUpcomingNotifications();
  };
  
  // Gera um ID único para uma nova notificação
  const generateId = () => {
    const db = window.mockDB;
    if (!db || !db.notifications) return 1;
    
    return db.notifications.length > 0 
      ? Math.max(...db.notifications.map(n => n.id)) + 1
      : 1;
  };
  
  // API pública do módulo
  return {
    init,
    renderNotificationsTable,
    renderUpcomingNotifications,
    sendNotification,
    batchSendNotifications,
    checkPendingNotifications
  };
})();

// Expor globalmente
window.NotificationsModule = NotificationsModule;
