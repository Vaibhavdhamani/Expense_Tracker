# Smart Expense Tracker - Backend API

A professional expense tracking system with ML-powered budget prediction capabilities.

## Features

✅ **User Management** - Create and manage user accounts
✅ **Category Management** - Predefined and custom expense categories
✅ **Standard Descriptions** - Quick selection for common expenses
✅ **Expense Tracking** - Add, edit, delete, and filter expenses
✅ **Budget Management** - Set budgets by category with different periods
✅ **ML Budget Prediction** - AI-powered spending predictions
✅ **Insights & Analytics** - Detailed spending insights and recommendations
✅ **Date Range Filtering** - View expenses for 15/30 days or custom ranges
✅ **Category-wise Analysis** - Breakdown by categories with charts

## Technology Stack

- **Framework**: Flask 3.0.0
- **Database**: SQLite (SQLAlchemy ORM)
- **ML**: scikit-learn, pandas, numpy
- **Serialization**: Marshmallow
- **CORS**: Flask-CORS

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup Steps

1. **Clone or navigate to the backend directory**
```bash
cd backend
```

2. **Create a virtual environment**
```bash
python -m venv venv
```

3. **Activate the virtual environment**

On Windows:
```bash
venv\Scripts\activate
```

On macOS/Linux:
```bash
source venv/bin/activate
```

4. **Install dependencies**
```bash
pip install -r requirements.txt
```

5. **Run the application**
```bash
python app.py
```

The server will start on `http://localhost:5000`

## Default Data

The application comes pre-loaded with:

### Categories
1. **Food & Dining** 🍔
2. **Transportation** 🚗
3. **Shopping** 🛍️
4. **Entertainment** 🎬
5. **Bills & Utilities** ⚡
6. **Healthcare** 🏥
7. **Education** 📚
8. **Travel** ✈️
9. **Housing** 🏠
10. **Groceries** 🛒
11. **Personal Care** 💅
12. **Others** 📝

### Standard Descriptions per Category
Each category has 4-6 pre-defined descriptions for quick expense entry:
- Food & Dining: Restaurant, Fast Food, Coffee Shop, Home Delivery, Other
- Transportation: Fuel/Gas, Public Transit, Taxi/Uber, Parking, etc.
- (And more for each category...)

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Currently, no authentication is required (add JWT/OAuth in production).

---

## API Endpoints

### 1. Users

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "username": "alex_rivera",
  "email": "alex@example.com"
}
```

#### Get All Users
```http
GET /api/users
```

#### Get User by ID
```http
GET /api/users/{user_id}
```

#### Get User by Email
```http
GET /api/users/by-email?email=alex@example.com
```

#### Update User
```http
PUT /api/users/{user_id}
Content-Type: application/json

{
  "username": "new_username",
  "email": "new_email@example.com"
}
```

---

### 2. Categories

#### Get All Categories
```http
GET /api/categories
```

#### Get Category by ID
```http
GET /api/categories/{category_id}
```

#### Create Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Custom Category",
  "icon": "💰",
  "color": "#10b981"
}
```

#### Get Category Descriptions
```http
GET /api/categories/{category_id}/descriptions
```

#### Get All Standard Descriptions
```http
GET /api/descriptions
```

#### Create Standard Description
```http
POST /api/descriptions
Content-Type: application/json

{
  "category_id": 1,
  "description": "Custom Description",
  "is_active": true
}
```

---

### 3. Expenses

#### Create Expense
```http
POST /api/expenses
Content-Type: application/json

{
  "user_id": 1,
  "category_id": 1,
  "amount": 24.50,
  "description": "Burger Palace",
  "notes": "Lunch with friends",
  "date": "2024-02-02T12:45:00Z"
}
```

