/**
 * Soil Health Score Calculator
 * 
 * Calculates overall soil health score (0-100) based on multiple factors:
 * - pH balance (optimal range 6.0-7.5)
 * - Organic matter content (optimal >0.5%)
 * - NPK status (nitrogen, phosphorus, potassium levels)
 * - Micronutrients (zinc, iron, manganese, copper, boron)
 * - Soil texture (based on soil type)
 * 
 * Validates: Requirements 4.3, Property 11
 */

export interface SoilData {
  // pH balance (0-14 scale)
  pH?: number;
  
  // Organic matter content (percentage)
  organicMatter?: number;
  
  // NPK levels (kg/ha or ppm)
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  
  // Micronutrients (ppm)
  zinc?: number;
  iron?: number;
  manganese?: number;
  copper?: number;
  boron?: number;
  
  // Soil texture/type
  texture?: 'sandy' | 'loamy' | 'clayey' | 'sandy-loam' | 'clay-loam' | 'silt-loam' | 'variable' | 'unknown';
  soilType?: string;
}

export interface FactorScore {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor' | 'unknown';
  details: string;
  recommendation?: string;
}

export interface SoilHealthScore {
  overallScore: number; // 0-100
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor';
  breakdown: {
    pH: FactorScore;
    organicMatter: FactorScore;
    npk: FactorScore;
    micronutrients: FactorScore;
    texture: FactorScore;
  };
  recommendations: string[];
  dataCompleteness: number; // Percentage of available data
}

export class SoilHealthCalculator {
  // Weights for each factor (must sum to 1.0)
  private readonly weights = {
    pH: 0.25,
    organicMatter: 0.20,
    npk: 0.30,
    micronutrients: 0.15,
    texture: 0.10,
  };

  /**
   * Calculate overall soil health score
   */
  calculateScore(soilData: SoilData): SoilHealthScore {
    // Calculate individual factor scores
    const pHScore = this.calculatePHScore(soilData.pH);
    const organicMatterScore = this.calculateOrganicMatterScore(soilData.organicMatter);
    const npkScore = this.calculateNPKScore(
      soilData.nitrogen,
      soilData.phosphorus,
      soilData.potassium
    );
    const micronutrientScore = this.calculateMicronutrientScore({
      zinc: soilData.zinc,
      iron: soilData.iron,
      manganese: soilData.manganese,
      copper: soilData.copper,
      boron: soilData.boron,
    });
    const textureScore = this.calculateTextureScore(soilData.texture, soilData.soilType);

    // Calculate data completeness
    const dataCompleteness = this.calculateDataCompleteness(soilData);

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore({
      pH: pHScore.score,
      organicMatter: organicMatterScore.score,
      npk: npkScore.score,
      micronutrients: micronutrientScore.score,
      texture: textureScore.score,
    });

    // Determine overall status (never 'unknown' for overall score)
    const overallStatus = this.getOverallStatusFromScore(overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      pH: pHScore,
      organicMatter: organicMatterScore,
      npk: npkScore,
      micronutrients: micronutrientScore,
      texture: textureScore,
    });

