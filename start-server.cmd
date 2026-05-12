@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" (
    set "NODE_EXE=C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
  ) else if exist "C:\Program Files\Common Files\Adobe\Creative Cloud Libraries\libs\node.exe" (
    set "NODE_EXE=C:\Program Files\Common Files\Adobe\Creative Cloud Libraries\libs\node.exe"
  ) else if exist "C:\Program Files\Adobe\Adobe Photoshop 2025\node.exe" (
    set "NODE_EXE=C:\Program Files\Adobe\Adobe Photoshop 2025\node.exe"
  ) else (
    echo Node.js was not found. Install Node.js or add it to PATH.
    pause
    exit /b 1
  )
)

if "%PORT%"=="" (
  echo Starting BridgeWork Report at http://localhost:3000/
) else (
  echo Starting BridgeWork Report at http://localhost:%PORT%/
)
"%NODE_EXE%" server.js
pause
