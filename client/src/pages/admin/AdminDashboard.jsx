import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../redux/slices/adminSlice';
import AdminSidebar from '../../components/admin/AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      dispatch(fetchDashboardStats());
    }, 15000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const stats = dashboardStats || {
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 px-0">
          <AdminSidebar />
        </div>

        <div className="col-md-9 col-lg-10 p-4">
          <h2 className="mb-4">Dashboard Overview</h2>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white stat-card">
                <div className="card-body">
                  <h5 className="card-title">Total Students</h5>
                  <h2 className="card-text">
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      stats.totalStudents
                    )}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white stat-card">
                <div className="card-body">
                  <h5 className="card-title">Total Instructors</h5>
                  <h2 className="card-text">
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      stats.totalInstructors
                    )}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-white stat-card">
                <div className="card-body">
                  <h5 className="card-title">Total Courses</h5>
                  <h2 className="card-text">
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      stats.totalCourses
                    )}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white stat-card">
                <div className="card-body">
                  <h5 className="card-title">Total Enrollments</h5>
                  <h2 className="card-text">
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      stats.totalEnrollments
                    )}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <a href="/admin/users" className="btn btn-primary w-100 mb-2">
                        <i className="fas fa-user-plus me-2"></i>Add New User
                      </a>
                    </div>
                    <div className="col-md-3">
                      <a href="/admin/courses" className="btn btn-success w-100 mb-2">
                        <i className="fas fa-plus-circle me-2"></i>Add New Course
                      </a>
                    </div>
                    <div className="col-md-3">
                      <a href="/admin/content" className="btn btn-warning w-100 mb-2">
                        <i className="fas fa-file-plus me-2"></i>Add New Content
                      </a>
                    </div>
                    <div className="col-md-3">
                      <a href="/admin/users" className="btn btn-info w-100 mb-2">
                        <i className="fas fa-users-cog me-2"></i>Manage Users
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
