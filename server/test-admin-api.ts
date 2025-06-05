import { db } from "./db";
import { calculations } from "@shared/schema";
import { count, sql, desc } from "drizzle-orm";

/**
 * Script para testar diretamente a API que o dashboard administrativo usa
 * Isso ajudará a verificar se a consulta está retornando os dados corretos
 */
async function testAdminDashboardAPI() {
  console.log("⏳ Testando a API do dashboard administrativo...");
  
  try {
    // Verificar total de registros
    const countResult = await db.select({ count: count() }).from(calculations);
    const totalRecords = countResult[0]?.count || 0;
    console.log(`📊 Total de registros na tabela: ${totalRecords}`);
    
    // Simular a mesma consulta que a API usa
    const page = 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;
    
    const baseQuery = {
      id: calculations.id,
      companyName: calculations.companyName,
      fleetSize: calculations.fleetSize,
      totalTires: calculations.totalTires,
      submittedAt: calculations.submittedAt,
      savingsPerTirePerMonth: calculations.savingsPerTirePerMonth,
      totalSavings: calculations.totalSavings,
      appUserId: calculations.appUserId,
      userName: calculations.userName
    };
    
    // Executar a consulta
    const results = await db.select(baseQuery)
      .from(calculations)
      .orderBy(desc(calculations.submittedAt))
      .limit(perPage)
      .offset(offset);
    
    console.log(`🔍 Resultados da consulta (página ${page}, ${perPage} por página):`);
    console.log(`📋 Encontrados ${results.length} registros:`);
    
    results.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}, Empresa: ${record.companyName}, Usuário: ${record.userName}`);
    });
    
    // Verificar se há alguma discrepância entre o total de registros e a consulta paginada
    if (results.length !== Math.min(perPage, totalRecords)) {
      console.log(`⚠️ AVISO: Número de resultados (${results.length}) não corresponde ao esperado (${Math.min(perPage, totalRecords)})`);
    } else {
      console.log("✅ Número de resultados corresponde ao esperado.");
    }
    
    // Verificar IDs das simulações
    console.log("\n📋 IDs de todas as simulações no banco:");
    const allIds = await db.select({ id: calculations.id })
      .from(calculations)
      .orderBy(calculations.id);
    
    console.log(allIds.map(row => row.id).join(", "));
    
  } catch (error) {
    console.error("❌ Erro ao testar API do dashboard:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

testAdminDashboardAPI();