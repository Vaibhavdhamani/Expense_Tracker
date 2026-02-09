# API Testing Guide with cURL Examples

This guide provides ready-to-use cURL commands for testing all API endpoints.

## Prerequisites
- Backend server running on `http://localhost:5000`
- jq installed for pretty JSON output (optional): `sudo apt install jq` or `brew install jq`

## Quick Test Sequence

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_rivera",
    "email": "alex@example.com"
  }' | jq
```

Save the returned `user_id` for subsequent requests.

### 3. Get All Categories
```bash
curl http://localhost:5000/api/categories | jq
```

---

## Complete API Reference with cURL

### 👤 User Management

#### Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com"
  }'
```

#### Get All Users
```bash
curl http://localhost:5000/api/users | jq
```

#### Get User by ID
```bash
USER_ID=1
curl http://localhost:5000/api/users/$USER_ID | jq
```

#### Get User by Email
```bash
curl "http://localhost:5000/api/users/by-email?email=alex@example.com" | jq
```

#### Update User
```bash
USER_ID=1
curl -X PUT http://localhost:5000/api/users/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_updated",
    "email": "alex.new@example.com"
  }'
```

#### Delete User
```bash
USER_ID=1
curl -X DELETE http://localhost:5000/api/users/$USER_ID
```

---

### 📂 Category Management

#### Get All Categories
```bash
curl http://localhost:5000/api/categories | jq
```

#### Get Category by ID
```bash
CATEGORY_ID=1
curl http://localhost:5000/api/categories/$CATEGORY_ID | jq
```

#### Create Custom Category
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Investments",
    "icon": "💰",
    "color": "#10b981"
  }'
```

#### Update Category
```bash
CATEGORY_ID=13
curl -X PUT http://localhost:5000/api/categories/$CATEGORY_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Investments Updated",
    "color": "#22c55e"
  }'
```

#### Get Category Descriptions
```bash
CATEGORY_ID=1
curl http://localhost:5000/api/categories/$CATEGORY_ID/descriptions | jq
```

#### Get All Standard Descriptions
```bash
curl http://localhost:5000/api/descriptions | jq
```

#### Create Standard Description
```bash
curl -X POST http://localhost:5000/api/descriptions \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "description": "Fine Dining",
    "is_active": true
  }'
```

---

### 💰 Expense Management

#### Create Expense
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "category_id": 1,
    "amount": 45.50,
    "description": "Dinner at Italian Restaurant",
    "notes": "Team dinner",
    "date": "2024-02-02T19:30:00Z"
  }' | jq
```

#### Create Multiple Expenses (Bash Script)
```bash
#!/bin/bash
USER_ID=1

# Create 5 sample expenses
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":1,\"amount\":24.50,\"description\":\"Burger Palace\",\"date\":\"2024-02-02T12:45:00Z\"}"

curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":2,\"amount\":45.20,\"description\":\"Fuel/Gas\",\"date\":\"2024-02-01T08:30:00Z\"}"

curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":3,\"amount\":129.00,\"description\":\"Electronics\",\"date\":\"2024-01-30T14:20:00Z\"}"

curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":9,\"amount\":1200.00,\"description\":\"Rent\",\"date\":\"2024-02-01T09:00:00Z\"}"

curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":10,\"amount\":85.30,\"description\":\"Supermarket\",\"date\":\"2024-01-28T16:45:00Z\"}"
```

#### Get All Expenses for User
```bash
USER_ID=1
curl "http://localhost:5000/api/expenses?user_id=$USER_ID" | jq
```

#### Get Expenses - Last 15 Days
```bash
USER_ID=1
curl "http://localhost:5000/api/expenses?user_id=$USER_ID&days=15" | jq
```

#### Get Expenses - Last 30 Days
```bash
USER_ID=1
curl "http://localhost:5000/api/expenses?user_id=$USER_ID&days=30" | jq
```

