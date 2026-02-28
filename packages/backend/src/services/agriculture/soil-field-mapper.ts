/**
 * Soil Field Mapper
 * 
 * Maps extracted OCR data to standardized soil health fields with
 * unit conversions and normalization.
 */

import { SoilHealthCardData } from './ocr-service';

export interface MappedSoilData {
  // Primary nutrients (NPK)
  nitrogen: {
    value: number | null;
    unit: 'kg/ha';
    status: 'low' | 'medium' | 'high' | 'unknown';
    recommendation: string;
  };
  phosphorus: {
    value: number | null;
    unit: 'kg/ha';
    status: 'low' | 'medium' | 'high' | 'unknown';
    recommendation: string;
  };
  potassium: {
    value: number | null;
    unit: 'kg/ha';
    status: 'low' | 'medium' | 'high' | 'unknown';
    recommendation: string;
  };

  // Soil properties
  pH: {
    value: number | null;
    status: 'acidic' | 'neutral' | 'alkaline' | 'unknown';
    recommendation: string;
  };
  organicCarbon: {
    value: number | null;
    unit: '%';
    status: 'low' | 'medium' | 'high' | 'unknown';
    recommendation: string;
  };
  electricalConductivity: {
    value: number | null;
    unit: 'dS/m';
    status: 'normal' | 'saline' | 'highly-saline' | 'unknown';
    recommendation: string;
  };

  // Micronutrients
  micronutrients: {
    sulfur: {
      value: number | null;
      unit: 'ppm';
      status: 'deficient' | 'sufficient' | 'excess' | 'unknown';
    };
    zinc: {
      value: number | null;
      unit: 'ppm';
      status: 'deficient' | 'sufficient' | 'excess' | 'unknown';
    };
    iron: {
      value: number | null;
      unit: 'ppm';
      status: 'deficient' | 'sufficient' | 'excess' | 'unknown';
    };
    copper: {
      value: number | null;
      unit: 'ppm';
      status: 'deficient' | 'sufficient' | 'excess' | 'unknown';
    };
    manganese: {
      value: number | null;
      unit: 'ppm';
      status: 'deficient' | 'sufficient' | 'excess' | 'unknown';
    };
    boron: {
      value: number | null;
      unit: 'ppm';
      status: 'deficient' | 'sufficient' | 'excess' | 'unknown';
    };
  };

  // Overall assessment
  overallHealthScore: number; // 0-100
  extractedFieldsCount: number;
  confidence: number;
}

export class SoilFieldMapper {
  /**
   * Map OCR extracted data to standardized soil health format
   */
  mapFields(data: SoilHealthCardData): MappedSoilData {
    const mapped: MappedSoilData = {
      nitrogen: this.mapNitrogen(data.nitrogen),
      phosphorus: this.mapPhosphorus(data.phosphorus),
      potassium: this.mapPotassium(data.potassium),
      pH: this.mapPH(data.pH),
      organicCarbon: this.mapOrganicCarbon(data.organicCarbon),
      electricalConductivity: this.mapEC(data.electricalConductivity),
      micronutrients: {
        sulfur: this.mapMicronutrient(data.sulfur, 'sulfur'),
        zinc: this.mapMicronutrient(data.zinc, 'zinc'),
        iron: this.mapMicronutrient(data.iron, 'iron'),
        copper: this.mapMicronutrient(data.copper, 'copper'),
        manganese: this.mapMicronutrient(data.manganese, 'manganese'),
        boron: this.mapMicronutrient(data.boron, 'boron'),
      },
      overallHealthScore: 0,
      extractedFieldsCount: this.countExtractedFields(data),
      confidence: data.confidence,
    };

    // Calculate overall health score
    mapped.overallHealthScore = this.calculateHealthScore(mapped);

    return mapped;
  }

  /**
   * Map Nitrogen values
   */
  private mapNitrogen(value: number | undefined): MappedSoilData['nitrogen'] {
    if (value === undefined) {
      return {
        value: null,
        unit: 'kg/ha',
        status: 'unknown',
        recommendation: 'Unable to extract nitrogen value. Please enter manually.',
      };
    }

    let status: 'low' | 'medium' | 'high';
    let recommendation: string;

    if (value < 280) {
      status = 'low';
      recommendation = 'Apply nitrogen-rich fertilizers. Consider urea (46-0-0) at 120-150 kg/ha.';
    } else if (value < 560) {
      status = 'medium';
      recommendation = 'Maintain current nitrogen levels. Apply 80-100 kg/ha urea as needed.';
    } else {
      status = 'high';
      recommendation = 'Nitrogen levels are adequate. Reduce nitrogen fertilizer application.';
    }

    return { value, unit: 'kg/ha', status, recommendation };
  }

