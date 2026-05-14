# Shiksha MFE - DMP 2026 Environment Setup Guide

This document outlines the complete local environment setup required to run the DMP 2026 AI Micro-Learning Platform architecture.

## 1. Prerequisites
Ensure the following are installed on your host machine:
- **Docker** & **Docker Compose**
- **Node.js 20+** (Recommend using `nvm`)
- **Python 3.11+** (For AI Gateway microservices)
- **Nx CLI** (`npm install -g nx`)

## 2. Infrastructure Orchestration

The platform relies on three core infrastructure services:
1. **PostgreSQL:** Backs the Tenant Configuration and user persistence.
2. **Redis:** Message queue for asynchronous Celery/BullMQ workers (video rendering, ingestion).
3. **Ollama:** Local AI inference engine hosting Llama 3 and Mistral.

### Starting the Infrastructure
From the repository root, execute:
```bash
docker compose up -d
```

Verify that all three containers are healthy:
```bash
docker ps
```

### Initializing the AI Models
By default, the Ollama container is empty. You must pull the required open-source models:
```bash
# Enter the Ollama container
docker exec -it shiksha_ollama /bin/bash

# Pull the models
ollama pull llama3
ollama pull mistral
```

## 3. Environment Configuration

Copy the sample environment template:
```bash
cp .env.sample .env
```

Ensure the following critical variables are present, especially `NEXT_PUBLIC_TENANT_ID`, to prevent UI login crashes:

```env
NEXT_PUBLIC_TENANT_ID=default_tenant_01
NEXT_PUBLIC_FRAMEWORK_ID=default_framework_01
NEXT_PUBLIC_TELEMETRY_URL=http://localhost:8000
NEXT_PUBLIC_CLOUD_STORAGE_URL=http://localhost:8000/assets
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
OLLAMA_API_URL=http://localhost:11434
```

## 4. Bootstrapping the Monorepo

The Nx workspace houses several Micro-Frontends (MFEs) and host applications.

1. **Install dependencies** (use legacy peer deps due to strict MUI resolution):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run a full workspace build** (recommended on first clone):
   ```bash
   npx nx run-many --target=build --all
   ```

## 5. Starting the Host Applications

The UI is divided into role-based host applications:

**Learner App:**
```bash
nx dev learner-web-app --port=3003
```

**Teacher App:**
```bash
nx dev teachers --port=3001
```

**Admin App:**
```bash
nx dev admin-app-repo --port=3002
```

## Troubleshooting
- **Invalid Rewrites Error:** Ensure `.env` is loaded. The `next.config.js` rewrites will fail if telemetry URLs are undefined.
- **Services Directory Casing:** If building on Linux/Vercel, ensure you do not rename `services` back to `Services` as it breaks strict case-sensitive module resolution.
- **Missing @mui/system:** If `/explore` crashes, ensure `@mui/system` is installed as it is a required peer dependency for the date pickers.
