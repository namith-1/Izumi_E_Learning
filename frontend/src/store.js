import {
  configureStore,
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

// ==========================================
// 1. API UTILITY (Internal Helper)
// ==========================================
const BASE_URL = "http://localhost:5000/api";

/**
 * Universal fetch wrapper.
 * Automatically detects FormData to allow multipart/form-data (Multer) uploads.
 */
const apiRequest = async (endpoint, method = "GET", body = null) => {
  const config = {
    method,
    headers: {},
    credentials: "include", // CRITICAL: Allows session cookies
  };

  // If body is FormData, we let the browser set the boundary and Content-Type
  if (body instanceof FormData) {
    config.body = body;
  } else if (body) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // Throw the parsed response object so callers can inspect fields like blockedUntil
    const err = data || { message: "Something went wrong" };
    err.status = response.status;
    throw err;
  }

  return data;
};

// ==========================================
// 2. AUTHENTICATION (Thunks & Slice)
// ==========================================

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await apiRequest("/auth/register", "POST", userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiRequest("/auth/login", "POST", credentials);
      return data.user;
    } catch (err) {
      // Pass the whole error object so callers can inspect e.g. blockedUntil
      return rejectWithValue(err);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiRequest("/auth/logout", "POST");
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest("/auth/me", "GET");
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateStudentProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      // profileData can now be FormData (containing profileImage) or JSON
      const data = await apiRequest("/auth/profile", "PUT", profileData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: true,
    error: null,
  },
  reducers: {
    clearAuthErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.user = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        // Update user state with new name and profilePic path
        state.user = action.payload;
      });
  },
});

export const { clearAuthErrors } = authSlice.actions;

// ==========================================
// 3. COURSES (Thunks & Slice)
// ==========================================

export const fetchAllCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/courses", "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await apiRequest(`/courses/${id}`, "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createNewCourse = createAsyncThunk(
  "courses/create",
  async (courseData, { rejectWithValue }) => {
    try {
      return await apiRequest("/courses", "POST", courseData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateCourse = createAsyncThunk(
  "courses/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/courses/${id}`, "PUT", data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchCourseAnalytics = createAsyncThunk(
  "courses/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/courses/analytics", "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const courseSlice = createSlice({
  name: "courses",
  initialState: {
    list: [],
    currentCourse: null,
    loading: false,
    error: null,
    analyticsData: [],
  },
  reducers: {
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewCourse.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.currentCourse = action.payload;
        const index = state.list.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
      })
      .addCase(fetchCourseAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analyticsData = action.payload;
      })
      .addCase(fetchCourseAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.analyticsData = [];
      });
  },
});

export const { clearCurrentCourse } = courseSlice.actions;

// ==========================================
// 4. ENROLLMENT (Thunks & Slice)
// ==========================================

