import { CalculatorFormData, SavingsResult } from "@shared/schema";

/**
 * Calculates the potential savings based on the given form data.
 * Note: This is a client-side implementation for immediate feedback only.
 * The actual calculation logic should be duplicated on the server side.
 */
export function calculateSavings(data: CalculatorFormData): SavingsResult {
  // Valores padrão para as variáveis, caso não sejam fornecidas
  const fuelSavingsPercentage = data.fuelSavingsPercentage !== undefined ? data.fuelSavingsPercentage : 1; // padrão: 1%
  const cpkImprovementPercentage = data.cpkImprovementPercentage !== undefined ? data.cpkImprovementPercentage : 5; // padrão: 5%
  const carcassSavingsPercentage = data.carcassSavingsPercentage !== undefined ? data.carcassSavingsPercentage : 10; // padrão: 10%
  
  console.log("Cliente - Usando variáveis de cálculo:", {
    fuelSavingsPercentage,
    cpkImprovementPercentage,
    carcassSavingsPercentage
  });
  
  // Cálculo da economia de combustível (fórmula corrigida): 
  // (quilômetros por mês ÷ consumo) × preço do diesel × quantidade de cavalos/ônibus × % configurável
  // Nota: consumo está em km/L (ou seja, 1,2 significa 1,2 quilômetros por litro)
  const fuelSavings = (data.monthlyMileage / data.fuelConsumption) * data.fuelPrice * data.fleetSize * (fuelSavingsPercentage / 100);
  
  // Cálculo da melhoria no CPK (nova fórmula corrigida)
  // 1. Calcular quilometragem total do ciclo do pneu
  // 2. Calcular ganho em quilômetros (km total * percentual melhoria)
  // 3. Calcular custo por km (custo total / km total)
  // 4. Calcular economia mensal (km ganhos por mês * custo por km * total de pneus)
  
  // Determinar número de recapagens e custo total
  const numRecaps = data.retreadingCycles ? parseInt(data.retreadingCycles) : 0;
  const retreadCost = numRecaps * data.retreadPrice;
  const tireTotalCost = data.tirePrice + retreadCost;
  
  // Calcular quilometragem total do ciclo
  const newKm = data.tireLifespan || 0;
  const r1Km = (numRecaps >= 1 && data.r1TireLifespan) ? data.r1TireLifespan : 0;
  const r2Km = (numRecaps >= 2 && data.r2TireLifespan) ? data.r2TireLifespan : 0;
  const totalKm = newKm + r1Km + r2Km;
  
  // Calcular ciclo total em meses
  const totalTireCycle = totalKm / data.monthlyMileage;
  
  // Calcular custo por quilômetro
  const costPerKm = totalKm > 0 ? tireTotalCost / totalKm : 0;
  
  // Calcular ganho de quilômetros por mês devido ao CPK
  const kmGainTotal = totalKm * (cpkImprovementPercentage / 100);
  const kmGainPerMonth = kmGainTotal / totalTireCycle;
  
  // Calcular economia mensal pelo ganho de CPK
  const cpkImprovement = kmGainPerMonth * costPerKm * data.totalTires;
  
  // Nova fórmula da economia na carcaça
  // Fórmula: (% Savings de Carcaça × ((12/(vida util total em meses/numero de recapagem))/12) × numero de pneus) × 
  //         ((custo do pneu novo + custo r1 + custo R2) / Vida Útil do Pneu em Kms) × 
  //         (1 - % Savings de Carcaça) × (Vida Útil do Pneu em Kms - Vida Útil em KMs Pneu Novo)
  
  let carcassSavings = 0;
  
  // Calcular apenas se houver recapagens
  if (data.retreadingCycles && data.retreadingCycles !== "0") {
    // Dados básicos
    const tireLifespan = data.tireLifespan || 0;
    const r1TireLifespan = data.r1TireLifespan || 0;
    const r2TireLifespan = data.r2TireLifespan || 0;
    const numRecaps = parseInt(data.retreadingCycles);
    
    // Calcular vida útil total em meses
    const totalKm = tireLifespan + 
                   (numRecaps >= 1 ? r1TireLifespan : 0) + 
                   (numRecaps >= 2 ? r2TireLifespan : 0);
    const totalLifeInMonths = totalKm / data.monthlyMileage;
    
    // Calcular número de recapagens por mês
    const retreadingsPerMonth = (12 / (totalLifeInMonths / numRecaps)) / 12;
    
    // Primeira parte: % Savings × recapagens por mês × número de pneus
    const firstPart = (carcassSavingsPercentage / 100) * retreadingsPerMonth * data.totalTires;
    
    // Custos dos pneus
    const newTireCost = data.tirePrice;
    const r1Cost = numRecaps >= 1 ? data.retreadPrice : 0;
    const r2Cost = numRecaps >= 2 ? data.retreadPrice : 0;
    const totalCost = newTireCost + r1Cost + r2Cost;
    
    // Custo por km
    const costPerKm = totalCost / totalKm;
    
    // Fator de redução
    const reductionFactor = 1 - (carcassSavingsPercentage / 100);
    
    // Diferença de quilometragem (total - apenas pneu novo)
    const kmDifference = totalKm - tireLifespan;
    
    // Segunda parte da fórmula
    const secondPart = costPerKm * reductionFactor * kmDifference;
    
    // Resultado final
    carcassSavings = firstPart * secondPart;
    
    console.log("Nova fórmula da economia na carcaça:", {
      carcassSavingsPercentage,
      totalLifeInMonths,
      retreadingsPerMonth,
      firstPart,
      totalCost,
      costPerKm,
      reductionFactor,
      kmDifference,
      secondPart,
      carcassSavings
    });
  }

  
  // Cálculo do custo total de rastreamento
  const trackingTotalCost = (data.vehiclesWithTracking || 0) * (data.trackingCostPerVehicle || 0);
  
  // Total de economias incluindo o rastreamento
  const totalSavings = fuelSavings + cpkImprovement + carcassSavings + trackingTotalCost;
  
  // Valor médio de economia por pneu por mês
  // Baseado no total de pneus informado, incluindo o valor de rastreamento
  const savingsPerTirePerMonth = data.totalTires > 0 ? 
    (fuelSavings + cpkImprovement + carcassSavings + trackingTotalCost) / data.totalTires : 75.5;
  
  // Reuse variables from above for tire lifecycle values
  
  return {
    savingsPerTirePerMonth: savingsPerTirePerMonth,
    itemizedSavings: {
      cpkImprovement: cpkImprovement,
      fuelSavings: fuelSavings,
      carcassSavings: carcassSavings,
      total: totalSavings,
    },
    tireCycle: {
      new: newKm / data.monthlyMileage,
      r1: r1Km / data.monthlyMileage,
      r2: r2Km / data.monthlyMileage,
      total: totalTireCycle,
    },
    tracking: {
      vehiclesWithTracking: data.vehiclesWithTracking || 0,
      trackingCostPerVehicle: data.trackingCostPerVehicle || 0,
      trackingTotalCost: (data.vehiclesWithTracking || 0) * (data.trackingCostPerVehicle || 0)
    }
  };
}
