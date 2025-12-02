import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminLogout } from '../../redux/slices/authSlice';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(adminLogout())
      .unwrap()
      .then(() => {
        navigate('/admin/login');
      })
      .catch((err) => {
        console.error('Logout failed:', err);
        // Force redirect even if API fails
        navigate('/admin/login');
      });
  };

  return (
    <div className="sidebar">
      <div className="p-3">
        <h4 className="mb-3">Admin Panel</h4>
        <hr className="mb-4" />
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className={`nav-link ${isActive('/admin/dashboard')}`}
              to="/admin/dashboard"
            >
              <i className="fas fa-tachometer-alt me-2"></i>Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link ${isActive('/admin/payments')}`}
              to="/admin/payments"
            >
              <i className="fas fa-dollar-sign me-2"></i>Payments
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link ${isActive('/admin/users')}`}
              to="/admin/users"
            >
              <i className="fas fa-users me-2"></i>Users
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link ${isActive('/admin/courses')}`}
              to="/admin/courses"
            >
              <i className="fas fa-book me-2"></i>Courses
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link ${isActive('/admin/requests')}`}
              to="/admin/requests"
            >
              <i className="fas fa-envelope me-2"></i>Requests
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link ${isActive('/admin/content')}`}
              to="/admin/content"
            >
              <i className="fas fa-file-alt me-2"></i>Content
            </Link>
          </li>
          <li className="nav-item mt-4">
            <button 
              className="nav-link text-danger btn btn-link text-start w-100" 
              onClick={handleLogout}
              style={{ textDecoration: 'none' }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSidebar;
