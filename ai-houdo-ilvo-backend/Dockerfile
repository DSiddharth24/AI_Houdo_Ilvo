FROM python:3.10-slim

# Install system build dependencies and libssl for c2pa / image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency requirements
COPY requirements.txt .

# Install CPU PyTorch and other dependencies cleanly
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download/cache HuggingFace ensemble models into the Docker image layer for rapid cold starts
RUN python -c "from transformers import AutoImageProcessor, AutoModelForImageClassification; \
    models = ['umm-maybe/AI-image-detector', 'Organika/sdxl-detector', 'Ateeqq/ai-vs-human-generated-image-detection']; \
    [ (AutoImageProcessor.from_pretrained(m), AutoModelForImageClassification.from_pretrained(m)) for m in models ]" || true

# Copy application source code
COPY . .

# Expose FastAPI service port
EXPOSE 8000

ENV PORT=8000 \
    PYTHONUNBUFFERED=1 \
    TRANSFORMERS_OFFLINE=0

# Launch Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
