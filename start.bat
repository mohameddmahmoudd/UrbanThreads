@echo off
echo ----------------------------------------
echo   UrbanThreads - Starting the app...
echo ----------------------------------------
echo.

REM Check if Docker Desktop is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running.
    echo Please open Docker Desktop and wait for it to finish starting, then try again.
    echo.
    pause
    exit /b 1
)

echo Docker is running. Building and starting services...
echo (This may take several minutes the first time)
echo.

REM Start all services in detached mode
docker compose --env-file .env.docker up --build -d

echo.
echo Waiting for the app to be ready...

REM Wait until the backend signals it is fully up
:wait
docker compose --env-file .env.docker logs 2>nul | findstr "Backend running" > nul
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak > nul
    goto wait
)

echo.
echo App is ready! Opening in your browser...
start http://localhost:3000
echo.
echo If the browser did not open, navigate to: http://localhost:3000
echo.
echo To stop the app, double-click stop.bat
echo.
pause
