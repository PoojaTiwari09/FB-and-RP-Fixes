@echo off
echo ==============================================
echo   M6 AI Forecasting - Seed and Data Refresh
echo ==============================================
echo.
echo Executing the seed script to wipe all manually created data 
echo and restore the database to its clean seed state...
echo.

cd "c:\Users\Relanto\Desktop\M6_final\boilerplate code\r-revenue-intelligence\apps\api"
call npx ts-node ../../modules/m06-forecasting-prediction/seeds/historical-seed.ts

echo.
echo ==============================================
echo   Done! Your database has been refreshed.
echo ==============================================
pause
