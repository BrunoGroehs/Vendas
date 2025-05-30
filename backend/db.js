// backend/db.js
// Módulo de conexão com o banco de dados Neon
// Edite as variáveis de ambiente para suas credenciais Neon

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL, // Defina esta variável no .env
  ssl: {
    rejectUnauthorized: false
  }
});

// Testa a conexão ao inicializar o módulo
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco Neon:', err.message);
  } else {
    console.log('Conexão com o banco Neon estabelecida com sucesso!');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};