/**
 * Fertilizer Recommendation Engine
 * 
 * Generates fertilizer recommendations based on soil health analysis and crop requirements.
 * Provides three types of recommendations:
 * - Organic: Compost, farmyard manure, green manure, bio-fertilizers
 * - Chemical: NPK formulations, micronutrient supplements
 * - Mixed: Combination of organic and chemical approaches
 * 
 * Validates: Requirements 4.4, 4.5
 */

import { SoilData, SoilHealthScore } from './soil-health-calculator';
import { CropTimeline } from './crop-timeline';

export interface FertilizerInput {
  soilData: SoilData;
  soilHealthScore: SoilHealthScore;
  cropName: string;
  cropTimeline: CropTimeline;
  landArea: number; // in hectares
  preferredType?: 'organic' | 'chemical' | 'mixed';
  budget?: number; // in INR
}

export interface FertilizerProduct {
  name: string;
  type: 'organic' | 'chemical';
  composition: string;
  applicationRate: number; // kg/ha or liters/ha
  totalQuantity: number; // for the given land area
  costPerUnit: number; // INR per kg or liter
  totalCost: number; // INR
  benefits: string[];
  applicationMethod: string;
}

export interface ApplicationSchedule {
  stage: string;
  growthStage: string;
  timing: Date;
  products: FertilizerProduct[];
  instructions: string[];
  expectedResults: string;
}

export interface CostBenefitAnalysis {
  totalCost: number; // INR
  expectedYieldIncrease: number; // percentage
  expectedRevenueIncrease: number; // INR
  roi: number; // percentage
  paybackPeriod: string;
  environmentalImpact: 'low' | 'medium' | 'high';
  soilHealthImprovement: 'low' | 'medium' | 'high';
  sustainability: number; // 0-100 score
}

export interface FertilizerRecommendation {
  type: 'organic' | 'chemical' | 'mixed';
  products: FertilizerProduct[];
  applicationSchedule: ApplicationSchedule[];
  costBenefitAnalysis: CostBenefitAnalysis;
  totalNPK: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  micronutrients: string[];
  warnings: string[];
  tips: string[];
  generatedAt: Date;
}

export interface FertilizerRecommendations {
  organic: FertilizerRecommendation;
  chemical: FertilizerRecommendation;
  mixed: FertilizerRecommendation;
  recommended: 'organic' | 'chemical' | 'mixed';
  comparisonSummary: string;
}

// Nutrient deficiency thresholds and recommendations
const NUTRIENT_THRESHOLDS = {
  nitrogen: { low: 280, medium: 560, high: 840 },
  phosphorus: { low: 10, medium: 25, high: 40 },
  potassium: { low: 110, medium: 280, high: 450 },
  zinc: { low: 0.6, medium: 1.2 },
  iron: { low: 4.5, medium: 10 },
  manganese: { low: 1.0, medium: 5 },
  copper: { low: 0.2, medium: 0.5 },
  boron: { low: 0.5, medium: 1.0 }
};

// Crop-specific NPK requirements (kg/ha)
const CROP_NPK_REQUIREMENTS: Record<string, { N: number; P: number; K: number }> = {
  rice: { N: 120, P: 60, K: 40 },
  wheat: { N: 120, P: 60, K: 40 },
  maize: { N: 150, P: 75, K: 50 },
  cotton: { N: 120, P: 60, K: 60 },
  sugarcane: { N: 250, P: 115, K: 115 },
  potato: { N: 150, P: 100, K: 100 },
  tomato: { N: 100, P: 50, K: 50 },
  onion: { N: 100, P: 50, K: 50 },
  soybean: { N: 30, P: 60, K: 40 },
  groundnut: { N: 25, P: 50, K: 75 },
  default: { N: 100, P: 50, K: 50 }
};

