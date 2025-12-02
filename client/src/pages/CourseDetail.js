import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StudentNavbar from '../components/StudentNavbar';
import { apiClient } from '../services/studentApi';
import './CourseDetail.css';

const CourseDetail = ({ user: propUser }) => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const navigate = useNavigate();
  
  const { student } = useSelector(state => state.studentAuth);
  const currentUser = student || propUser;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Use the courseId from useParams if available, otherwise fallback to window location (legacy)
        const id = courseId || window.location.pathname.split('/')[2];
        const data = await apiClient.get(`/api/courses/${id}`);
        setCourse(data);
        
        // Check enrollment status if user is logged in
        if (currentUser) {
            const studentId = currentUser._id || currentUser.id;
            try {
                const enrollData = await apiClient.get(`/is_enrolled/${studentId}/${id}`);
                if (enrollData && enrollData.enrolled) {
                    setEnrollmentStatus('enrolled');
                }
            } catch (e) {
                console.log("Could not check enrollment status", e);
            }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, currentUser]);

  const handleEnroll = async () => {
    if (!currentUser) {
      alert("Please login to enroll.");
      navigate('/student/login');
      return;
    }
    const studentId = currentUser._id || currentUser.id;
    const cId = course._id || course.id;
    
    try {
      const data = await apiClient.get(`/enroll?studentId=${studentId}&courseId=${cId}`, {
          headers: { 'Accept': 'application/json' }
      });

      console.log("Enroll response:", data);

      if (data && (data.success || data.enrolled)) {
          setEnrollmentStatus('enrolled');
          alert("Enrolled successfully!");
      } else if (typeof data === 'string' && data.includes('window.location.replace')) {
          // Handle legacy HTML response if it slips through
          setEnrollmentStatus('enrolled');
          alert("Enrolled successfully!");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      if (error.response && error.response.status === 401) {
          alert("Session expired. Please login again.");
          navigate('/student/login');
      } else {
          alert("Failed to enroll. Please try again.");
      }
    }
  };

  if (loading) return <div className="loading">Loading course...</div>;

  if (!course) return <div className="not-found">Course not found</div>;

  return (
    <div className="course-detail-page">
      {student && <StudentNavbar />}
      {/* Geometric Shapes Background */}
      <div className="geometric-shape shape-1"></div>
      <div className="geometric-shape shape-2"></div>
      <div className="geometric-shape shape-3"></div>

      <div className="container">
        <div className="course-info">
          <h1>{course.title}</h1>
          <p>{course.description || course.overview || "No description available."}</p>
          
          <div className="enrollment-info">
            <span>{course.enrollmentCount || 0} students enrolled</span>
          </div>

          <div className="details">
            <div>
              <strong>{course.details?.rating || 0}</strong>
              <span>Rating</span>
            </div>
            <div>
              <strong>{course.details?.reviewsCount || 0}</strong>
              <span>Reviews</span>
            </div>
            <div>
              <strong>{course.details?.level || "All Levels"}</strong>
              <span>Level</span>
            </div>
            <div>
              <strong>{course.details?.duration || "Self-paced"}</strong>
              <span>Duration</span>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
             <Link to="/student/dashboard" className="back-link" style={{ marginRight: '20px' }}>
              ← Back to Dashboard
            </Link>
            {enrollmentStatus === 'enrolled' ? (
                <button 
                  onClick={() => navigate(`/course/${courseId || course._id || course.id}/learn`)}
                  className="enroll-button" 
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Go to Course Content →
                </button>
            ) : (
                <button onClick={handleEnroll} className="enroll-button" style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  Enroll Now
                </button>
            )}
          </div>
        </div>

        {course.modules && course.modules.length > 0 && (
          <div className="modules-section">
            <h2>Course Modules</h2>
            <div className="modules-list">
              {course.modules.map((module) => (
                <div key={module._id || module.id} className="module-item">
                  <h3>{module.title}</h3>
                  <p>{module.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Instructor Section if available */}
        {course.instructor && (
            <div className="course-info" style={{ marginTop: '40px', textAlign: 'left' }}>
                <h2>Instructor</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
                    <img 
                        src={course.instructor.avatarUrl || "/images/default-avatar.png"} 
                        alt={course.instructor.name}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--primary-purple)' }}>{course.instructor.name}</h3>
                        <p style={{ margin: '5px 0', color: 'var(--text-light)' }}>{course.instructor.title}</p>
                    </div>
                </div>
                <p style={{ marginTop: '15px' }}>{course.instructor.bio}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
