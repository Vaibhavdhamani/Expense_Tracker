from flask import Blueprint, request, jsonify
from models import db, Expense, Category
from schemas import expense_schema, expenses_schema
from datetime import datetime, timedelta
from sqlalchemy import func, and_

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses with optional filters"""
    try:
        user_id = request.args.get('user_id', type=int)
        category_id = request.args.get('category_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        days = request.args.get('days', type=int)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Build query
        query = Expense.query.filter_by(user_id=user_id)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        # Date filters
        if days:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Expense.date >= cutoff_date)
        elif start_date and end_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(and_(Expense.date >= start, Expense.date <= end))
        elif start_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Expense.date >= start)
        
        # Order by date descending
        expenses = query.order_by(Expense.date.desc()).all()
        
        return jsonify({
            'success': True,
            'data': expenses_schema.dump(expenses),
            'count': len(expenses)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expenses_bp.route('/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    """Get a specific expense by ID"""
    try:
        expense = Expense.query.get(expense_id)
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        return jsonify({
            'success': True,
            'data': expense_schema.dump(expense)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expenses_bp.route('/expenses', methods=['POST'])
def create_expense():
    """Create a new expense"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'category_id', 'amount', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse date
        if isinstance(data['date'], str):
            data['date'] = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        
        # Create expense
        expense = Expense(
            user_id=data['user_id'],
            category_id=data['category_id'],
            amount=data['amount'],
            description=data.get('description', ''),
            notes=data.get('notes', ''),
            date=data['date']
        )
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense created successfully',
            'data': expense_schema.dump(expense)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expenses_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update an existing expense"""
    try:
        expense = Expense.query.get(expense_id)
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'category_id' in data:
            expense.category_id = data['category_id']
        if 'amount' in data:
            expense.amount = data['amount']
        if 'description' in data:
            expense.description = data['description']
        if 'notes' in data:
            expense.notes = data['notes']
        if 'date' in data:
            if isinstance(data['date'], str):
                expense.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            else:
                expense.date = data['date']
        
        expense.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense updated successfully',
            'data': expense_schema.dump(expense)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expenses_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense"""
    try:
        expense = Expense.query.get(expense_id)
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expenses_bp.route('/expenses/summary', methods=['GET'])
def get_expense_summary():
    """Get expense summary with totals by category"""
    try:
        user_id = request.args.get('user_id', type=int)
        days = request.args.get('days', type=int, default=30)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total spending
        total = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.date >= cutoff_date
        ).scalar() or 0
        
        # Category breakdown
        category_totals = db.session.query(
            Category.name,
            Category.icon,
            Category.color,
            func.sum(Expense.amount).label('total')
        ).join(Expense).filter(
            Expense.user_id == user_id,
            Expense.date >= cutoff_date
        ).group_by(Category.id).all()
        
        category_breakdown = [{
            'category': cat[0],
            'icon': cat[1],
            'color': cat[2],
            'total': float(cat[3])
        } for cat in category_totals]
        
        # Daily totals
        daily_totals = db.session.query(
            func.date(Expense.date).label('date'),
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.user_id == user_id,
            Expense.date >= cutoff_date
        ).group_by(func.date(Expense.date)).all()
        
        daily_breakdown = [{
            'date': str(day[0]),
            'total': float(day[1])
        } for day in daily_totals]
        
        return jsonify({
            'success': True,
            'data': {
                'total_spending': float(total),
                'period_days': days,
                'average_daily': float(total / days) if days > 0 else 0,
                'category_breakdown': category_breakdown,
                'daily_breakdown': daily_breakdown
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expenses_bp.route('/expenses/stats', methods=['GET'])
def get_expense_stats():
    """Get detailed expense statistics"""
    try:
        user_id = request.args.get('user_id', type=int)
        days = request.args.get('days', type=int, default=30)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        expenses = Expense.query.filter(
            Expense.user_id == user_id,
            Expense.date >= cutoff_date
        ).all()
        
        if not expenses:
            return jsonify({
                'success': True,
                'data': {
                    'total': 0,
                    'count': 0,
                    'average': 0,
                    'max': 0,
                    'min': 0
                }
            }), 200
        
        amounts = [exp.amount for exp in expenses]
        
        return jsonify({
            'success': True,
            'data': {
                'total': float(sum(amounts)),
                'count': len(amounts),
                'average': float(sum(amounts) / len(amounts)),
                'max': float(max(amounts)),
                'min': float(min(amounts))
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
