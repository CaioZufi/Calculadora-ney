import { pool } from './db';

async function testConnection() {
  try {
    console.log('Testando conexão com o banco de dados...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('Conexão com o banco de dados bem-sucedida!');
      console.log('Resposta:', result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();