#### Get All Expenses (with filters)
```http
GET /api/expenses?user_id=1
GET /api/expenses?user_id=1&days=15          # Last 15 days
GET /api/expenses?user_id=1&days=30          # Last 30 days
GET /api/expenses?user_id=1&category_id=1    # By category
GET /api/expenses?user_id=1&start_date=2024-01-01T00:00:00Z&end_date=2024-02-02T23:59:59Z  # Custom range
```

#### Get Expense by ID
```http
GET /api/expenses/{expense_id}
```

#### Update Expense
```http
PUT /api/expenses/{expense_id}
Content-Type: application/json

{
  "amount": 30.00,
  "description": "Updated description"
}
```

#### Delete Expense
```http
DELETE /api/expenses/{expense_id}
```

#### Get Expense Summary
```http
GET /api/expenses/summary?user_id=1&days=30
```

**Response includes:**
- Total spending
- Average daily spending
- Category breakdown (for pie charts)
- Daily breakdown (for line/bar charts)

#### Get Expense Statistics
```http
GET /api/expenses/stats?user_id=1&days=30
```

---

### 4. Budgets

#### Create Budget
```http
POST /api/budgets
Content-Type: application/json

{
  "user_id": 1,
  "category_id": 1,
  "amount": 600.00,
  "period": "monthly",
  "start_date": "2024-02-01T00:00:00Z",
  "is_active": true
}
```

**Periods**: `daily`, `weekly`, `monthly`, `yearly`

#### Get All Budgets
```http
GET /api/budgets?user_id=1
GET /api/budgets?user_id=1&is_active=true
```

#### Get Budget by ID
```http
GET /api/budgets/{budget_id}
```

#### Update Budget
```http
PUT /api/budgets/{budget_id}
Content-Type: application/json

{
  "amount": 700.00,
  "is_active": true
}
```

#### Delete Budget
```http
DELETE /api/budgets/{budget_id}
```

#### Get Budget Status
```http
GET /api/budgets/status?user_id=1
```

**Response includes:**
- Budgeted amount
- Spent amount
- Remaining amount
- Percentage used
- Is exceeded flag
- Per category breakdown

---

### 5. ML Predictions & Insights

#### Train ML Model
```http
POST /api/predictions/train
Content-Type: application/json

{
  "user_id": 1
}
```

**Note**: Model requires at least 10 expense records to train.

#### Get Budget Prediction
```http
POST /api/predictions/predict
Content-Type: application/json

{
  "user_id": 1,
  "period": "monthly"
}
```

**Response includes:**
- Predicted amount
- Confidence score (0-1)
- Prediction period
- Features used

#### Get Prediction History
```http
GET /api/predictions/history?user_id=1&limit=10
```

#### Get Spending Insights
```http
GET /api/insights/spending?user_id=1&days=30
```

**Response includes:**
- Total spending
- Average daily spending
- Number of transactions
- Average transaction amount
- Category breakdown
- Daily trend

#### Get AI Recommendations
```http
GET /api/insights/recommendations?user_id=1
```

**Response includes:**
- Personalized spending recommendations
- Warnings about high spending categories
- Tips for reducing expenses

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Select the file `Postman_Collection.json`
4. The collection will be imported with all endpoints

### Environment Variables

The collection uses these variables:
- `base_url`: http://localhost:5000/api
- `user_id`: 1 (update after creating a user)
- `category_id`: 1
- `expense_id`: 1
- `budget_id`: 1

### Testing Workflow

1. **Create a User**
   - Use "Create User" request
   - Note the returned `user_id`
   - Update the `user_id` variable in Postman

2. **View Categories**
   - Use "Get All Categories"
   - Note category IDs for creating expenses

3. **Create Sample Expenses**
   - Use "Create Expense" request
   - Create at least 10-15 expenses with different dates
   - Vary the amounts and categories

4. **Create Budgets**
   - Use "Create Budget" request
   - Set budgets for different categories

5. **View Budget Status**
   - Use "Get Budget Status"
   - See how much you've spent vs budgeted

6. **Train ML Model**
   - Use "Train ML Model" (requires 10+ expenses)
   - Check the training metrics

