# Setup and Installation Guide

## LMS AI Content, Assessment & Micro-Learning Engine

This document provides instructions on how to set up the multi-tenant SaaS LMS AI platform, which runs entirely on locally-hosted models (Llama 3, Mistral, Whisper) ensuring zero dependency on external cloud APIs.

### Prerequisites
- **Docker** and **Docker Compose**
- **Node.js** 20+
- **Python** 3.11+
- At least 16GB RAM for running local LLMs (Ollama) smoothly.

### Step 1: Clone the repository
```bash
git clone https://github.com/tekdi/shiksha-mfe.git
cd shiksha-mfe
```

### Step 2: Start the AI Microservices
The project uses Docker Compose to orchestrate the AI Gateway, Ollama (for Llama 3 / Mistral inference), and Redis (for task queues).

```bash
docker compose up -d
```

This will spin up:
1. **Ollama Service** (Port 11434): Starts automatically. You will need to pull the desired models:
   ```bash
   docker exec -it shiksha-mfe-ollama-1 ollama run llama3
   ```
2. **Redis** (Port 6379): Used as a message broker for async tasks (Module C transcription, etc).
3. **AI Gateway (FastAPI)** (Port 8000): The main entry point for Module A, B, C requests.

### Step 3: Start the Micro-Frontends (MFEs)
The frontend uses Nx workspace. To run the Learner, Teacher, or Admin apps:

```bash
npm install

# Start Learner App
nx dev learner-web-app --port=3003

# Start Teacher App
nx dev teachers --port=3001

# Start Admin App
nx dev admin-app-repo --port=3002
```

### Step 4: Access the System
- **API Gateway**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI for AI modules)
- **UI Builder**: [http://localhost:3000](http://localhost:3000)

### Supported Local AI Models
- **Text Generation (Module A & B)**: `llama3`, `mistral` via Ollama.
- **Audio/Video Transcription (Module C)**: `whisper-large-v3` (Downloaded on first transcription request).
- **Embeddings**: `nomic-embed-text`.

### Troubleshooting
- **Ollama Timeout**: If the AI Gateway returns a 503, ensure that Ollama has successfully downloaded the model by running `ollama list` inside the container.
- **Queue Issues**: Check the Redis logs if document processing is stuck in a queued state: `docker compose logs redis`.
