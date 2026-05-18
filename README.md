# Pratham 2.0

## Host App

### teachers

Next JS, run:

```sh
nx dev teachers --port=3001 --verbose
```

### admin

Next JS, run:

```sh
nx dev admin-app-repo --port=3002 --verbose
```

### learner-web-app

Next JS, run:

```sh
nx dev learner-web-app --port=3003 --verbose
```

##

## Micro Frontend List

### authentication

Next JS, run:

```sh
nx dev authentication --port=4101 --verbose
```

basePath : `http://localhost:4101/authentication/`
Port : `4101`

### scp-teacher-repo

Next JS, run:

```sh
nx dev scp-teacher-repo --port=4102 --verbose
```

basePath : `http://localhost:4102/scp-teacher-repo/`
Port : `4102`

### youthNet

Next JS, run:

```sh
nx dev youthNet --port=4103 --verbose
```

basePath : `http://localhost:4103/youthnet/`
Port : `4103`

### workspace

Next JS, run:

```sh
nx dev workspace --port=4104 --verbose
```

basePath : `http://localhost:4104/workspace/`
Port : `4104`

### notification

Next JS, run:

```sh
nx dev notification --port=4105 --verbose
```

basePath : `http://localhost:4105`
Port : `4105`

### sbplayer admin

Next JS, run:

```sh
nx dev players --port=4106 --verbose
```

basePath : `http://localhost:4106`
Port : `4106`

### sbplayer teacher

Next JS, run:

```sh
nx dev players --port=4107 --verbose
```

basePath : `http://localhost:4107`
Port : `4107`

### sbplayer learner

Next JS, run:

```sh web
nx dev players --port=4108 --verbose
```

basePath : `http://localhost:4108`
Port : `4108`

### forget-password

Next JS, run:

```sh
nx dev forget-password --port=4109 --verbose
```

basePath : `http://localhost:4109`
Port : `4109`

### login

Next JS, run:

```sh
nx dev login --port=4110 --verbose
```

basePath : `http://localhost:4110`
Port : `4110`

### profile-manage

Next JS, run:

```sh
nx dev profile-manage --port=4111 --verbose
```

basePath : `http://localhost:4111`
Port : `4111`

### survey-observations

Next JS, run:

```sh
nx dev survey-observations --port=4112 --verbose
```

basePath : `http://localhost:4112`
Port : `4112`

##

### content

Next JS, run:

```sh web
nx dev content --port=4113 --verbose
```

basePath : `http://localhost:4113/mfe_content/`
Port : `4113`

## NX Command

### View Nx Graph

` nx graph`

### Build All Project

`npx nx run-many --target=build --all`

### Install NX Globally

`npm install -g nx`

## Notes

## use shared library in any project

```sh
import { SharedLib } from '@shared-lib';
```

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