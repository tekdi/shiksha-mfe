# Swadhaar Admin Application (`swadhaar-admin-repo`)

Centralized administrative portal for Swadhaar FinAccess operations, managing regional training centers, batches, CFL/DI trainers, and learner progression through Swadhaar training modules.

## Architecture: 100% Standalone (No MFEs / No Workspace)

Swadhaar Admin operates as a **completely standalone Next.js application** that does **NOT** rely on Sunbird Workspace, generic editors, question-set editors, or external player MFEs:
- **Create Content In-App:**
  - **PDFs:** Native upload & metadata form (`/content/create-pdf`).
  - **Videos:** Native YouTube URL / MP4 upload form (`/content/create-video`).
  - **Assessments:** Built-in interactive quiz and question bank builder (`/content/create-assessment` and `/content/assessments/[id]`).
- **View & Play In-App:**
  - **PDFs:** Native embedded in-app viewer with toolbar, new window preview, and download options.
  - **Videos:** Native HTML5 / YouTube embed player with duration, language, and metadata display.
  - **Assessments:** Native interactive evaluator supporting both **Answer Key Mode** and **Interactive Test Mode**.

## Tenant Configuration

- **Tenant Name:** Swadhaar FinAccess
- **Tenant ID:** `35529b5d-526f-4da5-bc6e-64f740023d26`
- **Channel ID:** `swadhaar-channel`
- **Content Framework:** `swadhaar-framework`
- **Collection Framework:** `swadhaar-framework`
- **Academic Year ID:** `edf1d200-21d8-417e-b844-1d04f92435f4`

## Environment Variables

Set these per environment (`.env` locally, deployment config otherwise). Several have **QA fallbacks**
in code (`src/utils/API/APIEndpoints.ts`, `src/utils/API/aspireHeaders.ts`), so a missing value in
production silently points the app at QA — always set them explicitly outside local development.

| Variable | Purpose | Code fallback |
| --- | --- | --- |
| `NEXT_PUBLIC_MIDDLEWARE_URL` | Shiksha middleware base URL | `https://interface.tekdinext.com/interface/v1` |
| `NEXT_PUBLIC_LMS_SERVICE_URL` | Aspire LMS service (courses, modules, hierarchy) | QA (`middleware-qa.aspireleaders.org`) |
| `NEXT_PUBLIC_USER_LIST_URL` | Aspire user list API | QA |
| `NEXT_PUBLIC_USER_READ_URL` | Aspire user read API | QA |
| `NEXT_PUBLIC_COHORT_SEARCH_URL` | Aspire cohort search API | QA |
| `NEXT_PUBLIC_COHORT_MEMBER_APPLICATION_URL` | Aspire cohort member list API | QA |
| `NEXT_PUBLIC_ASPIRE_BEARER_TOKEN` | Optional default Aspire token (otherwise taken from login) | empty |
| `NEXT_PUBLIC_TENANT_ID` | Aspire `tenantid` header | QA tenant ID |
| `NEXT_PUBLIC_ORG_ID` | Aspire `organisationid` header | QA organisation ID |
| `NEXT_PUBLIC_ACADEMIC_YEAR_ID` | Aspire `academicyearid` header | QA academic year ID |
| `NEXT_PUBLIC_TELEMETRY_URL` | Telemetry proxy target (`next.config.mjs` rewrites) | `https://telemetry.tekdinext.com` |
| `CLOUD_STORAGE_URL` | Optional public asset proxy (`/assets/public/*`) | not set (rewrite disabled) |

## Features

- **Branding & Theming:** Swadhaar brand palette featuring Primary `#E6873C` and Dark Navy `#1C2B4A`.
- **Localization:** Supports English (`en`), Marathi (`mr`), and Hindi (`hi`).
- **Dashboard:** Real-time metrics on learners, trainers, centers, and batch completion rates.
- **Center & Batch Management:** Track and monitor centers and ongoing batches.
- **Learner & Trainer Rosters:** Filter and manage user progression through Swadhaar levels.
- **Content Library:** In-app creation and viewing for videos, PDFs, and assessments.
- **Reports:** Export training summaries and certification records.

## Running Locally

Run via Nx from the workspace root:

```bash
# Start development server (Port 3004)
npx nx dev swadhaar-admin-repo

# Build production bundle
npx nx build swadhaar-admin-repo

# Start production server
npx nx start swadhaar-admin-repo
```

Or using npm scripts:

```bash
npm run dev:swadhaar-admin
npm run build:swadhaar-admin
```

## Docker & PM2 Support

- Dockerfile: `Dockerfile.swadhaar-admin-repo` (Builds only `swadhaar-admin-repo`)
- Docker Compose: `docker-compose.swadhaar-admin-repo.yml` (Exposes port `3004`)
- PM2 Ecosystem: `ecosystem.swadhaar-admin-repo.config.js` (Manages only `swadhaar-admin-repo`)
