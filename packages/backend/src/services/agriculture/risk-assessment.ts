/**
 * Risk Factor Identification and Assessment
 * Analyzes multiple risk factors for crop cultivation
 */

export interface RiskAssessmentInput {
  cropId: string;
  cropName: string;
  region: string;
  soilType: string;
  irrigationType: 'rainfed' | 'drip' | 'sprinkler' | 'flood';
  landArea: number;
  sowingMonth: number;
  farmerExperience: 'beginner' | 'intermediate' | 'expert';
  investmentCapacity: 'low' | 'medium' | 'high';
  marketAccess: 'poor' | 'moderate' | 'good';
}

export interface RiskFactor {
  category: 'weather' | 'market' | 'pest' | 'disease' | 'financial' | 'operational' | 'soil';
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  impact: string;
  mitigation: string[];
  estimatedLoss?: number; // Potential loss in INR
}

export interface RiskAssessment {
  cropId: string;
  cropName: string;
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  risks: RiskFactor[];
  topRisks: RiskFactor[]; // Top 5 risks by severity and probability
  mitigationPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  insuranceRecommendations: string[];
  contingencyPlans: string[];
  assessedAt: Date;
}

// Crop-specific risk profiles
const CROP_RISK_PROFILES: Record<string, any> = {
  rice: {
    weatherRisks: ['flood', 'drought', 'cyclone', 'unseasonal_rain'],
    pestRisks: ['stem_borer', 'leaf_folder', 'brown_plant_hopper'],
    diseaseRisks: ['blast', 'bacterial_blight', 'sheath_blight'],
    marketVolatility: 'low',
    waterDependency: 'high'
  },
  wheat: {
    weatherRisks: ['frost', 'heat_stress', 'hailstorm'],
    pestRisks: ['aphids', 'termites', 'army_worm'],
    diseaseRisks: ['rust', 'powdery_mildew', 'karnal_bunt'],
    marketVolatility: 'low',
    waterDependency: 'medium'
  },
  cotton: {
    weatherRisks: ['drought', 'excess_rain', 'high_temperature'],
    pestRisks: ['bollworm', 'whitefly', 'aphids', 'jassids'],
    diseaseRisks: ['wilt', 'leaf_curl', 'boll_rot'],
    marketVolatility: 'high',
    waterDependency: 'high'
  },
  sugarcane: {
    weatherRisks: ['drought', 'waterlogging', 'frost'],
    pestRisks: ['shoot_borer', 'white_grub', 'termites'],
    diseaseRisks: ['red_rot', 'smut', 'wilt'],
    marketVolatility: 'low',
    waterDependency: 'very_high'
  },
  tomato: {
    weatherRisks: ['heat_stress', 'heavy_rain', 'hailstorm'],
    pestRisks: ['fruit_borer', 'whitefly', 'leaf_miner'],
    diseaseRisks: ['late_blight', 'early_blight', 'leaf_curl'],
    marketVolatility: 'very_high',
    waterDependency: 'high'
  },
  onion: {
    weatherRisks: ['unseasonal_rain', 'hailstorm', 'high_temperature'],
    pestRisks: ['thrips', 'cutworm', 'maggot'],
    diseaseRisks: ['purple_blotch', 'stemphylium_blight', 'basal_rot'],
    marketVolatility: 'very_high',
    waterDependency: 'medium'
  }
};

// Regional weather risk patterns
const REGIONAL_WEATHER_RISKS: Record<string, string[]> = {
  'north': ['frost', 'fog', 'hailstorm', 'heat_wave'],
  'south': ['cyclone', 'drought', 'unseasonal_rain'],
  'east': ['flood', 'cyclone', 'high_humidity'],
  'west': ['drought', 'heat_wave', 'erratic_monsoon'],
  'central': ['drought', 'heat_wave', 'erratic_monsoon']
};

