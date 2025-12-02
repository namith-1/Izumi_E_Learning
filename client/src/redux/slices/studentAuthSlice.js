import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as studentAuthApi from '../../services/studentAuthApi';

export const studentLogin = createAsyncThunk(
  'studentAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      await studentAuthApi.loginStudent(credentials);
      // Assuming response contains student info or success message
      // We might need to fetch profile immediately after if login doesn't return user
      const profile = await studentAuthApi.getStudentProfile();
      return profile;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const studentSignup = createAsyncThunk(
  'studentAuth/signup',
  async (studentData, { rejectWithValue }) => {
    try {
      await studentAuthApi.signupStudent(studentData);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  }
);

export const studentLogout = createAsyncThunk(
  'studentAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await studentAuthApi.logoutStudent();
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const checkStudentAuth = createAsyncThunk(
  'studentAuth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentAuthApi.getStudentProfile();
      return response;
    } catch (error) {
      return rejectWithValue('Session expired');
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  'studentAuth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      await studentAuthApi.updateStudentProfile(profileData);
      return profileData; // Optimistic update or fetch again
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

const initialState = {
  student: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const studentAuthSlice = createSlice({
  name: 'studentAuth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(studentLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(studentLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.student = action.payload;
      })
      .addCase(studentLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkStudentAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkStudentAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.student = action.payload;
      })
      .addCase(checkStudentAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.student = null;
      })
      // Logout
      .addCase(studentLogout.fulfilled, (state) => {
        state.student = null;
        state.isAuthenticated = false;
      })
      // Update Profile
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.student = { ...state.student, ...action.payload };
      });
  },
});

export const { clearError } = studentAuthSlice.actions;
export default studentAuthSlice.reducer;