#### Get Expenses - Custom Date Range
```bash
USER_ID=1
START_DATE="2024-01-01T00:00:00Z"
END_DATE="2024-02-02T23:59:59Z"
curl "http://localhost:5000/api/expenses?user_id=$USER_ID&start_date=$START_DATE&end_date=$END_DATE" | jq
```

#### Get Expenses by Category
```bash
USER_ID=1
CATEGORY_ID=1
curl "http://localhost:5000/api/expenses?user_id=$USER_ID&category_id=$CATEGORY_ID" | jq
```

#### Get Expense by ID
```bash
EXPENSE_ID=1
curl http://localhost:5000/api/expenses/$EXPENSE_ID | jq
```

#### Update Expense
```bash
EXPENSE_ID=1
curl -X PUT http://localhost:5000/api/expenses/$EXPENSE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "description": "Updated Description",
    "notes": "Updated notes"
  }'
```

#### Delete Expense
```bash
EXPENSE_ID=1
curl -X DELETE http://localhost:5000/api/expenses/$EXPENSE_ID
```

#### Get Expense Summary (with chart data)
```bash
USER_ID=1
curl "http://localhost:5000/api/expenses/summary?user_id=$USER_ID&days=30" | jq
```

**Response contains:**
- Total spending
- Average daily spending
- Category breakdown (for pie chart)
- Daily breakdown (for line/bar chart)

#### Get Expense Statistics
```bash
USER_ID=1
curl "http://localhost:5000/api/expenses/stats?user_id=$USER_ID&days=30" | jq
```

---

### 💼 Budget Management

#### Create Budget
```bash
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "category_id": 1,
    "amount": 600.00,
    "period": "monthly",
    "start_date": "2024-02-01T00:00:00Z",
    "is_active": true
  }' | jq
```

#### Create Multiple Budgets (Bash Script)
```bash
#!/bin/bash
USER_ID=1
START_DATE="2024-02-01T00:00:00Z"

# Food & Dining
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":1,\"amount\":600.00,\"period\":\"monthly\",\"start_date\":\"$START_DATE\",\"is_active\":true}"

# Transportation
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":2,\"amount\":320.00,\"period\":\"monthly\",\"start_date\":\"$START_DATE\",\"is_active\":true}"

# Shopping
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":3,\"amount\":300.00,\"period\":\"monthly\",\"start_date\":\"$START_DATE\",\"is_active\":true}"

# Housing
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":9,\"amount\":1200.00,\"period\":\"monthly\",\"start_date\":\"$START_DATE\",\"is_active\":true}"

# Groceries
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"category_id\":10,\"amount\":500.00,\"period\":\"monthly\",\"start_date\":\"$START_DATE\",\"is_active\":true}"
```

#### Get All Budgets
```bash
USER_ID=1
curl "http://localhost:5000/api/budgets?user_id=$USER_ID" | jq
```

#### Get Active Budgets Only
```bash
USER_ID=1
curl "http://localhost:5000/api/budgets?user_id=$USER_ID&is_active=true" | jq
```

#### Get Budget by ID
```bash
BUDGET_ID=1
curl http://localhost:5000/api/budgets/$BUDGET_ID | jq
```

#### Update Budget
```bash
BUDGET_ID=1
curl -X PUT http://localhost:5000/api/budgets/$BUDGET_ID \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 700.00,
    "is_active": true
  }'
```

#### Delete Budget
```bash
BUDGET_ID=1
curl -X DELETE http://localhost:5000/api/budgets/$BUDGET_ID
```

#### Get Budget Status (Budget vs Actual)
```bash
USER_ID=1
curl "http://localhost:5000/api/budgets/status?user_id=$USER_ID" | jq
```

**Response shows:**
- Total budgeted vs spent
- Per-category breakdown
- Percentage used
- Exceeded budgets

---

### 🤖 ML Predictions & Insights

