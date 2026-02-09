# Backend Architecture Documentation

## 📁 Project Structure

```
backend/
│
├── app.py                          # Main Flask application
├── config.py                       # Configuration settings
├── models.py                       # Database models (SQLAlchemy)
├── schemas.py                      # Marshmallow schemas for serialization
├── ml_service.py                   # Machine Learning service for predictions
│
├── routes/                         # API route blueprints
│   ├── user_routes.py             # User management endpoints
│   ├── category_routes.py         # Category & descriptions endpoints
│   ├── expense_routes.py          # Expense management endpoints
│   ├── budget_routes.py           # Budget management endpoints
│   └── prediction_routes.py       # ML predictions & insights endpoints
│
├── models/                         # ML model storage (created at runtime)
│   ├── budget_predictor.joblib    # Trained prediction model
│   └── scaler.joblib              # Feature scaler
│
├── requirements.txt                # Python dependencies
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
│
├── README.md                      # Full documentation
├── QUICKSTART.md                  # Quick start guide
├── Postman_Collection.json        # API testing collection
└── populate_sample_data.py        # Sample data generator
```

## 🏗️ Architecture Overview

### 1. Application Layer (app.py)
- Initializes Flask application
- Registers all blueprints
- Sets up CORS
- Creates database tables on startup
- Populates default categories and descriptions

### 2. Database Layer (models.py)
**Models:**
- `User` - User accounts
- `Category` - Expense categories
- `StandardDescription` - Quick selection descriptions per category
- `Expense` - Individual expense records
- `Budget` - Budget limits per category
- `BudgetPrediction` - ML prediction history

**Relationships:**
- User → Expenses (One-to-Many)
- User → Budgets (One-to-Many)
- Category → Expenses (One-to-Many)
- Category → Budgets (One-to-Many)
- Category → StandardDescriptions (One-to-Many)

### 3. Serialization Layer (schemas.py)
Uses Marshmallow for:
- Request validation
- Response serialization
- Data transformation
- Nested relationship handling

### 4. Machine Learning Layer (ml_service.py)

**BudgetPredictionService Class:**
- Manages ML model lifecycle
- Prepares features from expense data
- Trains Gradient Boosting models
- Makes predictions
- Provides spending insights

**Features Extracted:**
- Time-based: day_of_week, day_of_month, month, week_of_year
- Aggregate: total_spending, avg_transaction, num_transactions
- Statistical: max, min, std of transactions
- Category-wise spending patterns

**Algorithm:**
- Gradient Boosting Regressor
- 100 estimators, learning rate 0.1
- Feature scaling with StandardScaler
- Minimum 10 records required for training

### 5. API Routes Layer

#### User Routes (user_routes.py)
- POST /users - Create user
- GET /users - Get all users
- GET /users/:id - Get user by ID
- GET /users/by-email - Get user by email
- PUT /users/:id - Update user
- DELETE /users/:id - Delete user

#### Category Routes (category_routes.py)
- GET /categories - Get all categories
- GET /categories/:id - Get category
- POST /categories - Create category
- PUT /categories/:id - Update category
- DELETE /categories/:id - Delete category
- GET /categories/:id/descriptions - Get category descriptions
- POST /descriptions - Create standard description

#### Expense Routes (expense_routes.py)
- POST /expenses - Create expense
- GET /expenses - Get expenses (with filters)
- GET /expenses/:id - Get expense by ID
- PUT /expenses/:id - Update expense
- DELETE /expenses/:id - Delete expense
- GET /expenses/summary - Get summary with charts data
- GET /expenses/stats - Get statistics

**Filters:**
- user_id (required)
- category_id
- days (15, 30, custom)
- start_date & end_date (custom range)

#### Budget Routes (budget_routes.py)
- POST /budgets - Create budget
- GET /budgets - Get budgets
- GET /budgets/:id - Get budget by ID
- PUT /budgets/:id - Update budget
- DELETE /budgets/:id - Delete budget
- GET /budgets/status - Get budget vs actual spending

**Budget Periods:**
- daily
- weekly
- monthly
- yearly

#### Prediction Routes (prediction_routes.py)
- POST /predictions/train - Train ML model
- POST /predictions/predict - Get budget prediction
- GET /predictions/history - Get prediction history
- GET /insights/spending - Get spending insights
- GET /insights/recommendations - Get AI recommendations

## 🔄 Data Flow

### Adding an Expense
```
1. User sends POST /api/expenses with JSON data
2. expense_routes.py validates required fields
3. schemas.py validates data types and constraints
4. models.py creates Expense object
5. SQLAlchemy saves to database
6. Response serialized via schemas.py
7. JSON response returned to client
```

