@echo off
cd /d "%~dp0"
where npm >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b)
if not exist node_modules call npm install
call npm start
if errorlevel 1 pause