    return {
      overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
      overallStatus,
      breakdown: {
        pH: pHScore,
        organicMatter: organicMatterScore,
        npk: npkScore,
        micronutrients: micronutrientScore,
        texture: textureScore,
      },
      recommendations,
      dataCompleteness,
    };
  }

  /**
   * Calculate pH balance score (0-100)
   * Optimal range: 6.0-7.5
   */
  private calculatePHScore(pH?: number): FactorScore {
    if (pH === undefined || pH === null) {
      return {
        score: 50, // Neutral score when data unavailable
        status: 'unknown',
        details: 'pH data not available',
        recommendation: 'Test soil pH to determine acidity/alkalinity levels',
      };
    }

    let score: number;
    let status: FactorScore['status'];
    let details: string;
    let recommendation: string | undefined;

    // Optimal range: 6.0-7.5
    if (pH >= 6.0 && pH <= 7.5) {
      score = 100;
      status = 'excellent';
      details = `pH ${pH.toFixed(1)} is in optimal range (6.0-7.5)`;
    }
    // Slightly acidic (5.5-6.0) or slightly alkaline (7.5-8.0)
    else if ((pH >= 5.5 && pH < 6.0) || (pH > 7.5 && pH <= 8.0)) {
      score = 75;
      status = 'good';
      details = `pH ${pH.toFixed(1)} is slightly ${pH < 6.0 ? 'acidic' : 'alkaline'}`;
      recommendation = pH < 6.0
        ? 'Consider adding lime to raise pH'
        : 'Consider adding sulfur or organic matter to lower pH';
    }
    // Moderately acidic (5.0-5.5) or moderately alkaline (8.0-8.5)
    else if ((pH >= 5.0 && pH < 5.5) || (pH > 8.0 && pH <= 8.5)) {
      score = 50;
      status = 'fair';
      details = `pH ${pH.toFixed(1)} is moderately ${pH < 6.0 ? 'acidic' : 'alkaline'}`;
      recommendation = pH < 6.0
        ? 'Apply lime to correct acidity. Test pH regularly.'
        : 'Apply sulfur or gypsum to reduce alkalinity';
    }
    // Strongly acidic (<5.0) or strongly alkaline (>8.5)
    else if ((pH >= 4.0 && pH < 5.0) || (pH > 8.5 && pH <= 9.0)) {
      score = 25;
      status = 'poor';
      details = `pH ${pH.toFixed(1)} is strongly ${pH < 6.0 ? 'acidic' : 'alkaline'}`;
      recommendation = pH < 6.0
        ? 'Urgent: Apply lime in multiple applications. Consider growing acid-tolerant crops.'
        : 'Urgent: Apply sulfur and organic amendments. Improve drainage.';
    }
    // Extremely acidic or alkaline
    else {
      score = 10;
      status = 'very-poor';
      details = `pH ${pH.toFixed(1)} is extremely ${pH < 6.0 ? 'acidic' : 'alkaline'}`;
      recommendation = 'Critical: Soil requires major amendment. Consult agricultural expert.';
    }

    return { score, status, details, recommendation };
  }

  /**
   * Calculate organic matter score (0-100)
   * Optimal: >0.5%
   */
  private calculateOrganicMatterScore(organicMatter?: number): FactorScore {
    if (organicMatter === undefined || organicMatter === null) {
      return {
        score: 50,
        status: 'unknown',
        details: 'Organic matter data not available',
        recommendation: 'Test soil organic carbon/matter content',
      };
    }

    let score: number;
    let status: FactorScore['status'];
    let details: string;
    let recommendation: string | undefined;

    // Excellent: >2.0%
    if (organicMatter > 2.0) {
      score = 100;
      status = 'excellent';
      details = `Organic matter ${organicMatter.toFixed(2)}% is excellent`;
    }
    // Good: 1.0-2.0%
    else if (organicMatter >= 1.0) {
      score = 80;
      status = 'good';
      details = `Organic matter ${organicMatter.toFixed(2)}% is good`;
      recommendation = 'Maintain organic matter through crop residues and compost';
    }
    // Fair: 0.5-1.0%
    else if (organicMatter >= 0.5) {
      score = 60;
      status = 'fair';
      details = `Organic matter ${organicMatter.toFixed(2)}% is adequate`;
      recommendation = 'Add compost, farmyard manure, or green manure to increase organic matter';
    }
    // Poor: 0.25-0.5%
    else if (organicMatter >= 0.25) {
      score = 35;
      status = 'poor';
      details = `Organic matter ${organicMatter.toFixed(2)}% is low`;
      recommendation = 'Urgent: Apply organic amendments regularly. Practice crop rotation.';
    }
    // Very poor: <0.25%
    else {
      score = 15;
      status = 'very-poor';
      details = `Organic matter ${organicMatter.toFixed(2)}% is very low`;
      recommendation = 'Critical: Soil needs significant organic matter. Apply compost and cover crops.';
    }

    return { score, status, details, recommendation };
  }

  /**
   * Calculate NPK score (0-100)
   * Based on nitrogen, phosphorus, and potassium levels
   */
  private calculateNPKScore(
    nitrogen?: number,
    phosphorus?: number,
    potassium?: number
  ): FactorScore {
    const hasData = nitrogen !== undefined || phosphorus !== undefined || potassium !== undefined;

    if (!hasData) {
      return {
        score: 50,
        status: 'unknown',
        details: 'NPK data not available',
        recommendation: 'Test soil for nitrogen, phosphorus, and potassium levels',
      };
    }

    // Calculate individual NPK scores
    const nScore = this.calculateNitrogenScore(nitrogen);
    const pScore = this.calculatePhosphorusScore(phosphorus);
    const kScore = this.calculatePotassiumScore(potassium);

    // Average available scores
    const scores = [nScore, pScore, kScore].filter(s => s !== null) as number[];
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    const status = this.getStatusFromScore(avgScore);

    // Build details
    const details: string[] = [];
    if (nitrogen !== undefined) details.push(`N: ${nitrogen.toFixed(0)} kg/ha`);
    if (phosphorus !== undefined) details.push(`P: ${phosphorus.toFixed(0)} kg/ha`);
    if (potassium !== undefined) details.push(`K: ${potassium.toFixed(0)} kg/ha`);

    // Generate recommendation
    let recommendation: string | undefined;
    if (avgScore < 60) {
      const deficient: string[] = [];
      if (nScore !== null && nScore < 60) deficient.push('nitrogen');
      if (pScore !== null && pScore < 60) deficient.push('phosphorus');
      if (kScore !== null && kScore < 60) deficient.push('potassium');

      if (deficient.length > 0) {
        recommendation = `Apply fertilizers to address ${deficient.join(', ')} deficiency`;
      }
    }

    return {
      score: Math.round(avgScore * 10) / 10,
      status,
      details: details.join(', '),
      recommendation,
    };
  }

  /**
   * Calculate nitrogen score
   * Low: <280 kg/ha, Medium: 280-560 kg/ha, High: >560 kg/ha
   */
  private calculateNitrogenScore(nitrogen?: number): number | null {
    if (nitrogen === undefined || nitrogen === null) return null;

    if (nitrogen >= 560) return 100;
    if (nitrogen >= 420) return 85;
    if (nitrogen >= 280) return 70;
    if (nitrogen >= 140) return 45;
    return 20;
  }

  /**
   * Calculate phosphorus score
   * Low: <10 kg/ha, Medium: 10-25 kg/ha, High: >25 kg/ha
   */
  private calculatePhosphorusScore(phosphorus?: number): number | null {
    if (phosphorus === undefined || phosphorus === null) return null;

    if (phosphorus >= 25) return 100;
    if (phosphorus >= 18) return 85;
    if (phosphorus >= 10) return 70;
    if (phosphorus >= 5) return 45;
    return 20;
  }

  /**
   * Calculate potassium score
   * Low: <110 kg/ha, Medium: 110-280 kg/ha, High: >280 kg/ha
   */
  private calculatePotassiumScore(potassium?: number): number | null {
    if (potassium === undefined || potassium === null) return null;

    if (potassium >= 280) return 100;
    if (potassium >= 210) return 85;
    if (potassium >= 110) return 70;
    if (potassium >= 55) return 45;
    return 20;
  }

  /**
   * Calculate micronutrient score (0-100)
   */
  private calculateMicronutrientScore(micronutrients: {
    zinc?: number;
    iron?: number;
    manganese?: number;
    copper?: number;
    boron?: number;
  }): FactorScore {
    const { zinc, iron, manganese, copper, boron } = micronutrients;
    const hasData = zinc !== undefined || iron !== undefined || 
                    manganese !== undefined || copper !== undefined || boron !== undefined;

    if (!hasData) {
      return {
        score: 50,
        status: 'unknown',
        details: 'Micronutrient data not available',
        recommendation: 'Test soil for micronutrient levels',
      };
    }

    // Calculate individual micronutrient scores
    const scores: number[] = [];
    const deficient: string[] = [];

    if (zinc !== undefined) {
      const zScore = zinc >= 0.6 ? 100 : zinc >= 0.3 ? 60 : 30;
      scores.push(zScore);
      if (zScore < 60) deficient.push('zinc');
    }

    if (iron !== undefined) {
      const feScore = iron >= 4.5 ? 100 : iron >= 2.5 ? 60 : 30;
      scores.push(feScore);
      if (feScore < 60) deficient.push('iron');
    }

    if (manganese !== undefined) {
      const mnScore = manganese >= 1.0 ? 100 : manganese >= 0.5 ? 60 : 30;
      scores.push(mnScore);
      if (mnScore < 60) deficient.push('manganese');
    }

    if (copper !== undefined) {
      const cuScore = copper >= 0.2 ? 100 : copper >= 0.1 ? 60 : 30;
      scores.push(cuScore);
      if (cuScore < 60) deficient.push('copper');
    }

    if (boron !== undefined) {
      const bScore = boron >= 0.5 ? 100 : boron >= 0.25 ? 60 : 30;
      scores.push(bScore);
      if (bScore < 60) deficient.push('boron');
    }

    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const status = this.getStatusFromScore(avgScore);

    let recommendation: string | undefined;
    if (deficient.length > 0) {
      recommendation = `Apply micronutrient fertilizers for ${deficient.join(', ')}`;
    }

    return {
      score: Math.round(avgScore * 10) / 10,
      status,
      details: `Micronutrient levels ${status}`,
      recommendation,
    };
  }

  /**
   * Calculate texture score (0-100)
   */
  private calculateTextureScore(texture?: string, soilType?: string): FactorScore {
    if (!texture && !soilType) {
      return {
        score: 50,
        status: 'unknown',
        details: 'Soil texture data not available',
        recommendation: 'Determine soil texture through field test or lab analysis',
      };
    }

    // Score based on texture suitability for general agriculture
    const textureScores: Record<string, number> = {
      'loamy': 100,
      'silt-loam': 95,
      'clay-loam': 85,
      'sandy-loam': 80,
      'clayey': 60,
      'sandy': 50,
      'variable': 70,
      'unknown': 50,
    };

    const score = textureScores[texture || 'unknown'] || 50;
    const status = this.getStatusFromScore(score);

    let details = `Soil texture: ${texture || soilType || 'unknown'}`;
    let recommendation: string | undefined;

    if (texture === 'sandy') {
      recommendation = 'Add organic matter to improve water retention';
    } else if (texture === 'clayey') {
      recommendation = 'Add organic matter and sand to improve drainage';
    }

    return { score, status, details, recommendation };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(scores: {
    pH: number;
    organicMatter: number;
    npk: number;
    micronutrients: number;
    texture: number;
  }): number {
    const weightedSum =
      scores.pH * this.weights.pH +
      scores.organicMatter * this.weights.organicMatter +
      scores.npk * this.weights.npk +
      scores.micronutrients * this.weights.micronutrients +
      scores.texture * this.weights.texture;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, weightedSum));
  }

  /**
   * Calculate data completeness percentage
   */
  private calculateDataCompleteness(soilData: SoilData): number {
    const fields = [
      soilData.pH,
      soilData.organicMatter,
      soilData.nitrogen,
      soilData.phosphorus,
      soilData.potassium,
      soilData.zinc,
      soilData.iron,
      soilData.manganese,
      soilData.copper,
      soilData.boron,
      soilData.texture || soilData.soilType,
    ];

    const availableFields = fields.filter(f => f !== undefined && f !== null).length;
    return Math.round((availableFields / fields.length) * 100);
  }

  /**
   * Get status from score
   */
  private getStatusFromScore(score: number): FactorScore['status'] {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'very-poor';
  }

  /**
   * Get overall status from score (never returns 'unknown')
   */
  private getOverallStatusFromScore(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'very-poor';
  }

  /**
   * Generate recommendations based on factor scores
   */
  private generateRecommendations(breakdown: {
    pH: FactorScore;
    organicMatter: FactorScore;
    npk: FactorScore;
    micronutrients: FactorScore;
    texture: FactorScore;
  }): string[] {
    const recommendations: string[] = [];

    // Collect recommendations from each factor
    Object.values(breakdown).forEach(factor => {
      if (factor.recommendation) {
        recommendations.push(factor.recommendation);
      }
    });

    // Add general recommendations based on overall health
    const avgScore = (
      breakdown.pH.score +
      breakdown.organicMatter.score +
      breakdown.npk.score +
      breakdown.micronutrients.score +
      breakdown.texture.score
    ) / 5;

    if (avgScore < 50) {
      recommendations.push('Consider comprehensive soil testing for detailed analysis');
      recommendations.push('Consult with agricultural extension officer for soil improvement plan');
    }

    return recommendations;
  }
}

// Singleton instance
let calculatorInstance: SoilHealthCalculator | null = null;

export function getSoilHealthCalculator(): SoilHealthCalculator {
  if (!calculatorInstance) {
    calculatorInstance = new SoilHealthCalculator();
  }
  return calculatorInstance;
}
