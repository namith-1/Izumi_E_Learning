import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

export const fetchAllAdminData = createAsyncThunk(
  "admin/fetchAllData",
  async (_, { rejectWithValue }) => {
    try {
      const [users, courses, enrollments] = await Promise.all([
        apiRequest("/admin/users", "GET"),
        apiRequest("/admin/courses", "GET"),
        apiRequest("/admin/enrollments", "GET"),
      ]);
      return { users, courses, enrollments };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteUserAdmin = createAsyncThunk(
  "admin/deleteUser",
  async ({ role, id }, { rejectWithValue }) => {
    try {
      await apiRequest(`/admin/users/${role}/${id}`, "DELETE");
      return { role, id };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const deleteCourseAdmin = createAsyncThunk(
  "admin/deleteCourse",
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/admin/courses/${id}`, "DELETE");
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateCourseAdmin = createAsyncThunk(
  "admin/updateCourse",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/admin/courses/${id}`, "PUT", data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchStudentEnrollmentByEmail = createAsyncThunk(
  "admin/lookupStudent",
  async (email, { rejectWithValue }) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      return await apiRequest(
        `/admin/enrollments/student/${encodedEmail}`,
        "GET",
      );
    } catch (err) {
      if (err.message.includes("Student not found")) {
        return rejectWithValue("Student not found with that email.");
      }
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTeacherCoursesByEmail = createAsyncThunk(
  "admin/lookupTeacher",
  async (email, { rejectWithValue }) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      return await apiRequest(`/admin/teachers/courses/${encodedEmail}`, "GET");
    } catch (err) {
      if (err.message.includes("Teacher not found")) {
        return rejectWithValue("Teacher not found with that email.");
      }
      return rejectWithValue(err.message);
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    students: [],
    teachers: [],
    courses: [],
    enrollments: [],
    loading: false,
    error: null,
    lookupResult: null,
    lookupError: null,
    lookupLoading: false,
    lookupType: null,
  },
  reducers: {
    clearLookup: (state) => {
      state.lookupResult = null;
      state.lookupError = null;
      state.lookupType = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAdminData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAdminData.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.users.students;
        state.teachers = action.payload.users.teachers;
        state.courses = action.payload.courses;
        state.enrollments = action.payload.enrollments;
      })
      .addCase(fetchAllAdminData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUserAdmin.fulfilled, (state, action) => {
        const { role, id } = action.payload;
        if (role === "student") {
          state.students = state.students.filter((u) => u._id !== id);
        } else if (role === "teacher") {
          state.teachers = state.teachers.filter((u) => u._id !== id);
          state.courses = state.courses.filter((c) => c.teacherId !== id);
        }
      })
      .addCase(deleteCourseAdmin.fulfilled, (state, action) => {
        const id = action.payload;
        state.courses = state.courses.filter((c) => c._id !== id);
        state.enrollments = state.enrollments.filter((e) => e.courseId !== id);
      })
      .addCase(updateCourseAdmin.fulfilled, (state, action) => {
        const updatedCourse = action.payload;
        const index = state.courses.findIndex(
          (c) => c._id === updatedCourse._id,
        );
        if (index !== -1) state.courses[index] = updatedCourse;
      })
      .addCase(fetchStudentEnrollmentByEmail.pending, (state) => {
        state.lookupLoading = true;
        state.lookupError = null;
        state.lookupResult = null;
        state.lookupType = "student";
      })
      .addCase(fetchStudentEnrollmentByEmail.fulfilled, (state, action) => {
        state.lookupLoading = false;
        state.lookupResult = action.payload;
      })
      .addCase(fetchStudentEnrollmentByEmail.rejected, (state, action) => {
        state.lookupLoading = false;
        state.lookupError = action.payload;
      })
      .addCase(fetchTeacherCoursesByEmail.pending, (state) => {
        state.lookupLoading = true;
        state.lookupError = null;
        state.lookupResult = null;
        state.lookupType = "teacher";
      })
      .addCase(fetchTeacherCoursesByEmail.fulfilled, (state, action) => {
        state.lookupLoading = false;
        state.lookupResult = action.payload;
      })
      .addCase(fetchTeacherCoursesByEmail.rejected, (state, action) => {
        state.lookupLoading = false;
        state.lookupError = action.payload;
      });
  },
});

export const { clearLookup } = adminSlice.actions;

export default adminSlice.reducer;
