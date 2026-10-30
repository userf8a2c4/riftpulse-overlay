@echo off
rem Abre "RiftPulse" en http://localhost:8765 para que el navegador le dé permisos propios
rem (algunos los piden al servir la página en localhost). Cierre esta ventana para apagarla.
cd /d "%~dp0"
start "" http://localhost:8765/
python -m http.server 8765 --bind 127.0.0.1
