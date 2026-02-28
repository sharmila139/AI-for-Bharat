export { FarmProfileService } from './farm-profile';
export { MarketPriceService } from './market-prices';
export { PriceAnalysisService } from './price-analysis';
export { FinancialProjectionService } from './financial-projections';
export { CropTimelineService } from './crop-timeline';
export { RiskAssessmentService } from './risk-assessment';
export { CompanionCropService } from './companion-crops';
export { GovernmentSchemeService } from './government-schemes';

// OCR Services
export { OCRService, getOCRService } from './ocr-service';
export { OCRValidator, getOCRValidator } from './ocr-validator';
export { SoilFieldMapper, getSoilFieldMapper } from './soil-field-mapper';
export { ImageQualityChecker, getImageQualityChecker } from './image-quality-checker';
export { SoilOCRPipeline, getSoilOCRPipeline } from './soil-ocr-pipeline';

export type { SoilHealthCardData, OCRResult } from './ocr-service';
export type { ValidationResult, ValidationRanges } from './ocr-validator';
export type { MappedSoilData } from './soil-field-mapper';
export type { ImageQualityResult, ImageQualityIssue } from './image-quality-checker';
export type { OCRPipelineResult } from './soil-ocr-pipeline';
