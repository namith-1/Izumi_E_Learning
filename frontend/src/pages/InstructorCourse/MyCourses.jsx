// v1/frontend/src/pages/InstructorCourse/MyCourses.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllCourses } from '../../store'; // New thunk
import { Loader2 } from 'lucide-react';

// Helper to calculate completion percentage for a single course
const getCourseCompletionPercentage = (course) => {
    // Assumption: The enrolled course object (from backend) includes a total module count 
    // and the status of completed modules in modules_status.
    const completed = course.modules_status?.filter(s => s.completed).length || 0;
    
    // We assume totalModules is present for calculation. If not, use completed count + 1 as fallback.
    const totalModules = course.totalModules || (completed > 0 ? completed * 2 : 1); 
    
    if (totalModules === 0) return 0;
    return Math.min(100, (completed / totalModules) * 100);
};

const MyCourses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { list: courses, loading } = useSelector((state) => state.courses);

  // Fetch courses when component mounts
  useEffect(() => {
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // Filter: Show only courses created by THIS instructor
  const myCourses = courses.filter(course => course.teacherId === user?.id);

  const handleCreateClick = () => {
    // Navigate to the absolute route for course creation
    navigate('/create-course'); 
  };
  
  const handleEditClick = (courseId) => {
    // Navigate to the dynamic edit route
    navigate(`/courses/edit/${courseId}`); 
  };

  const handleViewClick = (courseId) => {
    // Navigate to the course viewer (same as student view, for preview)
    navigate(`/student-dashboard/courses/${courseId}`); 
  };

  // Calculate metrics (simplified version from old dashboard)
  const totalCourses = myCourses.length;

  return (
    <>
      <div className="dashboard-intro">
        <h1>My Courses</h1>
        <p className="text-gray-600">Manage your published and draft content.</p>
      </div>

      {/* Reusing student stat-card styles */}
      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p>{totalCourses}</p>
        </div>
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>0</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Rating</h3>
          <p>0.0</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Loading your courses...</div>
      ) : myCourses.length > 0 ? (
        <div className="course-grid student-course-grid">
          {myCourses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-card-header">
                <span className="badge-subject">{course.subject}</span>
                <span className="badge-rating">★ {course.rating || 0}</span>
              </div>
              <h3>{course.title}</h3>
              <p className="course-desc">
                {course.description 
                  ? course.description.substring(0, 80) + '...' 
                  : 'No description provided.'}
              </p>
              <div className="course-card-footer">
                {/* Use handleEditClick for Edit button */}
                <button className="btn-browse" onClick={() => handleEditClick(course._id)} style={{ backgroundColor: '#2563eb' }}>
                  Edit
                </button>
                <button className="btn-browse" onClick={() => handleViewClick(course._id)} style={{ backgroundColor: '#10b981' }}>
                  View Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't published any courses yet.</p>
          {/* Reusing student browse-btn style */}
          <button className="browse-btn" onClick={handleCreateClick} style={{backgroundColor: '#6366f1'}}>
            Create Your First Course
          </button>
        </div>
      )}
    </>
  );
};

export default MyCourses;