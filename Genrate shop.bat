@echo off
:: ===============================
:: Shop Rotator Menu (CHOICE-based)
:: ===============================

cd /d "%~dp0"

:: Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

:MENU
cls
echo ===========================================
echo               SHOP LOOPER
echo -------------------------------------------
echo   A basic OGFN Shop rotator made in JS,
echo            Manual and Semi auto.
echo ===========================================
echo.
echo   [0] Exit
echo   [1] Generate / Regenerate
echo.
echo -------------------------------------------
echo              Credit: Ducki67
echo -------------------------------------------
echo.

:: Use CHOICE to read one key only — no Enter needed
choice /C 01 /N /M "Select an option (0/1): "

:: CHOICE sets ERRORLEVEL according to pressed key:
:: 1 = first char (0), 2 = second char (1)
if errorlevel 2 goto REGENERATE
if errorlevel 1 goto END

goto MENU

:REGENERATE
cls
echo ===========================================
echo        Starting Shop Rotator...
echo ===========================================
call npm start

echo.
echo ===== Rotation finished =====
echo Press any key to return to the menu...
pause >nul
goto MENU

:END
exit /b