  /**
   * Map Phosphorus values
   */
  private mapPhosphorus(value: number | undefined): MappedSoilData['phosphorus'] {
    if (value === undefined) {
      return {
        value: null,
        unit: 'kg/ha',
        status: 'unknown',
        recommendation: 'Unable to extract phosphorus value. Please enter manually.',
      };
    }

    let status: 'low' | 'medium' | 'high';
    let recommendation: string;

    if (value < 12.5) {
      status = 'low';
      recommendation = 'Apply phosphorus fertilizers. Consider DAP (18-46-0) at 100-125 kg/ha.';
    } else if (value < 25) {
      status = 'medium';
      recommendation = 'Maintain phosphorus levels. Apply 60-80 kg/ha DAP as needed.';
    } else {
      status = 'high';
      recommendation = 'Phosphorus levels are adequate. Minimal application needed.';
    }

    return { value, unit: 'kg/ha', status, recommendation };
  }

  /**
   * Map Potassium values
   */
  private mapPotassium(value: number | undefined): MappedSoilData['potassium'] {
    if (value === undefined) {
      return {
        value: null,
        unit: 'kg/ha',
        status: 'unknown',
        recommendation: 'Unable to extract potassium value. Please enter manually.',
      };
    }

    let status: 'low' | 'medium' | 'high';
    let recommendation: string;

    if (value < 110) {
      status = 'low';
      recommendation = 'Apply potassium fertilizers. Consider MOP (0-0-60) at 80-100 kg/ha.';
    } else if (value < 280) {
      status = 'medium';
      recommendation = 'Maintain potassium levels. Apply 40-60 kg/ha MOP as needed.';
    } else {
      status = 'high';
      recommendation = 'Potassium levels are adequate. Minimal application needed.';
    }

    return { value, unit: 'kg/ha', status, recommendation };
  }

  /**
   * Map pH values
   */
  private mapPH(value: number | undefined): MappedSoilData['pH'] {
    if (value === undefined) {
      return {
        value: null,
        status: 'unknown',
        recommendation: 'Unable to extract pH value. Please enter manually.',
      };
    }

    let status: 'acidic' | 'neutral' | 'alkaline';
    let recommendation: string;

    if (value < 6.5) {
      status = 'acidic';
      recommendation = `Soil is acidic (pH ${value}). Apply lime at 2-4 tonnes/ha to raise pH.`;
    } else if (value <= 7.5) {
      status = 'neutral';
      recommendation = `Soil pH is optimal (${value}). No pH correction needed.`;
    } else {
      status = 'alkaline';
      recommendation = `Soil is alkaline (pH ${value}). Apply gypsum or sulfur to lower pH.`;
    }

    return { value, status, recommendation };
  }

  /**
   * Map Organic Carbon values
   */
  private mapOrganicCarbon(value: number | undefined): MappedSoilData['organicCarbon'] {
    if (value === undefined) {
      return {
        value: null,
        unit: '%',
        status: 'unknown',
        recommendation: 'Unable to extract organic carbon value. Please enter manually.',
      };
    }

    let status: 'low' | 'medium' | 'high';
    let recommendation: string;

    if (value < 0.5) {
      status = 'low';
      recommendation = 'Organic matter is low. Add compost, FYM, or green manure at 10-15 tonnes/ha.';
    } else if (value < 0.75) {
      status = 'medium';
      recommendation = 'Organic matter is moderate. Maintain with 5-8 tonnes/ha compost annually.';
    } else {
      status = 'high';
      recommendation = 'Organic matter is good. Continue current organic practices.';
    }

    return { value, unit: '%', status, recommendation };
  }

  /**
   * Map Electrical Conductivity values
   */
  private mapEC(value: number | undefined): MappedSoilData['electricalConductivity'] {
    if (value === undefined) {
      return {
        value: null,
        unit: 'dS/m',
        status: 'unknown',
        recommendation: 'Unable to extract EC value. Please enter manually.',
      };
    }

    let status: 'normal' | 'saline' | 'highly-saline';
    let recommendation: string;

    if (value < 2) {
      status = 'normal';
      recommendation = 'Soil salinity is normal. No corrective action needed.';
    } else if (value < 4) {
      status = 'saline';
      recommendation = 'Soil is moderately saline. Improve drainage and leach salts with irrigation.';
    } else {
      status = 'highly-saline';
      recommendation = 'Soil is highly saline. Install drainage, apply gypsum, and grow salt-tolerant crops.';
    }

    return { value, unit: 'dS/m', status, recommendation };
  }

