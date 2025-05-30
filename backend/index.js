// backend/index.js
// Exemplo de API Express para expor dados do banco Neon
require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Exemplo de rota para buscar clientes
app.get('/api/customers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exemplo de rota para buscar serviços
app.get('/api/services', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exemplo de rota para buscar despesas
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM expenses');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exemplo de rota para buscar agendamentos
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM appointments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
