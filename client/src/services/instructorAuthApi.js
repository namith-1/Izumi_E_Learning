import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000'; // Point to server for dev

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auth Endpoints
export const loginInstructor = async (credentials) => {
  const response = await apiClient.post('/login_i', credentials);
  return response.data;
};

export const signupInstructor = async (instructorData) => {
  const response = await apiClient.post('/signup_i', instructorData);
  return response.data;
};

export const logoutInstructor = async () => {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
};

export const checkInstructorAuth = async () => {
  try {
    const response = await apiClient.get('/api/instructor/me');
    return response.data;
  } catch (error) {
    // If API route fails, try legacy route
    try {
      const legacyResponse = await apiClient.get('/instructor/details');
      return legacyResponse.data;
    } catch (legacyError) {
      throw error; // Throw original error
    }
  }
};
