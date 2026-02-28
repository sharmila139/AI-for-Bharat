/**
 * OCR Service for Soil Health Card Parsing
 * 
 * This service integrates Tesseract OCR to extract nutrient values from
 * government soil health card images. It handles text extraction, validation,
 * and field mapping for agricultural analysis.
 */

import Tesseract, { Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface SoilHealthCardData {
  pH?: number;
  nitrogen?: number; // N in kg/ha
  phosphorus?: number; // P in kg/ha
  potassium?: number; // K in kg/ha
  organicCarbon?: number; // OC in %
  sulfur?: number; // S in ppm
  zinc?: number; // Zn in ppm
  iron?: number; // Fe in ppm
  copper?: number; // Cu in ppm
  manganese?: number; // Mn in ppm
  boron?: number; // B in ppm
  electricalConductivity?: number; // EC in dS/m
  confidence: number;
  rawText: string;
}

export class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  /**
   * Initialize the Tesseract worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Configure for better accuracy with documents
      await this.worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
      });

      this.isInitialized = true;
      console.log('OCR Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw new Error('OCR service initialization failed');
    }
  }

  /**
   * Perform OCR on an image buffer or file path
   */
  async extractText(imageSource: string | Buffer): Promise<OCRResult> {
    if (!this.isInitialized || !this.worker) {
      await this.initialize();
    }

    try {
      const result = await this.worker!.recognize(imageSource);
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse soil health card data from OCR text
   */
  parseSoilHealthCard(ocrResult: OCRResult): SoilHealthCardData {
    const text = ocrResult.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const data: SoilHealthCardData = {
      confidence: ocrResult.confidence,
      rawText: text,
    };

    // Extract pH value
    const phMatch = this.extractValue(lines, ['ph', 'p.h', 'p h'], /(\d+\.?\d*)/);
    if (phMatch) {
      data.pH = parseFloat(phMatch);
    }

    // Extract Nitrogen (N)
    const nMatch = this.extractValue(lines, ['nitrogen', 'n', 'n2'], /(\d+\.?\d*)/);
    if (nMatch) {
      data.nitrogen = parseFloat(nMatch);
    }

    // Extract Phosphorus (P)
    const pMatch = this.extractValue(lines, ['phosphorus', 'phosphorous', 'p', 'p2o5'], /(\d+\.?\d*)/);
    if (pMatch) {
      data.phosphorus = parseFloat(pMatch);
    }

    // Extract Potassium (K)
    const kMatch = this.extractValue(lines, ['potassium', 'k', 'k2o'], /(\d+\.?\d*)/);
    if (kMatch) {
      data.potassium = parseFloat(kMatch);
    }

    // Extract Organic Carbon (OC)
    const ocMatch = this.extractValue(lines, ['organic carbon', 'oc', 'o.c', 'organic c'], /(\d+\.?\d*)/);
    if (ocMatch) {
      data.organicCarbon = parseFloat(ocMatch);
    }

    // Extract Sulfur (S)
    const sMatch = this.extractValue(lines, ['sulfur', 'sulphur', 's'], /(\d+\.?\d*)/);
    if (sMatch) {
      data.sulfur = parseFloat(sMatch);
    }

    // Extract Zinc (Zn)
    const znMatch = this.extractValue(lines, ['zinc', 'zn'], /(\d+\.?\d*)/);
    if (znMatch) {
      data.zinc = parseFloat(znMatch);
    }

    // Extract Iron (Fe)
    const feMatch = this.extractValue(lines, ['iron', 'fe'], /(\d+\.?\d*)/);
    if (feMatch) {
      data.iron = parseFloat(feMatch);
    }

    // Extract Copper (Cu)
    const cuMatch = this.extractValue(lines, ['copper', 'cu'], /(\d+\.?\d*)/);
    if (cuMatch) {
      data.copper = parseFloat(cuMatch);
    }

    // Extract Manganese (Mn)
    const mnMatch = this.extractValue(lines, ['manganese', 'mn'], /(\d+\.?\d*)/);
    if (mnMatch) {
      data.manganese = parseFloat(mnMatch);
    }

    // Extract Boron (B)
    const bMatch = this.extractValue(lines, ['boron', 'b'], /(\d+\.?\d*)/);
    if (bMatch) {
      data.boron = parseFloat(bMatch);
    }

    // Extract Electrical Conductivity (EC)
    const ecMatch = this.extractValue(lines, ['ec', 'electrical conductivity', 'e.c'], /(\d+\.?\d*)/);
    if (ecMatch) {
      data.electricalConductivity = parseFloat(ecMatch);
    }

    return data;
  }

  /**
   * Helper method to extract numeric values from text lines
   */
  private extractValue(lines: string[], keywords: string[], valuePattern: RegExp): string | null {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          // Look for numeric value in the same line or next line
          const match = line.match(valuePattern);
          if (match) {
            return match[1];
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Process a soil health card image and return parsed data
   */
  async processSoilHealthCard(imageSource: string | Buffer): Promise<SoilHealthCardData> {
    const ocrResult = await this.extractText(imageSource);
    return this.parseSoilHealthCard(ocrResult);
  }

  /**
   * Cleanup resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('OCR Service terminated');
    }
  }
}

// Singleton instance
let ocrServiceInstance: OCRService | null = null;

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService();
  }
  return ocrServiceInstance;
}
