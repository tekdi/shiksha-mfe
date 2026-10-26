# 📋 Pratham 2.0 — Admin, Analytics & Content Module Scope
**Project:** Swadhaar / Pratham 2.0 Admin Portal  
**Status:** ✅ Formally Approved — Work Commenced  
**Date:** October 14, 2026  
**Prepared by:** Engineering Team

---

## 1. Admin Module

### 1.1 Admin UI Branding & Theming — *Swadhaar*

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.1.1 | Brand Token System | Replace Pratham/generic palette with Swadhaar colour tokens (primary, secondary, accent, surface) | 🔴 High |
| 1.1.2 | Logo & Favicon | Swadhaar logo in header, PWA manifest favicon | 🔴 High |
| 1.1.3 | Typography | Map Swadhaar font stack to global CSS variables | 🟡 Medium |
| 1.1.4 | Dark / Light Theme | Admin portal theme switch with persisted preference | 🟢 Low |
| 1.1.5 | Host-based Tenant Detection | Reuse existing branding API hook from Shikshagraha branding KI | 🔴 High |

**Reference:** `shikshagraha_branding_pwa` KI — `branding_system.md`, `layout_integration.md`

---

### 1.2 Admin Login with OTP

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.2.1 | Phone-based OTP Flow | Same flow as the Learner app — enter phone → send OTP → verify → session | 🔴 High |
| 1.2.2 | Resend OTP with Cooldown | 30-second timer before resend is enabled | 🔴 High |
| 1.2.3 | Role-aware Redirect | Post-login redirect based on assigned role (Admin / Creator / Reviewer) | 🔴 High |
| 1.2.4 | Session Management | JWT / token refresh, auto-logout on expiry | 🔴 High |
| 1.2.5 | Keycloak / Auth Integration | Align with existing Keycloak SSO if configured | 🟡 Medium |

---

### 1.3 Role & Access Management (RBAC)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.3.1 | Role Definitions | `Super Admin`, `Admin`, `Content Creator`, `Reviewer`, `Report Viewer` | 🔴 High |
| 1.3.2 | Permission Matrix UI | Grid view — Roles × Permissions with toggle | 🔴 High |
| 1.3.3 | Role Assignment | Assign / revoke roles per user; single or bulk | 🔴 High |
| 1.3.4 | Permission Guards | Route + API-level guards in admin-app-repo | 🔴 High |
| 1.3.5 | Audit Log | Track role changes with actor, timestamp, before/after state | 🟡 Medium |

---

### 1.4 User Management

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.4.1 | User List with Filters | Filter by role, SDBV level, group, status | 🔴 High |
| 1.4.2 | Mandatory Phone Field | Phone is required; validation + uniqueness check | 🔴 High |
| 1.4.3 | Optional Gender Field | Gender dropdown (Male / Female / Other / Prefer not to say) | 🟡 Medium |
| 1.4.4 | SDBV Hierarchy | State → District → Block → Village — cascading dropdowns | 🔴 High |
| 1.4.5 | Group / SDBV Filter | Filter user list by group and SDBV level | 🔴 High |
| 1.4.6 | Bulk User Creation | CSV upload → preview → validate → create; downloadable error report | 🔴 High |
| 1.4.7 | User Profile Edit | Inline edit with field-level validation | 🟡 Medium |
| 1.4.8 | Activate / Deactivate | Soft-delete / suspend users without data loss | 🔴 High |

---

### 1.5 Cohort / Group Management

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.5.1 | Create / Edit Cohort | Name, description, SDBV scope, auto-enrol rules | 🔴 High |
| 1.5.2 | Member Management | Add/remove members individually or via bulk upload | 🔴 High |
| 1.5.3 | Cohort-Course Mapping | Assign courses to a cohort; track completion per cohort | 🔴 High |
| 1.5.4 | Cohort Analytics | Aggregate completion %, active users per cohort | 🟡 Medium |
| 1.5.5 | Archive Cohort | Lifecycle — Active → Archived (with icon and renamed column) | 🟡 Medium |

