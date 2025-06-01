// Lógica para o modal de detalhes do cliente
const CustomerDetailsModal = (() => {
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
    if (!customer) {
      console.error('Cliente não encontrado:', customerId);
      return;
    }

    // Preencher os dados no modal
    modal.querySelector('#modalCustomerName').textContent = customer.name;
    modal.querySelector('#customerName').textContent = customer.name;
    modal.querySelector('#appointmentDate').textContent = 'N/A'; // Exemplo, pode ser ajustado
    modal.querySelector('#appointmentStatus').textContent = 'N/A';
    modal.querySelector('#appointmentNotes').textContent = 'N/A';

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
