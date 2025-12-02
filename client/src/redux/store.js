import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import studentAuthReducer from './slices/studentAuthSlice';
import studentReducer from './slices/studentSlice';
import instructorAuthReducer from './slices/instructorAuthSlice';
import instructorCourseReducer from './slices/instructorCourseSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    studentAuth: studentAuthReducer,
    student: studentReducer,
    instructorAuth: instructorAuthReducer,
    instructorCourse: instructorCourseReducer
  }
});

export default store;
