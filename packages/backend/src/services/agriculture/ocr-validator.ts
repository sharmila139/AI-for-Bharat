/**
 * OCR Validation Pipeline
 * 
 * Validates extracted soil health card data to ensure values are within
 * reasonable ranges and meet quality thresholds.
 */

import { SoilHealthCardData } from './ocr-service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
  needsManualReview: boolean;
}

export interface ValidationRanges {
  pH: { min: number; max: number };
  nitrogen: { min: number; max: number };
  phosphorus: { min: number; max: number };
  potassium: { min: number; max: number };
  organicCarbon: { min: number; max: number };
  sulfur: { min: number; max: number };
  zinc: { min: number; max: number };
  iron: { min: number; max: number };
  copper: { min: number; max: number };
  manganese: { min: number; max: number };
  boron: { min: number; max: number };
  electricalConductivity: { min: number; max: number };
}

// Standard ranges for soil health parameters based on Indian soil health card standards
const STANDARD_RANGES: ValidationRanges = {
  pH: { min: 3.5, max: 10.5 },
  nitrogen: { min: 0, max: 1000 }, // kg/ha
  phosphorus: { min: 0, max: 200 }, // kg/ha
  potassium: { min: 0, max: 1000 }, // kg/ha
  organicCarbon: { min: 0, max: 5 }, // %
  sulfur: { min: 0, max: 100 }, // ppm
  zinc: { min: 0, max: 50 }, // ppm
  iron: { min: 0, max: 500 }, // ppm
  copper: { min: 0, max: 50 }, // ppm
  manganese: { min: 0, max: 200 }, // ppm
  boron: { min: 0, max: 10 }, // ppm
  electricalConductivity: { min: 0, max: 16 }, // dS/m
};

// Minimum confidence threshold for auto-acceptance (as per requirement 4.1)
const MIN_CONFIDENCE_THRESHOLD = 85;

// Minimum number of fields that should be extracted
const MIN_REQUIRED_FIELDS = 3;