---

### 1.6 Course & Question-Set Form Updates

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.6.1 | New Metadata Fields | Difficulty level, target audience, prerequisite course, estimated duration | 🔴 High |
| 1.6.2 | Tooltips on Fields | Contextual help tooltips on all new and complex fields | 🟡 Medium |
| 1.6.3 | Field-level Validations | Min/max length, format regex, required flags | 🔴 High |
| 1.6.4 | Question-Set Additions | Bloom's taxonomy tag, hint text, explanation field | 🟡 Medium |
| 1.6.5 | Draft Auto-save | Periodic auto-save with visual indicator | 🟡 Medium |

---

### 1.7 Content-Type & Topic / Subtopic Filters

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.7.1 | Content-Type Filter | Show only content types that have uploaded assets | 🔴 High |
| 1.7.2 | Topic Dropdown | Primary topic selection from taxonomy tree | 🔴 High |
| 1.7.3 | Dynamic Subtopic | Subtopic list populated based on selected Topic | 🔴 High |
| 1.7.4 | Filter Persistence | Retain applied filters across page navigation | 🟡 Medium |
| 1.7.5 | Clear All Filters | Single-click reset for all active filter tokens | 🟡 Medium |

---

### 1.8 Notification / Alert Management (Advanced)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.8.1 | Create Notification | Title, body, target audience (role/cohort/SDBV), schedule datetime | 🔴 High |
| 1.8.2 | Delivery Channels | In-app bell, Push (FCM), SMS (optional) | 🔴 High |
| 1.8.3 | Notification Templates | Reusable templates with variable placeholders | 🟡 Medium |
| 1.8.4 | Scheduled Notifications | One-time and recurring schedule configuration | 🟡 Medium |
| 1.8.5 | Delivery Status Dashboard | Sent / Delivered / Failed counts per notification | 🟡 Medium |
| 1.8.6 | Alert Rules | Rule-based triggers (e.g., "Notify cohort when completion < 20% after 7 days") | 🟢 Low |

---

### 1.9 Content Authoring & Upload UI (Creator Role)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.9.1 | Authoring Editor | Rich text / structured content editor for Creator role | 🔴 High |
| 1.9.2 | File Upload | Drag-and-drop; supported types: PDF, MP4, YouTube link, images | 🔴 High |
| 1.9.3 | YouTube Embed | URL input → thumbnail preview → metadata auto-fill | 🔴 High |
| 1.9.4 | Assessment Builder | Question-set builder with MCQ, T/F, Fill-in-the-blank | 🔴 High |
| 1.9.5 | Save as Draft | Draft state before submitting for review | 🔴 High |

---

### 1.10 Bulk Content Upload + Validation

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.10.1 | CSV / Zip Upload | Batch upload with metadata CSV + media assets | 🔴 High |
| 1.10.2 | Pre-upload Validation | Schema check, file type validation, duplicate detection | 🔴 High |
| 1.10.3 | Preview Before Commit | Table preview of parsed records with error highlights | 🔴 High |
| 1.10.4 | Error Report Download | Downloadable CSV of failed rows with error reasons | 🔴 High |
| 1.10.5 | Progress Indicator | Row-by-row progress bar during upload processing | 🟡 Medium |

---

### 1.11 Archive & Lifecycle UI

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1.11.1 | Status Column Rename | Rename "Status" column to "Lifecycle State" across all content tables | 🟡 Medium |
| 1.11.2 | Archive Icon | Dedicated archive icon in action column (distinct from delete) | 🔴 High |
| 1.11.3 | Lifecycle States | Draft → Review → Published → Archived → Deleted | 🔴 High |
| 1.11.4 | Restore from Archive | One-click restore to Draft state | 🟡 Medium |
| 1.11.5 | Bulk Archive | Multi-select → archive in one action | 🟡 Medium |

---

## 2. Content Module

