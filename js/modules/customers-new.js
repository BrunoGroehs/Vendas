// filepath: c:\Users\I753372\Desktop\projetos\TesteGPT\js\modules\customers.js
// Customers module - Gerencia cadastro e listagem de clientes
const CustomersModule = (() => {
  // Cache de elementos DOM
  let customerTable;
  let searchInput;
  let addCustomerBtn;
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
    const isCustomersPage = window.location.pathname.includes('clientes.html');
    
    if (isCustomersPage) {
      // Evitar múltiplas inicializações
      if (window.CustomersModule.isInitialized) {
        console.warn('CustomersModule já foi inicializado.');
        return;
      }
      window.CustomersModule.isInitialized = true;

      // Estamos na página de clientes
      customerTable = document.querySelector('#clientTableBody'); // Fixed selector
      searchInput = document.querySelector('.header__search');
      addCustomerBtn = document.querySelector('#newClientBtn'); // Fixed selector
      
      // Configurar eventos
      if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', showAddCustomerModal);
      }
      
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          renderCustomersTable(e.target.value);
        });
      }
      
      // Renderizar tabela inicial
      renderCustomersTable();
    }
    
    // Escutar por eventos de pesquisa global
    document.addEventListener('globalSearch', (e) => {
      if (isCustomersPage && e.detail && e.detail.query) {
        renderCustomersTable(e.detail.query);
      }
    });
  };
  
  // Renderiza tabela de clientes com filtro opcional
  const renderCustomersTable = async (filterText = '') => {
    console.log('Renderizando tabela de clientes...'); // Log para depuração

    if (!customerTable) return;

    // Obter clientes da API
    let customers = [];
    try {
      customers = await API.getCustomers();
      console.log('Clientes retornados pela API:', customers);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      window.showToast('Erro ao carregar clientes', 'error');
      return;
    }

    // Limpar tabela existente
    customerTable.innerHTML = '';

    // Filtrar clientes
    const filteredCustomers = customers.filter(customer => {
      if (!filterText) return true;

      const searchLower = filterText.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.city.toLowerCase().includes(searchLower)
      );
    });

    // Adicionar clientes na tabela
    filteredCustomers.forEach(customer => {
      // Criar linha da tabela
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${customer.city}/${customer.state}</td>
        <td>${customer.lastService || 'Nenhum serviço'}</td>
        <td>${customer.nextContact || 'Nenhum agendamento'}</td>
        <td>
          <button class="btn btn--small btn--details" data-customer-id="${customer.id}">Detalhes</button>
        </td>
      `;

      // Evento de clique para o botão de detalhes
      const detailsBtn = tr.querySelector('.btn--details');
      detailsBtn.addEventListener('click', () => {
        showCustomerDetails(customer.id);
      });

      customerTable.appendChild(tr);
    });

    // Mensagem se não houver resultados
    if (filteredCustomers.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = filterText ? 'Nenhum resultado para a busca' : 'Nenhum cliente cadastrado';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      customerTable.appendChild(tr);
    }
  };
    // Exibe modal com detalhes do cliente
  const showCustomerDetails = async (customerId) => {
    // Obter cliente da API
    const customer = await API.getCustomerById(customerId);
    if (!customer) {
      alert('Cliente não encontrado!');
      return;
    }

    // Obter serviços e agendamentos do cliente
    const allServices = await API.getServices();
    const allAppointments = await API.getAppointments();

    const customerServices = allServices.filter(s => s.customerId === customerId);
    const customerAppointments = allAppointments.filter(a => a.customerId === customerId);

    // Criar modal com os dados do cliente
    if (window.ComponentsModule && typeof window.ComponentsModule.showCustomerDetailsModal === 'function') {
      window.ComponentsModule.showCustomerDetailsModal(customerId);
    } else {
      alert(`
        Cliente: ${customer.name}
        Telefone: ${customer.phone}
        Email: ${customer.email}
        Endereço: ${customer.address}, ${customer.city}/${customer.state}
        
        Histórico de serviços:
        ${customerServices.map(s => `- ${formatDate(s.serviceDate)}: R$ ${s.price.toFixed(2)}`).join('\n') || 'Nenhum serviço registrado'}
      `);
    }
  };
  
  // Exibe modal para adicionar cliente
  const showAddCustomerModal = () => {
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Estados brasileiros
    const states = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // Opções de estados
    const stateOptions = states.map(state =>
      `<option value="${state}">${state}</option>`
    ).join('');

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Novo Cliente</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <form id="customerForm">
            <div class="form-group">
              <label for="name">Nome Completo*:</label>
              <input type="text" id="name" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="phone">Telefone*:</label>
              <input type="tel" id="phone" class="form-input" required placeholder="(00) 00000-0000">
            </div>
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" class="form-input">
            </div>
            <div class="form-group">
              <label for="address">Endereço*:</label>
              <input type="text" id="address" class="form-input" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="city">Cidade*:</label>
                <input type="text" id="city" class="form-input" required>
              </div>
              <div class="form-group">
                <label for="state">Estado*:</label>
                <select id="state" class="form-select" required>
                  <option value="">Selecione</option>
                  ${stateOptions}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="zip">CEP:</label>
              <input type="text" id="zip" class="form-input" placeholder="00000-000">
            </div>
            <div class="form-group">
              <label for="preferredChannel">Canal de Contato Preferido*:</label>
              <select id="preferredChannel" class="form-select" required>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Telefone</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="saveCustomerBtn">Salvar</button>
          <button class="btn" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Salvar cliente
    modal.querySelector('#saveCustomerBtn').addEventListener('click', async () => {
      // Validação manual
      const form = modal.querySelector('#customerForm');
      const nameInput = form.querySelector('#name');
      const phoneInput = form.querySelector('#phone');
      const addressInput = form.querySelector('#address');
      const cityInput = form.querySelector('#city');
      const stateInput = form.querySelector('#state');
      const preferredChannelInput = form.querySelector('#preferredChannel');

      if (!nameInput.value.trim()) {
        window.showToast('Por favor, informe o nome do cliente', 'error');
        nameInput.focus();
        return;
      }

      if (!phoneInput.value.trim()) {
        window.showToast('Por favor, informe o telefone do cliente', 'error');
        phoneInput.focus();
        return;
      }

      if (!addressInput.value.trim()) {
        window.showToast('Por favor, informe o endereço do cliente', 'error');
        addressInput.focus();
        return;
      }

      if (!cityInput.value.trim()) {
        window.showToast('Por favor, informe a cidade do cliente', 'error');
        cityInput.focus();
        return;
      }

      if (!stateInput.value) {
        window.showToast('Por favor, selecione o estado do cliente', 'error');
        stateInput.focus();
        return;
      }

      if (!preferredChannelInput.value) {
        window.showToast('Por favor, selecione o canal de contato preferido', 'error');
        preferredChannelInput.focus();
        return;
      }

      // Coletar dados do form
      const newCustomer = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: form.querySelector('#email').value.trim(),
        address: addressInput.value.trim(),
        city: cityInput.value.trim(),
        state: stateInput.value,
        zip: form.querySelector('#zip').value.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        preferredChannel: preferredChannelInput.value
      };

      // Adicionar ao banco de dados via API
      try {
        await API.createCustomer(newCustomer);
        window.showToast('Cliente cadastrado com sucesso!');
        renderCustomersTable(); // Atualizar tabela
        document.body.removeChild(modal); // Fechar modal após salvar
      } catch (error) {
        console.error('Erro ao adicionar cliente:', error);
        window.showToast('Erro ao cadastrar cliente', 'error');
      }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Adicionar máscaras aos campos
    const phoneInput = modal.querySelector('#phone');
    phoneInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        if (value.length > 2) {
          value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
        }
        if (value.length > 10) {
          value = `${value.substring(0, 10)}-${value.substring(10)}`;
        }
        e.target.value = value;
      }
    });
    
    const zipInput = modal.querySelector('#zip');
    zipInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 8) {
        if (value.length > 5) {
          value = `${value.substring(0, 5)}-${value.substring(5)}`;
        }
        e.target.value = value;
      }
    });
  };
  
  // Exibe modal para editar cliente
  const showEditCustomerModal = async (customerId) => {
    // Obter cliente da API
    let customer;
    try {
      customer = await API.getCustomerById(customerId);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      window.showToast('Erro ao carregar dados do cliente', 'error');
      return;
    }

    if (!customer) {
      window.showToast('Cliente não encontrado', 'error');
      return;
    }

    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Estados brasileiros
    const states = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // Opções de estados
    const stateOptions = states.map(state =>
      `<option value="${state}" ${state === customer.state ? 'selected' : ''}>${state}</option>`
    ).join('');

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2>Editar Cliente</h2>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__body">
          <form id="customerForm">
            <div class="form-group">
              <label for="name">Nome Completo*:</label>
              <input type="text" id="name" class="form-input" required value="${customer.name}">
            </div>
            <div class="form-group">
              <label for="phone">Telefone*:</label>
              <input type="tel" id="phone" class="form-input" required 
                     placeholder="(00) 00000-0000" value="${customer.phone}">
            </div>
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" class="form-input" value="${customer.email || ''}">
            </div>
            <div class="form-group">
              <label for="address">Endereço*:</label>
              <input type="text" id="address" class="form-input" required value="${customer.address}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="city">Cidade*:</label>
                <input type="text" id="city" class="form-input" required value="${customer.city}">
              </div>
              <div class="form-group">
                <label for="state">Estado*:</label>
                <select id="state" class="form-select" required>
                  <option value="">Selecione</option>
                  ${stateOptions}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="zip">CEP:</label>
              <input type="text" id="zip" class="form-input" placeholder="00000-000" value="${customer.zip || ''}">
            </div>
            <div class="form-group">
              <label for="preferredChannel">Canal de Contato Preferido*:</label>
              <select id="preferredChannel" class="form-select" required>
                <option value="SMS" ${customer.preferredChannel === 'SMS' ? 'selected' : ''}>SMS</option>
                <option value="EMAIL" ${customer.preferredChannel === 'EMAIL' ? 'selected' : ''}>Email</option>
                <option value="PHONE" ${customer.preferredChannel === 'PHONE' ? 'selected' : ''}>Telefone</option>
                <option value="WHATSAPP" ${customer.preferredChannel === 'WHATSAPP' ? 'selected' : ''}>WhatsApp</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="saveCustomerBtn">Salvar</button>
          <button class="btn" id="cancelBtn">Cancelar</button>
        </div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Salvar cliente
    modal.querySelector('#saveCustomerBtn').addEventListener('click', async () => {
      // Validação manual
      const form = modal.querySelector('#customerForm');
      const nameInput = form.querySelector('#name');
      const phoneInput = form.querySelector('#phone');
      const addressInput = form.querySelector('#address');
      const cityInput = form.querySelector('#city');
      const stateInput = form.querySelector('#state');
      const preferredChannelInput = form.querySelector('#preferredChannel');

      if (!nameInput.value.trim()) {
        window.showToast('Por favor, informe o nome do cliente', 'error');
        nameInput.focus();
        return;
      }

      if (!phoneInput.value.trim()) {
        window.showToast('Por favor, informe o telefone do cliente', 'error');
        phoneInput.focus();
        return;
      }

      if (!addressInput.value.trim()) {
        window.showToast('Por favor, informe o endereço do cliente', 'error');
        addressInput.focus();
        return;
      }

      if (!cityInput.value.trim()) {
        window.showToast('Por favor, informe a cidade do cliente', 'error');
        cityInput.focus();
        return;
      }

      if (!stateInput.value) {
        window.showToast('Por favor, selecione o estado do cliente', 'error');
        stateInput.focus();
        return;
      }

      if (!preferredChannelInput.value) {
        window.showToast('Por favor, selecione o canal de contato preferido', 'error');
        preferredChannelInput.focus();
        return;
      }

      // Coletar dados do form
      const updatedCustomer = {
        ...customer, // Manter id e data de criação
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: form.querySelector('#email').value.trim(),
        address: addressInput.value.trim(),
        city: cityInput.value.trim(),
        state: stateInput.value,
        zip: form.querySelector('#zip').value.trim(),
        preferredChannel: preferredChannelInput.value
      };

      // Atualizar no banco de dados via API
      try {
        await API.updateCustomer(customerId, updatedCustomer);
        window.showToast('Cliente atualizado com sucesso!');
        renderCustomersTable(); // Atualizar tabela
        document.body.removeChild(modal);
      } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        window.showToast('Erro ao atualizar cliente', 'error');
      }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Adicionar máscaras aos campos
    const phoneInput = modal.querySelector('#phone');
    phoneInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        if (value.length > 2) {
          value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
        }
        if (value.length > 10) {
          value = `${value.substring(0, 10)}-${value.substring(10)}`;
        }
        e.target.value = value;
      }
    });
    
    const zipInput = modal.querySelector('#zip');
    zipInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 8) {
        if (value.length > 5) {
          value = `${value.substring(0, 5)}-${value.substring(5)}`;
        }
        e.target.value = value;
      }
    });
  };
  
  // Adiciona um novo cliente ao banco de dados
  const addCustomer = async (customer) => {
    try {
      const createdCustomer = await API.createCustomer(customer);
      window.showToast('Cliente cadastrado com sucesso!');
      renderCustomersTable(); // Atualizar tabela
      return createdCustomer;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      window.showToast('Erro ao cadastrar cliente', 'error');
      return null;
    }
  };
  
  // Atualiza um cliente existente
  const updateCustomer = async (customer) => {
    try {
      const updatedCustomer = await API.updateCustomer(customer.id, customer);
      window.showToast('Cliente atualizado com sucesso!');
      renderCustomersTable(); // Atualizar tabela
      return updatedCustomer;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      window.showToast('Erro ao atualizar cliente', 'error');
      return null;
    }
  };
  
  // Gera um ID único para um novo cliente
  const generateId = async () => {
    try {
      // Obter todos os clientes da API
      const customers = await API.getCustomers();

      // Calcular o próximo ID com base no maior ID existente
      return customers.length > 0
        ? Math.max(...customers.map(c => c.id)) + 1
        : 1;
    } catch (error) {
      console.error('Erro ao gerar ID:', error);
      window.showToast('Erro ao gerar ID para o cliente', 'error');
      return 1; // Retornar um ID padrão em caso de erro
    }
  };
  
  // API pública do módulo
  return {
    init,
    renderCustomersTable,
    showCustomerDetails,
    showAddCustomerModal,
    showEditCustomerModal
  };
})();

// Expor globalmente
window.CustomersModule = CustomersModule;