export const enrollInCourse = createAsyncThunk(
  "enrollment/enroll",
  async (courseId, { rejectWithValue }) => {
    try {
      const result = await apiRequest("/enrollment/enroll", "POST", {
        courseId,
      });
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchEnrollmentStatus = createAsyncThunk(
  "enrollment/fetchStatus",
  async (courseId, { rejectWithValue }) => {
    try {
      const enrollment = await apiRequest(`/enrollment/${courseId}`, "GET");
      return enrollment;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateProgress = createAsyncThunk(
  "enrollment/updateProgress",
  async ({ courseId, progressData }, { rejectWithValue }) => {
    try {
      return await apiRequest(
        `/enrollment/${courseId}/progress`,
        "PUT",
        progressData,
      );
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchEnrolledCourses = createAsyncThunk(
  "enrollment/fetchEnrolledCourses",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/enrollment/my-courses", "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState: {
    currentEnrollment: null,
    enrolledList: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetEnrollment: (state) => {
      state.currentEnrollment = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(enrollInCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEnrollment = action.payload;
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEnrollmentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrollmentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEnrollment = action.payload;
      })
      .addCase(fetchEnrollmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload && action.payload.includes("Not enrolled")) {
          state.currentEnrollment = null;
          state.error = null;
        }
      })
      .addCase(fetchEnrolledCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.enrolledList = action.payload;
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.enrolledList = [];
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.currentEnrollment = action.payload;
      });
  },
});

export const { resetEnrollment } = enrollmentSlice.actions;

// ==========================================
// 5. TEACHERS (Thunks & Slice)
// ==========================================

export const fetchAllTeachers = createAsyncThunk(
  "teachers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/auth/teachers", "GET");
    } catch (err) {
      return rejectWithValue(null);
    }
  },
);

const teachersSlice = createSlice({
  name: "teachers",
  initialState: {
    entities: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.reduce((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {});
      })
      .addCase(fetchAllTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ==========================================
// 6. ADMIN (Thunks & Slice)
// ==========================================

export const fetchAllAdminData = createAsyncThunk(
  "admin/fetchAllData",
  async (_, { rejectWithValue }) => {
    try {
      const [users, courses, enrollments] = await Promise.all([
        apiRequest("/admin/users", "GET"),
        apiRequest("/admin/courses", "GET"),
        apiRequest("/admin/enrollments", "GET"),
      ]);
      return { users, courses, enrollments };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteUserAdmin = createAsyncThunk(
  "admin/deleteUser",
  async ({ role, id }, { rejectWithValue }) => {
    try {
      await apiRequest(`/admin/users/${role}/${id}`, "DELETE");
      return { role, id };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteCourseAdmin = createAsyncThunk(
  "admin/deleteCourse",
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/admin/courses/${id}`, "DELETE");
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateCourseAdmin = createAsyncThunk(
  "admin/updateCourse",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/admin/courses/${id}`, "PUT", data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchStudentEnrollmentByEmail = createAsyncThunk(
  "admin/lookupStudent",
  async (email, { rejectWithValue }) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      return await apiRequest(
        `/admin/enrollments/student/${encodedEmail}`,
        "GET",
      );
    } catch (err) {
      if (err.message.includes("Student not found")) {
        return rejectWithValue("Student not found with that email.");
      }
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTeacherCoursesByEmail = createAsyncThunk(
  "admin/lookupTeacher",
  async (email, { rejectWithValue }) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      return await apiRequest(`/admin/teachers/courses/${encodedEmail}`, "GET");
    } catch (err) {
      if (err.message.includes("Teacher not found")) {
        return rejectWithValue("Teacher not found with that email.");
      }
      return rejectWithValue(err.message);
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    students: [],
    teachers: [],
    courses: [],
    enrollments: [],
    loading: false,
    error: null,
    lookupResult: null,
    lookupError: null,
    lookupLoading: false,
    lookupType: null,
  },
  reducers: {
    clearLookup: (state) => {
      state.lookupResult = null;
      state.lookupError = null;
      state.lookupType = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAdminData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAdminData.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.users.students;
        state.teachers = action.payload.users.teachers;
        state.courses = action.payload.courses;
        state.enrollments = action.payload.enrollments;
      })
      .addCase(fetchAllAdminData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUserAdmin.fulfilled, (state, action) => {
        const { role, id } = action.payload;
        if (role === "student") {
          state.students = state.students.filter((u) => u._id !== id);
        } else if (role === "teacher") {
          state.teachers = state.teachers.filter((u) => u._id !== id);
          state.courses = state.courses.filter((c) => c.teacherId !== id);
        }
      })
      .addCase(deleteCourseAdmin.fulfilled, (state, action) => {
        const id = action.payload;
        state.courses = state.courses.filter((c) => c._id !== id);
        state.enrollments = state.enrollments.filter((e) => e.courseId !== id);
      })
      .addCase(updateCourseAdmin.fulfilled, (state, action) => {
        const updatedCourse = action.payload;
        const index = state.courses.findIndex(
          (c) => c._id === updatedCourse._id,
        );
        if (index !== -1) state.courses[index] = updatedCourse;
      })
      .addCase(fetchStudentEnrollmentByEmail.pending, (state) => {
        state.lookupLoading = true;
        state.lookupError = null;
        state.lookupResult = null;
        state.lookupType = "student";
      })
      .addCase(fetchStudentEnrollmentByEmail.fulfilled, (state, action) => {
        state.lookupLoading = false;
        state.lookupResult = action.payload;
      })
      .addCase(fetchStudentEnrollmentByEmail.rejected, (state, action) => {
        state.lookupLoading = false;
        state.lookupError = action.payload;
      })
      .addCase(fetchTeacherCoursesByEmail.pending, (state) => {
        state.lookupLoading = true;
        state.lookupError = null;
        state.lookupResult = null;
        state.lookupType = "teacher";
      })
      .addCase(fetchTeacherCoursesByEmail.fulfilled, (state, action) => {
        state.lookupLoading = false;
        state.lookupResult = action.payload;
      })
      .addCase(fetchTeacherCoursesByEmail.rejected, (state, action) => {
        state.lookupLoading = false;
        state.lookupError = action.payload;
      });
  },
});

export const { clearLookup } = adminSlice.actions;

// ==========================================
// 7. ANALYTICS (Thunks & Slice)
// ==========================================

export const fetchAdminAnalytics = createAsyncThunk(
  "analytics/fetchAdminOverview",
  async (days = 30, { rejectWithValue }) => {
    try {
      return await apiRequest(`/analytics/admin/overview?days=${days}`, "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchGrowthTrends = createAsyncThunk(
  "analytics/fetchGrowthTrends",
  async (params = 30, { rejectWithValue }) => {
    try {
      const days = typeof params === "number" ? params : params.days || 30;
      const subject = typeof params === "object" ? params.subject : null;
      let query = `/analytics/admin/growth-trends?days=${days}`;
      if (subject && subject !== "All")
        query += `&subject=${encodeURIComponent(subject)}`;
      return await apiRequest(query, "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchSubjectDistribution = createAsyncThunk(
  "analytics/fetchSubjectDistribution",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/analytics/admin/subject-distribution", "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTopCourses = createAsyncThunk(
  "analytics/fetchTopCourses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const limit = params.limit || 10;
      const sortBy = params.sortBy || "enrollments";
      const subject = params.subject;

      let query = `/analytics/admin/top-courses?limit=${limit}&sortBy=${sortBy}`;
      if (subject && subject !== "All")
        query += `&subject=${encodeURIComponent(subject)}`;

      return await apiRequest(query, "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchInstructorLeaderboard = createAsyncThunk(
  "analytics/fetchInstructorLeaderboard",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/analytics/admin/instructor-leaderboard", "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchInstructorAnalytics = createAsyncThunk(
  "analytics/fetchInstructorAnalytics",
  async (params = 30, { rejectWithValue }) => {
    try {
      const days = typeof params === "number" ? params : params.days || 30;
      const instructorId =
        typeof params === "object" ? params.instructorId : null;
      let query = `/analytics/instructor/my-stats?days=${days}`;
      if (instructorId) query += `&instructorId=${instructorId}`;
      return await apiRequest(query, "GET");
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchInstructorStudentAnalytics = createAsyncThunk(
  "analytics/fetchInstructorStudentAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/analytics/instructor/student-analytics", "GET"); // Prefix with /analytics
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    overview: null,
    growthTrends: null,
    subjectDistribution: [],
    topCourses: [],
    instructorLeaderboard: [],
    instructorStats: null,
    studentAnalytics: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAnalytics: (state) => {
      state.overview = null;
      state.growthTrends = null;
      state.subjectDistribution = [];
      state.topCourses = [];
      state.instructorLeaderboard = [];
      state.instructorStats = null;
      state.studentAnalytics = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchGrowthTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGrowthTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.growthTrends = action.payload;
      })
      .addCase(fetchGrowthTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSubjectDistribution.fulfilled, (state, action) => {
        state.subjectDistribution = action.payload;
      })
      .addCase(fetchTopCourses.fulfilled, (state, action) => {
        state.topCourses = action.payload;
      })
      .addCase(fetchInstructorLeaderboard.fulfilled, (state, action) => {
        state.instructorLeaderboard = action.payload;
      })
      // Instructor Analytics
      .addCase(fetchInstructorAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.instructorStats = action.payload;
      })
      .addCase(fetchInstructorAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Instructor Student Analytics
      .addCase(fetchInstructorStudentAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorStudentAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.studentAnalytics = action.payload;
      })
      .addCase(fetchInstructorStudentAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;

// ==========================================
// 8. STORE CONFIGURATION
// ==========================================
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    courses: courseSlice.reducer,
    enrollment: enrollmentSlice.reducer,
    teachers: teachersSlice.reducer,
    admin: adminSlice.reducer,
    analytics: analyticsSlice.reducer,
  },
});

export default store;
