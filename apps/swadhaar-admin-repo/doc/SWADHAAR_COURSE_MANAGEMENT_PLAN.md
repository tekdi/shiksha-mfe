# Swadhaar LMS Admin - Course Management Implementation Plan

This document outlines the architecture, data models, API integration, and UX design implementation for the **Courses List** and **Course Structure Details** views in the **Swadhaar LMS Admin Portal**, strictly aligned with the `Swadhaar_Admin_Prototype (2).html` wireframe specification (`#scr-content` and `#scr-coursebuilder`) and the Swadhaar design system.

---

## 1. Architectural Overview

```mermaid
graph TD
    A[Sidebar Navigation: Learning → Courses] --> B[/content/courses: CoursesPage]
    B --> C[Composite Search API: /action/composite/v3/search]
    C --> D[SwadhaarDataTable: Course, Sections, Duration, Language, Status, Updated, Actions]
    D -->|Click Course Name or Arrow Action| E[/content/courses/[id]: CourseDetailsPage]
    E --> F[Content Hierarchy API: /action/content/v3/hierarchy/:doId]
    F --> G1[Left 2/3: Ordered Sections 1.1–1.4 & Course-level items]
    F --> G2[Right 1/3: Publishing & Used in learning paths cards]
```

### Key Files in `apps/swadhaar-admin-repo`
1. [`src/utils/API/APIEndpoints.ts`](file:///home/ttpl-rt-151/Documents/Documents/Shikshav/Shiksha-mfe/new%20learner%20app/shiksha-mfe/apps/swadhaar-admin-repo/src/utils/API/APIEndpoints.ts) — API route registry including `compositeSearch` and `contentHierarchy`.
2. [`src/services/CourseService.ts`](file:///home/ttpl-rt-151/Documents/Documents/Shikshav/Shiksha-mfe/new%20learner%20app/shiksha-mfe/apps/swadhaar-admin-repo/src/services/CourseService.ts) — Service layer encapsulating composite search, hierarchy retrieval, course name parsing, duration parsing, and language detection.
3. [`src/pages/content/courses/index.tsx`](file:///home/ttpl-rt-151/Documents/Documents/Shikshav/Shiksha-mfe/new%20learner%20app/shiksha-mfe/apps/swadhaar-admin-repo/src/pages/content/courses/index.tsx) — Courses listing table matching `#scr-content`.
4. [`src/pages/content/courses/[id].tsx`](file:///home/ttpl-rt-151/Documents/Documents/Shikshav/Shiksha-mfe/new%20learner%20app/shiksha-mfe/apps/swadhaar-admin-repo/src/pages/content/courses/%5Bid%5D.tsx) — Course structure details view matching `#scr-coursebuilder`.
5. [`src/components/common/LifecycleChip.tsx`](file:///home/ttpl-rt-151/Documents/Documents/Shikshav/Shiksha-mfe/new%20learner%20app/shiksha-mfe/apps/swadhaar-admin-repo/src/components/common/LifecycleChip.tsx) — Chip status component mapping Sunbird states (`Live`, `Draft`, etc.) to Swadhaar badges.

---

## 2. Swadhaar Design System & Tokens

The implementation strictly uses the Swadhaar Brand Theme:

| Token / Element | Value | Usage |
|---|---|---|
| **Primary Brand Orange** | `#E6873C` (Hover: `#C66C23`) | Primary CTA buttons ("Create course", "Publish changes"), highlights |
| **Secondary Brand Navy** | `#1C2B4A` | Dark accents, branding bars, headers |
| **Canvas Background** | `#F4F3EF` / `#F5F5F5` | Page background canvas (from prototype wireframe) |
| **Card / Surface Background** | `#FFFFFF` | Table, section cards, dialogs, cards |
| **Borders** | `1px solid #D6D3CC` / `#ECEAE5` | Table boundaries, section borders, card dividers |
| **Text Primary** | `#1F1E1C` / `#1F2937` | Headings, course titles, bold labels |
| **Text Secondary / Muted** | `#6B6862` / `#4D4639` | Subtitles, duration notes, breadcrumbs |
| **Status Published / Live** | `#DCFCE7` (Text: `#15803D`, Border: `#86EFAC`) | "Published" / "Live" chip |
| **Status Draft** | `#FEF3C7` (Text: `#92400E`, Border: `#D97706`) | "Draft" chip |
| **Spec / Doc Badge** | `#E0E7FF` (Text: `#1E3A8A`) | "BRD §6", "BRD §6.2 · course doc" pill badge |

---

## 3. Data Integration: Sunbird Composite Search API

### Request Contract
- **Endpoint**: `POST https://interface.tekdinext.com/interface/v1/action/composite/v3/search`
- **Headers**:
  ```http
  academicyearid: edf1d200-21d8-417e-b844-1d04f92435f4
  tenantid: 35529b5d-526f-4da5-bc6e-64f740023d26
  content-type: application/json
  Authorization: Bearer <token>
  ```
- **Payload**:
  ```json
  {
    "request": {
      "filters": {
        "status": ["Live", "live"],
        "primaryCategory": ["Course"],
        "channel": "swadhaar-channel"
      },
      "query": "",
      "limit": 20,
      "offset": 0
    }
  }
  ```

### Response Transformation in `CourseService`
- **Course Label Parsing**: Extracts `"Course 0"`, `"Course 1"`, or `"कोर्स 0"` and cleanly separates it from the title (e.g., `"Introduction to Saving"`).
- **Language Detection**: Automatically inspects Unicode blocks for Devanagari script (`[\u0900-\u097F]`) to accurately classify Hindi vs. English courses.
- **Duration Parsing**: Extracts duration from metadata or formatted description (e.g., `"45 + 15 min"`).

---

## 4. Layout Specifications: Courses Table (`#scr-content`)

### Table Columns
1. **Course**:
   - Top line: Course identifier/label (e.g., `Course 0`, `Course 1`)
   - Main line: Clickable Course Name (`font-weight: 600`, color: `#1F1E1C`, hover: `#E6873C`). Clicking routes to `/content/courses/[id]`.
2. **Sections**: Section count or modules count (e.g., `5`, `4`, `7`).
3. **Duration**: Formatted duration string (e.g., `45 + 15 min`, or `—`).
4. **Language**: Chip tag with `English` or `Hindi`.
5. **Status**: `LifecycleChip` displaying `Published` (`#DCFCE7` green) or `Draft` (`#FEF3C7` amber).
6. **Updated**: Formatted timestamp (e.g., `26 Aug 2026`).
7. **Actions**:
   - Arrow Open Button (`→`): Navigates to `/content/courses/[id]`.
   - Edit Button: Opens course edit view.

### Toolbar & Controls
- **Header**: "Courses", subtitle: "Courses from the Financial Inclusion Training Programme", "Create course" button.
- **Status Tabs**:
  - `All` (with badge showing total count)
  - `Published` (filters `status: ["Live", "live"]`)
  - `Drafts` (filters `status: ["Draft", "draft"]`)
- **Search Bar**: Debounced real-time query passed to Sunbird composite search.
- **Language Dropdown**: Filter courses by `All Languages`, `English`, or `Hindi`.

---

## 5. Course Structure Details View (`#scr-coursebuilder`)

### Page Route
`/content/courses/[id]` (e.g., `/content/courses/do_2146634601053061121227`)

### Header Section
- **Breadcrumb**: `Learning / Courses / Course 1 · Introduction to Saving` (with clickable link to courses list).
- **Title Row**: Course name, `Course 1` pill, `Published` status chip, and `BRD §6.2 · course doc` badge.
- **Subtitle**: `Audience: field trainers · English · 4 sections`.
- **Top Actions**:
  - `Edit details` (Outlined)
  - `Preview` (Outlined)
  - `Publish changes` (Contained Primary `#E6873C`)

### 2-Column Responsive Layout
#### Left Column (8 / 12)
1. **Sections Header**:
   - Title: `Sections`
   - Action: `+ Add section`
2. **Section Cards** (e.g. 1.1, 1.2, 1.3, 1.4):
   - Vertical Up / Down reorder arrows
   - Section title (e.g. `1.1 · Life Cycle Needs & Financial Planning`)
   - Duration & units summary (e.g. `22 min · Hook · 4 videos · Concept · Analysis`)
   - Status chip: `Complete`
   - Action buttons: Edit icon, Delete icon
   - Expandable drawer: Clicking shows sub-units (HOOK, Concept, Analysis) with individual icons and types.
3. **Course-Level Items Card**:
   - **FAQs**: `FAQs · 10 questions`
   - **Summary**: `Summary`
   - **Assessment**: `Assessment · Course 1 Assessment · 10 MCQs` with button `Open in Assessments`
   - **Transition**: `Transition · bridge to the next course`

#### Right Column (4 / 12)
1. **Publishing Card**:
   - Status: `Published`
   - Unpublished changes: `1 section` (or `None`)
2. **Used in Learning Paths Card**:
   - Link: `Financial Inclusion Training Programme`
   - Subtitle: `Step 2 of 7`

---

## 6. Testing and Verification Checklist

- [x] **Zero TypeScript Errors**: Verified with `tsc --noEmit -p apps/swadhaar-admin-repo/tsconfig.json`.
- [x] **Next.js Dev Server**: Verified HTTP 200 responses on `/content/courses` and dynamic route `/content/courses/:id`.
- [x] **Live Composite Search API**: Validated curl request against Sunbird composite search endpoint returning live courses.
- [x] **Hierarchy API**: Validated hierarchy endpoint returning real sections (1.1 to 1.4), child units (HOOK, Concept, Analysis), and assessments.
- [x] **Visual Consistency**: Verified Swadhaar Brand Theme `#E6873C`, card borders `#D6D3CC`, and status chips `#DCFCE7` matching the prototype wireframe.
