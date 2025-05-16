// filepath: c:\Users\I753372\Desktop\projetos\TesteGPT\js\modules\services.js
// Services module - Gerencia vendas/serviços e agendamentos
const ServicesModule = (() => {
  // Formatação de datas
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    // Verifica se a data tem informação de hora (formato com T)
    if (dateStr.includes('T')) {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR');
  };
  
  // Inicialização
  const init = () => {
    // Verificar se estamos na página de vendas
    const isVendasPage = window.location.pathname.includes('vendas.html');
    if (isVendasPage) {
      setupVendasPage();
    }
  };

  // Configuração da página de vendas
  const setupVendasPage = () => {
    const newServiceBtn = document.querySelector('.btn--new-service');
    if (newServiceBtn) {
      newServiceBtn.addEventListener('click', () => showNewServiceModal());
    }

    // Renderizar tabela de serviços
    renderServicesTable();
  };

  // Cadastra uma nova venda com agendamento futuro
  const addNewService = (serviceData) => {
    // Obter banco de dados mockado
    const db = window.mockDB;
    if (!db) return false;

    // Adicionar novo serviço
    const newServiceId = db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1;
      // Ensure serviceDate includes time information
    let serviceDateTime = serviceData.serviceDate;
    if (!serviceDateTime.includes('T') && serviceData.scheduledTime) {
      serviceDateTime = `${serviceDateTime}T${serviceData.scheduledTime}`;
    }
    
    const newService = {
      id: newServiceId,
      customerId: serviceData.customerId,
      employeeId: serviceData.employeeId,
      serviceDate: serviceDateTime,
      price: serviceData.price,
      commissionPct: serviceData.commissionPct || db.settings.defaultCommissionPct,
      notes: serviceData.notes
    };
    
    db.services.push(newService);      // Criar agendamento para o próximo ano
    const nextYear = new Date(serviceData.serviceDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    // Mantém o horário se foi especificado, senão usa 09:00 como padrão
    const scheduledTime = serviceData.scheduledTime || '09:00';
    
    const newAppointmentId = db.appointments.length > 0 ? 
      Math.max(...db.appointments.map(a => a.id)) + 1 : 1;
    
    // Usar a data correta garantindo que não há problemas de fuso horário
    const nextYearStr = nextYear.toISOString().split('T')[0];
    
    const newAppointment = {
      id: newAppointmentId,
      customerId: serviceData.customerId,
      scheduledFor: `${nextYearStr}T${scheduledTime}`,
      createdFromServiceId: newServiceId,
      status: 'PENDING',
      notes: `Limpeza anual a partir do serviço de ${new Date(serviceData.serviceDate).toLocaleDateString('pt-BR')}`
    };
    
    db.appointments.push(newAppointment);
    
    return {
      service: newService,
      appointment: newAppointment
    };
  };

  // Exibe modal para cadastro de novo serviço
  const showNewServiceModal = (preSelectedCustomerId = null) => {
    const db = window.mockDB;
    if (!db) {
      alert('Erro: Banco de dados não disponível');
      return;
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Lista de clientes para seleção
    const customersOptions = db.customers
      .map(c => `<option value="${c.id}" ${c.id === preSelectedCustomerId ? 'selected' : ''}>${c.name}</option>`)
      .join('');
      
    // Lista de funcionários para seleção
    const employeesOptions = db.users
      .filter(u => u.role === 'OPERATOR')
      .map(e => `<option value="${e.id}">${e.name}</option>`)
      .join('');
      
    // Data de hoje formatada para o input
    const today = new Date().toISOString().split('T')[0];
    
    // Conteúdo do modal - formulário em 3 etapas (wizard)
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Nova Venda</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <div class="wizard">
            <div class="wizard__steps">
              <div class="wizard__step active" data-step="1">1. Cliente</div>
              <div class="wizard__step" data-step="2">2. Serviço</div>
              <div class="wizard__step" data-step="3">3. Confirmação</div>
            </div>
            
            <div class="wizard__content">
              <!-- Step 1: Selecionar cliente -->
              <div class="wizard__panel active" data-panel="1">
                <div class="form-group">
                  <label for="customer">Cliente:</label>
                  <select id="customer" class="form-select">
                    <option value="">Selecione um cliente</option>
                    ${customersOptions}
                  </select>
                </div>
                <div class="form-actions">
                  <button class="btn btn--primary" id="nextToStep2">Próximo</button>
                  <button class="btn" id="cancelWizard">Cancelar</button>
                </div>
              </div>
              
              <!-- Step 2: Detalhes do serviço -->              <div class="wizard__panel" data-panel="2">
                <div class="form-group">
                  <label for="serviceDate">Data:</label>
                  <input type="date" id="serviceDate" class="form-input" value="${today}">
                </div>
                <div class="form-group">
                  <label for="scheduledTime">Horário agendado:</label>
                  <input type="time" id="scheduledTime" class="form-input" value="09:00">
                </div>
                <div class="form-group">
                  <label for="price">Valor (R$):</label>
                  <input type="number" id="price" class="form-input" min="0" step="0.01">
                </div>
                <div class="form-group">
                  <label for="employee">Funcionário responsável:</label>
                  <select id="employee" class="form-select">
                    ${employeesOptions}
                  </select>
                </div>
                <div class="form-group">
                  <label for="commissionPct">Comissão (%):</label>
                  <input type="number" id="commissionPct" class="form-input" value="${db.settings.defaultCommissionPct}" min="0" max="100">
                </div>
                <div class="form-group">
                  <label for="notes">Observações:</label>
                  <textarea id="notes" class="form-textarea"></textarea>
                </div>
                <div class="form-actions">
                  <button class="btn" id="backToStep1">Voltar</button>
                  <button class="btn btn--primary" id="nextToStep3">Próximo</button>
                </div>
              </div>
              
              <!-- Step 3: Confirmação e agendamento -->
              <div class="wizard__panel" data-panel="3">
                <h3>Resumo do Serviço</h3>
                <div id="serviceSummary" class="summary"></div>
                
                <h3>Próximo Contato</h3>
                <p>Um recontato será agendado automaticamente para 1 ano após este serviço.</p>
                <div id="appointmentSummary" class="summary"></div>
                
                <div class="form-actions">
                  <button class="btn" id="backToStep2">Voltar</button>
                  <button class="btn btn--primary" id="saveService">Finalizar e Salvar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar modal ao DOM
    document.body.appendChild(modal);
    
    // Cache de elementos do DOM para manipulação
    const steps = modal.querySelectorAll('.wizard__step');
    const panels = modal.querySelectorAll('.wizard__panel');
    
    // Eventos dos botões de navegação
    const closeBtn = modal.querySelector('.modal__close');
    const cancelBtn = modal.querySelector('#cancelWizard');
    const nextToStep2Btn = modal.querySelector('#nextToStep2');
    const backToStep1Btn = modal.querySelector('#backToStep1');
    const nextToStep3Btn = modal.querySelector('#nextToStep3');
    const backToStep2Btn = modal.querySelector('#backToStep2');
    const saveBtn = modal.querySelector('#saveService');
    
    // Fechar modal
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    // Navegação entre etapas do wizard
    const goToStep = (stepNumber) => {
      // Atualizar indicadores de etapas
      steps.forEach(step => {
        if (parseInt(step.dataset.step) <= stepNumber) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });
      
      // Mostrar painel atual
      panels.forEach(panel => {
        if (parseInt(panel.dataset.panel) === stepNumber) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
      
      // Se for última etapa, gerar resumo
      if (stepNumber === 3) {
        generateSummary();
      }
    };
      // Gerar resumo para confirmação
    const generateSummary = () => {
      const customerId = parseInt(modal.querySelector('#customer').value);      
      const customer = db.customers.find(c => c.id === customerId);
      const serviceDate = modal.querySelector('#serviceDate').value;
      const scheduledTime = modal.querySelector('#scheduledTime').value || "09:00";
      const price = parseFloat(modal.querySelector('#price').value) || 0;
      const employeeId = parseInt(modal.querySelector('#employee').value);
      const employee = db.users.find(u => u.id === employeeId);
      
      // Criar objeto de data sem alterar dia por causa do fuso horário
      const dateParts = serviceDate.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${scheduledTime}`;
      
      // Calcular próximo contato (1 ano depois)
      const nextYear = new Date(serviceDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      // Formatar próxima data usando mesma lógica para evitar problemas de fuso horário
      const nextYearParts = nextYear.toISOString().split('T')[0].split('-');
      const nextContactDate = `${nextYearParts[2]}/${nextYearParts[1]}/${nextYearParts[0]} ${scheduledTime}`;
      
      // Resumo do serviço atual
      const serviceSummary = `
        <p><strong>Cliente:</strong> ${customer ? customer.name : 'Não selecionado'}</p>
        <p><strong>Data e hora:</strong> ${formattedDate}</p>
        <p><strong>Valor:</strong> R$ ${price.toFixed(2)}</p>
        <p><strong>Funcionário:</strong> ${employee ? employee.name : 'Não selecionado'}</p>
      `;
      
      // Resumo do agendamento futuro
      const appointmentSummary = `
        <p><strong>Cliente:</strong> ${customer ? customer.name : 'Não selecionado'}</p>
        <p><strong>Data agendada:</strong> ${nextContactDate}</p>
        <p><strong>Status:</strong> Pendente</p>
      `;
      
      // Atualizar no DOM
      modal.querySelector('#serviceSummary').innerHTML = serviceSummary;
      modal.querySelector('#appointmentSummary').innerHTML = appointmentSummary;
    };
    
    // Validar formulário da etapa 1
    const validateStep1 = () => {
      const customerId = modal.querySelector('#customer').value;
      if (!customerId) {
        alert('Por favor, selecione um cliente');
        return false;
      }
      return true;
    };
    
    // Validar formulário da etapa 2
    const validateStep2 = () => {
      const serviceDate = modal.querySelector('#serviceDate').value;
      const price = modal.querySelector('#price').value;
      const employeeId = modal.querySelector('#employee').value;
      
      if (!serviceDate) {
        alert('Por favor, selecione uma data');
        return false;
      }
      
      if (!price || price <= 0) {
        alert('Por favor, informe um valor válido');
        return false;
      }
      
      if (!employeeId) {
        alert('Por favor, selecione um funcionário');
        return false;
      }
      
      return true;
    };
      // Salvar serviço
    const saveService = () => {
      // Coletar dados do formulário
      const customerId = parseInt(modal.querySelector('#customer').value);
      const serviceDate = modal.querySelector('#serviceDate').value;
      const scheduledTime = modal.querySelector('#scheduledTime').value;
      const price = parseFloat(modal.querySelector('#price').value);
      const employeeId = parseInt(modal.querySelector('#employee').value);
      const commissionPct = parseInt(modal.querySelector('#commissionPct').value);
      const notes = modal.querySelector('#notes').value;
      
      // Criar objeto com dados do serviço
      const serviceData = {
        customerId,
        serviceDate,
        scheduledTime,
        price,
        employeeId,
        commissionPct,
        notes
      };
      
      // Adicionar no banco de dados
      const result = addNewService(serviceData);      if (result) {
        // Disparar evento para notificar que um serviço foi adicionado
        const event = new CustomEvent('serviceAdded', { detail: result });
        document.dispatchEvent(event);
        
        // Se estamos na página dashboard, atualizar
        if (typeof window.DashboardModule !== 'undefined') {
          window.DashboardModule.renderMetrics();
          window.DashboardModule.renderContacts();
        }
        
        // Formatar data de próximo contato usando método correto para evitar problemas de fuso horário
        let appointmentDate = new Date(result.appointment.scheduledFor);
        // Garantir que estamos usando a data correta, não a do fuso horário
        let formattedAppointmentDate = formatDate(result.appointment.scheduledFor);
        
        showToast(`Venda registrada com sucesso. Próximo contato agendado para ${formattedAppointmentDate}`);
      } else {
        showToast('Erro ao registrar venda', 'error');
      }
      
      // Fechar modal
      closeModal();
    };
    
    // Event listeners
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    nextToStep2Btn.addEventListener('click', () => {
      if (validateStep1()) {
        goToStep(2);
      }
    });
    
    backToStep1Btn.addEventListener('click', () => {
      goToStep(1);
    });
    
    nextToStep3Btn.addEventListener('click', () => {
      if (validateStep2()) {
        goToStep(3);
      }
    });
    
    backToStep2Btn.addEventListener('click', () => {
      goToStep(2);
    });
    
    saveBtn.addEventListener('click', saveService);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Se um cliente já estiver selecionado, ir para a etapa 2
    if (preSelectedCustomerId) {
      setTimeout(() => {
        if (validateStep1()) {
          goToStep(2);
        }
      }, 100);
    }
  };
  
  // Renderizar tabela de serviços (para página de vendas)
  const renderServicesTable = () => {
    const tableBody = document.querySelector('.services-table tbody');
    if (!tableBody) return;
    
    const db = window.mockDB;
    if (!db) return;
    
    // Limpar tabela
    tableBody.innerHTML = '';
    
    // Ordenar serviços por data (mais recentes primeiro)
    const sortedServices = [...db.services].sort((a, b) => 
      new Date(b.serviceDate) - new Date(a.serviceDate)
    );
    
    // Renderizar cada serviço
    sortedServices.forEach(service => {
      const customer = db.customers.find(c => c.id === service.customerId);
      const employee = db.users.find(u => u.id === service.employeeId);
      
      const tr = document.createElement('tr');
        // Formatação de data com hora usando a função formatDate
      const serviceDate = formatDate(service.serviceDate);
      
      // Cálculo da comissão
      const commission = (service.price * service.commissionPct) / 100;
      
      tr.innerHTML = `
        <td>${customer ? customer.name : 'Cliente não encontrado'}</td>
        <td>${serviceDate}</td>
        <td>R$ ${service.price.toFixed(2)}</td>
        <td>${employee ? employee.name : 'Funcionário não encontrado'}</td>
        <td>R$ ${commission.toFixed(2)} (${service.commissionPct}%)</td>
        <td>
          <button class="btn btn--small btn--details" data-service-id="${service.id}">Detalhes</button>
        </td>
      `;
      
      // Adicionar evento para botão de detalhes
      const detailsBtn = tr.querySelector('.btn--details');
      detailsBtn.addEventListener('click', () => {
        showServiceDetails(service.id);
      });
      
      tableBody.appendChild(tr);
    });
  };
  
  // Exibir detalhes de um serviço
  const showServiceDetails = (serviceId) => {
    const db = window.mockDB;
    if (!db) return;
    
    const service = db.services.find(s => s.id === serviceId);
    if (!service) return;
    
    const customer = db.customers.find(c => c.id === service.customerId);
    const employee = db.users.find(u => u.id === service.employeeId);
    
    // Verificar se existe agendamento relacionado
    const relatedAppointment = db.appointments.find(a => a.createdFromServiceId === serviceId);
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Detalhes do Serviço</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <div class="service-details">
            <p><strong>Cliente:</strong> ${customer ? customer.name : 'Cliente não encontrado'}</p>
            <p><strong>Data:</strong> ${new Date(service.serviceDate).toLocaleDateString('pt-BR')}</p>
            <p><strong>Valor:</strong> R$ ${service.price.toFixed(2)}</p>
            <p><strong>Funcionário:</strong> ${employee ? employee.name : 'Funcionário não encontrado'}</p>
            <p><strong>Comissão:</strong> R$ ${((service.price * service.commissionPct) / 100).toFixed(2)} (${service.commissionPct}%)</p>
            <p><strong>Observações:</strong> ${service.notes || 'Nenhuma observação'}</p>
            
            ${relatedAppointment ? `
              <div class="related-appointment">
                <h3>Agendamento Relacionado</h3>
                <p><strong>Data agendada:</strong> ${new Date(relatedAppointment.scheduledFor).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> ${relatedAppointment.status === 'PENDING' ? 'Pendente' : 'Concluído'}</p>
                <p><strong>Observações:</strong> ${relatedAppointment.notes || 'Nenhuma observação'}</p>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn" id="closeModalBtn">Fechar</button>
        </div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
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
  
  // Retornar API pública do módulo
  return {
    init,
    showNewServiceModal,
    addNewService,
    renderServicesTable
  };
})();

// Expor globalmente
window.ServicesModule = ServicesModule;
