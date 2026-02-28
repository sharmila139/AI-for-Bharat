/**
 * Financial Projection Calculator for Crop Planning
 * Calculates investment costs, revenue projections, and profit estimates
 */

export interface CropFinancialInputs {
  cropId: string;
  cropName: string;
  landArea: number; // in acres
  soilType: string;
  irrigationType: 'rainfed' | 'drip' | 'sprinkler' | 'flood';
  region: string;
  expectedYield?: number; // kg per acre (optional, will use defaults if not provided)
  marketPrice?: number; // per kg (optional, will fetch current if not provided)
}

export interface InvestmentBreakdown {
  seeds: number;
  fertilizers: number;
  pesticides: number;
  irrigation: number;
  labor: number;
  equipment: number;
  miscellaneous: number;
  total: number;
}

export interface RevenueProjection {
  expectedYield: number; // kg
  marketPrice: number; // per kg
  grossRevenue: number;
  optimisticRevenue: number; // +20%
  pessimisticRevenue: number; // -20%
}

export interface ProfitAnalysis {
  grossProfit: number;
  netProfit: number;
  roi: number; // percentage
  breakEvenYield: number; // kg
  profitMargin: number; // percentage
  paybackPeriod: number; // months
}

export interface FinancialProjection {
  cropId: string;
  cropName: string;
  landArea: number;
  investment: InvestmentBreakdown;
  revenue: RevenueProjection;
  profit: ProfitAnalysis;
  timeline: {
    sowingMonth: string;
    harvestMonth: string;
    durationMonths: number;
  };
  risks: string[];
  recommendations: string[];
  calculatedAt: Date;
}

// Crop-specific cost and yield data (per acre)
const CROP_DATA: Record<string, any> = {
  rice: {
    seeds: 2500,
    fertilizers: 3500,
    pesticides: 1500,
    irrigation: 4000,
    labor: 8000,
    equipment: 2000,
    miscellaneous: 1500,
    expectedYield: 2500, // kg per acre
    duration: 4, // months
    sowingMonth: 'June',
    harvestMonth: 'October'
  },
  wheat: {
    seeds: 2000,
    fertilizers: 3000,
    pesticides: 1200,
    irrigation: 3500,
    labor: 7000,
    equipment: 1800,
    miscellaneous: 1000,
    expectedYield: 2000,
    duration: 5,
    sowingMonth: 'November',
    harvestMonth: 'April'
  },
  cotton: {
    seeds: 3000,
    fertilizers: 4500,
    pesticides: 3000,
    irrigation: 5000,
    labor: 10000,
    equipment: 2500,
    miscellaneous: 2000,
    expectedYield: 800,
    duration: 6,
    sowingMonth: 'May',
    harvestMonth: 'November'
  },
  sugarcane: {
    seeds: 8000,
    fertilizers: 6000,
    pesticides: 2500,
    irrigation: 8000,
    labor: 15000,
    equipment: 4000,
    miscellaneous: 3000,
    expectedYield: 35000,
    duration: 12,
    sowingMonth: 'February',
    harvestMonth: 'February'
  },
  maize: {
    seeds: 1500,
    fertilizers: 2500,
    pesticides: 1000,
    irrigation: 3000,
    labor: 6000,
    equipment: 1500,
    miscellaneous: 800,
    expectedYield: 2200,
    duration: 3,
    sowingMonth: 'July',
    harvestMonth: 'October'
  },
  tomato: {
    seeds: 5000,
    fertilizers: 5000,
    pesticides: 3500,
    irrigation: 6000,
    labor: 12000,
    equipment: 2000,
    miscellaneous: 2500,
    expectedYield: 12000,
    duration: 4,
    sowingMonth: 'August',
    harvestMonth: 'December'
  },
  potato: {
    seeds: 8000,
    fertilizers: 4000,
    pesticides: 2000,
    irrigation: 4500,
    labor: 10000,
    equipment: 2500,
    miscellaneous: 2000,
    expectedYield: 8000,
    duration: 3,
    sowingMonth: 'October',
    harvestMonth: 'January'
  },
  onion: {
    seeds: 4000,
    fertilizers: 3500,
    pesticides: 2500,
    irrigation: 4000,
    labor: 9000,
    equipment: 1500,
    miscellaneous: 1500,
    expectedYield: 10000,
    duration: 4,
    sowingMonth: 'November',
    harvestMonth: 'March'
  }
};