// Organic fertilizer database
const ORGANIC_FERTILIZERS = {
  farmyardManure: {
    name: 'Farmyard Manure (FYM)',
    composition: 'N: 0.5%, P: 0.2%, K: 0.5%',
    npk: { N: 0.5, P: 0.2, K: 0.5 },
    costPerTon: 1500,
    benefits: [
      'Improves soil structure and water retention',
      'Increases organic matter content',
      'Provides slow-release nutrients',
      'Enhances beneficial soil microorganisms'
    ],
    applicationMethod: 'Broadcast and incorporate into soil before sowing'
  },
  compost: {
    name: 'Compost',
    composition: 'N: 1.5%, P: 1.0%, K: 1.5%',
    npk: { N: 1.5, P: 1.0, K: 1.5 },
    costPerTon: 2000,
    benefits: [
      'Rich in organic matter',
      'Improves soil fertility',
      'Enhances water retention',
      'Suppresses soil-borne diseases'
    ],
    applicationMethod: 'Apply as basal dose or top dressing'
  },
  vermicompost: {
    name: 'Vermicompost',
    composition: 'N: 2.0%, P: 1.5%, K: 1.5%',
    npk: { N: 2.0, P: 1.5, K: 1.5 },
    costPerTon: 4000,
    benefits: [
      'High-quality organic fertilizer',
      'Rich in plant growth hormones',
      'Improves soil structure',
      'Increases nutrient availability'
    ],
    applicationMethod: 'Apply in furrows or as top dressing'
  },
  neemCake: {
    name: 'Neem Cake',
    composition: 'N: 5.0%, P: 1.0%, K: 1.5%',
    npk: { N: 5.0, P: 1.0, K: 1.5 },
    costPerTon: 15000,
    benefits: [
      'Natural pest repellent',
      'Slow-release nitrogen source',
      'Improves soil health',
      'Reduces nematode population'
    ],
    applicationMethod: 'Mix with soil at sowing or apply as top dressing'
  }
};

// Chemical fertilizer database
const CHEMICAL_FERTILIZERS = {
  urea: {
    name: 'Urea',
    composition: 'N: 46%',
    npk: { N: 46, P: 0, K: 0 },
    costPerBag: 300, // 50kg bag
    benefits: [
      'High nitrogen content',
      'Quick-acting',
      'Promotes vegetative growth',
      'Cost-effective'
    ],
    applicationMethod: 'Apply as top dressing, avoid direct contact with seeds'
  },
  dap: {
    name: 'DAP (Di-Ammonium Phosphate)',
    composition: 'N: 18%, P: 46%',
    npk: { N: 18, P: 46, K: 0 },
    costPerBag: 1350, // 50kg bag
    benefits: [
      'High phosphorus content',
      'Promotes root development',
      'Suitable for basal application',
      'Improves flowering and fruiting'
    ],
    applicationMethod: 'Apply as basal dose at sowing'
  },
  mop: {
    name: 'MOP (Muriate of Potash)',
    composition: 'K: 60%',
    npk: { N: 0, P: 0, K: 60 },
    costPerBag: 1200, // 50kg bag
    benefits: [
      'High potassium content',
      'Improves crop quality',
      'Enhances disease resistance',
      'Increases water use efficiency'
    ],
    applicationMethod: 'Apply as basal or split application'
  },
  npk_complex: {
    name: 'NPK Complex (12:32:16)',
    composition: 'N: 12%, P: 32%, K: 16%',
    npk: { N: 12, P: 32, K: 16 },
    costPerBag: 1100, // 50kg bag
    benefits: [
      'Balanced nutrition',
      'Single application convenience',
      'Suitable for all crops',
      'Reduces labor cost'
    ],
    applicationMethod: 'Apply as basal dose'
  },
  zincSulfate: {
    name: 'Zinc Sulfate',
    composition: 'Zn: 21%',
    npk: { N: 0, P: 0, K: 0 },
    costPerKg: 80,
    benefits: [
      'Corrects zinc deficiency',
      'Improves crop yield',
      'Enhances grain quality',
      'Boosts plant immunity'
    ],
    applicationMethod: 'Soil application or foliar spray'
  }
};

export class FertilizerRecommendationEngine {
  /**
   * Generate all three types of fertilizer recommendations
   */
  generateRecommendations(input: FertilizerInput): FertilizerRecommendations {
    // Calculate nutrient deficiencies
    const deficiencies = this.calculateDeficiencies(input);
    
    // Get crop NPK requirements
    const cropRequirements = this.getCropRequirements(input.cropName);
    
    // Generate three types of recommendations
    const organic = this.generateOrganicRecommendation(input, deficiencies, cropRequirements);
    const chemical = this.generateChemicalRecommendation(input, deficiencies, cropRequirements);
    const mixed = this.generateMixedRecommendation(input, deficiencies, cropRequirements);
    
    // Determine recommended approach based on soil health and budget
    const recommended = this.determineRecommendedApproach(input, organic, chemical, mixed);
    
    // Generate comparison summary
    const comparisonSummary = this.generateComparisonSummary(organic, chemical, mixed);
    
    return {
      organic,
      chemical,
      mixed,
      recommended,
      comparisonSummary
    };
  }

