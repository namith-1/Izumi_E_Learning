import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:4000'; // Point to server for dev

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[Student Auth API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[Student Auth API] Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const loginStudent = async (credentials) => {
  return await apiClient.post('/api/auth/login', credentials);
};

export const signupStudent = async (studentData) => {
  return await apiClient.post('/api/auth/signup', studentData);
};

export const logoutStudent = async () => {
  return await apiClient.post('/api/auth/logout');
};

export const getStudentProfile = async () => {
  return await apiClient.get('/updateStudent/api/info');
};

export const updateStudentProfile = async (profileData) => {
  return await apiClient.post('/updateStudent/update', profileData);
};
