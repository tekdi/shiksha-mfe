# Swadhaar Training Platform — Phase 1 Specification

**Tenant:** Swadhaar FinAccess  
**Tenant ID:** `35529b5d-526f-4da5-bc6e-64f740023d26`  
**App:** `learner-web-app` (Next.js, port 3003)  
**Base API:** `https://interface.tekdinext.com/interface/v1`  
**Target:** PWA + Desktop view for learners (called "Trainers" in Swadhaar context)

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Screen 1 – Splash Screen](#2-screen-1--splash-screen)
3. [Screen 2 – Language Selection](#3-screen-2--language-selection)
4. [Screen 3 – Login (Mobile + OTP)](#4-screen-3--login-mobile--otp)
5. [Screen 4 – Home Screen](#5-screen-4--home-screen)
6. [Screen 5 – Learning Path (Level Expansion)](#6-screen-5--learning-path-level-expansion)
7. [Screen 6 – Subtopic Detail & New Content](#7-screen-6--subtopic-detail--new-content)
8. [Screen 7 – Lesson Player & Quiz](#8-screen-7--lesson-player--quiz)
9. [Screen 8 – Completion Screens](#9-screen-8--completion-screens)
10. [Screen 9 – Profile](#10-screen-9--profile)
11. [Screen 10 – Alerts & Notifications](#11-screen-10--alerts--notifications)
12. [Level & Module Progression Logic](#12-level--module-progression-logic)
13. [API Reference](#13-api-reference)
14. [i18n / Translation Keys](#14-i18n--translation-keys)
15. [PWA Manifest](#15-pwa-manifest)
16. [How to Run the Project (Swadhaar Domain)](#16-how-to-run-the-project-swadhaar-domain)

---

## 1. Design System

### Colors (Swadhaar Brand)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#E6873C` | Buttons, active states, progress bars, highlights |
| Dark Navy | `#1C2B4A` | Splash background, header card background |
| White | `#FFFFFF` | Card backgrounds, text on dark |
| Light Gray BG | `#F5F5F5` | Page background |
| Success Green | `#28A745` | Completed module checkmark |
| Warning Yellow | `#FFC107` | Nudge banner |
| Error Red | `#DC3545` | Error states |
| Text Primary | `#1F2937` | Body text |
| Text Secondary | `#6B7280` | Subtext / captions |
| Border | `#E5E7EB` | Card borders, input borders |

### Typography

| Type | Font | Size | Weight |
|------|------|------|--------|
| App Title | Inter | 28px | 700 |
| Screen Heading | Inter | 22px | 700 |
| Section Title | Inter | 16px | 600 |
| Body | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |
| Button | Inter | 14px | 600 |

### Spacing — 8px Grid

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |

### Border Radius

| Token | Value |
|-------|-------|
| sm | 6px |
| md | 10px |
| lg | 16px |
| pill | 24px |

### Bottom Navigation

3 tabs: **Home** (🏠), **Learn** (📖), **Profile** (👤)  
Active tab: Primary (`#E6873C`), inactive: `#9CA3AF`

---

## 2. Screen 1 – Splash Screen

### UI Layout

```
┌──────────────────────────────┐
│         [Status Bar]         │
│                              │
│    ┌──────────────┐          │
│    │  SWADHAAR    │          │  ← white rounded card 120×120px
│    │  FinAccess   │          │
│    └──────────────┘          │
│                              │
│   Swadhaar Training Platform │  ← H1, white, 28px bold, centered
│       Learn. Grow.           │  ← tagline, white 60% opacity, 14px
│                              │
│                         [●]  │  ← FAB (Swadhaar "S" icon, #E6873C)
│                              │
│   Powered by Swadhaar FinAccess │  ← footer, white 40% opacity, 12px
└──────────────────────────────┘
```

### Behaviour

| # | Rule | Detail |
|---|------|--------|
| 1 | Auto-navigate | After **2.5 s**, check session validity, then redirect |
| 2 | Token check | If `localStorage.token` exists AND decoded `exp > Date.now()/1000` → go to `/home` |
| 3 | No token | Redirect to `/language-selection` |
| 4 | No animation loop | Static branded screen, no looping GIF |
| 5 | PWA splash | Doubles as PWA launch splash (configured in `manifest.json`) |

### Implementation Notes

- File: `apps/learner-web-app/src/app/splash/page.tsx`
- Background: `backgroundColor: '#1C2B4A'`, full-screen, `minHeight: '100dvh'`
- Extract `isTokenValid()` as `utils/authUtils.ts`

### Code Skeleton

```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenValid } from '@learner/utils/authUtils';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isTokenValid()) {
        router.push('/home');
      } else {
        router.push('/language-selection');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box sx={{ bgcolor: '#1C2B4A', minHeight: '100dvh', display: 'flex',
               flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Logo card */}
      {/* Title + tagline */}
      {/* FAB bottom-right */}
      {/* Footer */}
    </Box>
  );
}
```

---

## 3. Screen 2 – Language Selection

### UI Layout

```
┌──────────────────────────────┐
│  Choose Language             │  ← H2, 22px bold, #1F2937
│  Select the language you're  │
│  most comfortable with       │  ← body 14px, #6B7280
│                              │
│  ┌────────────────────────┐  │
│  │  English           (●) │  │  ← Selected: orange border + bg tint
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Hindi             ○   │  │
│  │  हिंदी                 │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Marathi           ○   │  │
│  │  मराठी                 │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────────────────────────┐│
│  │       Continue           ││  ← Primary button, disabled until selection
│  └──────────────────────────┘│
└──────────────────────────────┘
```

### Supported Languages

| Display | Native | Code | i18n file |
|---------|--------|------|-----------|
| English | English | `en` | `en.json` |
| Hindi | हिंदी | `hi` | `hi.json` |
| Marathi | मराठी | `mr` | `mr.json` |

### Behaviour

| # | Rule | Detail |
|---|------|--------|
| 1 | Default selection | English pre-selected on page load |
| 2 | Radio highlight | Selected: `border: 2px solid #E6873C`, `background: #FEF3E8` |
| 3 | Continue disabled | Button disabled until a language is selected |
| 4 | On Continue | `localStorage.setItem('selectedLanguage', code)` → `i18next.changeLanguage(code)` → navigate to `/login` |
| 5 | Persist language | If `localStorage.selectedLanguage` already set, pre-select it |

---

## 4. Screen 3 – Login (Mobile + OTP)

### UI Layout

```
┌──────────────────────────────┐
│  Sign In                     │  ← page title, 20px bold
├──────────────────────────────┤
│  [dark navy header section]  │
│    ┌──────────────┐          │
│    │  SWADHAAR   │          │  ← logo 80×80
│    └──────────────┘          │
│       Welcome!               │  ← white 24px bold
│   Sign in to continue        │  ← subtitle white 14px
├──────────────────────────────┤
│  [light gray form section]   │
│                              │
│  Mobile Number               │
│  ┌────────────────────────┐  │
│  │ Enter mobile number    │  │  ← numeric, height 48px
│  └────────────────────────┘  │
│                              │
│  OTP                         │
│  ┌────────────────────────┐  │
│  │ Enter OTP              │  │  ← appears after Send OTP tapped
│  └──────────── Send/Resend OTP │  ← right-aligned link, #E6873C
│                              │
│  ┌──────────────────────────┐│
│  │        Sign In           ││  ← Primary button, #E6873C
│  └──────────────────────────┘│
└──────────────────────────────┘
```

### Two-Step OTP Flow

```
Step 1: Mobile Entry
  User enters 10-digit mobile → taps "Send OTP"
    → POST /user/list  (check user + tenant)
    → POST /user/send-otp
    → OTP field appears

Step 2: OTP Verification
  User enters 6-digit OTP → taps "Sign In"
    → POST /user/verify-otp
    → On success → GET /user/auth  (get token via cookie)
    → Store token → navigate to /home
```

### Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| Mobile | Exactly 10 digits, numeric only | "Please enter a valid 10-digit mobile number" |
| Mobile | Must exist in tenant | "This user is not registered. Contact admin." |
| OTP | 6 digits, numeric only | "Please enter a valid 6-digit OTP" |
| OTP | Must match hash | "Invalid OTP. Please try again." |
| Send/Resend | Max 2 resend attempts; each starts fresh 120s timer | See below |

### OTP Resend Timer UX

- Attempt 0 → initial Send OTP (not counted as resend)
- Resend attempt 1 → allowed; starts 120s timer
- Resend attempt 2 → allowed; starts fresh 120s timer
- Resend attempt 3+ → blocked; toast: *"Maximum resend attempts reached. Please try again later."*
- While timer running: link replaced with `Resend OTP in 00:XX` in `#6B7280`
- When timer hits 0: link active again (if attempts remain)

### Error State Display

| Error | Location | Visual |
|-------|----------|--------|
| Mobile not registered | Below mobile input | Red `#DC3545` 12px text |
| Account not active | Below mobile input | Red text |
| OTP invalid | Below OTP input | Red text |
| Network error | Toast top of screen | `showToastMessage('...', 'error')` |
| Max resend reached | Below OTP field | Gray `#6B7280` text, link hidden |

Field border turns `#DC3545` on error; reverts to `#E5E7EB` when user types again.

### verify-otp → Auth Token Flow

```
Step 1: POST /user/verify-otp → { status: 'successful' } + sets Keycloak session cookie
Step 2: GET /user/auth → { token, userId, name, role }
Step 3: Store token, userId, name in localStorage → router.push('/home')
```

### Implementation Notes

- Reuse `sendOTP`, `verifyOTP` from `@learner/utils/API/OtPService`
- Reuse `checkUserExistenceWithTenant` from `@learner/utils/API/userService`
- Reuse `login`, `getUserId` from `@learner/utils/API/LoginService`
- TenantId from `localStorage.getItem('domainTenantId')` — do NOT hardcode

---

## 5. Screen 4 – Home Screen

### UI Layout

```
┌──────────────────────────────────────────┐
│  Home              [🔔 Alerts]           │  ← bell with orange badge count
├──────────────────────────────────────────┤
│  [dark navy card — user + levels]        │
│    Namaste, [UserName]!    [Avatar] →    │
│    Designation: [Role]                   │
│                                          │
│    [ Beginner Level   ████████ 100% ✅ ] │
│    [ View More ▾ ]                       │  ← collapsed by default
├──────────────────────────────────────────┤
│  Alerts and Updates                      │
│  ┌────────────────────────────────────┐  │
│  │  [🕐] Quiz Reminder            →  │  │
│  └────────────────────────────────────┘  │
│              [● ○ ○]                    │
├──────────────────────────────────────────┤
│  Continue Learning / Start Learning      │
│  ┌──────────────────────────────────┐   │
│  │  Intermediate Level Completed 3/4▾│   │  ← current active level
│  │  ✅ Module 1  Completed 4/4  →   │   │
│  │  ✅ Module 2  Completed 4/4  →   │   │
│  │  75% Module 3 Completed 3/4 →    │   │
│  │  0%  Module 4 Completed 0/4 →    │   │
│  └──────────────────────────────────┘   │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### UserLevelCard — Expand / Collapse Behaviour

**Default state:**

| User status | Default expanded level |
|-------------|------------------------|
| No levels completed | Beginner Level row shown, others locked |
| Beginner 100% → Intermediate active | Intermediate row shown |
| Intermediate 100% → Advance active | Advance row shown |

**View More / View Less:**
- **Collapsed (default):** Only the currently active level row is visible + Beginner always visible
- **"View More" tap:** All 3 level rows shown
- **"View Less" tap:** Collapses back to active level only

```
Collapsed state:
  [ Beginner Level   ████████ 100% ✅ ]   ← always visible
  [        View More ▾          ]

Expanded state (after View More):
  [ Beginner Level   ████████ 100% ✅ ]
  [ Intermediate Level  ███░░░  60% ]
  [ Advance Level     🔒 Locked   ]
  [        View Less ▴          ]
```

**Level row states:**
- Locked: 🔒 icon, dimmed opacity 50%, no tap action
- In-progress: orange progress bar + percentage
- Completed: ✅ green badge, 100% label
- Badge 🏅 shown beside level name when 100% complete

### Components to Build

| Component | File | Action |
|-----------|------|--------|
| `UserLevelCard` | `components/HomeProgression/UserLevelCard.tsx` | NEW |
| `AlertsCarousel` | `components/AlertsCarousel/AlertsCarousel.tsx` | NEW |
| `LevelModuleList` | `components/HomeProgression/LevelModuleList.tsx` | NEW |
| `ModuleRow` | `components/HomeProgression/ModuleRow.tsx` | NEW |
| `BottomNav` | `components/Layout.tsx` | MODIFY |

### Info Nudge Banner (Yellow)

- Color: `#FFC107` background, `#1F2937` text
- Dismissible (X button); state persisted in `sessionStorage('nudge_dismissed')`
- Once dismissed in a session, no further nudge banner shown for that session

---

## 6. Screen 5 – Learning Path (Level Expansion)

> **Note on screen numbering:** Screenshots label the subtopic detail page as "3.4". In this spec it is split into a dedicated section (Section 7) for clarity, since it has distinct entry points from both the Learning Path and the Alerts flow.

This is the full-page learning path view, accessed from the **Learn tab** in the bottom nav or by tapping a level row on the Home screen.

### Entry Points

| Entry | Action |
|-------|--------|
| Bottom nav "Learn" tab | Opens Learning Path page; auto-expands the active level |
| Home screen level row tap | Opens Learning Path page; auto-expands tapped level |
| Home "Continue Learning" module row → | Navigates to module's subtopic list (Screen 6 context) |

---

### 6.1 Screen 5a – Learning Path Overview (Collapsed)

```
┌──────────────────────────────────────────┐
│  Your Learning Path                      │  ← page title, 22px bold
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────┐    │  ← New Content banner (if any)
│  │ 🌟 New Content Available         │    │     navy bg, orange badge top-right
│  │ Content: [content name]          │    │
│  │  ▶ [Content title]  Lesson 1  → │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Continue Learning                       │  ← section heading
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Beginner Level         [▽ / ▲]  │    │  ← completed: green check on left
│  │  Completed 4/4 Modules           │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Intermediate Level     [▽ / ▲]  │    │  ← currently expanded (active)
│  │  Completed 3/4 modules           │    │
│  ├──────────────────────────────────┤    │
│  │  ✅  Module 1  Completed 4/4  → │    │  ← green check = 100% done
│  │  ✅  Module 2  Completed 4/4  → │    │
│  │  75% Module 3  Completed 3/4  → │    │  ← orange progress circle
│  │  0%  Module 4  Completed 0/4  → │    │  ← gray empty circle
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  🔒 Advanced Level      [▽]      │    │  ← locked: padlock icon, dimmed
│  │  Completed 0/4 modules           │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  🔒 Expert Level        [▽]      │    │
│  │  Completed 0/4 modules           │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### Level Row Visual States

| State | Left icon | Right chevron | Row style |
|-------|-----------|---------------|-----------|
| Completed | ✅ green filled circle (24px) | ▽ expand / ▲ collapse | Full opacity |
| In-progress | Orange arc progress circle | ▽ / ▲ | Full opacity, orange border accent |
| Locked | 🔒 padlock (gray, 24px) | ▽ (non-functional) | 50% opacity, no tap |
| Not started (unlocked) | Gray empty circle | ▽ / ▲ | Full opacity |

**Expanded level** shows module rows indented below it with a subtle left border accent (`#E6873C` 3px).

---

### 6.2 Screen 5b – Module Row inside Expanded Level

Each module row inside an expanded level:

```
┌──────────────────────────────────────────┐
│  [icon]  Module 1                    →   │
│          Completed 4/4 Subtopics         │
└──────────────────────────────────────────┘
```

**Module row icon states** (same as Home screen ModuleRow):

| Progress | Icon | Label |
|----------|------|-------|
| 0% | Gray empty circle, "0%" | Not started |
| 1–99% | Orange arc circle with % (e.g. "75%") | In progress |
| 100% | Solid green circle, white ✓ | Completed |

**Tap action:**
- If module is **locked** (previous module < 100%): row is dimmed, no navigation
- If module is **unlocked**: navigate to `/learn/[levelId]/[moduleId]` (Subtopic List screen)

**Locking rule (subtopic/module level):**
- Within a module: subtopics unlock sequentially — Subtopic N+1 is locked until Subtopic N reaches 100%
- Within a level: Module N+1 is locked until Module N reaches 100%
- Cross-level: Intermediate locked until Beginner 100%, Advance locked until Intermediate 100%

---

### 6.3 Screen 5c – Subtopic List (Module Detail)

Accessed by tapping a module row. Shows the subtopics (lessons) within a module.

**Page Header:**
```
← [Level Name]                    ← back arrow → Learning Path
   [Module Name]                   ← current module name, H2
```

**Dark navy card below header:**
```
┌──────────────────────────────────────────┐
│  [Module Name]                           │  ← navy card
│  Completed X/Y Subtopics                 │
│  [progress bar — orange fill]            │
└──────────────────────────────────────────┘
```

**Subtopic list:**
```
┌──────────────────────────────────────────┐
│  [icon] Subtopic 1 — Introduction    →   │
│         Completed 4/4 Lessons            │  ← if subtopic has lessons
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  [icon] Subtopic 2 — Core Concepts   →   │
│         Completed 3/4 Lessons            │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  🔒 Subtopic 3 (locked)                  │  ← dimmed, no tap
└──────────────────────────────────────────┘
```

**Subtopic row icon states:** Same as module rows (0% gray / 1–99% orange arc / 100% green check).

**Tap action:**
- Locked subtopic: no navigation
- Unlocked subtopic: navigate to `/learn/[levelId]/[moduleId]/[subtopicId]` → Lesson Player (Screen 6)

---

### 6.4 New Content Banner

If new content (new subtopic published to the user's current level) is available, show a banner at the top of the Learning Path page:

```
┌─────────────────────────────────────────┐
│  [dark navy background]           [⭐]  │  ← star badge top-right
│  New Content Available                  │
│  Content: [content description]         │
│  ┌─────────────────────────────────┐    │
│  │ ▶  [Content Title]  Lesson 1 → │    │  ← tap navigates directly to lesson
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- Banner appears only when `type: 'content'` alert exists and is unread
- Tapping the content row marks the alert as read and navigates to the lesson
- Data source: same `AlertCard` interface from Section 10 (`type: 'content'`, `actionUrl` set)

---

### 6.5 API Calls for Learning Path Screen

| Step | API | When |
|------|-----|------|
| 1 | `POST /action/composite/v3/search` (API 13.8) | On page mount — fetch all 3 level courses |
| 2 | `GET /api/course/v1/hierarchy/{courseId}` (API 13.9) | For active level — fetch module/subtopic tree |
| 3 | `POST /tracking/content/course/status` (API 13.12) | For active level — fetch per-subtopic completion |
| 4 | Lazy-load hierarchy + status for other levels | When user taps expand chevron on a collapsed level |

**Caching:** Store hierarchy and status data in component state. Re-fetch on pull-to-refresh only.

---

### 6.6 Component Files

| Component | File | Action |
|-----------|------|--------|
| `LearningPathPage` | `app/learn/page.tsx` | NEW — main Learn tab page |
| `LevelAccordion` | `components/Learn/LevelAccordion.tsx` | NEW — collapsible level row |
| `ModuleRow` | `components/Learn/ModuleRow.tsx` | REUSE from HomeProgression or create shared |
| `SubtopicListPage` | `app/learn/[levelId]/[moduleId]/page.tsx` | NEW — subtopic list |
| `SubtopicRow` | `components/Learn/SubtopicRow.tsx` | NEW — single subtopic row |
| `NewContentBanner` | `components/Learn/NewContentBanner.tsx` | NEW — new content alert card |
| `ProgressCircle` | `components/shared/ProgressCircle.tsx` | NEW — reusable 0%/arc/check circle |

---

## 7. Screen 6 – Subtopic Detail & New Content (3.4)

This page is reached from three entry points: tapping a subtopic row in the Learning Path (Section 6), tapping a new content alert, and tapping a quiz reminder alert. It shows the currently active new-content banner, the active subtopic in progress, and the full subtopic/lesson hierarchy below with sequential locking.

### UI Layout

```
┌──────────────────────────────────────────┐
│  ← [Level Name / Back Label]             │  ← back arrow + level name (e.g. "RBI New Co...")
├──────────────────────────────────────────┤
│  [dark navy banner — New Content]        │  ← shows when a new content alert is active
│  Current: Subtopic [N]                   │     subtitle: "Lesson: Lesson 1"
│  ┌──────────────────────────────────┐    │
│  │  ▶  Lesson 1                 →  │    │  ← orange play button + lesson title
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  Subtopic Progress                       │  ← section heading
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Subtopic 1                 [▽] │    │  ← first subtopic (expanded by default)
│  │  Completed 0/4 Lessons           │    │
│  ├──────────────────────────────────┤    │
│  │    Lesson 1   Topic 1        [▽]│    │  ← lesson rows, indented
│  │    Lesson 2   Topic 2        [▽]│    │
│  │    Lesson 3   Topic 3        [▽]│    │
│  │    Lesson 4   Topic 4        →  │    │  ← tappable lesson (unlocked)
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │  🔒 Subtopic 2               [▽]│    │  ← locked: padlock, dimmed
│  │  Completed 0/4 Lessons           │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │  🔒 Subtopic 3               [▽]│    │
│  │  Completed 0/4 Lessons           │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### Top Banner — New Content (conditional)

Shown only when there is an unread `type: 'content'` alert whose `actionUrl` matches this subtopic/module. Two banner sizes from screenshot dimensions:

| Element | Size | Detail |
|---------|------|--------|
| Banner container | Full width, ~78px tall | Navy `#1C2B4A` background |
| "Current: Subtopic N" subtitle | 360×50 text area | White 14px, subtext: "Lesson: Lesson 1" |
| Lesson card below banner | 360×28 approx. | White card with orange ▶ button + lesson title + → arrow |

If no new content alert: banner is **hidden**; page shows only Subtopic Progress section.

### Subtopic Progress Section

- Lists all subtopics in the current module with their lesson children
- First unlocked subtopic is **auto-expanded** on page load
- Lesson rows within a subtopic show a chevron (▽) when locked, or → arrow when tappable
- Subtopic completion count: `Completed X/Y Lessons`

### Locking Rules (sequential)

- Subtopic 1 always unlocked
- Subtopic N+1 locked until all lessons of Subtopic N are completed (status = 2)
- Within a subtopic: lessons are listed but only the current one is tappable (previous ones show ▽ collapsed)

### Navigation

| Action | Destination |
|--------|-------------|
| Back arrow | `/learn` (Learning Path) |
| Tap lesson row (unlocked) | `/learn/[levelId]/[moduleId]/[subtopicId]` (Lesson Player, Section 8) |
| Tap new-content lesson card | Same as tapping lesson row; marks alert as read |

### API Calls

| Step | API | Purpose |
|------|-----|---------|
| 1 | `GET /api/course/v1/hierarchy/{courseId}` (API 13.9) | Get subtopic + lesson tree for this module |
| 2 | `POST /tracking/content/course/status` (API 13.12) | Get per-lesson completion status for user |

### Component Files

| Component | File | Action |
|-----------|------|--------|
| `SubtopicDetailPage` | `app/learn/[levelId]/[moduleId]/page.tsx` | **UPDATE** — add new content banner |
| `NewContentBannerInline` | `components/Learn/NewContentBannerInline.tsx` | **CREATE** — navy banner with lesson card |
| `SubtopicAccordion` | `components/Learn/SubtopicAccordion.tsx` | **CREATE** — expandable subtopic + lesson list |
| `LessonRow` | `components/Learn/LessonRow.tsx` | **CREATE** — single lesson row (locked / tappable) |

---

## 8. Screen 7 – Lesson Player & Quiz

Accessed when user taps a subtopic/lesson row. Displays the lesson content blobs in sequence.

---

### 8.1 Screen 7a – Lesson Template (Base)

```
┌──────────────────────────────────────────┐
│  ← Lesson 2 — Running the Session       │  ← back arrow + lesson title, 18px bold
├──────────────────────────────────────────┤
│  Lesson Progress                         │  ← section label
│  ████████░░░░░░░░░░░░░░░░░░░░░░  25%   │  ← green fill progress bar, % right-aligned
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │   Scrollable content area        │   │  ← content blobs render here
│  │   (image, video, text blobs,     │   │     orange right-edge scroll indicator
│  │   MCQ, open ended, checkbox)     │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                          │
├──────────────────────────────────────────┤
│  [Previous]    Lesson 2    [  Next  ]    │  ← bottom bar
│  ← outlined                  filled →   │     Previous: outlined white button
└──────────────────────────────────────────┘    Next: orange filled button
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### Lesson Progress Bar

- Green fill (`#28A745`), height 8px, rounded
- Percentage label right-aligned, 12px `#6B7280`
- Progress = `(completedContentBlobs / totalContentBlobs) * 100` within this lesson
- Updated live as user scrolls through/interacts with blobs

### Bottom Navigation Bar (Lesson)

| Element | Style | Behaviour |
|---------|-------|-----------|
| Previous | Outlined button, `border: 1px solid #E6873C`, `color: #E6873C` | Go to previous lesson in subtopic; disabled on first lesson |
| Lesson N label | Center, gray caption | Current lesson position |
| Next | Filled button, `background: #E6873C`, white text | Go to next lesson; on last lesson → trigger completion check |

---

### 8.2 Content Blob Types

The scrollable content area can contain a **mix of the following blob types** in any order:

#### Text Card

```
┌──────────────────────────────────────────┐
│  Text Card                               │  ← label: "Text Card", 12px, navy bg
│  ──────────────────────────────────────  │
│  [Lesson Title or paragraph headline]    │  ← 16px bold, #1F2937
│  [Descriptive subtitle or topic label]   │  ← 14px, #E6873C (orange accent)
└──────────────────────────────────────────┘
```

- Card has dark navy (`#1C2B4A`) header strip with "Text Card" label in white
- Title: 16px bold `#1F2937`
- Subtitle: 14px `#E6873C`

#### Video Blob

```
┌──────────────────────────────────────────┐
│  Video                                   │  ← label: "Video", top-left, white on dark
│  ┌──────────────────────────────────┐    │
│  │         [dark background]        │    │  ← video player area (16:9)
│  │              [ ▶ ]               │    │     orange play button centered
│  │  ────────────────────────────── │    │     orange progress scrubber
│  │  3:45                      8:00  │    │     time elapsed / total duration
│  └──────────────────────────────────┘    │
│  Video title — topic and duration        │  ← caption below, 12px gray
└──────────────────────────────────────────┘
```

- Video player: 16:9 ratio, dark background
- Play button: `#E6873C` circular button, white ▶ icon, 48px
- Progress bar: orange fill over gray track
- Caption below: video title + duration, 12px `#6B7280`
- Supports: `video/mp4`, YouTube embed, streaming URLs

#### Image Blob

```
┌──────────────────────────────────────────┐
│  Image                                   │  ← label
│  ┌──────────────────────────────────┐    │
│  │        [image renders here]      │    │  ← full-width, max-height 240px, cover
│  └──────────────────────────────────┘    │
│  [Optional image caption]                │  ← 12px gray
└──────────────────────────────────────────┘
```

#### PDF / Document Blob

```
┌──────────────────────────────────────────┐
│  Document                                │  ← label
│  ┌──────────────────────────────────┐    │
│  │  📄  [Document Title]            │    │  ← card with document icon
│  │  Tap to open                     │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

Tap → open PDF in an in-app viewer overlay or new tab.

#### MCQ (Multiple Choice Question)

```
┌──────────────────────────────────────────┐
│  Question                                │  ← label
│  [Question text]                         │  ← 14px bold
│                                          │
│  ○ Option A                              │  ← radio buttons
│  ○ Option B                              │
│  ○ Option C                              │
│  ○ Option D                              │
│                                          │
│  [Submit]                                │  ← orange filled button
│  [Correct! / Incorrect. Answer is X]    │  ← shown after submit
└──────────────────────────────────────────┘
```

- After submit: correct → option turns green; incorrect → selected turns red, correct turns green
- MCQ completion required before "Next" navigates

#### Open-Ended Question

```
┌──────────────────────────────────────────┐
│  Question                                │
│  [Question text]                         │
│  ┌──────────────────────────────────┐    │
│  │  Type your answer here...        │    │  ← multi-line textarea, min 80px
│  └──────────────────────────────────┘    │
│  [Submit]                                │
└──────────────────────────────────────────┘
```

#### Checkbox (Multi-select)

```
┌──────────────────────────────────────────┐
│  Select all that apply                   │
│  [Question text]                         │
│                                          │
│  ☐ Option A                              │  ← checkboxes
│  ☐ Option B                              │
│  ☐ Option C                              │
│                                          │
│  [Submit]                                │
└──────────────────────────────────────────┘
```

---

### 8.3 Lesson Completion Logic

- **Lesson = one subtopic page** in the hierarchy
- "Next" on the final blob of a lesson → mark lesson as complete via tracking API
- If last lesson in subtopic → trigger **Subtopic Complete** flow (Screen 7, Section 8.1)
- If lesson is not last → navigate to next lesson in same subtopic

### Tracking API Call on Lesson Complete

**`POST /interface/v1/tracking/content/course/status/update`** *(or equivalent update endpoint)*

```json
{
  "userId": "<userId>",
  "courseId": "<levelCourseId>",
  "contentId": "<subtopicId>",
  "status": 2,
  "completionPercentage": 100
}
```

---

### 8.4 Lesson Player — Orange Scroll Indicator

- A thin orange vertical bar (`#E6873C`, width 4px, border-radius 2px) appears on the **right edge** of the content area
- It represents scroll position within the current lesson blob area
- Thumb position = `scrollTop / (scrollHeight - clientHeight)`

---

### 8.5 Component Files (Lesson Player)

| Component | File | Action |
|-----------|------|--------|
| `LessonPage` | `app/learn/[levelId]/[moduleId]/[subtopicId]/page.tsx` | NEW |
| `LessonProgressBar` | `components/Lesson/LessonProgressBar.tsx` | NEW |
| `ContentBlobRenderer` | `components/Lesson/ContentBlobRenderer.tsx` | NEW — switch on blob type |
| `TextCardBlob` | `components/Lesson/blobs/TextCardBlob.tsx` | NEW |
| `VideoBlob` | `components/Lesson/blobs/VideoBlob.tsx` | NEW |
| `ImageBlob` | `components/Lesson/blobs/ImageBlob.tsx` | NEW |
| `DocumentBlob` | `components/Lesson/blobs/DocumentBlob.tsx` | NEW |
| `MCQBlob` | `components/Lesson/blobs/MCQBlob.tsx` | NEW |
| `OpenEndedBlob` | `components/Lesson/blobs/OpenEndedBlob.tsx` | NEW |
| `CheckboxBlob` | `components/Lesson/blobs/CheckboxBlob.tsx` | NEW |
| `LessonBottomBar` | `components/Lesson/LessonBottomBar.tsx` | NEW |

---

### 8.6 Quiz Flow (4.0a → 4.0b → 4.0c)

A Quiz is a special lesson type within the lesson player, triggered when the lesson's content includes a `QuestionSet` primary category. It occupies the full lesson slot and replaces the standard blob rendering for that lesson.

---

#### 8.6a – Quiz Start Screen (4.0a)

Shown as the **first blob(s)** of a quiz lesson before the user begins answering questions.

```
┌──────────────────────────────────────────┐
│  ← Lesson                                │
├──────────────────────────────────────────┤
│  Lesson Progress          [████░░░░ 25%] │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Text Card                        │   │  ← navy header strip
│  │ Lesson 2 — Running the Session   │   │  ← lesson title
│  │ Quiz                             │   │  ← orange subtitle label
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Text Card                        │   │  ← navy header strip
│  │ Before you begin                 │   │  ← 16px bold
│  │ Card Subheading — secondary label│   │  ← 12px gray caption
│  │                                  │   │
│  │ Read each question carefully     │   │  ← instruction body text, 14px
│  │ before selecting an answer.      │   │
│  │                                  │   │
│  │ You can skip a question and      │   │
│  │ return to it later.              │   │
│  │                                  │   │
│  │ Score 70% or above to pass and   │   │
│  │ unlock the next lesson.          │   │  ← pass threshold always 70%
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Text Card                        │   │
│  │ 3/5          Quiz Attempts       │   │  ← attempts used / max attempts
│  │ Remaining                        │   │  ← "Remaining" label in orange
│  └──────────────────────────────────┘   │
│                                          │
│  [S] [J]  ← collaborator avatars        │  ← if shared/group quiz (optional)
│                                          │
├──────────────────────────────────────────┤
│  [Previous]   Lesson 2   [  Next  ]      │
└──────────────────────────────────────────┘
```

**Quiz Start Card fields:**

| Field | Source | Display |
|-------|--------|---------|
| Lesson title | `content.name` | 16px bold |
| "Quiz" label | Hardcoded / `primaryCategory === 'QuestionSet'` | Orange 14px |
| Instructions text | From `content.instructions` or hardcoded defaults | Body 14px |
| Pass threshold | 70% (fixed) | Body text |
| Attempts remaining | `maxAttempts - attemptsMade` from API 13.15 | "X/Y Quiz Attempts Remaining" |

**Behaviour:**
- Tapping **Next** from the start screen advances to the first MCQ question
- If `attemptsRemaining === 0` → show message "No attempts remaining. You cannot retake this quiz." and disable Next

---

#### 8.6b – Quiz MCQ Question Screen (4.0b)

Each quiz question renders as a **Multiple Choice Question blob** inside the lesson player. Questions are displayed one at a time, replacing the scrollable content area.

```
┌──────────────────────────────────────────┐
│  ← Lesson                                │
├──────────────────────────────────────────┤
│  Lesson Progress          [████░░░░ 35%] │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Multiple Choice Question         │   │  ← navy header strip, white label
│  │ Quiz                             │   │  ← category label below strip
│  │                                  │   │
│  │ Which document must be completed │   │  ← question text, 14px bold
│  │ during a household income survey?│   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ A  Swadhaar Household Form    (●)│   │  ← selected: orange fill radio
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ B  SHG Attendance Register    ○  │   │  ← unselected: empty radio
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ C  Aadhaar Card Copy          ○  │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ D  Bank Passbook              ○  │   │
│  └──────────────────────────────────┘   │
│                                          │
├──────────────────────────────────────────┤
│  [Previous]   Lesson 2   [  Next  ]      │
└──────────────────────────────────────────┘
```

**MCQ Option Styling:**

| State | Border | Radio | Background |
|-------|--------|-------|------------|
| Unselected | `#E5E7EB` 1px | Empty circle | White |
| Selected | `#E6873C` 2px | `#E6873C` filled | `#FEF3E8` tint |
| Correct (after submit) | `#28A745` 2px | Green filled ✓ | `#F0FFF4` |
| Incorrect (after submit) | `#DC3545` 2px | Red | `#FFF5F5` |

**Letter badge (A / B / C / D):**
- Left of option text
- Circle 24px, `#1C2B4A` background, white text 12px bold
- Selected: changes to `#E6873C` background

**Behaviour:**
- User selects one option → Next button becomes active
- Tapping **Next** on a question → advances to next question in the set
- Questions can be skipped (user taps Next without selecting) — unanswered counts as incorrect in scoring
- Progress bar increments per question answered

---

#### 8.6c – Quiz Result Screen (4.0c)

Shown after the user taps Next on the last question of the quiz.

```
┌──────────────────────────────────────────┐
│  ← Lesson                                │
├──────────────────────────────────────────┤
│  Lesson Progress          [████░░░░ 25%] │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Image                            │   │  ← "Image / Illustration" label
│  │ ┌──────────────────────────────┐ │   │
│  │ │  [large green circle ✓]      │ │   │  ← green fill circle 80px, white ✓
│  │ │                              │ │   │     animated scale-in (same as completion)
│  │ └──────────────────────────────┘ │   │
│  │  Quiz Completed                  │   │  ← 18px bold, #28A745 green
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Text Card                        │   │  ← navy header strip
│  │ 2/4          Quiz Results        │   │  ← score: correct / total
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Text Card                        │   │  ← per-question result card
│  │ Q1: [Question text]              │   │
│  │ Incorrect                        │   │  ← red "Incorrect" / green "Correct"
│  │ Correct answer: [answer]         │   │  ← shown only on incorrect
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │ Text Card                        │   │
│  │ Q2: ...                          │   │  ← repeat for all questions
│  └──────────────────────────────────┘   │
│                                          │
├──────────────────────────────────────────┤
│  [Previous]   Lesson 2   [  Next  ]      │  ← Next proceeds to next lesson
└──────────────────────────────────────────┘
```

**Pass / Fail Logic:**

| Condition | Result |
|-----------|--------|
| Score ≥ 70% | Passed — "Quiz Completed" shown in green; Next proceeds to next lesson |
| Score < 70% | Failed — "Quiz Failed" shown in red; show "Retry Quiz" button if attempts remain |
| No attempts remain + failed | Show "No attempts remaining" message; Next disabled |

**Quiz Results card fields:**
- Score: `X/Y` (correct answers / total questions)
- Below score: per-question result cards (Q1, Q2… each with Correct / Incorrect + correct answer on wrong)

**Retry Quiz button (only on fail + attempts remain):**
- Full-width orange button: "Retry Quiz"
- Tapping restarts from 4.0b (first question); attempt count decremented on each submit

---

### 8.7 Quiz API Calls

| Step | API | Call |
|------|-----|------|
| 1 | Composite Search — QuestionSet filter (API 13.16) | Fetch quiz questions for this lesson |
| 2 | Get quiz attempt status (API 13.15) | Check `attemptsRemaining` before rendering start screen |
| 3 | Submit quiz result (API 13.15 update) | After last question answered — POST score + answers |

---

---

## 9. Screen 8 – Completion Screens

Three distinct completion screens triggered sequentially as the user finishes content.

---

### 9.1 Screen 8a – Subtopic Complete (5.1)

Triggered: User taps "Next" on the last lesson of a subtopic.

```
┌──────────────────────────────────────────┐
│  ← Lesson                                │  ← back arrow + "Lesson" label
├──────────────────────────────────────────┤
│                                          │
│         ┌──────────────────┐             │
│         │   ✓              │             │  ← large green filled circle, white ✓
│         │  (80px diameter) │             │     animated: scale in from 0 → 1
│         └──────────────────┘             │
│                                          │
│         Subtopic Complete!               │  ← 20px bold, #28A745 green
│                                          │
├──────────────────────────────────────────┤
│  Up Next                                 │  ← section heading
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Subtopic 3          [▽ / ▲]    │    │  ← next subtopic header, expandable
│  │  Completed 0/4 Lessons           │    │
│  ├──────────────────────────────────┤    │
│  │  0%  Lesson 1                →  │    │  ← lessons within next subtopic
│  │  0%  Lesson 2                →  │    │
│  │  0%  Lesson 3                →  │    │
│  │  0%  Lesson 4                →  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │      Start Subtopic [N]          │    │  ← full-width orange filled button
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

**Behaviour:**
- Check icon animates in (scale 0 → 1, 400ms ease-out)
- "Up Next" section shows the **next subtopic** in the same module with its lessons pre-listed
- If this was the last subtopic in the module → trigger Module Complete (8.2) instead
- CTA button: "Start Subtopic [N]" → navigates directly to first lesson of next subtopic

---

### 9.2 Screen 8b – Module Complete (5.2)

Triggered: User completes the last subtopic in a module.

```
┌──────────────────────────────────────────┐
│  ← Module                                │
├──────────────────────────────────────────┤
│                                          │
│         ┌──────────────────┐             │
│         │   ✓              │             │  ← large green filled circle, white ✓
│         │  (80px diameter) │             │     animated: scale in
│         └──────────────────┘             │
│                                          │
│         Module Complete!                 │  ← 20px bold, #28A745
│                                          │
├──────────────────────────────────────────┤
│  Up Next                                 │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Module 2                [▽/▲]   │    │  ← next module header, expandable
│  │  Completed 0/4 Lessons           │    │
│  ├──────────────────────────────────┤    │
│  │  0%  Subtopics 1             →  │    │  ← subtopics within next module
│  │  0%  Subtopics 2             →  │    │
│  │  0%  Subtopic 3              →  │    │
│  │  0%  Subtopic 4              →  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │      Start Module [N]            │    │  ← full-width orange button
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

**Behaviour:**
- Same animation as subtopic complete
- "Up Next" section shows **next module** with its subtopics pre-listed
- If this was the last module in the level → trigger Level Complete (8.3) instead
- CTA button: "Start Module [N]"

---

### 9.3 Screen 8c – Level Complete / Congratulations (5.3)

Triggered: User completes the last module in a level.

```
┌──────────────────────────────────────────┐
│  ← Level                                 │
├──────────────────────────────────────────┤
│                                          │
│         ┌──────────────────┐             │
│         │   ★              │             │  ← large GOLD/YELLOW circle
│         │  (80px diameter) │             │     star icon (outlined ☆ → filled ★)
│         └──────────────────┘             │  ← animated: outer ring pulses once
│                                          │
│         Congratulations!                 │  ← 22px bold, #E6873C orange
│  You have finished [Level Name]          │  ← 14px gray subtitle
│                                          │
├──────────────────────────────────────────┤
│  [Next Level Name] Unlocked              │  ← section heading, e.g. "Intermediate Level Unlocked"
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  [Next Level Name]        [▽/▲] │    │  ← next level header, expandable
│  │  Completed 0/N modules           │    │
│  ├──────────────────────────────────┤    │
│  │  0%  Module 1                →  │    │  ← modules in next level
│  │  0%  Module 2                →  │    │
│  │  0%  Module 3                →  │    │
│  │  0%  Module 4                →  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌────────────────┐  ┌────────────────┐  │
│  │Download Cert.  │  │ Start Next     │  │  ← two buttons side by side
│  │(outlined)      │  │ Level (filled) │  │
│  └────────────────┘  └────────────────┘  │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

**Behaviour:**
- Gold circle with star icon (yellow/amber, distinct from green used in subtopic/module)
- "Congratulations!" in orange `#E6873C`
- Section heading: "[Next Level] Unlocked" (e.g., "Intermediate Level Unlocked")
- Shows all modules of the unlocked next level, all at 0% initially
- **If Advance Level is completed** (final level): hide "Start Next Level", show only "Download Certificate"
- **Download Certificate** button: calls certificate download API, opens PDF

### 9.4 Completion Screen — Back Navigation

| Screen | Back button label | Back destination |
|--------|-------------------|------------------|
| Subtopic Complete | "Lesson" | Learning Path / subtopic list |
| Module Complete | "Module" | Learning Path / module list |
| Level Complete | "Level" | Learning Path / level overview |

### 9.5 Completion Animations

| Element | Animation | Duration |
|---------|-----------|----------|
| Green ✓ circle (subtopic/module) | scale(0) → scale(1) ease-out | 400ms |
| Gold ★ circle (level) | scale(0) → scale(1) + outer ring pulse | 600ms |
| Text below icon | fade-in after circle animation | 200ms delay |

---

### 9.6 Component Files (Completion)

| Component | File | Action |
|-----------|------|--------|
| `SubtopicCompletePage` | `app/learn/complete/subtopic/page.tsx` | NEW |
| `ModuleCompletePage` | `app/learn/complete/module/page.tsx` | NEW |
| `LevelCompletePage` | `app/learn/complete/level/page.tsx` | NEW |
| `CompletionHero` | `components/Completion/CompletionHero.tsx` | NEW — animated circle + text |
| `UpNextAccordion` | `components/Completion/UpNextAccordion.tsx` | NEW — expandable next-item preview |
| `CompletionCTA` | `components/Completion/CompletionCTA.tsx` | NEW — Start / Download Certificate buttons |

---

## 12. Level & Module Progression Logic

### Data Flow on Home Screen Load

```
LoginSuccess / HomeMount
  │
  ├─ Step 1: GET /user/read/{userId}?fieldvalue=true
  │     → Fetch user profile, designation, customFields
  │
  ├─ Step 2: POST /action/composite/v3/search
  │     → filters: { status: ["live"], primaryCategory: ["Course"], channel: "swadhaar-channel" }
  │     → Returns all published courses
  │     → Filter client-side to: "Beginner Level", "Intermediate Level", "Advance Level"
  │
  └─ Step 3: Merge user progress + course data
        → Calculate completedModules / totalModules per level
        → Render UserLevelCard with 3 level rows
        → Render LevelModuleList for active level
```

### Level Unlock Logic

```typescript
const isLevelUnlocked = (
  levelName: 'Beginner Level' | 'Intermediate Level' | 'Advance Level',
  userProgress: UserProgress
) => {
  if (levelName === 'Beginner Level') return true;
  if (levelName === 'Intermediate Level') return userProgress['Beginner Level'] === 100;
  if (levelName === 'Advance Level') return userProgress['Intermediate Level'] === 100;
};
```

### Module / Subtopic Sequential Unlock

```typescript
// Within a module: Subtopic N+1 locked until Subtopic N === 100%
const isSubtopicUnlocked = (index: number, subtopicStatuses: SubtopicStatus[]) => {
  if (index === 0) return true; // first subtopic always unlocked
  return subtopicStatuses[index - 1].completionPercentage === 100;
};

// Within a level: Module N+1 locked until Module N === 100%
const isModuleUnlocked = (index: number, moduleStatuses: ModuleStatus[]) => {
  if (index === 0) return true;
  return moduleStatuses[index - 1].completionPercentage === 100;
};
```

### Progress Indicator States

```
completionPercent:
  0%    → gray empty circle + "0%" label (no fill)
  1–99% → orange arc progress circle + "X%" label (SVG arc or CSS conic-gradient)
  100%  → solid green circle (#28A745) with white ✓ checkmark
```

### Progress Calculation

```
levelProgress  = (completedModules / totalModulesInLevel)      * 100
moduleProgress = (completedSubtopics / totalSubtopicsInModule) * 100
subtopicProgress = (completedLessons / totalLessonsInSubtopic) * 100

// completedModules / completedSubtopics = from API 13.12 (tracking/content/course/status)
//   where status === 2 (completed)
// totals = from API 13.9 (course hierarchy, leafNodesCount / children[].length)
```

### API Failure Handling

| API | Failure Behaviour |
|-----|-------------------|
| `GET /user/read/{userId}` | Show skeleton; retry after 2s; fallback "Namaste!" |
| `POST /composite/v3/search` | Show skeleton; retry; show "—" progress + inline error |
| Both fail | Show Home with skeleton/error states — do NOT redirect to login |

---

## 10. Screen 9 – Alerts & Notifications

### 10.1 Screen 9a – Alerts List (7.1)

Accessed by tapping the 🔔 bell icon on the Home screen or any header. Shows a grouped, dated list of all notifications.

```
┌──────────────────────────────────────────┐
│  ← Alerts                                │  ← back arrow + "Alerts" title, 20px bold
├──────────────────────────────────────────┤
│  Today                                   │  ← date group heading, 12px gray uppercase
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [🟠]  Quiz Reminder           → │    │  ← orange circle icon + title + arrow
│  │       You have an incomplete    │    │     unread: white bg, slightly elevated
│  │       quiz in [Sub topic 1]     │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [🟠]  New Content Reminder    → │    │
│  │       Please complete new       │    │
│  │       content. [New content 1]  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [🟠]  Lesson Reminder         → │    │
│  │       You have an incomplete    │    │
│  │       lesson in [Sub topic 1]   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [👤]  Trainer Feedback Received→ │    │  ← person icon (feedback type)
│  │       You have received feedback│    │
│  │       from CFL Incharge         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [🏅]  Beginner Level Completed → │    │  ← badge icon (achievement type)
│  │       Download Certificate for  │    │
│  │       level completion          │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### Alert List Row Design

| Element | Spec |
|---------|------|
| Row height | Min 72px, auto-height for long messages |
| Icon | 40px circle; color and glyph per type (see below) |
| Title | 14px 600 `#1F2937` |
| Message | 12px 400 `#6B7280`, 2 lines max then truncate |
| Right arrow | `→` `#9CA3AF`, 16px |
| Unread row | White bg `#FFFFFF`, subtle shadow `0 1px 4px rgba(0,0,0,0.08)` |
| Read row | `#F9FAFB` bg, no shadow |
| Tap | Mark as read → navigate to detail (see table below) |

### Alert Type Icons

| Type | Icon | Icon bg color |
|------|------|--------------|
| `quiz` | 📝 or quiz glyph | `#E6873C` orange |
| `content` | 📄 or content glyph | `#E6873C` orange |
| `lesson` | 📖 | `#E6873C` orange |
| `feedback` | 👤 person | `#E6873C` orange |
| `badge` | 🏅 medal | `#E6873C` orange |
| `system` | ℹ️ info | `#6B7280` gray |

### Date Grouping

- Alerts grouped under date headers: **Today**, **Yesterday**, **[Date string]**
- Within each group, sorted newest first
- If list is empty: show centered empty state — "No notifications yet" in `#6B7280`

### Tap Navigation by Alert Type

| Alert type | Destination |
|-----------|-------------|
| `quiz` | Quiz Start screen (8.6a) for the relevant lesson |
| `content` | Subtopic Detail page (Section 7) with new content banner |
| `lesson` | Lesson Player (Section 8) directly at the incomplete lesson |
| `feedback` | Feedback Read view (Section 11.2) |
| `badge` | Level Complete screen (Section 9.3) or certificate download |
| `system` | Inline expanded message (no navigation) |

### Mark as Read

- Tapping any alert row marks it as read immediately (optimistic update)
- Unread count on bell icon decrements accordingly
- **No notification API available in Phase 1** — alerts are stored in `localStorage` and managed client-side
- Alert data is seeded from the following sources:

| Alert trigger | Data source | When created |
|--------------|-------------|-------------|
| Incomplete quiz | Client-side: when quiz progress status = in-progress and lesson navigated away | On home load |
| New content | Client-side: when composite search returns a course with `lastUpdatedOn` > last login | On home load |
| Incomplete lesson | Client-side: subtopic status = 1 (in-progress) | On home load |
| Trainer feedback | External: pushed via backend (Phase 2); in Phase 1 seed from localStorage mock | Phase 2 |
| Badge / level complete | Client-side: when level `completionPercentage` reaches 100 | After tracking update |

### localStorage Alert Schema

```typescript
// Key: 'swadhaar_alerts'
// Value: JSON.stringify(AlertCard[])

interface AlertCard {
  id: string;                      // uuid
  title: string;
  message: string;
  timestamp: string;               // ISO date string
  type: 'quiz' | 'content' | 'lesson' | 'feedback' | 'badge' | 'system';
  isRead: boolean;
  actionUrl?: string;              // e.g. "/learn/levelId/moduleId/subtopicId"
  metadata?: {
    courseId?: string;
    moduleId?: string;
    subtopicId?: string;
    feedbackId?: string;           // for feedback type
  };
}
```

### Component Files

| Component | File | Action |
|-----------|------|--------|
| `AlertsPage` | `app/alerts/page.tsx` | **CREATE** |
| `AlertListRow` | `components/Alerts/AlertListRow.tsx` | **CREATE** |
| `AlertDateGroup` | `components/Alerts/AlertDateGroup.tsx` | **CREATE** |
| `alertsStore` | `utils/alertsStore.ts` | **CREATE** — localStorage CRUD helpers |

---

### 10.2 Screen 9b – Feedback Read View (7.2)

Accessed by tapping a `feedback` type alert row.

```
┌──────────────────────────────────────────┐
│  ← Feedback                              │  ← back arrow + "Feedback" title, 20px bold
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [dark navy card]                 │    │  ← sender info card, #1C2B4A bg
│  │ CFL Incharge: Jaya K             │    │  ← sender name, white 16px bold
│  │ SDI Manager — CFL Mumbai         │    │  ← sender designation, orange 12px
│  │                          [👤]    │    │  ← sender avatar circle, right-aligned 40px
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Message                          │    │  ← "Message" label, 12px gray uppercase
│  │                                  │    │
│  │ Hi Jaya — great to see your      │    │  ← message body, 14px #1F2937
│  │ progress! Just a nudge to revisit│    │
│  │ Module 2 Concept before your     │    │
│  │ next field session. You're       │    │
│  │ almost there! 👍                 │    │
│  └──────────────────────────────────┘    │
│                                          │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### Feedback Sender Card

| Element | Spec |
|---------|------|
| Card background | `#1C2B4A` (dark navy) |
| Border radius | `lg` (16px) |
| Sender name | White, 16px, weight 600 — format: `"[Role]: [Name]"` e.g. `"CFL Incharge: Jaya K"` |
| Designation line | `#E6873C` orange, 12px — format: `"[Title] — [Location]"` e.g. `"SDI Manager — CFL Mumbai"` |
| Avatar | 40px circle, right side; initials fallback if no photo (white text on `#E6873C` bg) |

### Message Card

| Element | Spec |
|---------|------|
| "Message" label | 12px `#6B7280`, uppercase, below sender card |
| Message body | White card `#FFFFFF`, `border: 1px solid #E5E7EB`, border-radius `md`, padding `md` |
| Body text | 14px `#1F2937`, line-height 1.6 |
| Emoji support | Render inline |

### Feedback Data Source

In Phase 1, feedback data is stored in the `AlertCard.metadata` object when the alert is created:

```typescript
// AlertCard for feedback type
{
  id: "fb-001",
  type: "feedback",
  title: "Trainer Feedback Received",
  message: "You have received feedback from CFL Incharge",
  timestamp: "2026-04-24T10:00:00Z",
  isRead: false,
  metadata: {
    feedbackId: "fb-001",
    senderName: "Jaya K",
    senderRole: "CFL Incharge",
    senderDesignation: "SDI Manager",
    senderLocation: "CFL Mumbai",
    senderAvatar: null,          // null = show initials
    messageBody: "Hi Jaya — great to see your progress!..."
  }
}
```

The Feedback Read page reads this metadata from the alert record (no separate API call needed in Phase 1).

### Component Files

| Component | File | Action |
|-----------|------|--------|
| `FeedbackPage` | `app/alerts/feedback/[id]/page.tsx` | **CREATE** |
| `FeedbackSenderCard` | `components/Alerts/FeedbackSenderCard.tsx` | **CREATE** |
| `FeedbackMessageCard` | `components/Alerts/FeedbackMessageCard.tsx` | **CREATE** |

---

## 11. Screen 10 – Profile (9.1 & 9.1b)

Accessed from the **Profile tab** in the bottom nav or tapping the avatar on the Home screen.

### 11.1 UI Layout — Read Mode (9.1)

```
┌──────────────────────────────────────────┐
│  Profile                    [🔔 Alerts]  │  ← page title + bell top-right
├──────────────────────────────────────────┤
│                                          │
│         ┌──────────────┐                 │
│         │    PK        │                 │  ← initials avatar, 80px circle
│         │  (initials)  │                 │     bg: #E6873C, white text 24px bold
│         └──────────────┘                 │     if photo uploaded: show photo
│                                          │
│    ┌──────────────────────────────────┐  │
│    │      Upload Photo                │  │  ← full-width orange outlined button
│    └──────────────────────────────────┘  │     #E6873C border + text, white bg
│                                          │
│  Language                                │  ← field label 12px gray
│  ┌──────────────────────────────────┐   │
│  │ English                      [▽] │   │  ← READ-WRITE: dropdown, editable
│  └──────────────────────────────────┘   │     chevron on right = selectable
│                                          │
│  Name                                    │  ← field label 12px gray
│  ┌──────────────────────────────────┐   │
│  │ Priya K.                     [✏] │   │  ← READ-WRITE: pencil/edit icon right
│  └──────────────────────────────────┘   │     only editable field besides Language
│                                          │
│  Designation                             │
│  ┌──────────────────────────────────┐   │
│  │ Trainer                          │   │  ← READ-ONLY: no icon, grayed input style
│  └──────────────────────────────────┘   │
│                                          │
│  CFL Location                            │
│  ┌──────────────────────────────────┐   │
│  │ CFL Jharkhand — Torpa            │   │  ← READ-ONLY
│  └──────────────────────────────────┘   │
│                                          │
│  Mobile Number                           │
│  ┌──────────────────────────────────┐   │
│  │ 9876543210                       │   │  ← READ-ONLY
│  └──────────────────────────────────┘   │
│                                          │
│  Email                                   │
│  ┌──────────────────────────────────┐   │
│  │ priya.k@swadhaar.org             │   │  ← READ-ONLY
│  └──────────────────────────────────┘   │
│                                          │
│  Joining Date                            │
│  ┌──────────────────────────────────┐   │
│  │ 12/03/2026                       │   │  ← READ-ONLY
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │            Logout                │   │  ← full-width outlined red button
│  └──────────────────────────────────┘   │     border: #DC3545, text: #DC3545
│                                          │
├──────────────────────────────────────────┤
│  [🏠 Home]   [📖 Learn]   [👤 Profile]  │
└──────────────────────────────────────────┘
```

### 11.2 Field Editability Rules

| Field | Editable | Interaction |
|-------|----------|-------------|
| Language | ✅ Yes | Dropdown (▽ chevron); changes app language via `i18next.changeLanguage()` + localStorage |
| Name | ✅ Yes | Pencil (✏) icon on right; tap enters edit mode (9.1b) |
| Designation | ❌ Read-only | No icon; grayed text `#9CA3AF`; non-tappable |
| CFL Location | ❌ Read-only | No icon; grayed |
| Mobile Number | ❌ Read-only | No icon; grayed |
| Email | ❌ Read-only | No icon; grayed |
| Joining Date | ❌ Read-only | No icon; grayed |

**Read-only field style:**
- Background: `#F5F5F5`
- Text color: `#9CA3AF`
- Border: `#E5E7EB` 1px
- Cursor: `not-allowed`

**Editable field style (default/read mode):**
- Background: `#FFFFFF`
- Text color: `#1F2937`
- Border: `#E5E7EB` 1px
- Right icon visible

---

### 11.3 UI Layout — Name Edit Mode (9.1b)

When the user taps the pencil icon on the Name field:

```
┌──────────────────────────────────────────┐
│  Profile                    [🔔 Alerts]  │
├──────────────────────────────────────────┤
│  [same avatar + Upload Photo]            │
│                                          │
│  Language                                │
│  ┌──────────────────────────────────┐   │
│  │ English                      [▽] │   │  ← language still shows dropdown
│  └──────────────────────────────────┘   │
│                                          │
│  Name                                    │
│  ┌──────────────────────────────────┐   │
│  │ Priya K.                     [✏] │   │  ← field becomes active text input
│  └──────────────────────────────────┘   │     border: 2px solid #E6873C (orange focus)
│  [Cancel]                    [Save]      │  ← inline action buttons below name field
│   gray outlined              orange filled
│                                          │
│  [all other fields same as read mode]   │
│                                          │
│  [Logout button]                         │
└──────────────────────────────────────────┘
```

**Edit Mode Behaviour:**

| Action | Behaviour |
|--------|-----------|
| Tap ✏ (pencil) | Name input becomes editable; `border: 2px solid #E6873C`; keyboard opens; Cancel + Save appear below |
| Tap Cancel | Reverts to original name; closes edit mode; no API call |
| Tap Save (empty name) | Show inline error: "Name cannot be empty" in `#DC3545` below field |
| Tap Save (valid name) | Call `PATCH /user/update` (API 13.17); show loading spinner in Save button; on success → toast "Name updated successfully"; close edit mode |
| Save error | Toast error: "Failed to update name. Please try again." |

**Cancel button:**
- `border: 1px solid #9CA3AF`, `color: #6B7280`, white bg, `border-radius: pill`

**Save button:**
- `background: #E6873C`, white text, `border-radius: pill`
- Shows spinner while API call in progress; disabled during call

---

### 11.4 Avatar

| State | Display |
|-------|---------|
| No photo | Initials circle: `#E6873C` bg, white text 24px bold (e.g. "PK" for "Priya K.") |
| Photo uploaded | Circular crop, 80px diameter |

**Upload Photo button:**
- Tapping opens native file picker (image only — `accept="image/*"`)
- On file selected → upload to server (API TBD Phase 2) → update avatar preview optimistically
- In Phase 1: store selected image as base64 in `localStorage('profilePhoto')` and display locally

---

### 11.5 Language Dropdown

Tapping the Language field (▽ chevron) opens a bottom sheet or inline dropdown:

```
┌──────────────────────────────────────────┐
│ ● English                                │  ← selected: orange radio
│ ○ Hindi (हिंदी)                          │
│ ○ Marathi (मराठी)                        │
└──────────────────────────────────────────┘
```

On selection:
1. `localStorage.setItem('selectedLanguage', code)`
2. `i18next.changeLanguage(code)` → UI re-renders in new language immediately
3. Dropdown closes; Language field shows new selection

---

### 11.6 Logout Button

- Full-width, outlined style: `border: 1.5px solid #DC3545`, `color: #DC3545`, white bg
- Tap → show confirmation dialog: *"Are you sure you want to log out?"* with Cancel / Log Out buttons
- On confirm: clear `localStorage` (token, userId, name, role, tenantId, academicYearId) → `router.push('/login')`
- Do NOT clear `selectedLanguage` or `profilePhoto` on logout

---

### 11.7 API Calls

| Step | API | When |
|------|-----|------|
| Page mount | `GET /user/read/{userId}?fieldvalue=true` (API 13.7) | Fetch all profile fields |
| Save name | `PATCH /interface/v1/user/update` (API 13.17) | On Save tap in edit mode |
| Language change | None (client-side only) | On dropdown selection |

**Data field mapping from `GET /user/read` response:**

| UI Label | API field |
|----------|-----------|
| Name | `userData.firstName + " " + userData.lastName` |
| Designation | `userData.role` |
| CFL Location | `userData.customFields[fieldId='cflLocation'].value` |
| Mobile Number | `userData.mobile` |
| Email | `userData.email` |
| Joining Date | `userData.createdOn` (format: DD/MM/YYYY) |

---

### 11.8 Component Files

| Component | File | Action |
|-----------|------|--------|
| `ProfilePage` | `app/profile/page.tsx` | **CREATE** |
| `ProfileAvatar` | `components/Profile/ProfileAvatar.tsx` | **CREATE** — initials / photo circle |
| `ProfileField` | `components/Profile/ProfileField.tsx` | **CREATE** — read-only or editable field row |
| `NameEditField` | `components/Profile/NameEditField.tsx` | **CREATE** — edit mode with Cancel/Save |
| `LanguageDropdown` | `components/Profile/LanguageDropdown.tsx` | **CREATE** — bottom sheet language picker |

---

---

## 13. API Reference

All API calls include:
- Header: `tenantid: 35529b5d-526f-4da5-bc6e-64f740023d26`
- Header: `content-type: application/json`
- Base URL: `https://interface.tekdinext.com`

---

### 13.1 Check User Exists

**`POST /interface/v1/user/list`**

Already implemented: `checkUserExistenceWithTenant(mobile, tenantId)`

```json
// Request
{
  "limit": 10,
  "filters": { "role": "Learner", "tenantId": "35529b5d-...", "mobile": "9960228156" },
  "sort": ["firstName", "asc"],
  "offset": 0
}
// Success: { "responseCode": 200, "result": { "getUserDetails": [{ "userId": "...", "status": "active" }] } }
// Not found: { "responseCode": 404, "params": { "status": "failed" } }
```

---

### 13.2 Send OTP

**`POST /interface/v1/user/send-otp`**

Already implemented: `sendOTP({ mobile, reason: 'login' })`

```json
// Request: { "mobile": "9960228156", "reason": "login" }
// Response: { "responseCode": 200, "result": { "data": { "hash": "b790ed..." } } }
```

Store `hash` in component state (NOT localStorage).

---

### 13.3 Verify OTP

**`POST /interface/v1/user/verify-otp`**

Already implemented: `verifyOTP({ mobile, reason, otp, hash })`

```json
// Success: { "responseCode": 200, "params": { "status": "successful" } }
// Failure: { "responseCode": 400, "params": { "status": "failed", "errmsg": "Invalid OTP" } }
```

---

### 13.4 Get Auth Token

**`GET /interface/v1/user/auth`**

Called immediately after verify-otp (cookie set by verify-otp step).

```
// Response: { token, userId, name, role }
// Store: token, userId, name, role, tenantId, academicYearId in localStorage
```

---

### 13.5 Get Tenant Config

**`GET /interface/v1/tenant/read`**

```json
// Response includes: { "tenant": { "contentFilter": { "theme": { "primaryColor": "#E6873C" }, "loginMethod": "otp", "frameworkId": "swadhaar-framework" } } }
```

---

### 13.6 Get Framework (Levels/Modules)

**`GET /interface/v1/api/framework/v1/read/swadhaar-framework`**

```json
// Response: { "framework": { "categories": [{ "code": "beginner", "name": "Beginner Level", "terms": [{ "code": "module-1", "name": "Module 1", "associations": [{ "code": "subtopic-1", "name": "Subtopic Name" }] }] }] } }
```

---

### 13.7 Get User Profile + Progress

**`GET /interface/v1/user/read/{userId}?fieldvalue=true`**

Headers: `Authorization: Bearer <token>`, `academicyearid: <academicYearId>`, `tenantid: 35529b5d-...`

```json
{
  "result": {
    "userData": {
      "userId": "...",
      "firstName": "Priya",
      "role": "Learner",
      "customFields": [
        { "fieldId": "currentLevel", "value": "Advance Level" },
        { "fieldId": "completedLevels", "value": ["Beginner Level", "Intermediate Level"] }
      ]
    }
  }
}
```

---

### 13.8 Fetch Level Courses for Home Screen

**`POST /interface/v1/action/composite/v3/search`**

Headers: `Authorization: Bearer <token>`, `academicyearid: <academicYearId>`, `tenantid: 35529b5d-...`

```json
// Request
{
  "request": {
    "filters": { "status": ["live"], "primaryCategory": ["Course"], "channel": "swadhaar-channel" },
    "query": "",
    "limit": 10,
    "offset": 0
  }
}

// Response (abbreviated)
{
  "responseCode": "OK",
  "result": {
    "count": 3,
    "content": [
      {
        "identifier": "do_xxx_beginner",
        "name": "Beginner Level",
        "leafNodesCount": 12,
        "completionPercentage": 100,
        "children": [
          { "identifier": "do_mod1", "name": "Module 1", "leafNodesCount": 4,
            "children": [{ "identifier": "do_sub1", "name": "Subtopic 1" }] }
        ]
      }
    ]
  }
}
```

**Filter client-side:**
```typescript
const LEVEL_NAMES = ['Beginner Level', 'Intermediate Level', 'Advance Level'];
const levelCourses = response.result.content.filter(course =>
  LEVEL_NAMES.some(name => course.name.toLowerCase() === name.toLowerCase())
);
```

---

### 13.9 Get Course Hierarchy (Module + Subtopic tree)

**`GET /interface/v1/api/course/v1/hierarchy/{courseId}`**

Used when user opens a level — fetches full module/subtopic structure.

```json
{
  "result": {
    "content": {
      "identifier": "do_2144709460532592641110",
      "name": "Advance Level",
      "children": [
        {
          "identifier": "do_mod1",
          "name": "Module 1",
          "primaryCategory": "Course Unit",
          "leafNodesCount": 4,
          "children": [
            {
              "identifier": "do_sub1",
              "name": "Subtopic 1 — Introduction",
              "primaryCategory": "Explanation Content",
              "mimeType": "application/pdf"
            }
          ]
        }
      ]
    }
  }
}
```

**When to call:** On first expand of a level. Cache result per session.

---

### 13.10 Get User Course Progress (Status Get)

**`POST /interface/v1/tracking/user_certificate/status/get`**

Headers: `Authorization: Bearer <token>`, `academicyearid: <academicYearId>`, `tenantid: 35529b5d-...`

```json
// Request
{ "userId": "7f60190c-...", "courseId": "do_2144709460532592641110" }

// Response
{
  "responseCode": 200,
  "result": {
    "data": {
      "userId": "7f60190c-...",
      "courseId": "do_2144709460532592641110",
      "status": "inprogress",
      "completionPercentage": 75,
      "lastAccessedOn": "2026-04-24T08:00:00Z"
    }
  }
}
```

**Status values:** `"notstarted"` | `"inprogress"` | `"completed"`

---

### 13.11 Enroll User in Course (Status Create)

**`POST /interface/v1/tracking/user_certificate/status/create`**

Called only when `status/get` returns no result (user not enrolled yet).

```json
// Request: { "userId": "7f60190c-...", "courseId": "do_2144709460532592641110" }
// Response: { "responseCode": 200, "params": { "status": "successful" } }
```

---

### 13.12 Get Module-level Subtopic Completion Status

**`POST /interface/v1/tracking/content/course/status`**

Headers: `tenantid: 35529b5d-...`, `content-type: application/json`

```json
// Request
{
  "userId": ["7f60190c-..."],
  "courseId": ["do_2144709460532592641110"]
}

// Response
{
  "responseCode": 200,
  "result": {
    "data": [
      { "userId": "7f60190c-...", "courseId": "do_...", "contentId": "do_sub1", "status": 2, "completionPercentage": 100 },
      { "userId": "7f60190c-...", "courseId": "do_...", "contentId": "do_sub2", "status": 1, "completionPercentage": 50 }
    ]
  }
}
```

**Status codes:** `0` = not started | `1` = in progress | `2` = completed

**Frontend use:**
```typescript
// Per-module progress:
const completedSubtopics = subtopicsInModule.filter(s =>
  statusData.find(d => d.contentId === s.identifier)?.status === 2
).length;
const moduleProgress = (completedSubtopics / subtopicsInModule.length) * 100;
```

---

### 13.13 Update Content Progress (Lesson Completion)

**`POST /interface/v1/tracking/content/course/status/update`**

Called when user completes a lesson (taps Next on last blob of a subtopic).

Headers: `Authorization: Bearer <token>`, `tenantid: 35529b5d-...`

```json
// Request
{
  "userId": "7f60190c-...",
  "courseId": "do_2144709460532592641110",
  "contentId": "do_sub1",
  "status": 2,
  "completionPercentage": 100
}

// Response: { "responseCode": 200, "params": { "status": "successful" } }
```

**When to call:** Immediately after user views/completes the last content blob of a subtopic. Fire-and-forget; do not block navigation.

---

### 13.14 Telemetry (Click / Interact Events)

**`POST /v1/telemetry`** (`https://swadhaar-learner.sunbirdsaas.com/v1/telemetry`)

Headers: `Authorization: Bearer <token>`, `x-app-id: shiksha-learner`, `x-channel-id: swadhaar-channel`

```json
{
  "id": "api.sunbird.telemetry",
  "ver": "3.0",
  "ets": 1777021552664,
  "events": [{
    "eid": "INTERACT",
    "ets": 1777021552663,
    "ver": "3.0",
    "actor": { "id": "<userId>", "type": "User" },
    "context": { "channel": "swadhaar-channel", "pdata": { "id": "shiksha-learner", "pid": "learner", "ver": "0.0.1" }, "env": "prod", "uid": "<userId>" },
    "edata": { "id": "course-click", "type": "CLICK", "pageid": "course-<courseId>", "uid": "<userId>" }
  }]
}
```

Fire on: every course/module/lesson card tap. Use existing `telemtery.js` utility.

---

### 13.15 Get / Submit Quiz Attempt Status

**`POST /interface/v1/tracking/assessment/user/read`** *(read attempts)*

Called before rendering the Quiz Start screen to determine how many attempts remain.

Headers: `Authorization: Bearer <token>`, `tenantid: 35529b5d-...`

```json
// Request
{
  "request": {
    "userId": "7f60190c-...",
    "courseId": "do_2144709460532592641110",
    "contentId": "do_quiz_sub1"
  }
}

// Response
{
  "responseCode": 200,
  "result": {
    "data": {
      "userId": "7f60190c-...",
      "courseId": "do_2144709460532592641110",
      "contentId": "do_quiz_sub1",
      "attemptCount": 2,
      "maxAttempts": 5,
      "lastScore": 60,
      "passed": false
    }
  }
}
```

**`POST /interface/v1/tracking/assessment/user/update`** *(submit attempt)*

Called after user answers the last question and results are computed.

```json
// Request
{
  "request": {
    "userId": "7f60190c-...",
    "courseId": "do_2144709460532592641110",
    "contentId": "do_quiz_sub1",
    "attemptId": "attempt_uuid",
    "score": 75,
    "maxScore": 100,
    "passed": true,
    "responses": [
      { "questionId": "q1", "selectedOption": "A", "correct": true },
      { "questionId": "q2", "selectedOption": "C", "correct": false }
    ]
  }
}

// Response: { "responseCode": 200, "params": { "status": "successful" } }
```

**Frontend use:**
```typescript
const attemptsRemaining = data.maxAttempts - data.attemptCount;
// attemptsRemaining === 0 → disable quiz; show "No attempts remaining"
// passed === true → show green Quiz Completed; Next proceeds to next lesson
// passed === false && attemptsRemaining > 0 → show Retry Quiz button
```

---

### 13.16 Fetch QuestionSet (Quiz Questions)

**`POST /interface/v1/action/composite/v3/search`**

Same composite search API (13.8), but filtered for `QuestionSet` primary category to fetch quiz questions for a specific lesson/subtopic.

```json
// Request
{
  "request": {
    "filters": {
      "status": ["live"],
      "primaryCategory": ["QuestionSet"],
      "channel": "swadhaar-channel",
      "identifier": ["do_quiz_sub1"]
    },
    "query": "",
    "limit": 1,
    "offset": 0
  }
}

// Response
{
  "responseCode": "OK",
  "result": {
    "count": 1,
    "content": [
      {
        "identifier": "do_quiz_sub1",
        "name": "Quiz — Running the Session",
        "primaryCategory": "QuestionSet",
        "maxAttempts": 5,
        "totalQuestions": 4,
        "passPercentage": 70,
        "children": [
          {
            "identifier": "q1",
            "name": "Q1: Which document must be completed during a household income survey?",
            "primaryCategory": "MCQ",
            "options": [
              { "id": "A", "label": "Swadhaar Household Form", "isCorrect": true },
              { "id": "B", "label": "SHG Attendance Register", "isCorrect": false },
              { "id": "C", "label": "Aadhaar Card Copy", "isCorrect": false },
              { "id": "D", "label": "Bank Passbook", "isCorrect": false }
            ]
          }
        ]
      }
    ]
  }
}
```

**Frontend use:** Populate quiz question cards (8.6b) in order. Shuffle options client-side if `shuffleOptions: true` in response.

---

### 13.17 Update User Profile (Name)

**`PATCH /interface/v1/user/update`**

Called when user saves an edited name from the Profile page (Section 10.3).

Headers: `Authorization: Bearer <token>`, `tenantid: 35529b5d-...`, `content-type: application/json`

```json
// Request
{
  "request": {
    "userId": "7f60190c-16eb-4583-bbef-c5fc7bc484e7",
    "firstName": "Priya",
    "lastName": "K."
  }
}

// Success Response
{
  "responseCode": 200,
  "params": { "status": "successful" }
}

// Error Response
{
  "responseCode": 400,
  "params": { "status": "failed", "errmsg": "Invalid request" }
}
```

**Frontend handling:**
- On success: update `localStorage.name` with new name; update displayed name immediately (optimistic)
- On error: show toast "Failed to update name. Please try again." and revert input to original name

---

## 14. i18n / Translation Keys

> Use existing `@shared-lib` `useTranslation` hook. Add keys to existing translation files. Do NOT change the i18n library.

### New Keys — All Sections

Add the following to all three locale files (`en.json`, `hi.json`, `mr.json`):

#### English (`en.json`) — additions

```json
{
  "LEARNER_APP.SPLASH.TITLE": "Swadhaar Training Platform",
  "LEARNER_APP.SPLASH.TAGLINE": "Learn. Grow.",
  "LEARNER_APP.SPLASH.POWERED_BY": "Powered by Swadhaar FinAccess",

  "LEARNER_APP.LANGUAGE_SELECTION.TITLE": "Choose Language",
  "LEARNER_APP.LANGUAGE_SELECTION.SUBTITLE": "Select the language you're most comfortable with",
  "LEARNER_APP.LANGUAGE_SELECTION.CONTINUE": "Continue",

  "LEARNER_APP.LOGIN.WELCOME": "Welcome!",
  "LEARNER_APP.LOGIN.SUBTITLE": "Sign in to continue",
  "LEARNER_APP.LOGIN.MOBILE_LABEL": "Mobile Number",
  "LEARNER_APP.LOGIN.MOBILE_PLACEHOLDER": "Enter mobile number",
  "LEARNER_APP.LOGIN.OTP_LABEL": "OTP",
  "LEARNER_APP.LOGIN.OTP_PLACEHOLDER": "Enter OTP",
  "LEARNER_APP.LOGIN.SEND_RESEND_OTP": "Send/Resend OTP",
  "LEARNER_APP.LOGIN.SIGN_IN": "Sign In",
  "LEARNER_APP.LOGIN.NOT_REGISTERED": "This mobile number is not registered.",
  "LEARNER_APP.LOGIN.ACCOUNT_INACTIVE": "Your account is inactive. Contact admin.",
  "LEARNER_APP.LOGIN.INVALID_OTP": "Invalid OTP. Please try again.",
  "LEARNER_APP.LOGIN.MAX_RESEND": "Maximum resend attempts reached.",
  "LEARNER_APP.LOGIN.RESEND_IN": "Resend OTP in {{seconds}}s",

  "LEARNER_APP.HOME.GREETING": "Namaste, {{name}}!",
  "LEARNER_APP.HOME.ALERTS_TITLE": "Alerts and Updates",
  "LEARNER_APP.HOME.CONTINUE_LEARNING": "Continue Learning",
  "LEARNER_APP.HOME.START_LEARNING": "Start Learning",
  "LEARNER_APP.HOME.VIEW_MORE": "View More",
  "LEARNER_APP.HOME.VIEW_LESS": "View Less",
  "LEARNER_APP.HOME.COMPLETED": "Completed",
  "LEARNER_APP.HOME.LOCKED": "Locked",
  "LEARNER_APP.HOME.NO_ALERTS": "No new alerts",
  "LEARNER_APP.HOME.LOAD_ERROR": "Could not load course data. Pull to refresh.",

  "LEARNER_APP.LEVEL.BEGINNER": "Beginner Level",
  "LEARNER_APP.LEVEL.INTERMEDIATE": "Intermediate Level",
  "LEARNER_APP.LEVEL.ADVANCE": "Advance Level",

  "LEARNER_APP.LEARN.PAGE_TITLE": "Your Learning Path",
  "LEARNER_APP.LEARN.NEW_CONTENT": "New Content Available",
  "LEARNER_APP.LEARN.CONTINUE_LEARNING": "Continue Learning",
  "LEARNER_APP.LEARN.COMPLETED_MODULES": "Completed {{completed}}/{{total}} Modules",
  "LEARNER_APP.LEARN.COMPLETED_SUBTOPICS": "Completed {{completed}}/{{total}} Subtopics",
  "LEARNER_APP.LEARN.COMPLETED_LESSONS": "Completed {{completed}}/{{total}} Lessons",
  "LEARNER_APP.LEARN.LEVEL_UNLOCKED": "{{level}} Unlocked",

  "LEARNER_APP.LESSON.PROGRESS_LABEL": "Lesson Progress",
  "LEARNER_APP.LESSON.PREVIOUS": "Previous",
  "LEARNER_APP.LESSON.NEXT": "Next",
  "LEARNER_APP.LESSON.SUBMIT": "Submit",
  "LEARNER_APP.LESSON.CORRECT": "Correct!",
  "LEARNER_APP.LESSON.INCORRECT": "Incorrect. The correct answer is {{answer}}.",

  "LEARNER_APP.COMPLETE.SUBTOPIC_TITLE": "Subtopic Complete!",
  "LEARNER_APP.COMPLETE.MODULE_TITLE": "Module Complete!",
  "LEARNER_APP.COMPLETE.LEVEL_TITLE": "Congratulations!",
  "LEARNER_APP.COMPLETE.LEVEL_SUBTITLE": "You have finished {{level}}",
  "LEARNER_APP.COMPLETE.UP_NEXT": "Up Next",
  "LEARNER_APP.COMPLETE.START_SUBTOPIC": "Start Subtopic {{n}}",
  "LEARNER_APP.COMPLETE.START_MODULE": "Start Module {{n}}",
  "LEARNER_APP.COMPLETE.START_NEXT_LEVEL": "Start Next Level",
  "LEARNER_APP.COMPLETE.DOWNLOAD_CERT": "Download Certificate",

  "LEARNER_APP.PROFILE.TITLE": "Profile",
  "LEARNER_APP.PROFILE.UPLOAD_PHOTO": "Upload Photo",
  "LEARNER_APP.PROFILE.FIELD_LANGUAGE": "Language",
  "LEARNER_APP.PROFILE.FIELD_NAME": "Name",
  "LEARNER_APP.PROFILE.FIELD_DESIGNATION":"Designation",
  "LEARNER_APP.PROFILE.FIELD_CFL_LOCATION": "CFL Location",
  "LEARNER_APP.PROFILE.FIELD_MOBILE": "Mobile Number",
  "LEARNER_APP.PROFILE.FIELD_EMAIL": "Email",
  "LEARNER_APP.PROFILE.FIELD_JOINING_DATE": "Joining Date",
  "LEARNER_APP.PROFILE.EDIT_CANCEL": "Cancel",
  "LEARNER_APP.PROFILE.EDIT_SAVE": "Save",
  "LEARNER_APP.PROFILE.NAME_EMPTY_ERROR": "Name cannot be empty",
  "LEARNER_APP.PROFILE.NAME_SAVE_SUCCESS": "Name updated successfully",
  "LEARNER_APP.PROFILE.NAME_SAVE_ERROR": "Failed to update name. Please try again.",
  "LEARNER_APP.PROFILE.LOGOUT": "Logout",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM_TITLE": "Log out?",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM_MSG": "Are you sure you want to log out?",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM": "Log Out",
  "LEARNER_APP.PROFILE.LOGOUT_CANCEL": "Cancel",

  "LEARNER_APP.ALERTS.TITLE": "Alerts",
  "LEARNER_APP.ALERTS.TODAY": "Today",
  "LEARNER_APP.ALERTS.YESTERDAY": "Yesterday",
  "LEARNER_APP.ALERTS.EMPTY": "No notifications yet",
  "LEARNER_APP.ALERTS.TYPE_QUIZ": "Quiz Reminder",
  "LEARNER_APP.ALERTS.TYPE_CONTENT": "New Content Reminder",
  "LEARNER_APP.ALERTS.TYPE_LESSON": "Lesson Reminder",
  "LEARNER_APP.ALERTS.TYPE_FEEDBACK": "Trainer Feedback Received",
  "LEARNER_APP.ALERTS.TYPE_BADGE": "Level Completed",
  "LEARNER_APP.ALERTS.TYPE_SYSTEM": "System Announcement",

  "LEARNER_APP.FEEDBACK.TITLE": "Feedback",
  "LEARNER_APP.FEEDBACK.MESSAGE_LABEL": "Message",

  "LEARNER_APP.QUIZ.START_TITLE": "Before you begin",
  "LEARNER_APP.QUIZ.INSTRUCTION_READ": "Read each question carefully before selecting an answer.",
  "LEARNER_APP.QUIZ.INSTRUCTION_SKIP": "You can skip a question and return to it later.",
  "LEARNER_APP.QUIZ.INSTRUCTION_PASS": "Score 70% or above to pass and unlock the next lesson.",
  "LEARNER_APP.QUIZ.ATTEMPTS_REMAINING": "{{used}}/{{max}} Quiz Attempts Remaining",
  "LEARNER_APP.QUIZ.NO_ATTEMPTS": "No attempts remaining. You cannot retake this quiz.",
  "LEARNER_APP.QUIZ.COMPLETED": "Quiz Completed",
  "LEARNER_APP.QUIZ.FAILED": "Quiz Failed",
  "LEARNER_APP.QUIZ.SCORE": "{{correct}}/{{total}} Quiz Results",
  "LEARNER_APP.QUIZ.CORRECT": "Correct",
  "LEARNER_APP.QUIZ.INCORRECT": "Incorrect",
  "LEARNER_APP.QUIZ.CORRECT_ANSWER": "Correct answer: {{answer}}",
  "LEARNER_APP.QUIZ.RETRY": "Retry Quiz",
  "LEARNER_APP.QUIZ.PASS_THRESHOLD": "Pass score: 70%"
}
```

#### Hindi (`hi.json`) — additions

```json
{
  "LEARNER_APP.SPLASH.TITLE": "स्वाधार प्रशिक्षण मंच",
  "LEARNER_APP.SPLASH.TAGLINE": "सीखें। बढ़ें।",
  "LEARNER_APP.SPLASH.POWERED_BY": "स्वाधार फिनएक्सेस द्वारा संचालित",
  "LEARNER_APP.LANGUAGE_SELECTION.TITLE": "भाषा चुनें",
  "LEARNER_APP.LANGUAGE_SELECTION.SUBTITLE": "वह भाषा चुनें जिसमें आप सबसे ज़्यादा सहज हों",
  "LEARNER_APP.LANGUAGE_SELECTION.CONTINUE": "जारी रखें",
  "LEARNER_APP.LOGIN.WELCOME": "स्वागत है!",
  "LEARNER_APP.LOGIN.SUBTITLE": "जारी रखने के लिए साइन इन करें",
  "LEARNER_APP.LOGIN.MOBILE_LABEL": "मोबाइल नंबर",
  "LEARNER_APP.LOGIN.MOBILE_PLACEHOLDER": "मोबाइल नंबर दर्ज करें",
  "LEARNER_APP.LOGIN.OTP_LABEL": "OTP",
  "LEARNER_APP.LOGIN.OTP_PLACEHOLDER": "OTP दर्ज करें",
  "LEARNER_APP.LOGIN.SEND_RESEND_OTP": "OTP भेजें / पुनः भेजें",
  "LEARNER_APP.LOGIN.SIGN_IN": "साइन इन करें",
  "LEARNER_APP.LOGIN.NOT_REGISTERED": "यह मोबाइल नंबर पंजीकृत नहीं है।",
  "LEARNER_APP.LOGIN.ACCOUNT_INACTIVE": "आपका खाता निष्क्रिय है। व्यवस्थापक से संपर्क करें।",
  "LEARNER_APP.LOGIN.INVALID_OTP": "अमान्य OTP। कृपया पुनः प्रयास करें।",
  "LEARNER_APP.LOGIN.MAX_RESEND": "अधिकतम पुनः प्रयास सीमा समाप्त हो गई।",
  "LEARNER_APP.LOGIN.RESEND_IN": "OTP {{seconds}} सेकंड में पुनः भेजें",
  "LEARNER_APP.HOME.GREETING": "नमस्ते, {{name}}!",
  "LEARNER_APP.HOME.ALERTS_TITLE": "अलर्ट और अपडेट",
  "LEARNER_APP.HOME.CONTINUE_LEARNING": "सीखना जारी रखें",
  "LEARNER_APP.HOME.START_LEARNING": "सीखना शुरू करें",
  "LEARNER_APP.HOME.VIEW_MORE": "और देखें",
  "LEARNER_APP.HOME.VIEW_LESS": "कम देखें",
  "LEARNER_APP.HOME.COMPLETED": "पूर्ण",
  "LEARNER_APP.HOME.LOCKED": "बंद",
  "LEARNER_APP.HOME.NO_ALERTS": "कोई नया अलर्ट नहीं",
  "LEARNER_APP.HOME.LOAD_ERROR": "कोर्स डेटा लोड नहीं हो सका। ताज़ा करने के लिए खींचें।",
  "LEARNER_APP.LEVEL.BEGINNER": "प्रारंभिक स्तर",
  "LEARNER_APP.LEVEL.INTERMEDIATE": "मध्यम स्तर",
  "LEARNER_APP.LEVEL.ADVANCE": "उन्नत स्तर",
  "LEARNER_APP.LEARN.PAGE_TITLE": "आपका सीखने का मार्ग",
  "LEARNER_APP.LEARN.NEW_CONTENT": "नई सामग्री उपलब्ध है",
  "LEARNER_APP.LEARN.CONTINUE_LEARNING": "सीखना जारी रखें",
  "LEARNER_APP.LEARN.COMPLETED_MODULES": "{{completed}}/{{total}} मॉड्यूल पूर्ण",
  "LEARNER_APP.LEARN.COMPLETED_SUBTOPICS": "{{completed}}/{{total}} उप-विषय पूर्ण",
  "LEARNER_APP.LEARN.COMPLETED_LESSONS": "{{completed}}/{{total}} पाठ पूर्ण",
  "LEARNER_APP.LEARN.LEVEL_UNLOCKED": "{{level}} अनलॉक हुआ",
  "LEARNER_APP.LESSON.PROGRESS_LABEL": "पाठ प्रगति",
  "LEARNER_APP.LESSON.PREVIOUS": "पिछला",
  "LEARNER_APP.LESSON.NEXT": "अगला",
  "LEARNER_APP.LESSON.SUBMIT": "जमा करें",
  "LEARNER_APP.LESSON.CORRECT": "सही!",
  "LEARNER_APP.LESSON.INCORRECT": "गलत। सही उत्तर है {{answer}}।",
  "LEARNER_APP.COMPLETE.SUBTOPIC_TITLE": "उप-विषय पूर्ण!",
  "LEARNER_APP.COMPLETE.MODULE_TITLE": "मॉड्यूल पूर्ण!",
  "LEARNER_APP.COMPLETE.LEVEL_TITLE": "बधाई हो!",
  "LEARNER_APP.COMPLETE.LEVEL_SUBTITLE": "आपने {{level}} पूरा किया",
  "LEARNER_APP.COMPLETE.UP_NEXT": "आगे क्या",
  "LEARNER_APP.COMPLETE.START_SUBTOPIC": "उप-विषय {{n}} शुरू करें",
  "LEARNER_APP.COMPLETE.START_MODULE": "मॉड्यूल {{n}} शुरू करें",
  "LEARNER_APP.COMPLETE.START_NEXT_LEVEL": "अगला स्तर शुरू करें",
  "LEARNER_APP.COMPLETE.DOWNLOAD_CERT": "प्रमाणपत्र डाउनलोड करें",

  "LEARNER_APP.PROFILE.TITLE": "प्रोफ़ाइल",
  "LEARNER_APP.PROFILE.UPLOAD_PHOTO": "फ़ोटो अपलोड करें",
  "LEARNER_APP.PROFILE.FIELD_LANGUAGE": "भाषा",
  "LEARNER_APP.PROFILE.FIELD_NAME": "नाम",
  "LEARNER_APP.PROFILE.FIELD_DESIGNATION": "पदनाम",
  "LEARNER_APP.PROFILE.FIELD_CFL_LOCATION": "CFL स्थान",
  "LEARNER_APP.PROFILE.FIELD_MOBILE": "मोबाइल नंबर",
  "LEARNER_APP.PROFILE.FIELD_EMAIL": "ईमेल",
  "LEARNER_APP.PROFILE.FIELD_JOINING_DATE": "शामिल होने की तारीख",
  "LEARNER_APP.PROFILE.EDIT_CANCEL": "रद्द करें",
  "LEARNER_APP.PROFILE.EDIT_SAVE": "सहेजें",
  "LEARNER_APP.PROFILE.NAME_EMPTY_ERROR": "नाम खाली नहीं हो सकता",
  "LEARNER_APP.PROFILE.NAME_SAVE_SUCCESS": "नाम सफलतापूर्वक अपडेट किया गया",
  "LEARNER_APP.PROFILE.NAME_SAVE_ERROR": "नाम अपडेट करने में विफल। कृपया पुनः प्रयास करें।",
  "LEARNER_APP.PROFILE.LOGOUT": "लॉग आउट",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM_TITLE": "लॉग आउट?",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM_MSG": "क्या आप वाकई लॉग आउट करना चाहते हैं?",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM": "लॉग आउट करें",
  "LEARNER_APP.PROFILE.LOGOUT_CANCEL": "रद्द करें",

  "LEARNER_APP.ALERTS.TITLE": "अलर्ट",
  "LEARNER_APP.ALERTS.TODAY": "आज",
  "LEARNER_APP.ALERTS.YESTERDAY": "कल",
  "LEARNER_APP.ALERTS.EMPTY": "अभी तक कोई सूचना नहीं",
  "LEARNER_APP.ALERTS.TYPE_QUIZ": "क्विज़ अनुस्मारक",
  "LEARNER_APP.ALERTS.TYPE_CONTENT": "नई सामग्री अनुस्मारक",
  "LEARNER_APP.ALERTS.TYPE_LESSON": "पाठ अनुस्मारक",
  "LEARNER_APP.ALERTS.TYPE_FEEDBACK": "प्रशिक्षक प्रतिक्रिया प्राप्त हुई",
  "LEARNER_APP.ALERTS.TYPE_BADGE": "स्तर पूर्ण",
  "LEARNER_APP.ALERTS.TYPE_SYSTEM": "सिस्टम घोषणा",

  "LEARNER_APP.FEEDBACK.TITLE": "प्रतिक्रिया",
  "LEARNER_APP.FEEDBACK.MESSAGE_LABEL": "संदेश",

  "LEARNER_APP.QUIZ.START_TITLE": "शुरू करने से पहले",
  "LEARNER_APP.QUIZ.INSTRUCTION_READ": "उत्तर चुनने से पहले प्रत्येक प्रश्न को ध्यान से पढ़ें।",
  "LEARNER_APP.QUIZ.INSTRUCTION_SKIP": "आप किसी प्रश्न को छोड़ सकते हैं और बाद में वापस आ सकते हैं।",
  "LEARNER_APP.QUIZ.INSTRUCTION_PASS": "अगला पाठ अनलॉक करने के लिए 70% या उससे अधिक स्कोर करें।",
  "LEARNER_APP.QUIZ.ATTEMPTS_REMAINING": "{{used}}/{{max}} क्विज़ प्रयास शेष",
  "LEARNER_APP.QUIZ.NO_ATTEMPTS": "कोई प्रयास शेष नहीं। आप यह क्विज़ दोबारा नहीं दे सकते।",
  "LEARNER_APP.QUIZ.COMPLETED": "क्विज़ पूर्ण",
  "LEARNER_APP.QUIZ.FAILED": "क्विज़ विफल",
  "LEARNER_APP.QUIZ.SCORE": "{{correct}}/{{total}} क्विज़ परिणाम",
  "LEARNER_APP.QUIZ.CORRECT": "सही",
  "LEARNER_APP.QUIZ.INCORRECT": "गलत",
  "LEARNER_APP.QUIZ.CORRECT_ANSWER": "सही उत्तर: {{answer}}",
  "LEARNER_APP.QUIZ.RETRY": "क्विज़ पुनः प्रयास करें",
  "LEARNER_APP.QUIZ.PASS_THRESHOLD": "पास स्कोर: 70%"
}
```

#### Marathi (`mr.json`) — additions

```json
{
  "LEARNER_APP.SPLASH.TITLE": "स्वाधार प्रशिक्षण व्यासपीठ",
  "LEARNER_APP.SPLASH.TAGLINE": "शिका. वाढा.",
  "LEARNER_APP.SPLASH.POWERED_BY": "स्वाधार फिनएक्सेस द्वारे संचालित",
  "LEARNER_APP.LANGUAGE_SELECTION.TITLE": "भाषा निवडा",
  "LEARNER_APP.LANGUAGE_SELECTION.SUBTITLE": "तुम्हाला सर्वात सोयीस्कर वाटणारी भाषा निवडा",
  "LEARNER_APP.LANGUAGE_SELECTION.CONTINUE": "पुढे चला",
  "LEARNER_APP.LOGIN.WELCOME": "स्वागत आहे!",
  "LEARNER_APP.LOGIN.SUBTITLE": "पुढे जाण्यासाठी साइन इन करा",
  "LEARNER_APP.LOGIN.MOBILE_LABEL": "मोबाइल नंबर",
  "LEARNER_APP.LOGIN.MOBILE_PLACEHOLDER": "मोबाइल नंबर प्रविष्ट करा",
  "LEARNER_APP.LOGIN.OTP_LABEL": "OTP",
  "LEARNER_APP.LOGIN.OTP_PLACEHOLDER": "OTP प्रविष्ट करा",
  "LEARNER_APP.LOGIN.SEND_RESEND_OTP": "OTP पाठवा / पुन्हा पाठवा",
  "LEARNER_APP.LOGIN.SIGN_IN": "साइन इन करा",
  "LEARNER_APP.LOGIN.NOT_REGISTERED": "हा मोबाइल नंबर नोंदणीकृत नाही.",
  "LEARNER_APP.LOGIN.ACCOUNT_INACTIVE": "तुमचे खाते निष्क्रिय आहे. प्रशासकाशी संपर्क साधा.",
  "LEARNER_APP.LOGIN.INVALID_OTP": "चुकीचा OTP. कृपया पुन्हा प्रयत्न करा.",
  "LEARNER_APP.LOGIN.MAX_RESEND": "जास्तीत जास्त पुन्हा पाठवण्याची मर्यादा संपली.",
  "LEARNER_APP.LOGIN.RESEND_IN": "OTP {{seconds}} सेकंदात पाठवा",
  "LEARNER_APP.HOME.GREETING": "नमस्ते, {{name}}!",
  "LEARNER_APP.HOME.ALERTS_TITLE": "सूचना आणि अपडेट",
  "LEARNER_APP.HOME.CONTINUE_LEARNING": "शिकणे सुरू ठेवा",
  "LEARNER_APP.HOME.START_LEARNING": "शिकणे सुरू करा",
  "LEARNER_APP.HOME.VIEW_MORE": "अधिक पहा",
  "LEARNER_APP.HOME.VIEW_LESS": "कमी पहा",
  "LEARNER_APP.HOME.COMPLETED": "पूर्ण झाले",
  "LEARNER_APP.HOME.LOCKED": "बंद",
  "LEARNER_APP.HOME.NO_ALERTS": "कोणतेही नवीन अलर्ट नाहीत",
  "LEARNER_APP.HOME.LOAD_ERROR": "कोर्स डेटा लोड होऊ शकला नाही. रिफ्रेश करण्यासाठी खेचा.",
  "LEARNER_APP.LEVEL.BEGINNER": "प्रारंभिक स्तर",
  "LEARNER_APP.LEVEL.INTERMEDIATE": "मध्यम स्तर",
  "LEARNER_APP.LEVEL.ADVANCE": "प्रगत स्तर",
  "LEARNER_APP.LEARN.PAGE_TITLE": "तुमचा शिकण्याचा मार्ग",
  "LEARNER_APP.LEARN.NEW_CONTENT": "नवीन सामग्री उपलब्ध",
  "LEARNER_APP.LEARN.CONTINUE_LEARNING": "शिकणे सुरू ठेवा",
  "LEARNER_APP.LEARN.COMPLETED_MODULES": "{{completed}}/{{total}} मॉड्यूल पूर्ण",
  "LEARNER_APP.LEARN.COMPLETED_SUBTOPICS": "{{completed}}/{{total}} उपविषय पूर्ण",
  "LEARNER_APP.LEARN.COMPLETED_LESSONS": "{{completed}}/{{total}} धडे पूर्ण",
  "LEARNER_APP.LEARN.LEVEL_UNLOCKED": "{{level}} अनलॉक झाले",
  "LEARNER_APP.LESSON.PROGRESS_LABEL": "धडा प्रगती",
  "LEARNER_APP.LESSON.PREVIOUS": "मागील",
  "LEARNER_APP.LESSON.NEXT": "पुढील",
  "LEARNER_APP.LESSON.SUBMIT": "सादर करा",
  "LEARNER_APP.LESSON.CORRECT": "बरोबर!",
  "LEARNER_APP.LESSON.INCORRECT": "चुकीचे. बरोबर उत्तर {{answer}} आहे.",
  "LEARNER_APP.COMPLETE.SUBTOPIC_TITLE": "उपविषय पूर्ण!",
  "LEARNER_APP.COMPLETE.MODULE_TITLE": "मॉड्यूल पूर्ण!",
  "LEARNER_APP.COMPLETE.LEVEL_TITLE": "अभिनंदन!",
  "LEARNER_APP.COMPLETE.LEVEL_SUBTITLE": "तुम्ही {{level}} पूर्ण केले",
  "LEARNER_APP.COMPLETE.UP_NEXT": "पुढे काय",
  "LEARNER_APP.COMPLETE.START_SUBTOPIC": "उपविषय {{n}} सुरू करा",
  "LEARNER_APP.COMPLETE.START_MODULE": "मॉड्यूल {{n}} सुरू करा",
  "LEARNER_APP.COMPLETE.START_NEXT_LEVEL": "पुढील स्तर सुरू करा",
  "LEARNER_APP.COMPLETE.DOWNLOAD_CERT": "प्रमाणपत्र डाउनलोड करा",

  "LEARNER_APP.PROFILE.TITLE": "प्रोफाइल",
  "LEARNER_APP.PROFILE.UPLOAD_PHOTO": "फोटो अपलोड करा",
  "LEARNER_APP.PROFILE.FIELD_LANGUAGE": "भाषा",
  "LEARNER_APP.PROFILE.FIELD_NAME": "नाव",
  "LEARNER_APP.PROFILE.FIELD_DESIGNATION": "पदनाम",
  "LEARNER_APP.PROFILE.FIELD_CFL_LOCATION": "CFL ठिकाण",
  "LEARNER_APP.PROFILE.FIELD_MOBILE": "मोबाइल नंबर",
  "LEARNER_APP.PROFILE.FIELD_EMAIL": "ईमेल",
  "LEARNER_APP.PROFILE.FIELD_JOINING_DATE": "सामील होण्याची तारीख",
  "LEARNER_APP.PROFILE.EDIT_CANCEL": "रद्द करा",
  "LEARNER_APP.PROFILE.EDIT_SAVE": "जतन करा",
  "LEARNER_APP.PROFILE.NAME_EMPTY_ERROR": "नाव रिकामे असू शकत नाही",
  "LEARNER_APP.PROFILE.NAME_SAVE_SUCCESS": "नाव यशस्वीरित्या अपडेट केले",
  "LEARNER_APP.PROFILE.NAME_SAVE_ERROR": "नाव अपडेट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
  "LEARNER_APP.PROFILE.LOGOUT": "लॉग आउट",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM_TITLE": "लॉग आउट?",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM_MSG": "तुम्हाला खरोखर लॉग आउट करायचे आहे का?",
  "LEARNER_APP.PROFILE.LOGOUT_CONFIRM": "लॉग आउट करा",
  "LEARNER_APP.PROFILE.LOGOUT_CANCEL": "रद्द करा",

  "LEARNER_APP.ALERTS.TITLE": "अलर्ट",
  "LEARNER_APP.ALERTS.TODAY": "आज",
  "LEARNER_APP.ALERTS.YESTERDAY": "काल",
  "LEARNER_APP.ALERTS.EMPTY": "अद्याप कोणत्याही सूचना नाहीत",
  "LEARNER_APP.ALERTS.TYPE_QUIZ": "क्विझ स्मरणपत्र",
  "LEARNER_APP.ALERTS.TYPE_CONTENT": "नवीन सामग्री स्मरणपत्र",
  "LEARNER_APP.ALERTS.TYPE_LESSON": "धडा स्मरणपत्र",
  "LEARNER_APP.ALERTS.TYPE_FEEDBACK": "प्रशिक्षक अभिप्राय मिळाला",
  "LEARNER_APP.ALERTS.TYPE_BADGE": "स्तर पूर्ण",
  "LEARNER_APP.ALERTS.TYPE_SYSTEM": "सिस्टम घोषणा",

  "LEARNER_APP.FEEDBACK.TITLE": "अभिप्राय",
  "LEARNER_APP.FEEDBACK.MESSAGE_LABEL": "संदेश",

  "LEARNER_APP.QUIZ.START_TITLE": "सुरू करण्यापूर्वी",
  "LEARNER_APP.QUIZ.INSTRUCTION_READ": "उत्तर निवडण्यापूर्वी प्रत्येक प्रश्न काळजीपूर्वक वाचा.",
  "LEARNER_APP.QUIZ.INSTRUCTION_SKIP": "तुम्ही प्रश्न वगळू शकता आणि नंतर परत येऊ शकता.",
  "LEARNER_APP.QUIZ.INSTRUCTION_PASS": "पुढील धडा अनलॉक करण्यासाठी 70% किंवा त्याहून अधिक गुण मिळवा.",
  "LEARNER_APP.QUIZ.ATTEMPTS_REMAINING": "{{used}}/{{max}} क्विझ प्रयत्न शिल्लक",
  "LEARNER_APP.QUIZ.NO_ATTEMPTS": "प्रयत्न शिल्लक नाहीत. तुम्ही हा क्विझ पुन्हा देऊ शकत नाही.",
  "LEARNER_APP.QUIZ.COMPLETED": "क्विझ पूर्ण",
  "LEARNER_APP.QUIZ.FAILED": "क्विझ अयशस्वी",
  "LEARNER_APP.QUIZ.SCORE": "{{correct}}/{{total}} क्विझ निकाल",
  "LEARNER_APP.QUIZ.CORRECT": "बरोबर",
  "LEARNER_APP.QUIZ.INCORRECT": "चुकीचे",
  "LEARNER_APP.QUIZ.CORRECT_ANSWER": "बरोबर उत्तर: {{answer}}",
  "LEARNER_APP.QUIZ.RETRY": "क्विझ पुन्हा प्रयत्न करा",
  "LEARNER_APP.QUIZ.PASS_THRESHOLD": "पास गुण: 70%"
}
```

---

## 15. PWA Manifest

`apps/learner-web-app/public/manifest.json` — **CREATE / MODIFY**

```json
{
  "name": "Swadhaar Training Platform",
  "short_name": "Swadhaar",
  "description": "Swadhaar FinAccess Learner Training App",
  "start_url": "/splash",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1C2B4A",
  "theme_color": "#E6873C",
  "lang": "en",
  "icons": [
    { "src": "/icons/swadhaar-icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/swadhaar-icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "splash_pages": null
}
```

**`app/layout.tsx` — add manifest link:**
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#E6873C" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/swadhaar-icon-192.png" />
```

**Icon files required:**
- `/public/icons/swadhaar-icon-192.png` — 192×192 on `#1C2B4A` background
- `/public/icons/swadhaar-icon-512.png` — 512×512

---

## 16. How to Run the Project (Swadhaar Domain)

### Prerequisites

```
Node.js >= 18
npm >= 9
nx CLI globally installed  (npm install -g nx)
```

### Step 1 — Clone & Install

```sh
cd "/home/ttpl-rt-151/Documents/Shikshav/Shiksha-mfe/new learner app/shiksha-mfe"
npm install
```

### Step 2 — Configure Environment

```env
NEXT_PUBLIC_BASE_URL=https://interface.tekdinext.com/interface/v1
NEXT_PUBLIC_TENANT_ID=35529b5d-526f-4da5-bc6e-64f740023d26
NEXT_PUBLIC_FRAMEWORK_ID=swadhaar-framework
```

### Step 3 — Start the Learner App

```sh
nx dev learner-web-app --port=3003 --verbose
```

Open: **http://localhost:3003**

### Step 4 — Set Swadhaar Tenant Locally (One-time)

```javascript
localStorage.setItem('domainTenantId', '35529b5d-526f-4da5-bc6e-64f740023d26');
location.reload();
```

### Step 5 — Test the Flow

1. App opens → Splash (2.5s) → Language Selection → Login
2. Enter mobile `9960228156` → Send OTP → Enter OTP → Sign In
3. Home screen loads with levels and modules
4. Tap **Learn** tab → Learning Path → tap Intermediate Level to expand
5. Tap Module 3 → Subtopic list → tap Subtopic 1 → Lesson Player
6. Navigate through blobs with Previous / Next → reach last lesson → complete → Subtopic Complete screen

### Optional — Start Supporting MFEs

```sh
nx dev notification --port=4105 --verbose
nx dev players --port=4108 --verbose
```

### Common Issues

| Issue | Fix |
|-------|-----|
| Blank page / tenant not loading | Run localStorage override in Step 4 |
| OTP not received | Confirm mobile is registered in admin panel |
| CORS errors | Use `https://interface.tekdinext.com` not localhost |
| Module federation errors | `npm install` again; `rm -rf apps/learner-web-app/.next` |
| nx not found | `npm install -g nx` |

---

## Appendix — File Change Summary

| File | Action | Reason |
|------|--------|--------|
| `src/app/splash/page.tsx` | **CREATE** | Splash screen |
| `src/app/language-selection/page.tsx` | **CREATE** | Language picker |
| `src/utils/authUtils.ts` | **CREATE** | `isTokenValid()` helper |
| `src/utils/alertsStore.ts` | **CREATE** | localStorage CRUD helpers for alerts |
| `src/utils/API/SwadhaarService.ts` | **CREATE** | `fetchLevelCourses()`, `getCourseHierarchy()`, `getUserCourseStatus()`, `createEnrollment()`, `getSubtopicStatus()`, `updateContentProgress()`, `getQuizAttemptStatus()`, `submitQuizAttempt()`, `fetchQuestionSet()`, `updateUserProfile()` |
| `src/utils/API/EndUrls.ts` | **MODIFY** | Add composite search, course hierarchy, tracking, assessment, user-update endpoints |
| `src/app/home/page.tsx` | **MODIFY** | Add UserLevelCard, AlertsCarousel, LevelModuleList |
| `src/app/learn/page.tsx` | **CREATE** | Learning Path — Learn tab |
| `src/app/learn/[levelId]/[moduleId]/page.tsx` | **CREATE** | Subtopic detail + new content banner |
| `src/app/learn/[levelId]/[moduleId]/[subtopicId]/page.tsx` | **CREATE** | Lesson player page |
| `src/app/learn/complete/subtopic/page.tsx` | **CREATE** | Subtopic complete screen |
| `src/app/learn/complete/module/page.tsx` | **CREATE** | Module complete screen |
| `src/app/learn/complete/level/page.tsx` | **CREATE** | Level complete / congratulations |
| `src/app/alerts/page.tsx` | **CREATE** | Alerts list page |
| `src/app/alerts/feedback/[id]/page.tsx` | **CREATE** | Feedback read view |
| `src/app/profile/page.tsx` | **CREATE** | Profile view + edit page |
| `src/components/HomeProgression/UserLevelCard.tsx` | **CREATE** | Dark navy level progress card |
| `src/components/HomeProgression/LevelModuleList.tsx` | **CREATE** | Expandable level → module accordion |
| `src/components/HomeProgression/ModuleRow.tsx` | **CREATE** | Module row with progress indicator |
| `src/components/AlertsCarousel/AlertsCarousel.tsx` | **CREATE** | Scrollable alert cards on Home |
| `src/components/Alerts/AlertListRow.tsx` | **CREATE** | Single alert row (icon + title + message + arrow) |
| `src/components/Alerts/AlertDateGroup.tsx` | **CREATE** | Date group header (Today / Yesterday / date) |
| `src/components/Alerts/FeedbackSenderCard.tsx` | **CREATE** | Navy card: sender name + designation + avatar |
| `src/components/Alerts/FeedbackMessageCard.tsx` | **CREATE** | White message body card |
| `src/components/Learn/LevelAccordion.tsx` | **CREATE** | Collapsible level row |
| `src/components/Learn/SubtopicRow.tsx` | **CREATE** | Subtopic list row |
| `src/components/Learn/SubtopicAccordion.tsx` | **CREATE** | Expandable subtopic + lesson list (3.4) |
| `src/components/Learn/LessonRow.tsx` | **CREATE** | Single lesson row (locked / tappable) |
| `src/components/Learn/NewContentBanner.tsx` | **CREATE** | Top-of-page new content banner |
| `src/components/Learn/NewContentBannerInline.tsx` | **CREATE** | Navy inline banner in subtopic detail (3.4) |
| `src/components/shared/ProgressCircle.tsx` | **CREATE** | Reusable 0%/arc/check circle |
| `src/components/Lesson/LessonProgressBar.tsx` | **CREATE** | Green lesson progress bar |
| `src/components/Lesson/ContentBlobRenderer.tsx` | **CREATE** | Blob type switcher |
| `src/components/Lesson/blobs/TextCardBlob.tsx` | **CREATE** | Text card blob |
| `src/components/Lesson/blobs/VideoBlob.tsx` | **CREATE** | Video player blob |
| `src/components/Lesson/blobs/ImageBlob.tsx` | **CREATE** | Image blob |
| `src/components/Lesson/blobs/DocumentBlob.tsx` | **CREATE** | PDF/document blob |
| `src/components/Lesson/blobs/MCQBlob.tsx` | **CREATE** | MCQ blob (used in both lesson + quiz) |
| `src/components/Lesson/blobs/OpenEndedBlob.tsx` | **CREATE** | Open-ended question blob |
| `src/components/Lesson/blobs/CheckboxBlob.tsx` | **CREATE** | Checkbox multi-select blob |
| `src/components/Lesson/LessonBottomBar.tsx` | **CREATE** | Previous / Lesson N / Next bar |
| `src/components/Quiz/QuizStartCard.tsx` | **CREATE** | Quiz intro text cards (4.0a) |
| `src/components/Quiz/QuizMCQCard.tsx` | **CREATE** | Single MCQ question + options (4.0b) |
| `src/components/Quiz/QuizResultCard.tsx` | **CREATE** | Quiz completed + per-Q results (4.0c) |
| `src/components/Completion/CompletionHero.tsx` | **CREATE** | Animated circle + title |
| `src/components/Completion/UpNextAccordion.tsx` | **CREATE** | Expandable up-next preview |
| `src/components/Completion/CompletionCTA.tsx` | **CREATE** | Start / Download Certificate buttons |
| `src/components/Profile/ProfileAvatar.tsx` | **CREATE** | Initials / photo circle, 80px |
| `src/components/Profile/ProfileField.tsx` | **CREATE** | Read-only or editable field row |
| `src/components/Profile/NameEditField.tsx` | **CREATE** | Edit mode with Cancel/Save |
| `src/components/Profile/LanguageDropdown.tsx` | **CREATE** | Bottom sheet language picker |
| `src/components/Layout.tsx` | **MODIFY** | Home/Learn/Profile bottom nav; bell badge |
| `public/manifest.json` | **CREATE** | PWA manifest |
| `public/icons/swadhaar-icon-192.png` | **CREATE** | PWA icon 192×192 |
| `public/icons/swadhaar-icon-512.png` | **CREATE** | PWA icon 512×512 |
| `public/locales/en/translation.json` | **MODIFY** | All i18n keys (Section 14) |
| `public/locales/hi/translation.json` | **MODIFY** | Hindi translations |
| `public/locales/mr/translation.json` | **MODIFY** | Marathi translations |

---

## Appendix — Screen Navigation Map

```
/splash
  └─ (2.5s) → /language-selection → /login → /home

/home
  ├─ Bell tap → /alerts
  ├─ Avatar tap → /profile
  ├─ Level row tap → /learn (auto-expand that level)
  └─ Module row tap → /learn/[levelId]/[moduleId]

/profile  (Profile tab)
  ├─ Tap ✏ on Name → inline edit mode (same page, 9.1b)
  ├─ Language dropdown → change language in-place
  └─ Logout → confirm dialog → /login

/alerts
  ├─ Back → /home
  ├─ Tap quiz alert → /learn/[levelId]/[moduleId]/[subtopicId]?startQuiz=true
  ├─ Tap content alert → /learn/[levelId]/[moduleId] (with new content banner)
  ├─ Tap lesson alert → /learn/[levelId]/[moduleId]/[subtopicId]
  ├─ Tap feedback alert → /alerts/feedback/[id]
  └─ Tap badge alert → /learn/complete/level (or certificate download)

/alerts/feedback/[id]
  └─ Back → /alerts

/learn  (Learn tab)
  ├─ Level chevron expand → (inline expansion, lazy loads hierarchy)
  ├─ Module row tap → /learn/[levelId]/[moduleId]
  └─ New content banner tap → /learn/[levelId]/[moduleId] (with banner active)

/learn/[levelId]/[moduleId]  (Subtopic detail — 3.4)
  ├─ Back → /learn
  ├─ New content lesson card tap → /learn/[levelId]/[moduleId]/[subtopicId]
  └─ Subtopic lesson row tap → /learn/[levelId]/[moduleId]/[subtopicId]

/learn/[levelId]/[moduleId]/[subtopicId]  (Lesson player — standard)
  ├─ Back → /learn/[levelId]/[moduleId]
  ├─ Previous → previous subtopic OR disabled
  ├─ Next (mid-lesson blob) → next blob in same lesson
  └─ Next (last blob of last lesson in subtopic) →
        if more subtopics in module → /learn/complete/subtopic
        if last subtopic in module  → /learn/complete/module
        if last module in level     → /learn/complete/level

/learn/[levelId]/[moduleId]/[subtopicId]?startQuiz=true  (Lesson player — Quiz)
  ├─ 4.0a: Quiz start cards → Next → 4.0b first question
  ├─ 4.0b: MCQ questions → Next per question → 4.0c result
  └─ 4.0c: Results →
        passed → Next → proceeds as standard lesson next
        failed + attempts remain → Retry Quiz → back to 4.0b
        failed + no attempts → Next disabled

/learn/complete/subtopic
  └─ "Start Subtopic N" → /learn/[levelId]/[moduleId]/[nextSubtopicId]

/learn/complete/module
  └─ "Start Module N" → /learn/[levelId]/[nextModuleId]

/learn/complete/level
  ├─ "Start Next Level" → /learn (auto-expand unlocked level)
  └─ "Download Certificate" → PDF download
```

---

*Last updated: 2026-04-26 | Phase 1 v3 | Swadhaar Training Platform*
