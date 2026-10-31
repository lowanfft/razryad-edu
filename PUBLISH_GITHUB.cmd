@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo =============================================
echo  РАЗРЯД — публикация в GitHub
 echo =============================================
where git >nul 2>&1
if errorlevel 1 (
  echo Git for Windows не найден: https://git-scm.com/downloads/win
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 git init

git add -A
if errorlevel 1 goto failure

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Publish Razryad educational site (GitHub Pages)"
  if errorlevel 1 (
    echo Для коммита может потребоваться настроить user.name и user.email.
    pause
    exit /b 1
  )
)
git branch -M main

git remote get-url origin >nul 2>&1
if errorlevel 1 git remote add origin https://github.com/lowanfft/razryad-edu.git

echo Загружаем в GitHub...
git push -u origin main
if errorlevel 1 goto failure

echo.
echo Готово. Репозиторий: https://github.com/lowanfft/razryad-edu
echo Теперь включите Pages: Settings ^> Pages ^> main ^> /(root)
pause
exit /b 0
:failure
echo Не получилось отправить файлы. Проверьте ошибку выше.
pause
exit /b 1
