@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "CMD_NAME=oc-hesap"
set "JS_PATH=%SCRIPT_DIR%index.js"

echo --------------------------------------------------
echo [%CMD_NAME%] Setup Wizard
echo --------------------------------------------------

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please install Node.js from https://nodejs.org/ first.
    pause
    exit /b 1
)

echo [+] Node.js detected.
echo [+] Creating launcher...

:: Create the .cmd file
(
echo @echo off
echo node "%JS_PATH%" %%*
) > "%SCRIPT_DIR%%CMD_NAME%.cmd"

echo [+] Adding folder to User PATH...
:: Use PowerShell to safely add to PATH without truncation risks
powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';%SCRIPT_DIR%', 'User')"

echo.
echo --------------------------------------------------
echo SUCCESS! [%CMD_NAME%] is now installed.
echo --------------------------------------------------
echo 1. Close this terminal.
echo 2. Open a NEW terminal (Command Prompt or PowerShell).
echo 3. Type '%CMD_NAME%' to start.
echo --------------------------------------------------
echo.
pause
