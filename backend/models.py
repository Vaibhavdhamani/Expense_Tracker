from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Float, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(Integer, primary_key=True)
    username = db.Column(String(80), unique=True, nullable=False)
    email = db.Column(String(120), unique=True, nullable=False)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    expenses = relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')
    budgets = relationship('Budget', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'


class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(50), unique=True, nullable=False)
    icon = db.Column(String(50))
    color = db.Column(String(20))
    
    # Relationships
    expenses = relationship('Expense', backref='category', lazy=True)
    budgets = relationship('Budget', backref='category', lazy=True)
    descriptions = relationship('StandardDescription', backref='category', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Category {self.name}>'


class StandardDescription(db.Model):
    __tablename__ = 'standard_descriptions'
    
    id = db.Column(Integer, primary_key=True)
    category_id = db.Column(Integer, ForeignKey('categories.id'), nullable=False)
    description = db.Column(String(200), nullable=False)
    is_active = db.Column(Boolean, default=True)
    
    def __repr__(self):
        return f'<StandardDescription {self.description}>'


class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = db.Column(Integer, ForeignKey('categories.id'), nullable=False)
    amount = db.Column(Float, nullable=False)
    description = db.Column(String(200))
    notes = db.Column(Text)
    date = db.Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Expense {self.amount} - {self.description}>'


class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = db.Column(Integer, ForeignKey('categories.id'), nullable=False)
    amount = db.Column(Float, nullable=False)
    period = db.Column(String(20), default='monthly')  # daily, weekly, monthly, yearly
    start_date = db.Column(DateTime, nullable=False)
    end_date = db.Column(DateTime)
    is_active = db.Column(Boolean, default=True)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Budget {self.amount} for {self.period}>'


class BudgetPrediction(db.Model):
    __tablename__ = 'budget_predictions'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = db.Column(Integer, ForeignKey('categories.id'))
    predicted_amount = db.Column(Float, nullable=False)
    confidence_score = db.Column(Float)
    prediction_period = db.Column(String(50))  # e.g., "2024-01", "2024-W01"
    features_used = db.Column(Text)  # JSON string of features
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BudgetPrediction {self.predicted_amount}>'
