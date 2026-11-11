
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


docker-compose -f docker-compose.admin-app-repo.yml up -d --force-recreate --no-deps

----

## Feature: Short Video Reel

### acceptance criteria and Steps for Implementation for feature short video

acceptance criteria
@Assignee to update this section:
Assignee to mark completed criteria as [x] = done eg.
- [x]

----

*A. Business value wise*
# [x] Users can view a vertical feed of short educational videos (Science/Math focus).
# [x] Users can engage with videos via Like (heart) and Share functionality.
# [x] Users are challenged with a "Quiz" or "Assessment" if a video is "locked" or after watching.
# [x] Passing an assessment unlocks the next video in the series (Gamification).
# [x] Progress (unlocked videos) is persisted for the user.
# [x] Design mimics popular social media apps (TikTok/Reels) for familiarity and engagement.

*B. Unit tests*
# [ ] Verify `ShortVideoReel` renders safely with empty or mock data.
# [ ] Test `handleScroll` logic to correctly identify the active video index.
# [ ] Test `AssessmentModal` submission logic (calculating score, showing success/failure).
# [ ] Test interaction handlers: `togglePlay`, `toggleMute`, `handleLike`.
# [ ] Verify that locked videos show the lock overlay and prevent playback.

*C. UI tests (what should look how across browsers)*
# [ ] Verify vertical scroll snap behavior works smoothly on mobile and desktop.
# [ ] Ensure video aspect ratio (contain/cover) looks good on different screen sizes.
# [ ] Check that overlay icons (Like, Share, Play) are visible against dark/light video backgrounds.
# [ ] Verify Assessment Modal is responsive and centers correctly on mobile.
# [ ] Ensure the bottom info section (Title, Author, Tags) is legible.

*D. Integration tests*
# [ ] Verify integration with the Dashboard tabs (switching tabs loads/unloads component).
# [ ] Test tracking of "Likes" (optimistic UI update + API call).
# [ ] Test the "Unlock" flow: Watch Video 1 -> Pass Quiz -> Video 2 User Interface updates unlock status.
# [ ] Validate that `MOCK_VIDEOS` can be replaced with an API response without breaking the UI.

*E. Impact tests*
# [ ] Measure page load performance when `ShortVideo` tab is initialized (lazy loading).
# [ ] Monitor memory usage with multiple videos in the DOM (ensure `video` elements are paused/unmounted if needed).
# [ ] Check for interactions with other audio sources (e.g. background music).

*F. Data Related tests*
# [ ] Verify video URLs are accessible and stream correctly (CDN/S3).
# [ ] Ensure question data structures match the `AssessmentModal` requirements (options, correct answer index).
# [ ] Test handling of malformed video metadata (missing title, missing poster).

*G. Security tests*
# [ ] Ensure video URLs are served over HTTPS.
# [ ] Validate that assessment scores cannot be easily spoofed client-side (future API validation).
# [ ] Sanitize any user input if comments are added later.

*H. Exception scenarios (negative test cases)*
# [ ] Handle network failure when loading a video (show error placeholder).
# [ ] Handle case where assessment data is missing for a video (fallback behavior).
# [ ] Handle rapid scrolling (debounce active video detection).


Steps for Implementation 
@Assignee to update this section:
Assignee to mark completed criteria as [x] = done eg.

- [x]

---

*1. Understand & Analyze*

- [x] Clarify requirements & acceptance criteria.  
- [x] Identify affected layers:  
-- UI: `ShortVideoReel.tsx`, `AssessmentModal.tsx`, `VideoCard` component.  
-- Functional: Video playback control, Scroll detection, Assessment logic, Local state management (likes, unlocks).  
-- API: Future need for `/api/short-videos` and `/api/user/progress`.  
-- DB: Schema for `ShortVideo` (id, url, metadata, questions) and `UserVideoProgress` (userId, videoId, status).  

---

*2. Design & Plan*

- [x] Outline solution approach (UI structure, API contracts, DB changes).  
- [x] Break down into sub-tasks.  
- [x] Draft pseudo-code/diagrams if useful (Mock data structure already defined).  

---

*3. Implement*

- **DB Layer** (Proposed)

- [ ] Add/modify schema/migrations: Create `ShortVideo` table and `UserProgress` table.
- [ ] Update queries/ORM models.  
- [ ] Validate backward compatibility.  

- **API Layer** (Proposed)
- [ ] Create/modify endpoint(s): `GET /short-videos`, `POST /short-videos/:id/like`, `POST /short-videos/:id/unlock`.
- [ ] Define request/response schema.  
- [ ] Apply authentication/authorization rules.  

- **UI Layer**  

- [x] Build/modify components: `ShortVideoReel.tsx` (Core logic implemented).
- [x] Build/modify components: `AssessmentModal.tsx` (Quiz logic implemented).
- [x] Apply styling & responsiveness (MUI sx prop used for mobile-first design).
- [ ] Connect to state management / form validations (Currently using local state `useState`).  

- **Functional Layer**  

- [x] Implement logic: Scroll snap, Auto-play/Pause, Assessment validation.
- [ ] Add error handling & logging (Basic console logs present).  
- [ ] Ensure reusable and modular code (Extracted `VideoCard` component).  

---

*4. Test*

- [ ] Unit tests for core logic.  
- [ ] Integration tests (API + DB).  
- [ ] UI testing (manual/automated).  
- [ ] Validate edge cases & error scenarios.  

---

*5. Review & Deliver*

- [ ] Refactor for clarity & performance.  
- [ ] Peer review completed.  
- [ ] Documentation updated (README, API docs, DB schema).  
- [ ] Commit, push, and raise PR.  
- [ ] Deploy to staging -> verify -> release to production.
