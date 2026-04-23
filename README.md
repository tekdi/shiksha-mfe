
# 📘 LMS AI Content, Assessment & Micro-Learning Engine

## 🧾 Project Description
This project delivers a **pluggable, open-source-first AI microservice platform** for a multi-tenant SaaS LMS.

It automates the full educational content lifecycle:
- PDF, PPT, Video, Audio ingestion
- AI processing using local models
- Output as interactive micro-learning content

### 🔑 Key Highlights
- Fully **local AI (Llama 3, Mistral, Whisper)**
- No dependency on external APIs
- Output formats: **HTML5, H5P, SCORM**
- LMS compatible (Moodle, Open edX)

---

## 🧩 Modules

### Module A — Intelligent Document Ingestion
- PDF / PPT parsing
- Structured JSON output
- Key Takeaways & Glossary
- Narration scripts

### Module B — Automated Assessment Suite
- MCQ generation
- Match-the-Pair
- Fill-in-the-Blanks
- H5P & SCORM packaging

### Module C — Multimedia Intelligence
- Whisper transcription
- Speaker diarisation
- Auto-chaptering
- Interactive video generation

### Module D — AI Micro-Learning Studio
- HTML5 / H5P / SCORM lessons
- Branding support
- Human-in-the-loop (HITL) review

---

## 🎯 Goals

1. Fully automated content lifecycle
2. Local LLM-based generation
3. LMS-ready outputs
4. Fast processing (<10 min per lesson)

---

## 🚀 Mid-Point Milestone (Week 6)

### ✅ Completed
- Module A: Fully operational
- Module B: MCQ + H5P working
- Module C: Whisper transcription + VTT
- LLM Gateway (Ollama) live
- Async queue (Redis/Celery) operational

---

## ⚙️ Setup / Installation

### Prerequisites
- Docker
- Docker Compose
- Node.js 20+
- Python 3.11+

### Steps
```sh
docker compose up -d
````

### Services

* API Gateway: [http://localhost:8000](http://localhost:8000)
* UI Builder: [http://localhost:3000](http://localhost:3000)

---

## 📦 Expected Outcome

* Fully deployable AI platform
* Micro-lesson generation in < 10 minutes
* Local inference only (no external API)
* WCAG 2.1 AA compliant content
* xAPI tracking enabled

---

## ✅ Acceptance Criteria

### Module A

* JSON extraction from PDF/PPT
* Key Takeaways + Glossary
* ≤ 30 sec processing

### Module B

* Accurate quiz generation (no hallucination)
* SCORM + H5P compatibility
* Works with Moodle & Open edX

### Module C

* Whisper transcription
* Speaker labels
* Chapter markers
* Interactive video packaging

### Module D

* Multi-format lesson generation
* Branding support
* HITL approval workflow
* ≤ 2 min generation time

---

## 🏗️ Implementation Details

### Architecture

* Microservices (Docker / Kubernetes)

### Services

* Ingestion: Python (PyMuPDF, python-pptx)
* LLM Gateway: FastAPI + Ollama
* Assessment: H5P + SCORM
* Multimedia: Whisper + pyannote
* UI Builder: Node.js + Reveal.js
* Queue: Redis + Celery
* DB: PostgreSQL

### AI Stack

* LLM: Llama 3, Mistral
* Transcription: Whisper
* Embeddings: nomic-embed-text
* Diagrams: Mermaid.js

---

## 🖥️ Host Apps

### Teachers

```sh
nx dev teachers --port=3001 --verbose
```

### Admin

```sh
nx dev admin-app-repo --port=3002 --verbose
```

### Learner

```sh
nx dev learner-web-app --port=3003 --verbose
```

---

## 🧱 Micro Frontends

| App                 | Port | Base Path         |
| ------------------- | ---- | ----------------- |
| authentication      | 4101 | /authentication   |
| scp-teacher-repo    | 4102 | /scp-teacher-repo |
| youthNet            | 4103 | /youthnet         |
| workspace           | 4104 | /workspace        |
| notification        | 4105 | /                 |
| players (admin)     | 4106 | /                 |
| players (teacher)   | 4107 | /                 |
| players (learner)   | 4108 | /                 |
| forget-password     | 4109 | /                 |
| login               | 4110 | /                 |
| profile-manage      | 4111 | /                 |
| survey-observations | 4112 | /                 |
| content             | 4113 | /mfe_content      |

---

## 🛠️ NX Commands

### View Graph

```sh
nx graph
```

### Build All

```sh
npx nx run-many --target=build --all
```

### Install NX

```sh
npm install -g nx
```

---

## 📌 Notes

### Use Shared Library

```js
import { SharedLib } from '@shared-lib';
```

### Docker Command

```sh
docker-compose -f docker-compose.admin-app-repo.yml up -d --force-recreate --no-deps
```

---

## 🏢 Organisation

**Tekdi Technologies Pvt. Ltd.**

## 🧑‍🏫 Mentors

* [Siddhi Shinde](https://github.com/siddhishinde0723)
* [Dnyanesh Kulkarni](https://github.com/dnyaneshkulkarni-sudo) 

## 🧠 Domain

EdTech / LMS / AI / Open Source

## 🛠️ Skills Required

* Python
* Node.js
* FastAPI
* React
* Ollama
* Whisper
* H5P / SCORM
* Redis
* PostgreSQL
* Docker