### 2.1 Content Taxonomy / Topic-Subtopic Mapping

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 2.1.1 | Taxonomy Tree Management | CRUD for Topic and Subtopic with parent-child relationship | 🔴 High |
| 2.1.2 | Drag-and-Drop Reorder | Reorder topics and subtopics within the tree | 🟡 Medium |
| 2.1.3 | Taxonomy Import | Import taxonomy from CSV/JSON | 🟡 Medium |
| 2.1.4 | Content ↔ Taxonomy Mapping | Assign multiple topics/subtopics to a single content item | 🔴 High |
| 2.1.5 | Orphan Detection | Flag content items with no taxonomy assignment | 🟢 Low |

---

### 2.2 Content Review & Publish Workflow

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 2.2.1 | Workflow States | Draft → Submitted for Review → Changes Requested → Approved → Published | 🔴 High |
| 2.2.2 | Creator Submission | Creator submits draft; triggers notification to Reviewer | 🔴 High |
| 2.2.3 | Reviewer Dashboard | Reviewer sees pending queue; can Approve, Reject, or Request Changes | 🔴 High |
| 2.2.4 | Inline Comments | Reviewer leaves comments on specific sections/fields | 🟡 Medium |
| 2.2.5 | Publish by Admin | Final publish action gated to Admin/Super Admin | 🔴 High |
| 2.2.6 | Workflow Audit Trail | Full history — who changed state, when, with comments | 🟡 Medium |

---

### 2.3 Content Versioning, Archive & Delete Lifecycle

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 2.3.1 | Version History | Each publish creates a new version; view diff between versions | 🔴 High |
| 2.3.2 | Rollback | Restore any previous published version | 🟡 Medium |
| 2.3.3 | Archive | Move content to archived state; hidden from learners | 🔴 High |
| 2.3.4 | Soft Delete | Move to Deleted state; recoverable within retention period | 🔴 High |
| 2.3.5 | Hard Delete | Permanent delete after retention period or explicit admin action | 🟡 Medium |
| 2.3.6 | Retention Policy Config | Configurable retention window (default 30 days) | 🟢 Low |

---

### 2.4 Media Handling

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 2.4.1 | Uploaded Video | MP4 upload with transcoding status, thumbnail generation | 🔴 High |
| 2.4.2 | YouTube Video | URL validation, embed preview, metadata fetch via oEmbed | 🔴 High |
| 2.4.3 | PDF Viewer | In-portal PDF preview with page navigation | 🟡 Medium |
| 2.4.4 | Image Upload | Crop / resize UI, alt-text field for accessibility | 🟡 Medium |
| 2.4.5 | Assessment Media | Images within question options; audio questions (future) | 🟡 Medium |
| 2.4.6 | Media Library | Centralised media library; reuse uploaded assets | 🟡 Medium |

---

### 2.5 Content-Type Configuration & Metadata Forms

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 2.5.1 | Content-Type Registry | Admin-configurable list of content types (Video, PDF, Assessment, etc.) | 🔴 High |
| 2.5.2 | Per-Type Metadata Schema | Define required/optional metadata fields per content type | 🔴 High |
| 2.5.3 | Dynamic Form Renderer | Metadata form rendered dynamically from schema config | 🔴 High |
| 2.5.4 | Validation Rules per Type | Type-specific validations (e.g., video must have duration ≥ 30s) | 🟡 Medium |
| 2.5.5 | Display Configuration | Configure which metadata fields are visible to learners | 🟡 Medium |

---

## 3. Analytics Dashboard

### 3.1 Admin Dashboard (Operational Overview)

