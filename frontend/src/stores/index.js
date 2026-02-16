import { configureStore } from "@reduxjs/toolkit";

import authReducer, * as authModule from "./auth";
import coursesReducer, * as coursesModule from "./courses";
import enrollmentReducer, * as enrollmentModule from "./enrollment";
import teachersReducer, * as teachersModule from "./teachers";
import adminReducer, * as adminModule from "./admin";
import analyticsReducer, * as analyticsModule from "./analytics";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    enrollment: enrollmentReducer,
    teachers: teachersReducer,
    admin: adminReducer,
    analytics: analyticsReducer,
  },
});

// Re-export thunks and actions for backwards compatibility
export const {
  registerUser,
  loginUser,
  logoutUser,
  checkAuthStatus,
  updateStudentProfile,
  clearAuthErrors,
} = authModule;

export const {
  fetchAllCourses,
  fetchCourseById,
  createNewCourse,
  updateCourse,
  fetchCourseAnalytics,
  clearCurrentCourse,
} = coursesModule;

export const {
  enrollInCourse,
  fetchEnrollmentStatus,
  updateProgress,
  fetchEnrolledCourses,
  resetEnrollment,
} = enrollmentModule;

export const { fetchAllTeachers } = teachersModule;

export const {
  fetchAllAdminData,
  deleteUserAdmin,
  deleteCourseAdmin,
  updateCourseAdmin,
  fetchStudentEnrollmentByEmail,
  fetchTeacherCoursesByEmail,
  clearLookup,
} = adminModule;

export const {
  fetchAdminAnalytics,
  fetchGrowthTrends,
  fetchSubjectDistribution,
  fetchTopCourses,
  fetchInstructorLeaderboard,
  fetchInstructorAnalytics,
  fetchInstructorStudentAnalytics,
  clearAnalytics,
} = analyticsModule;

export default store;
