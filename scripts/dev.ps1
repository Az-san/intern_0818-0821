$ErrorActionPreference = 'Stop'

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ..

Write-Host "Starting backend (Flask 5001), backend (FastAPI 8000), frontend (Vite 5173), hotel-app (Next 3000)" -ForegroundColor Cyan

$backend = Start-Job -ScriptBlock {
  Set-Location "$PWD\backend"
  python -m venv venv
  . venv\Scripts\Activate.ps1
  python start_server.py
}

Start-Sleep -Seconds 1

$api = Start-Job -ScriptBlock {
  Set-Location "$PWD\backend"
  . venv\Scripts\Activate.ps1
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

Start-Sleep -Seconds 1

$frontend = Start-Job -ScriptBlock {
  Set-Location "$PWD\frontend"
  npm install --no-fund --no-audit
  npm run dev -- --host 0.0.0.0 --port 5173
}

Start-Sleep -Seconds 1

$hotel = Start-Job -ScriptBlock {
  Set-Location "$PWD\hotel-app"
  npm install --no-fund --no-audit
  npm run dev -- -H 0.0.0.0 -p 3000
}

Write-Host "Jobs started. Press Ctrl+C to stop. Use Get-Job to see status." -ForegroundColor Green
Receive-Job -Id $backend.Id -Keep
Receive-Job -Id $api.Id -Keep
Receive-Job -Id $frontend.Id -Keep
Receive-Job -Id $hotel.Id -Keep


