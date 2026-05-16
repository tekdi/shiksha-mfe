FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/* && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

ENV PATH="/home/appuser/.local/bin:${PATH}"

COPY app ./app
# Enforce read-only permissions for the application code
RUN chown -R root:root . && chmod -R 555 .

# Ensure storage directories exist and are writable by appuser
RUN mkdir -p storage/artifacts storage/temp && \
    chown -R appuser:appuser storage && \
    chmod -R 700 storage

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