#### Train ML Model
```bash
curl -X POST http://localhost:5000/api/predictions/train \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1
  }' | jq
```

**Note:** Requires at least 10 expense records.

#### Get Budget Prediction (Monthly)
```bash
curl -X POST http://localhost:5000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "period": "monthly"
  }' | jq
```

#### Get Budget Prediction (Weekly)
```bash
curl -X POST http://localhost:5000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "period": "weekly"
  }' | jq
```

#### Get Budget Prediction (Daily)
```bash
curl -X POST http://localhost:5000/api/predictions/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "period": "daily"
  }' | jq
```

#### Get Prediction History
```bash
USER_ID=1
curl "http://localhost:5000/api/predictions/history?user_id=$USER_ID&limit=10" | jq
```

#### Get Spending Insights
```bash
USER_ID=1
curl "http://localhost:5000/api/insights/spending?user_id=$USER_ID&days=30" | jq
```

**Response includes:**
- Total spending
- Average daily/transaction amounts
- Category breakdown
- Daily trend data

#### Get AI Recommendations
```bash
USER_ID=1
curl "http://localhost:5000/api/insights/recommendations?user_id=$USER_ID" | jq
```

**Response includes:**
- Personalized recommendations
- Spending warnings
- Optimization tips

---

## Complete Testing Script

Save this as `test_api.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Smart Expense Tracker API Test${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Create User
echo -e "${GREEN}1. Creating user...${NC}"
USER_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","email":"test@example.com"}')
echo $USER_RESPONSE | jq
USER_ID=$(echo $USER_RESPONSE | jq -r '.data.id')
echo -e "User ID: $USER_ID\n"

# Test 2: Get Categories
echo -e "${GREEN}2. Getting categories...${NC}"
curl -s $BASE_URL/categories | jq
echo ""

# Test 3: Create Expense
echo -e "${GREEN}3. Creating expense...${NC}"
curl -s -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"category_id\": 1,
    \"amount\": 25.50,
    \"description\": \"Test Expense\",
    \"date\": \"2024-02-02T12:00:00Z\"
  }" | jq
echo ""

# Test 4: Get Expenses
echo -e "${GREEN}4. Getting expenses...${NC}"
curl -s "$BASE_URL/expenses?user_id=$USER_ID" | jq
echo ""

# Test 5: Create Budget
echo -e "${GREEN}5. Creating budget...${NC}"
curl -s -X POST $BASE_URL/budgets \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"category_id\": 1,
    \"amount\": 500.00,
    \"period\": \"monthly\",
    \"start_date\": \"2024-02-01T00:00:00Z\",
    \"is_active\": true
  }" | jq
echo ""

# Test 6: Get Budget Status
echo -e "${GREEN}6. Getting budget status...${NC}"
curl -s "$BASE_URL/budgets/status?user_id=$USER_ID" | jq
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
```

Make it executable and run:
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## Tips for Testing

1. **Use jq for pretty output:**
   ```bash
   curl ... | jq
   ```

2. **Save response to variable:**
   ```bash
   RESPONSE=$(curl -s ...)
   USER_ID=$(echo $RESPONSE | jq -r '.data.id')
   ```

3. **Check HTTP status:**
   ```bash
   curl -w "\nHTTP Status: %{http_code}\n" ...
   ```

4. **Verbose output for debugging:**
   ```bash
   curl -v ...
   ```

5. **Save response to file:**
   ```bash
   curl ... > response.json
   ```

---

## Common Issues

**Connection refused:**
- Make sure the server is running: `python app.py`

**404 Not Found:**
- Check the URL is correct
- Ensure `/api` prefix is included

**400 Bad Request:**
- Verify JSON is valid
- Check required fields are present
- Ensure data types are correct

**500 Internal Server Error:**
- Check server logs
- Verify database is accessible
- Ensure all dependencies are installed

---

**Happy Testing! 🚀**
