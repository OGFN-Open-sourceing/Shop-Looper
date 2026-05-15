@echo off
title Shop-Looper Setup
setlocal

echo ==========================================
echo   Shop-Looper Dependency Setup
echo ==========================================

REM Always run from this script's directory
cd /d "%~dp0"

REM Check required tools first
where node >nul 2>nul
if errorlevel 1 (
	echo [ERROR] Node.js is not installed or not in PATH.
	echo         Install Node.js, then run this file again.
	exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
	echo [ERROR] npm is not installed or not in PATH.
	echo         Reinstall Node.js/npm, then run this file again.
	exit /b 1
)

echo.
echo [INFO] Installing project dependencies from package.json...
call npm install
if errorlevel 1 (
	echo.
	echo [ERROR] npm install failed.
	exit /b 1
)

echo.
echo [SUCCESS] Setup complete.
echo [INFO] You can now run: node index.js
exit /b 0