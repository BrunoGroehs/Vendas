// mockData.js: mock database for testing

// Usuários/Funcionários
const users = [
  { id: 1, name: 'Admin', email: 'admin@example.com', role: 'ADMIN', passwordHash: 'hash' },
  { id: 2, name: 'José Operador', email: 'jose@example.com', role: 'OPERATOR', passwordHash: 'hash' }
];

// Clientes
const customers = [
  { id: 1, name: 'João Silva', phone: '(11) 91234-5678', address: 'Rua A, 123', email: 'joao@example.com', city: 'São Paulo', state: 'SP', zip: '01234-567', createdAt: '2025-01-15', preferredChannel: 'SMS' },
  { id: 2, name: 'Maria Souza', phone: '(21) 99876-5432', address: 'Av. B, 456', email: 'maria@example.com', city: 'Rio de Janeiro', state: 'RJ', zip: '20000-000', createdAt: '2025-02-10', preferredChannel: 'EMAIL' },
  { id: 3, name: 'Carlos Lima', phone: '(31) 98765-4321', address: 'Praça C, 789', email: 'carlos@example.com', city: 'Belo Horizonte', state: 'MG', zip: '30000-000', createdAt: '2025-03-05', preferredChannel: 'SMS' },
  { id: 4, name: 'Ana Ferreira', phone: '(41) 97654-3210', address: 'Rua D, 101', email: 'ana@example.com', city: 'Curitiba', state: 'PR', zip: '80000-000', createdAt: '2025-03-20', preferredChannel: 'EMAIL' },
  { id: 5, name: 'Roberto Almeida', phone: '(51) 98888-7777', address: 'Av. E, 202', email: 'roberto@example.com', city: 'Porto Alegre', state: 'RS', zip: '90000-000', createdAt: '2025-04-05', preferredChannel: 'WHATSAPP' },
  { id: 6, name: 'Julia Santos', phone: '(19) 97777-8888', address: 'Rua F, 303', email: 'julia@example.com', city: 'Campinas', state: 'SP', zip: '13000-000', createdAt: '2025-04-15', preferredChannel: 'WHATSAPP' }
];

// Serviços realizados
const services = [
  { id: 1, customerId: 1, employeeId: 2, serviceDate: '2025-05-01', price: 150.00, commissionPct: 10, notes: 'Limpeza completa' },
  { id: 2, customerId: 2, employeeId: 2, serviceDate: '2025-04-15', price: 120.00, commissionPct: 15, notes: 'Limpeza express' },
  { id: 2, customerId: 2, employeeId: 2, serviceDate: '2026-04-15', price: 120.00, commissionPct: 15, notes: 'Limpeza express' },
  { id: 3, customerId: 3, employeeId: 2, serviceDate: '2025-04-20', price: 200.00, commissionPct: 10, notes: 'Limpeza completa + enceramento' },
  { id: 4, customerId: 1, employeeId: 2, serviceDate: '2025-03-01', price: 150.00, commissionPct: 10, notes: 'Limpeza regular' },
  { id: 5, customerId: 4, employeeId: 2, serviceDate: '2025-05-05', price: 180.00, commissionPct: 12, notes: 'Limpeza premium' }
];

// Próximos agendamentos
const appointments = [
  { id: 1, customerId: 1, scheduledFor: '2026-05-01T09:00', createdFromServiceId: 1, status: 'PENDING', notes: 'Limpeza anual' },
  { id: 2, customerId: 2, scheduledFor: '2026-04-15T14:30', createdFromServiceId: 2, status: 'PENDING', notes: 'Manutenção regular' },
  { id: 3, customerId: 3, scheduledFor: '2026-04-20T10:00', createdFromServiceId: 3, status: 'PENDING', notes: 'Limpeza completa' },
  { id: 4, customerId: 4, scheduledFor: '2025-05-15T15:45', createdFromServiceId: 5, status: 'PENDING', notes: 'Verificação pós-serviço' },
  { id: 5, customerId: 5, scheduledFor: '2025-05-12T09:30', createdFromServiceId: null, status: 'PENDING', notes: 'Orçamento inicial' },
  { id: 6, customerId: 6, scheduledFor: '2025-05-18T11:00', createdFromServiceId: null, status: 'PENDING', notes: 'Primeira visita' },
  { id: 7, customerId: 1, scheduledFor: '2025-05-10T14:00', createdFromServiceId: null, status: 'PENDING', notes: 'Verificação de garantia' },
  { id: 8, customerId: 3, scheduledFor: '2025-04-25T16:30', createdFromServiceId: null, status: 'PENDING', notes: 'Reparo emergencial' },
  { id: 9, customerId: 2, scheduledFor: '2025-05-05T10:15', createdFromServiceId: null, status: 'PENDING', notes: 'Manutenção preventiva' }
];

// Despesas
const expenses = [
  { id: 1, category: 'MATERIAL', amount: 320.00, paidAt: '2025-04-30', description: 'Sabão e esponja', employeeId: 2 },
  { id: 2, category: 'FUEL', amount: 150.00, paidAt: '2025-05-02', description: 'Combustível para visitas', employeeId: 2 },
  { id: 3, category: 'MATERIAL', amount: 200.00, paidAt: '2025-04-20', description: 'Produtos de limpeza', employeeId: 2 },
  { id: 4, category: 'OTHER', amount: 80.00, paidAt: '2025-05-01', description: 'Manutenção equipamentos', employeeId: 1 }
];

// Notificações enviadas
const notifications = [
  { id: 1, appointmentId: 4, channel: 'SMS', sentAt: '2025-05-08', status: 'SENT' }
];

// Configurações do sistema
const settings = {
  notificationDaysAhead: 7,
  defaultCommissionPct: 10,
  companyName: 'Lavagem Profissional'
};

// Expor banco de dados mockado globalmente
window.mockDB = { 
  users, 
  customers, 
  services, 
  appointments, 
  expenses, 
  notifications,
  settings
};