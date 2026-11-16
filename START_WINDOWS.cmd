@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required: https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\express" (
  echo Installing packages...
  call npm.cmd install
  if errorlevel 1 (pause & exit /b 1)
)
echo Opening the local application at http://localhost:3000
call npm.cmd start
pause
