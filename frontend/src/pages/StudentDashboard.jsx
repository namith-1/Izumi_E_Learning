import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, Layers, Gamepad2, Compass } from 'lucide-react'; // Added Compass icon
import ProfileDropdown from '../components/ProfileDropdown'; 

// Nested Route Imports
import MyLearning from './StudentCourse/MyLearning'; 
import CourseSearch from './StudentCourse/CourseSearch'; 
import ProfileSettings from './StudentCourse/ProfileSettings'; 
import CourseViewer from './StudentCourse/CourseViewer';
import CourseLearnPage from './StudentCourse/CourseLearnPage'; 
import EducationalGames from './StudentCourse/EducationalGames'; 
import Magazine from './Extra/magazine'; // The new Magazine page
import './css/StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation(); 

  return (
    <div className="student-dash-layout">
      
      {/* 1. Navigation Bar */}
      <header className="student-navbar">
        <div className="nav-brand">
          <BookOpen size={24} />
          <span>Izumi Portal</span>
        </div>
        
        <nav className="nav-links">
          {/* My Learning */}
          <Link 
            to="/student-dashboard/" 
            className={`nav-link-item ${location.pathname === '/student-dashboard' || location.pathname === '/student-dashboard/' ? 'active' : ''}`}
          >
            <Layers size={18} /> My Learning
          </Link>

          {/* Course Catalog */}
          <Link 
            to="/student-dashboard/catalog" 
            className={`nav-link-item ${location.pathname.startsWith('/student-dashboard/catalog') || location.pathname.startsWith('/student-dashboard/courses/') ? 'active' : ''}`}
          >
            <Search size={18} /> Course Catalog
          </Link>

          {/* Explore (Magazine) */}
          <Link 
            to="/student-dashboard/explore" 
            className={`nav-link-item ${location.pathname.startsWith('/student-dashboard/explore') ? 'active' : ''}`}
          >
            <Compass size={18} /> Explore
          </Link>

          {/* Educational Games */}
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

      {/* 2. Main Content Section */}
      <main className="student-main-content">
        <Routes>
          <Route index element={<MyLearning />} /> 
          <Route path="catalog" element={<CourseSearch />} />
          <Route path="explore" element={<Magazine />} /> {/* NEW ROUTE */}
          <Route path="games" element={<EducationalGames />} />
          <Route path="courses/:courseId" element={<CourseViewer />} />
          <Route path="courses/:courseId/learn/module/:moduleId" element={<CourseLearnPage />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="*" element={<Navigate to="/student-dashboard" replace />} /> 
        </Routes>
      </main>

      {/* 3. Footer */}
      <footer className="student-footer">
        <p>&copy; {new Date().getFullYear()} Izumi Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;