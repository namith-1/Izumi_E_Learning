import axios from 'axios';

const API_BASE_URL = ''; // Relative path for proxy

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Course Endpoints
export const getInstructorCourses = async () => {
  const response = await apiClient.get('/instructor-courses');
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await apiClient.post('/save-course', courseData);
  return response.data;
};

export const updateCourse = async (courseData) => {
  const response = await apiClient.post('/save-course-changes', courseData);
  return response.data;
};

export const getCourseDetails = async (courseId) => {
  const response = await apiClient.get(`/course/${courseId}`);
  return response.data;
};

// Profile Endpoints
export const getInstructorProfile = async () => {
  const response = await apiClient.get('/api/instructor/profile');
  return response.data;
};

export const updateInstructorProfile = async (profileData) => {
  const response = await apiClient.put('/api/instructor/profile', profileData);
  return response.data;
};

// Student Info
export const getStudentInfo = async () => {
    const response = await apiClient.get('/my_course_info');
    return response.data;
};
