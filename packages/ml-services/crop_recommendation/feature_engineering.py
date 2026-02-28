"""
Crop Recommendation - Feature Engineering
Advanced feature engineering for soil, climate, and market factors
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from datetime import datetime

class CropFeatureEngineering:
    """Create advanced features for crop recommendation"""
    
    def __init__(self):
        self.engineered_features = []
        
    def create_soil_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer soil-related features
        - NPK ratio and balance
        - Soil fertility index
        - pH category
        - Nutrient deficiency indicators
        """
        df_soil = df.copy()
        
        # NPK Ratio (normalized)
        total_npk = df_soil['nitrogen'] + df_soil['phosphorus'] + df_soil['potassium']
        df_soil['npk_ratio_n'] = df_soil['nitrogen'] / (total_npk + 1e-6)
        df_soil['npk_ratio_p'] = df_soil['phosphorus'] / (total_npk + 1e-6)
        df_soil['npk_ratio_k'] = df_soil['potassium'] / (total_npk + 1e-6)
        
        # NPK Balance Score (0-1, higher is better balanced)
        # Ideal ratio is roughly 4:2:1 for N:P:K
        ideal_n, ideal_p, ideal_k = 4, 2, 1
        ideal_total = ideal_n + ideal_p + ideal_k
        ideal_ratio_n = ideal_n / ideal_total
        ideal_ratio_p = ideal_p / ideal_total
        ideal_ratio_k = ideal_k / ideal_total
        
        df_soil['npk_balance_score'] = 1 - (
            abs(df_soil['npk_ratio_n'] - ideal_ratio_n) +
            abs(df_soil['npk_ratio_p'] - ideal_ratio_p) +
            abs(df_soil['npk_ratio_k'] - ideal_ratio_k)
        ) / 2
        
        # Soil Fertility Index (composite score)
        # Normalize each component to 0-1 scale
        n_norm = np.clip(df_soil['nitrogen'] / 150, 0, 1)
        p_norm = np.clip(df_soil['phosphorus'] / 80, 0, 1)
        k_norm = np.clip(df_soil['potassium'] / 100, 0, 1)
        
        df_soil['soil_fertility_index'] = (n_norm + p_norm + k_norm) / 3
        
        # pH Category
        # Acidic: <5.5, Slightly Acidic: 5.5-6.5, Neutral: 6.5-7.5, Alkaline: >7.5
        df_soil['ph_acidic'] = (df_soil['ph'] < 5.5).astype(int)
        df_soil['ph_slightly_acidic'] = ((df_soil['ph'] >= 5.5) & (df_soil['ph'] < 6.5)).astype(int)
        df_soil['ph_neutral'] = ((df_soil['ph'] >= 6.5) & (df_soil['ph'] < 7.5)).astype(int)
        df_soil['ph_alkaline'] = (df_soil['ph'] >= 7.5).astype(int)
        
        # Nutrient Deficiency Indicators
        df_soil['nitrogen_deficient'] = (df_soil['nitrogen'] < 60).astype(int)
        df_soil['phosphorus_deficient'] = (df_soil['phosphorus'] < 30).astype(int)
        df_soil['potassium_deficient'] = (df_soil['potassium'] < 30).astype(int)
        
        # Nutrient Excess Indicators
        df_soil['nitrogen_excess'] = (df_soil['nitrogen'] > 150).astype(int)
        df_soil['phosphorus_excess'] = (df_soil['phosphorus'] > 80).astype(int)
        df_soil['potassium_excess'] = (df_soil['potassium'] > 100).astype(int)
        
        # Soil Type Suitability Scores (based on domain knowledge)
        soil_suitability = {
            'alluvial': 0.9,  # Highly fertile
            'loamy': 0.95,    # Best for most crops
            'black': 0.85,    # Good for cotton, wheat
            'red': 0.75,      # Moderate fertility
            'sandy': 0.6,     # Low water retention
            'clayey': 0.7,    # Poor drainage
            'laterite': 0.5   # Low fertility
        }
        
        if 'soil_type' in df_soil.columns:
            df_soil['soil_suitability_score'] = df_soil['soil_type'].map(soil_suitability).fillna(0.5)
        
        return df_soil
    
    def create_climate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer climate-related features
        - Temperature stress indicators
        - Humidity categories
        - Rainfall adequacy
        - Growing degree days
        - Climate suitability index
        """
        df_climate = df.copy()
        
        # Temperature Categories
        df_climate['temp_cold'] = (df_climate['temperature'] < 15).astype(int)
        df_climate['temp_cool'] = ((df_climate['temperature'] >= 15) & (df_climate['temperature'] < 20)).astype(int)
        df_climate['temp_moderate'] = ((df_climate['temperature'] >= 20) & (df_climate['temperature'] < 30)).astype(int)
        df_climate['temp_hot'] = (df_climate['temperature'] >= 30).astype(int)
        
        # Temperature Stress Score (0-1, lower is better)
        # Optimal range is 20-30°C for most crops
        df_climate['temp_stress_score'] = np.where(
            (df_climate['temperature'] >= 20) & (df_climate['temperature'] <= 30),
            0,  # No stress
            np.minimum(
                abs(df_climate['temperature'] - 25) / 25,  # Distance from optimal
                1.0
            )
        )
        
        # Humidity Categories
        df_climate['humidity_low'] = (df_climate['humidity'] < 50).astype(int)
        df_climate['humidity_moderate'] = ((df_climate['humidity'] >= 50) & (df_climate['humidity'] < 70)).astype(int)
        df_climate['humidity_high'] = ((df_climate['humidity'] >= 70) & (df_climate['humidity'] < 85)).astype(int)
        df_climate['humidity_very_high'] = (df_climate['humidity'] >= 85).astype(int)
        
        # Rainfall Categories (mm per month)
        df_climate['rainfall_low'] = (df_climate['rainfall'] < 50).astype(int)
        df_climate['rainfall_moderate'] = ((df_climate['rainfall'] >= 50) & (df_climate['rainfall'] < 100)).astype(int)
        df_climate['rainfall_high'] = ((df_climate['rainfall'] >= 100) & (df_climate['rainfall'] < 200)).astype(int)
        df_climate['rainfall_very_high'] = (df_climate['rainfall'] >= 200).astype(int)
        
        # Growing Degree Days (GDD) - simplified calculation
        # GDD = (Tmax + Tmin)/2 - Tbase, where Tbase = 10°C for most crops
        base_temp = 10
        df_climate['growing_degree_days'] = np.maximum(df_climate['temperature'] - base_temp, 0)
        
        # Evapotranspiration Index (simplified)
        # Higher temperature and lower humidity = higher ET
        df_climate['evapotranspiration_index'] = (
            df_climate['temperature'] * (100 - df_climate['humidity']) / 100
        )
        
        # Water Availability Score (rainfall vs evapotranspiration)
        df_climate['water_availability_score'] = np.clip(
            df_climate['rainfall'] / (df_climate['evapotranspiration_index'] * 10 + 1),
            0, 1
        )
        
        # Climate Suitability Index (composite score)
        # Combines temperature, humidity, and rainfall suitability
        temp_suitability = 1 - df_climate['temp_stress_score']
        humidity_suitability = np.clip((df_climate['humidity'] - 40) / 60, 0, 1)  # Optimal 40-100%
        rainfall_suitability = np.clip(df_climate['rainfall'] / 200, 0, 1)  # Optimal up to 200mm
        
        df_climate['climate_suitability_index'] = (
            temp_suitability * 0.4 +
            humidity_suitability * 0.3 +
            rainfall_suitability * 0.3
        )
        
        # Drought Risk Indicator
        df_climate['drought_risk'] = (
            (df_climate['rainfall'] < 50) & 
            (df_climate['humidity'] < 50)
        ).astype(int)
        
        # Flood Risk Indicator
        df_climate['flood_risk'] = (df_climate['rainfall'] > 250).astype(int)
        
        # Pest Risk Indicator (high humidity + moderate temperature)
        df_climate['pest_risk'] = (
            (df_climate['humidity'] > 70) & 
            (df_climate['temperature'] > 20) & 
            (df_climate['temperature'] < 35)
        ).astype(int)
        
        return df_climate
    
    def create_market_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer market-related features
        - Price categories
        - Profitability indicators
        - Market attractiveness score
        """
        df_market = df.copy()
        
        # Price Categories (relative to median)
        if 'market_price' in df_market.columns:
            median_price = df_market['market_price'].median()
            
            df_market['price_low'] = (df_market['market_price'] < median_price * 0.8).astype(int)
            df_market['price_moderate'] = (
                (df_market['market_price'] >= median_price * 0.8) & 
                (df_market['market_price'] < median_price * 1.2)
            ).astype(int)
            df_market['price_high'] = (df_market['market_price'] >= median_price * 1.2).astype(int)
            
            # Price Attractiveness Score (normalized)
            df_market['price_attractiveness'] = np.clip(
                df_market['market_price'] / (median_price * 2),
                0, 1
            )
        
        # Yield-Price Profitability Index
        if 'historical_yield' in df_market.columns and 'market_price' in df_market.columns:
            # Revenue per unit area
            df_market['revenue_potential'] = df_market['historical_yield'] * df_market['market_price']
            
            # Normalize to 0-1 scale
            max_revenue = df_market['revenue_potential'].max()
            df_market['profitability_index'] = df_market['revenue_potential'] / (max_revenue + 1e-6)
        
        # Yield Categories
        if 'historical_yield' in df_market.columns:
            median_yield = df_market['historical_yield'].median()
            
            df_market['yield_low'] = (df_market['historical_yield'] < median_yield * 0.7).astype(int)
            df_market['yield_moderate'] = (
                (df_market['historical_yield'] >= median_yield * 0.7) & 
                (df_market['historical_yield'] < median_yield * 1.3)
            ).astype(int)
            df_market['yield_high'] = (df_market['historical_yield'] >= median_yield * 1.3).astype(int)
        
        return df_market
    
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction features between different domains
        - Soil-climate interactions
        - Climate-market interactions
        - Overall suitability score
        """
        df_interaction = df.copy()
        
        # Soil-Climate Interaction: Fertility + Climate Suitability
        if 'soil_fertility_index' in df_interaction.columns and 'climate_suitability_index' in df_interaction.columns:
            df_interaction['soil_climate_score'] = (
                df_interaction['soil_fertility_index'] * 0.5 +
                df_interaction['climate_suitability_index'] * 0.5
            )
        
        # Water-Soil Interaction: Rainfall + Soil Type
        if 'rainfall' in df_interaction.columns and 'soil_type' in df_interaction.columns:
            # Sandy soil needs more water, clayey retains more
            soil_water_retention = {
                'sandy': 0.3, 'loamy': 0.7, 'clayey': 0.9,
                'alluvial': 0.6, 'black': 0.8, 'red': 0.5, 'laterite': 0.4
            }
            df_interaction['soil_water_retention'] = df_interaction['soil_type'].map(
                soil_water_retention
            ).fillna(0.5)
            
            # Effective water availability
            df_interaction['effective_water'] = (
                df_interaction['rainfall'] * df_interaction['soil_water_retention']
            )
        
        # Temperature-Humidity Interaction: Heat stress
        if 'temperature' in df_interaction.columns and 'humidity' in df_interaction.columns:
            # High temp + low humidity = high stress
            df_interaction['heat_stress_index'] = (
                df_interaction['temperature'] * (100 - df_interaction['humidity']) / 100
            )
        
        # NPK-Climate Interaction: Nutrient availability affected by climate
        if all(col in df_interaction.columns for col in ['soil_fertility_index', 'temperature', 'humidity']):
            # Optimal temperature and humidity improve nutrient availability
            climate_factor = np.clip(
                (df_interaction['temperature'] - 15) / 20 * 
                df_interaction['humidity'] / 100,
                0, 1
            )
            df_interaction['nutrient_availability'] = (
                df_interaction['soil_fertility_index'] * climate_factor
            )
        
        # Overall Suitability Score (composite of all factors)
        suitability_components = []
        weights = []
        
        if 'soil_fertility_index' in df_interaction.columns:
            suitability_components.append(df_interaction['soil_fertility_index'])
            weights.append(0.25)
        
        if 'climate_suitability_index' in df_interaction.columns:
            suitability_components.append(df_interaction['climate_suitability_index'])
            weights.append(0.25)
        
        if 'profitability_index' in df_interaction.columns:
            suitability_components.append(df_interaction['profitability_index'])
            weights.append(0.25)
        
        if 'water_availability_score' in df_interaction.columns:
            suitability_components.append(df_interaction['water_availability_score'])
            weights.append(0.25)
        
        if suitability_components:
            # Normalize weights
            weights = np.array(weights) / sum(weights)
            df_interaction['overall_suitability_score'] = sum(
                comp * w for comp, w in zip(suitability_components, weights)
            )
        
        return df_interaction
    
    def create_seasonal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create season-specific features
        - Season suitability for different crops
        - Regional-seasonal interactions
        """
        df_seasonal = df.copy()
        
        # Season-specific indicators
        if 'season' in df_seasonal.columns:
            df_seasonal['is_kharif'] = (df_seasonal['season'] == 'kharif').astype(int)
            df_seasonal['is_rabi'] = (df_seasonal['season'] == 'rabi').astype(int)
            df_seasonal['is_zaid'] = (df_seasonal['season'] == 'zaid').astype(int)
        
        # Region-specific indicators
        if 'region' in df_seasonal.columns:
            df_seasonal['is_north'] = (df_seasonal['region'] == 'north').astype(int)
            df_seasonal['is_south'] = (df_seasonal['region'] == 'south').astype(int)
            df_seasonal['is_east'] = (df_seasonal['region'] == 'east').astype(int)
            df_seasonal['is_west'] = (df_seasonal['region'] == 'west').astype(int)
            df_seasonal['is_central'] = (df_seasonal['region'] == 'central').astype(int)
        
        return df_seasonal
    
    def engineer_all_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all feature engineering steps
        """
        print("Engineering features...")
        
        # Apply each feature engineering step
        df_engineered = df.copy()
        
        print("  - Creating soil features...")
        df_engineered = self.create_soil_features(df_engineered)
        
        print("  - Creating climate features...")
        df_engineered = self.create_climate_features(df_engineered)
        
        print("  - Creating market features...")
        df_engineered = self.create_market_features(df_engineered)
        
        print("  - Creating seasonal features...")
        df_engineered = self.create_seasonal_features(df_engineered)
        
        print("  - Creating interaction features...")
        df_engineered = self.create_interaction_features(df_engineered)
        
        # Store list of engineered features
        original_cols = set(df.columns)
        new_cols = set(df_engineered.columns) - original_cols
        self.engineered_features = list(new_cols)
        
        print(f"  ✓ Created {len(self.engineered_features)} new features")
        
        return df_engineered
    
    def get_feature_importance_groups(self) -> Dict[str, List[str]]:
        """
        Group features by category for interpretability
        """
        return {
            'soil_features': [f for f in self.engineered_features if 'soil' in f or 'npk' in f or 'ph' in f or 'nutrient' in f],
            'climate_features': [f for f in self.engineered_features if 'temp' in f or 'humidity' in f or 'rainfall' in f or 'climate' in f or 'water' in f],
            'market_features': [f for f in self.engineered_features if 'price' in f or 'yield' in f or 'profit' in f or 'revenue' in f],
            'seasonal_features': [f for f in self.engineered_features if 'season' in f or 'region' in f or 'is_' in f],
            'interaction_features': [f for f in self.engineered_features if 'score' in f or 'index' in f or 'interaction' in f]
        }

def main():
    """Test feature engineering pipeline"""
    import sys
    sys.path.append('..')
    
    from data_preparation import CropDataPreparation
    
    print("Testing feature engineering pipeline...")
    
    # Generate sample data
    prep = CropDataPreparation()
    df = prep.generate_synthetic_data(n_samples=1000)
    df_encoded = prep.encode_categorical_features(df)
    
    # Apply feature engineering
    engineer = CropFeatureEngineering()
    df_engineered = engineer.engineer_all_features(df_encoded)
    
    print(f"\nOriginal features: {len(df.columns)}")
    print(f"After encoding: {len(df_encoded.columns)}")
    print(f"After engineering: {len(df_engineered.columns)}")
    print(f"New features created: {len(engineer.engineered_features)}")
    
    # Show feature groups
    print("\nFeature groups:")
    groups = engineer.get_feature_importance_groups()
    for group_name, features in groups.items():
        print(f"  {group_name}: {len(features)} features")
    
    # Show sample of engineered features
    print("\nSample engineered features:")
    print(df_engineered[engineer.engineered_features[:10]].head())
    
    print("\n✓ Feature engineering test complete!")

if __name__ == '__main__':
    main()