export class RiskAssessmentService {
  /**
   * Perform comprehensive risk assessment
   */
  assessRisks(input: RiskAssessmentInput): RiskAssessment {
    const risks: RiskFactor[] = [];

    // Assess different risk categories
    risks.push(...this.assessWeatherRisks(input));
    risks.push(...this.assessMarketRisks(input));
    risks.push(...this.assessPestAndDiseaseRisks(input));
    risks.push(...this.assessFinancialRisks(input));
    risks.push(...this.assessOperationalRisks(input));
    risks.push(...this.assessSoilRisks(input));

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore(risks);
    const riskLevel = this.determineRiskLevel(overallRiskScore);

    // Identify top risks
    const topRisks = this.identifyTopRisks(risks, 5);

    // Generate mitigation plan
    const mitigationPlan = this.generateMitigationPlan(risks, input);

    // Generate insurance recommendations
    const insuranceRecommendations = this.generateInsuranceRecommendations(risks, input);

    // Generate contingency plans
    const contingencyPlans = this.generateContingencyPlans(risks, input);

    return {
      cropId: input.cropId,
      cropName: input.cropName,
      overallRiskScore,
      riskLevel,
      risks,
      topRisks,
      mitigationPlan,
      insuranceRecommendations,
      contingencyPlans,
      assessedAt: new Date()
    };
  }

  /**
   * Assess weather-related risks
   */
  private assessWeatherRisks(input: RiskAssessmentInput): RiskFactor[] {
    const risks: RiskFactor[] = [];
    const cropKey = input.cropName.toLowerCase();
    const cropProfile = CROP_RISK_PROFILES[cropKey];

    if (!cropProfile) return risks;

    // Rainfed cultivation risk
    if (input.irrigationType === 'rainfed') {
      risks.push({
        category: 'weather',
        risk: 'Monsoon Dependency',
        severity: 'high',
        probability: 70,
        impact: 'Complete crop failure possible if monsoon fails',
        mitigation: [
          'Purchase weather-based crop insurance',
          'Select drought-resistant varieties',
          'Implement rainwater harvesting',
          'Plan for supplementary irrigation'
        ],
        estimatedLoss: input.landArea * 30000
      });
    }

    // Drought risk
    if (cropProfile.waterDependency === 'high' || cropProfile.waterDependency === 'very_high') {
      risks.push({
        category: 'weather',
        risk: 'Drought Stress',
        severity: input.irrigationType === 'rainfed' ? 'critical' : 'medium',
        probability: 40,
        impact: 'Reduced yield by 30-50%, poor quality produce',
        mitigation: [
          'Install drip irrigation system',
          'Use mulching to conserve moisture',
          'Apply water-retaining polymers',
          'Schedule irrigation based on crop stage'
        ],
        estimatedLoss: input.landArea * 20000
      });
    }

    // Flood/waterlogging risk
    if (cropProfile.weatherRisks.includes('flood') || cropProfile.weatherRisks.includes('waterlogging')) {
      risks.push({
        category: 'weather',
        risk: 'Waterlogging/Flooding',
        severity: 'high',
        probability: 30,
        impact: 'Root damage, disease outbreak, complete crop loss',
        mitigation: [
          'Ensure proper field drainage',
          'Create raised beds',
          'Dig drainage channels',
          'Monitor weather forecasts closely'
        ],
        estimatedLoss: input.landArea * 35000
      });
    }

    // Frost risk (winter crops)
    if (input.sowingMonth >= 10 || input.sowingMonth <= 2) {
      if (cropProfile.weatherRisks.includes('frost')) {
        risks.push({
          category: 'weather',
          risk: 'Frost Damage',
          severity: 'high',
          probability: 25,
          impact: 'Tissue damage, stunted growth, yield loss of 20-40%',
          mitigation: [
            'Use frost-resistant varieties',
            'Apply light irrigation before frost',
            'Use smoke or fog to prevent frost',
            'Cover crops with plastic sheets'
          ],
          estimatedLoss: input.landArea * 15000
        });
      }
    }

    // Heat stress (summer crops)
    if (input.sowingMonth >= 3 && input.sowingMonth <= 6) {
      risks.push({
        category: 'weather',
        risk: 'Heat Stress',
        severity: 'medium',
        probability: 50,
        impact: 'Reduced flowering, poor fruit set, yield loss of 15-25%',
        mitigation: [
          'Increase irrigation frequency',
          'Use shade nets during peak heat',
          'Apply anti-transpirants',
          'Select heat-tolerant varieties'
        ],
        estimatedLoss: input.landArea * 12000
      });
    }

    return risks;
  }

