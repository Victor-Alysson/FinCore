@echo off
start "Back-end" cmd /k "cd FinCore/Fincore-backend && venv\Scripts\activate && uvicorn main:app --reload-exclude venv"
start "Front-end" cmd /k "cd FinCore/Fincore-frontend && npm run dev"