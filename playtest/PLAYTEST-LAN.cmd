@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is not on PATH. Install Node.js 24, then retry.
  pause
  exit /b 1
)
node tools\verify.mjs
if errorlevel 1 (
  echo ERROR: Playtest verification failed. The server was not started.
  pause
  exit /b 1
)
set "ST_MODE=production"
set "ST_BIND=0.0.0.0"
set "PORT=3212"
set "ST_PUBLIC_ORIGIN="
set "ST_SECURE_COOKIES="
set "LAN_BIND="
node tools\playtest.mjs --lan
if errorlevel 1 echo ERROR: Playtest could not start or stopped unexpectedly. See the message above.
pause
