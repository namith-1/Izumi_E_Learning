import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/admin/stats');
        setStats(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setError(error.response?.data?.error || 'Failed to fetch admin statistics');
        // Set default stats in case of error
        setStats({
          totalStudents: 0,
          totalInstructors: 0,
          totalCourses: 0,
          totalEnrollments: 0,
          activeUsers: 0,
          completionRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout
      window.location.href = '/login';
    }
  };

  if (loading) return <div className="loading">Loading admin panel...</div>;

  return (
    <div className="admin-panel">
      <nav className="navbar">
        <div className="nav-content">
          <h1>Admin Panel</h1>
          <div className="nav-right">
            <span className="user-name">Welcome, {user?.name || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-container">
        {error && <div className="error-message">{error}</div>}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Students</h3>
              <p className="stat-number">{stats.totalStudents || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Instructors</h3>
              <p className="stat-number">{stats.totalInstructors || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Courses</h3>
              <p className="stat-number">{stats.totalCourses || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Enrollments</h3>
              <p className="stat-number">{stats.totalEnrollments || 0}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