  /**
   * Calculate nutrient deficiencies based on soil data
   */
  private calculateDeficiencies(input: FertilizerInput): {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    micronutrients: { name: string; deficiency: number }[];
  } {
    const { soilData } = input;
    const cropReq = this.getCropRequirements(input.cropName);
    
    // Calculate NPK deficiencies
    const nitrogenDeficiency = Math.max(0, cropReq.N - (soilData.nitrogen || 0));
    const phosphorusDeficiency = Math.max(0, cropReq.P - (soilData.phosphorus || 0));
    const potassiumDeficiency = Math.max(0, cropReq.K - (soilData.potassium || 0));
    
    // Calculate micronutrient deficiencies
    const micronutrients: { name: string; deficiency: number }[] = [];
    
    if (soilData.zinc !== undefined && soilData.zinc < NUTRIENT_THRESHOLDS.zinc.low) {
      micronutrients.push({ name: 'zinc', deficiency: NUTRIENT_THRESHOLDS.zinc.low - soilData.zinc });
    }
    if (soilData.iron !== undefined && soilData.iron < NUTRIENT_THRESHOLDS.iron.low) {
      micronutrients.push({ name: 'iron', deficiency: NUTRIENT_THRESHOLDS.iron.low - soilData.iron });
    }
    if (soilData.boron !== undefined && soilData.boron < NUTRIENT_THRESHOLDS.boron.low) {
      micronutrients.push({ name: 'boron', deficiency: NUTRIENT_THRESHOLDS.boron.low - soilData.boron });
    }
    
    return {
      nitrogen: nitrogenDeficiency,
      phosphorus: phosphorusDeficiency,
      potassium: potassiumDeficiency,
      micronutrients
    };
  }

  /**
   * Get crop NPK requirements
   */
  private getCropRequirements(cropName: string): { N: number; P: number; K: number } {
    const key = cropName.toLowerCase();
    return CROP_NPK_REQUIREMENTS[key] || CROP_NPK_REQUIREMENTS.default;
  }

  /**
   * Generate organic fertilizer recommendation
   */
  private generateOrganicRecommendation(
    input: FertilizerInput,
    deficiencies: any,
    cropRequirements: any
  ): FertilizerRecommendation {
    const products: FertilizerProduct[] = [];
    let totalCost = 0;
    
    // Calculate FYM requirement (primary organic source)
    const fymTonsNeeded = Math.ceil(cropRequirements.N / (ORGANIC_FERTILIZERS.farmyardManure.npk.N * 10));
    const fymCost = fymTonsNeeded * ORGANIC_FERTILIZERS.farmyardManure.costPerTon * input.landArea;
    
    products.push({
      name: ORGANIC_FERTILIZERS.farmyardManure.name,
      type: 'organic',
      composition: ORGANIC_FERTILIZERS.farmyardManure.composition,
      applicationRate: fymTonsNeeded,
      totalQuantity: fymTonsNeeded * input.landArea,
      costPerUnit: ORGANIC_FERTILIZERS.farmyardManure.costPerTon,
      totalCost: fymCost,
      benefits: ORGANIC_FERTILIZERS.farmyardManure.benefits,
      applicationMethod: ORGANIC_FERTILIZERS.farmyardManure.applicationMethod
    });
    totalCost += fymCost;
    
    // Add compost for additional nutrients
    const compostTons = 2;
    const compostCost = compostTons * ORGANIC_FERTILIZERS.compost.costPerTon * input.landArea;
    
    products.push({
      name: ORGANIC_FERTILIZERS.compost.name,
      type: 'organic',
      composition: ORGANIC_FERTILIZERS.compost.composition,
      applicationRate: compostTons,
      totalQuantity: compostTons * input.landArea,
      costPerUnit: ORGANIC_FERTILIZERS.compost.costPerTon,
      totalCost: compostCost,
      benefits: ORGANIC_FERTILIZERS.compost.benefits,
      applicationMethod: ORGANIC_FERTILIZERS.compost.applicationMethod
    });
    totalCost += compostCost;
    
    // Add neem cake if nitrogen deficiency is high
    if (deficiencies.nitrogen > 50) {
      const neemCakeTons = 0.5;
      const neemCakeCost = neemCakeTons * ORGANIC_FERTILIZERS.neemCake.costPerTon * input.landArea;
      
      products.push({
        name: ORGANIC_FERTILIZERS.neemCake.name,
        type: 'organic',
        composition: ORGANIC_FERTILIZERS.neemCake.composition,
        applicationRate: neemCakeTons,
        totalQuantity: neemCakeTons * input.landArea,
        costPerUnit: ORGANIC_FERTILIZERS.neemCake.costPerTon,
        totalCost: neemCakeCost,
        benefits: ORGANIC_FERTILIZERS.neemCake.benefits,
        applicationMethod: ORGANIC_FERTILIZERS.neemCake.applicationMethod
      });
      totalCost += neemCakeCost;
    }
    
    // Generate application schedule
    const applicationSchedule = this.generateOrganicSchedule(input.cropTimeline, products);
    
    // Calculate cost-benefit analysis
    const costBenefitAnalysis = this.calculateCostBenefit(
      totalCost,
      'organic',
      input.soilHealthScore.overallScore
    );
    
    return {
      type: 'organic',
      products,
      applicationSchedule,
      costBenefitAnalysis,
      totalNPK: this.calculateTotalNPK(products, input.landArea),
      micronutrients: ['Natural micronutrients from organic matter'],
      warnings: [
        'Organic fertilizers release nutrients slowly',
        'Apply well in advance of crop requirement',
        'Ensure proper decomposition before sowing'
      ],
      tips: [
        'Combine with green manuring for better results',
        'Maintain soil moisture for faster decomposition',
        'Use well-decomposed organic matter only'
      ],
      generatedAt: new Date()
    };
  }