  /**
   * Assess market-related risks
   */
  private assessMarketRisks(input: RiskAssessmentInput): RiskFactor[] {
    const risks: RiskFactor[] = [];
    const cropKey = input.cropName.toLowerCase();
    const cropProfile = CROP_RISK_PROFILES[cropKey];

    if (!cropProfile) return risks;

    // Price volatility risk
    if (cropProfile.marketVolatility === 'high' || cropProfile.marketVolatility === 'very_high') {
      const severity = cropProfile.marketVolatility === 'very_high' ? 'high' : 'medium';
      risks.push({
        category: 'market',
        risk: 'Price Volatility',
        severity,
        probability: 60,
        impact: 'Price fluctuations of 30-50%, unpredictable returns',
        mitigation: [
          'Enter into contract farming agreements',
          'Use forward contracts or futures',
          'Diversify crop portfolio',
          'Store produce for better prices',
          'Join farmer producer organizations'
        ],
        estimatedLoss: input.landArea * 25000
      });
    }

    // Market access risk
    if (input.marketAccess === 'poor') {
      risks.push({
        category: 'market',
        risk: 'Limited Market Access',
        severity: 'high',
        probability: 80,
        impact: 'Forced to sell at lower prices, dependence on middlemen',
        mitigation: [
          'Connect with e-NAM platform',
          'Join farmer cooperatives',
          'Explore direct marketing channels',
          'Invest in storage facilities'
        ],
        estimatedLoss: input.landArea * 18000
      });
    }

    // Oversupply risk
    risks.push({
      category: 'market',
      risk: 'Market Oversupply',
      severity: 'medium',
      probability: 35,
      impact: 'Price crash due to excess supply, 20-40% price reduction',
      mitigation: [
        'Monitor crop acreage reports',
        'Diversify with multiple crops',
        'Plan staggered harvesting',
        'Explore value addition opportunities'
      ]
    });

    return risks;
  }

  /**
   * Assess pest and disease risks
   */
  private assessPestAndDiseaseRisks(input: RiskAssessmentInput): RiskFactor[] {
    const risks: RiskFactor[] = [];
    const cropKey = input.cropName.toLowerCase();
    const cropProfile = CROP_RISK_PROFILES[cropKey];

    if (!cropProfile) return risks;

    // Major pest risk
    if (cropProfile.pestRisks && cropProfile.pestRisks.length > 0) {
      const majorPest = cropProfile.pestRisks[0];
      risks.push({
        category: 'pest',
        risk: `${this.formatRiskName(majorPest)} Infestation`,
        severity: 'high',
        probability: 55,
        impact: 'Yield loss of 20-40%, quality deterioration',
        mitigation: [
          'Regular field monitoring',
          'Use pheromone traps',
          'Apply IPM practices',
          'Use resistant varieties',
          'Timely pesticide application'
        ],
        estimatedLoss: input.landArea * 22000
      });
    }

    // Disease risk
    if (cropProfile.diseaseRisks && cropProfile.diseaseRisks.length > 0) {
      const majorDisease = cropProfile.diseaseRisks[0];
      risks.push({
        category: 'disease',
        risk: `${this.formatRiskName(majorDisease)} Disease`,
        severity: 'high',
        probability: 45,
        impact: 'Yield loss of 25-50%, complete crop failure in severe cases',
        mitigation: [
          'Use disease-resistant varieties',
          'Ensure proper spacing',
          'Apply preventive fungicides',
          'Remove infected plants',
          'Practice crop rotation'
        ],
        estimatedLoss: input.landArea * 28000
      });
    }

    // Beginner farmer risk
    if (input.farmerExperience === 'beginner') {
      risks.push({
        category: 'operational',
        risk: 'Pest/Disease Misidentification',
        severity: 'medium',
        probability: 60,
        impact: 'Delayed treatment, wrong pesticide use, increased damage',
        mitigation: [
          'Use mobile apps for pest identification',
          'Consult agricultural extension officers',
          'Attend training programs',
          'Join farmer WhatsApp groups'
        ]
      });
    }

    return risks;
  }

