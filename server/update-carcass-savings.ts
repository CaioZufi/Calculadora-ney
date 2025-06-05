/**
 * Script para atualizar o valor de economia na carcaça para 10%
 * Este script corrige os valores antigos (33%) para o novo padrão (10%)
 */

import { db } from './db';
import { calculations } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function updateCarcassSavingsPercentage() {
  try {
    console.log('Iniciando a atualização dos valores de economia na carcaça...');
    
    // Obter todos os cálculos com valor 33% de economia na carcaça
    const calculationsToUpdate = await db
      .select()
      .from(calculations)
      .where(eq(calculations.carcassSavingsPercentage, 33));
    
    console.log(`Encontrados ${calculationsToUpdate.length} cálculos com 33% de economia na carcaça`);
    
    // Atualizar cada cálculo para o novo valor padrão de 10%
    if (calculationsToUpdate.length > 0) {
      for (const calc of calculationsToUpdate) {
        await db
          .update(calculations)
          .set({
            carcassSavingsPercentage: 10
          })
          .where(eq(calculations.id, calc.id));
        
        console.log(`Atualizado cálculo ID ${calc.id} - Usuário: ${calc.userName || 'Desconhecido'}`);
      }
      
      console.log('Atualização concluída com sucesso!');
    } else {
      console.log('Nenhum valor para atualizar.');
    }
    
  } catch (error) {
    console.error('Erro ao atualizar valores de economia na carcaça:', error);
  } finally {
    process.exit(0);
  }
}

// Executar o script
updateCarcassSavingsPercentage();