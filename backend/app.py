from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db
from schemas import ma
import os

# Import blueprints
from routes.user_routes import users_bp
from routes.category_routes import categories_bp
from routes.expense_routes import expenses_bp
from routes.budget_routes import budgets_bp
from routes.prediction_routes import predictions_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(categories_bp, url_prefix='/api')
    app.register_blueprint(expenses_bp, url_prefix='/api')
    app.register_blueprint(budgets_bp, url_prefix='/api')
    app.register_blueprint(predictions_bp, url_prefix='/api')
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Smart Expense Tracker API',
            'version': '1.0.0',
            'endpoints': {
                'users': '/api/users',
                'categories': '/api/categories',
                'expenses': '/api/expenses',
                'budgets': '/api/budgets',
                'predictions': '/api/predictions'
            }
        })
    
    # Health check route
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
        
        # Initialize with default categories if empty
        from models import Category, StandardDescription
        
        if Category.query.count() == 0:
            default_categories = [
                {'name': 'Food & Dining', 'icon': '🍔', 'color': '#ef4444'},
                {'name': 'Transportation', 'icon': '🚗', 'color': '#3b82f6'},
                {'name': 'Shopping', 'icon': '🛍️', 'color': '#8b5cf6'},
                {'name': 'Entertainment', 'icon': '🎬', 'color': '#ec4899'},
                {'name': 'Bills & Utilities', 'icon': '⚡', 'color': '#f59e0b'},
                {'name': 'Healthcare', 'icon': '🏥', 'color': '#10b981'},
                {'name': 'Education', 'icon': '📚', 'color': '#6366f1'},
                {'name': 'Travel', 'icon': '✈️', 'color': '#14b8a6'},
                {'name': 'Housing', 'icon': '🏠', 'color': '#f97316'},
                {'name': 'Groceries', 'icon': '🛒', 'color': '#22c55e'},
                {'name': 'Personal Care', 'icon': '💅', 'color': '#a855f7'},
                {'name': 'Others', 'icon': '📝', 'color': '#64748b'}
            ]
            
            for cat_data in default_categories:
                category = Category(**cat_data)
                db.session.add(category)
            
            db.session.commit()
            print("Default categories created!")
            
            # Add standard descriptions for each category
            standard_descriptions = {
                'Food & Dining': ['Restaurant', 'Fast Food', 'Coffee Shop', 'Home Delivery', 'Other'],
                'Transportation': ['Fuel/Gas', 'Public Transit', 'Taxi/Uber', 'Parking', 'Vehicle Maintenance', 'Other'],
                'Shopping': ['Clothing', 'Electronics', 'Home Items', 'Gifts', 'Online Shopping', 'Other'],
                'Entertainment': ['Movies', 'Concerts', 'Streaming Services', 'Games', 'Sports', 'Other'],
                'Bills & Utilities': ['Electricity', 'Water', 'Internet', 'Phone Bill', 'Insurance', 'Other'],
                'Healthcare': ['Doctor Visit', 'Medicines', 'Lab Tests', 'Hospital', 'Pharmacy', 'Other'],
                'Education': ['Tuition Fees', 'Books', 'Courses', 'Supplies', 'Other'],
                'Travel': ['Flight', 'Hotel', 'Vacation', 'Travel Insurance', 'Other'],
                'Housing': ['Rent', 'Mortgage', 'Property Tax', 'Home Maintenance', 'Other'],
                'Groceries': ['Supermarket', 'Local Market', 'Organic Store', 'Other'],
                'Personal Care': ['Salon', 'Gym', 'Spa', 'Cosmetics', 'Other'],
                'Others': ['Miscellaneous', 'Other']
            }
            
            categories = Category.query.all()
            for category in categories:
                if category.name in standard_descriptions:
                    for desc in standard_descriptions[category.name]:
                        std_desc = StandardDescription(
                            category_id=category.id,
                            description=desc,
                            is_active=True
                        )
                        db.session.add(std_desc)
            
            db.session.commit()
            print("Standard descriptions created!")
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
