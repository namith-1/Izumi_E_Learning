// v2/frontend/src/components/UnauthenticatedNavbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';
import '../pages/css/StudentDashboard.css'; // Reuse existing CSS for basic structure

const UnauthenticatedNavbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    // Reusing 'student-navbar' styles for consistent look
    <header className="student-navbar">
      <div className="nav-brand">
        <BookOpen size={24} />
        <span>Izumi Portal</span>
      </div>
      
      <nav className="nav-links">
        <Link 
          to="/" 
          className={`nav-link-item ${isActive('/') ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/login" 
          className={`nav-link-item ${isActive('/login') ? 'active' : ''}`}
        >
          <LogIn size={18} /> Login
        </Link>
        <Link 
          to="/signup" 
          className={`nav-link-item ${isActive('/signup') ? 'active' : ''}`}
          // Custom styling for the primary action button
          style={{ backgroundColor: '#f0fdf4', color: '#10b981', marginLeft: '0.5rem' }}
        >
          <UserPlus size={18} /> Sign Up
        </Link>
      </nav>
      
      {/* Placeholder for visual alignment with authenticated nav */}
      <div style={{width: '90px'}}></div> 
    </header>
  );
};

export default UnauthenticatedNavbar;