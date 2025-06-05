import { db } from "./db";
import { calculations } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Script para limpar o banco de dados de simulações antigas
 * Mantém apenas as 15 simulações mais recentes
 */
async function cleanSimulations() {
  console.log("⏳ Iniciando limpeza das simulações antigas...");
  
  try {
    // 1. Listar todas as simulações, ordenadas por ID (mais recentes primeiro)
    const allCalculations = await db.execute(sql`
      SELECT id 
      FROM calculations 
      ORDER BY id DESC;
    `);
    
    const totalCalculations = allCalculations.rows.length;
    console.log(`📊 Encontradas ${totalCalculations} simulações no total.`);
    
    if (totalCalculations <= 15) {
      console.log("✅ Já existem 15 ou menos simulações. Nada a fazer.");
      return;
    }
    
    // 2. Identificar os IDs a manter (15 mais recentes)
    const idsToKeep = allCalculations.rows.slice(0, 15).map(row => row.id);
    console.log(`🔒 Mantendo as 15 simulações mais recentes: ${idsToKeep.join(', ')}`);
    
    // 3. Contar quantas serão excluídas
    const toDeleteCount = totalCalculations - 15;
    console.log(`🗑️ Excluindo ${toDeleteCount} simulações antigas.`);
    
    // 4. Deletar as simulações que não estão na lista de IDs a manter
    const deleteResult = await db.execute(sql`
      DELETE FROM calculations
      WHERE id NOT IN (${sql.join(idsToKeep, sql`, `)});
    `);
    
    console.log(`✅ Exclusão concluída. ${deleteResult.rowCount} simulações foram removidas.`);
    
    // 5. Verificar quantas simulações restaram
    const remainingCalculations = await db.execute(sql`
      SELECT COUNT(*) as count FROM calculations;
    `);
    
    console.log(`📊 Restaram ${remainingCalculations.rows[0].count} simulações no banco de dados.`);
    
  } catch (error) {
    console.error("❌ Erro ao limpar simulações:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

cleanSimulations();