  /**
   * Generate chemical fertilizer recommendation
   */
  private generateChemicalRecommendation(
    input: FertilizerInput,
    deficiencies: any,
    cropRequirements: any
  ): FertilizerRecommendation {
    const products: FertilizerProduct[] = [];
    let totalCost = 0;
    
    // Calculate Urea requirement for nitrogen
    const ureaKgNeeded = Math.ceil((cropRequirements.N / CHEMICAL_FERTILIZERS.urea.npk.N) * 100);
    const ureaBags = Math.ceil(ureaKgNeeded / 50);
    const ureaCost = ureaBags * CHEMICAL_FERTILIZERS.urea.costPerBag * input.landArea;
    
    products.push({
      name: CHEMICAL_FERTILIZERS.urea.name,
      type: 'chemical',
      composition: CHEMICAL_FERTILIZERS.urea.composition,
      applicationRate: ureaKgNeeded,
      totalQuantity: ureaKgNeeded * input.landArea,
      costPerUnit: CHEMICAL_FERTILIZERS.urea.costPerBag / 50,
      totalCost: ureaCost,
      benefits: CHEMICAL_FERTILIZERS.urea.benefits,
      applicationMethod: CHEMICAL_FERTILIZERS.urea.applicationMethod
    });
    totalCost += ureaCost;
    
    // Calculate DAP requirement for phosphorus
    const dapKgNeeded = Math.ceil((cropRequirements.P / CHEMICAL_FERTILIZERS.dap.npk.P) * 100);
    const dapBags = Math.ceil(dapKgNeeded / 50);
    const dapCost = dapBags * CHEMICAL_FERTILIZERS.dap.costPerBag * input.landArea;
    
    products.push({
      name: CHEMICAL_FERTILIZERS.dap.name,
      type: 'chemical',
      composition: CHEMICAL_FERTILIZERS.dap.composition,
      applicationRate: dapKgNeeded,
      totalQuantity: dapKgNeeded * input.landArea,
      costPerUnit: CHEMICAL_FERTILIZERS.dap.costPerBag / 50,
      totalCost: dapCost,
      benefits: CHEMICAL_FERTILIZERS.dap.benefits,
      applicationMethod: CHEMICAL_FERTILIZERS.dap.applicationMethod
    });
    totalCost += dapCost;
    
    // Calculate MOP requirement for potassium
    const mopKgNeeded = Math.ceil((cropRequirements.K / CHEMICAL_FERTILIZERS.mop.npk.K) * 100);
    const mopBags = Math.ceil(mopKgNeeded / 50);
    const mopCost = mopBags * CHEMICAL_FERTILIZERS.mop.costPerBag * input.landArea;
    
    products.push({
      name: CHEMICAL_FERTILIZERS.mop.name,
      type: 'chemical',
      composition: CHEMICAL_FERTILIZERS.mop.composition,
      applicationRate: mopKgNeeded,
      totalQuantity: mopKgNeeded * input.landArea,
      costPerUnit: CHEMICAL_FERTILIZERS.mop.costPerBag / 50,
      totalCost: mopCost,
      benefits: CHEMICAL_FERTILIZERS.mop.benefits,
      applicationMethod: CHEMICAL_FERTILIZERS.mop.applicationMethod
    });
    totalCost += mopCost;
    
    // Add zinc sulfate if deficient
    if (deficiencies.micronutrients.some((m: any) => m.name === 'zinc')) {
      const zincKg = 25 * input.landArea;
      const zincCost = zincKg * CHEMICAL_FERTILIZERS.zincSulfate.costPerKg;
      
      products.push({
        name: CHEMICAL_FERTILIZERS.zincSulfate.name,
        type: 'chemical',
        composition: CHEMICAL_FERTILIZERS.zincSulfate.composition,
        applicationRate: 25,
        totalQuantity: zincKg,
        costPerUnit: CHEMICAL_FERTILIZERS.zincSulfate.costPerKg,
        totalCost: zincCost,
        benefits: CHEMICAL_FERTILIZERS.zincSulfate.benefits,
        applicationMethod: CHEMICAL_FERTILIZERS.zincSulfate.applicationMethod
      });
      totalCost += zincCost;
    }
    
    // Generate application schedule
    const applicationSchedule = this.generateChemicalSchedule(input.cropTimeline, products);
    
    // Calculate cost-benefit analysis
    const costBenefitAnalysis = this.calculateCostBenefit(
      totalCost,
      'chemical',
      input.soilHealthScore.overallScore
    );
    
    return {
      type: 'chemical',
      products,
      applicationSchedule,
      costBenefitAnalysis,
      totalNPK: this.calculateTotalNPK(products, input.landArea),
      micronutrients: deficiencies.micronutrients.map((m: any) => m.name),
      warnings: [
        'Avoid over-application to prevent nutrient toxicity',
        'Do not apply during heavy rain',
        'Store in cool, dry place away from moisture'
      ],
      tips: [
        'Split nitrogen application for better efficiency',
        'Apply phosphorus at sowing for root development',
        'Combine with organic matter for sustained fertility'
      ],
      generatedAt: new Date()
    };
  }

