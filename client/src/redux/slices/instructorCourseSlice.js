import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as instructorCourseApi from '../../services/instructorCourseApi';

export const fetchInstructorCourses = createAsyncThunk(
  'instructorCourse/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instructorCourseApi.getInstructorCourses();
      return response;
    } catch (error) {
      const message = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Failed to fetch courses');
      return rejectWithValue(message);
    }
  }
);

export const createCourse = createAsyncThunk(
  'instructorCourse/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      console.log('Creating course with data:', courseData);
      const response = await instructorCourseApi.saveCourse(courseData);
      console.log('Course creation response:', response);
      return response;
    } catch (error) {
      console.error('Course creation error:', error);
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create course';
      return rejectWithValue(message);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'instructorCourse/updateCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await instructorCourseApi.saveCourseChanges(courseData);
      return response;
    } catch (error) {
      // Check for 'error' field which is common in this backend
      const message = error.response?.data?.error || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Failed to update course');
      return rejectWithValue(message);
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'instructorCourse/fetchCourseDetails',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await instructorCourseApi.getCourseDetails(courseId);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Failed to fetch course details');
      return rejectWithValue(message);
    }
  }
);

const instructorCourseSlice = createSlice({
  name: 'instructorCourse',
  initialState: {
    courses: [],
    currentCourse: null,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchInstructorCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstructorCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchInstructorCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Course
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        // If backend returned authoritative modules tree, set currentCourse
        if (action.payload.courseId && action.payload.modules) {
          state.currentCourse = {
            _id: action.payload.courseId,
            title: state.currentCourse?.title || '',
            modules: action.payload.modules
          };
        }
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        // Sync modules immediately if backend returned saved tree
        if (action.payload.courseId && action.payload.modules) {
          state.currentCourse = {
            ...(state.currentCourse || {}),
            _id: action.payload.courseId,
            modules: action.payload.modules
          };
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Course Details
      .addCase(fetchCourseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccessMessage, clearCurrentCourse } = instructorCourseSlice.actions;
export default instructorCourseSlice.reducer;
