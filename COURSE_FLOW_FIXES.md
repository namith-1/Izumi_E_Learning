# Course Enrollment & Redirection Flow Fixes

## Overview
Standardized the course enrollment flow to support the React Single Page Application (SPA) architecture while maintaining backward compatibility for legacy server-rendered views.

## Changes Implemented

### 1. Backend: `controllers/student/studentController.js`
- **Updated `enrollStudent`**:
  - Now detects if the request is from the React app (via `Accept: application/json` header or presence of `studentId` in query).
  - Returns a JSON response `{ success: true, redirectUrl: '...' }` for API calls.
  - Retains the HTML `<script>` redirect for legacy browser navigation (links without `studentId`).
  - Accepts `studentId` from query parameters to support the React app's authentication state, falling back to session if not provided.

### 2. Frontend: `client/src/pages/student/StudentCourseList.jsx`
- **Refactored `handleEnroll`**:
  - Switched from `axios` to `apiClient` to ensure credentials (cookies) are sent.
  - Sends `Accept: application/json` header.
  - Handles the JSON response and uses `useNavigate` to redirect the user to the course page upon successful enrollment.
  - Added error handling for 401 (Unauthorized) to redirect users to the login page if their session expires.

### 3. Frontend: `client/src/pages/CourseDetail.js`
- **Refactored `handleEnroll`**:
  - Replaced `window.location.href` (full page reload) with `apiClient.get` (AJAX).
  - Handles the JSON response and uses `useNavigate` for a smooth client-side transition.
  - Added consistent error handling for 401 (Unauthorized).

## Verification
- **React App**: Clicking "Enroll" on the Course List or Course Detail page should now smoothly transition to the Course View without a full page reload.
- **Legacy Views**: Old EJS/HTML views that link to `/enroll?courseId=...` will continue to work by receiving the HTML redirect script.
