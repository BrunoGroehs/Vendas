// Services module - Gerencia vendas/serviços e agendamentos
// Este módulo foi refatorado para utilizar a API em vez de mockDB
// Mantendo compatibilidade com a estrutura existente
const ServicesModule = (() => {
  // Variáveis para armazenar dados carregados da API
  let customers = [];
  let services = [];
  let appointments = [];
  let users = [];
  let settings = { defaultCommissionPct: 10 };
  
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
        `/TesteGPT/${templatePath.replace(/^\/|^\.\.\//g, '')}`
      ];
      
      for (const path of alternatePaths) {
        try {
          console.log(`Tentando carregar template de: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            return await response.text();
          }
        } catch (e) {
          console.warn(`Não foi possível carregar template de caminho alternativo: ${path}`, e);
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
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
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
  // Cadastra uma nova venda com agendamento futuro
  const addNewService = async () => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return null;
      }
      
      // Obter clientes da API
      const customers = await window.API.getCustomers();
      
      // Simulamos um dropdown com prompt
      let customerOptions = customers.map(c => `${c.id}: ${c.name}`).join('\n');
      const customerId = parseInt(prompt(`Selecione o cliente:\n${customerOptions}`));
      
      if (isNaN(customerId)) {
        alert('Cliente inválido. Operação cancelada.');
        return;
      }
      
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        alert('Cliente não encontrado. Operação cancelada.');
        return;
      }
      
      // Dados do serviço
      const price = parseFloat(prompt(`Valor do serviço para ${customer.name} (R$):`));
      if (isNaN(price) || price <= 0) {
        alert('Valor inválido. Operação cancelada.');
        return;
      }
      
      const notes = prompt('Observações sobre o serviço:') || '';
      
      // Percentual de comissão
      const defaultCommission = settings.defaultCommissionPct;
      const commissionPct = parseInt(prompt(`Comissão (%)`, defaultCommission));
      
      // Data atual como string ISO
      const today = new Date().toISOString().split('T')[0];
      
      // Criar novo serviço
      const serviceData = {
        customerId: customer.id,
        employeeId: 2, // Fixo como José Operador por simplicidade
        serviceDate: today,
        price: price,
        commissionPct: commissionPct || defaultCommission,
        notes: notes
      };
        // Enviar serviço para a API
      const newService = await window.API.createService(serviceData);
      
      // Criar agendamento futuro (próxima limpeza em 1 ano)
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextServiceDate = nextYear.toISOString().split('T')[0];
      
      // Criar agendamento
      const appointmentData = {
        customerId: customer.id,
        scheduledFor: nextServiceDate,
        createdFromServiceId: newService.id,
        status: 'PENDING',
        notes: 'Próxima limpeza anual'
      };
      
      // Enviar agendamento para API
      const newAppointment = await window.API.createAppointment(appointmentData);
      
      // Mensagem de sucesso
      alert(`Venda registrada com sucesso!\nPróxima limpeza agendada para ${new Date(nextServiceDate).toLocaleDateString('pt-BR')}`);
      
      // Disparar evento para notificar outras partes da UI
      document.dispatchEvent(new CustomEvent('serviceAdded', { 
        detail: { service: newService, appointment: newAppointment }
      }));
      
      // Atualizar dados internos
      services.push(newService);
      appointments.push(newAppointment);
      
      return { service: newService, appointment: newAppointment };
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      alert('Erro ao registrar venda. Verifique o console para mais detalhes.');
      return null;
    }
  };
  // Lista serviços por cliente
  const getServicesByCustomer = async (customerId) => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return [];
      }
      
      const customerServices = await window.API.getServicesByCustomerId(customerId);
      return customerServices.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
    } catch (error) {
      console.error('Erro ao buscar serviços do cliente:', error);
      return [];
    }
  };

  // Calcula comissão de um serviço
  const calculateCommission = (service) => {
    return service.price * (service.commissionPct / 100);
  };
  // Marca um agendamento como concluído e cria nova venda
  const completeAppointment = async (appointmentId) => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return null;
      }
      
      // Buscar agendamento na API
      const appointment = await window.API.getAppointmentById(appointmentId);
      if (!appointment) {
        alert('Agendamento não encontrado!');
        return;
      }
      
      // Buscar cliente na API
      const customer = await window.API.getCustomerById(appointment.customerId);
      if (!customer) {
        alert('Cliente não encontrado!');
        return;
      }
      
      // Atualiza o status
      appointment.status = 'DONE';
      await window.API.updateAppointment(appointmentId, appointment);
      
      // Perguntar se deseja registrar como venda concluída
      const shouldCreateService = confirm(`Marcar agendamento de ${customer.name} como concluído e registrar o serviço?`);
      
      if (shouldCreateService) {
        // Perguntar preço do serviço
        const price = parseFloat(prompt('Valor do serviço (R$):'));
        
        if (!isNaN(price) && price > 0) {
          // Cria novo serviço
          const serviceData = {
            customerId: customer.id,
            employeeId: 2, // Fixo como José Operador
            serviceDate: new Date().toISOString().split('T')[0],
            price: price,
            commissionPct: settings.defaultCommissionPct,
            notes: `Realizado a partir do agendamento #${appointmentId}`
          };
          
          const newService = await window.API.createService(serviceData);
          
          // Perguntar se deve reagendar
          const shouldReschedule = confirm('Deseja agendar a próxima limpeza?');
          
          if (shouldReschedule) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const nextServiceDate = nextYear.toISOString().split('T')[0];
            
            const appointmentData = {
              customerId: customer.id,
              scheduledFor: nextServiceDate,
              createdFromServiceId: newService.id,
              status: 'PENDING',
              notes: 'Próxima limpeza anual'
            };
            
            const newAppointment = await API.createAppointment(appointmentData);
            
            alert(`Agendamento concluído!\nServiço registrado: R$ ${price.toFixed(2)}\nPróxima limpeza agendada para ${new Date(nextServiceDate).toLocaleDateString('pt-BR')}`);
          } else {
            alert(`Agendamento concluído!\nServiço registrado: R$ ${price.toFixed(2)}`);
          }
        }
      } else {
        alert('Agendamento marcado como concluído.');
      }
      
      // Disparar evento
      document.dispatchEvent(new CustomEvent('appointmentUpdated', { detail: appointment }));
      
      return appointment;
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      alert('Erro ao concluir agendamento. Verifique o console para mais detalhes.');
      return null;
    }
  };
  // Retorna próximos agendamentos
  const getUpcomingAppointments = async (days = 30) => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return [];
      }
      
      const allAppointments = await window.API.getAppointments();
      
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + days);
      
      return allAppointments
        .filter(a => a.status === 'PENDING')
        .filter(a => {
          const date = new Date(a.scheduledFor);
          return date >= now && date <= future;
        })
        .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    } catch (error) {
      console.error('Erro ao buscar próximos agendamentos:', error);
      return [];
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

  // Configuração da página de vendas
  const setupVendasPage = () => {
    const newServiceBtn = document.querySelector('.btn--new-service');
    if (newServiceBtn) {
      newServiceBtn.addEventListener('click', () => showNewServiceModal());
    }

    // Renderizar tabela de serviços
    renderServicesTable();
  };
    // Renderizar tabela de serviços (para página de vendas)
  const renderServicesTable = async () => {
    const tableBody = document.querySelector('.services-table tbody');
    if (!tableBody) return;
    
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Obter serviços da API
      const allServices = await window.API.getServices();
      
      // Limpar tabela
      tableBody.innerHTML = '';
      
      // Ordenar serviços por data (mais recentes primeiro)
      const sortedServices = [...allServices].sort((a, b) => 
        new Date(b.serviceDate) - new Date(a.serviceDate)
      );
      
      // Renderizar cada serviço
      for (const service of sortedServices) {
        const customer = await window.API.getCustomerById(service.customerId);
        const employee = await window.API.getUserById(service.employeeId);
        
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
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Buscar serviço na API
      const service = await window.API.getServiceById(serviceId);
      if (!service) {
        showToast('Serviço não encontrado', 'error');
        return;
      }
      
      // Buscar cliente e funcionário
      const customer = await window.API.getCustomerById(service.customerId);
      const employee = await window.API.getUserById(service.employeeId);
      
      // Verificar se existe agendamento relacionado
      const allAppointments = await window.API.getAppointments();
      const relatedAppointment = allAppointments.find(a => a.createdFromServiceId === serviceId);
      
      // Carregar template HTML
      let templateHtml = await loadTemplate('../components/modal-service-details.html');
      console.log("passei aqui");
      
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
          <p><strong>Data agendada:</strong> ${new Date(relatedAppointment.scheduledFor).toLocaleDateString('pt-BR')}</p>
          <p><strong>Status:</strong> ${relatedAppointment.status === 'PENDING' ? 'Pendente' : 'Concluído'}</p>
          <p><strong>Observações:</strong> ${relatedAppointment.notes || 'Nenhuma observação'}</p>
        </div>
      ` : '';
      
      // Substituir placeholders no template
      templateHtml = templateHtml
        .replace('{{CUSTOMER_NAME}}', customer ? customer.name : 'Cliente não encontrado')
        .replace('{{SERVICE_DATE}}', new Date(service.serviceDate).toLocaleDateString('pt-BR'))
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
  // Exibe modal para cadastro de novo serviço
  const showNewServiceModal = async (preSelectedCustomerId = null) => {
    try {
      // Verificar se API está disponível
      if (!window.API) {
        console.error('API não está disponível');
        window.showToast('Erro ao conectar com a API', 'error');
        return;
      }
      
      // Carregar template HTML
      let templateHtml = await loadTemplate('components/modal-new-service.html');
      if (!templateHtml) {
        console.error('Tentando carregar template alternativo...');
        templateHtml = await loadTemplate('../components/modal-new-service.html');
        
        if (!templateHtml) {
          alert('Erro: Não foi possível carregar o template');
          return;
        }
      }
      
      // Obter dados necessários da API
      const customers = await window.API.getCustomers();
      const users = await window.API.getUsers();
      const settingsData = await window.API.getSettings();
      
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
        .replace('{{DEFAULT_COMMISSION}}', settingsData?.defaultCommissionPct || 10);
      
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
          let serviceDateTime = serviceDate;
          if (!serviceDateTime.includes('T') && scheduledTime) {
            serviceDateTime = `${serviceDateTime}T${scheduledTime}`;
          }
          
          const serviceData = {
            customerId,
            employeeId,
            serviceDate: serviceDateTime,
            price,
            commissionPct,
            notes
          };
            // Adicionar serviço via API
          const newService = await window.API.createService(serviceData);
          
          // Criar agendamento para o próximo ano
          const nextYear = new Date(serviceDate);
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          
          // Usar a data correta garantindo que não há problemas de fuso horário
          const nextYearStr = nextYear.toISOString().split('T')[0];
          
          const appointmentData = {
            customerId,
            scheduledFor: `${nextYearStr}T${scheduledTime || '09:00'}`,
            createdFromServiceId: newService.id,
            status: 'PENDING',
            notes: `Limpeza anual a partir do serviço de ${new Date(serviceDate).toLocaleDateString('pt-BR')}`
          };
          
          // Adicionar agendamento via API
          const newAppointment = await window.API.createAppointment(appointmentData);
          
          const result = { service: newService, appointment: newAppointment };
          
          // Disparar evento para notificar que um serviço foi adicionado
          const event = new CustomEvent('serviceAdded', { detail: result });
          document.dispatchEvent(event);
          
          // Se estamos na página dashboard, atualizar
          if (typeof window.DashboardModule !== 'undefined') {
            window.DashboardModule.renderMetrics();
            window.DashboardModule.renderContacts();
          }
          
          // Formatar data de próximo contato
          let formattedAppointmentDate = formatDate(newAppointment.scheduledFor);
          
          showToast(`Venda registrada com sucesso. Próximo contato agendado para ${formattedAppointmentDate}`);
          
          // Atualizar listas locais
          services.push(newService);
          appointments.push(newAppointment);
          
          // Fechar modal
          closeModal();
          
          // Atualizar tabela, se estiver na página de vendas
          renderServicesTable();
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
      console.error('Erro ao mostrar modal de novo serviço:', error);
      showToast('Erro ao carregar formulário de novo serviço', 'error');
    }
  };
    // API pública
  return {
    init,
    addNewService,
    getServicesByCustomer,
    calculateCommission,
    completeAppointment,
    getUpcomingAppointments,
    setupVendasPage,
    showNewServiceModal,
    showServiceDetails,
    renderServicesTable,
    formatDate
  };
})();

// Exporta módulo
window.ServicesModule = ServicesModule;
