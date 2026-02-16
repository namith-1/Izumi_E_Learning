import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

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
      return await apiRequest("/analytics/instructor/student-analytics", "GET");
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

export default analyticsSlice.reducer;
