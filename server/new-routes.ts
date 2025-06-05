/**
 * Calculate the savings based on the form data.
 * Nova implementação com apenas a nova fórmula da economia da carcaça.
 */
function calculateSavings(data: any) {
  // Valores EXATOS fornecidos pelo frontend
  const fuelSavingsPercentage = data.fuelSavingsPercentage ?? 1; 
  const cpkImprovementPercentage = data.cpkImprovementPercentage ?? 5;
  const carcassSavingsPercentage = data.carcassSavingsPercentage ?? 10; 
  
  console.log(`VALORES RECEBIDOS PARA CÁLCULO:
  - Economia de combustível: ${fuelSavingsPercentage}%
  - Melhoria no CPK: ${cpkImprovementPercentage}%  
  - Economia na carcaça: ${carcassSavingsPercentage}%
  `);
  
  // Cálculo da economia de combustível (mensal)
  const fuelSavings = (data.monthlyMileage / data.fuelConsumption) * data.fuelPrice * (fuelSavingsPercentage / 100) * data.fleetSize;
  
  // Cálculo da melhoria no CPK
  const numRecaps = data.retreadingCycles ? parseInt(data.retreadingCycles) : 0;
  const retreadCost = numRecaps * data.retreadPrice;
  const tireTotalCost = data.tirePrice + retreadCost;
  
  const newKm = data.tireLifespan || 0;
  const r1Km = (numRecaps >= 1 && data.r1TireLifespan) ? data.r1TireLifespan : 0;
  const r2Km = (numRecaps >= 2 && data.r2TireLifespan) ? data.r2TireLifespan : 0;
  const totalKm = newKm + r1Km + r2Km;
  
  const totalTireCycle = totalKm / data.monthlyMileage;
  const costPerKm = totalKm > 0 ? tireTotalCost / totalKm : 0;
  const kmGainTotal = totalKm * (cpkImprovementPercentage / 100);
  const kmGainPerMonth = kmGainTotal / totalTireCycle;
  const cpkImprovement = kmGainPerMonth * costPerKm * data.totalTires;
  
  // NOVA FÓRMULA DA ECONOMIA NA CARCAÇA
  console.log("🚀 APLICANDO NOVA FÓRMULA DA ECONOMIA DA CARCAÇA");
  let carcassSavings = 0;
  
  if (data.retreadingCycles && data.retreadingCycles !== "0") {
    console.log("✅ NOVA FÓRMULA: Calculando economia da carcaça");
    
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
    
    console.log("🎯 NOVA FÓRMULA APLICADA:", {
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
  
  // Custo de rastreamento
  const trackingTotalCost = data.vehiclesWithTracking && data.trackingCostPerVehicle
    ? data.vehiclesWithTracking * data.trackingCostPerVehicle
    : 0;
  
  // Economia total
  const totalSavings = fuelSavings + cpkImprovement + carcassSavings + trackingTotalCost;
  
  // Economia por pneu por mês
  const savingsPerTirePerMonth = data.totalTires > 0 ? 
    totalSavings / data.totalTires : 0;
  
  // Calcular a duração do ciclo do pneu em meses
  const newTireCycle = data.tireLifespan / data.monthlyMileage;
  const r1TireCycle = data.r1TireLifespan ? data.r1TireLifespan / data.monthlyMileage : 0;
  const r2TireCycle = data.r2TireLifespan ? data.r2TireLifespan / data.monthlyMileage : 0;
  
  return {
    savingsPerTirePerMonth: savingsPerTirePerMonth,
    itemizedSavings: {
      cpkImprovement: cpkImprovement,
      fuelSavings: fuelSavings,
      carcassSavings: carcassSavings,
      total: totalSavings,
    },
    tireCycle: {
      new: newTireCycle,
      r1: r1TireCycle,
      r2: r2TireCycle,
      total: totalTireCycle,
    },
    tracking: {
      vehiclesWithTracking: data.vehiclesWithTracking || 0,
      trackingCostPerVehicle: data.trackingCostPerVehicle || 0,
      trackingTotalCost: trackingTotalCost,
    }
  };
}

export { calculateSavings };