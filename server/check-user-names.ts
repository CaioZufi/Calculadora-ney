import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Script para verificar o estado atual dos nomes de usuários nos cálculos
 */
async function checkUserNames() {
  console.log("⏳ Verificando nomes de usuários nos cálculos...");
  
  try {
    // Buscar registros com nomes de usuário que são iguais aos nomes de empresas
    const duplicatedNames = await db.execute(sql`
      SELECT id, company_name, user_name
      FROM calculations 
      WHERE user_name = CONCAT('Cliente ', company_name);
    `);
    
    console.log("📊 Registros com nomes duplicados:", duplicatedNames.rows.length);
    if (duplicatedNames.rows.length > 0) {
      console.log("Primeiros 5 registros duplicados:", duplicatedNames.rows.slice(0, 5));
      
      // Corrigir registros duplicados
      if (duplicatedNames.rows.length > 0) {
        console.log("🔧 Corrigindo registros com nomes duplicados...");
        const updateResult = await db.execute(sql`
          UPDATE calculations
          SET user_name = 'Usuário não identificado'
          WHERE user_name = CONCAT('Cliente ', company_name);
        `);
        console.log("✅ Registros corrigidos:", updateResult.rowCount);
      }
    }
    
    // Estatísticas gerais
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN user_name IS NULL OR user_name = '' THEN 1 END) as missing,
        COUNT(CASE WHEN user_name = 'Usuário não identificado' THEN 1 END) as unidentified,
        COUNT(CASE WHEN app_user_id IS NOT NULL THEN 1 END) as with_user_id
      FROM calculations;
    `);
    
    console.log("📈 Estatísticas gerais:", stats.rows[0]);
    
  } catch (error) {
    console.error("❌ Erro ao verificar nomes de usuários:", error);
  } finally {
    process.exit(0);
  }
}

checkUserNames();