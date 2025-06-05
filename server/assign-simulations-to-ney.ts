import { db } from "./db";
import { calculations } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Script para associar as simulações antigas ao usuário Ney Prado (ID 1)
 * Isto corrige o problema das simulações antigas que não mostram o nome do usuário
 */
async function assignSimulationsToNey() {
  // ID do usuário Ney Prado
  const neyPradoId = 1;
  const neyPradoName = "Ney Prado";
  
  console.log("⏳ Iniciando associação das simulações antigas ao usuário Ney Prado...");
  
  try {
    // 1. Verificar simulações antigas (ID <= 108)
    const oldCalculations = await db.execute(sql`
      SELECT id, company_name, app_user_id, user_name 
      FROM calculations 
      WHERE id <= 108 
      ORDER BY id ASC;
    `);
    
    console.log(`📊 Encontradas ${oldCalculations.rows.length} simulações antigas para verificar.`);
    
    // 2. Associar ao usuário Ney Prado e atualizar o nome
    const updateResult = await db.execute(sql`
      UPDATE calculations
      SET app_user_id = ${neyPradoId}, user_name = ${neyPradoName}
      WHERE id <= 108;
    `);
    
    console.log("✅ Simulações antigas associadas ao usuário Ney Prado!");
    console.log(`📊 ${updateResult.rowCount} registros atualizados.`);
    
    // 3. Verificar se a atualização foi bem-sucedida
    const verifyUpdates = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM calculations 
      WHERE id <= 108 AND app_user_id = ${neyPradoId} AND user_name = ${neyPradoName};
    `);
    
    const updatedCount = verifyUpdates.rows[0]?.total || 0;
    console.log(`✅ ${updatedCount} simulações agora estão corretamente associadas ao Ney Prado.`);
    
    if (updatedCount < oldCalculations.rows.length) {
      console.log(`⚠️ Atenção: ${oldCalculations.rows.length - updatedCount} simulações não foram atualizadas corretamente.`);
    }
    
  } catch (error) {
    console.error("❌ Erro ao associar simulações ao usuário Ney Prado:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

assignSimulationsToNey();