  /**
   * Generate mixed (organic + chemical) recommendation
   */
  private generateMixedRecommendation(
    input: FertilizerInput,
    _deficiencies: any,
    cropRequirements: any
  ): FertilizerRecommendation {
    const products: FertilizerProduct[] = [];
    let totalCost = 0;
    
    // Use organic for base nutrition (50% of requirement)
    const fymTons = Math.ceil((cropRequirements.N / (ORGANIC_FERTILIZERS.farmyardManure.npk.N * 10)) * 0.5);
    const fymCost = fymTons * ORGANIC_FERTILIZERS.farmyardManure.costPerTon * input.landArea;
    
    products.push({
      name: ORGANIC_FERTILIZERS.farmyardManure.name,
      type: 'organic',
      composition: ORGANIC_FERTILIZERS.farmyardManure.composition,
      applicationRate: fymTons,
      totalQuantity: fymTons * input.landArea,
      costPerUnit: ORGANIC_FERTILIZERS.farmyardManure.costPerTon,
      totalCost: fymCost,
      benefits: ORGANIC_FERTILIZERS.farmyardManure.benefits,
      applicationMethod: ORGANIC_FERTILIZERS.farmyardManure.applicationMethod
    });
    totalCost += fymCost;
    
    // Use chemical for quick-acting nutrients (50% of requirement)
    const ureaKgNeeded = Math.ceil((cropRequirements.N / CHEMICAL_FERTILIZERS.urea.npk.N) * 100 * 0.5);
    const ureaBags = Math.ceil(ureaKgNeeded / 50);
    const ureaCost = ureaBags * CHEMICAL_FERTILIZERS.urea.costPerBag * input.landArea;
    
    products.push({
      name: CHEMICAL_FERTILIZERS.urea.name,
      type: 'chemical',
      composition: CHEMICAL_FERTILIZERS.urea.composition,
      applicationRate: ureaKgNeeded,
      totalQuantity: ureaKgNeeded * input.landArea,
      costPerUnit: CHEMICAL_FERTILIZERS.urea.costPerBag / 50,
      totalCost: ureaCost,
      benefits: CHEMICAL_FERTILIZERS.urea.benefits,
      applicationMethod: CHEMICAL_FERTILIZERS.urea.applicationMethod
    });
    totalCost += ureaCost;
    
    // Use NPK complex for balanced nutrition
    const npkKgNeeded = 100;
    const npkBags = Math.ceil(npkKgNeeded / 50);
    const npkCost = npkBags * CHEMICAL_FERTILIZERS.npk_complex.costPerBag * input.landArea;
    
    products.push({
      name: CHEMICAL_FERTILIZERS.npk_complex.name,
      type: 'chemical',
      composition: CHEMICAL_FERTILIZERS.npk_complex.composition,
      applicationRate: npkKgNeeded,
      totalQuantity: npkKgNeeded * input.landArea,
      costPerUnit: CHEMICAL_FERTILIZERS.npk_complex.costPerBag / 50,
      totalCost: npkCost,
      benefits: CHEMICAL_FERTILIZERS.npk_complex.benefits,
      applicationMethod: CHEMICAL_FERTILIZERS.npk_complex.applicationMethod
    });
    totalCost += npkCost;
    
    // Add vermicompost for soil health
    const vermicompostTons = 1;
    const vermicompostCost = vermicompostTons * ORGANIC_FERTILIZERS.vermicompost.costPerTon * input.landArea;
    
    products.push({
      name: ORGANIC_FERTILIZERS.vermicompost.name,
      type: 'organic',
      composition: ORGANIC_FERTILIZERS.vermicompost.composition,
      applicationRate: vermicompostTons,
      totalQuantity: vermicompostTons * input.landArea,
      costPerUnit: ORGANIC_FERTILIZERS.vermicompost.costPerTon,
      totalCost: vermicompostCost,
      benefits: ORGANIC_FERTILIZERS.vermicompost.benefits,
      applicationMethod: ORGANIC_FERTILIZERS.vermicompost.applicationMethod
    });
    totalCost += vermicompostCost;
    
    // Generate application schedule
    const applicationSchedule = this.generateMixedSchedule(input.cropTimeline, products);
    
    // Calculate cost-benefit analysis
    const costBenefitAnalysis = this.calculateCostBenefit(
      totalCost,
      'mixed',
      input.soilHealthScore.overallScore
    );
    
    return {
      type: 'mixed',
      products,
      applicationSchedule,
      costBenefitAnalysis,
      totalNPK: this.calculateTotalNPK(products, input.landArea),
      micronutrients: ['Balanced from organic and chemical sources'],
      warnings: [
        'Apply organic fertilizers first, then chemical',
        'Maintain gap of 7-10 days between applications',
        'Monitor soil moisture levels'
      ],
      tips: [
        'Best of both worlds - immediate and sustained nutrition',
        'Improves soil health while ensuring crop nutrition',
        'Cost-effective compared to pure organic'
      ],
      generatedAt: new Date()
    };
  }

