// Dashboard module - Gerencia a página inicial com métricas e resumos
const DashboardModule = (() => {
  // Cache de elementos DOM
  let metricTiles;
  let contactsTableBody;
  let chartContainer;
  let newServiceButton;  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;  
  
  const formatDate = (dateStr) => {
    if (!dateStr) {
      console.warn('formatDate: Data inválida recebida:', dateStr);
      return 'Data inválida';
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn(`formatDate: String de data inválida recebida: ${dateStr}`);
      return 'Data inválida';
    }
    
    // Verifica se a data tem informação de hora (formato com T)
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR');
  };// Inicialização do módulo
  const init = () => {
    console.log('Inicializando Dashboard Module');

    // Métricas
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

    // Tabela de recontatos
    contactsTableBody = document.querySelector('.table-mini tbody');
    if (!contactsTableBody) {
      console.error('Elemento da tabela de recontatos não encontrado');
    }

    // Gráfico
    chartContainer = document.querySelector('.chart__placeholder');
    
    // Botão de nova venda
    newServiceButton = document.querySelector('.btn--primary');    // Badge de notificações no header
    renderNotificationBadge().catch(err => console.error('Erro ao renderizar badge de notificações:', err));

    // Adicionar event listeners para o botão de nova venda
    if (newServiceButton) {
      newServiceButton.addEventListener('click', () => {
        if (window.ServicesModule && window.ServicesModule.showNewServiceModal) {
          window.ServicesModule.showNewServiceModal();
        }
      });
    }    // Adicionar event listener para busca
    const searchInput = document.querySelector('.header__search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderContacts(e.target.value).catch(err => console.error('Erro ao filtrar contatos:', err));
      });
    }// Inicializa notificações (badge, toast, etc)
    if (window.NotificationsModule && window.NotificationsModule.init) {
      window.NotificationsModule.init();
    }    // Renderizar componentes da dashboard
    renderMetrics().catch(err => console.error('Erro ao renderizar métricas:', err));
    renderContacts().catch(err => console.error('Erro ao renderizar contatos:', err));
    setupChart().catch(err => console.error('Erro ao renderizar gráfico:', err));
  };
  // Calcula e exibe métricas de dashboard
  const renderMetrics = async () => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        return;
      }
      
      // Buscar dados da API
      const customers = await API.getCustomers();
      const services = await API.getServices();
      const expenses = await API.getExpenses();
      
      // Calcular totais
      const totalCustomers = customers.length;
      const totalServices = services.length;
      const totalRevenue = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      // Atualizar elementos da interface, verificando se existem
      if (metricTiles.customers) metricTiles.customers.textContent = totalCustomers;
      if (metricTiles.services) metricTiles.services.textContent = totalServices;
      if (metricTiles.revenue) metricTiles.revenue.textContent = formatCurrency(totalRevenue);
      if (metricTiles.expenses) metricTiles.expenses.textContent = formatCurrency(totalExpenses);
      
      // Podemos implementar o cálculo de tendências aqui no futuro
      
    } catch (error) {
      console.error('Erro ao buscar dados para métricas:', error);
    }
  };// Exibe próximos contatos ordenados por data, priorizando os atrasados e os de hoje
  const renderContacts = async (filterText = '') => {
    // Verificar se a API está disponível
    if (!window.API) {
      console.error('API não está disponível');
      return;
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);      // Buscar dados da API
      const appointments = await API.getAppointments();
      console.log('Total de agendamentos recuperados da API:', appointments.length);
      const customers = await API.getCustomers();

      if (!contactsTableBody) return;
      
      // Limpar tabela
      contactsTableBody.innerHTML = '';

      // Filtrar apenas agendamentos pendentes
      const pendingAppointments = appointments.filter(a => a.status === 'PENDING');
      console.log('Agendamentos pendentes encontrados:', pendingAppointments.length);
      
      // Aplicar filtro de pesquisa se houver
      const filteredAppointments = pendingAppointments.filter(a => {
        if (!filterText) return true;
        
        const customer = customers.find(c => c.id === a.customerId);
        if (!customer) return false;
        
        return customer.name.toLowerCase().includes(filterText.toLowerCase());
      });      // Filtrar apenas os agendamentos atrasados (overdue)
      const overdueAppointments = [];
        // Debug: Verifique se os agendamentos têm ID de cliente
      console.log('Verificando IDs de cliente nos agendamentos:', 
        filteredAppointments.map(a => ({ id: a.id, customerId: a.customerId })));
        
      // Filtrar os agendamentos atrasados usando a mesma abordagem de notifications-new.js
      const overdueAppointmentsList = filteredAppointments.filter(a => {
        // Usar toLowerCase para garantir consistência na propriedade independente da capitalização
        const scheduledDate = a.scheduledFor || a.scheduledfor || a.SCHEDULEDFOR || a.ScheduledFor;
        if (!scheduledDate) {
          console.warn('Agendamento sem data:', a);
          return false;
        }        const appointmentDate = new Date(scheduledDate);
        
        // Log detalhado para depurar
        console.log(`Agendamento: ${a.id}, Data: ${scheduledDate}, Data formatada: ${appointmentDate.toLocaleDateString()}, Hoje: ${today.toLocaleDateString()}`);
        
        // Comparar a data considerando apenas o dia, sem horas
        const appointmentDay = new Date(appointmentDate);
        appointmentDay.setHours(0, 0, 0, 0);
        
        // Retorna true se a data do agendamento for anterior à hoje
        return appointmentDay <= today;
      });
        // Adiciona diffDays para cada agendamento para manter compatibilidade com o código existente
      overdueAppointmentsList.forEach(appointment => {
        const scheduledDate = new Date(appointment.scheduledFor || appointment.scheduledfor || appointment.SCHEDULEDFOR || appointment.ScheduledFor);
        const diffTime = scheduledDate - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        overdueAppointments.push({ ...appointment, diffDays });
      });
      
      // Log para depuração
      console.log('Agendamentos atrasados encontrados:', overdueAppointments.length);
        // Ordenar os agendamentos atrasados (do mais atrasado para o menos atrasado)
      overdueAppointments.sort((a, b) => a.diffDays - b.diffDays);
        // Log detalhado dos agendamentos encontrados
      if (overdueAppointments.length > 0) {
        console.log('Detalhes dos recontatos atrasados:');
        overdueAppointments.forEach((app, idx) => {
          const customerInfo = customers.find(c => c.id === app.customerId);
          const customerName = customerInfo ? customerInfo.name : 'Cliente desconhecido';
          console.log(`${idx + 1}. ${customerName} (ID: ${app.customerId}) - Data: ${app.scheduledFor || app.scheduledfor} (${app.diffDays} dias)`);
        });
      } else {
        console.log('Nenhum recontato atrasado encontrado');
      }
      
      // Usar apenas agendamentos atrasados para exibição
      const displayAppointments = overdueAppointments.slice(0, 5);
        // Criar linhas da tabela
      displayAppointments.forEach(a => {
        const customer = customers.find(c => c.id === a.customerId);
        console.log(`Processando agendamento: ID=${a.id}, Cliente ID=${a.customerId}, Cliente encontrado:`, customer ? 'Sim' : 'Não');
        if (!customer) {
          // Em vez de pular, mostrar um placeholder para o cliente não encontrado
          const tr = document.createElement('tr');
          
          // Coluna do nome (placeholder)
          const tdName = document.createElement('td');
          tdName.textContent = `${a.customerId || 'N/A'}`;
          tdName.style.fontStyle = 'italic';
          
          // Coluna da data
          const tdDate = document.createElement('td');
          const scheduledDate = new Date(a.scheduledFor || a.scheduledfor);
          tdDate.textContent = formatDate(scheduledDate);
          
          // Coluna de status
          const tdStatus = document.createElement('td');
          tdStatus.innerHTML = `<span class="badge badge-danger">Atrasado (${Math.abs(a.diffDays)} dias)</span>`;
          tr.classList.add('overdue-row');
          
          // Adicionar células à linha
          tr.appendChild(tdName);
          tr.appendChild(tdDate);
          tr.appendChild(tdStatus);
          
          contactsTableBody.appendChild(tr);
          return;
        }
        
        const scheduledDate = new Date(a.scheduledFor || a.scheduledfor);
        
        const tr = document.createElement('tr');
        
        // Coluna do nome
        const tdName = document.createElement('td');
        tdName.textContent = customer.name;
        tdName.style.cursor = 'pointer';
        tdName.addEventListener('click', (e) => {
          e.stopPropagation();
          showCustomerDetails(customer.id);
        });
        
        // Coluna da data
        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(scheduledDate);
        
        // Coluna de status
        const tdStatus = document.createElement('td');
        
        if (a.diffDays < 0) {
          tdStatus.innerHTML = `<span class="badge badge-danger">Atrasado (${Math.abs(a.diffDays)} dias)</span>`;
          tr.classList.add('overdue-row');
        } else if (a.diffDays === 0) {
          tdStatus.innerHTML = `<span class="badge badge-warning">Hoje</span>`;
        } else {
          tdStatus.innerHTML = `<span class="badge">${a.diffDays} dias</span>`;
        }
        
        // Adicionar células à linha
        tr.appendChild(tdName);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);
        
        // Dados do agendamento para uso em event listeners
        tr.dataset.appointmentId = a.id;
        tr.style.cursor = 'pointer';
        
        // Evento de clique na linha
        tr.addEventListener('click', () => {
          showCustomerDetails(customer.id);
        });
        
        contactsTableBody.appendChild(tr);
      });
      
      // Mensagem se não houver agendamentos
      if (displayAppointments.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = filterText ? 'Nenhum resultado para a busca' : 'Nenhum contato agendado';
        td.style.textAlign = 'center';
        tr.appendChild(td);
        contactsTableBody.appendChild(tr);
      }
    } catch (error) {
      console.error('Erro ao buscar dados para contatos:', error);
      
      // Mensagem de erro na tabela
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'Erro ao carregar os contatos';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      contactsTableBody.innerHTML = '';
      contactsTableBody.appendChild(tr);
    }
  };
    // Configura e renderiza o gráfico de receitas vs despesas
  const setupChart = async () => {
    if (!chartContainer) return;
    
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        return;
      }
      
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = new Date().getMonth();
      
      // Organiza dados por mês
      const revenueData = Array(6).fill(0);
      const expenseData = Array(6).fill(0);
      
      // Últimos 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      
      // Buscar dados da API
      const services = await API.getServices();
      const expenses = await API.getExpenses();
      
      // Processar receitas
      services.forEach(service => {
        const serviceDate = new Date(service.serviceDate);
        if (serviceDate >= sixMonthsAgo) {
          const monthIndex = (serviceDate.getMonth() - (currentMonth - 5) + 12) % 12;
          if (monthIndex >= 0 && monthIndex < 6) {
            revenueData[monthIndex] += parseFloat(service.price) || 0;
          }
        }
      });
      
      // Processar despesas
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.paidAt);
        if (expenseDate >= sixMonthsAgo) {
          const monthIndex = (expenseDate.getMonth() - (currentMonth - 5) + 12) % 12;
          if (monthIndex >= 0 && monthIndex < 6) {
            expenseData[monthIndex] += parseFloat(expense.amount) || 0;
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados para o gráfico:', error);
      // Exibir mensagem de erro no gráfico
      chartContainer.innerHTML = '<p class="error-message">Erro ao carregar dados do gráfico</p>';
      return;
    }
    
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
  const showCustomerDetails = async (customerId) => {
    try {
      // Usar o componente reutilizável se disponível
      if (window.ComponentsModule && typeof window.ComponentsModule.showCustomerDetailsModal === 'function') {
        window.ComponentsModule.showCustomerDetailsModal(customerId);
        return;
      }
      
      // Fallback para implementação própria usando API
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }

      // Buscar dados do cliente
      const customer = await API.getCustomerById(customerId);
      if (!customer) {
        window.showToast('Cliente não encontrado', 'error');
        return;
      }
      
      // Buscar serviços deste cliente
      const customerServices = await API.getServicesByCustomerId(customerId);
      
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
        if (window.ServicesModule && window.ServicesModule.showNewServiceModal) {
          window.ServicesModule.showNewServiceModal(customer.id);
        } else {
          window.showToast('Módulo de serviços não disponível', 'error');
        }
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
    } catch (error) {
      console.error('Erro ao mostrar detalhes do cliente:', error);
      window.showToast('Erro ao mostrar detalhes do cliente', 'error');
    }
  };
    // Exibe detalhes do agendamento
  const showAppointmentDetails = async (appointmentId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar dados da API
      const appointment = await API.getAppointmentById(appointmentId);
      if (!appointment) {
        window.showToast('Agendamento não encontrado', 'error');
        return;
      }
      
      const customer = await API.getCustomerById(appointment.customerId);
      
      // Buscar serviço original se houver
      let originalService = null;
      if (appointment.createdFromServiceId) {
        originalService = await API.getServiceById(appointment.createdFromServiceId);
      }
      
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
            <p><strong>Agendado para:</strong> ${formatDate(appointment.scheduledFor || appointment.scheduledfor)}</p>
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
    } catch (error) {
      console.error('Erro ao carregar detalhes do agendamento:', error);
      window.showToast('Erro ao carregar detalhes do agendamento', 'error');
    }
  };
    // Marca um agendamento como concluído (DONE)
  const markAppointmentAsDone = async (appointmentId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar agendamento atual
      const appointment = await API.getAppointmentById(appointmentId);
      if (!appointment) {
        window.showToast('Agendamento não encontrado', 'error');
        return;
      }
      
      // Atualizar status
      const updatedAppointment = { ...appointment, status: 'DONE' };
      await API.updateAppointment(appointmentId, updatedAppointment);
      
      window.showToast('Agendamento marcado como concluído');
      renderContacts().catch(err => console.error('Erro ao atualizar contatos:', err)); // Atualiza a lista
    } catch (error) {
      console.error('Erro ao marcar agendamento como concluído:', error);
      window.showToast('Erro ao marcar agendamento como concluído', 'error');
    }
  };
  
  // Marca um agendamento como agendado (SCHEDULED)
  const markAppointmentAsScheduled = async (appointmentId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar agendamento atual
      const appointment = await API.getAppointmentById(appointmentId);
      if (!appointment) {
        window.showToast('Agendamento não encontrado', 'error');
        return;
      }
      
      // Atualizar status
      const updatedAppointment = { ...appointment, status: 'SCHEDULED' };
      await API.updateAppointment(appointmentId, updatedAppointment);
      
      window.showToast('Agendamento marcado como agendado');
      renderContacts().catch(err => console.error('Erro ao atualizar contatos:', err)); // Atualiza a lista
    } catch (error) {
      console.error('Erro ao marcar agendamento como agendado:', error);
      window.showToast('Erro ao marcar agendamento como agendado', 'error');
    }
  };
  
  // Marca um agendamento como "cliente não quer mais" (NEVER)
  const markAppointmentAsNever = async (appointmentId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar agendamento atual
      const appointment = await API.getAppointmentById(appointmentId);
      if (!appointment) {
        window.showToast('Agendamento não encontrado', 'error');
        return;
      }
      
      // Atualizar status
      const updatedAppointment = { ...appointment, status: 'NEVER' };
      await API.updateAppointment(appointmentId, updatedAppointment);
      
      window.showToast('Cliente marcado como "não quer mais"', 'warning');
      renderContacts().catch(err => console.error('Erro ao atualizar contatos:', err)); // Atualiza a lista
    } catch (error) {
      console.error('Erro ao marcar agendamento como "não quer mais":', error);
      window.showToast('Erro ao marcar agendamento como "não quer mais"', 'error');
    }
  };
  
  // Reagenda (Prorroga) um contato
  const rescheduleAppointment = async (appointmentId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar agendamento atual
      const appointment = await API.getAppointmentById(appointmentId);
      if (!appointment) {
        window.showToast('Agendamento não encontrado', 'error');
        return;
      }

      // Criar modal de reagendamento    
      const modal = document.createElement('div');
      modal.className = 'modal';
        
      // Extrair data e hora atuais do appointment
      const currentDateTime = new Date(appointment.scheduledFor || appointment.scheduledfor);
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
            <textarea id="notes" class="form-textarea">${appointment.notes || ''}</textarea>
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
          alert('Por favor, selecione uma data');
          return;
        }
        
        try {
          // Atualizar agendamento - combinar data e hora
          const updatedAppointment = { 
            ...appointment, 
            scheduledFor: `${newDate}T${newTime}`, 
            notes
          };
          
          await API.updateAppointment(appointmentId, updatedAppointment);
          window.showToast('Contato prorrogado com sucesso');
          renderContacts().catch(err => console.error('Erro ao atualizar contatos:', err)); // Atualiza a lista
          
          document.body.removeChild(modal);
        } catch (error) {
          console.error('Erro ao prorrogar contato:', error);
          window.showToast('Erro ao prorrogar contato', 'error');
        }
      });
      
      // Fechar ao clicar fora
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    } catch (error) {
      console.error('Erro ao preparar reagendamento:', error);
      window.showToast('Erro ao preparar reagendamento', 'error');
    }
  };
  
  // Marca agendamentos de um cliente como "cliente não quer mais" (NEVER)
  const markCustomerAsNever = async (customerId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar agendamentos pendentes para este cliente
      const pendingAppointments = await API.getPendingAppointmentsByCustomerId(customerId);
      
      if (pendingAppointments && pendingAppointments.length > 0) {
        // Atualizar cada agendamento pendente
        const updatePromises = pendingAppointments.map(appointment => {
          const updatedAppointment = { ...appointment, status: 'NEVER' };
          return API.updateAppointment(appointment.id, updatedAppointment);
        });
        
        await Promise.all(updatePromises);
        window.showToast('Cliente marcado como "não tem interesse"', 'warning');
        renderContacts().catch(err => console.error('Erro ao atualizar contatos:', err)); // Atualiza a lista
      } else {
        window.showToast('Cliente não possui agendamentos pendentes', 'info');
      }
    } catch (error) {
      console.error('Erro ao marcar cliente como "não tem interesse":', error);
      window.showToast('Erro ao marcar cliente como "não tem interesse"', 'error');
    }
  };
  
  // Reagenda (Prorroga) contato para um cliente
  const rescheduleCustomerAppointment = async (customerId) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar agendamentos pendentes para este cliente
      const pendingAppointments = await API.getPendingAppointmentsByCustomerId(customerId);
      
      if (!pendingAppointments || pendingAppointments.length === 0) {
        // Se não há agendamentos pendentes, criar um novo
        const customer = await API.getCustomerById(customerId);
        if (!customer) {
          window.showToast('Cliente não encontrado', 'error');
          return;
        }
        
        // Modal para nova data
        showRescheduleModal(null, customerId);
      } else {
        // Se há agendamentos pendentes, reagendar o primeiro
        showRescheduleModal(pendingAppointments[0].id);
      }
    } catch (error) {
      console.error('Erro ao reagendar contato:', error);
      window.showToast('Erro ao reagendar contato', 'error');
    }
  };
  
  // Mostra modal para reagendar contato
  const showRescheduleModal = async (appointmentId, customerId = null) => {
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      let appointment = null;
      let customer = null;
      
      if (appointmentId) {
        appointment = await API.getAppointmentById(appointmentId);
        if (!appointment) {
          window.showToast('Agendamento não encontrado', 'error');
          return;
        }
        customer = await API.getCustomerById(appointment.customerId);
      } else if (customerId) {
        customer = await API.getCustomerById(customerId);
      }
      
      if (!customer) {
        window.showToast('Cliente não encontrado', 'error');
        return;
      }
      
      // Valores default para data/hora
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const currentDate = appointment ? 
        new Date(appointment.scheduledFor || appointment.scheduledfor).toISOString().split('T')[0] : 
        nextMonth.toISOString().split('T')[0];
      
      const currentTime = appointment ? 
        new Date(appointment.scheduledFor || appointment.scheduledfor).toTimeString().substring(0, 5) : 
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
            <textarea id="notes" class="form-textarea">${appointment ? appointment.notes || '' : 'Contato prorrogado'}</textarea>
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
          alert('Por favor, selecione uma data');
          return;
        }
        
        try {
          if (appointment) {
            // Atualizar agendamento existente
            const updatedAppointment = {
              ...appointment,
              scheduledFor: `${newDate}T${newTime}`,
              notes: notes
            };
            
            await API.updateAppointment(appointment.id, updatedAppointment);
            window.showToast('Contato prorrogado com sucesso');
          } else {
            // Criar novo agendamento
            const newAppointment = {
              customerId: customerId,
              scheduledFor: `${newDate}T${newTime}`,
              createdFromServiceId: null,
              status: 'PENDING',
              notes: notes
            };
            
            await API.createAppointment(newAppointment);
            window.showToast('Novo contato agendado com sucesso');
          }
          
          renderContacts().catch(err => console.error('Erro ao atualizar contatos:', err)); // Atualiza a lista
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
    } catch (error) {
      console.error('Erro ao mostrar modal de reagendamento:', error);
      window.showToast('Erro ao preparar reagendamento', 'error');
    }
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
  const renderNotificationBadge = async () => {
    const header = document.querySelector('.header__actions');
    if (!header) return;
    
    // Criar ou encontrar o badge
    let badge = document.querySelector('.notification-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.title = 'Notificações pendentes de recontato';
      header.appendChild(badge);
    }
    
    try {
      // Verificar se a API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        return;
      }
      
      // Buscar agendamentos da API
      const appointments = await API.getAppointments();
      
      // Definir datas para comparação
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ahead = 7; // Dias para notificar à frente
      
      // Calcular data limite
      const limit = new Date(today);
      limit.setDate(today.getDate() + ahead);
      
      // Contar agendamentos pendentes que estão atrasados ou dentro do período
      const pending = appointments.filter(a => {
        // Normalizar datas (campo pode estar como scheduledFor ou scheduledfor)
        const scheduledDate = new Date(a.scheduledFor || a.scheduledfor);
        return a.status === 'PENDING' && scheduledDate <= limit;
      }).length;
      
      // Atualizar o badge
      badge.textContent = pending > 0 ? pending : '';
      badge.style.display = pending > 0 ? 'inline-block' : 'none';
      
    } catch (error) {
      console.error('Erro ao buscar dados para badge de notificações:', error);
      // Em caso de erro, esconder o badge
      badge.style.display = 'none';
    }
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
