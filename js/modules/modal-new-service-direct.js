// Novo modal para cadastro de serviço já com cliente selecionado
// filepath: js/modules/modal-new-service-direct.js

(async function() {
  // Função para abrir o modal de novo serviço já com cliente selecionado
  window.showNewServiceDirectModal = async function(customerId) {
    // Carregar template do modal
    let templateHtml = await loadTemplate('/components/modal-new-service.html');
    if (!templateHtml) {
      alert('Não foi possível carregar o template do modal de novo serviço.');
      return;
    }

    // Criar container do modal
    let modalContainer = document.getElementById('modalNewServiceDirectContainer');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'modalNewServiceDirectContainer';
      document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = templateHtml;
    modalContainer.style.display = 'block';
    modalContainer.style.position = 'fixed';
    modalContainer.style.top = '0';
    modalContainer.style.left = '0';
    modalContainer.style.width = '100vw';
    modalContainer.style.height = '100vh';
    modalContainer.style.background = 'rgba(0,0,0,0.5)';
    modalContainer.style.zIndex = '10000';

    // Buscar dados do cliente
    const customer = await window.API.getCustomerById(customerId);
    if (!customer) {
      console.log('Cliente não encontrado!', 'error');
      modalContainer.remove();
      return;
    }
    console.log("aquiii");
    
    // Esconder o passo 1 (seleção de cliente) e mostrar apenas o passo 2 (serviço)
    const step1 = modalContainer.querySelector('.wizard__panel[data-panel="1"]');
    const step2 = modalContainer.querySelector('.wizard__panel[data-panel="2"]');
    const step3 = modalContainer.querySelector('.wizard__panel[data-panel="3"]');
    if (step1 && step2) {
      step1.style.display = 'none';
      step1.classList.remove('active');
      step2.style.display = 'block';
      step2.classList.add('active');
      // Atualizar barra de progresso
      const step1Tab = modalContainer.querySelector('.wizard__step[data-step="1"]');
      const step2Tab = modalContainer.querySelector('.wizard__step[data-step="2"]');
      if (step1Tab && step2Tab) {
        step1Tab.classList.remove('active');
        step2Tab.classList.add('active');
      }
    }

    // Preencher campos do cliente (se existir no template)
    const customerSelect = modalContainer.querySelector('#customer');
    if (customerSelect) {
      customerSelect.innerHTML = `<option value="${customer.id}" selected>${customer.name}</option>`;
      customerSelect.value = customer.id;
      customerSelect.disabled = true;
    }

    // Preencher data de hoje
    const today = new Date().toISOString().split('T')[0];
    const serviceDateInput = modalContainer.querySelector('#serviceDate');
    if (serviceDateInput) serviceDateInput.value = today;

    // Preencher funcionários
    const employeeSelect = modalContainer.querySelector('#employee');
    if (employeeSelect && window.API.getUsers) {
      const users = await window.API.getUsers();
      employeeSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    }

    // Preencher comissão padrão
    const commissionInput = modalContainer.querySelector('#commissionPct');
    if (commissionInput && window.API.getSettings) {
      const settings = await window.API.getSettings();
      commissionInput.value = settings?.defaultCommissionPct || 10;
    }

    // Botão de fechar
    const closeBtn = modalContainer.querySelector('.modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => modalContainer.remove());
    }
    // Botão cancelar
    const cancelBtn = modalContainer.querySelector('#cancelWizard');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => modalContainer.remove());
    }
    // Botão voltar (step2)
    const backToStep1 = modalContainer.querySelector('#backToStep1');
    if (backToStep1) {
      backToStep1.addEventListener('click', () => modalContainer.remove());
    }
    // Botão voltar (step3)
    const backToStep2 = modalContainer.querySelector('#backToStep2');
    if (backToStep2) {
      backToStep2.addEventListener('click', () => {
        if (step2 && step3) {
          step3.style.display = 'none';
          step3.classList.remove('active');
          step2.style.display = 'block';
          step2.classList.add('active');
        }
      });
    }
    // Botão próximo para step3
    const nextToStep3 = modalContainer.querySelector('#nextToStep3');
    if (nextToStep3) {
      nextToStep3.addEventListener('click', () => {
        if (step2 && step3) {
          step2.style.display = 'none';
          step2.classList.remove('active');
          step3.style.display = 'block';
          step3.classList.add('active');
        }
      });
    }
    // Botão salvar serviço
    const saveBtn = modalContainer.querySelector('#saveService');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        // Coletar dados do formulário
        const serviceData = {
          customerId: customer.id,
          serviceDate: serviceDateInput ? serviceDateInput.value : '',
          scheduledTime: modalContainer.querySelector('#scheduledTime')?.value || '',
          price: parseFloat(modalContainer.querySelector('#price')?.value || 0),
          employeeId: employeeSelect ? employeeSelect.value : '',
          commissionPct: parseFloat(commissionInput?.value || 0),
          notes: modalContainer.querySelector('#notes')?.value || ''
        };
        // Chamar API para salvar
        try {
          await window.API.createService(serviceData);
          alert('Serviço cadastrado com sucesso!');
          modalContainer.remove();
        } catch (e) {
          alert('Erro ao cadastrar serviço: ' + (e.message || e));
        }
      });
    }
    // Fechar ao clicar fora do conteúdo
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) modalContainer.remove();
    });
  };

  // Função utilitária para carregar template (usa a global se existir)
  async function loadTemplate(path) {
    if (typeof window.loadTemplate === 'function') return window.loadTemplate(path);
    try {
      const response = await fetch(path);
      if (!response.ok) return null;
      return await response.text();
    } catch (e) {
      return null;
    }
  }
})();
