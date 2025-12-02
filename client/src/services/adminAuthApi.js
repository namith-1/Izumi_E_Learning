import axios from 'axios';

// API base URL - will be proxied to http://localhost:4000 in development
const API_BASE_URL = '/admin/auth';

// Create axios instance with proper CORS and credential settings
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests for credential-based auth
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log(`[API] ${config.method?.toUpperCase()} ${API_BASE_URL}${config.url}`);
    
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors and successes
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response (${response.status}):`, response.data);
    return response.data;
  },
  (error) => {
    console.error('[API] Error response:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect
      localStorage.removeItem('adminToken');
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

export const signupAdmin = (adminData) => {
  return apiClient.post('/signup', adminData);
};

export const logoutAdmin = () => {
  return apiClient.post('/logout');
};

export const getAdminProfile = () => {
  return apiClient.get('/me');
};

export default apiClient;
