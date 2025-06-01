// Módulo de Notificações e Recontato

const NotificationsModule = (() => {
  // Formatação de datas
  const formatDate = (dateStr) => {
    if (!dateStr) {
      console.warn('formatDate: Received undefined or null dateStr');
      return 'Data inválida';
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`formatDate: Invalid date string received: ${dateStr}`);
      return 'Data inválida';
    }

    if (dateStr.includes('T')) {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR');
  };

  // Formatação de moeda
  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;
  
  // Inicialização do módulo
  const init = () => {
    // Verifica se estamos na página de recontato
    const isRecontatoPage = window.location.pathname.includes('recontato.html');
    
    if (isRecontatoPage) {
      setupRecontatoPage();
    }
  };
    // Configuração da página de recontato
  const setupRecontatoPage = () => {
    renderKanbanBoard();
    
    // Configurar pesquisa
    const searchInput = document.getElementById('appointmentSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderKanbanBoard(e.target.value);
      });
    }
    
    // Configurar botão de novo cliente
    const newClientBtn = document.getElementById('newClientBtn');
    if (newClientBtn && window.CustomersModule) {
      newClientBtn.addEventListener('click', () => {
        window.CustomersModule.showAddCustomerModal();
      });
    }
  };
    // Renderiza o quadro kanban
  const renderKanbanBoard = async (searchText = '') => {
    const kanbanContainer = document.querySelector('.kanban');
    if (!kanbanContainer) return;

    // Limpar conteúdo existente
    kanbanContainer.innerHTML = '';

    // Data atual para comparações
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Datas para classificação
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Adicionar logs para verificar os dados retornados pela API
    try {
      const appointments = await API.getAppointments();
      const customers = await API.getCustomers();

      // Filtrar e processar os dados aqui...
      // Filtrar os agendamentos pendentes
      const pendingAppointments = appointments.filter(a => {
        if (a.status !== 'PENDING') return false;

        if (!searchText) return true;

        const customer = customers.find(c => c.id === a.customerId);
        if (!customer) return false;

        const searchLower = searchText.toLowerCase();
        return (
          customer.name.toLowerCase().includes(searchLower) ||
          customer.phone.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower)
        );
      });

      // Corrigir os filtros para considerar corretamente as datas e horários
      // Adicionar logs detalhados para depuração
      // console.log('Hoje:', today);
      // console.log('Próxima semana:', nextWeek);
      // console.log('Agendamentos pendentes:', pendingAppointments);

      // Corrigir o acesso à propriedade 'scheduledfor' (tudo em minúsculas)
      const overdueAppointments = pendingAppointments.filter(a => {
        const appointmentDate = new Date(a.scheduledfor);
        // console.log(`Verificando overdue: ${appointmentDate} < ${today}`);
        return appointmentDate < today;
      });

      const upcomingAppointments = pendingAppointments.filter(a => {
        const appointmentDate = new Date(a.scheduledfor);
        // console.log(`Verificando upcoming: ${appointmentDate} >= ${today} && ${appointmentDate} < ${nextWeek}`);
        return appointmentDate >= today && appointmentDate < nextWeek;
      });

      const futureAppointments = pendingAppointments.filter(a => {
        const appointmentDate = new Date(a.scheduledfor);
        // console.log(`Verificando future: ${appointmentDate} >= ${nextWeek}`);
        return appointmentDate >= nextWeek;
      });
      
      // Adicionar logs para os dados filtrados
      console.log('Overdue Appointments:', overdueAppointments);
      console.log('Upcoming Appointments:', upcomingAppointments);
      console.log('Future Appointments:', futureAppointments);
      
      // Criar colunas do Kanban
      const overdueColumn = createKanbanColumn('Atrasados', overdueAppointments, 'overdue', customers);
      const upcomingColumn = createKanbanColumn('Próximos 7 dias', upcomingAppointments, 'upcoming', customers);
      const futureColumn = createKanbanColumn('Agendamentos Futuros', futureAppointments, 'future', customers);
      
      // Adicionar colunas ao container
      kanbanContainer.appendChild(overdueColumn);
      kanbanContainer.appendChild(upcomingColumn);
      kanbanContainer.appendChild(futureColumn);
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      window.showToast('Erro ao carregar dados', 'error');
    }
  };
  
  // Cria uma coluna do kanban
  const createKanbanColumn = (title, appointments, columnClass, customers) => {
    const column = document.createElement('div');
    column.className = `kanban-column ${columnClass}`;
    
    // Criar cabeçalho
    const header = document.createElement('div');
    header.className = 'kanban-column-header';
    header.innerHTML = `
      <span>${title}</span>
      <span class="badge badge-${columnClass === 'overdue' ? 'danger' : columnClass === 'upcoming' ? 'warning' : 'primary'}">
        ${appointments.length}
      </span>
    `;
    
    // Criar corpo da coluna
    const body = document.createElement('div');
    body.className = 'kanban-column-body';
    
    if (appointments.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'Nenhum agendamento';
      body.appendChild(emptyMessage);
    } else {
      const sortedAppointments = [...appointments].sort((a, b) => 
        new Date(a.scheduledFor) - new Date(b.scheduledFor)
      );
      
      sortedAppointments.forEach(appointment => {
        const card = createAppointmentCard(appointment, columnClass, customers);
        if (card) body.appendChild(card);
      });
    }
    
    column.appendChild(header);
    column.appendChild(body);
    
    return column;
  };
  
  // Cria um cartão de agendamento
  const createAppointmentCard = (appointment, columnClass, customers) => {
    // Normalize property names
    const scheduledFor = appointment.scheduledFor || appointment.scheduledfor;
    if (!scheduledFor) {
      console.warn('createAppointmentCard: Missing or invalid scheduledFor in appointment:', appointment);
      return null;
    }

    const customer = customers.find(c => String(c.id) === String(appointment.customerid));
    if (!customer) {
      console.warn('Cliente não encontrado para o agendamento:', appointment);
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(scheduledFor);
    if (isNaN(appointmentDate.getTime())) {
      console.warn('createAppointmentCard: Invalid date in scheduledFor:', scheduledFor);
      return null;
    }

    const timeDiff = appointmentDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Criar card
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.appointmentId = appointment.id;
    card.dataset.customerId = customer.id;
    
    // Conteúdo do card
    card.innerHTML = `
      <div class="kanban-card-title">${customer.name}</div>
      <div class="kanban-card-info">${customer.phone}</div>
      <div class="kanban-card-date">${formatDate(scheduledFor)} ${
        daysDiff < 0 ? `<span class="badge badge-danger">${Math.abs(daysDiff)} dias atrás</span>` : 
        daysDiff === 0 ? '<span class="badge badge-warning">Hoje</span>' : 
        `<span class="badge badge-${columnClass === 'upcoming' ? 'warning' : 'primary'}">${daysDiff} dias</span>`
      }</div>
      <div class="kanban-card-actions">
        <button class="btn btn--small btn--accent" data-action="contact" title="Contatar cliente">Contatar</button>
        <button class="btn btn--small btn--details" data-action="view" title="Ver detalhes">Detalhes</button>
      </div>
    `;
    
    // Adicionar eventos
    // Botão contatar (WhatsApp)
    const contactBtn = card.querySelector('[data-action="contact"]');
    contactBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Formatar número para WhatsApp (remover caracteres não numéricos)
      const whatsappNumber = customer.phone.replace(/\D/g, '');
      // Criar mensagem personalizada
      const message = `Olá ${customer.name}, entramos em contato para confirmar seu agendamento em ${formatDate(scheduledFor)}. Podemos confirmar?`;
      // Abrir WhatsApp
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    });
      // Botão ver detalhes
    const viewBtn = card.querySelector('[data-action="view"]');
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      CustomerDetailsModal.show(customer.id);
    });
    
    // Atualizar o evento de clique no card para chamar o modal reutilizável
    card.addEventListener('click', () => {
      CustomerDetailsModal.show(customer.id);
    });
    
    return card;
  };
  
  // Marca agendamentos de um cliente como "cliente não quer mais" (NEVER)
  const markCustomerAsNever = async (customerId) => {
    let appointments = [];
    try {
      appointments = await API.getAppointments();
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      window.showToast('Erro ao carregar agendamentos', 'error');
      return;
    }

    const pendingAppointments = appointments.filter(a => a.customerId === customerId && a.status === 'PENDING');

    if (pendingAppointments.length > 0) {
      try {
        for (const appointment of pendingAppointments) {
          await API.updateAppointment(appointment.id, { ...appointment, status: 'NEVER' });
        }
        window.showToast('Cliente marcado como "não tem interesse"', 'warning');
        renderKanbanBoard();
      } catch (error) {
        console.error('Erro ao atualizar agendamentos:', error);
        window.showToast('Erro ao marcar cliente como "não tem interesse"', 'error');
      }
    } else {
      window.showToast('Cliente não possui agendamentos pendentes', 'info');
    }
  };
  
  // Reagenda (Prorroga) contato para um cliente
  const rescheduleCustomerAppointment = async (customerId) => {
    let appointments = [];
    let customers = [];
    try {
      appointments = await API.getAppointments();
      customers = await API.getCustomers();
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      window.showToast('Erro ao carregar dados', 'error');
      return;
    }

    const pendingAppointments = appointments.filter(a => a.customerId === customerId && a.status === 'PENDING');

    if (pendingAppointments.length === 0) {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      showRescheduleModal(null, customerId);
    } else {
      showRescheduleModal(pendingAppointments[0].id);
    }
  };
  
  // Mostra modal para reagendar contato
  const showRescheduleModal = async (appointmentId, customerId = null) => {
    let appointment = null;
    let customer = null;

    try {
      if (appointmentId) {
        appointment = await API.getAppointmentById(appointmentId);
        customer = await API.getCustomerById(appointment.customerId);
      } else if (customerId) {
        customer = await API.getCustomerById(customerId);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      window.showToast('Erro ao carregar dados', 'error');
      return;
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
    
    modal.querySelector('#saveBtn').addEventListener('click', async () => {
      const newDate = modal.querySelector('#newDate').value;
      const newTime = modal.querySelector('#newTime').value || "09:00";
      const notes = modal.querySelector('#notes').value;
      
      if (!newDate) {
        window.showToast('Por favor, selecione uma data', 'error');
        return;
      }
      
      try {
        if (appointment) {
          await API.updateAppointment(appointment.id, {
            ...appointment,
            scheduledFor: `${newDate}T${newTime}`,
            notes
          });
          window.showToast('Contato prorrogado com sucesso');
        } else {
          await API.createAppointment({
            customerId: customerId,
            scheduledFor: `${newDate}T${newTime}`,
            status: 'PENDING',
            notes
          });
          window.showToast('Novo contato agendado com sucesso');
        }
        renderKanbanBoard();
        document.body.removeChild(modal);
      } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        window.showToast('Erro ao salvar agendamento', 'error');
      }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
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
          <p><strong>Observações:</strong> ${appointment.notes || ''}</p>
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
  
  // Marca um agendamento como agendado (SCHEDULED)
  const markAppointmentAsScheduled = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
      appointment.status = 'SCHEDULED';
      window.showToast('Agendamento marcado como agendado');
      renderKanbanBoard(); // Atualiza o quadro kanban
    }
  };
  
  // Marca um agendamento como "cliente não quer mais" (NEVER)
  const markAppointmentAsNever = (appointmentId) => {
    const db = window.mockDB;
    const appointment = db.appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
      appointment.status = 'NEVER';
      window.showToast('Cliente marcado como "não quer mais"', 'warning');
      renderKanbanBoard(); // Atualiza o quadro kanban
    }
  };
  
  // Reagenda (Prorroga) um contato
  const rescheduleAppointment = (appointmentId) => {
    showRescheduleModal(appointmentId);
  };
  
  // Carrega e exibe o modal reutilizável de detalhes do cliente
  const loadCustomerDetailsModal = async (customerId, appointmentId) => {
    console.log("modal");
    const modalContainer = document.getElementById('customerDetailsModal');

    if (!modalContainer) {
      const response = await fetch('/components/modal-customer-details.html');
      const modalHTML = await response.text();
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modal = document.getElementById('customerDetailsModal');
    const closeModal = () => modal.remove();

    modal.querySelector('#closeModalBtn').addEventListener('click', closeModal);
    modal.querySelector('#closeModalFooterBtn').addEventListener('click', closeModal);

    const customer = await API.getCustomerById(customerId);
    const appointment = appointmentId ? await API.getAppointmentById(appointmentId) : null;

    modal.querySelector('#modalCustomerName').textContent = customer.name;
    modal.querySelector('#customerName').textContent = customer.name;
    modal.querySelector('#appointmentDate').textContent = appointment ? formatDate(appointment.scheduledFor) : 'N/A';
    modal.querySelector('#appointmentStatus').textContent = appointment ? appointment.status : 'N/A';
    modal.querySelector('#appointmentNotes').textContent = appointment ? appointment.notes : 'N/A';

    modal.querySelector('#scheduleBtn').addEventListener('click', async () => {
      if (appointment) {
        await API.updateAppointment(appointment.id, { ...appointment, status: 'SCHEDULED' });
        window.showToast('Agendamento marcado como agendado');
        closeModal();
        renderKanbanBoard();
      }
    });

    modal.querySelector('#rescheduleBtn').addEventListener('click', () => {
      closeModal();
      showRescheduleModal(appointmentId, customerId);
    });

    modal.querySelector('#neverBtn').addEventListener('click', async () => {
      if (appointment) {
        await API.updateAppointment(appointment.id, { ...appointment, status: 'NEVER' });
        window.showToast('Cliente marcado como "não quer mais"');
        closeModal();
        renderKanbanBoard();
      }
    });

    modal.style.display = 'block';
  };

  // Expor métodos públicos
  return {
    init,
    renderKanbanBoard,
    markCustomerAsNever,
    rescheduleCustomerAppointment,
    showAppointmentDetails
  };
})();

// Expor globalmente
window.NotificationsModule = NotificationsModule;
