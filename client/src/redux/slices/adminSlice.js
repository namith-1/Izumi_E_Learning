import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminApi from '../../services/adminApi';

// Async thunks for admin data operations
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getDashboardStats();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getUsers();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'admin/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getCourses();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchPayments = createAsyncThunk(
  'admin/fetchPayments',
  async (range = 'daily', { rejectWithValue }) => {
    try {
      const response = await adminApi.getPayments(range);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const fetchRequests = createAsyncThunk(
  'admin/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getRequests();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
    }
  }
);

export const fetchContent = createAsyncThunk(
  'admin/fetchContent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.getContent();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content');
    }
  }
);

// User operations
export const addUser = createAsyncThunk(
  'admin/addUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await adminApi.createUser(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await adminApi.updateUser(userId, userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      await adminApi.deleteUser(userId, role);
      return { userId, role };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// Course operations
export const addCourse = createAsyncThunk(
  'admin/addCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await adminApi.createCourse(courseData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create course');
    }
  }
);

export const updateCourse = createAsyncThunk(
  'admin/updateCourse',
  async ({ courseId, courseData }, { rejectWithValue }) => {
    try {
      const response = await adminApi.updateCourse(courseId, courseData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update course');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'admin/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      await adminApi.deleteCourse(courseId);
      return courseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete course');
    }
  }
);

// Payment operations
export const updatePaymentStatus = createAsyncThunk(
  'admin/updatePaymentStatus',
  async ({ paymentId, status }, { rejectWithValue }) => {
    try {
      const response = await adminApi.updatePaymentStatus(paymentId, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment status');
    }
  }
);

// Request operations
export const updateRequest = createAsyncThunk(
  'admin/updateRequest',
  async ({ requestId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await adminApi.updateRequest(requestId, { status, notes });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update request');
    }
  }
);

export const deleteRequest = createAsyncThunk(
  'admin/deleteRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await adminApi.deleteRequest(requestId);
      return requestId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete request');
    }
  }
);

// Content operations
export const addContent = createAsyncThunk(
  'admin/addContent',
  async (contentData, { rejectWithValue }) => {
    try {
      const response = await adminApi.createContent(contentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create content');
    }
  }
);

export const updateContent = createAsyncThunk(
  'admin/updateContent',
  async ({ contentId, contentData }, { rejectWithValue }) => {
    try {
      const response = await adminApi.updateContent(contentId, contentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update content');
    }
  }
);

export const deleteContent = createAsyncThunk(
  'admin/deleteContent',
  async (contentId, { rejectWithValue }) => {
    try {
      await adminApi.deleteContent(contentId);
      return contentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete content');
    }
  }
);

const initialState = {
  // Dashboard
  dashboardStats: null,
  
  // Users
  users: [],
  
  // Courses
  courses: [],
  
  // Payments
  payments: [],
  paymentStats: null,
  
  // Requests
  requests: [],
  
  // Content
  content: [],
  
  // Loading & Error
  loading: false,
  error: null,
  success: false,
  successMessage: null,
  
  // Filter states
  currentFilter: {
    users: {},
    courses: {},
    payments: {},
    requests: {},
    content: {}
  }
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.successMessage = null;
    },
    setFilter: (state, action) => {
      const { section, filter } = action.payload;
      state.currentFilter[section] = filter;
    },
    clearFilters: (state) => {
      state.currentFilter = {
        users: {},
        courses: {},
        payments: {},
        requests: {},
        content: {}
      };
    }
  },
  extraReducers: (builder) => {
    // Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add User
    builder
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
        state.success = true;
        state.successMessage = 'User added successfully';
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.success = true;
        state.successMessage = 'User updated successfully';
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(u => u._id !== action.payload.userId);
        state.success = true;
        state.successMessage = 'User deleted successfully';
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Courses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
        state.error = null;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Course
    builder
      .addCase(addCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.push(action.payload);
        state.success = true;
        state.successMessage = 'Course added successfully';
      })
      .addCase(addCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Course
    builder
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.courses.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        state.success = true;
        state.successMessage = 'Course updated successfully';
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Course
    builder
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(c => c._id !== action.payload);
        state.success = true;
        state.successMessage = 'Course deleted successfully';
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Payments
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments || [];
        state.paymentStats = action.payload.stats;
        state.error = null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Payment Status
    builder
      .addCase(updatePaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.payments.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
        state.success = true;
        state.successMessage = 'Payment status updated successfully';
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Requests
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
        state.error = null;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Request
    builder
      .addCase(updateRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRequest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.requests.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
        state.success = true;
        state.successMessage = 'Request updated successfully';
      })
      .addCase(updateRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Request
    builder
      .addCase(deleteRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = state.requests.filter(r => r._id !== action.payload);
        state.success = true;
        state.successMessage = 'Request deleted successfully';
      })
      .addCase(deleteRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Content
    builder
      .addCase(fetchContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content = action.payload;
        state.error = null;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Content
    builder
      .addCase(addContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content.push(action.payload);
        state.success = true;
        state.successMessage = 'Content added successfully';
      })
      .addCase(addContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Content
    builder
      .addCase(updateContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.content.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.content[index] = action.payload;
        }
        state.success = true;
        state.successMessage = 'Content updated successfully';
      })
      .addCase(updateContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Content
    builder
      .addCase(deleteContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content = state.content.filter(c => c._id !== action.payload);
        state.success = true;
        state.successMessage = 'Content deleted successfully';
      })
      .addCase(deleteContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccess, setFilter, clearFilters } = adminSlice.actions;
export default adminSlice.reducer;
