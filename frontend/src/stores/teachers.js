import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

export const fetchAllTeachers = createAsyncThunk(
  "teachers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest("/auth/teachers", "GET");
    } catch (err) {
      return rejectWithValue(null);
    }
  },
);

const teachersSlice = createSlice({
  name: "teachers",
  initialState: {
    entities: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.reduce((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {});
      })
      .addCase(fetchAllTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default teachersSlice.reducer;
