import { db } from "../db";
import { calculations, appUsers } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Script para atualizar simulações sem usuário identificado
 * Definindo um nome padrão para simulações não associadas a um usuário
 */
async function updateAnonymousCalculations() {
  try {
    console.log("Iniciando atualização de simulações anônimas...");
    
    // 1. Encontrar todas as simulações sem nome de usuário
    const anonCalculations = await db
      .select({
        id: calculations.id,
        appUserId: calculations.appUserId,
        userName: calculations.userName
      })
      .from(calculations)
      .where(isNull(calculations.userName));
    
    console.log(`Encontradas ${anonCalculations.length} simulações sem nome de usuário`);
    
    // 2. Para cada simulação, verificar se tem appUserId
    let updatedWithName = 0;
    let updatedDefault = 0;
    
    for (const calc of anonCalculations) {
      if (calc.appUserId) {
        // Buscar usuário no banco de dados
        const [user] = await db
          .select()
          .from(appUsers)
          .where(eq(appUsers.id, calc.appUserId));
        
        if (user) {
          // Atualizar com o nome do usuário
          const userName = `${user.firstName} ${user.lastName}`;
          await db
            .update(calculations)
            .set({ userName })
            .where(eq(calculations.id, calc.id));
          
          updatedWithName++;
          console.log(`Cálculo #${calc.id} atualizado com o usuário: ${userName}`);
        } else {
          // Usuário não encontrado, mas tinha ID - definir como "Usuário removido"
          await db
            .update(calculations)
            .set({ userName: "Usuário removido" })
            .where(eq(calculations.id, calc.id));
          
          updatedDefault++;
          console.log(`Cálculo #${calc.id} atualizado como "Usuário removido" (ID existia mas usuário não encontrado)`);
        }
      } else {
        // Não tem appUserId - definir como "Usuário não identificado"
        await db
          .update(calculations)
          .set({ userName: "Usuário não identificado" })
          .where(eq(calculations.id, calc.id));
        
        updatedDefault++;
        console.log(`Cálculo #${calc.id} atualizado como "Usuário não identificado"`);
      }
    }
    
    console.log("\nResumo da atualização:");
    console.log(`- Total de simulações processadas: ${anonCalculations.length}`);
    console.log(`- Atualizadas com nomes reais: ${updatedWithName}`);
    console.log(`- Atualizadas com nome padrão: ${updatedDefault}`);
    console.log("Atualização concluída com sucesso!\n");
    
  } catch (error) {
    console.error("Erro ao atualizar simulações anônimas:", error);
  } finally {
    process.exit(0);
  }
}

updateAnonymousCalculations();