// Notifications module - Gerencia o envio de notificações
const NotificationsModule = (() => {
  // Inicialização
  const init = () => {
    // Nada a fazer por enquanto
  };

  // Verifica agendamentos próximos e envia notificações
  const checkUpcomingAppointments = () => {
    const db = window.mockDB;
    const today = new Date();
    
    // Define data limite com base na configuração do sistema (notificationDaysAhead)
    const daysAhead = db.settings.notificationDaysAhead || 7;
    const limitDate = new Date();
    limitDate.setDate(today.getDate() + daysAhead);
    
    // Filtra agendamentos pendentes dentro do período
    const upcomingAppointments = db.appointments
      .filter(a => a.status === 'PENDING')
      .filter(a => {
        const scheduleDate = new Date(a.scheduledFor);
        // Verifica se está no intervalo e se ainda não foi notificado
        return scheduleDate <= limitDate && scheduleDate >= today;
      });
    
    // Para cada agendamento próximo, verifica se já existe notificação
    const notificationsToSend = upcomingAppointments.filter(appointment => {
      return !db.notifications.some(n => n.appointmentId === appointment.id);
    });
    
    // Registra e "envia" as notificações
    const sentNotifications = [];
    
    notificationsToSend.forEach(appointment => {
      const customer = db.customers.find(c => c.id === appointment.customerId);
      if (!customer) return;
      
      // Escolhe canal preferido do cliente
      const channel = customer.preferredChannel || 'SMS';
      
      // Cria ID para nova notificação
      const newId = db.notifications.length ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1;
      
      // Registra a notificação
      const notification = {
        id: newId,
        appointmentId: appointment.id,
        channel,
        sentAt: new Date().toISOString(),
        status: 'SENT' // Em um sistema real, depende da resposta da API de envio
      };
      
      // Adiciona ao mock DB
      db.notifications.push(notification);
      sentNotifications.push({ notification, customer, appointment });
    });
    
    return sentNotifications;
  };

  // Simula o envio de uma notificação
  const sendNotification = (customerId, message) => {
    const customer = window.mockDB.customers.find(c => c.id === customerId);
    if (!customer) {
      console.error('Cliente não encontrado');
      return false;
    }
    
    const channel = customer.preferredChannel || 'SMS';
    
    // Em um sistema real, isso enviaria via Twilio, email, etc
    console.log(`[${channel}] Enviando para ${customer.name}: ${message}`);
    
    // Registra a notificação manual
    const newId = window.mockDB.notifications.length 
      ? Math.max(...window.mockDB.notifications.map(n => n.id)) + 1 
      : 1;
      
    const notification = {
      id: newId,
      appointmentId: null, // null pois é manual
      channel,
      sentAt: new Date().toISOString(),
      status: 'SENT',
      message // campo adicional para notificações manuais
    };
    
    window.mockDB.notifications.push(notification);
    
    alert(`Notificação enviada com sucesso para ${customer.name} via ${channel}`);
    return notification;
  };

  // Executa o job de notificações (simulado)
  const runNotificationJob = () => {
    const notifications = checkUpcomingAppointments();
    
    if (notifications.length === 0) {
      alert('Não há agendamentos para notificar hoje.');
      return [];
    }
    
    // Exibe relatório
    alert(`Notificações enviadas: ${notifications.length}\n\n` + 
      notifications.map(n => 
        `- ${n.customer.name}: ${new Date(n.appointment.scheduledFor).toLocaleDateString('pt-BR')} via ${n.notification.channel}`
      ).join('\n')
    );
    
    return notifications;
  };

  // API pública
  return {
    init,
    checkUpcomingAppointments,
    sendNotification,
    runNotificationJob
  };
})();

// Exporta módulo
window.NotificationsModule = NotificationsModule;
