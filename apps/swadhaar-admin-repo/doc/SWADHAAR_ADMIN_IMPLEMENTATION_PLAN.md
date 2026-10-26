# 📋 Swadhaar Admin Portal — Comprehensive Implementation Plan & API Integration Roadmap

**Project:** Swadhaar FinAccess — Training, Content, Operations & Analytics Admin Portal  
**Target Application:** `apps/swadhaar-admin-repo` (Next.js 14, Material-UI v5, Nx Monorepo)  
**Tenant ID:** `35529b5d-526f-4da5-bc6e-64f740023d26` | **Channel:** `swadhaar-channel` | **Framework:** `swadhaar-framework`  
**Primary UI / Flow Reference:** `apps/swadhaar-admin-repo/doc/Swadhaar_Admin_Prototype (2).html`  
**Design & Theme Reference:** Exactly matching **Swadhaar Learner Web App** (`apps/learner-web-app`)  
**Scope Reference:** Approved Pratham 2.0 / Swadhaar Scope (`swadhaar_scope_document.md`)  
**Workbook Source:** [Swadhaar_Admin_Portal_Implementation_Plan.xlsx](file:///home/ttpl-rt-151/Documents/Documents/Shikshav/Shiksha-mfe/new%20learner%20app/shiksha-mfe/apps/swadhaar-admin-repo/doc/Swadhaar_Admin_Portal_Implementation_Plan.xlsx)

---

## 1. Executive Summary & Architectural Directives

1. **100% Scope Parity:**  
   Covers all requirements from the Admin Module, Content Module, and Analytics Dashboard:
   - **Admin Module:** Swadhaar UI Branding & Theming, Phone+OTP Login (Learner App flow parity), Role & Access Management (RBAC), User Management (Mandatory Phone, Optional Gender, SDBV Hierarchy, Bulk CSV Upload & Validation, Group SDBV filter), Cohort/Group Management (SDBV scope, course mapping, 2-panel builder with Learner/Reviewer/Both roles, archive lifecycle), Course & Question-Set form updates (new fields, tooltips, validations, Bloom's tags, draft auto-save), Content-type & dynamic Topic/Subtopic filters, and Advanced Notification / Alert Management.
   - **Content Module:** Content taxonomy tree & topic-subtopic mapping, Content-Type configuration & dynamic JSON metadata schemas, Content authoring & upload UI (Creator role), Bulk content upload + validation (ZIP + metadata CSV), Media handling (MP4 transcoding, YouTube embeds, PDFs, image crop, assessments), Content review & publish workflow (Creator → Reviewer → Publish with inline comments and audit trail), Content versioning, diff viewer, rollback, and archive/delete lifecycle.
   - **Analytics Dashboard:** Operational Admin Overview Dashboard (8 KPI cards, SDBV geographic heatmap, top courses, pending review queue) and Deep Dive Analytics Dashboard (Learner progress report, cohort completion & retention funnel, course engagement, assessment question discrimination, SDBV drill-down, and CSV/Excel exports).
2. **Design Language & Zero-Inline-Styles:**  
   Strictly aligned with `apps/learner-web-app` (`#E6873C` primary brand orange, `#1C2B4A` dark navy header/secondary, `#F5F5F5` canvas background, `#FFFFFF` cards, `Inter/Poppins` typography). Zero raw `style={{ ... }}` inline styling—all styling governed by MUI `customTheme.tsx`, theme tokens, and component overrides.
3. **Dedicated Admin API Layer (`apps/swadhaar-admin-repo/src/services/`):**  
   Every single screen and operation is mapped to typed REST API services with request deduplication (`staleTime: 5 mins` via TanStack Query) and standard Axios interceptors passing tenant, channel, and authentication tokens.

---

## 2. Master 20-Day Execution Roadmap

```mermaid
gantt
    title Swadhaar Admin Portal — 20-Day Implementation & API Schedule
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation, Branding, Auth & RBAC
    Day 1: Branding, Theming & Base Primitives           :2026-10-16, 1d
    Day 2: Layout Shell, Dynamic Sidebar & DataTable    :2026-10-17, 1d
    Day 3: Phone+OTP Login, Session & Guards             :2026-10-18, 1d
    Day 4: Role & Access Management (RBAC)               :2026-10-19, 1d
    Day 5: User Management Core (N1, P2, P3) & SDBV      :2026-10-20, 1d
    section Phase 2: Operations, Cohorts & Notifications
    Day 6: Bulk User Creation Wizard (N2) & Reviewer Map :2026-10-21, 1d
    Day 7: Cohorts Directory (N4) & Course Mapping       :2026-10-22, 1d
    Day 8: Two-Panel Group Builder (N7b) & In-Group Roles:2026-10-23, 1d
    Day 9: Notification & Alert Management (Advanced)    :2026-10-24, 1d
    section Phase 3: Content Core, Authoring & Media
    Day 10: Taxonomy Management & Dynamic Filters        :2026-10-25, 1d
    Day 11: Content-Type Registry & Dynamic Schemas      :2026-10-26, 1d
    Day 12: Course Catalog (L1) & Overview Form (L2)     :2026-10-27, 1d
    Day 13: Course Structure & Units Builder (L3)        :2026-10-28, 1d
    Day 14: Section Editor (L4) & Assessment Builder     :2026-10-29, 1d
    Day 15: Media Handling & Central Library (Videos/PDF):2026-10-30, 1d
    section Phase 4: Workflow, Lifecycle & Analytics
    Day 16: Bulk Content Upload (CSV/ZIP) & Validation   :2026-10-31, 1d
    Day 17: Content Review & Publish Workflow (C→R→P)    :2026-11-01, 1d
    Day 18: Versioning, Diff Viewer & Archive Lifecycle  :2026-11-02, 1d
    Day 19: Operational Admin Dashboard & Learning Paths :2026-11-03, 1d
    Day 20: Analytics Deep Dive, CSV Export & Build QA   :2026-11-04, 1d
```

---

## 3. Day-Wise Detailed Implementation & API Integration Plan

### **Day 1: Admin UI Branding & Theming to Swadhaar & Base Primitives**
- **Module:** Phase 1: Foundation & Theming
- **Functional Scope:**
  - Establish brand tokens in `customTheme.tsx` matching Swadhaar Learner App: Primary (`#E6873C`), Secondary/Navy (`#1C2B4A`), Surface (`#FFFFFF`), Canvas (`#F5F5F5`).
  - Swadhaar Logo in header, PWA manifest favicon & metadata.
  - Global typography setup (`Inter`/`Poppins`) & CSS variables.
  - Host-based Tenant Detection integration (leveraging tenant detection hook from Shikshagraha branding KI).
  - Dark / Light Theme preference persistence.
  - Strict Zero-Inline-Styles enforcement & Base UI primitives: `SwadhaarStatCard`, `LifecycleChip`, `SDBVHierarchyFilter`.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/tenant/read` (`TenantService.ts`) — Resolve tenant ID & channel info.
  - `GET /api/v1/tenant/branding/{tenantId}` (`TenantService.ts`) — Fetch logo, brand colors, favicon config.
  - `Interceptor.ts` — Configure Axios/Fetch interceptor to attach `X-Tenant-Id`, `X-Channel-Id`, and Bearer tokens to all requests.
- **Estimated Hours:** 8.5 hrs

---

### **Day 2: Layout Architecture & SwadhaarDataTable Primitive**
- **Module:** Phase 1: Layout & Core Primitives
- **Functional Scope:**
  - Build full admin shell: Collapsible Sidebar, App Header, and Breadcrumbs.
  - Dynamic Navigation Menu supporting RBAC visibility (Admin, Creator, Reviewer).
  - Header integration: Swadhaar logo, global search, language switcher (`en`, `mr`, `hi` via `next-i18next`), and profile avatar.
  - Master `SwadhaarDataTable` primitive: debounced search, column sorting, row multi-select checkboxes, server-side pagination, empty state illustrations, and loading skeletons.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/user/profile` (`UserService.ts`) — Fetch authenticated user info & active roles for layout avatar.
  - `GET /api/v1/menu/navigation` (`LayoutService.ts`) — Retrieve authorized nav sections based on user role.
  - Dynamic locale message loader for `next-i18next`.
- **Estimated Hours:** 8.5 hrs

---

### **Day 3: Admin Login with OTP (Learner App Parity) & Session Management**
- **Module:** Phase 1: Auth & Session Management
- **Functional Scope:**
  - Dedicated Admin Login screen (`/login`) with Swadhaar brand card layout.
  - 10-digit mobile number input with regex validation.
  - 6-digit OTP entry screen with 30-second resend cooldown timer.
  - Role-aware post-login redirect (Super Admin/Admin → `/dashboard`, Content Creator → `/content/courses`, Reviewer → `/content/review-queue`).
  - JWT token refresh handling, session storage, and auto-logout on token expiration.
  - Keycloak SSO alignment & `RouteGuard` (`/components/RouteGuard.tsx`).
- **API Integration (`swadhaar-admin-repo`):**
  - `POST /api/v1/auth/otp/send` (`LoginService.ts`) — Body: `{ phone: string, app: 'swadhaar-admin' }`.
  - `POST /api/v1/auth/otp/verify` (`LoginService.ts`) — Body: `{ phone: string, otp: string }` → Returns `{ token, refreshToken, user: { id, roles, tenantId } }`.
  - `POST /api/v1/auth/refresh-token` (`LoginService.ts`) — Silent background refresh.
  - `POST /api/v1/auth/logout` (`LoginService.ts`) — Revoke session.
- **Estimated Hours:** 8.0 hrs

---

### **Day 4: Role & Access Management (RBAC)**
- **Module:** Phase 1: Role & Access Management
- **Functional Scope:**
  - Role Definitions: `Super Admin`, `Admin`, `Content Creator`, `Reviewer`, `Report Viewer`.
  - Permission Matrix UI (`/access/permissions`): Interactive Grid (Roles × Permission Modules: User Mgmt, Cohort Mgmt, Content Authoring, Review & Publish, Notifications, Analytics) with toggle switches.
  - Role Assignment UI: Single and bulk user role assignment modal.
  - Frontend Route & Component Permission Guards (e.g. `<PermissionGate permission='CONTENT_PUBLISH'>`).
  - RBAC Audit Log (`/access/audit-log`): Table displaying actor, action, timestamp, target user, and before/after permission delta.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/rbac/roles` (`RbacService.ts`) — Fetch all system roles & definitions.
  - `GET /api/v1/rbac/permissions` (`RbacService.ts`) — Fetch permission tree by domain.
  - `PUT /api/v1/rbac/matrix/update` (`RbacService.ts`) — Update role-permission mappings.
  - `PUT /api/v1/rbac/user-roles/{userId}` (`RbacService.ts`) — Assign/revoke roles for user.
  - `GET /api/v1/rbac/audit-logs` (`RbacService.ts`) — Paginated audit trail with date/actor filters.
- **Estimated Hours:** 8.5 hrs

---

### **Day 5: User Management Core (CRUD & SDBV)**
- **Module:** Phase 1: User Management Core
- **Functional Scope:**
  - Screen N1: Users Directory (`/users`) with SDBV Hierarchy cascading filters (State → District → Block → Village/Branch) and Group SDBV filter.
  - Table columns: Name, Employee ID, Phone (mandatory), Gender, Location (State/District/Block), Role, Status.
  - Screen P2: User Create/Edit Modal (`/users/create`):
    - Mandatory phone field with uniqueness & 10-digit validation.
    - Gender dropdown (`Male`, `Female`, `Other`, `Prefer not to say` — optional).
    - Cascading SDBV dropdowns with program/branch mapping.
  - Screen P3: User Detail Profile (`/users/[id]`) with 4-card layout (Location, Role, Cohort Memberships, Review Relationships).
  - User Activate / Deactivate (soft delete/suspend without data loss).
- **API Integration (`swadhaar-admin-repo`):**
  - `POST /api/v1/user/search` (`UserService.ts`) — Query with SDBV filters, role, status, page, limit.
  - `POST /api/v1/user/create` (`UserService.ts`) — Body: `{ name, phone, gender, sdbv: { state, district, block, village }, program, role }`.
  - `PUT /api/v1/user/update/{id}` (`UserService.ts`) — Update user profile attributes.
  - `PUT /api/v1/user/status/{id}` (`UserService.ts`) — Body: `{ status: 'active' | 'suspended' }`.
  - `GET /api/v1/master/sdbv/hierarchy` (`MasterDataService.ts`) — Cached via TanStack Query.
- **Estimated Hours:** 8.5 hrs

---

### **Day 6: Bulk User Creation Wizard & User-Reviewer Mapping**
- **Module:** Phase 2: Bulk Operations & Review Mapping
- **Functional Scope:**
  - Screen N2: Bulk User Upload & Validation Wizard (`/users/bulk-upload`).
  - Step 1: Download pre-formatted sample CSV template (with State, District, Block, Village, Phone, Gender, Role, Program headers).
  - Step 2: Drag-and-drop CSV uploader with client-side syntax pre-validation.
  - Step 3: Interactive validation results table (N rows valid, M rows failed with exact cell error reasons highlighted).
  - Step 4: "Download Failed Rows CSV" button for offline fixing & "Proceed to Import" button for valid rows.
  - Screen P8: Add User to Review Modal (assign user to dedicated ARM/DI reviewer).
- **API Integration (`swadhaar-admin-repo`):**
  - `POST /api/v1/user/bulk/upload` (`BulkUserService.ts`) — Multipart CSV file upload.
  - `POST /api/v1/user/bulk/validate` (`BulkUserService.ts`) — Validate parsed CSV rows against DB schemas.
  - `GET /api/v1/user/bulk/job/{jobId}` (`BulkUserService.ts`) — Poll job progress & fetch failed rows.
  - `POST /api/v1/user/review-mapping` (`ReviewerMappingService.ts`) — Body: `{ userId, reviewerId, notes }`.
- **Estimated Hours:** 8.5 hrs

---

### **Day 7: Cohort / Group Management Core & Lifecycle**
- **Module:** Phase 2: Cohort Management & Mapping
- **Functional Scope:**
  - Screen N4: Cohorts Directory (`/cohorts`) with SDBV filter, status tabs, and members/reviewers counters.
  - Create/Edit Cohort Modal: Cohort name, description, SDBV operational scope, auto-enrol rules.
  - Cohort-Course Mapping UI: Assign learning courses and learning paths to a cohort; view cohort completion %.
  - Cohort Lifecycle & Archive UI: Rename "Status" to "Lifecycle State", dedicated Archive Icon in action menu, Archive Cohort action with soft-hide from active roster & Restore action.
  - Cohort Analytics snapshot: aggregated completion %, active member count.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/cohort/list` (`CohortService.ts`) — Filters: SDBV, status, page, limit.
  - `POST /api/v1/cohort/create` (`CohortService.ts`) — Body: `{ name, description, sdbvScope, autoEnrol }`.
  - `PUT /api/v1/cohort/{id}/update` (`CohortService.ts`).
  - `POST /api/v1/cohort/{id}/course-mapping` (`CohortService.ts`) — Body: `{ courseIds: string[] }`.
  - `PUT /api/v1/cohort/{id}/lifecycle` (`CohortService.ts`) — Body: `{ state: 'active' | 'archived' }`.
  - `GET /api/v1/cohort/{id}/analytics-summary` (`CohortService.ts`).
- **Estimated Hours:** 8.5 hrs

---

### **Day 8: Two-Panel Group Builder & In-Group Roles**
- **Module:** Phase 2: Group Builder & In-Group Roles
- **Functional Scope:**
  - Screen N7b: Two-Panel Group Builder (`/cohorts/builder`):
    - Left Panel (User Pool): Cascading SDBV filters (State/District/Block), program filter, search input, multi-select checkboxes, and "Add Selected (N) to Group" action.
    - Right Panel (Group Configuration): Group Name, description, and selected member list. Each member has a per-member in-group role selector: **Learner**, **Reviewer**, or **Both** (defaults to `Learner`).
  - Screen N6: Group Detail View (`/cohorts/[id]`): Header stats (Total, Learners, Reviewers), Members roster with in-group role badges, and Course assignments tab.
  - Screen N5 (Edit Group modal) & N3/N8 (Confirmation dialogs with safe deletion messaging).
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/user/search` (`UserService.ts`) — Fetch filtered roster for left panel.
  - `GET /api/v1/cohort/{id}/members` (`CohortService.ts`) — Fetch existing group members with in-group roles.
  - `PUT /api/v1/cohort/{id}/members-with-roles` (`CohortService.ts`) — Body: `{ members: [{ userId, roleInGroup: 'Learner' | 'Reviewer' | 'Both' }] }`.
  - `DELETE /api/v1/cohort/{id}/member/{userId}` (`CohortService.ts`).
- **Estimated Hours:** 8.5 hrs

---

### **Day 9: Notification & Alert Management (Advanced)**
- **Module:** Phase 2: Notifications & Alerts
- **Functional Scope:**
  - Screen `/notifications`: Notification Center & Delivery Dashboard.
  - Notification Creation Wizard: Title, body copy, media attachment, target audience (by Role, Cohort, or SDBV hierarchy).
  - Delivery Channels: In-app bell notification, Push (FCM), and SMS integration toggle.
  - Notification Templates UI: CRUD for reusable notification templates with dynamic placeholders (e.g. `{{userName}}`, `{{courseTitle}}`, `{{deadline}}`).
  - Scheduler UI: One-time future date/time delivery & recurring schedules (daily, weekly).
  - Delivery Status Analytics: Real-time Sent, Delivered, and Failed counts.
  - Alert Rules Engine: Configure automated triggers (e.g. "Alert cohort when course completion < 20% after 7 days").
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/notification/list` (`NotificationService.ts`) — Paginated notifications with status filters.
  - `POST /api/v1/notification/create` (`NotificationService.ts`) — Body: `{ title, body, channels: ['in-app', 'push', 'sms'], target: { type, ids }, scheduledAt }`.
  - `GET /api/v1/notification/templates` (`NotificationTemplateService.ts`).
  - `POST /api/v1/notification/templates/create` (`NotificationTemplateService.ts`).
  - `GET /api/v1/notification/{id}/delivery-status` (`NotificationService.ts`).
  - `POST /api/v1/notification/rules` (`NotificationService.ts`) — Configure threshold alert triggers.
- **Estimated Hours:** 8.5 hrs

---

### **Day 10: Content Taxonomy & Dynamic Topic/Subtopic Filters**
- **Module:** Phase 3: Content Taxonomy & Filtering
- **Functional Scope:**
  - Screen `/content/taxonomy`: Taxonomy Tree Management UI.
  - CRUD for Topics and Subtopics with hierarchical parent-child relationships.
  - Drag-and-drop tree reordering for topics and subtopics.
  - Taxonomy Import tool: Batch import taxonomy trees from CSV / JSON.
  - Content-to-Taxonomy Mapping: Assign multiple topics/subtopics to content items.
  - Orphan Detection: Flag content items missing taxonomy mappings.
  - Dynamic Content Filtering Engine: Dynamic Subtopic dropdown (populated based on selected Topic), Content-Type filter showing only types with uploaded assets, filter persistence in Zustand, and "Clear All Filters" single-click button.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/framework/read/{frameworkId}` (`TaxonomyService.ts`) — Fetch channel taxonomy tree.
  - `POST /api/v1/taxonomy/topic/create` (`TaxonomyService.ts`) — Body: `{ name, code, parentId }`.
  - `PUT /api/v1/taxonomy/topic/{id}/update` (`TaxonomyService.ts`).
  - `POST /api/v1/taxonomy/reorder` (`TaxonomyService.ts`) — Body: `{ orderedIds: string[] }`.
  - `POST /api/v1/taxonomy/import` (`TaxonomyService.ts`) — Multipart CSV/JSON import.
  - `GET /api/v1/taxonomy/orphans` (`TaxonomyService.ts`) — List unmapped content items.
- **Estimated Hours:** 8.5 hrs

---

### **Day 11: Content-Type Configuration & Metadata Forms**
- **Module:** Phase 3: Content-Type Config & Dynamic Schemas
- **Functional Scope:**
  - Screen `/content/content-types`: Admin Content-Type Registry.
  - Registry of supported content types (Video, PDF, Assessment, Audio, Interactive HTML5).
  - Per-Type Metadata Schema Builder: Configure custom metadata fields (field type, label, tooltip, required flag, validation regex, default value) for each content type.
  - Dynamic Form Renderer Component (`DynamicMetadataForm.tsx`): Dynamically generates input controls and validations based on JSON schema.
  - Type-specific validation rules (e.g. video minimum duration ≥ 30s, PDF max size ≤ 25MB).
  - Learner Display Configuration: Toggle which metadata fields appear to learners in the Learner App.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/content-type/registry` (`ContentTypeService.ts`) — List active content types.
  - `POST /api/v1/content-type/registry/create` (`ContentTypeService.ts`).
  - `GET /api/v1/content-type/{type}/schema` (`ContentTypeService.ts`) — Fetch JSON schema for type.
  - `PUT /api/v1/content-type/{type}/schema` (`ContentTypeService.ts`) — Update field definitions & validations.
  - `PUT /api/v1/content-type/{type}/display-config` (`ContentTypeService.ts`) — Set learner visibility flags.
- **Estimated Hours:** 8.5 hrs

---

### **Day 12: Course Catalog & Form Updates (New Fields, Tooltips, Auto-save)**
- **Module:** Phase 3: Course Catalog & Form Updates
- **Functional Scope:**
  - Screen L1: Course Catalog (`/content/courses`) with All, Published, and Drafts tabs.
  - Archive & Lifecycle UI: Rename "Status" to "Lifecycle State", Archive Icon in row actions, Lifecycle states: Draft → Review → Published → Archived → Deleted.
  - Screen L2: Course Overview Metadata Form (`/content/courses/create`):
    - New Metadata Fields: Difficulty level, target audience, prerequisite course, estimated duration (aggregated).
    - Contextual help tooltips on all fields.
    - Field-level regex and boundary validations.
    - Single language select (Hindi, Marathi, English) per course.
    - Rich text editors for Course Objectives & How It Works.
    - Periodic Draft Auto-save with visual indicator ("Saved at 14:32").
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/content/course/list` (`ContentService.ts`) — Filters: lifecycleState, language, search, page.
  - `POST /api/v1/content/course/create` (`ContentService.ts`) — Body: `{ title, audience, difficulty, duration, language, objectives, howItWorks }`.
  - `PUT /api/v1/content/course/draft/{id}` (`ContentService.ts`) — Periodic auto-save endpoint.
  - `PUT /api/v1/content/course/{id}/lifecycle` (`ContentService.ts`) — Archive / restore / delete.
- **Estimated Hours:** 8.5 hrs

---

### **Day 13: Course Structure & Units Builder**
- **Module:** Phase 3: Course Structure & Units Builder
- **Functional Scope:**
  - Screen L3: Course Curriculum Builder (`/content/courses/[id]/builder`).
  - Ordered Sections Tree with Move Up / Move Down sequence reordering.
  - Section Duration Calculation: Aggregates runtime of all child videos and reading time of PDFs.
  - Course-Level Units: FAQs, Course Summary, Course Assessment, Transition screens.
  - `+ Add Section` Modal: Section title, target duration, learning objectives.
  - Course Completion Rules: Configure passing threshold (default 70% passing score).
  - Action buttons: "Save as Draft", "Preview as Learner", and "Submit for Review".
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/content/course/{id}/hierarchy` (`ContentService.ts`) — Fetch full tree: units, sections, assets.
  - `POST /api/v1/content/course/{id}/section/create` (`ContentService.ts`).
  - `PUT /api/v1/content/course/{id}/reorder-sections` (`ContentService.ts`) — Body: `{ sectionOrder: string[] }`.
  - `PUT /api/v1/content/course/{id}/units` (`ContentService.ts`).
  - `GET /api/v1/content/course/{id}/validate-publish` (`ContentService.ts`) — Verify minimum 1 section & 1 assessment.
- **Estimated Hours:** 8.5 hrs

---

### **Day 14: Section Content Editor & Question-Set Form Updates**
- **Module:** Phase 3: Section Content & Question-Set Builder
- **Functional Scope:**
  - Screen L4: Section Content Editor (`/content/sections/[id]/edit`):
    - Structured Pedagogical Blocks: **Intro → Hook → Video Watch → Concept → Analysis**.
    - Reorderable typed blocks: Text, Hook, Concept, Analysis, Video, Image.
    - Rich text formatting toolbar (bold, italic, list, links).
  - Screen L9 & L10: Assessments Library & Question-Set Builder (`/content/assessments/[id]/builder`):
    - Question Types: MCQ Single, MCQ Multi, True/False, Short Answer.
    - Bloom's Taxonomy Tag dropdown (Remember, Understand, Apply, Analyze, Evaluate).
    - Contextual Tooltips, Hint text, and Answer Explanation fields.
    - 70% Passing Rule setting and timer configuration.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/content/section/{id}` (`ContentService.ts`).
  - `PUT /api/v1/content/section/{id}/update` (`ContentService.ts`) — Save pedagogical blocks array.
  - `GET /api/v1/assessment/list` (`AssessmentService.ts`).
  - `POST /api/v1/assessment/create` (`AssessmentService.ts`).
  - `PUT /api/v1/assessment/{id}/questions` (`AssessmentService.ts`) — Body: `{ questions: [{ type, text, options, correctOption, hint, explanation, bloomsTag }] }`.
- **Estimated Hours:** 8.5 hrs

---

### **Day 15: Media Handling & Central Library (Videos, PDFs, Embeds)**
- **Module:** Phase 3: Media Handling & Central Library
- **Functional Scope:**
  - Central Media Library (`/content/library`) with tabbed views: Videos, PDFs, Images.
  - Screen L11 & L5: Videos Library & Video Uploader:
    - MP4 video upload with upload progress, transcoding status, and auto-generated thumbnail.
    - YouTube Video Embed: URL input with live embed preview and oEmbed metadata fetch (title, duration).
  - Screen L12 & L5b: PDFs Library & Document Uploader:
    - Drag-and-drop PDF file uploader, page count detector, estimated read time, and in-portal PDF viewer preview.
    - Learner download permission toggle.
  - Image handling: upload, crop/resize modal, and alt-text for a11y.
  - Screen L4b: Media Picker Modal (reuse media across sections).
- **API Integration (`swadhaar-admin-repo`):**
  - `POST /api/v1/media/upload` (`MediaService.ts`) — Chunked multipart upload for MP4/PDF/images.
  - `GET /api/v1/media/library` (`MediaService.ts`) — Search by filename, media type, tags, usage.
  - `POST /api/v1/media/youtube-embed` (`MediaService.ts`) — Body: `{ url }` → returns title, thumbnail, duration.
  - `GET /api/v1/media/{id}/transcode-status` (`MediaService.ts`).
  - `GET /api/v1/media/{id}/courses-usage` (`MediaService.ts`) — List courses referencing this media.
- **Estimated Hours:** 8.5 hrs

---

### **Day 16: Bulk Content Upload + Validation Engine**
- **Module:** Phase 4: Bulk Content Upload & Validation
- **Functional Scope:**
  - Screen `/content/bulk-upload`: Bulk Content Import Wizard.
  - CSV / Zip Upload: Support batch upload containing course metadata CSV + zipped media assets (videos, PDFs, images).
  - Pre-upload Validation Engine:
    - CSV schema check (required columns: title, topic, language, duration, mediaFilename).
    - Media existence check: Verifies all `mediaFilename` entries exist in the ZIP package.
    - Duplicate title and code check against existing catalog.
  - Interactive Preview Before Commit: Table preview of parsed records with error rows highlighted in red and valid rows in green.
  - Download Error Report: Downloadable CSV containing failed row indices and explicit error reasons.
  - Row-by-row batch import progress bar.
- **API Integration (`swadhaar-admin-repo`):**
  - `POST /api/v1/content/bulk/upload` (`BulkContentService.ts`) — Multipart upload for metadata CSV + assets ZIP.
  - `POST /api/v1/content/bulk/validate` (`BulkContentService.ts`) — Trigger validation job.
  - `GET /api/v1/content/bulk/job/{jobId}` (`BulkContentService.ts`) — Poll job progress, fetch valid count, error count, and error summary.
  - `GET /api/v1/content/bulk/job/{jobId}/errors.csv` (`BulkContentService.ts`) — Download failed rows CSV.
  - `POST /api/v1/content/bulk/job/{jobId}/commit` (`BulkContentService.ts`) — Commit valid items to catalog.
- **Estimated Hours:** 8.5 hrs

---

### **Day 17: Content Review & Publish Workflow (Creator → Reviewer → Publish)**
- **Module:** Phase 4: Content Review & Publish Workflow
- **Functional Scope:**
  - Workflow States: `Draft` → `Submitted for Review` → `Changes Requested` → `Approved` → `Published`.
  - Creator Submission Flow: Creator submits course draft with changelog notes; auto-notifies assigned Reviewers.
  - Screen `/content/review-queue`: Reviewer Dashboard displaying pending queue sorted by submission date and priority.
  - Interactive Review Workspace:
    - Full course & assessment preview.
    - Inline commenting on specific course sections and question blocks.
    - Actions: "Approve Content", "Request Changes" (with mandatory comment thread), or "Reject".
  - Admin Final Publish: Publish action gated strictly to Admin / Super Admin roles.
  - Workflow Audit Trail: Detailed drawer displaying entire state timeline, timestamps, actors, and review comments.
- **API Integration (`swadhaar-admin-repo`):**
  - `POST /api/v1/content/{id}/submit-review` (`ContentWorkflowService.ts`) — Body: `{ changelog: string }`.
  - `GET /api/v1/content/review-queue` (`ContentWorkflowService.ts`) — Filtered queue for Reviewers.
  - `POST /api/v1/content/{id}/workflow/action` (`ContentWorkflowService.ts`) — Body: `{ action: 'approve' | 'reject' | 'request_changes', comments: string }`.
  - `POST /api/v1/content/{id}/workflow/comments` (`ContentWorkflowService.ts`) — Add section-level inline feedback.
  - `POST /api/v1/content/{id}/publish` (`ContentWorkflowService.ts`) — Gated to Admin.
  - `GET /api/v1/content/{id}/workflow/history` (`ContentWorkflowService.ts`) — Full audit timeline.
- **Estimated Hours:** 8.5 hrs

---

### **Day 18: Content Versioning, Archive & Delete Lifecycle**
- **Module:** Phase 4: Content Versioning & Lifecycle
- **Functional Scope:**
  - Version History UI (`/content/courses/[id]/versions`): Chronological log of all published versions (v1.0, v1.1, v2.0).
  - Visual Diff Viewer: Side-by-side comparison of metadata, sections, and questions between any two versions.
  - One-Click Rollback: Restore any previous published version to Draft state.
  - Archive State: Move obsolete content to Archived; hidden from learner search and catalogues.
  - Soft Delete & Trash Bin (`/content/trash`): Soft-deleted items recoverable within configurable retention period (default 30 days).
  - Permanent Hard Delete: Double-confirmation modal strictly for Super Admins.
  - Retention Policy Configuration UI (configure retention window 7–90 days).
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/content/{id}/versions` (`ContentLifecycleService.ts`) — List version history.
  - `GET /api/v1/content/{id}/diff?v1={v1}&v2={v2}` (`ContentLifecycleService.ts`) — Fetch semantic diff between versions.
  - `POST /api/v1/content/{id}/rollback/{versionId}` (`ContentLifecycleService.ts`) — Rollback to selected version.
  - `PUT /api/v1/content/{id}/archive` (`ContentLifecycleService.ts`) — Move to archived state.
  - `PUT /api/v1/content/{id}/restore` (`ContentLifecycleService.ts`) — Restore from archive/trash to draft.
  - `DELETE /api/v1/content/{id}/soft-delete` (`ContentLifecycleService.ts`).
  - `DELETE /api/v1/content/{id}/hard-delete` (`ContentLifecycleService.ts`) — Permanent removal.
  - `PUT /api/v1/content/retention-policy` (`ContentLifecycleService.ts`) — Set retention window.
- **Estimated Hours:** 8.5 hrs

---

### **Day 19: Operational Admin Dashboard & Learning Paths**
- **Module:** Phase 4: Admin Dashboard & Learning Paths
- **Functional Scope:**
  - Operational Admin Dashboard (`/dashboard`):
    - 8 Executive KPI Stat Cards: Total Active Users, DAU/MAU Active Learners (7/30 days), Course Completion Rate %, Content Published (This Month), Pending Review Queue count, Notifications Sent counter.
    - SDBV Geographic Map View / Heatmap: Learner activity and completion breakdown by State and District.
    - Top 5 Courses Widget: Sorted by enrolment count and completion rate.
    - Quick Action shortcuts (`+ User`, `+ Cohort`, `+ Course`, `+ Notification`).
  - Screen L6, L7, L8: Learning Paths & Enrolment:
    - Learning Paths Catalog (L6) & Path Sequence Builder (L7) with prerequisite lock rule ("Require ≥ 70% in Course N before Course N+1").
    - Enrolment Modal (L8): Cohorts or Individual user assignments.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/analytics/dashboard/overview` (`DashboardService.ts`) — KPI metrics & trend sparklines.
  - `GET /api/v1/analytics/dashboard/sdbv-heatmap` (`DashboardService.ts`) — State/District aggregate counts.
  - `GET /api/v1/analytics/dashboard/top-courses` (`DashboardService.ts`).
  - `GET /api/v1/learning-paths/list` (`LearningPathService.ts`).
  - `POST /api/v1/learning-paths/create` (`LearningPathService.ts`) — Body: `{ title, courses: [{ courseId, minScore: 70, unlockOrder }] }`.
  - `POST /api/v1/learning-paths/{id}/enrol` (`LearningPathService.ts`) — Body: `{ cohortIds, userIds }`.
- **Estimated Hours:** 8.5 hrs

---

### **Day 20: Analytics Deep Dive, CSV Export, i18n Audit & Deployment QA**
- **Module:** Phase 4: Analytics Deep Dive & Final QA
- **Functional Scope:**
  - Screen `/analytics`: Deep Dive Analytics Reports Hub:
    - Learner Progress Report: User-level courses enrolled, completed, scores, and active dates.
    - Cohort Completion Report: Cohort completion %, average assessment score, dropoff point.
    - Course Engagement Report: Views, completion rate, average time spent, re-attempt frequency.
    - Assessment Performance: Question-level difficulty, discrimination index, distractor analysis.
    - Content Usage by Type: Interaction breakdown across Video, PDF, and Assessment.
    - Retention & Dropout Funnel: Enrolled → Started → 50% → Completed.
    - SDBV Drill-down (State → District → Block) & Custom Date Range picker.
    - Export to CSV / Excel for all reports & Scheduled report email config.
  - 100% Localization Audit (`en`, `mr`, `hi`), Zero-Inline-Styles Audit, and Next.js Production Build QA.
- **API Integration (`swadhaar-admin-repo`):**
  - `GET /api/v1/analytics/reports/learner-progress` (`AnalyticsService.ts`) — Filters: SDBV, cohort, dateRange.
  - `GET /api/v1/analytics/reports/cohort-completion` (`AnalyticsService.ts`).
  - `GET /api/v1/analytics/reports/course-engagement` (`AnalyticsService.ts`).
  - `GET /api/v1/analytics/reports/assessment-analytics/{assessmentId}` (`AnalyticsService.ts`).
  - `GET /api/v1/analytics/reports/funnel` (`AnalyticsService.ts`).
  - `POST /api/v1/analytics/reports/export` (`ReportExportService.ts`) — Format: `'csv' | 'xlsx'` → stream file download.
  - `POST /api/v1/analytics/reports/schedule-email` (`ReportExportService.ts`).
- **Estimated Hours:** 8.5 hrs

---

## 4. Total Effort & Summary

- **Total Execution Days:** 20 Days
- **Total Engineering Hours:** 170.0 hrs
- **Covered Modules:**
  - ✅ Admin UI Branding & Theming to Swadhaar
  - ✅ Admin Login with OTP (Learner flow parity)
  - ✅ Role & Access Management (RBAC Matrix, single & bulk assignment, route guards, audit log)
  - ✅ User Management (Mandatory phone, optional gender, SDBV hierarchy, bulk CSV upload & validation, group SDBV filter, activate/deactivate)
  - ✅ Cohort / Group Management (SDBV scope, course mapping, 2-panel builder with Learner/Reviewer/Both roles, archive lifecycle)
  - ✅ Course & Question-Set Form Updates (New fields, tooltips, validations, Bloom's tags, draft auto-save)
  - ✅ Content-type & Dynamic Topic/Subtopic Filters (Dynamic subtopic, only uploaded types, persistence, clear-all)
  - ✅ Notification / Alert Management (In-app bell, FCM push, SMS, templates, scheduler, status dashboard, rules)
  - ✅ Content Authoring & Upload UI (Creator role, rich editor, draft state)
  - ✅ Bulk Content Upload + Validation (ZIP + CSV, pre-validation, preview, downloadable failed rows CSV)
  - ✅ Archive & Lifecycle UI (Rename to Lifecycle State, dedicated archive icon, restore, bulk archive)
  - ✅ Content Taxonomy / Topic-Subtopic Mapping (Tree management, drag-reorder, CSV/JSON import, orphan detection)
  - ✅ Content Review & Publish Workflow (Creator → Reviewer → Publish, inline comments, audit trail)
  - ✅ Content Versioning, Archive & Delete Lifecycle (Version history, visual diff viewer, rollback, soft-delete, hard-delete)
  - ✅ Media Handling (MP4 transcoding, YouTube embeds, PDFs, image crop, assessments)
  - ✅ Content-Type Configuration & Metadata Forms (Registry, dynamic JSON schema renderer, validations)
  - ✅ Admin Dashboard (Operational overview, 8 KPI cards, SDBV heatmap, top courses, pending reviews)
  - ✅ Analytics Dashboard (Deep dive reports, learner progress, cohort completion, question analytics, CSV/Excel export)
  - ✅ API Integration Layer in `apps/swadhaar-admin-repo/src/services/` (18 service modules, 65+ endpoints)
