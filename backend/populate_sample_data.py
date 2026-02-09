"""
Sample Data Populator for Smart Expense Tracker
This script creates sample users, expenses, and budgets for testing
"""

import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "http://localhost:5000/api"

def create_user():
    """Create a sample user"""
    print("\n📝 Creating user...")
    data = {
        "username": "alex_rivera",
        "email": "alex@example.com"
    }
    
    response = requests.post(f"{BASE_URL}/users", json=data)
    if response.status_code == 201:
        user = response.json()['data']
        print(f"✅ User created: ID={user['id']}, Username={user['username']}")
        return user['id']
    else:
        # User might already exist, try to get by email
        response = requests.get(f"{BASE_URL}/users/by-email?email=alex@example.com")
        if response.status_code == 200:
            user = response.json()['data']
            print(f"ℹ️  User already exists: ID={user['id']}, Username={user['username']}")
            return user['id']
    
    print(f"❌ Failed to create user: {response.text}")
    return None

def get_categories():
    """Get all categories"""
    print("\n📂 Fetching categories...")
    response = requests.get(f"{BASE_URL}/categories")
    if response.status_code == 200:
        categories = response.json()['data']
        print(f"✅ Found {len(categories)} categories")
        return categories
    
    print(f"❌ Failed to fetch categories: {response.text}")
    return []

def create_sample_expenses(user_id, categories):
    """Create 30 sample expenses over the last month"""
    print(f"\n💰 Creating 30 sample expenses for user {user_id}...")
    
    # Sample expense templates per category
    expense_templates = {
        'Food & Dining': [
            ('Restaurant', 25.50), ('Fast Food', 12.99), ('Coffee Shop', 6.50),
            ('Home Delivery', 35.00), ('Restaurant', 45.00)
        ],
        'Transportation': [
            ('Fuel/Gas', 50.00), ('Taxi/Uber', 15.00), ('Public Transit', 5.00),
            ('Parking', 8.00), ('Fuel/Gas', 55.00)
        ],
        'Shopping': [
            ('Clothing', 89.99), ('Electronics', 129.00), ('Online Shopping', 45.00),
            ('Gifts', 50.00), ('Home Items', 35.00)
        ],
        'Entertainment': [
            ('Movies', 25.00), ('Streaming Services', 12.99), ('Games', 59.99),
            ('Concerts', 85.00), ('Sports', 40.00)
        ],
        'Bills & Utilities': [
            ('Electricity', 120.00), ('Internet', 59.99), ('Phone Bill', 45.00),
            ('Water', 35.00), ('Insurance', 150.00)
        ],
        'Groceries': [
            ('Supermarket', 85.00), ('Local Market', 45.00), ('Supermarket', 92.50),
            ('Organic Store', 65.00), ('Supermarket', 78.00)
        ],
        'Housing': [
            ('Rent', 1200.00), ('Home Maintenance', 150.00),
            ('Property Tax', 300.00)
        ]
    }
    
    created_count = 0
    
    # Create expenses over the last 30 days
    for i in range(30):
        # Random date in the last 30 days
        days_ago = random.randint(0, 29)
        expense_date = datetime.utcnow() - timedelta(days=days_ago)
        
        # Pick a random category
        category = random.choice(categories)
        category_name = category['name']
        
        # Get templates for this category or use generic
        if category_name in expense_templates:
            templates = expense_templates[category_name]
            desc, base_amount = random.choice(templates)
            # Add some randomness to amount
            amount = round(base_amount * random.uniform(0.8, 1.2), 2)
        else:
            desc = "Other"
            amount = round(random.uniform(10, 100), 2)
        
        data = {
            "user_id": user_id,
            "category_id": category['id'],
            "amount": amount,
            "description": desc,
            "notes": f"Sample expense for testing - {category_name}",
            "date": expense_date.isoformat() + "Z"
        }
        
        response = requests.post(f"{BASE_URL}/expenses", json=data)
        if response.status_code == 201:
            created_count += 1
            if created_count % 10 == 0:
                print(f"  Created {created_count}/30 expenses...")
        else:
            print(f"  ⚠️  Failed to create expense: {response.text}")
    
    print(f"✅ Created {created_count} sample expenses")
    return created_count

def create_sample_budgets(user_id, categories):
    """Create sample budgets for different categories"""
    print(f"\n💼 Creating sample budgets for user {user_id}...")
    
    budget_amounts = {
        'Food & Dining': 600.00,
        'Transportation': 320.00,
        'Shopping': 300.00,
        'Entertainment': 200.00,
        'Bills & Utilities': 400.00,
        'Groceries': 500.00,
        'Housing': 1200.00
    }
    
    created_count = 0
    start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    for category in categories:
        if category['name'] in budget_amounts:
            data = {
                "user_id": user_id,
                "category_id": category['id'],
                "amount": budget_amounts[category['name']],
                "period": "monthly",
                "start_date": start_date.isoformat() + "Z",
                "is_active": True
            }
            
            response = requests.post(f"{BASE_URL}/budgets", json=data)
            if response.status_code == 201:
                created_count += 1
                print(f"  ✓ Budget for {category['name']}: ${budget_amounts[category['name']]}")
            else:
                print(f"  ⚠️  Failed to create budget for {category['name']}")
    
    print(f"✅ Created {created_count} budgets")
    return created_count

