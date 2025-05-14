// Customers module - Gerencia CRUD de clientes
const CustomersModule = (() => {
  // Estado interno
  let customers = [];
  let currentCustomerId = null;

  // Inicialização
  const init = () => {
    customers = window.mockDB.customers;
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
  const showCustomerDetails = (customerId) => {
    currentCustomerId = customerId;
    const customer = getCustomerById(customerId);
    
    if (!customer) {
      alert('Cliente não encontrado!');
      return;
    }
    
    // Aqui exibiríamos um drawer lateral com os dados
    // Por enquanto, vamos usar um alert simples
    const services = window.mockDB.services
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
  const addCustomer = () => {
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
    
    const newId = Math.max(...customers.map(c => c.id)) + 1;
    const newCustomer = {
      id: newId,
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
    
    // Adiciona ao mock DB
    window.mockDB.customers.push(newCustomer);
    
    // Atualiza lista local
    customers = window.mockDB.customers;
    
    alert(`Cliente ${name} adicionado com sucesso!`);
    
    // Dispara evento para atualizar outras partes da UI
    const event = new CustomEvent('customerAdded', { detail: newCustomer });
    document.dispatchEvent(event);
    
    return newCustomer;
  };

  // Edita cliente existente (simplificado)
  const editCustomer = (customerId) => {
    const customer = getCustomerById(customerId);
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
    customer.name = name;
    customer.phone = phone;
    customer.email = email;
    customer.address = address;
    
    alert(`Cliente ${name} atualizado com sucesso!`);
    
    // Dispara evento
    const event = new CustomEvent('customerUpdated', { detail: customer });
    document.dispatchEvent(event);
    
    return customer;
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
