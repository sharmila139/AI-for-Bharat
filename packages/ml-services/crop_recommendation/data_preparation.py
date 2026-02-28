"""
Crop Recommendation - Data Preparation
Collects and prepares training data for crop recommendation model
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import json
from datetime import datetime

class CropDataPreparation:
    """Prepare training data for crop recommendation model"""
    
    def __init__(self):
        self.crop_data = []
        self.feature_columns = [
            'soil_type_encoded',
            'nitrogen', 'phosphorus', 'potassium', 'ph',
            'temperature', 'humidity', 'rainfall',
            'region_encoded',
            'season_encoded',
            'market_price',
            'historical_yield'
        ]
        
    def generate_synthetic_data(self, n_samples: int = 10000) -> pd.DataFrame:
        """
        Generate synthetic training data for crop recommendation
        In production, this would be replaced with real agricultural data
        """
        np.random.seed(42)
        
        # Define crops and their ideal conditions
        crop_profiles = {
            'rice': {
                'soil_types': ['alluvial', 'clayey', 'loamy'],
                'nitrogen': (80, 120), 'phosphorus': (40, 60), 'potassium': (40, 60),
                'ph': (5.5, 7.0), 'temperature': (20, 35), 'humidity': (70, 90),
                'rainfall': (150, 300), 'yield': (2000, 3000)
            },
            'wheat': {
                'soil_types': ['alluvial', 'loamy', 'black'],
                'nitrogen': (60, 100), 'phosphorus': (30, 50), 'potassium': (30, 50),
                'ph': (6.0, 7.5), 'temperature': (15, 25), 'humidity': (50, 70),
                'rainfall': (50, 100), 'yield': (1800, 2500)
            },
            'cotton': {
                'soil_types': ['black', 'alluvial', 'red'],
                'nitrogen': (60, 100), 'phosphorus': (30, 50), 'potassium': (30, 50),
                'ph': (6.5, 8.0), 'temperature': (21, 35), 'humidity': (50, 80),
                'rainfall': (50, 120), 'yield': (600, 1000)
            },
            'maize': {
                'soil_types': ['loamy', 'alluvial', 'red'],
                'nitrogen': (80, 120), 'phosphorus': (40, 60), 'potassium': (40, 60),
                'ph': (5.5, 7.5), 'temperature': (18, 32), 'humidity': (60, 80),
                'rainfall': (60, 120), 'yield': (1800, 2800)
            },
            'sugarcane': {
                'soil_types': ['loamy', 'alluvial', 'black'],
                'nitrogen': (100, 150), 'phosphorus': (50, 80), 'potassium': (50, 80),
                'ph': (6.0, 7.5), 'temperature': (20, 35), 'humidity': (70, 90),
                'rainfall': (150, 250), 'yield': (30000, 40000)
            },
            'tomato': {
                'soil_types': ['loamy', 'sandy', 'red'],
                'nitrogen': (100, 150), 'phosphorus': (50, 80), 'potassium': (50, 80),
                'ph': (6.0, 7.0), 'temperature': (18, 30), 'humidity': (60, 80),
                'rainfall': (60, 100), 'yield': (10000, 15000)
            },
            'potato': {
                'soil_types': ['loamy', 'sandy', 'alluvial'],
                'nitrogen': (80, 120), 'phosphorus': (40, 60), 'potassium': (60, 100),
                'ph': (5.0, 6.5), 'temperature': (15, 25), 'humidity': (70, 90),
                'rainfall': (50, 100), 'yield': (7000, 10000)
            },
            'onion': {
                'soil_types': ['loamy', 'alluvial', 'red'],
                'nitrogen': (60, 100), 'phosphorus': (30, 50), 'potassium': (40, 60),
                'ph': (6.0, 7.0), 'temperature': (15, 30), 'humidity': (60, 80),
                'rainfall': (40, 80), 'yield': (8000, 12000)
            }
        }
        
        regions = ['north', 'south', 'east', 'west', 'central']
        seasons = ['kharif', 'rabi', 'zaid']
        
        data = []
        crops = list(crop_profiles.keys())
        samples_per_crop = n_samples // len(crops)
        
        for crop in crops:
            profile = crop_profiles[crop]
            
            for _ in range(samples_per_crop):
                # Generate features based on crop profile
                soil_type = np.random.choice(profile['soil_types'])
                
                # Add some noise to ideal conditions
                nitrogen = np.random.uniform(*profile['nitrogen'])
                phosphorus = np.random.uniform(*profile['phosphorus'])
                potassium = np.random.uniform(*profile['potassium'])
                ph = np.random.uniform(*profile['ph'])
                temperature = np.random.uniform(*profile['temperature'])
                humidity = np.random.uniform(*profile['humidity'])
                rainfall = np.random.uniform(*profile['rainfall'])
                
                region = np.random.choice(regions)
                season = np.random.choice(seasons)
                
                # Market price (INR per kg) - varies by crop
                base_prices = {
                    'rice': 20, 'wheat': 18, 'cotton': 50, 'maize': 15,
                    'sugarcane': 3, 'tomato': 25, 'potato': 12, 'onion': 20
                }
                market_price = base_prices[crop] * np.random.uniform(0.8, 1.2)
                
                # Historical yield
                historical_yield = np.random.uniform(*profile['yield'])
                
                data.append({
                    'crop': crop,
                    'soil_type': soil_type,
                    'nitrogen': nitrogen,
                    'phosphorus': phosphorus,
                    'potassium': potassium,
                    'ph': ph,
                    'temperature': temperature,
                    'humidity': humidity,
                    'rainfall': rainfall,
                    'region': region,
                    'season': season,
                    'market_price': market_price,
                    'historical_yield': historical_yield
                })
        
        df = pd.DataFrame(data)
        return df
    
    def encode_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features"""
        df_encoded = df.copy()
        
        # Encode soil type
        soil_type_map = {
            'alluvial': 0, 'black': 1, 'red': 2,
            'laterite': 3, 'sandy': 4, 'clayey': 5, 'loamy': 6
        }
        df_encoded['soil_type_encoded'] = df_encoded['soil_type'].map(soil_type_map)
        
        # Encode region
        region_map = {'north': 0, 'south': 1, 'east': 2, 'west': 3, 'central': 4}
        df_encoded['region_encoded'] = df_encoded['region'].map(region_map)
        
        # Encode season
        season_map = {'kharif': 0, 'rabi': 1, 'zaid': 2}
        df_encoded['season_encoded'] = df_encoded['season'].map(season_map)
        
        # Encode crop (target variable)
        crop_map = {
            'rice': 0, 'wheat': 1, 'cotton': 2, 'maize': 3,
            'sugarcane': 4, 'tomato': 5, 'potato': 6, 'onion': 7
        }
        df_encoded['crop_encoded'] = df_encoded['crop'].map(crop_map)
        
        return df_encoded
    
    def normalize_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """Normalize numerical features"""
        df_normalized = df.copy()
        normalization_params = {}
        
        numerical_features = [
            'nitrogen', 'phosphorus', 'potassium', 'ph',
            'temperature', 'humidity', 'rainfall',
            'market_price', 'historical_yield'
        ]
        
        for feature in numerical_features:
            mean = df[feature].mean()
            std = df[feature].std()
            df_normalized[feature] = (df[feature] - mean) / std
            normalization_params[feature] = {'mean': mean, 'std': std}
        
        return df_normalized, normalization_params
    
    def create_feature_matrix(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Create feature matrix and target vector"""
        X = df[self.feature_columns].values
        y = df['crop_encoded'].values
        return X, y
    
    def split_data(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
        val_size: float = 0.1
    ) -> Tuple:
        """Split data into train, validation, and test sets"""
        from sklearn.model_selection import train_test_split
        
        # First split: train+val and test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Second split: train and val
        val_ratio = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_ratio, random_state=42, stratify=y_temp
        )
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def save_data(
        self,
        df: pd.DataFrame,
        normalization_params: Dict,
        output_dir: str = './data'
    ):
        """Save prepared data and parameters"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Save dataframe
        df.to_csv(f'{output_dir}/crop_data.csv', index=False)
        
        # Save normalization parameters
        with open(f'{output_dir}/normalization_params.json', 'w') as f:
            json.dump(normalization_params, f, indent=2)
        
        # Save feature columns
        with open(f'{output_dir}/feature_columns.json', 'w') as f:
            json.dump(self.feature_columns, f, indent=2)
        
        print(f"Data saved to {output_dir}")
        print(f"Total samples: {len(df)}")
        print(f"Features: {len(self.feature_columns)}")
        print(f"Crops: {df['crop'].nunique()}")

def main():
    """Main data preparation pipeline"""
    print("Starting crop recommendation data preparation...")
    
    # Initialize
    prep = CropDataPreparation()
    
    # Generate synthetic data
    print("\n1. Generating synthetic training data...")
    df = prep.generate_synthetic_data(n_samples=10000)
    print(f"Generated {len(df)} samples")
    
    # Encode categorical features
    print("\n2. Encoding categorical features...")
    df_encoded = prep.encode_categorical_features(df)
    
    # Normalize features
    print("\n3. Normalizing numerical features...")
    df_normalized, norm_params = prep.normalize_features(df_encoded)
    
    # Create feature matrix
    print("\n4. Creating feature matrix...")
    X, y = prep.create_feature_matrix(df_normalized)
    print(f"Feature matrix shape: {X.shape}")
    print(f"Target vector shape: {y.shape}")
    
    # Split data
    print("\n5. Splitting data...")
    X_train, X_val, X_test, y_train, y_val, y_test = prep.split_data(X, y)
    print(f"Train set: {X_train.shape[0]} samples")
    print(f"Validation set: {X_val.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    # Save data
    print("\n6. Saving prepared data...")
    prep.save_data(df_normalized, norm_params)
    
    # Save splits
    np.save('./data/X_train.npy', X_train)
    np.save('./data/X_val.npy', X_val)
    np.save('./data/X_test.npy', X_test)
    np.save('./data/y_train.npy', y_train)
    np.save('./data/y_val.npy', y_val)
    np.save('./data/y_test.npy', y_test)
    
    print("\n✓ Data preparation complete!")
    print("\nData statistics:")
    print(df.groupby('crop').size())

if __name__ == '__main__':
    main()