export class OCRValidator {
  /**
   * Validate extracted soil health card data
   */
  validate(data: SoilHealthCardData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    // Check confidence threshold
    if (data.confidence < MIN_CONFIDENCE_THRESHOLD) {
      warnings.push(
        `OCR confidence (${data.confidence.toFixed(1)}%) is below threshold (${MIN_CONFIDENCE_THRESHOLD}%). Manual review recommended.`
      );
    }

    // Count extracted fields
    const extractedFields = this.countExtractedFields(data);
    if (extractedFields < MIN_REQUIRED_FIELDS) {
      errors.push(
        `Only ${extractedFields} field(s) extracted. Minimum ${MIN_REQUIRED_FIELDS} required. Image quality may be poor.`
      );
      isValid = false;
    }

    // Validate pH
    if (data.pH !== undefined) {
      if (!this.isInRange(data.pH, STANDARD_RANGES.pH)) {
        errors.push(
          `pH value ${data.pH} is outside valid range (${STANDARD_RANGES.pH.min}-${STANDARD_RANGES.pH.max})`
        );
        isValid = false;
      } else if (data.pH < 4.5 || data.pH > 9.5) {
        warnings.push(`pH value ${data.pH} is unusual but within acceptable range`);
      }
    }

    // Validate Nitrogen
    if (data.nitrogen !== undefined) {
      if (!this.isInRange(data.nitrogen, STANDARD_RANGES.nitrogen)) {
        errors.push(
          `Nitrogen value ${data.nitrogen} kg/ha is outside valid range (${STANDARD_RANGES.nitrogen.min}-${STANDARD_RANGES.nitrogen.max})`
        );
        isValid = false;
      }
    }

    // Validate Phosphorus
    if (data.phosphorus !== undefined) {
      if (!this.isInRange(data.phosphorus, STANDARD_RANGES.phosphorus)) {
        errors.push(
          `Phosphorus value ${data.phosphorus} kg/ha is outside valid range (${STANDARD_RANGES.phosphorus.min}-${STANDARD_RANGES.phosphorus.max})`
        );
        isValid = false;
      }
    }

    // Validate Potassium
    if (data.potassium !== undefined) {
      if (!this.isInRange(data.potassium, STANDARD_RANGES.potassium)) {
        errors.push(
          `Potassium value ${data.potassium} kg/ha is outside valid range (${STANDARD_RANGES.potassium.min}-${STANDARD_RANGES.potassium.max})`
        );
        isValid = false;
      }
    }

    // Validate Organic Carbon
    if (data.organicCarbon !== undefined) {
      if (!this.isInRange(data.organicCarbon, STANDARD_RANGES.organicCarbon)) {
        errors.push(
          `Organic Carbon value ${data.organicCarbon}% is outside valid range (${STANDARD_RANGES.organicCarbon.min}-${STANDARD_RANGES.organicCarbon.max})`
        );
        isValid = false;
      }
    }

    // Validate Sulfur
    if (data.sulfur !== undefined) {
      if (!this.isInRange(data.sulfur, STANDARD_RANGES.sulfur)) {
        errors.push(
          `Sulfur value ${data.sulfur} ppm is outside valid range (${STANDARD_RANGES.sulfur.min}-${STANDARD_RANGES.sulfur.max})`
        );
        isValid = false;
      }
    }

    // Validate Zinc
    if (data.zinc !== undefined) {
      if (!this.isInRange(data.zinc, STANDARD_RANGES.zinc)) {
        errors.push(
          `Zinc value ${data.zinc} ppm is outside valid range (${STANDARD_RANGES.zinc.min}-${STANDARD_RANGES.zinc.max})`
        );
        isValid = false;
      }
    }

    // Validate Iron
    if (data.iron !== undefined) {
      if (!this.isInRange(data.iron, STANDARD_RANGES.iron)) {
        errors.push(
          `Iron value ${data.iron} ppm is outside valid range (${STANDARD_RANGES.iron.min}-${STANDARD_RANGES.iron.max})`
        );
        isValid = false;
      }
    }

    // Validate Copper
    if (data.copper !== undefined) {
      if (!this.isInRange(data.copper, STANDARD_RANGES.copper)) {
        errors.push(
          `Copper value ${data.copper} ppm is outside valid range (${STANDARD_RANGES.copper.min}-${STANDARD_RANGES.copper.max})`
        );
        isValid = false;
      }
    }

    // Validate Manganese
    if (data.manganese !== undefined) {
      if (!this.isInRange(data.manganese, STANDARD_RANGES.manganese)) {
        errors.push(
          `Manganese value ${data.manganese} ppm is outside valid range (${STANDARD_RANGES.manganese.min}-${STANDARD_RANGES.manganese.max})`
        );
        isValid = false;
      }
    }

    // Validate Boron
    if (data.boron !== undefined) {
      if (!this.isInRange(data.boron, STANDARD_RANGES.boron)) {
        errors.push(
          `Boron value ${data.boron} ppm is outside valid range (${STANDARD_RANGES.boron.min}-${STANDARD_RANGES.boron.max})`
        );
        isValid = false;
      }
    }

    // Validate Electrical Conductivity
    if (data.electricalConductivity !== undefined) {
      if (!this.isInRange(data.electricalConductivity, STANDARD_RANGES.electricalConductivity)) {
        errors.push(
          `Electrical Conductivity value ${data.electricalConductivity} dS/m is outside valid range (${STANDARD_RANGES.electricalConductivity.min}-${STANDARD_RANGES.electricalConductivity.max})`
        );
        isValid = false;
      }
    }

    // Determine if manual review is needed
    const needsManualReview =
      data.confidence < MIN_CONFIDENCE_THRESHOLD ||
      errors.length > 0 ||
      extractedFields < MIN_REQUIRED_FIELDS;

    return {
      isValid,
      errors,
      warnings,
      confidence: data.confidence,
      needsManualReview,
    };
  }

  /**
   * Check if a value is within the specified range
   */
  private isInRange(value: number, range: { min: number; max: number }): boolean {
    return value >= range.min && value <= range.max;
  }

  /**
   * Count how many fields were successfully extracted
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

  /**
   * Get validation ranges for reference
   */
  getValidationRanges(): ValidationRanges {
    return { ...STANDARD_RANGES };
  }
}

// Singleton instance
let validatorInstance: OCRValidator | null = null;

export function getOCRValidator(): OCRValidator {
  if (!validatorInstance) {
    validatorInstance = new OCRValidator();
  }
  return validatorInstance;
}
