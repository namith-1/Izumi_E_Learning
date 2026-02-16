import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

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

export default courseSlice.reducer;
