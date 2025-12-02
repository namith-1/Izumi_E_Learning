import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InstructorDashboard.css';

const InstructorDashboard = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/instructor/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/instructor/courses', newCourse);
      setCourses([...courses, response.data]);
      setNewCourse({ title: '', description: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="instructor-dashboard">
      <nav className="navbar">
        <div className="nav-content">
          <h1>Instructor Dashboard</h1>
          <div className="nav-right">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="header-section">
          <h2>My Courses</h2>
          <button
            onClick={() => setShowModal(true)}
            className="create-course-btn"
          >
            + Create New Course
          </button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Create New Course</h3>
              <form onSubmit={handleCreateCourse}>
                <div className="form-group">
                  <label htmlFor="title">Course Title:</label>
                  <input
                    type="text"
                    id="title"
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    required
                    placeholder="Enter course title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, description: e.target.value })
                    }
                    required
                    placeholder="Enter course description"
                    rows="4"
                  />
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="submit-btn">
                    Create Course
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <p className="no-courses">No courses created yet.</p>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <h3>{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-stats">
                  <span>Students: {course.students?.length || 0}</span>
                </div>
                <a href={`/course/${course._id}`} className="course-link">
                  Edit Course →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
