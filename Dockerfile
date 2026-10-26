# Multi-stage Dockerfile for EcoSort Full-Stack Application

# --- STAGE 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- STAGE 2: Python Backend & Production Runtime ---
FROM python:3.9-slim AS runner
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Source & Models
COPY backend/app ./backend/app
COPY backend/data ./backend/data

# Copy Compiled Frontend static assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV MODEL_WEIGHTS_PATH="backend/data/models/mobilenetv3_ecosort.pt"
ENV EVAL_REPORT_PATH="backend/data/models/evaluation_report.json"
ENV PYTHONPATH=/app/backend

EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
