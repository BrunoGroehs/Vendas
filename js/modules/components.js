// Components module - Componentes reutilizáveis para a aplicação
const ComponentsModule = (() => {
  // Formatação de datas
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    // Verifica se a data tem informação de hora (formato com T)
    if (dateStr.includes('T')) {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR');
  };

  // Função para mostrar detalhes do cliente em um modal
  const showCustomerDetailsModal = (customerId, onClose = null) => {
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
              <p><strong>Telefone:</strong> ${customer.phone}</p>
              <p><strong>Email:</strong> ${customer.email || '-'}</p>
              <p><strong>Endereço:</strong> ${customer.address}</p>
              <p><strong>Cidade:</strong> ${customer.city} - ${customer.state}</p>
              <p><strong>CEP:</strong> ${customer.zip || '-'}</p>
              <p><strong>Canal preferido:</strong> ${customer.preferredChannel}</p>
            </div>
            
            <div class="customer-services">
              <h3>Histórico de Serviços</h3>
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
          <button class="btn btn--accent" id="contactBtn">Contatar Cliente</button>
          <button class="btn" id="rescheduleBtn">Prorrogar Data de Recontato</button>
          <button class="btn btn--danger" id="neverBtn">Cliente Não Tem Interesse</button>
          <button class="btn" id="closeModalBtn">Fechar</button>
        </div>
      </div>
    `;
    
    // Inserir modal no DOM
    document.body.appendChild(modal);
    
    // Adicionar event listeners aos botões
    modal.querySelector('.modal__close').addEventListener('click', () => {
      document.body.removeChild(modal);
      if (onClose && typeof onClose === 'function') onClose();
    });
    
    modal.querySelector('#closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      if (onClose && typeof onClose === 'function') onClose();
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

    // Botão para contatar o cliente via WhatsApp
    modal.querySelector('#contactBtn').addEventListener('click', () => {
      // Formatar número para WhatsApp (remover caracteres não numéricos)
      const whatsappNumber = customer.phone.replace(/\D/g, '');
      // Criar mensagem personalizada
      const message = `Olá ${customer.name}, tudo bem? Somos da Lavagem Profissional.`;
      // Abrir WhatsApp
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    });
    
    // Botão de prorrogação de recontato
    modal.querySelector('#rescheduleBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      if (window.DashboardModule && typeof window.DashboardModule.rescheduleCustomerAppointment === 'function') {
        window.DashboardModule.rescheduleCustomerAppointment(customer.id);
      } else if (window.NotificationsModule && typeof window.NotificationsModule.rescheduleCustomerAppointment === 'function') {
        window.NotificationsModule.rescheduleCustomerAppointment(customer.id);
      } else {
        window.showToast('Prorrogação de recontato em implementação', 'warning');
      }
    });
    
    // Botão para marcar cliente como "não tem interesse"
    modal.querySelector('#neverBtn').addEventListener('click', () => {
      // Confirmar antes de marcar como "Não tem interesse"
      if (confirm(`Tem certeza que deseja marcar ${customer.name} como "Cliente Não Tem Interesse"?`)) {
        if (window.DashboardModule && typeof window.DashboardModule.markCustomerAsNever === 'function') {
          window.DashboardModule.markCustomerAsNever(customer.id);
        } else if (window.NotificationsModule && typeof window.NotificationsModule.markCustomerAsNever === 'function') {
          window.NotificationsModule.markCustomerAsNever(customer.id);
        } else {
          window.showToast('Função em implementação', 'warning');
        }
        document.body.removeChild(modal);
      }
    });
    
    // Botões para ver agendamentos
    const appointmentBtns = modal.querySelectorAll('.view-appointment');
    appointmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const appointmentId = parseInt(btn.dataset.appointmentId);
        document.body.removeChild(modal);
        
        if (window.DashboardModule && typeof window.DashboardModule.showAppointmentDetails === 'function') {
          window.DashboardModule.showAppointmentDetails(appointmentId);
        } else if (window.NotificationsModule && typeof window.NotificationsModule.showAppointmentDetails === 'function') {
          window.NotificationsModule.showAppointmentDetails(appointmentId);
        } else {
          window.showToast('Visualização de agendamento em implementação', 'warning');
        }
      });
    });
    
    // Fechar ao clicar fora do conteúdo
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        if (onClose && typeof onClose === 'function') onClose();
      }
    });

    return modal;
  };

  // Exportar métodos públicos
  return {
    showCustomerDetailsModal
  };
})();

// Exportar globalmente
window.ComponentsModule = ComponentsModule;