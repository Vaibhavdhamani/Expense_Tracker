# Quick Start Guide - Smart Expense Tracker Backend

## 🚀 Getting Started in 3 Steps

### Step 1: Setup Environment
```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Run the Server
```bash
python app.py
```

You should see:
```
Database tables created successfully!
Default categories created!
Standard descriptions created!
 * Running on http://0.0.0.0:5000
```

### Step 3: Populate Sample Data (Optional but Recommended)
```bash
# In a new terminal (keep the server running)
python populate_sample_data.py
```

This creates:
- 1 sample user (Alex Rivera)
- 30 expenses over the last month
- 7 budgets for different categories
- Trains the ML model
- Shows predictions and insights

## 📬 Test with Postman

1. Open Postman
2. Click **Import**
3. Select `Postman_Collection.json`
4. Start testing!

## 🎯 Key Endpoints to Try First

### 1. Get All Categories
```
GET http://localhost:5000/api/categories
```

### 2. Create an Expense
```
POST http://localhost:5000/api/expenses
{
  "user_id": 1,
  "category_id": 1,
  "amount": 25.50,
  "description": "Lunch",
  "date": "2024-02-02T12:00:00Z"
}
```

### 3. Get Expense Summary
```
GET http://localhost:5000/api/expenses/summary?user_id=1&days=30
```

### 4. Get Budget Status
```
GET http://localhost:5000/api/budgets/status?user_id=1
```

### 5. Get ML Prediction
```
POST http://localhost:5000/api/predictions/predict
{
  "user_id": 1,
  "period": "monthly"
}
```

## 🔍 Verify Everything Works

Run this command after populating data:
```bash
curl http://localhost:5000/api/expenses/summary?user_id=1\&days=30
```

You should see a JSON response with spending data!

## 🐛 Troubleshooting

**Server won't start?**
- Check if Python 3.8+ is installed: `python --version`
- Make sure all dependencies are installed: `pip install -r requirements.txt`

**Can't connect from Postman?**
- Make sure the server is running
- Check the URL is `http://localhost:5000/api`
- Disable any firewall/antivirus temporarily

**Sample data script fails?**
- Make sure the server is running first
- Check if you're using the correct Python: `python populate_sample_data.py`

## 📚 Next Steps

1. Read the full `README.md` for detailed API documentation
2. Import and explore the Postman collection
3. Try creating custom categories and expenses
4. Experiment with different date ranges
5. Test the ML predictions with your own data

## 💡 Pro Tips

- The ML model needs at least 10 expenses to train
- Use the standard descriptions for faster expense entry
- Set budgets to track spending limits
- Check insights endpoint for spending patterns
- Daily predictions are weekly predictions / 7
- Monthly predictions are weekly predictions * 4.33

Happy coding! 🎉