7. **Get Predictions**
   - Use "Get Budget Prediction"
   - See predicted spending for next month

8. **View Insights**
   - Use "Get Spending Insights"
   - Use "Get AI Recommendations"

---

## Sample Data for Testing

### Sample Users
```json
{
  "username": "alex_rivera",
  "email": "alex@example.com"
}
```

### Sample Expenses
```json
[
  {
    "user_id": 1,
    "category_id": 1,
    "amount": 24.50,
    "description": "Restaurant",
    "date": "2024-02-02T12:45:00Z"
  },
  {
    "user_id": 1,
    "category_id": 2,
    "amount": 45.20,
    "description": "Fuel/Gas",
    "date": "2024-02-01T08:30:00Z"
  },
  {
    "user_id": 1,
    "category_id": 3,
    "amount": 129.00,
    "description": "Electronics",
    "date": "2024-01-30T14:20:00Z"
  },
  {
    "user_id": 1,
    "category_id": 9,
    "amount": 1200.00,
    "description": "Rent",
    "date": "2024-02-01T09:00:00Z"
  },
  {
    "user_id": 1,
    "category_id": 10,
    "amount": 85.30,
    "description": "Supermarket",
    "date": "2024-01-28T16:45:00Z"
  }
]
```

---

## ML Model Details

### Features Used
- Average daily spending
- Average weekly spending
- Number of transactions
- Maximum transaction amount
- Minimum transaction amount
- Standard deviation of transactions
- Category-wise spending patterns
- Day of week patterns
- Day of month patterns
- Week of year patterns

### Algorithm
- **Gradient Boosting Regressor** (scikit-learn)
- 100 estimators
- Learning rate: 0.1
- Max depth: 4

### Minimum Data Requirements
- At least 10 expense records
- Preferably spanning 2-3 weeks for better predictions

---

## Database Schema

### Users
- id (Primary Key)
- username (Unique)
- email (Unique)
- created_at

### Categories
- id (Primary Key)
- name (Unique)
- icon
- color

### Standard Descriptions
- id (Primary Key)
- category_id (Foreign Key)
- description
- is_active

### Expenses
- id (Primary Key)
- user_id (Foreign Key)
- category_id (Foreign Key)
- amount
- description
- notes
- date
- created_at
- updated_at

### Budgets
- id (Primary Key)
- user_id (Foreign Key)
- category_id (Foreign Key)
- amount
- period (daily/weekly/monthly/yearly)
- start_date
- end_date
- is_active
- created_at

### Budget Predictions
- id (Primary Key)
- user_id (Foreign Key)
- category_id (Foreign Key)
- predicted_amount
- confidence_score
- prediction_period
- features_used
- created_at

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

---

## Production Considerations

Before deploying to production:

1. **Security**
   - Add authentication (JWT/OAuth)
   - Add authorization middleware
   - Use environment variables for sensitive data
   - Enable HTTPS

2. **Database**
   - Switch to PostgreSQL/MySQL
   - Add database migrations (Alembic)
   - Set up database backups

3. **Performance**
   - Add caching (Redis)
   - Implement pagination
   - Add database indexing
   - Use connection pooling

4. **Monitoring**
   - Add logging (Python logging)
   - Set up error tracking (Sentry)
   - Monitor API performance

5. **Deployment**
   - Use Gunicorn/uWSGI
   - Set up reverse proxy (Nginx)
   - Configure CORS properly
   - Set up CI/CD

---

## Troubleshooting

### Database not created
```bash
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
...     db.create_all()
```

### Module not found errors
```bash
pip install -r requirements.txt --upgrade
```

### Port already in use
Change port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

---

## Support

For issues or questions:
1. Check the API documentation above
2. Review the Postman collection examples
3. Check console logs for errors

---

## License

MIT License - Feel free to use for personal or commercial projects.

---

**Happy Tracking! 💰📊**
