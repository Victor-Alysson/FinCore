@echo off
start "Back-end" cmd /k "cd FinCore/Fincore-backend && venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload-exclude venv"
start "Front-end" cmd /k "cd FinCore/Fincore-frontend && npm run dev"