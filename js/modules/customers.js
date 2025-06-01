// Customers module - Gerencia CRUD de clientes
const CustomersModule = (() => {
  // Estado interno
  let customers = [];
  let currentCustomerId = null;

  // Inicialização
  const init = async () => {
    customers = await API.getCustomers();
  };

  // Lista todos os clientes
  const listCustomers = () => {
    return customers;
  };

  // Busca cliente por ID
  const getCustomerById = (id) => {
    return customers.find(c => c.id === id) || null;
  };

  // Exibe modal com drawer de detalhes do cliente
  const showCustomerDetails = async (customerId) => {
    currentCustomerId = customerId;

    // Obter cliente da API
    const customer = await API.getCustomerById(customerId);
    if (!customer) {
      alert('Cliente não encontrado!');
      return;
    }

    // Obter serviços do cliente da API
    const allServices = await API.getServices();
    const services = allServices
      .filter(s => s.customerId === customerId)
      .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

    const serviceHistory = services.length 
      ? services.map(s => `- ${new Date(s.serviceDate).toLocaleDateString('pt-BR')}: R$ ${s.price.toFixed(2)}`).join('\n')
      : 'Nenhum serviço registrado';

    alert(`
      Cliente: ${customer.name}
      Telefone: ${customer.phone}
      Email: ${customer.email}
      Endereço: ${customer.address}, ${customer.city}/${customer.state}
      
      Histórico de serviços:
      ${serviceHistory}
    `);
  };

  // Adiciona novo cliente (simplificado)
  const addCustomer = async () => {
    const name = prompt('Nome do cliente:');
    if (!name) return;

    const phone = prompt('Telefone:');
    const email = prompt('Email:');
    const address = prompt('Endereço:');

    // Validações simples (em um sistema real seriam mais robustas)
    if (!name || !phone) {
      alert('Nome e telefone são obrigatórios!');
      return;
    }

    const newCustomer = {
      name,
      phone,
      email,
      address,
      city: 'Cidade',
      state: 'SP',
      zip: '',
      createdAt: new Date().toISOString().split('T')[0],
      preferredChannel: 'SMS'
    };

    // Adiciona cliente via API
    try {
      const createdCustomer = await API.createCustomer(newCustomer);
      alert(`Cliente ${createdCustomer.name} adicionado com sucesso!`);

      // Dispara evento para atualizar outras partes da UI
      const event = new CustomEvent('customerAdded', { detail: createdCustomer });
      document.dispatchEvent(event);

      return createdCustomer;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      alert('Erro ao adicionar cliente.');
    }
  };

  // Edita cliente existente (simplificado)
  const editCustomer = async (customerId) => {
    const customer = await API.getCustomerById(customerId);
    if (!customer) {
      alert('Cliente não encontrado!');
      return;
    }

    const name = prompt('Nome do cliente:', customer.name);
    if (!name) return;

    const phone = prompt('Telefone:', customer.phone);
    const email = prompt('Email:', customer.email);
    const address = prompt('Endereço:', customer.address);

    // Atualiza dados
    const updatedCustomer = {
      ...customer,
      name,
      phone,
      email,
      address
    };

    // Atualiza cliente via API
    try {
      const result = await API.updateCustomer(customerId, updatedCustomer);
      alert(`Cliente ${result.name} atualizado com sucesso!`);

      // Dispara evento
      const event = new CustomEvent('customerUpdated', { detail: result });
      document.dispatchEvent(event);

      return result;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente.');
    }
  };

  // Busca clientes por nome ou telefone
  const searchCustomers = (query) => {
    if (!query) return customers;
    
    query = query.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  };

  // API pública
  return {
    init,
    listCustomers,
    getCustomerById,
    showCustomerDetails,
    addCustomer,
    editCustomer,
    searchCustomers
  };
})();

// Exporta módulo
window.CustomersModule = CustomersModule;
