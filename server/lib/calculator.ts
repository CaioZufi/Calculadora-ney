import type { CalculatorFormData } from "@shared/schema";

export interface CalculationResult {
  savingsPerTirePerMonth: number;
  itemizedSavings: {
    cpkImprovement: number;
    fuelSavings: number;
    carcassSavings: number;
    total: number;
  };
  tireCycle: {
    new: number;
    r1: number;
    r2: number;
    total: number;
  };
  tracking: {
    vehiclesWithTracking: number;
    trackingCostPerVehicle: number;
    trackingTotalCost: number;
  };
}

/**
 * Calculate the savings based on the form data.
 * Implementation with the updated carcass savings formula.
 */
export function calculateSavings(data: CalculatorFormData): CalculationResult {
  const fuelSavingsPercentage = data.fuelSavingsPercentage ?? 1;
  const cpkImprovementPercentage = data.cpkImprovementPercentage ?? 5;
  const carcassSavingsPercentage = data.carcassSavingsPercentage ?? 10;

  const fuelSavings =
    (data.monthlyMileage / data.fuelConsumption) *
    data.fuelPrice *
    (fuelSavingsPercentage / 100) *
    data.fleetSize;

  const numRecaps = data.retreadingCycles ? parseInt(data.retreadingCycles) : 0;
  const retreadCost = numRecaps * data.retreadPrice;
  const tireTotalCost = data.tirePrice + retreadCost;

  const newKm = data.tireLifespan || 0;
  const r1Km = numRecaps >= 1 && data.r1TireLifespan ? data.r1TireLifespan : 0;
  const r2Km = numRecaps >= 2 && data.r2TireLifespan ? data.r2TireLifespan : 0;
  const totalKm = newKm + r1Km + r2Km;

  const totalTireCycle = totalKm / data.monthlyMileage;
  const costPerKm = totalKm > 0 ? tireTotalCost / totalKm : 0;
  const kmGainTotal = totalKm * (cpkImprovementPercentage / 100);
  const kmGainPerMonth = kmGainTotal / totalTireCycle;
  const cpkImprovement = kmGainPerMonth * costPerKm * data.totalTires;

  let carcassSavings = 0;
  if (data.retreadingCycles && data.retreadingCycles !== "0") {
    const tireLifespan = data.tireLifespan || 0;
    const r1TireLifespan = data.r1TireLifespan || 0;
    const r2TireLifespan = data.r2TireLifespan || 0;
    const numRecap = parseInt(data.retreadingCycles);

    const totalKmLife =
      tireLifespan + (numRecap >= 1 ? r1TireLifespan : 0) + (numRecap >= 2 ? r2TireLifespan : 0);
    const totalLifeInMonths = totalKmLife / data.monthlyMileage;
    const retreadingsPerMonth = (12 / (totalLifeInMonths / numRecap)) / 12;

    const firstPart = (carcassSavingsPercentage / 100) * retreadingsPerMonth * data.totalTires;

    const newTireCost = data.tirePrice;
    const r1Cost = numRecap >= 1 ? data.retreadPrice : 0;
    const r2Cost = numRecap >= 2 ? data.retreadPrice : 0;
    const totalCost = newTireCost + r1Cost + r2Cost;

    const costPerKmCarcass = totalCost / totalKmLife;
    const reductionFactor = 1 - carcassSavingsPercentage / 100;
    const kmDifference = totalKmLife - tireLifespan;
    const secondPart = costPerKmCarcass * reductionFactor * kmDifference;

    carcassSavings = firstPart * secondPart;
  }

  const trackingTotalCost =
    data.vehiclesWithTracking && data.trackingCostPerVehicle
      ? data.vehiclesWithTracking * data.trackingCostPerVehicle
      : 0;

  const totalSavings = fuelSavings + cpkImprovement + carcassSavings + trackingTotalCost;
  const savingsPerTirePerMonth = data.totalTires > 0 ? totalSavings / data.totalTires : 0;

  const newTireCycle = data.tireLifespan / data.monthlyMileage;
  const r1TireCycle = data.r1TireLifespan ? data.r1TireLifespan / data.monthlyMileage : 0;
  const r2TireCycle = data.r2TireLifespan ? data.r2TireLifespan / data.monthlyMileage : 0;

  return {
    savingsPerTirePerMonth,
    itemizedSavings: {
      cpkImprovement,
      fuelSavings,
      carcassSavings,
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
      trackingTotalCost,
    },
  };
}
