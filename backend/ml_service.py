import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from models import Expense, Budget, BudgetPrediction, db
from sqlalchemy import func

class BudgetPredictionService:
    def __init__(self, model_path='models/budget_predictor.joblib', scaler_path='models/scaler.joblib'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.feature_columns = None
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Don't load model on init - train fresh each time for now
        # self.load_model()
    
    def load_model(self):
        """Load the trained model and scaler from disk"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                
                # Load feature columns if available
                feature_path = 'models/feature_columns.json'
                if os.path.exists(feature_path):
                    with open(feature_path, 'r') as f:
                        self.feature_columns = json.load(f)
                
                print("✓ Model and scaler loaded successfully")
                return True
            else:
                print("⚠ Model files not found. Will train new model.")
                return False
        except Exception as e:
            print(f"✗ Error loading model: {str(e)}")
            self.model = None
            self.scaler = None
            return False
    
    def save_model(self):
        """Save the trained model and scaler to disk"""
        try:
            # Only save if model and scaler exist
            if self.model is None or self.scaler is None:
                print("⚠ Cannot save: model or scaler is None")
                return False
            
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            # Save feature columns
            if self.feature_columns:
                with open('models/feature_columns.json', 'w') as f:
                    json.dump(self.feature_columns, f)
            
            print("✓ Model, scaler, and features saved successfully")
            return True
        except Exception as e:
            print(f"✗ Error saving model: {str(e)}")
            return False
    
    def prepare_features(self, expenses_df, for_training=True):
        """
        Prepare features from expenses dataframe
        """
        if expenses_df.empty:
            print("⚠ Empty expenses dataframe")
            return pd.DataFrame()
        
        try:
            expenses_df['date'] = pd.to_datetime(expenses_df['date'])
            expenses_df = expenses_df.sort_values('date')
            
            # Time-based features
            expenses_df['day_of_week'] = expenses_df['date'].dt.dayofweek
            expenses_df['day_of_month'] = expenses_df['date'].dt.day
            expenses_df['month'] = expenses_df['date'].dt.month
            expenses_df['week_of_year'] = expenses_df['date'].dt.isocalendar().week
            
            # Aggregate features by week
            weekly_stats = []
            
            for week in expenses_df['week_of_year'].unique():
                week_data = expenses_df[expenses_df['week_of_year'] == week]
                
                features = {
                    'week': week,
                    'total_spending': float(week_data['amount'].sum()),
                    'avg_transaction': float(week_data['amount'].mean()),
                    'num_transactions': int(len(week_data)),
                    'max_transaction': float(week_data['amount'].max()),
                    'min_transaction': float(week_data['amount'].min()),
                    'std_transaction': float(week_data['amount'].std()) if len(week_data) > 1 else 0.0,
                }
                
                # Category distribution
                if 'category_id' in week_data.columns:
                    category_totals = week_data.groupby('category_id')['amount'].sum()
                    for cat_id in expenses_df['category_id'].unique():
                        features[f'category_{cat_id}_spending'] = float(category_totals.get(cat_id, 0))
                
                weekly_stats.append(features)
            
            result_df = pd.DataFrame(weekly_stats)
            print(f"✓ Prepared {len(result_df)} weekly feature rows")
            return result_df
        
        except Exception as e:
            print(f"✗ Error preparing features: {str(e)}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()
    
    def train_model(self, user_id, category_id=None):
        """
        Train the budget prediction model using historical expense data
        """
        try:
            print(f"\n{'='*50}")
            print(f"TRAINING MODEL FOR USER {user_id}")
            print(f"{'='*50}")
            
            # Get historical expenses
            query = Expense.query.filter_by(user_id=user_id)
            if category_id:
                query = query.filter_by(category_id=category_id)
            
            expenses = query.all()
            
            print(f"📊 Found {len(expenses)} expenses for user {user_id}")
            
            if len(expenses) < 10:
                error_msg = f"Insufficient data: need at least 10 expenses, found {len(expenses)}"
                print(f"✗ {error_msg}")
                return False, error_msg
            
            # Convert to DataFrame
            expenses_data = [{
                'date': exp.date,
                'amount': float(exp.amount),
                'category_id': exp.category_id
            } for exp in expenses]
            
            df = pd.DataFrame(expenses_data)
            print(f"📋 DataFrame shape: {df.shape}")
            
            # Prepare features
            features_df = self.prepare_features(df, for_training=True)
            
            if features_df.empty or len(features_df) < 3:
                error_msg = f"Insufficient weekly data: need at least 3 weeks, found {len(features_df)}"
                print(f"✗ {error_msg}")
                return False, error_msg
            
            print(f"📈 Features DataFrame shape: {features_df.shape}")
            
            # Prepare X and y
            feature_columns = [col for col in features_df.columns 
                             if col not in ['week', 'total_spending']]
            self.feature_columns = feature_columns
            
            X = features_df[feature_columns].fillna(0).astype(float)
            y = features_df['total_spending'].astype(float)
            
            print(f"🔢 Training with {len(feature_columns)} features on {len(X)} samples")
            print(f"📝 Feature columns: {feature_columns[:5]}..." if len(feature_columns) > 5 else f"📝 Feature columns: {feature_columns}")
            
            # Split data
            if len(X) < 6:
                # Use all data for training if dataset is very small
                X_train, X_test, y_train, y_test = X, X, y, y
                print("⚠ Using all data for both train and test (dataset too small)")
            else:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
                print(f"✓ Split: {len(X_train)} train, {len(X_test)} test")
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            print("✓ Features scaled")
            
            # Train model
            self.model = GradientBoostingRegressor(
                n_estimators=50,  # Reduced for faster training
                learning_rate=0.1,
                max_depth=3,      # Reduced to prevent overfitting
                random_state=42,
                min_samples_split=2,
                min_samples_leaf=1
            )
            
            print("🎯 Training model...")
            self.model.fit(X_train_scaled, y_train)
            print("✓ Model trained successfully")
            
            # Verify model is properly trained
            if not hasattr(self.model, 'estimators_'):
                error_msg = "Model training failed - no estimators created"
                print(f"✗ {error_msg}")
                return False, error_msg
            
            # Evaluate
            train_predictions = self.model.predict(X_train_scaled)
            test_predictions = self.model.predict(X_test_scaled)
            
            train_mae = mean_absolute_error(y_train, train_predictions)
            test_mae = mean_absolute_error(y_test, test_predictions)
            train_r2 = r2_score(y_train, train_predictions)
            test_r2 = r2_score(y_test, test_predictions)
            
            metrics = {
                'train_mae': float(train_mae),
                'test_mae': float(test_mae),
                'train_r2': float(train_r2),
                'test_r2': float(test_r2),
                'features_count': len(feature_columns),
                'training_samples': len(X_train)
            }
            
            print(f"📊 Training MAE: ${train_mae:.2f}")
            print(f"📊 Test MAE: ${test_mae:.2f}")
            print(f"📊 Train R²: {train_r2:.3f}")
            print(f"📊 Test R²: {test_r2:.3f}")
            
            # Save model
            save_success = self.save_model()
            if save_success:
                print("✓ Model saved to disk")
            else:
                print("⚠ Model not saved (will use in-memory only)")
            
            print(f"{'='*50}\n")
            
            return True, metrics
        
        except Exception as e:
            error_msg = f"Error training model: {str(e)}"
            print(f"✗ {error_msg}")
            import traceback
            traceback.print_exc()
            return False, error_msg
    
    def predict_budget(self, user_id, category_id=None, period='monthly'):
        """
        Predict budget for the next period based on historical data
        """
        try:
            print(f"\n{'='*50}")
            print(f"MAKING PREDICTION FOR USER {user_id}")
            print(f"{'='*50}")
            
            # Check if model exists, if not train it
            if self.model is None or self.scaler is None:
                print("⚠ Model not loaded, training new model...")
                success, result = self.train_model(user_id, category_id)
                if not success:
                    print(f"✗ Training failed: {result}")
                    return None, result
            
            # Verify model is valid
            if not hasattr(self.model, 'estimators_'):
                print("⚠ Model invalid, retraining...")
                success, result = self.train_model(user_id, category_id)
                if not success:
                    return None, result
            
            # Get recent expenses
            query = Expense.query.filter_by(user_id=user_id)
            if category_id:
                query = query.filter_by(category_id=category_id)
            
            cutoff_date = datetime.utcnow() - timedelta(days=60)
            recent_expenses = query.filter(Expense.date >= cutoff_date).all()
            
            print(f"📊 Found {len(recent_expenses)} recent expenses")
            
            if not recent_expenses:
                error_msg = "No recent expense data (last 60 days)"
                print(f"✗ {error_msg}")
                return None, error_msg
            
            # Convert to DataFrame
            expenses_data = [{
                'date': exp.date,
                'amount': float(exp.amount),
                'category_id': exp.category_id
            } for exp in recent_expenses]
            
            df = pd.DataFrame(expenses_data)
            features_df = self.prepare_features(df, for_training=False)
            
            if features_df.empty:
                error_msg = "Unable to prepare features from recent data"
                print(f"✗ {error_msg}")
                return None, error_msg
            
            # Use most recent week's features
            latest_features = features_df.iloc[-1:]
            
            # Get expected features
            if hasattr(self.scaler, 'feature_names_in_'):
                expected_features = list(self.scaler.feature_names_in_)
            elif self.feature_columns:
                expected_features = self.feature_columns
            else:
                error_msg = "Cannot determine expected features"
                print(f"✗ {error_msg}")
                return None, error_msg
            
            print(f"🔢 Expected {len(expected_features)} features")
            
            # Create prediction DataFrame with all expected columns
            X_pred = pd.DataFrame(columns=expected_features)
            
            # Fill with values from latest_features
            for col in expected_features:
                if col in latest_features.columns:
                    X_pred.loc[0, col] = float(latest_features[col].values[0])
                else:
                    X_pred.loc[0, col] = 0.0
            
            X_pred = X_pred.astype(float)
            
            print(f"✓ Prediction features prepared: {X_pred.shape}")
            
            # Scale and predict
            X_pred_scaled = self.scaler.transform(X_pred)
            weekly_prediction = float(self.model.predict(X_pred_scaled)[0])
            
            print(f"💰 Weekly prediction: ${weekly_prediction:.2f}")
            
            # Convert to requested period
            if period == 'monthly':
                predicted_amount = weekly_prediction * 4.33
            elif period == 'weekly':
                predicted_amount = weekly_prediction
            elif period == 'daily':
                predicted_amount = weekly_prediction / 7
            else:
                predicted_amount = weekly_prediction * 4.33
            
            # Calculate confidence
            if len(features_df) >= 4:
                recent_totals = features_df['total_spending'].tail(4)
                mean_val = recent_totals.mean()
                if mean_val > 0:
                    variance = recent_totals.std() / mean_val
                    confidence = max(0.5, min(1.0, 1 - variance))
                else:
                    confidence = 0.6
            else:
                confidence = 0.6
            
            result = {
                'predicted_amount': round(predicted_amount, 2),
                'confidence_score': round(confidence, 2),
                'prediction_period': period,
                'features_used': json.dumps({k: round(float(v), 2) 
                                            for k, v in X_pred.iloc[0].to_dict().items()})
            }
            
            print(f"✓ Final prediction: ${result['predicted_amount']:.2f} ({period})")
            print(f"✓ Confidence: {result['confidence_score']*100:.0f}%")
            print(f"{'='*50}\n")
            
            return result, None
        
        except Exception as e:
            error_msg = f"Error making prediction: {str(e)}"
            print(f"✗ {error_msg}")
            import traceback
            traceback.print_exc()
            return None, error_msg
    
    def get_spending_insights(self, user_id, days=30):
        """Get spending insights and trends"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            expenses = Expense.query.filter(
                Expense.user_id == user_id,
                Expense.date >= cutoff_date
            ).all()
            
            if not expenses:
                return None
            
            # Convert to DataFrame
            expenses_data = [{
                'date': exp.date,
                'amount': float(exp.amount),
                'category_id': exp.category_id,
                'category_name': exp.category.name if exp.category else 'Unknown'
            } for exp in expenses]
            
            df = pd.DataFrame(expenses_data)
            
            insights = {
                'total_spending': float(df['amount'].sum()),
                'average_daily': float(df['amount'].sum() / days),
                'num_transactions': len(df),
                'average_transaction': float(df['amount'].mean()),
                'max_transaction': float(df['amount'].max()),
                'category_breakdown': df.groupby('category_name')['amount'].sum().to_dict(),
                'daily_trend': df.groupby(df['date'].dt.date)['amount'].sum().to_dict()
            }
            
            # Convert to JSON-safe format
            insights['daily_trend'] = {str(k): float(v) for k, v in insights['daily_trend'].items()}
            insights['category_breakdown'] = {k: float(v) for k, v in insights['category_breakdown'].items()}
            
            return insights
        
        except Exception as e:
            print(f"Error getting insights: {str(e)}")
            return None


# Global instance
budget_prediction_service = BudgetPredictionService()