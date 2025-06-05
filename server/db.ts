import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL deve estar configurado. Você esqueceu de criar um banco de dados?"
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // Aumentar tempo limite de conexão para 10 segundos
  max: 20, // Aumentar máximo de conexões
  idleTimeoutMillis: 30000, // Tempo limite de conexões ociosas
});
export const db = drizzle(pool, { schema });