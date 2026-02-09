from flask import Blueprint, request, jsonify
from models import db, Budget, Expense, Category
from schemas import budget_schema, budgets_schema
from datetime import datetime, timedelta
from sqlalchemy import func, and_

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets for a user"""
    try:
        user_id = request.args.get('user_id', type=int)
        is_active = request.args.get('is_active', type=bool, default=True)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        query = Budget.query.filter_by(user_id=user_id)
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        budgets = query.all()
        
        return jsonify({
            'success': True,
            'data': budgets_schema.dump(budgets)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@budgets_bp.route('/budgets/<int:budget_id>', methods=['GET'])
def get_budget(budget_id):
    """Get a specific budget"""
    try:
        budget = Budget.query.get(budget_id)
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        return jsonify({
            'success': True,
            'data': budget_schema.dump(budget)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@budgets_bp.route('/budgets', methods=['POST'])
def create_budget():
    """Create a new budget"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'category_id', 'amount', 'period', 'start_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse dates
        if isinstance(data['start_date'], str):
            data['start_date'] = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        
        end_date = None
        if 'end_date' in data and data['end_date']:
            if isinstance(data['end_date'], str):
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            else:
                end_date = data['end_date']
        
        budget = Budget(
            user_id=data['user_id'],
            category_id=data['category_id'],
            amount=data['amount'],
            period=data['period'],
            start_date=data['start_date'],
            end_date=end_date,
            is_active=data.get('is_active', True)
        )
        
        db.session.add(budget)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Budget created successfully',
            'data': budget_schema.dump(budget)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@budgets_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
def update_budget(budget_id):
    """Update a budget"""
    try:
        budget = Budget.query.get(budget_id)
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        data = request.get_json()
        
        if 'amount' in data:
            budget.amount = data['amount']
        if 'period' in data:
            budget.period = data['period']
        if 'start_date' in data:
            if isinstance(data['start_date'], str):
                budget.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            else:
                budget.start_date = data['start_date']
        if 'end_date' in data:
            if data['end_date']:
                if isinstance(data['end_date'], str):
                    budget.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
                else:
                    budget.end_date = data['end_date']
            else:
                budget.end_date = None
        if 'is_active' in data:
            budget.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Budget updated successfully',
            'data': budget_schema.dump(budget)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@budgets_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    """Delete a budget"""
    try:
        budget = Budget.query.get(budget_id)
        
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        db.session.delete(budget)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Budget deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@budgets_bp.route('/budgets/status', methods=['GET'])
def get_budget_status():
    """Get budget status showing spent vs budgeted amounts"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get active budgets
        budgets = Budget.query.filter_by(user_id=user_id, is_active=True).all()
        
        budget_status = []
        
        for budget in budgets:
            # Calculate date range based on period
            if budget.period == 'daily':
                start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=1)
            elif budget.period == 'weekly':
                today = datetime.utcnow()
                start_date = today - timedelta(days=today.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=7)
            elif budget.period == 'monthly':
                today = datetime.utcnow()
                start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if today.month == 12:
                    end_date = start_date.replace(year=today.year + 1, month=1)
                else:
                    end_date = start_date.replace(month=today.month + 1)
            elif budget.period == 'yearly':
                today = datetime.utcnow()
                start_date = today.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(year=today.year + 1)
            else:
                start_date = budget.start_date
                end_date = budget.end_date or datetime.utcnow()
            
            # Get total spent in this period
            spent = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.category_id == budget.category_id,
                Expense.date >= start_date,
                Expense.date < end_date
            ).scalar() or 0
            
            remaining = budget.amount - spent
            percentage = (spent / budget.amount * 100) if budget.amount > 0 else 0
            
            budget_status.append({
                'budget_id': budget.id,
                'category_id': budget.category_id,
                'category_name': budget.category.name if budget.category else 'Unknown',
                'category_icon': budget.category.icon if budget.category else '',
                'category_color': budget.category.color if budget.category else '',
                'budgeted': float(budget.amount),
                'spent': float(spent),
                'remaining': float(remaining),
                'percentage_used': round(float(percentage), 2),
                'period': budget.period,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'is_exceeded': spent > budget.amount
            })
        
        # Calculate total
        total_budgeted = sum(b['budgeted'] for b in budget_status)
        total_spent = sum(b['spent'] for b in budget_status)
        
        return jsonify({
            'success': True,
            'data': {
                'budgets': budget_status,
                'total_budgeted': total_budgeted,
                'total_spent': total_spent,
                'total_remaining': total_budgeted - total_spent
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
