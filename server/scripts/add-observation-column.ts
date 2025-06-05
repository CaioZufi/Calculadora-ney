import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Script para adicionar a coluna de observação à tabela de usuários do app
 */
async function addObservationColumn() {
  try {
    // Verificar se a coluna já existe
    const checkColumnSQL = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'app_users' AND column_name = 'observation';
    `;
    
    const columnExists = await db.execute(checkColumnSQL);
    
    if (columnExists.rows.length === 0) {
      console.log("Adicionando coluna 'observation' à tabela app_users...");
      
      // Adicionar a coluna
      const addColumnSQL = sql`
        ALTER TABLE app_users 
        ADD COLUMN observation TEXT;
      `;
      
      await db.execute(addColumnSQL);
      console.log("Coluna 'observation' adicionada com sucesso!");
    } else {
      console.log("A coluna 'observation' já existe na tabela app_users.");
    }
    
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar coluna de observação:", error);
  } finally {
    process.exit(0);
  }
}

// Executar a migração
addObservationColumn();