  /**
   * Assess financial risks
   */
  private assessFinancialRisks(input: RiskAssessmentInput): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Low investment capacity risk
    if (input.investmentCapacity === 'low') {
      risks.push({
        category: 'financial',
        risk: 'Insufficient Capital',
        severity: 'high',
        probability: 70,
        impact: 'Unable to buy quality inputs, compromised crop management',
        mitigation: [
          'Apply for Kisan Credit Card',
          'Explore government subsidy schemes',
          'Join self-help groups',
          'Consider crop loans from banks',
          'Start with smaller area'
        ]
      });
    }

    // Input cost escalation
    risks.push({
      category: 'financial',
      risk: 'Input Cost Inflation',
      severity: 'medium',
      probability: 50,
      impact: 'Reduced profit margins, 10-20% increase in costs',
      mitigation: [
        'Buy inputs in bulk during off-season',
        'Use organic alternatives where possible',
        'Join farmer cooperatives for bulk purchase',
        'Explore government subsidy schemes'
      ]
    });

    // Credit risk
    risks.push({
      category: 'financial',
      risk: 'Debt Burden',
      severity: 'medium',
      probability: 40,
      impact: 'Interest payments reduce profitability, debt trap risk',
      mitigation: [
        'Maintain detailed financial records',
        'Avoid high-interest informal loans',
        'Use interest subvention schemes',
        'Plan repayment schedule carefully'
      ]
    });

