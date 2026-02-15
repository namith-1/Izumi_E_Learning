// v2/src/pages/StudentDashboard.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, Layers, Gamepad2 } from 'lucide-react'; // ADD Gamepad2
import { logoutUser } from '../store';
import ProfileDropdown from '../components/ProfileDropdown'; 
// New components for nested routes
import MyLearning from './StudentCourse/MyLearning'; 
import CourseSearch from './StudentCourse/CourseSearch'; 
import ProfileSettings from './StudentCourse/ProfileSettings'; 
import CourseViewer from './StudentCourse/CourseViewer';
import CourseLearnPage from './StudentCourse/CourseLearnPage'; 
import EducationalGames from './StudentCourse/EducationalGames'; // NEW IMPORT
import './css/StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation(); 

  // Helper function to check if the path is active or is a sub-path of 'catalog'
  // Keeps 'Course Catalog' active when viewing a specific course under /courses/:courseId
  const isActive = (path) => location.pathname === path || location.pathname === path + '/' || 
                     (path === '/student-dashboard/catalog' && location.pathname.startsWith('/student-dashboard/courses/'));

  return (
    <div className="student-dash-layout">
      
      {/* 1. Navigation Bar (Always Visible) */}
      <header className="student-navbar">
        <div className="nav-brand">
          <BookOpen size={24} />
          <span>Izumi Portal</span>
        </div>
        
        <nav className="nav-links">
          <Link 
            to="/student-dashboard/" 
            className={`nav-link-item ${location.pathname === '/student-dashboard' || location.pathname === '/student-dashboard/' ? 'active' : ''}`}
          >
            <Layers size={18} /> My Learning
          </Link>
          <Link 
            to="/student-dashboard/catalog" 
            className={`nav-link-item ${location.pathname.startsWith('/student-dashboard/catalog') || location.pathname.startsWith('/student-dashboard/courses/') ? 'active' : ''}`}
          >
            <Search size={18} /> Course Catalog
          </Link>
          {/* NEW LINK: Educational Games */}
          <Link 
            to="/student-dashboard/games" 
            className={`nav-link-item ${location.pathname.startsWith('/student-dashboard/games') ? 'active' : ''}`}
          >
            <Gamepad2 size={18} /> Games
          </Link>
        </nav>

        <div className="nav-user-info">
          <ProfileDropdown user={user} currentPath={location.pathname} />
        </div>
      </header>

      {/* 2. Main Content Section with Nested Routes */}
      <main className="student-main-content">
        <Routes>
          {/* Default Route: My Learning (Home) */}
          <Route index element={<MyLearning />} /> 
          
          {/* Course Search Route */}
          <Route path="catalog" element={<CourseSearch />} />
          
          {/* NEW ROUTE: Educational Games */}
          <Route path="games" element={<EducationalGames />} />

          {/* Course Viewer (Intro/Enrollment page) */}
          <Route path="courses/:courseId" element={<CourseViewer />} />
          
          {/* Course Learning Page (Content viewing) */}
          <Route path="courses/:courseId/learn/module/:moduleId" element={<CourseLearnPage />} />

          {/* Profile Settings Route */}
          <Route path="settings" element={<ProfileSettings />} />

          {/* Redirects any path that doesn't match a subroute back to home */}
          <Route path="*" element={<Navigate to="/student-dashboard" replace />} /> 
        </Routes>
      </main>

      {/* 3. Footer */}
      <footer className="student-footer">
        <p>&copy; {new Date().getFullYear()} Izumi Portal. All rights reserved.</p>
        <p>Contact | Privacy</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;