/**
 * Farm Profile Type Definitions
 */

export interface FarmLocation {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  state: string;
  pincode: string;
}

export interface LandSize {
  value: number;
  unit: 'acre' | 'hectare';
}

export interface CurrentCrop {
  cropName: string;
  sowingDate: string;
  expectedHarvestDate: string;
  area: number;
}

export interface FarmProfile {
  userId: string;
  farmId: string;
  farmName: string;
  location: FarmLocation;
  landSize: LandSize;
  soilType?: string;
  irrigationType?: 'drip' | 'sprinkler' | 'flood' | 'rainfed' | 'mixed';
  currentCrops?: CurrentCrop[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmProfileInput {
  farmName: string;
  location: FarmLocation;
  landSize: LandSize;
  soilType?: string;
  irrigationType?: 'drip' | 'sprinkler' | 'flood' | 'rainfed' | 'mixed';
  currentCrops?: CurrentCrop[];
}

export interface UpdateFarmProfileInput {
  farmName?: string;
  location?: FarmLocation;
  landSize?: LandSize;
  soilType?: string;
  irrigationType?: 'drip' | 'sprinkler' | 'flood' | 'rainfed' | 'mixed';
  currentCrops?: CurrentCrop[];
}
