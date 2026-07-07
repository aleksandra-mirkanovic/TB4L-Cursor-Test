@echo off
cd /d "%~dp0"

echo.
echo  TB4L Demo Site
echo  ==============
echo  URL: http://localhost:5500
echo.

REM If server is already running, just open the browser
netstat -ano | findstr ":5500" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo  Server already running — opening browser...
  start http://localhost:5500
  echo.
  pause
  exit /b 0
)

echo  Keep this window open while you use the site.
echo  Press Ctrl+C to stop the server.
echo.

start http://localhost:5500
py -m http.server 5500
if errorlevel 1 (
  echo.
  echo  Could not start server. Is Python installed?
  echo  Try: py --version
  echo.
)

pause
