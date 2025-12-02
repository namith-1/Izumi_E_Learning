import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as instructorAuthApi from '../../services/instructorAuthApi';

export const checkInstructorAuth = createAsyncThunk(
  'instructorAuth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instructorAuthApi.checkInstructorAuth();
      return response;
    } catch (error) {
      const message = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Not authenticated');
      return rejectWithValue(message);
    }
  }
);

export const loginInstructor = createAsyncThunk(
  'instructorAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await instructorAuthApi.loginInstructor(credentials);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Login failed');
      return rejectWithValue(message);
    }
  }
);

export const signupInstructor = createAsyncThunk(
  'instructorAuth/signup',
  async (data, { rejectWithValue }) => {
    try {
      const response = await instructorAuthApi.signupInstructor(data);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Signup failed');
      return rejectWithValue(message);
    }
  }
);

export const logoutInstructor = createAsyncThunk(
  'instructorAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await instructorAuthApi.logoutInstructor();
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

const initialState = {
  instructor: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const instructorAuthSlice = createSlice({
  name: 'instructorAuth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkInstructorAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkInstructorAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.instructor = action.payload;
      })
      .addCase(checkInstructorAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.instructor = null;
      })
      // Login
      .addCase(loginInstructor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginInstructor.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.instructor = action.payload;
      })
      .addCase(loginInstructor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Signup
      .addCase(signupInstructor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupInstructor.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.instructor = action.payload;
      })
      .addCase(signupInstructor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutInstructor.fulfilled, (state) => {
        state.instructor = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = instructorAuthSlice.actions;
export default instructorAuthSlice.reducer;
