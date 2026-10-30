@echo off
rem Reconstruye la extension del panel lateral desde index.html.
cd /d "%~dp0"
python construir_extension.py
echo.
pause
