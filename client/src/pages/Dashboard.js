import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user, setUser }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/student/courses', {
          withCredentials: true,
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true,
      });
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-content">
          <h1>Izumi E-Learning</h1>
          <div className="nav-right">
            <span className="user-name">Welcome, {user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <h2>My Courses</h2>
        
        {courses.length === 0 ? (
          <p className="no-courses">No courses enrolled yet.</p>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className="progress">{course.progress || 0}%</span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-footer">
                  <span className="instructor">By {course.instructor}</span>
                  <a href={`/course/${course._id}`} className="course-link">
                    Continue →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
