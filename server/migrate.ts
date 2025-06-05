import { db } from "./db";
import { users, calculations, sessions, appUsers } from "@shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("⏳ Iniciando migração do banco de dados...");
  
  try {
    // Criando tabelas
    console.log("🔄 Criando tabela de usuários se não existir...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    
    console.log("🔄 Criando tabela de cálculos se não existir...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        session_id TEXT,
        company_name TEXT NOT NULL,
        fleet_size INTEGER NOT NULL,
        total_tires INTEGER NOT NULL,
        fuel_consumption REAL NOT NULL,
        fuel_price REAL NOT NULL,
        monthly_mileage INTEGER NOT NULL,
        tire_lifespan INTEGER NOT NULL,
        tire_price REAL NOT NULL,
        retread_price REAL NOT NULL,
        tire_pressure_check TEXT NOT NULL,
        retreading_cycles TEXT NOT NULL,
        savings_per_tire_per_month REAL NOT NULL,
        cpk_improvement REAL NOT NULL,
        fuel_savings REAL NOT NULL,
        carcass_savings REAL NOT NULL,
        total_savings REAL NOT NULL,
        new_tire_cycle REAL NOT NULL,
        r1_tire_cycle REAL NOT NULL,
        r2_tire_cycle REAL NOT NULL,
        submitted_at TEXT NOT NULL
      );
    `);
    
    console.log("🔄 Criando tabela de sessões se não existir...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        last_calculation_id INTEGER,
        last_updated TEXT NOT NULL
      );
    `);
    
    console.log("🔄 Criando tabela de usuários do app se não existir...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
      );
    `);

    // Verificar se todas as colunas necessárias existem na tabela calculations
    console.log("🔄 Verificando se as colunas necessárias existem na tabela calculations...");
    try {
      // Primeiro vamos garantir que a tabela tenha todas as colunas definidas no schema
      await db.execute(sql`
        ALTER TABLE calculations 
        ADD COLUMN IF NOT EXISTS session_id TEXT;
      `);
      console.log("✅ Coluna session_id verificada/adicionada com sucesso!");
      
      // Verificar coluna total_tires
      await db.execute(sql`
        ALTER TABLE calculations 
        ADD COLUMN IF NOT EXISTS total_tires INTEGER;
      `);
      console.log("✅ Coluna total_tires verificada/adicionada com sucesso!");
      
      // Adicionar coluna app_user_id para rastrear qual usuário fez o cálculo
      await db.execute(sql`
        ALTER TABLE calculations 
        ADD COLUMN IF NOT EXISTS app_user_id INTEGER;
      `);
      console.log("✅ Coluna app_user_id verificada/adicionada com sucesso!");
      
      // Verificar coluna is_admin na tabela app_users
      await db.execute(sql`
        ALTER TABLE app_users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
      `);
      console.log("✅ Coluna is_admin verificada/adicionada com sucesso!");
      
      // Adicionar coluna user_name para manter o registro do nome do usuário mesmo após a exclusão
      await db.execute(sql`
        ALTER TABLE calculations 
        ADD COLUMN IF NOT EXISTS user_name TEXT;
      `);
      console.log("✅ Coluna user_name verificada/adicionada com sucesso!");
      
      // Atualizar a coluna user_name para cálculos existentes com base nos usuários vinculados
      await db.execute(sql`
        UPDATE calculations c
        SET user_name = CONCAT(a.first_name, ' ', a.last_name)
        FROM app_users a
        WHERE c.app_user_id = a.id AND c.user_name IS NULL;
      `);
      console.log("✅ Valores de user_name atualizados para cálculos existentes");
      
      // Verificar se há registros existentes com total_tires NULL e preencher
      await db.execute(sql`
        UPDATE calculations 
        SET total_tires = fleet_size * 6 
        WHERE total_tires IS NULL;
      `);
      console.log("✅ Valores de total_tires atualizados onde necessário");
    } catch (error) {
      console.error("❌ Erro ao verificar/adicionar colunas necessárias:", error);
    }
    
    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  } finally {
    // Fechando conexão com o banco de dados
    await db.execute(sql`SELECT 1`).then(() => {
      console.log("🔄 Fechando conexão com o banco de dados...");
    });
    process.exit(0);
  }
}

main();