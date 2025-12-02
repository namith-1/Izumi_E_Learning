import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as studentApi from '../../services/studentApi';

export const fetchStudentProgress = createAsyncThunk(
  'student/fetchProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getStudentProgress();
      return response.data || response; // Handle wrapped response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch progress');
    }
  }
);

export const fetchPurchases = createAsyncThunk(
  'student/fetchPurchases',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getPurchases();
      return response.purchases || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch purchases');
    }
  }
);

export const fetchQuestions = createAsyncThunk(
  'student/fetchQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getQuestions();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions');
    }
  }
);

export const fetchMyQuestions = createAsyncThunk(
  'student/fetchMyQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getMyQuestions();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my questions');
    }
  }
);

export const createQuestion = createAsyncThunk(
  'student/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      const response = await studentApi.postQuestion(questionData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create question');
    }
  }
);

const initialState = {
  progress: [],
  purchases: [],
  questions: [],
  myQuestions: [],
  loading: false,
  error: null,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    clearStudentData: (state) => {
      state.progress = [];
      state.purchases = [];
      state.questions = [];
      state.myQuestions = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Progress
      .addCase(fetchStudentProgress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.progress = action.payload;
      })
      .addCase(fetchStudentProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Purchases
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.purchases = action.payload;
      })
      // Questions
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
      })
      // My Questions
      .addCase(fetchMyQuestions.fulfilled, (state, action) => {
        state.myQuestions = action.payload;
      })
      // Create Question
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.myQuestions.push(action.payload);
        state.questions.push(action.payload);
      });
  },
});

export const { clearStudentData } = studentSlice.actions;
export default studentSlice.reducer;
