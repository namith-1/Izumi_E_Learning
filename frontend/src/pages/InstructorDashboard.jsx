// v1/frontend/src/pages/InstructorDashboard.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, PlusCircle, Layers, Settings } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown'; 
// Import new components for nested routes
import MyCourses from './InstructorCourse/MyCourses';
import StudentAnalytics from './InstructorCourse/StudentAnalytics';
import InstructorProfileSettings from './InstructorCourse/InstructorProfileSettings';
// Import StudentDashboard CSS for shared styling elements (navbar, content layout)
import '../pages/css/StudentDashboard.css'; 

const InstructorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation(); 
  
  // Helper to check if the path is active or is the index route
  const isActive = (path) => location.pathname === path || location.pathname === path + '/';

  return (
    // Reuse student-dash-layout for consistent structure
    <div className="student-dash-layout"> 
      
      {/* 1. Navigation Bar (Using student-navbar class for styling) */}
      <header className="student-navbar">
        <div className="nav-brand">
          <BookOpen size={24} />
          <span>Instructor Studio</span>
        </div>
        
        <nav className="nav-links">
          {/* My Courses (Index) */}
          <Link 
            to="/instructor-dashboard/" 
            className={`nav-link-item ${isActive('/instructor-dashboard') ? 'active' : ''}`}
          >
            <Layers size={18} /> My Courses
          </Link>
          
          {/* Student Analytics */}
          <Link 
            to="/instructor-dashboard/analytics" 
            className={`nav-link-item ${location.pathname.startsWith('/instructor-dashboard/analytics') ? 'active' : ''}`}
          >
            <BarChart3 size={18} /> Student Analytics
          </Link>

          {/* Create Course */}
          <Link 
            to="/create-course" 
            className={`nav-link-item ${location.pathname.startsWith('/create-course') ? 'active' : ''}`}
            style={{ backgroundColor: '#f0fdf4', color: '#10b981', marginLeft: '1rem' }}
          >
            <PlusCircle size={18} /> Create New
          </Link>
        </nav>

        <div className="nav-user-info">
          {/* Reuse ProfileDropdown */}
          <ProfileDropdown user={user} currentPath={location.pathname} />
        </div>
      </header>

      {/* 2. Main Content Section with Nested Routes (Using student-main-content class) */}
      <main className="student-main-content">
        <Routes>
          {/* Default Route: My Courses */}
          <Route index element={<MyCourses />} /> 
          
          {/* Student Analytics Route */}
          <Route path="analytics" element={<StudentAnalytics />} />
          
          {/* Profile Settings Route */}
          <Route path="settings" element={<InstructorProfileSettings />} />

          {/* Fallback to My Courses for unknown nested paths */}
          <Route path="*" element={<Navigate to="/instructor-dashboard" replace />} /> 
        </Routes>
      </main>

      {/* 3. Footer (Using student-footer class for styling) */}
      <footer className="student-footer">
        <p>&copy; {new Date().getFullYear()} Izumi Portal. Instructor Studio.</p>
        <p>Support | Terms</p>
      </footer>
    </div>
  );
};

export default InstructorDashboard;