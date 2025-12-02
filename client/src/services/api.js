import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Auth API calls
export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  signup: (name, email, password, role) =>
    apiClient.post('/auth/signup', { name, email, password, role }),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

// Student API calls
export const studentAPI = {
  getCourses: () => apiClient.get('/student/courses'),
  getProgress: (courseId) => apiClient.get(`/student/progress/${courseId}`),
};

// Instructor API calls
export const instructorAPI = {
  getCourses: () => apiClient.get('/instructor/courses'),
  createCourse: (courseData) => apiClient.post('/instructor/courses', courseData),
  updateCourse: (courseId, courseData) =>
    apiClient.put(`/instructor/courses/${courseId}`, courseData),
  deleteCourse: (courseId) => apiClient.delete(`/instructor/courses/${courseId}`),
};

// Course API calls
export const courseAPI = {
  getCourse: (courseId) => apiClient.get(`/courses/${courseId}`),
  getCourseModules: (courseId) => apiClient.get(`/courses/${courseId}/modules`),
};

// Admin API calls
export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: () => apiClient.get('/admin/users'),
};

// Goals API calls
export const goalsAPI = {
  getGoals: () => apiClient.get('/goals'),
  createGoal: (goalData) => apiClient.post('/goals', goalData),
  updateGoal: (goalId, goalData) => apiClient.put(`/goals/${goalId}`, goalData),
  deleteGoal: (goalId) => apiClient.delete(`/goals/${goalId}`),
};

// Consistency API calls
export const consistencyAPI = {
  getConsistencyDates: () => apiClient.get('/consistency'),
  markConsistency: (date) => apiClient.post('/consistency', { date }),
};

export default apiClient;
