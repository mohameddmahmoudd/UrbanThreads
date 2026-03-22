@echo off
echo ----------------------------------------
echo   UrbanThreads - Stopping the app...
echo ----------------------------------------
echo.

docker compose --env-file .env.docker down

echo.
echo App stopped. You can close this window.
echo.
pause