// Irrigation type cost multipliers
const IRRIGATION_MULTIPLIERS: Record<string, number> = {
  rainfed: 0.3,
  flood: 1.0,
  sprinkler: 1.3,
  drip: 1.5
};

// Soil type yield multipliers
const SOIL_YIELD_MULTIPLIERS: Record<string, number> = {
  alluvial: 1.2,
  black: 1.1,
  red: 0.9,
  laterite: 0.8,
  sandy: 0.7,
  clayey: 1.0,
  loamy: 1.15
};

export class FinancialProjectionService {
  /**
   * Calculate comprehensive financial projections for a crop
   */
  async calculateProjection(inputs: CropFinancialInputs): Promise<FinancialProjection> {
    // Get crop data or use defaults
    const cropKey = inputs.cropName.toLowerCase();
    const cropData = CROP_DATA[cropKey] || this.getDefaultCropData();

    // Calculate investment breakdown
    const investment = this.calculateInvestment(inputs, cropData);

    // Calculate revenue projections
    const revenue = await this.calculateRevenue(inputs, cropData);

    // Calculate profit analysis
    const profit = this.calculateProfit(investment, revenue, cropData.duration);

    // Generate timeline
    const timeline = {
      sowingMonth: cropData.sowingMonth,
      harvestMonth: cropData.harvestMonth,
      durationMonths: cropData.duration
    };

    // Generate risks and recommendations
    const risks = this.identifyRisks(inputs, profit);
    const recommendations = this.generateRecommendations(inputs, profit);

    return {
      cropId: inputs.cropId,
      cropName: inputs.cropName,
      landArea: inputs.landArea,
      investment,
      revenue,
      profit,
      timeline,
      risks,
      recommendations,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate investment breakdown
   */
  private calculateInvestment(
    inputs: CropFinancialInputs,
    cropData: any
  ): InvestmentBreakdown {
    const { landArea, irrigationType } = inputs;
    const irrigationMultiplier = IRRIGATION_MULTIPLIERS[irrigationType] || 1.0;

    const seeds = cropData.seeds * landArea;
    const fertilizers = cropData.fertilizers * landArea;
    const pesticides = cropData.pesticides * landArea;
    const irrigation = cropData.irrigation * landArea * irrigationMultiplier;
    const labor = cropData.labor * landArea;
    const equipment = cropData.equipment * landArea;
    const miscellaneous = cropData.miscellaneous * landArea;

    const total = seeds + fertilizers + pesticides + irrigation + labor + equipment + miscellaneous;

    return {
      seeds: Math.round(seeds),
      fertilizers: Math.round(fertilizers),
      pesticides: Math.round(pesticides),
      irrigation: Math.round(irrigation),
      labor: Math.round(labor),
      equipment: Math.round(equipment),
      miscellaneous: Math.round(miscellaneous),
      total: Math.round(total)
    };
  }

  /**
   * Calculate revenue projections
   */
  private async calculateRevenue(
    inputs: CropFinancialInputs,
    cropData: any
  ): Promise<RevenueProjection> {
    const { landArea, soilType, expectedYield, marketPrice } = inputs;

    // Calculate expected yield with soil type adjustment
    const soilMultiplier = SOIL_YIELD_MULTIPLIERS[soilType.toLowerCase()] || 1.0;
    const yieldPerAcre = expectedYield || cropData.expectedYield;
    const totalYield = yieldPerAcre * landArea * soilMultiplier;

    // Use provided market price or default (would fetch from market API in production)
    const pricePerKg = marketPrice || 20; // Default price

    const grossRevenue = totalYield * pricePerKg;
    const optimisticRevenue = grossRevenue * 1.2; // +20%
    const pessimisticRevenue = grossRevenue * 0.8; // -20%

    return {
      expectedYield: Math.round(totalYield),
      marketPrice: pricePerKg,
      grossRevenue: Math.round(grossRevenue),
      optimisticRevenue: Math.round(optimisticRevenue),
      pessimisticRevenue: Math.round(pessimisticRevenue)
    };
  }

  /**
   * Calculate profit analysis
   */
  private calculateProfit(
    investment: InvestmentBreakdown,
    revenue: RevenueProjection,
    durationMonths: number
  ): ProfitAnalysis {
    const grossProfit = revenue.grossRevenue - investment.total;
    const netProfit = grossProfit * 0.9; // Account for 10% additional costs
    const roi = (netProfit / investment.total) * 100;
    const breakEvenYield = investment.total / revenue.marketPrice;
    const profitMargin = (netProfit / revenue.grossRevenue) * 100;
    const paybackPeriod = durationMonths;

    return {
      grossProfit: Math.round(grossProfit),
      netProfit: Math.round(netProfit),
      roi: Math.round(roi * 100) / 100,
      breakEvenYield: Math.round(breakEvenYield),
      profitMargin: Math.round(profitMargin * 100) / 100,
      paybackPeriod
    };
  }

  /**
   * Identify financial risks
   */
  private identifyRisks(inputs: CropFinancialInputs, profit: ProfitAnalysis): string[] {
    const risks: string[] = [];

    if (profit.roi < 20) {
      risks.push('Low ROI - Consider alternative crops or cost optimization');
    }

    if (profit.profitMargin < 15) {
      risks.push('Thin profit margins - Vulnerable to price fluctuations');
    }

    if (inputs.irrigationType === 'rainfed') {
      risks.push('Rainfed cultivation - High dependency on monsoon patterns');
    }

    if (inputs.soilType.toLowerCase() === 'sandy' || inputs.soilType.toLowerCase() === 'laterite') {
      risks.push('Suboptimal soil type - May require additional soil amendments');
    }

    if (profit.paybackPeriod > 6) {
      risks.push('Long payback period - Extended capital lock-in');
    }

    return risks;
  }

  /**
   * Generate financial recommendations
   */
  private generateRecommendations(
    inputs: CropFinancialInputs,
    profit: ProfitAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (inputs.irrigationType === 'flood') {
      recommendations.push('Consider drip irrigation to reduce water costs by 30-40%');
    }

    if (profit.roi > 50) {
      recommendations.push('Excellent ROI - Consider expanding cultivation area');
    }

    if (profit.profitMargin > 30) {
      recommendations.push('Strong profit margins - Good buffer against market volatility');
    }

    recommendations.push('Explore crop insurance to mitigate weather-related risks');
    recommendations.push('Consider forward contracts to lock in favorable prices');

    return recommendations;
  }

  /**
   * Get default crop data for unknown crops
   */
  private getDefaultCropData() {
    return {
      seeds: 3000,
      fertilizers: 4000,
      pesticides: 2000,
      irrigation: 4000,
      labor: 8000,
      equipment: 2000,
      miscellaneous: 1500,
      expectedYield: 2000,
      duration: 4,
      sowingMonth: 'June',
      harvestMonth: 'October'
    };
  }

  /**
   * Compare financial projections for multiple crops
   */
  async compareProjections(
    cropInputs: CropFinancialInputs[]
  ): Promise<FinancialProjection[]> {
    const projections = await Promise.all(
      cropInputs.map(input => this.calculateProjection(input))
    );

    // Sort by ROI descending
    return projections.sort((a, b) => b.profit.roi - a.profit.roi);
  }

  /**
   * Calculate break-even analysis
   */
  calculateBreakEven(investment: InvestmentBreakdown, pricePerKg: number): {
    breakEvenYield: number;
    breakEvenPrice: number;
  } {
    const breakEvenYield = investment.total / pricePerKg;
    const breakEvenPrice = investment.total / 2000; // Assuming 2000 kg average yield

    return {
      breakEvenYield: Math.round(breakEvenYield),
      breakEvenPrice: Math.round(breakEvenPrice * 100) / 100
    };
  }
}
