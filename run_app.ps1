# Set execution policy for the current process to allow script running
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

Write-Host "--- LifeLine AI: Launcher ---" -ForegroundColor Cyan

# Check for virtual environment
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Green
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Initializing venv..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\Activate.ps1
}

# Install/Update dependencies
Write-Host "Verifying dependencies from requirements.txt..." -ForegroundColor Cyan
pip install -r requirements.txt

# Run the app
Write-Host "Launching LifeLine AI Demo..." -ForegroundColor Green
streamlit run app.py
