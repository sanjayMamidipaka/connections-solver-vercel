# --- STAGE 1: Builder ---
# We use a full python image to install and compile dependencies
FROM python:3.11-slim as builder

WORKDIR /build

# 1. Install system dependencies needed for some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy only requirements to leverage Docker cache
COPY backend/requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt


# --- STAGE 2: Runtime ---
# We use a fresh, slim image for the actual running app to keep it lightweight
FROM python:3.11-slim

# Set environment variables for Python performance
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/code

WORKDIR /code

# 3. Create a non-root user (Security Best Practice for 2026)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 4. Copy installed dependencies from the builder stage
COPY --from=builder /root/.local /home/user/.local

# 5. Copy ONLY the backend code
# This ensures changes to the /frontend don't trigger a backend rebuild
COPY --chown=user:user backend/app ./app

# Hugging Face default port
EXPOSE 7860

# 6. Start the FastAPI server using the modular path
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]