### Getting Budget Prediction
```
1. User sends POST /api/predictions/predict
2. prediction_routes.py receives request
3. ml_service.py checks if model exists
4. If not, trains new model on user's expense data
5. Extracts features from recent expenses
6. Scales features and makes prediction
7. Saves prediction to BudgetPrediction table
8. Returns prediction with confidence score
```

### Viewing Expense Summary
```
1. User sends GET /api/expenses/summary?user_id=1&days=30
2. expense_routes.py calculates:
   - Total spending
   - Average daily spending
   - Category breakdown (for pie chart)
   - Daily breakdown (for line/bar chart)
3. Returns aggregated data
4. Frontend renders charts
```

## 🔐 Security Considerations

### Current Implementation
- Basic validation on all inputs
- SQL injection protection via SQLAlchemy ORM
- CORS enabled for cross-origin requests

### Production Recommendations
1. **Authentication**: Add JWT or OAuth
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Prevent API abuse
4. **Input Sanitization**: Additional validation layers
5. **HTTPS**: SSL/TLS encryption
6. **API Keys**: For third-party integrations

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20)
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    description VARCHAR(200),
    notes TEXT,
    date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Budgets Table
```sql
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## 🧪 Testing Strategy

### Unit Tests (Recommended to add)
```python
# test_models.py
def test_user_creation():
    user = User(username="test", email="test@example.com")
    assert user.username == "test"

# test_routes.py
def test_create_expense(client):
    response = client.post('/api/expenses', json={...})
    assert response.status_code == 201

# test_ml_service.py
def test_prediction():
    service = BudgetPredictionService()
    prediction, error = service.predict_budget(user_id=1)
    assert prediction is not None
```

### Integration Tests
- Test complete workflows
- Test error handling
- Test edge cases

### Manual Testing
- Use Postman collection
- Use populate_sample_data.py
- Test all CRUD operations

## 🚀 Performance Optimization

### Current Optimizations
- SQLAlchemy query optimization
- Indexed foreign keys
- Efficient aggregation queries

### Recommended Improvements
1. **Caching**: Redis for frequent queries
2. **Database Indexing**: Add indexes on date fields
3. **Pagination**: Limit results for large datasets
4. **Async Processing**: For ML training
5. **Connection Pooling**: For database connections

## 📈 Scalability

### Horizontal Scaling
- Stateless API design allows multiple instances
- Use load balancer (Nginx, HAProxy)
- Shared database or read replicas

### Vertical Scaling
- Upgrade server resources
- Optimize database queries
- Use caching layers

## 🛠️ Deployment Checklist

- [ ] Use production-grade WSGI server (Gunicorn)
- [ ] Set up PostgreSQL/MySQL database
- [ ] Configure environment variables
- [ ] Set up HTTPS
- [ ] Add authentication/authorization
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Add rate limiting
- [ ] Security audit

## 📚 Dependencies Explained

### Core
- **Flask 3.0.0**: Web framework
- **Flask-SQLAlchemy 3.1.1**: ORM
- **Flask-Marshmallow 0.15.0**: Serialization
- **Flask-CORS 4.0.0**: Cross-origin support

### ML
- **scikit-learn 1.3.2**: Machine learning
- **pandas 2.1.3**: Data manipulation
- **numpy 1.26.2**: Numerical computing
- **joblib 1.3.2**: Model persistence

### Utilities
- **python-dotenv 1.0.0**: Environment variables
- **python-dateutil 2.8.2**: Date parsing

## 🎯 Best Practices Implemented

1. **Separation of Concerns**: Routes, models, schemas separated
2. **RESTful Design**: Standard HTTP methods and status codes
3. **Error Handling**: Consistent error responses
4. **Code Organization**: Modular blueprint structure
5. **Documentation**: Comprehensive README and comments
6. **Sample Data**: Easy testing with provided script
7. **Configuration**: Environment-based settings

## 🔮 Future Enhancements

1. **Advanced ML Models**: Try LSTM for time-series
2. **Recurring Expenses**: Auto-detection and handling
3. **Multi-Currency**: Support different currencies
4. **Receipt OCR**: Extract expenses from images
5. **Export Data**: PDF/CSV export functionality
6. **Email Notifications**: Budget alerts
7. **Mobile App**: React Native app
8. **Social Features**: Shared budgets for families
9. **Financial Goals**: Savings targets
10. **Investment Tracking**: Portfolio management

---

**Built with ❤️ for efficient expense tracking and smart budget predictions!**
