import { pool } from "../db";

/**
 * Script para adicionar colunas de fontes de informação ao banco de dados
 */
async function addSourcesColumns() {
  try {
    const client = await pool.connect();
    
    try {
      console.log("Iniciando migração para adicionar colunas de fontes de informação...");
      
      // Verificar se a coluna já existe antes de adicionar
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'calculations' 
        AND column_name = 'fuel_savings_source'
      `;
      
      const result = await client.query(checkQuery);
      
      if (result.rows.length === 0) {
        // Adicionar as colunas de fontes de informação
        const alterTableQuery = `
          ALTER TABLE calculations 
          ADD COLUMN IF NOT EXISTS fuel_savings_source TEXT,
          ADD COLUMN IF NOT EXISTS cpk_improvement_source TEXT,
          ADD COLUMN IF NOT EXISTS carcass_savings_source TEXT
        `;
        
        await client.query(alterTableQuery);
        console.log("Colunas de fontes de informação adicionadas com sucesso!");
      } else {
        console.log("Colunas de fontes de informação já existem na tabela.");
      }
      
      console.log("Migração concluída com sucesso!");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao executar migração:", error);
    throw error;
  }
}

// Executar a migração imediatamente
addSourcesColumns()
  .then(() => {
    console.log("Migração concluída, encerrando script");
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((error) => {
    console.error("Falha na migração:", error);
    setTimeout(() => process.exit(1), 1000);
  });

export default addSourcesColumns;