@echo off
title ISA Chat - Powered by Gemini
cd /d "%~dp0"
echo ========================================================
echo         Iniciando ISA Chat (Tipo ChatGPT)
echo ========================================================
echo.
echo Abriendo tu navegador en http://localhost:3000 ...
start http://localhost:3000
node server.js
pause
