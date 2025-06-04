// Lógica para o modal de detalhes do cliente
const CustomerDetailsModal = (() => {
  // Buscar e exibir o histórico de serviços e agendamentos pendentes
  const loadCustomerData = async (customerId) => {
    const serviceHistoryList = document.getElementById('serviceHistory');
    const pendingAppointmentsList = document.getElementById('pendingAppointments');

    // Limpar listas
    serviceHistoryList.innerHTML = '';
    pendingAppointmentsList.innerHTML = '';

    try {
      // Buscar histórico de serviços
      const services = await API.getServicesByCustomerId(customerId);
      console.log('Serviços vinculados ao cliente:', services); // Log dos serviços do cliente
      // Corrigir filtro para customerid (tudo minúsculo)
      const filteredServices = services.filter(s => String(s.customerid) === String(customerId));
      if (filteredServices.length > 0) {
        filteredServices.forEach(service => {
          const li = document.createElement('li');
          const date = service.servicedate ? new Date(service.servicedate).toLocaleDateString('pt-BR') : 'Data não disponível';
          const notes = service.notes || 'Sem observações';
          const price = service.price ? `R$ ${Number(service.price).toFixed(2)}` : 'Preço não disponível';
          li.textContent = `${date} - ${notes} - ${price}`;
          serviceHistoryList.appendChild(li);
        });
      } else {
        serviceHistoryList.textContent = 'Nenhum serviço encontrado.';
      }

      // Buscar agendamentos pendentes
      const appointments = await API.getPendingAppointmentsByCustomerId(customerId);
      if (appointments && appointments.length > 0) {
        pendingAppointmentsList.innerHTML = '';
        appointments.forEach(appointment => {
          const li = document.createElement('li');
          // Corrigir para aceitar tanto 'scheduledFor' quanto 'scheduledfor'
          const dateRaw = appointment.scheduledFor || appointment.scheduledfor;
          const date = dateRaw ? new Date(dateRaw).toLocaleDateString('pt-BR') : 'Data não disponível';
          li.textContent = `${date} - ${appointment.notes || 'Sem observações'}`;
          pendingAppointmentsList.appendChild(li);
        });
      } else {
        pendingAppointmentsList.textContent = 'Nenhum recontato pendente.';
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    }
  };

  // Função para carregar e exibir o modal
  const show = async (customerId) => {
    let modal = document.getElementById('customerDetailsModal');

    // Carregar o modal no DOM, se ainda não estiver presente
    if (!modal) {
      const response = await fetch('/components/modal-customer-details.html');
      const modalHTML = await response.text();
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modal = document.getElementById('customerDetailsModal');
    }

    // Buscar os dados do cliente
    const customer = await API.getCustomerById(customerId);
    console.log('Dados do cliente:', customer); // Adicionado log dos dados do cliente
    if (!customer) {
      console.error('Cliente não encontrado:', customerId);
      return;
    }''

    // Preencher os dados no modal
    modal.querySelector('#modalCustomerName').textContent = customer.name;
    modal.querySelector('#customerName').textContent = customer.name;
    modal.querySelector('#customerAddress').textContent = customer.address || '-';
    modal.querySelector('#customerCity').textContent = customer.city || '-';
    modal.querySelector('#customerEmail').textContent = customer.email || '-';
    modal.querySelector('#customerPhone').textContent = customer.phone || '-';

    // Carregar histórico de serviços e agendamentos pendentes
    await loadCustomerData(customerId);

    // Adicionar eventos aos botões
    modal.querySelector('#newServiceBtn').addEventListener('click', () => {
      console.log('Registrar Novo Serviço');
    });

    modal.querySelector('#contactClientBtn').addEventListener('click', () => {
      console.log('Contatar Cliente');
    });

    modal.querySelector('#rescheduleBtn').addEventListener('click', () => {
      console.log('Prorrogar Data do Recontato');
    });

    modal.querySelector('#neverBtn').addEventListener('click', () => {
      console.log('Cliente Não Tem Interesse');
    });

    modal.querySelector('#editClientBtn').addEventListener('click', () => {
      console.log('Editar Cliente');
    });

    // Adicionar eventos de fechamento
    const closeModal = () => modal.style.display = 'none';
    modal.querySelector('#closeModalBtn').addEventListener('click', closeModal);
    modal.querySelector('#closeModalFooterBtn').addEventListener('click', closeModal);

    // Exibir o modal
    modal.style.display = 'block';
  };

  // Expor a função show
  return { show };
})();

// Expor globalmente
window.CustomerDetailsModal = CustomerDetailsModal;
