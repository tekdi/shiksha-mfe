FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for PyMuPDF and python-pptx
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ./app ./app

# Expose port
EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
