// Dashboard module - Gerencia a página inicial com métricas e resumos
const DashboardModule = (() => {
  // Cache de elementos DOM
  let metricTiles;
  let contactsTableBody;
  let chartContainer;
  let newServiceButton;  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;  
  
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
    metricTiles = {
      customers: document.querySelector('.metric-tile:nth-child(1) .metric-value'),
      services: document.querySelector('.metric-tile:nth-child(2) .metric-value'),
      revenue: document.querySelector('.metric-tile:nth-child(3) .metric-value'),
      expenses: document.querySelector('.metric-tile:nth-child(4) .metric-value'),
      customersTrend: document.querySelector('.metric-tile:nth-child(1) .metric-trend'),
      servicesTrend: document.querySelector('.metric-tile:nth-child(2) .metric-trend'),
      revenueTrend: document.querySelector('.metric-tile:nth-child(3) .metric-trend'),
      expensesTrend: document.querySelector('.metric-tile:nth-child(4) .metric-trend'),
    };
    contactsTableBody = document.querySelector('.table-mini tbody');
    chartContainer = document.querySelector('.chart__placeholder');
    newServiceButton = document.querySelector('.btn--primary');

    // Badge de notificações no header
    renderNotificationBadge();

    // Adicionar event listeners
    if (newServiceButton) {
      newServiceButton.addEventListener('click', () => {
        if (window.ServicesModule && window.ServicesModule.showNewServiceModal) {
          window.ServicesModule.showNewServiceModal();
        }
      });
    }

    // Adicionar event listener para busca
    const searchInput = document.querySelector('.header__search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderContacts(e.target.value);
      });
    }

    // Inicializa notificações (badge, toast, etc)
    if (window.NotificationsModule && window.NotificationsModule.init) {
      window.NotificationsModule.init();
    }

    renderMetrics();
    renderContacts();
    setupChart();
  };

  // Calcula e exibe métricas de dashboard
  const renderMetrics = () => {
    const db = window.mockDB;
    
    // Totais
    const totalCustomers = db.customers.length;
    const totalServices = db.services.length;
    const totalRevenue = db.services.reduce((sum, s) => sum + s.price, 0);
    const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Atualiza elementos
    metricTiles.customers.textContent = totalCustomers;
    metricTiles.services.textContent = totalServices;
    metricTiles.revenue.textContent = formatCurrency(totalRevenue);
    metricTiles.expenses.textContent = formatCurrency(totalExpenses);
  };  // Exibe próximos contatos ordenados por data
  const renderContacts = (filterText = '') => {
    const db = window.mockDB;
    const now = new Date();
    
    // Filtra e ordena agendamentos
    const upcoming = db.appointments
      .filter(a => a.status === 'PENDING') // Apenas pendentes
      .filter(a => {
        const cust = db.customers.find(c => c.id === a.customerId);
        return !filterText || (cust && cust.name.toLowerCase().includes(filterText.toLowerCase()));
      })
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
      .slice(0, 5); // Só os 5 mais próximos
    
    // Limpa tabela
    contactsTableBody.innerHTML = '';
    
    // Cria linhas
    upcoming.forEach(a => {
      const cust = db.customers.find(c => c.id === a.customerId);
      const tr = document.createElement('tr');
        const tdName = document.createElement('td');
      tdName.textContent = cust ? cust.name : 'Cliente não encontrado';
      tdName.style.cursor = 'pointer';
      tdName.addEventListener('click', (e) => {
        // Exibe detalhes do cliente em um modal
        e.stopPropagation(); // Prevent event from bubbling up to row
        if (cust) {
          showCustomerDetails(cust.id);
        }
      });
        const tdDate = document.createElement('td');
      const scheduleDate = new Date(a.scheduledFor);
      tdDate.textContent = formatDate(a.scheduledFor);
      
      // Destaca datas próximas (< 7 dias)
      const daysUntil = Math.ceil((scheduleDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) {
        tdDate.classList.add('warning-date');
      }
        tr.append(tdName, tdDate);
      tr.dataset.appointmentId = a.id;
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        if (cust) {
          showCustomerDetails(cust.id);
        }
      });
      
      contactsTableBody.appendChild(tr);
    });    // Mensagem se não houver contatos
    if (upcoming.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = filterText ? 'Nenhum resultado para a busca' : 'Nenhum contato agendado';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      contactsTableBody.appendChild(tr);
    }
  };
  
  // Configura e renderiza o gráfico de receitas vs despesas
  const setupChart = () => {
    if (!chartContainer) return;
    
    const db = window.mockDB;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    // Organiza dados por mês
    const revenueData = Array(6).fill(0);
    const expenseData = Array(6).fill(0);
    
    // Últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    // Receitas
    db.services.forEach(service => {
      const serviceDate = new Date(service.serviceDate);
      if (serviceDate >= sixMonthsAgo) {
        const monthIndex = (serviceDate.getMonth() - (currentMonth - 5) + 12) % 12;
        if (monthIndex >= 0 && monthIndex < 6) {
          revenueData[monthIndex] += service.price;
        }
      }
    });
    
    // Despesas
    db.expenses.forEach(expense => {
      const expenseDate = new Date(expense.paidAt);
      if (expenseDate >= sixMonthsAgo) {
        const monthIndex = (expenseDate.getMonth() - (currentMonth - 5) + 12) % 12;
        if (monthIndex >= 0 && monthIndex < 6) {
          expenseData[monthIndex] += expense.amount;
        }
      }
    });
    
    // Criar labels para os últimos 6 meses
    const labels = [];
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      labels.push(months[monthIndex]);
    }
    
    // Criar gráfico simples (sem bibliotecas externas)
    const chartHtml = createSimpleChart(labels, revenueData, expenseData);
    chartContainer.innerHTML = chartHtml;
  };
  
  // Função que cria um gráfico simples com HTML/CSS
  const createSimpleChart = (labels, revenueData, expenseData) => {
    const maxValue = Math.max(...revenueData, ...expenseData) * 1.1; // 10% maior que o valor máximo
    const chartHeight = 200;
    
    let html = `
      <div class="simple-chart">
        <div class="chart-title">Receita vs Despesa (últimos 6 meses)</div>
        <div class="chart-container" style="height: ${chartHeight}px;">
    `;
    
    // Barras
    for (let i = 0; i < labels.length; i++) {
      const revenueHeight = (revenueData[i] / maxValue) * chartHeight;
      const expenseHeight = (expenseData[i] / maxValue) * chartHeight;
      
      html += `
        <div class="chart-column">
          <div class="chart-bar revenue" style="height: ${revenueHeight}px;" 
               title="Receita: R$ ${revenueData[i].toFixed(2)}"></div>
          <div class="chart-bar expense" style="height: ${expenseHeight}px;" 
               title="Despesa: R$ ${expenseData[i].toFixed(2)}"></div>
          <div class="chart-label">${labels[i]}</div>
        </div>
      `;
    }
    
    html += `
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-color revenue"></span>Receita</span>
          <span class="legend-item"><span class="legend-color expense"></span>Despesa</span>
        </div>
      </div>
    `;
    
    return html;
  };
    // Exibe modal com detalhes de cliente
  const showCustomerDetails = (customerId) => {
    if (window.ComponentsModule && typeof window.ComponentsModule.showCustomerDetailsModal === 'function') {
      // Usar o componente reutilizável
      window.ComponentsModule.showCustomerDetailsModal(customerId);
    } else {
      // Fallback para implementação antiga
      const db = window.mockDB;
      const customer = db.customers.find(c => c.id === customerId);
      
      if (!customer) return;
      
      // Filtrar serviços deste cliente
      const customerServices = db.services.filter(s => s.customerId === customerId);
      
      // Criar modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      // Conteúdo do modal
      modal.innerHTML = `
        <div class="modal__content">
          <div class="modal__header">
            <h2>Cliente: ${customer.name}</h2>
            <button class="modal__close">&times;</button>
          </div>
          <div class="modal__body">
            <div class="customer-details">
              <div class="customer-info">
                <p><strong>Telefone:</strong> ${customer.phone}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Endereço:</strong> ${customer.address}</p>
                <p><strong>Cidade:</strong> ${customer.city} - ${customer.state}</p>
                <p><strong>CEP:</strong> ${customer.zip}</p>
                <p><strong>Canal preferido:</strong> ${customer.preferredChannel}</p>
              </div>
              
              <div class="customer-services">
                <h3>Histórico de Serviços</h3>
                ${customerServices.length > 0 
                  ? `<ul class="services-list">
                      ${customerServices.map(service => `
                        <li>
                          <div class="service-date">${formatDate(service.serviceDate)}</div>
                          <div class="service-price">R$ ${service.price.toFixed(2)}</div>
                          <div class="service-notes">${service.notes}</div>
                        </li>
                      `).join('')}
                     </ul>`
                  : '<p>Nenhum serviço registrado</p>'
                }
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--primary" id="addServiceBtn">Registrar Novo Serviço</button>
            <button class="btn" id="rescheduleBtn">Prorrogar Data de Recontato</button>
            <button class="btn btn--danger" id="neverBtn">Cliente Não Tem Interesse</button>
            <button class="btn" id="closeModalBtn">Fechar</button>
          </div>
        </div>
      `;
      
      // Inserir modal no DOM
      document.body.appendChild(modal);
      
      // Adicionar event listeners aos botões
      modal.querySelector('.modal__close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.querySelector('#closeModalBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.querySelector('#addServiceBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        ServicesModule.showNewServiceModal(customer.id);
      });
      
      modal.querySelector('#rescheduleBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        rescheduleCustomerAppointment(customer.id);
      });
      
      modal.querySelector('#neverBtn').addEventListener('click', () => {
        // Confirmar antes de marcar como "Não tem interesse"
        if (confirm(`Tem certeza que deseja marcar ${customer.name} como "Cliente Não Tem Interesse"?`)) {
          markCustomerAsNever(customer.id);
          document.body.removeChild(modal);
        }
      });
      
      // Fechar ao clicar fora do conteúdo
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
  };
    // Exibe detalhes do agendamento
  const showAppointmentDetails = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (!appointment) return;
    
    const customer = db.customers.find(c => c.id === appointment.customerId);
    const originalService = db.services.find(s => s.id === appointment.createdFromServiceId);
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Status para exibição
    const statusDisplay = {
      'PENDING': 'Pendente',
      'DONE': 'Concluído',
      'SCHEDULED': 'Agendado',
      'NEVER': 'Cliente não quer mais'
    };
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Detalhes do Agendamento</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <p><strong>Cliente:</strong> ${customer ? customer.name : 'Cliente não encontrado'}</p>
          <p><strong>Agendado para:</strong> ${formatDate(appointment.scheduledFor)}</p>
          <p><strong>Status:</strong> ${statusDisplay[appointment.status] || 'Desconhecido'}</p>
          <p><strong>Observações:</strong> ${appointment.notes}</p>
          ${originalService ? `<p><strong>Criado a partir do serviço de:</strong> ${formatDate(originalService.serviceDate)}</p>` : ''}
        </div>
        <div class="modal__footer">
          ${appointment.status === 'PENDING' 
            ? `<button class="btn btn--primary" id="scheduleBtn">Marcar como Agendado</button>
               <button class="btn" id="rescheduleBtn">Prorrogar Contato</button>
               <button class="btn btn--danger" id="neverBtn">Cliente Não Quer Mais</button>`
            : ''
          }
          <button class="btn" id="closeModalBtn">Fechar</button>
        </div>
      </div>
    `;
      // Inserir modal no DOM
    document.body.appendChild(modal);
    
    // Adicionar event listeners aos botões
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Event listeners condicionais
    if (appointment.status === 'PENDING') {
      modal.querySelector('#scheduleBtn').addEventListener('click', () => {
        markAppointmentAsScheduled(appointmentId);
        document.body.removeChild(modal);
      });
      
      modal.querySelector('#rescheduleBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        rescheduleAppointment(appointmentId);
      });
      
      modal.querySelector('#neverBtn').addEventListener('click', () => {
        markAppointmentAsNever(appointmentId);
        document.body.removeChild(modal);
      });
    }
    
    // Fechar ao clicar fora do conteúdo
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
    // Marca um agendamento como concluído (DONE)
  const markAppointmentAsDone = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
      appointment.status = 'DONE';
      showToast('Agendamento marcado como concluído');
      renderContacts(); // Atualiza a lista
    }
  };
  
  // Marca um agendamento como agendado (SCHEDULED)
  const markAppointmentAsScheduled = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
      appointment.status = 'SCHEDULED';
      showToast('Agendamento marcado como agendado');
      renderContacts(); // Atualiza a lista
    }
  };
  
  // Marca um agendamento como "cliente não quer mais" (NEVER)
  const markAppointmentAsNever = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
      appointment.status = 'NEVER';
      showToast('Cliente marcado como "não quer mais"', 'warning');
      renderContacts(); // Atualiza a lista
    }
  };
  
  // Reagenda (Prorroga) um contato
  const rescheduleAppointment = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (!appointment) return;
    
    // Criar modal de reagendamento    const modal = document.createElement('div');
    modal.className = 'modal';
      // Extrair data e hora atuais do appointment
    const currentDateTime = new Date(appointment.scheduledFor);
    const currentDate = currentDateTime.toISOString().split('T')[0];
    const currentTime = currentDateTime.toTimeString().substring(0, 5); // Formato HH:MM
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Prorrogar Contato</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <p>Escolha a nova data e hora de contato:</p>
          <div class="form-row">
            <div class="form-group">
              <label for="newDate">Data:</label>
              <input type="date" id="newDate" class="form-input" min="${new Date().toISOString().split('T')[0]}" value="${currentDate}">
            </div>
            <div class="form-group">
              <label for="newTime">Horário:</label>
              <input type="time" id="newTime" class="form-input" value="${currentTime}">
            </div>
          </div>
          <p><strong>Observações:</strong></p>
          <textarea id="notes" class="form-textarea">${appointment.notes}</textarea>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="saveBtn">Salvar</button>
          <button class="btn" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;
    
    // Inserir modal no DOM
    document.body.appendChild(modal);
    
    // Adicionar event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
      modal.querySelector('#saveBtn').addEventListener('click', () => {
      const newDate = modal.querySelector('#newDate').value;      const newTime = modal.querySelector('#newTime').value || "09:00";
      const notes = modal.querySelector('#notes').value;
      
      if (!newDate) {
        alert('Por favor, selecione uma data');
        return;
      }
      
      // Atualizar agendamento - combinar data e hora
      appointment.scheduledFor = `${newDate}T${newTime}`;
      appointment.notes = notes;
      
      showToast('Contato prorrogado com sucesso');
      renderContacts(); // Atualiza a lista
      
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  
  // Marca agendamentos de um cliente como "cliente não quer mais" (NEVER)
  const markCustomerAsNever = (customerId) => {
    const db = window.mockDB;
    const pendingAppointments = db.appointments.filter(a => a.customerId === customerId && a.status === 'PENDING');
    
    if (pendingAppointments.length > 0) {
      pendingAppointments.forEach(appointment => {
        appointment.status = 'NEVER';
      });
      showToast('Cliente marcado como "não tem interesse"', 'warning');
      renderContacts(); // Atualiza a lista
    } else {
      showToast('Cliente não possui agendamentos pendentes', 'info');
    }
  };
  
  // Reagenda (Prorroga) contato para um cliente
  const rescheduleCustomerAppointment = (customerId) => {
    const db = window.mockDB;
    const pendingAppointments = db.appointments.filter(a => a.customerId === customerId && a.status === 'PENDING');
    
    if (pendingAppointments.length === 0) {
      // Se não há agendamentos pendentes, criar um novo
      const customer = db.customers.find(c => c.id === customerId);
      if (!customer) return;
      
      // Modal para nova data
      showRescheduleModal(null, customerId);
    } else {
      // Se há agendamentos pendentes, reagendar o primeiro
      showRescheduleModal(pendingAppointments[0].id);
    }
  };
  
  // Mostra modal para reagendar contato
  const showRescheduleModal = (appointmentId, customerId = null) => {
    const db = window.mockDB;
    let appointment = null;
    let customer = null;
    
    if (appointmentId) {
      appointment = db.appointments.find(a => a.id === appointmentId);
      if (!appointment) return;
      customer = db.customers.find(c => c.id === appointment.customerId);
    } else if (customerId) {
      customer = db.customers.find(c => c.id === customerId);
    }
    
    if (!customer) return;
    
    // Valores default para data/hora
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const currentDate = appointment ? 
      new Date(appointment.scheduledFor).toISOString().split('T')[0] : 
      nextMonth.toISOString().split('T')[0];
    
    const currentTime = appointment ? 
      new Date(appointment.scheduledFor).toTimeString().substring(0, 5) : 
      "09:00";
    
    // Criar modal de reagendamento
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Prorrogar Contato: ${customer.name}</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <p>Escolha a nova data e hora de contato:</p>
          <div class="form-row">
            <div class="form-group">
              <label for="newDate">Data:</label>
              <input type="date" id="newDate" class="form-input" min="${now.toISOString().split('T')[0]}" value="${currentDate}">
            </div>
            <div class="form-group">
              <label for="newTime">Horário:</label>
              <input type="time" id="newTime" class="form-input" value="${currentTime}">
            </div>
          </div>
          <p><strong>Observações:</strong></p>
          <textarea id="notes" class="form-textarea">${appointment ? appointment.notes : 'Contato prorrogado'}</textarea>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="saveBtn">Salvar</button>
          <button class="btn" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;
    
    // Inserir modal no DOM
    document.body.appendChild(modal);
    
    // Adicionar event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#saveBtn').addEventListener('click', () => {
      const newDate = modal.querySelector('#newDate').value;
      const newTime = modal.querySelector('#newTime').value || "09:00";
      const notes = modal.querySelector('#notes').value;
      
      if (!newDate) {
        alert('Por favor, selecione uma data');
        return;
      }
      
      if (appointment) {
        // Atualizar agendamento existente
        appointment.scheduledFor = `${newDate}T${newTime}`;
        appointment.notes = notes;
        showToast('Contato prorrogado com sucesso');
      } else {
        // Criar novo agendamento
        const newAppointmentId = Math.max(...db.appointments.map(a => a.id)) + 1 || 1;
        const newAppointment = {
          id: newAppointmentId,
          customerId: customerId,
          scheduledFor: `${newDate}T${newTime}`,
          createdFromServiceId: null,
          status: 'PENDING',
          notes: notes
        };
        
        db.appointments.push(newAppointment);
        showToast('Novo contato agendado com sucesso');
      }
      
      renderContacts(); // Atualiza a lista
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  
  // Handler para o botão "Nova venda"
  const handleNewService = () => {
    // Chama o método do módulo de serviços para exibir o modal de nova venda
    ServicesModule.showNewServiceModal();
  };
    // Exibe uma mensagem toast
  const showToast = (message, type = 'success') => {
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

  // Renderiza badge de notificações pendentes no header
  const renderNotificationBadge = () => {
    const header = document.querySelector('.header__actions');
    if (!header) return;
    let badge = document.querySelector('.notification-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.title = 'Notificações pendentes de recontato';
      header.appendChild(badge);
    }    // Busca quantidade de notificações pendentes
    let pending = 0;
    if (window.mockDB && window.mockDB.appointments) {
      const today = new Date();
      const ahead = window.mockDB.settings?.notificationDaysAhead || 7;
      const limit = new Date();
      limit.setDate(today.getDate() + ahead);
      pending = window.mockDB.appointments
        .filter(a => a.status === 'PENDING' && new Date(a.scheduledFor) <= limit)
        .length;
    }
    badge.textContent = pending > 0 ? pending : '';
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
  };
  // Expor métodos publicamente
  return {
    init,
    renderMetrics,
    renderContacts,
    showCustomerDetails,
    showAppointmentDetails,
    rescheduleCustomerAppointment,
    markCustomerAsNever
  };
})();

// Exporta o módulo
window.DashboardModule = DashboardModule;
