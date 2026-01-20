@echo off
title Softale Studio
echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║         SOFTALE STUDIO - Local Mode       ║
echo  ║         Content Creation Pipeline         ║
echo  ╚═══════════════════════════════════════════╝
echo.
echo  Starting development server...
echo  Browser will open automatically.
echo.
echo  Press Ctrl+C to stop the server.
echo.

cd /d "%~dp0"

:: Wait 3 seconds then open browser
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000/admin/factory"

:: Start the dev server (this keeps running)
npm run dev
