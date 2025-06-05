import { db } from "./db";
import { calculations, appUsers } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Script para atualizar os nomes de usuários nos cálculos existentes
 * Isso garantirá que mesmo após a exclusão do usuário, seu nome ficará preservado
 */
async function updateUserNames() {
  console.log("⏳ Iniciando atualização dos nomes de usuários nos cálculos...");
  
  try {
    // Atualizar a coluna user_name para cálculos existentes, usando o nome do usuário vinculado
    const result = await db.execute(sql`
      UPDATE calculations c
      SET user_name = CONCAT(a.first_name, ' ', a.last_name)
      FROM app_users a
      WHERE c.app_user_id = a.id AND (c.user_name IS NULL OR c.user_name = '');
    `);
    
    console.log("✅ Nomes de usuários atualizados nos cálculos existentes!");
    console.log("📊 Resultado:", result);
    
    // Verificar quais cálculos ainda não têm nome de usuário
    const missingNames = await db.execute(sql`
      SELECT id, company_name, app_user_id 
      FROM calculations 
      WHERE user_name IS NULL OR user_name = '';
    `);
    
    console.log("📋 Cálculos sem nome de usuário:", missingNames.rows.length);
    if (missingNames.rows.length > 0) {
      console.log("   Primeiros 5 registros:", missingNames.rows.slice(0, 5));
    }
    
  } catch (error) {
    console.error("❌ Erro ao atualizar nomes de usuários:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

updateUserNames();