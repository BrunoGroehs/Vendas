// Services module - Gerencia vendas/serviços e agendamentos
// Atualizado para usar API ao invés de mockDB
const ServicesModule = (() => {  // Garantir que temos acesso ao objeto API ou fallback para mock
  const API = window.API || {};
  
  // Variáveis para armazenar dados carregados da API
  let customers = [];
  let services = [];
  let appointments = [];
  let users = [];
  let settings = { defaultCommissionPct: 10 };
  
  // Se temos mockDB mas não temos API, alertar sobre a necessidade de migração
  if (window.mockDB && !window.API) {
    console.warn('AVISO: mockDB está presente, mas API não está disponível. A aplicação está configurada para usar API.');
  }
  
  // Formatação de datas
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    // Verifica se a data tem informação de hora (formato com T)
    if (dateStr.includes('T')) {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR');
  };
    // Carrega um template HTML de um arquivo
  const loadTemplate = async (templatePath) => {
    try {
      // Tente carregar o template no caminho fornecido
      try {
        const response = await fetch(templatePath);
        if (response.ok) {
          return await response.text();
        }
      } catch (e) {
        console.warn(`Não foi possível carregar template de ${templatePath}`, e);
      }
      
      // Tente caminhos alternativos se o primeiro falhar
      const alternatePaths = [
        templatePath,
        `../${templatePath}`, 
        templatePath.startsWith('../') ? templatePath.substring(3) : templatePath,
        templatePath.startsWith('/') ? templatePath : `/${templatePath}`,
        `/TesteGPT/${templatePath.replace(/^\/|^\.\.\//g, '')}`,
        `components/${templatePath.replace(/^.*\/components\//g, '')}`
      ];
      
      for (const path of alternatePaths) {
        try {
          console.log(`Tentando carregar template de caminho alternativo: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            return await response.text();
          }
        } catch (e) {
          console.warn(`Falha ao carregar de caminho alternativo: ${path}`, e);
        }
      }
      
      throw new Error(`Não foi possível carregar o template de nenhum caminho: ${templatePath}`);
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      return null;
    }
  };
    // Inicialização
  const init = async () => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.warn('API não está disponível. Carregando api.js...');
        // Tentar carregar o módulo API dinamicamente
        await loadAPIModule();
      }
      
      // Se ainda não temos API após a tentativa de carregamento, usamos dados vazios
      if (!window.API) {
        console.error('API não pôde ser carregada. Usando dados vazios.');
        // Verificar se estamos na página de vendas
        const isVendasPage = window.location.pathname.includes('vendas.html');
        if (isVendasPage) {
          setupVendasPage();
        }
        return;
      }
      
      // Carregar dados via API
      customers = await window.API.getCustomers();
      services = await window.API.getServices();
      appointments = await window.API.getAppointments();
      users = await window.API.getUsers();
      
      // Buscar configurações
      const settingsData = await window.API.getSettings();
      if (settingsData) {
        settings = settingsData;
      }
      
      // Verificar se estamos na página de vendas
      const isVendasPage = window.location.pathname.includes('vendas.html');
      if (isVendasPage) {
        setupVendasPage();
      }
    } catch (error) {
      console.error('Erro ao inicializar ServicesModule:', error);
    }
  };
    // Função auxiliar para carregar o módulo API caso não esteja disponível
  const loadAPIModule = () => {
    return new Promise((resolve, reject) => {
      if (window.API) {
        resolve(window.API);
        return;
      }
      
      // Se temos mockDB, criar API mock básica
      if (window.mockDB) {
        console.warn('Criando API mock a partir de mockDB para compatibilidade');
        window.API = {
          getCustomers: () => Promise.resolve(window.mockDB.customers || []),
          getServices: () => Promise.resolve(window.mockDB.services || []),
          getAppointments: () => Promise.resolve(window.mockDB.appointments || []),
          getUsers: () => Promise.resolve(window.mockDB.users || []),
          getSettings: () => Promise.resolve(window.mockDB.settings || { defaultCommissionPct: 10 }),
          getCustomerById: (id) => Promise.resolve(window.mockDB.customers?.find(c => c.id === id)),
          getUserById: (id) => Promise.resolve(window.mockDB.users?.find(u => u.id === id)),
          getServiceById: (id) => Promise.resolve(window.mockDB.services?.find(s => s.id === id)),
          getAppointmentById: (id) => Promise.resolve(window.mockDB.appointments?.find(a => a.id === id)),
          createService: (data) => {
            const newId = window.mockDB.services ? Math.max(...window.mockDB.services.map(s => s.id)) + 1 : 1;
            const newService = { ...data, id: newId };
            if (window.mockDB.services) window.mockDB.services.push(newService);
            return Promise.resolve(newService);
          },
          createAppointment: (data) => {
            const newId = window.mockDB.appointments ? Math.max(...window.mockDB.appointments.map(a => a.id)) + 1 : 1;
            const newAppointment = { ...data, id: newId };
            if (window.mockDB.appointments) window.mockDB.appointments.push(newAppointment);
            return Promise.resolve(newAppointment);
          }
        };
        resolve(window.API);
        return;
      }
      
      // Tentar carregar o módulo API
      const script = document.createElement('script');
      script.src = '../js/modules/api.js';
      script.onload = () => {
        if (window.API) {
          resolve(window.API);
        } else {
          reject(new Error('API não pôde ser carregada'));
        }
      };
      script.onerror = () => reject(new Error('Erro ao carregar script da API'));
      document.head.appendChild(script);
    });
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
  const addNewService = async (serviceData) => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        showToast('Erro ao conectar com a API', 'error');
        return null;
      }
      
      // Ensure serviceDate includes time information
      let serviceDateTime = serviceData.serviceDate;
      if (!serviceDateTime.includes('T') && serviceData.scheduledTime) {
        serviceDateTime = `${serviceDateTime}T${serviceData.scheduledTime}`;
      }
      
      // Prepare service data for API
      const newServiceData = {
        customerId: serviceData.customerId,
        employeeId: serviceData.employeeId,
        serviceDate: serviceDateTime,
        price: serviceData.price,
        commissionPct: serviceData.commissionPct || settings.defaultCommissionPct,
        notes: serviceData.notes
      };
      
      // Create service using API
      const newService = await window.API.createService(newServiceData);
      
      // Criar agendamento para o próximo ano
      const nextYear = new Date(serviceData.serviceDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      // Mantém o horário se foi especificado, senão usa 09:00 como padrão
      const scheduledTime = serviceData.scheduledTime || '09:00';
      
      // Usar a data correta garantindo que não há problemas de fuso horário
      const nextYearStr = nextYear.toISOString().split('T')[0];
      
      const newAppointmentData = {
        customerId: serviceData.customerId,
        scheduledFor: `${nextYearStr}T${scheduledTime}`,
        createdFromServiceId: newService.id,
        status: 'PENDING',
        notes: `Limpeza anual a partir do serviço de ${new Date(serviceData.serviceDate).toLocaleDateString('pt-BR')}`
      };
        // Create appointment using API
      const newAppointment = await window.API.createAppointment(newAppointmentData);
      
      // Update local cache
      services.push(newService);
      appointments.push(newAppointment);
      
      return {
        service: newService,
        appointment: newAppointment
      };
    } catch (error) {
      console.error('Erro ao cadastrar novo serviço:', error);
      showToast('Erro ao registrar venda', 'error');
      return null;
    }
  };

  // Exibe modal para cadastro de novo serviço
  const showNewServiceModal = async (preSelectedCustomerId = null) => {
    try {
      // Carregar template HTML - tentar vários caminhos possíveis
      let templateHtml = await loadTemplate('../components/modal-new-service.html');
      if (!templateHtml) {
        console.log('Tentando caminho alternativo para o template...');
        templateHtml = await loadTemplate('components/modal-new-service.html');
        
        if (!templateHtml) {
          alert('Erro: Não foi possível carregar o template');
          return;
        }
      }
        // Verificar se API está disponível
      if (!window.API) {
        await loadAPIModule();
        if (!window.API) {
          alert('API não está disponível. Não é possível adicionar novo serviço.');
          return;
        }
      }
      
      // Obter dados necessários da API se ainda não estiverem em cache
      if (customers.length === 0) {
        customers = await window.API.getCustomers();
      }
      if (users.length === 0) {
        users = await window.API.getUsers();
      }
      if (!settings || Object.keys(settings).length === 0) {
        const settingsData = await window.API.getSettings();
        if (settingsData) settings = settingsData;
      }
      
      // Criar modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      // Lista de clientes para seleção
      const customersOptions = customers
        .map(c => `<option value="${c.id}" ${c.id === preSelectedCustomerId ? 'selected' : ''}>${c.name}</option>`)
        .join('');
        
      // Lista de funcionários para seleção
      const employeesOptions = users
        .filter(u => u.role === 'OPERATOR')
        .map(e => `<option value="${e.id}">${e.name}</option>`)
        .join('');
        
      // Data de hoje formatada para o input
      const today = new Date().toISOString().split('T')[0];
      
      // Substituir placeholders no template
      templateHtml = templateHtml
        .replace('{{CUSTOMERS_OPTIONS}}', customersOptions)
        .replace('{{EMPLOYEES_OPTIONS}}', employeesOptions)
        .replace('{{TODAY}}', today)
        .replace('{{DEFAULT_COMMISSION}}', settings.defaultCommissionPct || 10);
      
      // Aplicar template ao modal
      modal.innerHTML = templateHtml;
      
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
        const customer = customers.find(c => c.id === customerId);
        const serviceDate = modal.querySelector('#serviceDate').value;
        const scheduledTime = modal.querySelector('#scheduledTime').value || "09:00";
        const price = parseFloat(modal.querySelector('#price').value) || 0;
        const employeeId = parseInt(modal.querySelector('#employee').value);
        const employee = users.find(u => u.id === employeeId);
        
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
      const saveService = async () => {
        try {
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
          
          // Adicionar no banco de dados via API
          const result = await addNewService(serviceData);
          
          if (result) {
            // Disparar evento para notificar que um serviço foi adicionado
            const event = new CustomEvent('serviceAdded', { detail: result });
            document.dispatchEvent(event);
            
            // Se estamos na página dashboard, atualizar
            if (typeof window.DashboardModule !== 'undefined') {
              window.DashboardModule.renderMetrics();
              window.DashboardModule.renderContacts();
            }
            
            // Formatar data de próximo contato
            let formattedAppointmentDate = formatDate(result.appointment.scheduledFor);
            
            showToast(`Venda registrada com sucesso. Próximo contato agendado para ${formattedAppointmentDate}`);
          } else {
            showToast('Erro ao registrar venda', 'error');
          }
          
          // Fechar modal
          closeModal();
        } catch (error) {
          console.error('Erro ao salvar serviço:', error);
          showToast('Erro ao registrar venda', 'error');
        }
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
    } catch (error) {
      console.error('Erro ao exibir modal de novo serviço:', error);
      showToast('Erro ao carregar formulário de novo serviço', 'error');
    }
  };
  
  // Renderizar tabela de serviços (para página de vendas)
  const renderServicesTable = async () => {
    try {
      const tableBody = document.querySelector('.services-table tbody');
      if (!tableBody) return;
        // Verificar se API está disponível
      if (!window.API) {
        await loadAPIModule();
        if (!window.API) {
          tableBody.innerHTML = '<tr><td colspan="6">API não disponível. Não foi possível carregar os serviços.</td></tr>';
          return;
        }
      }
      
      // Obter serviços da API se não estiverem em cache
      if (services.length === 0) {
        services = await window.API.getServices();
      }
      
      // Limpar tabela
      tableBody.innerHTML = '';
      
      // Ordenar serviços por data (mais recentes primeiro)
      const sortedServices = [...services].sort((a, b) => 
        new Date(b.serviceDate) - new Date(a.serviceDate)
      );
        // Renderizar cada serviço
      for (const service of sortedServices) {
        let customer, employee;
        
        // Buscar cliente e funcionário (da cache ou API)
        if (customers.length > 0) {
          customer = customers.find(c => c.id === service.customerId);
        } else if (window.API) {
          customer = await window.API.getCustomerById(service.customerId);
        }
        
        if (users.length > 0) {
          employee = users.find(u => u.id === service.employeeId);
        } else if (window.API) {
          employee = await window.API.getUserById(service.employeeId);
        }
        
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
      }
    } catch (error) {
      console.error('Erro ao renderizar tabela de serviços:', error);
      showToast('Erro ao carregar serviços', 'error');
    }
  };
  
  // Exibir detalhes de um serviço
  const showServiceDetails = async (serviceId) => {
    try {
      // Buscar serviço na API ou cache
      let service;
      if (services.length > 0) {
        service = services.find(s => s.id === serviceId);
      }
        // Verificar se API está disponível
      if (!window.API && !service) {
        await loadAPIModule();
        if (!window.API) {
          showToast('API não está disponível. Não é possível carregar detalhes do serviço.', 'error');
          return;
        }
      }
      
      if (!service && window.API) {
        service = await window.API.getServiceById(serviceId);
      }
      
      if (!service) {
        showToast('Serviço não encontrado', 'error');
        return;
      }
      
      // Buscar cliente e funcionário
      let customer, employee;
      
      if (customers.length > 0) {
        customer = customers.find(c => c.id === service.customerId);
      } else if (window.API) {
        customer = await window.API.getCustomerById(service.customerId);
      }
      
      if (users.length > 0) {
        employee = users.find(u => u.id === service.employeeId);
      } else if (window.API) {
        employee = await window.API.getUserById(service.employeeId);
      }
      
      // Verificar se existe agendamento relacionado
      let relatedAppointment;
      
      if (appointments.length > 0) {
        relatedAppointment = appointments.find(a => a.createdFromServiceId === serviceId);
      } else if (window.API) {
        const allAppointments = await window.API.getAppointments();
        relatedAppointment = allAppointments.find(a => a.createdFromServiceId === serviceId);
      }
      
      // Carregar template HTML
      let templateHtml = await loadTemplate('../components/modal-service-details.html');
      if (!templateHtml) {
        alert('Erro: Não foi possível carregar o template');
        return;
      }
      
      // Criar modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      // Calcular valor da comissão
      const commissionValue = ((service.price * service.commissionPct) / 100).toFixed(2);
      
      // Preparar HTML para agendamento relacionado, se existir
      const relatedAppointmentHtml = relatedAppointment ? `
        <div class="related-appointment">
          <h3>Agendamento Relacionado</h3>
          <p><strong>Data agendada:</strong> ${formatDate(relatedAppointment.scheduledFor)}</p>
          <p><strong>Status:</strong> ${relatedAppointment.status === 'PENDING' ? 'Pendente' : 'Concluído'}</p>
          <p><strong>Observações:</strong> ${relatedAppointment.notes || 'Nenhuma observação'}</p>
        </div>
      ` : '';
      
      // Substituir placeholders no template
      templateHtml = templateHtml
        .replace('{{CUSTOMER_NAME}}', customer ? customer.name : 'Cliente não encontrado')
        .replace('{{SERVICE_DATE}}', formatDate(service.serviceDate))
        .replace('{{SERVICE_PRICE}}', service.price.toFixed(2))
        .replace('{{EMPLOYEE_NAME}}', employee ? employee.name : 'Funcionário não encontrado')
        .replace('{{COMMISSION_VALUE}}', commissionValue)
        .replace('{{COMMISSION_PCT}}', service.commissionPct)
        .replace('{{NOTES}}', service.notes || 'Nenhuma observação')
        .replace('{{RELATED_APPOINTMENT}}', relatedAppointmentHtml);
      
      // Aplicar template ao modal
      modal.innerHTML = templateHtml;
      
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
    } catch (error) {
      console.error('Erro ao exibir detalhes do serviço:', error);
      showToast('Erro ao carregar detalhes do serviço', 'error');
    }
  };
  
  // Exibe uma mensagem toast
  const showToast = (message, type = 'success') => {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
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
    }
  };
  
  // Retornar API pública do módulo
  return {
    init,
    showNewServiceModal,
    addNewService,
    renderServicesTable,
    showServiceDetails
  };
})();

// Expor globalmente
window.ServicesModule = ServicesModule;
