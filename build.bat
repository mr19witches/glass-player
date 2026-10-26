@echo off
cd /d "%~dp0"
set CSC_IDENTITY_AUTO_DISCOVERY=false
where npm >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & goto end)
call npm install || goto fail
call npm run dist || goto fail
if exist dist start "" "%~dp0dist"
goto end
:fail
echo.
echo Build failed. Read the error above.
:end
echo.
pause
