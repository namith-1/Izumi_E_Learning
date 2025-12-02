import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminAuthApi from '../../services/adminAuthApi';

// Async thunks for admin authentication
export const adminSignup = createAsyncThunk(
  'auth/adminSignup',
  async (adminData, { rejectWithValue }) => {
    try {
      console.log('[Redux] Attempting admin signup');
      const response = await adminAuthApi.signupAdmin(adminData);
      console.log('[Redux] Signup successful, response:', response);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
      console.error('[Redux] Signup error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('[Redux] Attempting admin login with:', { email: credentials.email });
      const response = await adminAuthApi.loginAdmin(credentials);
      console.log('[Redux] Login successful, response:', response);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('[Redux] Login error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const adminLogout = createAsyncThunk(
  'auth/adminLogout',
  async (_, { rejectWithValue }) => {
    try {
      await adminAuthApi.logoutAdmin();
      localStorage.removeItem('admin');
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const checkAdminAuth = createAsyncThunk(
  'auth/checkAdminAuth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[Redux] Checking admin auth...');
      const admin = localStorage.getItem('admin');
      if (!admin) {
        console.log('[Redux] No admin in localStorage');
        return rejectWithValue('No admin found');
      }

      console.log('[Redux] Verifying session with server...');
      const response = await adminAuthApi.getAdminProfile();
      console.log('[Redux] Session valid, response:', response);
      return response;
    } catch (error) {
      console.error('[Redux] Auth check failed:', error.message);
      localStorage.removeItem('admin');
      return rejectWithValue('Session expired');
    }
  }
);

const initialState = {
  admin: localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')) : null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('admin'),
  lastUpdated: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.admin = null;
      state.isAuthenticated = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Admin Signup
    builder
      .addCase(adminSignup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminSignup.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.admin = action.payload.admin;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(adminSignup.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.admin = null;
      });

    // Admin Login
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.admin = action.payload.admin;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.admin = null;
      });

    // Admin Logout
    builder
      .addCase(adminLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.error = null;
      })
      .addCase(adminLogout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Check Auth
    builder
      .addCase(checkAdminAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAdminAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.admin = action.payload;
        state.error = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(checkAdminAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;