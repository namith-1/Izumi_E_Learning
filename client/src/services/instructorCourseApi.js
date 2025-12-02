import { apiClient } from './instructorAuthApi';

export const getInstructorCourses = async () => {
  try {
    const response = await apiClient.get('/api/instructor/courses');
    return response.data;
  } catch (err) {
    // Fallback to legacy non-API route if API route not found
    if (err?.response?.status === 404) {
      const alt = await apiClient.get('/instructor-courses');
      return alt.data;
    }
    throw err;
  }
};

export const saveCourse = async (courseData) => {
  const response = await apiClient.post('/api/instructor/courses', courseData);
  return response.data;
};

export const saveCourseChanges = async (courseData) => {
  // Append courseId to query string to ensure backend receives it
  const url = `/save-course-changes?courseId=${courseData.courseId}`;
  const response = await apiClient.post(url, courseData);
  return response.data;
};

export const getCourseDetails = async (courseId) => {
  // Primary: fetch full module tree
  try {
    const response = await apiClient.get(`/course/${courseId}?t=${Date.now()}`);
    return response.data;
  } catch (primaryErr) {
    // Fallback: fetch minimal course info for shell rendering
    try {
      const alt = await apiClient.get(`/api/courses/${courseId}?t=${Date.now()}`);
      const d = alt.data;
      // Normalize to structure expected by editor page
      return {
        _id: d.id || d._id || courseId,
        title: d.title || 'Untitled Course',
        subject: d.subject || '',
        tagline: d.tagline || '',
        overview: d.overview || d.description || '',
        price: d.price || 0,
        thumbnail: d.thumbnail || d.image_url || '',
        whatYouWillLearn: d.whatYouWillLearn || [],
        modules: [],
        _fallback: true,
      };
    } catch (fallbackErr) {
      // Re-throw original error to show accurate message
      throw primaryErr;
    }
  }
};

export const getCoursesWithStats = async () => {
  const response = await apiClient.get('/courses_by');
  return response.data;
};

export const getStudentInfo = async () => {
  const response = await apiClient.get('/my_course_info');
  return response.data;
};

export const getInstructorCoursesStats = async () => {
  const response = await apiClient.get('/instructor/courses2');
  return response.data;
};

export const getCourseStatsOverTime = async (courseId) => {
  const response = await apiClient.get(`/instructor/course2/${courseId}/stats`);
  return response.data;
};
