@echo off
echo Starting Car Douane Application...
echo.

echo Starting Backend (Django)...
cd backend
start "Django Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"
cd ..

echo.
echo Starting Frontend (React)...
cd frontend
start "React Frontend" cmd /k "npm start"
cd ..

echo.
echo Both servers are starting...
echo.
echo Backend will be available at:
echo   - Local: http://localhost:8000
echo   - Network: http://%COMPUTERNAME%:8000 (or your IP address)
echo.
echo Frontend will be available at:
echo   - Local: http://localhost:3000
echo   - Network: http://%COMPUTERNAME%:3000 (or your IP address)
echo.
echo Press any key to exit...
pause > nul