  /**
   * Generate application schedule for organic fertilizers
   */
  private generateOrganicSchedule(
    timeline: CropTimeline,
    products: FertilizerProduct[]
  ): ApplicationSchedule[] {
    const schedule: ApplicationSchedule[] = [];
    
    // Apply organic fertilizers before sowing (land preparation stage)
    const landPrepStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('land preparation') || 
      s.stage.toLowerCase().includes('preparation')
    );
    
    if (landPrepStage) {
      schedule.push({
        stage: 'Basal Application',
        growthStage: landPrepStage.stage,
        timing: landPrepStage.startDate,
        products: products.filter(p => p.name.includes('FYM') || p.name.includes('Compost')),
        instructions: [
          'Spread organic fertilizers uniformly across the field',
          'Incorporate into soil through plowing',
          'Allow 7-10 days for decomposition before sowing',
          'Maintain adequate soil moisture'
        ],
        expectedResults: 'Improved soil structure and nutrient availability'
      });
    }
    
    // Apply additional organic fertilizers during vegetative stage
    const vegetativeStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('vegetative') ||
      s.stage.toLowerCase().includes('tillering')
    );
    
    if (vegetativeStage && products.some(p => p.name.includes('Neem') || p.name.includes('Vermicompost'))) {
      const midVegetative = new Date(vegetativeStage.startDate);
      midVegetative.setDate(midVegetative.getDate() + Math.floor(vegetativeStage.durationDays / 2));
      
      schedule.push({
        stage: 'Top Dressing',
        growthStage: vegetativeStage.stage,
        timing: midVegetative,
        products: products.filter(p => p.name.includes('Neem') || p.name.includes('Vermicompost')),
        instructions: [
          'Apply as side dressing near plant rows',
          'Lightly incorporate into soil',
          'Irrigate after application',
          'Avoid direct contact with plant stems'
        ],
        expectedResults: 'Enhanced vegetative growth and pest protection'
      });
    }
    
    return schedule;
  }

  /**
   * Generate application schedule for chemical fertilizers
   */
  private generateChemicalSchedule(
    timeline: CropTimeline,
    products: FertilizerProduct[]
  ): ApplicationSchedule[] {
    const schedule: ApplicationSchedule[] = [];
    
    // Basal application at sowing
    const sowingStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('sowing') ||
      s.stage.toLowerCase().includes('transplanting')
    );
    
    if (sowingStage) {
      schedule.push({
        stage: 'Basal Application',
        growthStage: sowingStage.stage,
        timing: sowingStage.startDate,
        products: products.filter(p => p.name.includes('DAP') || p.name.includes('NPK') || p.name.includes('MOP')),
        instructions: [
          'Apply DAP and MOP in furrows at sowing',
          'Mix with soil before seed placement',
          'Ensure uniform distribution',
          'Avoid direct seed contact with fertilizer'
        ],
        expectedResults: 'Strong root development and early establishment'
      });
    }
    
    // First top dressing during vegetative stage
    const vegetativeStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('vegetative') ||
      s.stage.toLowerCase().includes('tillering')
    );
    
    if (vegetativeStage) {
      const earlyVegetative = new Date(vegetativeStage.startDate);
      earlyVegetative.setDate(earlyVegetative.getDate() + 7);
      
      schedule.push({
        stage: 'First Top Dressing',
        growthStage: vegetativeStage.stage,
        timing: earlyVegetative,
        products: products.filter(p => p.name.includes('Urea')),
        instructions: [
          'Apply 50% of Urea dose',
          'Broadcast between rows',
          'Irrigate immediately after application',
          'Apply in morning or evening hours'
        ],
        expectedResults: 'Vigorous vegetative growth and tillering'
      });
      
      // Second top dressing
      const midVegetative = new Date(vegetativeStage.startDate);
      midVegetative.setDate(midVegetative.getDate() + Math.floor(vegetativeStage.durationDays * 0.7));
      
      schedule.push({
        stage: 'Second Top Dressing',
        growthStage: vegetativeStage.stage,
        timing: midVegetative,
        products: products.filter(p => p.name.includes('Urea')),
        instructions: [
          'Apply remaining 50% of Urea dose',
          'Broadcast uniformly',
          'Ensure adequate soil moisture',
          'Avoid application before heavy rain'
        ],
        expectedResults: 'Sustained growth and preparation for reproductive stage'
      });
    }
    
    // Micronutrient application
    if (products.some(p => p.name.includes('Zinc'))) {
      const reproductiveStage = timeline.stages.find(s => 
        s.stage.toLowerCase().includes('reproductive') ||
        s.stage.toLowerCase().includes('flowering')
      );
      
      if (reproductiveStage) {
        schedule.push({
          stage: 'Micronutrient Application',
          growthStage: reproductiveStage.stage,
          timing: reproductiveStage.startDate,
          products: products.filter(p => p.name.includes('Zinc')),
          instructions: [
            'Dissolve in water for foliar spray',
            'Apply during early morning or late evening',
            'Ensure complete leaf coverage',
            'Repeat after 15 days if deficiency persists'
          ],
          expectedResults: 'Improved flowering, grain filling, and yield'
        });
      }
    }
    
    return schedule;
  }

  /**
   * Generate application schedule for mixed approach
   */
  private generateMixedSchedule(
    timeline: CropTimeline,
    products: FertilizerProduct[]
  ): ApplicationSchedule[] {
    const schedule: ApplicationSchedule[] = [];
    
    // Apply organic fertilizers first (land preparation)
    const landPrepStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('land preparation') || 
      s.stage.toLowerCase().includes('preparation')
    );
    
    if (landPrepStage) {
      schedule.push({
        stage: 'Organic Basal Application',
        growthStage: landPrepStage.stage,
        timing: landPrepStage.startDate,
        products: products.filter(p => p.type === 'organic' && p.name.includes('FYM')),
        instructions: [
          'Apply FYM and incorporate into soil',
          'Allow 7-10 days for decomposition',
          'Maintain soil moisture',
          'Prepare field for sowing'
        ],
        expectedResults: 'Improved soil structure and base nutrition'
      });
    }
    
    // Apply chemical fertilizers at sowing
    const sowingStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('sowing') ||
      s.stage.toLowerCase().includes('transplanting')
    );
    
    if (sowingStage) {
      schedule.push({
        stage: 'Chemical Basal Application',
        growthStage: sowingStage.stage,
        timing: sowingStage.startDate,
        products: products.filter(p => p.type === 'chemical' && p.name.includes('NPK')),
        instructions: [
          'Apply NPK complex in furrows',
          'Mix with soil before sowing',
          'Ensure uniform distribution',
          'Irrigate after sowing'
        ],
        expectedResults: 'Quick-acting nutrients for early growth'
      });
    }
    
    // Top dressing with chemical fertilizers
    const vegetativeStage = timeline.stages.find(s => 
      s.stage.toLowerCase().includes('vegetative') ||
      s.stage.toLowerCase().includes('tillering')
    );
    
    if (vegetativeStage) {
      const midVegetative = new Date(vegetativeStage.startDate);
      midVegetative.setDate(midVegetative.getDate() + Math.floor(vegetativeStage.durationDays / 2));
      
      schedule.push({
        stage: 'Top Dressing',
        growthStage: vegetativeStage.stage,
        timing: midVegetative,
        products: products.filter(p => p.name.includes('Urea') || p.name.includes('Vermicompost')),
        instructions: [
          'Apply Urea for quick nitrogen boost',
          'Apply vermicompost for sustained nutrition',
          'Maintain 7-day gap between applications',
          'Irrigate after each application'
        ],
        expectedResults: 'Balanced nutrition - immediate and sustained'
      });
    }
    
    return schedule;
  }

  /**
   * Calculate total NPK provided by fertilizers
   */
  private calculateTotalNPK(products: FertilizerProduct[], landArea: number): {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  } {
    let totalN = 0, totalP = 0, totalK = 0;
    
    products.forEach(product => {
      // Extract NPK percentages from composition
      const nMatch = product.composition.match(/N:\s*(\d+\.?\d*)/);
      const pMatch = product.composition.match(/P:\s*(\d+\.?\d*)/);
      const kMatch = product.composition.match(/K:\s*(\d+\.?\d*)/);
      
      if (nMatch) totalN += (parseFloat(nMatch[1]) / 100) * product.totalQuantity;
      if (pMatch) totalP += (parseFloat(pMatch[1]) / 100) * product.totalQuantity;
      if (kMatch) totalK += (parseFloat(kMatch[1]) / 100) * product.totalQuantity;
    });
    
    return {
      nitrogen: Math.round(totalN / landArea),
      phosphorus: Math.round(totalP / landArea),
      potassium: Math.round(totalK / landArea)
    };
  }

  /**
   * Calculate cost-benefit analysis
   */
  private calculateCostBenefit(
    totalCost: number,
    type: 'organic' | 'chemical' | 'mixed',
    soilHealthScore: number
  ): CostBenefitAnalysis {
    // Estimate yield increase based on fertilizer type and soil health
    let yieldIncrease = 0;
    let environmentalImpact: 'low' | 'medium' | 'high';
    let soilHealthImprovement: 'low' | 'medium' | 'high';
    let sustainability = 0;
    
    if (type === 'organic') {
      yieldIncrease = soilHealthScore < 50 ? 25 : 15;
      environmentalImpact = 'low';
      soilHealthImprovement = 'high';
      sustainability = 90;
    } else if (type === 'chemical') {
      yieldIncrease = 30;
      environmentalImpact = 'high';
      soilHealthImprovement = 'low';
      sustainability = 40;
    } else {
      yieldIncrease = 28;
      environmentalImpact = 'medium';
      soilHealthImprovement = 'medium';
      sustainability = 70;
    }
    
    // Estimate revenue increase (assuming average crop value of ₹50,000/ha)
    const baseRevenue = 50000;
    const revenueIncrease = (baseRevenue * yieldIncrease) / 100;
    
    // Calculate ROI
    const roi = ((revenueIncrease - totalCost) / totalCost) * 100;
    
    // Calculate payback period
    const paybackPeriod = totalCost <= revenueIncrease 
      ? 'Within 1 season' 
      : `${Math.ceil(totalCost / revenueIncrease)} seasons`;
    
    return {
      totalCost: Math.round(totalCost),
      expectedYieldIncrease: yieldIncrease,
      expectedRevenueIncrease: Math.round(revenueIncrease),
      roi: Math.round(roi),
      paybackPeriod,
      environmentalImpact,
      soilHealthImprovement,
      sustainability
    };
  }

  /**
   * Determine recommended approach based on soil health and budget
   */
  private determineRecommendedApproach(
    input: FertilizerInput,
    organic: FertilizerRecommendation,
    _chemical: FertilizerRecommendation,
    mixed: FertilizerRecommendation
  ): 'organic' | 'chemical' | 'mixed' {
    const soilScore = input.soilHealthScore.overallScore;
    const budget = input.budget;
    
    // If soil health is poor, prioritize improvement (organic or mixed)
    if (soilScore < 50) {
      if (budget && budget < mixed.costBenefitAnalysis.totalCost) {
        return 'chemical'; // Budget constraint
      }
      return 'mixed'; // Best balance for poor soil
    }
    
    // If soil health is good, chemical can be used for quick results
    if (soilScore >= 70) {
      if (budget && budget >= organic.costBenefitAnalysis.totalCost) {
        return 'organic'; // Sustainable choice
      }
      return 'chemical'; // Cost-effective
    }
    
    // For moderate soil health, mixed is usually best
    return 'mixed';
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(
    organic: FertilizerRecommendation,
    _chemical: FertilizerRecommendation,
    mixed: FertilizerRecommendation
  ): string {
    return `Organic: ₹${organic.costBenefitAnalysis.totalCost} (${organic.costBenefitAnalysis.expectedYieldIncrease}% yield increase, high sustainability). ` +
           `Chemical: ₹${_chemical.costBenefitAnalysis.totalCost} (${_chemical.costBenefitAnalysis.expectedYieldIncrease}% yield increase, quick results). ` +
           `Mixed: ₹${mixed.costBenefitAnalysis.totalCost} (${mixed.costBenefitAnalysis.expectedYieldIncrease}% yield increase, balanced approach).`;
  }
}

// Singleton instance
let engineInstance: FertilizerRecommendationEngine | null = null;

export function getFertilizerRecommendationEngine(): FertilizerRecommendationEngine {
  if (!engineInstance) {
    engineInstance = new FertilizerRecommendationEngine();
  }
  return engineInstance;
}
