import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

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
  async ({ courseId, progressData }, { rejectWithValue, dispatch }) => {
    try {
      const updated = await apiRequest(
        `/enrollment/${courseId}/progress`,
        "PUT",
        progressData,
      );

      try {
        dispatch(fetchEnrolledCourses());
      } catch (e) {
        console.warn(
          "Failed to refresh enrolled courses after progress update",
          e,
        );
      }

      return updated;
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

export default enrollmentSlice.reducer;
