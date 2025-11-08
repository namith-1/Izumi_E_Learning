import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ==========================================
// 1. API UTILITY (Internal Helper)
// ==========================================
const BASE_URL = 'http://localhost:5000/api';

/**
 * Universal fetch wrapper that handles JSON headers and credentials (cookies).
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Allows session cookies to be sent/received
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
};

// ==========================================
// 2. AUTHENTICATION (Thunks & Slice)
// ==========================================

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/register', 'POST', userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/login', 'POST', credentials);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiRequest('/auth/logout', 'POST');
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/me', 'GET');
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
    'auth/updateProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            const data = await apiRequest('/auth/profile', 'PUT', profileData);
            return data.user;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const authSlice = createSlice({
  name: 'auth',
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
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; })
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => { state.loading = true; })
      .addCase(checkAuthStatus.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(checkAuthStatus.rejected, (state) => { state.loading = false; state.user = null; })
      // Profile Update
      .addCase(updateStudentProfile.fulfilled, (state, action) => { 
        state.user = { ...state.user, name: action.payload.name };
      });
  },
});

export const { clearAuthErrors } = authSlice.actions;

// ==========================================
// 3. COURSES (Thunks & Slice)
// ==========================================

export const fetchAllCourses = createAsyncThunk(
  'courses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest('/courses', 'GET');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await apiRequest(`/courses/${id}`, 'GET');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createNewCourse = createAsyncThunk(
  'courses/create',
  async (courseData, { rejectWithValue }) => {
    try {
      return await apiRequest('/courses', 'POST', courseData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/courses/${id}`, 'PUT', data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCourseAnalytics = createAsyncThunk(
  'courses/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest('/courses/analytics', 'GET'); 
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
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
      .addCase(fetchAllCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllCourses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchAllCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(fetchCourseById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourseById.fulfilled, (state, action) => { state.loading = false; state.currentCourse = action.payload; })
      .addCase(fetchCourseById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(createNewCourse.fulfilled, (state, action) => { state.list.push(action.payload); })
      
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.currentCourse = action.payload;
        const index = state.list.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
      })
      
      .addCase(fetchCourseAnalytics.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourseAnalytics.fulfilled, (state, action) => { state.loading = false; state.analyticsData = action.payload; })
      .addCase(fetchCourseAnalytics.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.analyticsData = []; });
  },
});

export const { clearCurrentCourse } = courseSlice.actions;

// ==========================================
// 4. ENROLLMENT (Thunks & Slice)
// ==========================================

export const enrollInCourse = createAsyncThunk(
  'enrollment/enroll',
  async (courseId, { rejectWithValue }) => {
    try {
      const result = await apiRequest('/enrollment/enroll', 'POST', { courseId });
      return result; 
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEnrollmentStatus = createAsyncThunk(
  'enrollment/fetchStatus',
  async (courseId, { rejectWithValue }) => {
    try {
      const enrollment = await apiRequest(`/enrollment/${courseId}`, 'GET');
      return enrollment; 
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProgress = createAsyncThunk(
  'enrollment/updateProgress',
  async ({ courseId, progressData }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/enrollment/${courseId}/progress`, 'PUT', progressData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEnrolledCourses = createAsyncThunk(
    'enrollment/fetchEnrolledCourses',
    async (_, { rejectWithValue }) => {
        try {
            return await apiRequest('/enrollment/my-courses', 'GET');
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const enrollmentSlice = createSlice({
  name: 'enrollment',
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
      .addCase(enrollInCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(enrollInCourse.fulfilled, (state, action) => { 
        state.loading = false; 
        state.currentEnrollment = action.payload; 
      })
      .addCase(enrollInCourse.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      .addCase(fetchEnrollmentStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEnrollmentStatus.fulfilled, (state, action) => { 
        state.loading = false; 
        state.currentEnrollment = action.payload; 
      })
      .addCase(fetchEnrollmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload && action.payload.includes('Not enrolled')) {
             state.currentEnrollment = null; 
             state.error = null; 
        }
      })
      
      .addCase(fetchEnrolledCourses.pending, (state) => { state.loading = true; state.error = null; })
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
  'teachers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest('/auth/teachers', 'GET'); 
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

const teachersSlice = createSlice({
  name: 'teachers',
  initialState: {
    entities: {}, 
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTeachers.pending, (state) => { state.loading = true; state.error = null; })
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
  'admin/fetchAllData',
  async (_, { rejectWithValue }) => {
    try {
      const [users, courses, enrollments] = await Promise.all([
          apiRequest('/admin/users', 'GET'),
          apiRequest('/admin/courses', 'GET'),
          apiRequest('/admin/enrollments', 'GET')
      ]);
      return { users, courses, enrollments };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteUserAdmin = createAsyncThunk(
    'admin/deleteUser',
    async ({ role, id }, { rejectWithValue }) => {
        try {
            await apiRequest(`/admin/users/${role}/${id}`, 'DELETE');
            return { role, id };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteCourseAdmin = createAsyncThunk(
    'admin/deleteCourse',
    async (id, { rejectWithValue }) => {
        try {
            await apiRequest(`/admin/courses/${id}`, 'DELETE');
            return id;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateCourseAdmin = createAsyncThunk(
    'admin/updateCourse',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            return await apiRequest(`/admin/courses/${id}`, 'PUT', data); 
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchStudentEnrollmentByEmail = createAsyncThunk(
    'admin/lookupStudent',
    async (email, { rejectWithValue }) => {
        try {
            const encodedEmail = encodeURIComponent(email);
            return await apiRequest(`/admin/enrollments/student/${encodedEmail}`, 'GET');
        } catch (err) {
            if (err.message.includes('Student not found')) {
                 return rejectWithValue('Student not found with that email.');
            }
            return rejectWithValue(err.message);
        }
    }
);

export const fetchTeacherCoursesByEmail = createAsyncThunk(
    'admin/lookupTeacher',
    async (email, { rejectWithValue }) => {
        try {
            const encodedEmail = encodeURIComponent(email);
            return await apiRequest(`/admin/teachers/courses/${encodedEmail}`, 'GET');
        } catch (err) {
            if (err.message.includes('Teacher not found')) {
                 return rejectWithValue('Teacher not found with that email.');
            }
            return rejectWithValue(err.message);
        }
    }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    students: [],
    teachers: [],
    courses: [],
    enrollments: [],
    loading: false,
    error: null,
    // Lookup States
    lookupResult: null, 
    lookupError: null,
    lookupLoading: false,
    lookupType: null, // 'student' or 'teacher'
  },
  reducers: {
       clearLookup: (state) => {
            state.lookupResult = null;
            state.lookupError = null;
            state.lookupType = null;
       }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Data
      .addCase(fetchAllAdminData.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllAdminData.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.users.students;
        state.teachers = action.payload.users.teachers;
        state.courses = action.payload.courses; 
        state.enrollments = action.payload.enrollments;
      })
      .addCase(fetchAllAdminData.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      // Delete User
      .addCase(deleteUserAdmin.fulfilled, (state, action) => {
        const { role, id } = action.payload;
        if (role === 'student') {
            state.students = state.students.filter(u => u._id !== id);
            // Also clean up enrollments
            state.enrollments = state.enrollments.filter(e => e.studentName !== action.payload.name); // Using ID would be safer if enrollment had studentID flat
        } else if (role === 'teacher') {
            state.teachers = state.teachers.filter(u => u._id !== id);
            state.courses = state.courses.filter(c => c.teacherId !== id);
        }
      })
      
      // Delete Course
      .addCase(deleteCourseAdmin.fulfilled, (state, action) => {
        const id = action.payload;
        state.courses = state.courses.filter(c => c._id !== id);
        state.enrollments = state.enrollments.filter(e => e.courseId !== id); // Note: Assuming enrollment objects have courseId available or mapped
      })

      // Update Course
      .addCase(updateCourseAdmin.fulfilled, (state, action) => {
          const updatedCourse = action.payload;
          const index = state.courses.findIndex(c => c._id === updatedCourse._id);
          if (index !== -1) {
              state.courses[index] = updatedCourse;
          }
      })
      
      // Student Lookup
      .addCase(fetchStudentEnrollmentByEmail.pending, (state) => {
          state.lookupLoading = true;
          state.lookupError = null;
          state.lookupResult = null;
          state.lookupType = 'student';
      })
      .addCase(fetchStudentEnrollmentByEmail.fulfilled, (state, action) => {
          state.lookupLoading = false;
          state.lookupResult = action.payload;
      })
      .addCase(fetchStudentEnrollmentByEmail.rejected, (state, action) => {
          state.lookupLoading = false;
          state.lookupError = action.payload;
      })

      // Teacher Lookup
      .addCase(fetchTeacherCoursesByEmail.pending, (state) => {
          state.lookupLoading = true;
          state.lookupError = null;
          state.lookupResult = null;
          state.lookupType = 'teacher';
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
// 7. STORE CONFIGURATION
// ==========================================
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    courses: courseSlice.reducer,
    enrollment: enrollmentSlice.reducer,
    teachers: teachersSlice.reducer,
    admin: adminSlice.reducer, 
  },
});

export default store;