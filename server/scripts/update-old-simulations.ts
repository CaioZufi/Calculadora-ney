import { db } from "../db";
import { calculations } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Script para atualizar nomes nas simulações antigas (ID <= 108)
 * Este script melhora a exibição no dashboard administrativo
 * para simulações antigas que mostram "Usuário não identificado"
 */
async function updateOldSimulations() {
  console.log("⏳ Iniciando atualização das simulações antigas...");
  
  try {
    // 1. Verificar registros problemáticos (ID <= 108 sem userName preenchido)
    const oldCalculations = await db.execute(sql`
      SELECT id, company_name, app_user_id, user_name 
      FROM calculations 
      WHERE id <= 108 
      ORDER BY id ASC;
    `);
    
    console.log(`📊 Encontradas ${oldCalculations.rows.length} simulações antigas para verificar.`);
    console.log("   Primeiros 5 registros:", oldCalculations.rows.slice(0, 5));
    
    // 2. Atualizar registros sem nome de usuário para um texto mais amigável
    const updateResult = await db.execute(sql`
      UPDATE calculations
      SET user_name = 'Simulação Anterior'
      WHERE id <= 108 AND (user_name IS NULL OR user_name = '' OR user_name = 'Usuário não identificado');
    `);
    
    console.log("✅ Simulações antigas atualizadas com nome amigável!");
    console.log("📊 Resultado da atualização:", updateResult);
    
    // 3. Verificar se restam registros problemáticos
    const remainingIssues = await db.execute(sql`
      SELECT id, company_name, user_name
      FROM calculations 
      WHERE id <= 108 AND (user_name IS NULL OR user_name = '' OR user_name = 'Usuário não identificado');
    `);
    
    if (remainingIssues.rows.length > 0) {
      console.log(`⚠️ Ainda existem ${remainingIssues.rows.length} registros que não foram atualizados.`);
    } else {
      console.log("✅ Todos os registros antigos foram atualizados com sucesso!");
    }
    
  } catch (error) {
    console.error("❌ Erro ao atualizar simulações antigas:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

updateOldSimulations();