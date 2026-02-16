import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

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
        state.user = action.payload;
      });
  },
});

export const { clearAuthErrors } = authSlice.actions;

export default authSlice.reducer;
