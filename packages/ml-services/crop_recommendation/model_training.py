"""
Crop Recommendation - Model Training
Trains ensemble model (Random Forest + Gradient Boosting)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import json
from typing import Dict, Tuple
import os

class CropRecommendationModel:
    """Ensemble model for crop recommendation"""
    
    def __init__(self):
        self.rf_model = None
        self.gb_model = None
        self.feature_columns = []
        self.crop_names = [
            'rice', 'wheat', 'cotton', 'maize',
            'sugarcane', 'tomato', 'potato', 'onion'
        ]
        
    def train_random_forest(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> Dict:
        """Train Random Forest model"""
        print("\nTraining Random Forest...")
        
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        self.rf_model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = self.rf_model.predict(X_train)
        val_pred = self.rf_model.predict(X_val)
        
        train_acc = accuracy_score(y_train, train_pred)
        val_acc = accuracy_score(y_val, val_pred)
        
        print(f"Random Forest - Train Accuracy: {train_acc:.4f}")
        print(f"Random Forest - Val Accuracy: {val_acc:.4f}")
        
        return {
            'train_accuracy': train_acc,
            'val_accuracy': val_acc,
            'feature_importance': self.rf_model.feature_importances_.tolist()
        }
    
    def train_gradient_boosting(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> Dict:
        """Train Gradient Boosting model"""
        print("\nTraining Gradient Boosting...")
        
        self.gb_model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        self.gb_model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = self.gb_model.predict(X_train)
        val_pred = self.gb_model.predict(X_val)
        
        train_acc = accuracy_score(y_train, train_pred)
        val_acc = accuracy_score(y_val, val_pred)
        
        print(f"Gradient Boosting - Train Accuracy: {train_acc:.4f}")
        print(f"Gradient Boosting - Val Accuracy: {val_acc:.4f}")
        
        return {
            'train_accuracy': train_acc,
            'val_accuracy': val_acc,
            'feature_importance': self.gb_model.feature_importances_.tolist()
        }
    
    def ensemble_predict(self, X: np.ndarray, weights: Tuple[float, float] = (0.5, 0.5)) -> np.ndarray:
        """Make predictions using ensemble"""
        rf_proba = self.rf_model.predict_proba(X)
        gb_proba = self.gb_model.predict_proba(X)
        
        # Weighted average of probabilities
        ensemble_proba = weights[0] * rf_proba + weights[1] * gb_proba
        predictions = np.argmax(ensemble_proba, axis=1)
        
        return predictions
    
    def ensemble_predict_proba(self, X: np.ndarray, weights: Tuple[float, float] = (0.5, 0.5)) -> np.ndarray:
        """Get prediction probabilities from ensemble"""
        rf_proba = self.rf_model.predict_proba(X)
        gb_proba = self.gb_model.predict_proba(X)
        
        ensemble_proba = weights[0] * rf_proba + weights[1] * gb_proba
        return ensemble_proba
    
    def evaluate_ensemble(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray,
        weights: Tuple[float, float] = (0.5, 0.5)
    ) -> Dict:
        """Evaluate ensemble model"""
        print("\nEvaluating Ensemble Model...")
        
        predictions = self.ensemble_predict(X_test, weights)
        accuracy = accuracy_score(y_test, predictions)
        
        print(f"Ensemble Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(
            y_test,
            predictions,
            target_names=self.crop_names,
            zero_division=0
        ))
        
        return {
            'accuracy': accuracy,
            'predictions': predictions.tolist(),
            'confusion_matrix': confusion_matrix(y_test, predictions).tolist()
        }
    
    def get_feature_importance(self) -> Dict:
        """Get combined feature importance"""
        if not self.feature_columns:
            return {}
        
        rf_importance = self.rf_model.feature_importances_
        gb_importance = self.gb_model.feature_importances_
        
        # Average importance
        avg_importance = (rf_importance + gb_importance) / 2
        
        importance_dict = {
            feature: float(importance)
            for feature, importance in zip(self.feature_columns, avg_importance)
        }
        
        # Sort by importance
        sorted_importance = dict(
            sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
        )
        
        return sorted_importance
    
    def save_models(self, output_dir: str = './models'):
        """Save trained models"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save models
        joblib.dump(self.rf_model, f'{output_dir}/random_forest.pkl')
        joblib.dump(self.gb_model, f'{output_dir}/gradient_boosting.pkl')
        
        # Save metadata
        metadata = {
            'crop_names': self.crop_names,
            'feature_columns': self.feature_columns,
            'model_type': 'ensemble',
            'models': ['random_forest', 'gradient_boosting']
        }
        
        with open(f'{output_dir}/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\nModels saved to {output_dir}")
    
    def load_models(self, model_dir: str = './models'):
        """Load trained models"""
        self.rf_model = joblib.load(f'{model_dir}/random_forest.pkl')
        self.gb_model = joblib.load(f'{model_dir}/gradient_boosting.pkl')
        
        with open(f'{model_dir}/metadata.json', 'r') as f:
            metadata = json.load(f)
            self.crop_names = metadata['crop_names']
            self.feature_columns = metadata['feature_columns']
        
        print("Models loaded successfully")

def main():
    """Main training pipeline"""
    print("Starting crop recommendation model training...")
    
    # Load data
    print("\n1. Loading prepared data...")
    X_train = np.load('./data/X_train.npy')
    X_val = np.load('./data/X_val.npy')
    X_test = np.load('./data/X_test.npy')
    y_train = np.load('./data/y_train.npy')
    y_val = np.load('./data/y_val.npy')
    y_test = np.load('./data/y_test.npy')
    
    with open('./data/feature_columns.json', 'r') as f:
        feature_columns = json.load(f)
    
    print(f"Train set: {X_train.shape}")
    print(f"Val set: {X_val.shape}")
    print(f"Test set: {X_test.shape}")
    
    # Initialize model
    model = CropRecommendationModel()
    model.feature_columns = feature_columns
    
    # Train Random Forest
    print("\n2. Training Random Forest...")
    rf_metrics = model.train_random_forest(X_train, y_train, X_val, y_val)
    
    # Train Gradient Boosting
    print("\n3. Training Gradient Boosting...")
    gb_metrics = model.train_gradient_boosting(X_train, y_train, X_val, y_val)
    
    # Evaluate ensemble
    print("\n4. Evaluating Ensemble...")
    ensemble_metrics = model.evaluate_ensemble(X_test, y_test)
    
    # Feature importance
    print("\n5. Feature Importance:")
    importance = model.get_feature_importance()
    for feature, imp in list(importance.items())[:5]:
        print(f"  {feature}: {imp:.4f}")
    
    # Save models
    print("\n6. Saving models...")
    model.save_models()
    
    # Save metrics
    all_metrics = {
        'random_forest': rf_metrics,
        'gradient_boosting': gb_metrics,
        'ensemble': ensemble_metrics,
        'feature_importance': importance
    }
    
    with open('./models/training_metrics.json', 'w') as f:
        json.dump(all_metrics, f, indent=2)
    
    print("\n✓ Training complete!")
    print(f"\nFinal Ensemble Accuracy: {ensemble_metrics['accuracy']:.4f}")

if __name__ == '__main__':
    main()