  /**
   * Map micronutrient values
   */
  private mapMicronutrient(
    value: number | undefined,
    nutrient: 'sulfur' | 'zinc' | 'iron' | 'copper' | 'manganese' | 'boron'
  ): { value: number | null; unit: 'ppm'; status: 'deficient' | 'sufficient' | 'excess' | 'unknown' } {
    if (value === undefined) {
      return { value: null, unit: 'ppm', status: 'unknown' };
    }

    // Define thresholds for each micronutrient
    const thresholds: Record<string, { deficient: number; sufficient: number }> = {
      sulfur: { deficient: 10, sufficient: 20 },
      zinc: { deficient: 0.6, sufficient: 1.2 },
      iron: { deficient: 4.5, sufficient: 10 },
      copper: { deficient: 0.2, sufficient: 0.5 },
      manganese: { deficient: 2, sufficient: 5 },
      boron: { deficient: 0.5, sufficient: 1 },
    };

    const threshold = thresholds[nutrient];
    let status: 'deficient' | 'sufficient' | 'excess';

    if (value < threshold.deficient) {
      status = 'deficient';
    } else if (value < threshold.sufficient) {
      status = 'sufficient';
    } else {
      status = 'excess';
    }

    return { value, unit: 'ppm', status };
  }

  /**
   * Calculate overall soil health score (0-100)
   */
  private calculateHealthScore(mapped: MappedSoilData): number {
    let score = 0;
    let components = 0;

    // pH score (20 points)
    if (mapped.pH.value !== null) {
      if (mapped.pH.status === 'neutral') {
        score += 20;
      } else if (mapped.pH.status === 'acidic' || mapped.pH.status === 'alkaline') {
        const deviation = Math.abs(mapped.pH.value - 7);
        score += Math.max(0, 20 - deviation * 5);
      }
      components++;
    }

    // NPK scores (15 points each = 45 total)
    const npkFields = [mapped.nitrogen, mapped.phosphorus, mapped.potassium];
    for (const field of npkFields) {
      if (field.value !== null) {
        if (field.status === 'medium' || field.status === 'high') {
          score += 15;
        } else if (field.status === 'low') {
          score += 7;
        }
        components++;
      }
    }

    // Organic carbon score (15 points)
    if (mapped.organicCarbon.value !== null) {
      if (mapped.organicCarbon.status === 'high') {
        score += 15;
      } else if (mapped.organicCarbon.status === 'medium') {
        score += 10;
      } else if (mapped.organicCarbon.status === 'low') {
        score += 5;
      }
      components++;
    }

    // EC score (10 points)
    if (mapped.electricalConductivity.value !== null) {
      if (mapped.electricalConductivity.status === 'normal') {
        score += 10;
      } else if (mapped.electricalConductivity.status === 'saline') {
        score += 5;
      }
      components++;
    }

    // Micronutrients score (10 points)
    const micronutrients = Object.values(mapped.micronutrients);
    const sufficientMicros = micronutrients.filter(m => m.status === 'sufficient' || m.status === 'excess').length;
    const totalMicros = micronutrients.filter(m => m.value !== null).length;
    if (totalMicros > 0) {
      score += (sufficientMicros / totalMicros) * 10;
      components++;
    }

    // Normalize score if not all components are available
    if (components === 0) {
      return 0;
    }

    const maxPossibleScore = 100;
    const actualMaxScore = components === 6 ? maxPossibleScore : (score / components) * 6;

    return Math.round(Math.min(100, (score / actualMaxScore) * 100));
  }

  /**
   * Count extracted fields
   */
  private countExtractedFields(data: SoilHealthCardData): number {
    let count = 0;
    const fields: (keyof SoilHealthCardData)[] = [
      'pH',
      'nitrogen',
      'phosphorus',
      'potassium',
      'organicCarbon',
      'sulfur',
      'zinc',
      'iron',
      'copper',
      'manganese',
      'boron',
      'electricalConductivity',
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        count++;
      }
    }

    return count;
  }
}

// Singleton instance
let mapperInstance: SoilFieldMapper | null = null;

export function getSoilFieldMapper(): SoilFieldMapper {
  if (!mapperInstance) {
    mapperInstance = new SoilFieldMapper();
  }
  return mapperInstance;
}
