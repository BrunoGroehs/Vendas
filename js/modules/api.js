const API_BASE_URL = 'http://localhost:3001/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao acessar a API');
  }
  return response.json();
}

const API = {
  // Customers
  getCustomers: () => fetchAPI('/customers'),
  getCustomerById: (id) => fetchAPI(`/customers/${id}`),
  createCustomer: (data) => fetchAPI('/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateCustomer: (id, data) => fetchAPI(`/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteCustomer: (id) => fetchAPI(`/customers/${id}`, { method: 'DELETE' }),

  // Services
  getServices: () => fetchAPI('/services'),
  getServiceById: (id) => fetchAPI(`/services/${id}`),
  createService: (data) => fetchAPI('/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateService: (id, data) => fetchAPI(`/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteService: (id) => fetchAPI(`/services/${id}`, { method: 'DELETE' }),
  getServicesByCustomerId: (customerId) => fetchAPI(`/services?customerId=${customerId}`),
    
  // Appointments
  getAppointments: () => fetchAPI('/appointments'),
  getAppointmentById: (id) => fetchAPI(`/appointments/${id}`),
  createAppointment: (data) => fetchAPI('/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateAppointment: (id, data) => fetchAPI(`/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteAppointment: (id) => fetchAPI(`/appointments/${id}`, { method: 'DELETE' }),
  getPendingAppointmentsByCustomerId: (customerId) => fetchAPI(`/appointments?customerId=${customerId}&status=PENDING`),

  // Expenses
  getExpenses: () => fetchAPI('/expenses'),
  getExpenseById: (id) => fetchAPI(`/expenses/${id}`),
  createExpense: (data) => fetchAPI('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateExpense: (id, data) => fetchAPI(`/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteExpense: (id) => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => fetchAPI('/notifications'),
  getNotificationById: (id) => fetchAPI(`/notifications/${id}`),
  createNotification: (data) => fetchAPI('/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateNotification: (id, data) => fetchAPI(`/notifications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteNotification: (id) => fetchAPI(`/notifications/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: () => fetchAPI('/users'),
  getUserById: (id) => fetchAPI(`/users/${id}`),
  createUser: (data) => fetchAPI('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateUser: (id, data) => fetchAPI(`/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteUser: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => fetchAPI('/settings'),
  updateSettings: (data) => fetchAPI('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
};

// Exponha o objeto API no escopo global
window.API = API;

console.log('api.js carregado com sucesso');