def test_predictions(user_id):
    """Test ML predictions"""
    print(f"\n🤖 Testing ML predictions for user {user_id}...")
    
    # Train model
    print("  Training model...")
    response = requests.post(f"{BASE_URL}/predictions/train", json={"user_id": user_id})
    if response.status_code == 200:
        metrics = response.json().get('metrics', {})
        print(f"  ✅ Model trained successfully!")
        print(f"     Test MAE: ${metrics.get('test_mae', 0):.2f}")
        print(f"     Test R²: {metrics.get('test_r2', 0):.2f}")
    else:
        print(f"  ⚠️  Training failed: {response.json().get('message', 'Unknown error')}")
        return
    
    # Get prediction
    print("  Getting monthly prediction...")
    response = requests.post(f"{BASE_URL}/predictions/predict", 
                            json={"user_id": user_id, "period": "monthly"})
    if response.status_code == 200:
        prediction = response.json()['data']
        print(f"  ✅ Predicted monthly spending: ${prediction['predicted_amount']:.2f}")
        print(f"     Confidence: {prediction['confidence_score']:.2%}")
    else:
        print(f"  ⚠️  Prediction failed: {response.json().get('message', 'Unknown error')}")

def get_insights(user_id):
    """Get spending insights"""
    print(f"\n📊 Getting spending insights for user {user_id}...")
    
    response = requests.get(f"{BASE_URL}/insights/spending?user_id={user_id}&days=30")
    if response.status_code == 200:
        insights = response.json()['data']
        print(f"  Total Spending (30 days): ${insights['total_spending']:.2f}")
        print(f"  Average Daily: ${insights['average_daily']:.2f}")
        print(f"  Number of Transactions: {insights['num_transactions']}")
        print(f"\n  Top Categories:")
        category_breakdown = insights['category_breakdown']
        sorted_categories = sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True)
        for cat, amount in sorted_categories[:5]:
            print(f"    - {cat}: ${amount:.2f}")
    else:
        print(f"  ⚠️  Failed to get insights")
    
    # Get recommendations
    print(f"\n💡 Getting AI recommendations...")
    response = requests.get(f"{BASE_URL}/insights/recommendations?user_id={user_id}")
    if response.status_code == 200:
        data = response.json()['data']
        recommendations = data.get('recommendations', [])
        print(f"  Found {len(recommendations)} recommendations:")
        for rec in recommendations:
            emoji = "⚠️" if rec['priority'] == 'high' else "ℹ️" if rec['priority'] == 'medium' else "✓"
            print(f"    {emoji} {rec['title']}")
            print(f"      {rec['message']}")
    else:
        print(f"  ⚠️  Failed to get recommendations")

def get_budget_status(user_id):
    """Get budget status"""
    print(f"\n💰 Getting budget status for user {user_id}...")
    
    response = requests.get(f"{BASE_URL}/budgets/status?user_id={user_id}")
    if response.status_code == 200:
        data = response.json()['data']
        budgets = data['budgets']
        
        print(f"\n  Overall:")
        print(f"    Total Budgeted: ${data['total_budgeted']:.2f}")
        print(f"    Total Spent: ${data['total_spent']:.2f}")
        print(f"    Total Remaining: ${data['total_remaining']:.2f}")
        
        print(f"\n  By Category:")
        for budget in budgets:
            status = "🔴 EXCEEDED" if budget['is_exceeded'] else "🟢 On Track"
            print(f"    {budget['category_name']}: ${budget['spent']:.2f} / ${budget['budgeted']:.2f} ({budget['percentage_used']:.1f}%) {status}")
    else:
        print(f"  ⚠️  Failed to get budget status")

def main():
    """Main function to populate all sample data"""
    print("=" * 60)
    print("  Smart Expense Tracker - Sample Data Populator")
    print("=" * 60)
    
    try:
        # Create user
        user_id = create_user()
        if not user_id:
            print("\n❌ Cannot proceed without a user. Exiting...")
            return
        
        # Get categories
        categories = get_categories()
        if not categories:
            print("\n❌ Cannot proceed without categories. Exiting...")
            return
        
        # Create sample expenses
        create_sample_expenses(user_id, categories)
        
        # Create sample budgets
        create_sample_budgets(user_id, categories)
        
        # Test predictions
        test_predictions(user_id)
        
        # Get insights
        get_insights(user_id)
        
        # Get budget status
        get_budget_status(user_id)
        
        print("\n" + "=" * 60)
        print("  ✅ Sample data population completed!")
        print("=" * 60)
        print(f"\n  User ID: {user_id}")
        print(f"  You can now test the API with this user ID")
        print(f"  Import the Postman collection and update user_id to {user_id}")
        print("\n" + "=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to the server.")
        print("   Make sure the Flask server is running on http://localhost:5000")
        print("   Run: python app.py")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()
