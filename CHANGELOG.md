# Changelog

## Course Approval System & Bug Fixes — 2026-03-02

### New Feature: Course Approval Workflow

A new **Reviewer** role has been added to the platform. Reviewers are responsible for approving courses before they become visible to students.

**Backend:**
- **`Reviewer.js`** — New Mongoose model for reviewer accounts (name, email, password, specialization)
- **`reviewController.js`** — Full review workflow: submit for review, approve, reject, request revision, review queue, history, stats, and automated pre-checks
- **`reviewRoutes.js`** — API routes for instructor submission and reviewer actions
- **`Course.js`** — Added `approvalStatus`, `reviewerId`, `reviewNotes`, `submittedAt`, `reviewedAt` fields
- **`authController.js` / `authMiddleware.js`** — Added `reviewer` role support and `isReviewer` middleware
- **`adminController.js`** — Admin can create/list/delete reviewer accounts; admin courses API now returns `approvalStatus` and `reviewerName`
- **`courseController.js`** — Student catalog now only shows approved courses; instructors still see all their own courses

**Frontend:**
- **`ReviewerDashboard.jsx`** — Dashboard shell with navigation for review queue and history
- **`ReviewQueue.jsx`** — Table of courses pending review with stats
- **`ReviewDetail.jsx`** — Full course review page with approve/reject/revision actions and comment thread
- **`ReviewHistory.jsx`** — Table of previously reviewed courses
- **`Login.jsx`** — Added Reviewer tab to role toggle
- **`AppRoutes.jsx` / `ProtectedRoute.jsx`** — Reviewer routes and role-based redirects
- **`MyCourses.jsx`** — Approval status badges and "Submit for Review" button for instructors
- **`AdminDashboard.jsx`** — Reviewers tab (create/list/delete), courses table now shows Status and Reviewed By columns

---

### Bug Fixes

- **Instructor course visibility** — Fixed `getAllCourses` filtering so instructors can see their own draft/pending/rejected courses (was previously hiding them due to approval filter meant for students)
- **Course creation validation** — Fixed stale React state bug in `CourseEditor.jsx` where `validateEntireCourse()` returned errors via async `setState` but the publish handler read stale state. Now returns errors object directly
- **Full module validation** — `validateEntireCourse()` now checks ALL modules (not just the currently selected one) for missing titles, invalid video URLs, and empty quizzes
- **Weight sum warning** — Added weight sum validation for weighted grading mode; surfaces warning as a non-blocking confirm dialog before publish

---

### CSS Theme Alignment

Removed all AI-generated gradients (`linear-gradient(135deg, #667eea, #764ba2)`) and replaced with flat `#3b82f6` blue throughout:

- **`CourseChat.css`** — Chat header, message bubbles, send button, FAB, sidebar header, conversation avatars, focus colors
- **`InstructorDashboard.jsx`** — Chat picker course avatars
- **`AdminDashboard.jsx`** — Create Reviewer button
- **`MyCourses.jsx`** — Submit for Review button
- **`ReviewerDashboard.css`** — Stripped to minimal status badge colors only; all components use existing `admin-table`, `stat-card`, `btn-action-*` classes

---

### Files Changed

| File | Change |
|------|--------|
| `backend/models/Reviewer.js` | NEW — Reviewer schema |
| `backend/models/Course.js` | Added approval fields |
| `backend/controllers/reviewController.js` | NEW — Review workflow |
| `backend/routes/reviewRoutes.js` | NEW — Review API routes |
| `backend/controllers/authController.js` | Reviewer role support |
| `backend/middleware/authMiddleware.js` | `isReviewer` middleware |
| `backend/controllers/adminController.js` | Reviewer CRUD + approval info in courses API |
| `backend/controllers/courseController.js` | Role-aware catalog filter |
| `backend/routes/adminRoutes.js` | Reviewer management routes |
| `backend/server.js` | Registered review routes |
| `frontend/src/pages/ReviewerDashboard.jsx` | NEW — Dashboard shell |
| `frontend/src/pages/ReviewerCourse/ReviewQueue.jsx` | NEW — Review queue |
| `frontend/src/pages/ReviewerCourse/ReviewDetail.jsx` | NEW — Course review page |
| `frontend/src/pages/ReviewerCourse/ReviewHistory.jsx` | NEW — Review history |
| `frontend/src/pages/css/ReviewerDashboard.css` | NEW — Minimal status badges |
| `frontend/src/pages/AdminDashboard.jsx` | Reviewers tab + approval columns |
| `frontend/src/pages/Login.jsx` | Reviewer login tab |
| `frontend/src/pages/InstructorCourse/MyCourses.jsx` | Approval badges + submit button |
| `frontend/src/pages/InstructorCourse/CourseEditor.jsx` | Full validation + weight warning |
| `frontend/src/pages/InstructorDashboard.jsx` | Chat picker gradient fix |
| `frontend/src/pages/css/CourseChat.css` | All gradients → flat blue |
| `frontend/src/routes/AppRoutes.jsx` | Reviewer routes |
| `frontend/src/components/ProtectedRoute.jsx` | Reviewer role handling |