| # | Widget / KPI | Description | Priority |
|---|-------------|-------------|----------|
| 3.1.1 | Total Users | Count of active users; trend sparkline | 🔴 High |
| 3.1.2 | Active Learners (7 / 30 days) | DAU/MAU with comparison to previous period | 🔴 High |
| 3.1.3 | Course Completion Rate | Overall % with drill-down per course | 🔴 High |
| 3.1.4 | Content Published (This Month) | Count of new content items published | 🟡 Medium |
| 3.1.5 | Pending Review Queue | Count of items awaiting Reviewer action | 🔴 High |
| 3.1.6 | SDBV Map View | Geographic heatmap — learner activity by district/block | 🟡 Medium |
| 3.1.7 | Top Courses | Top 5 by enrolment and top 5 by completion | 🟡 Medium |
| 3.1.8 | Notifications Sent | Count and delivery success rate over last 30 days | 🟢 Low |

---

### 3.2 Analytics Dashboard (Deep Dive)

| # | Report / View | Description | Priority |
|---|--------------|-------------|----------|
| 3.2.1 | Learner Progress Report | Per-user: courses enrolled, completed, in-progress, assessment scores | 🔴 High |
| 3.2.2 | Cohort Completion Report | Cohort-level completion %, average score, dropoff point | 🔴 High |
| 3.2.3 | Course Engagement Report | Per-course: views, completions, average time spent, re-attempts | 🔴 High |
| 3.2.4 | Assessment Performance | Question-level analytics — difficulty, discrimination index, distractor analysis | 🟡 Medium |
| 3.2.5 | Content Usage by Type | Breakdown of learner interaction by content type (video vs PDF vs assessment) | 🟡 Medium |
| 3.2.6 | SDBV Drill-down Report | Filter all reports by State → District → Block → Village | 🔴 High |
| 3.2.7 | Date Range Filter | All reports support custom date range picker | 🔴 High |
| 3.2.8 | Export to CSV / Excel | All tabular reports exportable | 🔴 High |
| 3.2.9 | Scheduled Report Email | Auto-email weekly/monthly reports to designated admins | 🟢 Low |
| 3.2.10 | Retention & Dropout Funnel | Cohort-based funnel: enrolled → started → 50% → completed | 🟡 Medium |

---

## 4. Cross-Cutting Concerns

| # | Area | Description | Priority |
|---|------|-------------|----------|
| 4.1 | API Layer | All admin/content/analytics features backed by dedicated REST APIs | 🔴 High |
| 4.2 | Responsive Design | Admin portal usable on tablet (landscape) and desktop | 🟡 Medium |
| 4.3 | Accessibility (a11y) | WCAG 2.1 AA compliance on all new screens | 🟡 Medium |
| 4.4 | Internationalisation | i18n-ready string extraction; English default | 🟡 Medium |
| 4.5 | Error Handling | Global error boundary; user-friendly error messages with retry | 🔴 High |
| 4.6 | Performance | Lazy-load heavy components; paginate all tables (server-side) | 🔴 High |
| 4.7 | Security | Input sanitisation, CSRF protection, role-guard on every API route | 🔴 High |
| 4.8 | Testing | Unit tests for business logic; E2E for critical flows (login, publish workflow) | 🟡 Medium |

---

## 5. Delivery Phases (Suggested)

```
Phase 1 — Foundation (Sprint 1–2)
  ├── Branding & theming
  ├── Admin OTP login
  ├── RBAC skeleton
  └── User management (CRUD + SDBV)

Phase 2 — Content Core (Sprint 3–4)
  ├── Taxonomy management
  ├── Content authoring & upload UI
  ├── Bulk upload + validation
  └── Review & publish workflow

Phase 3 — Advanced Features (Sprint 5–6)
  ├── Content versioning & lifecycle
  ├── Cohort management
  ├── Notification system
  └── Course & question-set form updates

Phase 4 — Analytics (Sprint 7–8)
  ├── Admin operational dashboard
  ├── Analytics deep-dive reports
  ├── SDBV drill-down
  └── Export & scheduled reports
```

---

## 6. Priority Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 High | Must-have for MVP; blocks go-live |
| 🟡 Medium | Important; include in first release if capacity allows |
| 🟢 Low | Nice-to-have; deferred to later sprint |

---

*Document generated: October 14, 2026 — Pratham 2.0 Engineering*
