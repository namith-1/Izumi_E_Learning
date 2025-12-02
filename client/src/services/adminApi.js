import axios from 'axios';

const API_BASE_URL = '/admin';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for session-based auth
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[AdminAPI] Request failed:', error.config?.url, error.message);
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================

export const loginAdmin = (credentials) => {
  return apiClient.post('/login', credentials);
};

export const logoutAdmin = () => {
  return apiClient.post('/logout');
};

export const getAdminProfile = () => {
  return apiClient.get('/profile');
};

// ==================== DASHBOARD ENDPOINTS ====================

export const getDashboardStats = () => {
  return apiClient.get('/dashboard/stats');
};

// ==================== USERS ENDPOINTS ====================

export const getUsers = () => {
  return apiClient.get('/users/data');
};

export const createUser = (userData) => {
  return apiClient.post('/users', userData);
};

export const updateUser = (userId, userData) => {
  return apiClient.put(`/users/${userId}`, userData);
};

export const deleteUser = (userId, role) => {
  return apiClient.delete(`/users/${userId}?role=${role}`);
};

// ==================== COURSES ENDPOINTS ====================

export const getCourses = () => {
  return apiClient.get('/courses/data');
};

export const getInstructors = () => {
  return apiClient.get('/instructors');
};

export const createCourse = (courseData) => {
  return apiClient.post('/courses', courseData);
};

export const updateCourse = (courseId, courseData) => {
  return apiClient.put(`/courses/${courseId}`, courseData);
};

export const deleteCourse = (courseId) => {
  return apiClient.delete(`/courses/${courseId}`);
};

// ==================== PAYMENTS ENDPOINTS ====================

export const getPayments = (range = 'daily') => {
  return apiClient.get(`/payments/data?range=${range}`);
};

export const getPaymentDetails = (paymentId) => {
  return apiClient.get(`/payments/${paymentId}`);
};

export const updatePaymentStatus = (paymentId, status) => {
  return apiClient.put(`/payments/${paymentId}/status`, { status });
};

// ==================== REQUESTS ENDPOINTS ====================

export const getRequests = () => {
  return apiClient.get('/requests/data');
};

export const updateRequest = (requestId, data) => {
  return apiClient.put(`/requests/${requestId}`, data);
};

export const deleteRequest = (requestId) => {
  return apiClient.delete(`/requests/${requestId}`);
};

// ==================== CONTENT ENDPOINTS ====================

export const getContent = () => {
  return apiClient.get('/content/data');
};

export const getCoursesList = () => {
  return apiClient.get('/courses/list');
};

export const createContent = (contentData) => {
  return apiClient.post('/content', contentData);
};

export const updateContent = (contentId, contentData) => {
  return apiClient.put(`/content/${contentId}`, contentData);
};

export const deleteContent = (contentId) => {
  return apiClient.delete(`/content/${contentId}`);
};
