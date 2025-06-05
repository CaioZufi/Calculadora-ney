import { db } from "../db";
import { calculations } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Script para atualizar registros antigos de cálculos 
 * Definindo um nome amigável para registros sem usuário vinculado
 */
async function updateOldCalculations() {
  console.log("⏳ Iniciando atualização de cálculos antigos...");
  
  try {
    // Atualizar cálculos antigos que não têm user_name nem app_user_id
    const result = await db.execute(sql`
      UPDATE calculations
      SET user_name = 'Usuário não identificado'
      WHERE (user_name IS NULL OR user_name = '')
      AND app_user_id IS NULL;
    `);
    
    console.log("✅ Cálculos antigos atualizados!");
    console.log("📊 Registros atualizados:", result.rowCount);
    
    // Verificar se ainda existem cálculos sem nome de usuário
    const missingNames = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM calculations 
      WHERE user_name IS NULL OR user_name = '';
    `);
    
    console.log("📋 Cálculos restantes sem nome de usuário:", missingNames.rows[0].count);
    
  } catch (error) {
    console.error("❌ Erro ao atualizar cálculos antigos:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

updateOldCalculations();