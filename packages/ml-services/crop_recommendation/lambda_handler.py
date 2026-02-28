"""
AWS Lambda Handler for Crop Recommendation Model
Serves crop recommendations via API Gateway
"""

import json
import os
import pickle
import numpy as np
from typing import Dict, List, Any
import boto3
from botocore.exceptions import ClientError

# Import local modules
from scoring import CropSuitabilityScorer
from feature_engineering import CropFeatureEngineering

# Global variables for model caching
model = None
scaler = None
feature_columns = None
scorer = None
engineer = None

def load_model():
    """Load model from S3 or local storage (cached)"""
    global model, scaler, feature_columns, scorer, engineer
    
    if model is not None:
        return  # Already loaded
    
    try:
        # Initialize S3 client
        s3 = boto3.client('s3')
        bucket_name = os.environ.get('MODEL_BUCKET', 'ruralconnect-ml-models')
        
        # Download model files from S3
        model_key = 'crop_recommendation/model.pkl'
        scaler_key = 'crop_recommendation/scaler.pkl'
        features_key = 'crop_recommendation/feature_columns.json'
        
        # Load model
        model_obj = s3.get_object(Bucket=bucket_name, Key=model_key)
        model = pickle.loads(model_obj['Body'].read())
        
        # Load scaler
        scaler_obj = s3.get_object(Bucket=bucket_name, Key=scaler_key)
        scaler = pickle.loads(scaler_obj['Body'].read())
        
        # Load feature columns
        features_obj = s3.get_object(Bucket=bucket_name, Key=features_key)
        feature_columns = json.loads(features_obj['Body'].read())
        
        # Initialize scorer and engineer
        scorer = CropSuitabilityScorer()
        engineer = CropFeatureEngineering()
        
        print("Model loaded successfully from S3")
        
    except ClientError as e:
        print(f"Error loading model from S3: {e}")
        # Fallback to local files for testing
        try:
            with open('/tmp/model.pkl', 'rb') as f:
                model = pickle.load(f)
            with open('/tmp/scaler.pkl', 'rb') as f:
                scaler = pickle.load(f)
            with open('/tmp/feature_columns.json', 'r') as f:
                feature_columns = json.load(f)
            
            scorer = CropSuitabilityScorer()
            engineer = CropFeatureEngineering()
            
            print("Model loaded from local storage")
        except Exception as local_error:
            print(f"Error loading model locally: {local_error}")
            raise

def validate_input(data: Dict) -> tuple:
    """Validate input data"""
    required_fields = [
        'soil_type', 'nitrogen', 'phosphorus', 'potassium', 'ph',
        'temperature', 'humidity', 'rainfall', 'region', 'season'
    ]
    
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    # Validate numeric ranges
    validations = {
        'nitrogen': (0, 200),
        'phosphorus': (0, 100),
        'potassium': (0, 150),
        'ph': (3.0, 10.0),
        'temperature': (-10, 50),
        'humidity': (0, 100),
        'rainfall': (0, 500)
    }
    
    for field, (min_val, max_val) in validations.items():
        value = data.get(field)
        if not isinstance(value, (int, float)):
            return False, f"Field '{field}' must be a number"
        if not (min_val <= value <= max_val):
            return False, f"Field '{field}' must be between {min_val} and {max_val}"
    
    # Validate categorical fields
    valid_soil_types = ['alluvial', 'black', 'red', 'laterite', 'sandy', 'clayey', 'loamy']
    if data['soil_type'] not in valid_soil_types:
        return False, f"Invalid soil_type. Must be one of: {', '.join(valid_soil_types)}"
    
    valid_regions = ['north', 'south', 'east', 'west', 'central']
    if data['region'] not in valid_regions:
        return False, f"Invalid region. Must be one of: {', '.join(valid_regions)}"
    
    valid_seasons = ['kharif', 'rabi', 'zaid']
    if data['season'] not in valid_seasons:
        return False, f"Invalid season. Must be one of: {', '.join(valid_seasons)}"
    
    return True, None

def get_crop_recommendations_ml(farm_conditions: Dict, top_n: int = 5) -> List[Dict]:
    """
    Get crop recommendations using ML model
    This is a placeholder - actual implementation would use the trained model
    """
    # For now, use the rule-based scorer
    # In production, this would use the ML model predictions
    recommendations = scorer.rank_crops(farm_conditions, top_n=top_n)
    return recommendations

def get_crop_recommendations_hybrid(farm_conditions: Dict, top_n: int = 5) -> List[Dict]:
    """
    Hybrid approach: Combine ML predictions with rule-based scoring
    """
    # Get rule-based scores
    rule_based_scores = scorer.rank_crops(farm_conditions, top_n=10)
    
    # In production, also get ML model predictions here
    # ml_predictions = model.predict_proba(features)
    
    # For now, return rule-based scores
    # In production, combine both approaches
    return rule_based_scores[:top_n]

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for crop recommendation API
    
    Expected input format:
    {
        "body": {
            "soil_type": "loamy",
            "nitrogen": 90,
            "phosphorus": 45,
            "potassium": 50,
            "ph": 6.5,
            "temperature": 25,
            "humidity": 70,
            "rainfall": 100,
            "region": "central",
            "season": "kharif",
            "market_price": 20,
            "historical_yield": 2500,
            "top_n": 5
        }
    }
    """
    
    try:
        # Load model (cached after first call)
        load_model()
        
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Validate input
        is_valid, error_message = validate_input(body)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': error_message
                })
            }
        
        # Extract parameters
        farm_conditions = {
            'soil_type': body['soil_type'],
            'nitrogen': float(body['nitrogen']),
            'phosphorus': float(body['phosphorus']),
            'potassium': float(body['potassium']),
            'ph': float(body['ph']),
            'temperature': float(body['temperature']),
            'humidity': float(body['humidity']),
            'rainfall': float(body['rainfall']),
            'region': body['region'],
            'season': body['season'],
            'market_price': float(body.get('market_price', 20.0)),
            'historical_yield': float(body.get('historical_yield', 2000.0))
        }
        
        top_n = int(body.get('top_n', 5))
        
        # Get recommendations
        recommendations = get_crop_recommendations_hybrid(farm_conditions, top_n)
        
        # Add improvement suggestions for top crop
        if recommendations:
            top_crop = recommendations[0]['crop']
            suggestions = scorer.get_improvement_suggestions(farm_conditions, top_crop)
            recommendations[0]['improvement_suggestions'] = suggestions
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'recommendations': recommendations,
                'farm_conditions': farm_conditions,
                'timestamp': context.request_id if context else 'local'
            })
        }
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

# For local testing
if __name__ == '__main__':
    # Test event
    test_event = {
        'body': {
            'soil_type': 'loamy',
            'nitrogen': 90,
            'phosphorus': 45,
            'potassium': 50,
            'ph': 6.5,
            'temperature': 25,
            'humidity': 70,
            'rainfall': 100,
            'region': 'central',
            'season': 'kharif',
            'market_price': 20,
            'historical_yield': 2500,
            'top_n': 5
        }
    }
    
    # Mock context
    class MockContext:
        request_id = 'test-request-123'
    
    response = lambda_handler(test_event, MockContext())
    print(json.dumps(json.loads(response['body']), indent=2))
