@echo off
echo ============================================
echo   Smart Expense Tracker - Quick Setup
echo ============================================
echo.

echo Step 1: Setting up Backend...
cd backend
echo Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat
echo Installing dependencies...
pip install --upgrade pip
pip install flask flask-cors flask-sqlalchemy marshmallow==3.20.1 flask-marshmallow==1.2.0 marshmallow-sqlalchemy==1.0.0 python-dotenv scikit-learn pandas numpy joblib python-dateutil werkzeug requests
echo.
echo Backend setup complete!
echo.

echo Step 2: Setting up Frontend...
cd ..\frontend
echo Installing dependencies...
call npm install
echo.
echo Frontend setup complete!
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start the application:
echo.
echo 1. Backend:
echo    cd backend
echo    venv\Scripts\activate
echo    python app.py
echo.
echo 2. Frontend (in new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open browser: http://localhost:3000
echo.
echo ============================================
pause
