"""
Crop Recommendation - Suitability Scoring Algorithm
Calculates crop suitability scores based on multiple factors
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class CropRequirements:
    """Define ideal requirements for a crop"""
    name: str
    soil_types: List[str]
    nitrogen_range: Tuple[float, float]
    phosphorus_range: Tuple[float, float]
    potassium_range: Tuple[float, float]
    ph_range: Tuple[float, float]
    temperature_range: Tuple[float, float]
    humidity_range: Tuple[float, float]
    rainfall_range: Tuple[float, float]
    preferred_seasons: List[str]
    preferred_regions: List[str]

class CropSuitabilityScorer:
    """Calculate suitability scores for crop recommendations"""
    
    def __init__(self):
        self.crop_requirements = self._initialize_crop_requirements()
        
    def _initialize_crop_requirements(self) -> Dict[str, CropRequirements]:
        """Initialize crop requirement profiles"""
        return {
            'rice': CropRequirements(
                name='rice',
                soil_types=['alluvial', 'clayey', 'loamy'],
                nitrogen_range=(80, 120),
                phosphorus_range=(40, 60),
                potassium_range=(40, 60),
                ph_range=(5.5, 7.0),
                temperature_range=(20, 35),
                humidity_range=(70, 90),
                rainfall_range=(150, 300),
                preferred_seasons=['kharif'],
                preferred_regions=['east', 'south', 'west']
            ),
            'wheat': CropRequirements(
                name='wheat',
                soil_types=['alluvial', 'loamy', 'black'],
                nitrogen_range=(60, 100),
                phosphorus_range=(30, 50),
                potassium_range=(30, 50),
                ph_range=(6.0, 7.5),
                temperature_range=(15, 25),
                humidity_range=(50, 70),
                rainfall_range=(50, 100),
                preferred_seasons=['rabi'],
                preferred_regions=['north', 'central', 'west']
            ),
            'cotton': CropRequirements(
                name='cotton',
                soil_types=['black', 'alluvial', 'red'],
                nitrogen_range=(60, 100),
                phosphorus_range=(30, 50),
                potassium_range=(30, 50),
                ph_range=(6.5, 8.0),
                temperature_range=(21, 35),
                humidity_range=(50, 80),
                rainfall_range=(50, 120),
                preferred_seasons=['kharif'],
                preferred_regions=['central', 'south', 'west']
            ),
            'maize': CropRequirements(
                name='maize',
                soil_types=['loamy', 'alluvial', 'red'],
                nitrogen_range=(80, 120),
                phosphorus_range=(40, 60),
                potassium_range=(40, 60),
                ph_range=(5.5, 7.5),
                temperature_range=(18, 32),
                humidity_range=(60, 80),
                rainfall_range=(60, 120),
                preferred_seasons=['kharif', 'rabi'],
                preferred_regions=['north', 'south', 'central']
            ),
            'sugarcane': CropRequirements(
                name='sugarcane',
                soil_types=['loamy', 'alluvial', 'black'],
                nitrogen_range=(100, 150),
                phosphorus_range=(50, 80),
                potassium_range=(50, 80),
                ph_range=(6.0, 7.5),
                temperature_range=(20, 35),
                humidity_range=(70, 90),
                rainfall_range=(150, 250),
                preferred_seasons=['kharif'],
                preferred_regions=['south', 'west', 'central']
            ),
            'tomato': CropRequirements(
                name='tomato',
                soil_types=['loamy', 'sandy', 'red'],
                nitrogen_range=(100, 150),
                phosphorus_range=(50, 80),
                potassium_range=(50, 80),
                ph_range=(6.0, 7.0),
                temperature_range=(18, 30),
                humidity_range=(60, 80),
                rainfall_range=(60, 100),
                preferred_seasons=['rabi', 'zaid'],
                preferred_regions=['south', 'west', 'north']
            ),
            'potato': CropRequirements(
                name='potato',
                soil_types=['loamy', 'sandy', 'alluvial'],
                nitrogen_range=(80, 120),
                phosphorus_range=(40, 60),
                potassium_range=(60, 100),
                ph_range=(5.0, 6.5),
                temperature_range=(15, 25),
                humidity_range=(70, 90),
                rainfall_range=(50, 100),
                preferred_seasons=['rabi'],
                preferred_regions=['north', 'central', 'east']
            ),
            'onion': CropRequirements(
                name='onion',
                soil_types=['loamy', 'alluvial', 'red'],
                nitrogen_range=(60, 100),
                phosphorus_range=(30, 50),
                potassium_range=(40, 60),
                ph_range=(6.0, 7.0),
                temperature_range=(15, 30),
                humidity_range=(60, 80),
                rainfall_range=(40, 80),
                preferred_seasons=['rabi', 'kharif'],
                preferred_regions=['south', 'west', 'central']
            )
        }
    
    def calculate_range_score(
        self,
        value: float,
        ideal_range: Tuple[float, float],
        tolerance: float = 0.2
    ) -> float:
        """
        Calculate score based on how well value fits in ideal range
        Returns score between 0 and 1
        
        Args:
            value: Actual value
            ideal_range: (min, max) ideal range
            tolerance: Acceptable deviation beyond range (as fraction)
        """
        min_val, max_val = ideal_range
        range_width = max_val - min_val
        
        # Perfect score if within ideal range
        if min_val <= value <= max_val:
            # Higher score if closer to center
            center = (min_val + max_val) / 2
            distance_from_center = abs(value - center)
            max_distance = range_width / 2
            return 1.0 - (distance_from_center / max_distance) * 0.2  # 0.8 to 1.0
        
        # Reduced score if outside but within tolerance
        tolerance_range = range_width * tolerance
        
        if value < min_val:
            distance = min_val - value
            if distance <= tolerance_range:
                return 0.5 * (1 - distance / tolerance_range)  # 0 to 0.5
            else:
                return 0.0
        else:  # value > max_val
            distance = value - max_val
            if distance <= tolerance_range:
                return 0.5 * (1 - distance / tolerance_range)  # 0 to 0.5
            else:
                return 0.0
    
    def calculate_soil_score(
        self,
        soil_type: str,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        ph: float,
        crop_req: CropRequirements
    ) -> float:
        """Calculate soil suitability score"""
        scores = []
        weights = []
        
        # Soil type match (binary)
        soil_match = 1.0 if soil_type in crop_req.soil_types else 0.3
        scores.append(soil_match)
        weights.append(0.25)
        
        # NPK scores
        n_score = self.calculate_range_score(nitrogen, crop_req.nitrogen_range)
        scores.append(n_score)
        weights.append(0.25)
        
        p_score = self.calculate_range_score(phosphorus, crop_req.phosphorus_range)
        scores.append(p_score)
        weights.append(0.20)
        
        k_score = self.calculate_range_score(potassium, crop_req.potassium_range)
        scores.append(k_score)
        weights.append(0.20)
        
        # pH score
        ph_score = self.calculate_range_score(ph, crop_req.ph_range, tolerance=0.3)
        scores.append(ph_score)
        weights.append(0.10)
        
        # Weighted average
        total_score = sum(s * w for s, w in zip(scores, weights))
        return total_score
    
    def calculate_climate_score(
        self,
        temperature: float,
        humidity: float,
        rainfall: float,
        crop_req: CropRequirements
    ) -> float:
        """Calculate climate suitability score"""
        scores = []
        weights = []
        
        # Temperature score
        temp_score = self.calculate_range_score(temperature, crop_req.temperature_range)
        scores.append(temp_score)
        weights.append(0.40)
        
        # Humidity score
        humidity_score = self.calculate_range_score(humidity, crop_req.humidity_range)
        scores.append(humidity_score)
        weights.append(0.30)
        
        # Rainfall score
        rainfall_score = self.calculate_range_score(rainfall, crop_req.rainfall_range)
        scores.append(rainfall_score)
        weights.append(0.30)
        
        # Weighted average
        total_score = sum(s * w for s, w in zip(scores, weights))
        return total_score
    
    def calculate_seasonal_score(
        self,
        season: str,
        region: str,
        crop_req: CropRequirements
    ) -> float:
        """Calculate seasonal and regional suitability score"""
        scores = []
        
        # Season match
        season_match = 1.0 if season in crop_req.preferred_seasons else 0.5
        scores.append(season_match)
        
        # Region match
        region_match = 1.0 if region in crop_req.preferred_regions else 0.7
        scores.append(region_match)
        
        # Average
        return sum(scores) / len(scores)
    
    def calculate_market_score(
        self,
        market_price: float,
        historical_yield: float,
        crop_name: str
    ) -> float:
        """Calculate market attractiveness score"""
        # Revenue potential
        revenue = market_price * historical_yield
        
        # Normalize based on crop type (different crops have different scales)
        # These are approximate normalization factors
        revenue_normalizers = {
            'rice': 60000, 'wheat': 45000, 'cotton': 50000, 'maize': 42000,
            'sugarcane': 120000, 'tomato': 250000, 'potato': 120000, 'onion': 160000
        }
        
        normalizer = revenue_normalizers.get(crop_name, 50000)
        normalized_revenue = min(revenue / normalizer, 1.5)  # Cap at 1.5x
        
        # Convert to 0-1 score
        market_score = min(normalized_revenue / 1.5, 1.0)
        
        return market_score
    
    def calculate_overall_suitability(
        self,
        farm_conditions: Dict,
        crop_name: str,
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, float]:
        """
        Calculate overall suitability score for a crop
        
        Args:
            farm_conditions: Dictionary with farm parameters
            crop_name: Name of the crop to evaluate
            weights: Optional custom weights for different factors
        
        Returns:
            Dictionary with detailed scores
        """
        if crop_name not in self.crop_requirements:
            raise ValueError(f"Unknown crop: {crop_name}")
        
        crop_req = self.crop_requirements[crop_name]
        
        # Default weights
        if weights is None:
            weights = {
                'soil': 0.30,
                'climate': 0.35,
                'seasonal': 0.15,
                'market': 0.20
            }
        
        # Calculate component scores
        soil_score = self.calculate_soil_score(
            farm_conditions['soil_type'],
            farm_conditions['nitrogen'],
            farm_conditions['phosphorus'],
            farm_conditions['potassium'],
            farm_conditions['ph'],
            crop_req
        )
        
        climate_score = self.calculate_climate_score(
            farm_conditions['temperature'],
            farm_conditions['humidity'],
            farm_conditions['rainfall'],
            crop_req
        )
        
        seasonal_score = self.calculate_seasonal_score(
            farm_conditions['season'],
            farm_conditions['region'],
            crop_req
        )
        
        market_score = self.calculate_market_score(
            farm_conditions['market_price'],
            farm_conditions['historical_yield'],
            crop_name
        )
        
        # Calculate weighted overall score
        overall_score = (
            soil_score * weights['soil'] +
            climate_score * weights['climate'] +
            seasonal_score * weights['seasonal'] +
            market_score * weights['market']
        )
        
        return {
            'crop': crop_name,
            'overall_score': round(overall_score, 3),
            'soil_score': round(soil_score, 3),
            'climate_score': round(climate_score, 3),
            'seasonal_score': round(seasonal_score, 3),
            'market_score': round(market_score, 3),
            'suitability_level': self._get_suitability_level(overall_score)
        }
    
    def _get_suitability_level(self, score: float) -> str:
        """Convert numeric score to suitability level"""
        if score >= 0.8:
            return 'Highly Suitable'
        elif score >= 0.6:
            return 'Suitable'
        elif score >= 0.4:
            return 'Moderately Suitable'
        elif score >= 0.2:
            return 'Marginally Suitable'
        else:
            return 'Not Suitable'
    
    def rank_crops(
        self,
        farm_conditions: Dict,
        top_n: int = 5,
        min_score: float = 0.3
    ) -> List[Dict]:
        """
        Rank all crops by suitability for given farm conditions
        
        Args:
            farm_conditions: Dictionary with farm parameters
            top_n: Number of top crops to return
            min_score: Minimum suitability score threshold
        
        Returns:
            List of crop scores sorted by overall_score (descending)
        """
        all_scores = []
        
        for crop_name in self.crop_requirements.keys():
            # Create conditions dict with crop-specific market data
            conditions = farm_conditions.copy()
            
            # If market data not provided, use defaults
            if 'market_price' not in conditions:
                conditions['market_price'] = 20.0
            if 'historical_yield' not in conditions:
                conditions['historical_yield'] = 2000.0
            
            score_dict = self.calculate_overall_suitability(conditions, crop_name)
            
            # Only include crops above minimum score
            if score_dict['overall_score'] >= min_score:
                all_scores.append(score_dict)
        
        # Sort by overall score (descending)
        all_scores.sort(key=lambda x: x['overall_score'], reverse=True)
        
        # Return top N
        return all_scores[:top_n]
    
    def get_improvement_suggestions(
        self,
        farm_conditions: Dict,
        crop_name: str
    ) -> List[str]:
        """
        Provide suggestions to improve suitability for a specific crop
        """
        if crop_name not in self.crop_requirements:
            return []
        
        crop_req = self.crop_requirements[crop_name]
        suggestions = []
        
        # Check soil type
        if farm_conditions['soil_type'] not in crop_req.soil_types:
            suggestions.append(
                f"Soil type '{farm_conditions['soil_type']}' is not ideal. "
                f"Consider soil amendments or choose crops suited for this soil."
            )
        
        # Check NPK levels
        if farm_conditions['nitrogen'] < crop_req.nitrogen_range[0]:
            deficit = crop_req.nitrogen_range[0] - farm_conditions['nitrogen']
            suggestions.append(f"Increase nitrogen by {deficit:.1f} kg/ha using organic or chemical fertilizers.")
        elif farm_conditions['nitrogen'] > crop_req.nitrogen_range[1]:
            excess = farm_conditions['nitrogen'] - crop_req.nitrogen_range[1]
            suggestions.append(f"Reduce nitrogen application by {excess:.1f} kg/ha to avoid excess.")
        
        if farm_conditions['phosphorus'] < crop_req.phosphorus_range[0]:
            deficit = crop_req.phosphorus_range[0] - farm_conditions['phosphorus']
            suggestions.append(f"Increase phosphorus by {deficit:.1f} kg/ha.")
        
        if farm_conditions['potassium'] < crop_req.potassium_range[0]:
            deficit = crop_req.potassium_range[0] - farm_conditions['potassium']
            suggestions.append(f"Increase potassium by {deficit:.1f} kg/ha.")
        
        # Check pH
        if farm_conditions['ph'] < crop_req.ph_range[0]:
            suggestions.append(
                f"Soil pH ({farm_conditions['ph']:.1f}) is too acidic. "
                f"Apply lime to raise pH to {crop_req.ph_range[0]:.1f}-{crop_req.ph_range[1]:.1f}."
            )
        elif farm_conditions['ph'] > crop_req.ph_range[1]:
            suggestions.append(
                f"Soil pH ({farm_conditions['ph']:.1f}) is too alkaline. "
                f"Apply sulfur or organic matter to lower pH."
            )
        
        # Check temperature
        if farm_conditions['temperature'] < crop_req.temperature_range[0]:
            suggestions.append(
                f"Temperature ({farm_conditions['temperature']:.1f}°C) is too low. "
                f"Consider waiting for warmer season or using protective structures."
            )
        elif farm_conditions['temperature'] > crop_req.temperature_range[1]:
            suggestions.append(
                f"Temperature ({farm_conditions['temperature']:.1f}°C) is too high. "
                f"Consider shade nets or irrigation to cool the crop."
            )
        
        # Check rainfall
        if farm_conditions['rainfall'] < crop_req.rainfall_range[0]:
            deficit = crop_req.rainfall_range[0] - farm_conditions['rainfall']
            suggestions.append(
                f"Rainfall ({farm_conditions['rainfall']:.1f}mm) is insufficient. "
                f"Plan for irrigation to supplement {deficit:.1f}mm."
            )
        
        # Check season
        if farm_conditions['season'] not in crop_req.preferred_seasons:
            suggestions.append(
                f"Current season '{farm_conditions['season']}' is not ideal. "
                f"Best seasons: {', '.join(crop_req.preferred_seasons)}."
            )
        
        return suggestions

def main():
    """Test suitability scoring algorithm"""
    print("Testing crop suitability scoring...")
    
    scorer = CropSuitabilityScorer()
    
    # Example farm conditions
    farm_conditions = {
        'soil_type': 'loamy',
        'nitrogen': 90,
        'phosphorus': 45,
        'potassium': 50,
        'ph': 6.5,
        'temperature': 25,
        'humidity': 70,
        'rainfall': 100,
        'season': 'kharif',
        'region': 'central',
        'market_price': 20,
        'historical_yield': 2500
    }
    
    print("\nFarm Conditions:")
    for key, value in farm_conditions.items():
        print(f"  {key}: {value}")
    
    # Test single crop scoring
    print("\n" + "="*60)
    print("Single Crop Suitability: Rice")
    print("="*60)
    rice_score = scorer.calculate_overall_suitability(farm_conditions, 'rice')
    for key, value in rice_score.items():
        print(f"  {key}: {value}")
    
    # Get improvement suggestions
    print("\nImprovement Suggestions for Rice:")
    suggestions = scorer.get_improvement_suggestions(farm_conditions, 'rice')
    if suggestions:
        for i, suggestion in enumerate(suggestions, 1):
            print(f"  {i}. {suggestion}")
    else:
        print("  No improvements needed - conditions are optimal!")
    
    # Test crop ranking
    print("\n" + "="*60)
    print("Top 5 Recommended Crops")
    print("="*60)
    top_crops = scorer.rank_crops(farm_conditions, top_n=5)
    for i, crop in enumerate(top_crops, 1):
        print(f"\n{i}. {crop['crop'].upper()}")
        print(f"   Overall Score: {crop['overall_score']} ({crop['suitability_level']})")
        print(f"   Soil: {crop['soil_score']} | Climate: {crop['climate_score']} | "
              f"Seasonal: {crop['seasonal_score']} | Market: {crop['market_score']}")
    
    print("\n✓ Suitability scoring test complete!")

if __name__ == '__main__':
    main()
