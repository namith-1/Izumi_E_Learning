import axios from 'axios';

const API_BASE_URL = ''; // Root for student APIs

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[Student API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[Student API] Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const getStudentProgress = async () => {
  return await apiClient.get('/student-progress');
};

export const getPurchases = async () => {
  return await apiClient.get('/updateStudent/api/purchases');
};

export const getQuestions = async () => {
  return await apiClient.get('/api/questions');
};

export const getMyQuestions = async () => {
  return await apiClient.get('/api/questions/my');
};

export const getQuestionDetail = async (id) => {
  return await apiClient.get(`/api/questions/${id}`);
};

export const postQuestion = async (questionData) => {
  return await apiClient.post('/api/questions', questionData);
};

export const voteAnswer = async (voteData) => {
  return await apiClient.post('/answers/vote', voteData);
};

// Goals
export const getGoals = async () => {
  return await apiClient.get('/api/goals');
};

export const createGoal = async (goalData) => {
  return await apiClient.post('/api/goals', goalData);
};

export const updateGoal = async (id, updates) => {
  return await apiClient.put(`/api/goals/${id}`, updates);
};

export const deleteGoal = async (id) => {
  return await apiClient.delete(`/api/goals/${id}`);
};

// Consistency
export const getConsistency = async () => {
  return await apiClient.get('/api/consistency');
};

export const enrollInCourse = async (studentId, courseId) => {
    // Note: apiClient returns response.data by default due to interceptor
    // But we might need the full response for status checks if not using the interceptor's return
    // The interceptor returns response.data. 
    // So we should expect the data object directly.
    return await apiClient.get(`/enroll?studentId=${studentId}&courseId=${courseId}`, {
        headers: { 'Accept': 'application/json' }
    });
};

export const checkEnrollment = async (studentId, courseId) => {
    return await apiClient.get(`/is_enrolled/${studentId}/${courseId}`);
};

export const getCompletedModules = async (courseId) => {
  return await apiClient.get(`/api/student/course/${courseId}/completed-modules`);
};

export const markModuleComplete = async (courseId, moduleId) => {
  return await apiClient.post(`/api/student/course/${courseId}/modules/${moduleId}/complete`);
};
