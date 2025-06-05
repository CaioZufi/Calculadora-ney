import { db } from '../db';
import { sql } from 'drizzle-orm';

async function updateDatabase() {
  try {
    // Adiciona colunas para r1_tire_lifespan e r2_tire_lifespan caso não existam
    await db.execute(sql`
      ALTER TABLE IF EXISTS "calculations" 
      ADD COLUMN IF NOT EXISTS "r1_tire_lifespan" INTEGER,
      ADD COLUMN IF NOT EXISTS "r2_tire_lifespan" INTEGER;
    `);
    
    console.log('Banco de dados atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar o banco de dados:', error);
  } finally {
    process.exit(0);
  }
}

updateDatabase();