#!/bin/bash
set -e

echo "=== Setting up EcoSort Environment on Codespaces ==="

# Install Python requirements with CPU-optimized PyTorch
pip install --no-cache-dir -r backend/requirements.txt

# Install Frontend dependencies
cd frontend
npm ci
cd ..

echo "=== EcoSort Codespaces Setup Complete ==="
echo "To start both servers, run: npm run dev in frontend and uvicorn main:app in backend"
