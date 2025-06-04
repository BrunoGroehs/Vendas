// backend/index.js
// Exemplo de API Express para expor dados do banco Neon
require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// CRUD para Customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/customers/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email, address, city, state, zip, preferredChannel } = req.body;
    const result = await db.query(
      'INSERT INTO customers (name, phone, email, address, city, state, zip, preferredChannel) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, phone, email, address, city, state, zip, preferredChannel]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, email, address, city, state, zip, preferredChannel } = req.body;
    const result = await db.query(
      'UPDATE customers SET name=$1, phone=$2, email=$3, address=$4, city=$5, state=$6, zip=$7, preferredChannel=$8 WHERE id=$9 RETURNING *',
      [name, phone, email, address, city, state, zip, preferredChannel, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/customers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD para Services
app.get('/api/services', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/services/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/services', async (req, res) => {
  try {
    const { customerId, employeeId, serviceDate, price, commissionPct, notes } = req.body;
    const result = await db.query(
      'INSERT INTO services (customerId, employeeId, serviceDate, price, commissionPct, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [customerId, employeeId, serviceDate, price, commissionPct, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/services/:id', async (req, res) => {
  try {
    const { customerId, employeeId, serviceDate, price, commissionPct, notes } = req.body;
    const result = await db.query(
      'UPDATE services SET customerId=$1, employeeId=$2, serviceDate=$3, price=$4, commissionPct=$5, notes=$6 WHERE id=$7 RETURNING *',
      [customerId, employeeId, serviceDate, price, commissionPct, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/services/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar todos os serviços de um cliente específico
app.get('/api/services/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await db.query('SELECT * FROM services WHERE customerid = $1', [customerId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD para Appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const { customerId, status } = req.query;
    let query = 'SELECT * FROM appointments';
    let params = [];
    if (customerId && status) {
      query += ' WHERE customerid = $1 AND status = $2';
      params = [customerId, status];
    } else if (customerId) {
      query += ' WHERE customerid = $1';
      params = [customerId];
    } else if (status) {
      query += ' WHERE status = $1';
      params = [status];
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/appointments', async (req, res) => {
  try {
    const { customerId, scheduledFor, createdFromServiceId, status, notes } = req.body;
    const result = await db.query(
      'INSERT INTO appointments (customerId, scheduledFor, createdFromServiceId, status, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [customerId, scheduledFor, createdFromServiceId, status, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { customerId, scheduledFor, createdFromServiceId, status, notes } = req.body;
    const result = await db.query(
      'UPDATE appointments SET customerId=$1, scheduledFor=$2, createdFromServiceId=$3, status=$4, notes=$5 WHERE id=$6 RETURNING *',
      [customerId, scheduledFor, createdFromServiceId, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD para Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM expenses');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/expenses/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/expenses', async (req, res) => {
  try {
    const { category, amount, paidAt, description, employeeId } = req.body;
    const result = await db.query(
      'INSERT INTO expenses (category, amount, paidAt, description, employeeId) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [category, amount, paidAt, description, employeeId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { category, amount, paidAt, description, employeeId } = req.body;
    const result = await db.query(
      'UPDATE expenses SET category=$1, amount=$2, paidAt=$3, description=$4, employeeId=$5 WHERE id=$6 RETURNING *',
      [category, amount, paidAt, description, employeeId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD para Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/notifications/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/notifications', async (req, res) => {
  try {
    const { appointmentId, channel, sentAt, status } = req.body;
    const result = await db.query(
      'INSERT INTO notifications (appointmentId, channel, sentAt, status) VALUES ($1,$2,$3,$4) RETURNING *',
      [appointmentId, channel, sentAt, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/notifications/:id', async (req, res) => {
  try {
    const { appointmentId, channel, sentAt, status } = req.body;
    const result = await db.query(
      'UPDATE notifications SET appointmentId=$1, channel=$2, sentAt=$3, status=$4 WHERE id=$5 RETURNING *',
      [appointmentId, channel, sentAt, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD para Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const result = await db.query(
      'INSERT INTO users (name, email, phone, role) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, phone, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const result = await db.query(
      'UPDATE users SET name=$1, email=$2, phone=$3, role=$4 WHERE id=$5 RETURNING *',
      [name, email, phone, role, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET e PUT para Settings (apenas 1 registro)
app.get('/api/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings LIMIT 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/settings', async (req, res) => {
  try {
    const { notificationDaysAhead, defaultCommissionPct, companyName } = req.body;
    const result = await db.query(
      'UPDATE settings SET notificationDaysAhead=$1, defaultCommissionPct=$2, companyName=$3 RETURNING *',
      [notificationDaysAhead, defaultCommissionPct, companyName]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
