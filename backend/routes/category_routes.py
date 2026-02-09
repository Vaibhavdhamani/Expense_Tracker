from flask import Blueprint, request, jsonify
from models import db, Category, StandardDescription
from schemas import (category_schema, categories_schema, 
                     standard_description_schema, standard_descriptions_schema)

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        categories = Category.query.all()
        return jsonify({
            'success': True,
            'data': categories_schema.dump(categories)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Get a specific category"""
    try:
        category = Category.query.get(category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        return jsonify({
            'success': True,
            'data': category_schema.dump(category)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    try:
        data = request.get_json()
        
        if 'name' not in data:
            return jsonify({'error': 'name is required'}), 400
        
        # Check if category already exists
        existing = Category.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Category already exists'}), 400
        
        category = Category(
            name=data['name'],
            icon=data.get('icon', ''),
            color=data.get('color', '#6366f1')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category created successfully',
            'data': category_schema.dump(category)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """Update a category"""
    try:
        category = Category.query.get(category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            category.name = data['name']
        if 'icon' in data:
            category.icon = data['icon']
        if 'color' in data:
            category.color = data['color']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category updated successfully',
            'data': category_schema.dump(category)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category"""
    try:
        category = Category.query.get(category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Category deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Standard Descriptions Routes
@categories_bp.route('/categories/<int:category_id>/descriptions', methods=['GET'])
def get_category_descriptions(category_id):
    """Get all standard descriptions for a category"""
    try:
        descriptions = StandardDescription.query.filter_by(
            category_id=category_id,
            is_active=True
        ).all()
        
        return jsonify({
            'success': True,
            'data': standard_descriptions_schema.dump(descriptions)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/descriptions', methods=['GET'])
def get_all_descriptions():
    """Get all standard descriptions"""
    try:
        descriptions = StandardDescription.query.filter_by(is_active=True).all()
        
        return jsonify({
            'success': True,
            'data': standard_descriptions_schema.dump(descriptions)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/descriptions', methods=['POST'])
def create_description():
    """Create a new standard description"""
    try:
        data = request.get_json()
        
        required_fields = ['category_id', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        description = StandardDescription(
            category_id=data['category_id'],
            description=data['description'],
            is_active=data.get('is_active', True)
        )
        
        db.session.add(description)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Description created successfully',
            'data': standard_description_schema.dump(description)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/descriptions/<int:description_id>', methods=['PUT'])
def update_description(description_id):
    """Update a standard description"""
    try:
        description = StandardDescription.query.get(description_id)
        
        if not description:
            return jsonify({'error': 'Description not found'}), 404
        
        data = request.get_json()
        
        if 'description' in data:
            description.description = data['description']
        if 'is_active' in data:
            description.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Description updated successfully',
            'data': standard_description_schema.dump(description)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@categories_bp.route('/descriptions/<int:description_id>', methods=['DELETE'])
def delete_description(description_id):
    """Delete a standard description"""
    try:
        description = StandardDescription.query.get(description_id)
        
        if not description:
            return jsonify({'error': 'Description not found'}), 404
        
        db.session.delete(description)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Description deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
