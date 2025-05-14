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
    return date.toLocaleDateString('pt-BR');
  };
  
  // Inicialização do módulo
  const init = () => {
    const isCustomersPage = window.location.pathname.includes('clientes.html');
    
    if (isCustomersPage) {
      // Estamos na página de clientes
      customerTable = document.querySelector('.customers-table tbody');
      searchInput = document.querySelector('.header__search');
      addCustomerBtn = document.querySelector('.btn--add-customer');
      
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
  const renderCustomersTable = (filterText = '') => {
    if (!customerTable) return;
    
    const db = window.mockDB;
    if (!db) return;
    
    // Filtrar clientes
    const filteredCustomers = db.customers.filter(customer => {
      if (!filterText) return true;
      
      const searchLower = filterText.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.city.toLowerCase().includes(searchLower)
      );
    });
    
    // Limpar tabela existente
    customerTable.innerHTML = '';
    
    // Adicionar clientes na tabela
    filteredCustomers.forEach(customer => {
      // Encontrar serviços deste cliente
      const customerServices = db.services.filter(s => s.customerId === customer.id);
      
      // Encontrar último serviço
      let lastService = 'Nenhum serviço';
      if (customerServices.length > 0) {
        const sorted = [...customerServices].sort((a, b) => 
          new Date(b.serviceDate) - new Date(a.serviceDate)
        );
        lastService = formatDate(sorted[0].serviceDate);
      }
      
      // Próximos contatos
      const upcomingAppointments = db.appointments.filter(
        a => a.customerId === customer.id && a.status === 'PENDING'
      );
      
      let nextContact = 'Nenhum agendamento';
      if (upcomingAppointments.length > 0) {
        const sorted = [...upcomingAppointments].sort((a, b) => 
          new Date(a.scheduledFor) - new Date(b.scheduledFor)
        );
        nextContact = formatDate(sorted[0].scheduledFor);
      }
      
      // Criar linha da tabela
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${customer.city}/${customer.state}</td>
        <td>${lastService}</td>
        <td>${nextContact}</td>
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
  const showCustomerDetails = (customerId) => {
    const db = window.mockDB;
    if (!db) return;
    
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Filtrar serviços deste cliente
    const customerServices = db.services.filter(s => s.customerId === customerId)
      .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
      
    // Filtrar próximos agendamentos
    const customerAppointments = db.appointments.filter(a => a.customerId === customerId)
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
      
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
              <h3>Informações Pessoais</h3>
              <p><strong>Telefone:</strong> ${customer.phone}</p>
              <p><strong>Email:</strong> ${customer.email}</p>
              <p><strong>Endereço:</strong> ${customer.address}</p>
              <p><strong>Cidade:</strong> ${customer.city} - ${customer.state}</p>
              <p><strong>CEP:</strong> ${customer.zip}</p>
              <p><strong>Cliente desde:</strong> ${formatDate(customer.createdAt)}</p>
              <p><strong>Canal preferido:</strong> ${customer.preferredChannel}</p>
            </div>
            
            <div class="customer-services">
              <h3>Histórico de Serviços (${customerServices.length})</h3>
              ${customerServices.length > 0 
                ? `<ul class="services-list">
                    ${customerServices.map(service => `
                      <li>
                        <div class="service-date">${formatDate(service.serviceDate)}</div>
                        <div class="service-price">R$ ${service.price.toFixed(2)}</div>
                        <div class="service-notes">${service.notes || ''}</div>
                      </li>
                    `).join('')}
                   </ul>`
                : '<p>Nenhum serviço registrado</p>'
              }
            </div>
          </div>
          
          <div class="customer-appointments">
            <h3>Próximos Agendamentos</h3>
            ${customerAppointments.filter(a => a.status === 'PENDING').length > 0
              ? `<ul class="appointments-list">
                  ${customerAppointments
                    .filter(a => a.status === 'PENDING')
                    .map(appointment => `
                      <li>
                        <div class="appointment-date">${formatDate(appointment.scheduledFor)}</div>
                        <div class="appointment-notes">${appointment.notes || ''}</div>
                        <button class="btn btn--small btn--details view-appointment" 
                                data-appointment-id="${appointment.id}">
                          Ver Agendamento
                        </button>
                      </li>
                    `).join('')}
                 </ul>`
              : '<p>Nenhum agendamento pendente</p>'
            }
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" id="addServiceBtn">Registrar Novo Serviço</button>
          <button class="btn" id="editCustomerBtn">Editar Cliente</button>
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
    
    // Botão para registrar novo serviço
    modal.querySelector('#addServiceBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      if (window.ServicesModule && typeof window.ServicesModule.showNewServiceModal === 'function') {
        window.ServicesModule.showNewServiceModal(customer.id);
      } else {
        window.showToast('Módulo de serviços em implementação', 'warning');
      }
    });
    
    // Botão para editar cliente
    modal.querySelector('#editCustomerBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      showEditCustomerModal(customer.id);
    });
    
    // Botões para ver agendamentos
    const appointmentBtns = modal.querySelectorAll('.view-appointment');
    appointmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const appointmentId = parseInt(btn.dataset.appointmentId);
        document.body.removeChild(modal);
        
        if (window.DashboardModule && typeof window.DashboardModule.showAppointmentDetails === 'function') {
          window.DashboardModule.showAppointmentDetails(appointmentId);
        } else {
          window.showToast('Visualização de agendamento em implementação', 'warning');
        }
      });
    });
    
    // Fechar ao clicar fora do conteúdo
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
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
              <input type="tel" id="phone" class="form-input" required 
                     placeholder="(00) 00000-0000">
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
    modal.querySelector('#saveCustomerBtn').addEventListener('click', () => {
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
        id: generateId(),
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
      
      // Adicionar ao banco de dados
      if (addCustomer(newCustomer)) {
        window.showToast('Cliente cadastrado com sucesso!');
        renderCustomersTable(); // Atualizar tabela
        document.body.removeChild(modal);
      } else {
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
  const showEditCustomerModal = (customerId) => {
    const db = window.mockDB;
    if (!db) return;
    
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return;
    
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
    modal.querySelector('#saveCustomerBtn').addEventListener('click', () => {
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
      
      // Atualizar no banco de dados
      if (updateCustomer(updatedCustomer)) {
        window.showToast('Cliente atualizado com sucesso!');
        renderCustomersTable(); // Atualizar tabela
        document.body.removeChild(modal);
      } else {
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
  const addCustomer = (customer) => {
    const db = window.mockDB;
    if (!db) return false;
    
    try {
      db.customers.push(customer);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      return false;
    }
  };
  
  // Atualiza um cliente existente
  const updateCustomer = (customer) => {
    const db = window.mockDB;
    if (!db) return false;
    
    try {
      const index = db.customers.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        db.customers[index] = customer;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return false;
    }
  };
  
  // Gera um ID único para um novo cliente
  const generateId = () => {
    const db = window.mockDB;
    if (!db || !db.customers) return 1;
    
    return db.customers.length > 0 
      ? Math.max(...db.customers.map(c => c.id)) + 1
      : 1;
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