    return risks;
  }

  /**
   * Assess operational risks
   */
  private assessOperationalRisks(input: RiskAssessmentInput): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Labor shortage risk
    risks.push({
      category: 'operational',
      risk: 'Labor Shortage',
      severity: 'medium',
      probability: 45,
      impact: 'Delayed operations, increased labor costs, yield loss',
      mitigation: [
        'Plan operations in advance',
        'Use mechanization where possible',
        'Engage labor through contractors',
        'Consider family labor pooling'
      ]
    });

    // Equipment failure
    risks.push({
      category: 'operational',
      risk: 'Equipment/Machinery Failure',
      severity: 'low',
      probability: 30,
      impact: 'Operational delays, additional rental costs',
      mitigation: [
        'Regular equipment maintenance',
        'Keep backup arrangements',
        'Use custom hiring centers',
        'Maintain emergency fund'
      ]
    });

    // Knowledge gap (for beginners)
    if (input.farmerExperience === 'beginner') {
      risks.push({
        category: 'operational',
        risk: 'Technical Knowledge Gap',
        severity: 'high',
        probability: 75,
        impact: 'Suboptimal practices, lower yields, higher costs',
        mitigation: [
          'Attend Krishi Vigyan Kendra training',
          'Use mobile advisory services',
          'Consult experienced farmers',
          'Follow scientific recommendations',
          'Start with well-known crops'
        ]
      });
    }

    return risks;
  }

  /**
   * Assess soil-related risks
   */
  private assessSoilRisks(input: RiskAssessmentInput): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Poor soil type
    if (input.soilType.toLowerCase() === 'sandy' || input.soilType.toLowerCase() === 'laterite') {
      risks.push({
        category: 'soil',
        risk: 'Suboptimal Soil Type',
        severity: 'medium',
        probability: 100,
        impact: 'Reduced yield by 20-30%, higher input requirements',
        mitigation: [
          'Add organic matter regularly',
          'Use green manuring',
          'Apply soil conditioners',
          'Select suitable crop varieties',
          'Implement soil conservation practices'
        ],
        estimatedLoss: input.landArea * 15000
      });
    }

    // Soil degradation
    risks.push({
      category: 'soil',
      risk: 'Soil Health Degradation',
      severity: 'medium',
      probability: 40,
      impact: 'Declining yields over time, increased fertilizer needs',
      mitigation: [
        'Practice crop rotation',
        'Use balanced fertilization',
        'Add organic manure',
        'Conduct regular soil testing',
        'Avoid monocropping'
      ]
    });

    return risks;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(risks: RiskFactor[]): number {
    if (risks.length === 0) return 0;

    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    
    let totalScore = 0;
    risks.forEach(risk => {
      const severityWeight = severityWeights[risk.severity];
      const riskScore = (severityWeight * risk.probability) / 100;
      totalScore += riskScore;
    });

    // Normalize to 0-100 scale
    const maxPossibleScore = risks.length * 4;
    return Math.min(100, Math.round((totalScore / maxPossibleScore) * 100));
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'very-high' {
    if (score < 25) return 'low';
    if (score < 50) return 'moderate';
    if (score < 75) return 'high';
    return 'very-high';
  }

  /**
   * Identify top risks
   */
  private identifyTopRisks(risks: RiskFactor[], count: number): RiskFactor[] {
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    
    return risks
      .sort((a, b) => {
        const scoreA = severityWeights[a.severity] * a.probability;
        const scoreB = severityWeights[b.severity] * b.probability;
        return scoreB - scoreA;
      })
      .slice(0, count);
  }

  /**
   * Generate mitigation plan
   */
  private generateMitigationPlan(risks: RiskFactor[], input: RiskAssessmentInput): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions (before sowing)
    immediate.push('Conduct soil testing');
    immediate.push('Purchase quality seeds from certified sources');
    immediate.push('Arrange for adequate irrigation water');
    
    if (input.farmerExperience === 'beginner') {
      immediate.push('Consult with agricultural extension officer');
    }

    // Short-term actions (during crop season)
    shortTerm.push('Regular field monitoring for pests and diseases');
    shortTerm.push('Timely application of fertilizers and pesticides');
    shortTerm.push('Monitor weather forecasts daily');
    shortTerm.push('Maintain crop diary for record-keeping');

    // Long-term actions (for future seasons)
    longTerm.push('Invest in drip irrigation system');
    longTerm.push('Build farm pond for water storage');
    longTerm.push('Diversify with multiple crops');
    longTerm.push('Join farmer producer organization');
    longTerm.push('Attend regular training programs');

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Generate insurance recommendations
   */
  private generateInsuranceRecommendations(risks: RiskFactor[], input: RiskAssessmentInput): string[] {
    const recommendations: string[] = [];

    const hasHighWeatherRisk = risks.some(r => r.category === 'weather' && r.severity === 'high');
    const hasHighMarketRisk = risks.some(r => r.category === 'market' && r.severity === 'high');

    if (hasHighWeatherRisk || input.irrigationType === 'rainfed') {
      recommendations.push('Pradhan Mantri Fasal Bima Yojana (PMFBY) - Weather-based crop insurance');
    }

    if (hasHighMarketRisk) {
      recommendations.push('Price Deficiency Payment Scheme - Protection against price crash');
    }

    recommendations.push('Consider comprehensive crop insurance covering yield loss');
    
    if (input.investmentCapacity === 'low') {
      recommendations.push('Opt for subsidized insurance schemes with premium support');
    }

    return recommendations;
  }

  /**
   * Generate contingency plans
   */
  private generateContingencyPlans(risks: RiskFactor[], input: RiskAssessmentInput): string[] {
    const plans: string[] = [];

    plans.push('If monsoon fails: Switch to short-duration drought-resistant varieties');
    plans.push('If pest outbreak occurs: Implement emergency IPM measures and seek expert advice');
    plans.push('If prices crash: Store produce in warehouses and wait for better prices');
    plans.push('If labor shortage: Prioritize critical operations and use mechanization');
    plans.push('If crop fails: Claim insurance and plan for alternative income sources');

    return plans;
  }

  /**
   * Format risk name for display
   */
  private formatRiskName(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
