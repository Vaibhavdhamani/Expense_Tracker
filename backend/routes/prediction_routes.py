from flask import Blueprint, request, jsonify
from models import db, BudgetPrediction
from schemas import budget_prediction_schema, budget_predictions_schema
from ml_service import budget_prediction_service
from datetime import datetime

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/predictions/train', methods=['POST'])
def train_model():
    """Train the budget prediction model"""
    try:
        data = request.get_json()
        
        if 'user_id' not in data:
            return jsonify({'error': 'user_id is required'}), 400
        
        user_id = data['user_id']
        category_id = data.get('category_id')
        
        success, result = budget_prediction_service.train_model(user_id, category_id)
        
        if not success:
            return jsonify({
                'success': False,
                'message': result
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'metrics': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predictions_bp.route('/predictions/predict', methods=['POST'])
def predict_budget():
    """Predict budget for the next period"""
    try:
        data = request.get_json()
        
        if 'user_id' not in data:
            return jsonify({'error': 'user_id is required'}), 400
        
        user_id = data['user_id']
        category_id = data.get('category_id')
        period = data.get('period', 'monthly')
        
        prediction, error = budget_prediction_service.predict_budget(user_id, category_id, period)
        
        if error:
            return jsonify({
                'success': False,
                'message': error
            }), 400
        
        # Save prediction to database
        budget_prediction = BudgetPrediction(
            user_id=user_id,
            category_id=category_id,
            predicted_amount=prediction['predicted_amount'],
            confidence_score=prediction['confidence_score'],
            prediction_period=prediction['prediction_period'],
            features_used=prediction['features_used']
        )
        
        db.session.add(budget_prediction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'predicted_amount': prediction['predicted_amount'],
                'confidence_score': prediction['confidence_score'],
                'prediction_period': prediction['prediction_period'],
                'prediction_id': budget_prediction.id
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@predictions_bp.route('/predictions/history', methods=['GET'])
def get_prediction_history():
    """Get prediction history for a user"""
    try:
        user_id = request.args.get('user_id', type=int)
        limit = request.args.get('limit', type=int, default=10)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        predictions = BudgetPrediction.query.filter_by(user_id=user_id)\
            .order_by(BudgetPrediction.created_at.desc())\
            .limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': budget_predictions_schema.dump(predictions)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predictions_bp.route('/insights/spending', methods=['GET'])
def get_spending_insights():
    """Get spending insights and trends"""
    try:
        user_id = request.args.get('user_id', type=int)
        days = request.args.get('days', type=int, default=30)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        insights = budget_prediction_service.get_spending_insights(user_id, days)
        
        if not insights:
            return jsonify({
                'success': True,
                'data': {
                    'message': 'No spending data available for the specified period'
                }
            }), 200
        
        return jsonify({
            'success': True,
            'data': insights
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predictions_bp.route('/insights/recommendations', methods=['GET'])
def get_recommendations():
    """Get AI-powered spending recommendations"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get spending insights
        insights = budget_prediction_service.get_spending_insights(user_id, 30)
        
        if not insights:
            return jsonify({
                'success': True,
                'data': {
                    'recommendations': ['Start tracking your expenses to get personalized recommendations']
                }
            }), 200
        
        recommendations = []
        
        # Generate recommendations based on insights
        avg_daily = insights['average_daily']
        total = insights['total_spending']
        category_breakdown = insights['category_breakdown']
        
        # Check for high spending categories
        if category_breakdown:
            max_category = max(category_breakdown.items(), key=lambda x: x[1])
            max_category_name, max_category_amount = max_category
            
            if max_category_amount > total * 0.4:
                recommendations.append({
                    'type': 'warning',
                    'title': f'High spending in {max_category_name}',
                    'message': f'You spent ${max_category_amount:.2f} ({max_category_amount/total*100:.1f}% of total) on {max_category_name} this month. Consider setting a budget limit.',
                    'priority': 'high'
                })
        
        # Daily spending recommendation
        if avg_daily > 100:
            recommendations.append({
                'type': 'tip',
                'title': 'Daily spending is high',
                'message': f'Your average daily spending is ${avg_daily:.2f}. Try to reduce discretionary expenses by 10-20%.',
                'priority': 'medium'
            })
        
        # Generic tips if no specific recommendations
        if not recommendations:
            recommendations.append({
                'type': 'success',
                'title': 'Good spending habits!',
                'message': 'Your spending is well-balanced. Keep up the good work!',
                'priority': 'low'
            })
        
        return jsonify({
            'success': True,
            'data': {
                'recommendations': recommendations,
                'insights_summary': {
                    'total_spending': total,
                    'average_daily': avg_daily,
                    'top_category': max(category_breakdown.items(), key=lambda x: x[1])[0] if category_breakdown else None
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
