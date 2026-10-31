@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js не найден. Установите Node.js 22.5 или новее с https://nodejs.org/
    pause
    exit /b 1
)
echo.
echo ==================================================
echo   РАЗРЯД — интерактивный урок по информатике
 echo ==================================================
echo   Адрес сайта: http://localhost:3000
echo   Статистика: http://localhost:3000/admin.html
echo   Чтобы остановить сервер: Ctrl+C
 echo ==================================================
echo.
node server.js
pause
