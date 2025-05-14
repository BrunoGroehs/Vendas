// Services module - Gerencia vendas/serviços e agendamentos
const ServicesModule = (() => {
  // Inicialização
  const init = () => {
    // Nada a fazer por enquanto
  };

  // Cadastra uma nova venda com agendamento futuro
  const addNewService = () => {
    // Obter clientes para seleção
    const customers = window.mockDB.customers;
    
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
    const defaultCommission = window.mockDB.settings.defaultCommissionPct;
    const commissionPct = parseInt(prompt(`Comissão (%)`, defaultCommission));
    
    // Criar ID para o novo serviço
    const newServiceId = Math.max(...window.mockDB.services.map(s => s.id), 0) + 1;
    
    // Data atual como string ISO
    const today = new Date().toISOString().split('T')[0];
    
    // Criar novo serviço
    const newService = {
      id: newServiceId,
      customerId: customer.id,
      employeeId: 2, // Fixo como José Operador por simplicidade
      serviceDate: today,
      price: price,
      commissionPct: commissionPct || defaultCommission,
      notes: notes
    };
    
    // Adicionar ao mock DB
    window.mockDB.services.push(newService);
    
    // Criar agendamento futuro (próxima limpeza em 1 ano)
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextServiceDate = nextYear.toISOString().split('T')[0];
    
    // Criar ID para o novo agendamento
    const newAppointmentId = Math.max(...window.mockDB.appointments.map(a => a.id), 0) + 1;
    
    // Criar agendamento
    const newAppointment = {
      id: newAppointmentId,
      customerId: customer.id,
      scheduledFor: nextServiceDate,
      createdFromServiceId: newServiceId,
      status: 'PENDING',
      notes: 'Próxima limpeza anual'
    };
    
    // Adicionar ao mock DB
    window.mockDB.appointments.push(newAppointment);
    
    // Mensagem de sucesso
    alert(`Venda registrada com sucesso!\nPróxima limpeza agendada para ${new Date(nextServiceDate).toLocaleDateString('pt-BR')}`);
    
    // Disparar evento para notificar outras partes da UI
    document.dispatchEvent(new CustomEvent('serviceAdded', { 
      detail: { service: newService, appointment: newAppointment }
    }));
    
    return { service: newService, appointment: newAppointment };
  };

  // Lista serviços por cliente
  const getServicesByCustomer = (customerId) => {
    return window.mockDB.services
      .filter(s => s.customerId === customerId)
      .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
  };

  // Calcula comissão de um serviço
  const calculateCommission = (service) => {
    return service.price * (service.commissionPct / 100);
  };

  // Marca um agendamento como concluído e cria nova venda
  const completeAppointment = (appointmentId) => {
    const appointment = window.mockDB.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
      alert('Agendamento não encontrado!');
      return;
    }
    
    // Atualiza o status
    appointment.status = 'DONE';
    
    const customer = window.mockDB.customers.find(c => c.id === appointment.customerId);
    if (!customer) {
      alert('Cliente não encontrado!');
      return;
    }
    
    // Perguntar se deseja registrar como venda concluída
    const shouldCreateService = confirm(`Marcar agendamento de ${customer.name} como concluído e registrar o serviço?`);
    
    if (shouldCreateService) {
      // Perguntar preço do serviço
      const price = parseFloat(prompt('Valor do serviço (R$):'));
      
      if (!isNaN(price) && price > 0) {
        const newServiceId = Math.max(...window.mockDB.services.map(s => s.id)) + 1;
        
        // Cria novo serviço
        const newService = {
          id: newServiceId,
          customerId: customer.id,
          employeeId: 2, // Fixo como José Operador
          serviceDate: new Date().toISOString().split('T')[0],
          price: price,
          commissionPct: window.mockDB.settings.defaultCommissionPct,
          notes: `Realizado a partir do agendamento #${appointmentId}`
        };
        
        window.mockDB.services.push(newService);
        
        // Perguntar se deve reagendar
        const shouldReschedule = confirm('Deseja agendar a próxima limpeza?');
        
        if (shouldReschedule) {
          const nextYear = new Date();
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          const nextServiceDate = nextYear.toISOString().split('T')[0];
          
          const newAppointmentId = Math.max(...window.mockDB.appointments.map(a => a.id)) + 1;
          
          const newAppointment = {
            id: newAppointmentId,
            customerId: customer.id,
            scheduledFor: nextServiceDate,
            createdFromServiceId: newServiceId,
            status: 'PENDING',
            notes: 'Próxima limpeza anual'
          };
          
          window.mockDB.appointments.push(newAppointment);
          
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
  };
  
  // Retorna próximos agendamentos
  const getUpcomingAppointments = (days = 30) => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    
    return window.mockDB.appointments
      .filter(a => a.status === 'PENDING')
      .filter(a => {
        const date = new Date(a.scheduledFor);
        return date >= now && date <= future;
      })
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  };

  // API pública
  return {
    init,
    addNewService,
    getServicesByCustomer,
    calculateCommission,
    completeAppointment,
    getUpcomingAppointments
  };
})();

// Exporta módulo
window.ServicesModule = ServicesModule;
