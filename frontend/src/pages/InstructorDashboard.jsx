// v1/frontend/src/pages/InstructorDashboard.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, PlusCircle, Layers, Settings, Users, BookOpen, MessageCircle, ChevronRight } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import { fetchAllCourses } from '../store';
// Import new components for nested routes
import MyCourses from './InstructorCourse/MyCourses';
import InstructorAnalytics from '../components/analytics/InstructorAnalytics';
import InstructorStudentAnalytics from '../components/analytics/InstructorStudentAnalytics';
import InstructorProfileSettings from './InstructorCourse/InstructorProfileSettings';
import InstructorChat from './InstructorCourse/InstructorChat';
// Import StudentDashboard CSS for shared styling elements (navbar, content layout)
import '../pages/css/StudentDashboard.css';

// ── Messages landing page: pick a course to chat ──────────────
const InstructorChatPicker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { list: courses, loading } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // Filter courses owned by this instructor
  const myCourses = courses.filter(
    (c) => String(c.teacherId?._id || c.teacherId) === String(user?.id),
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#1f2937' }}>
        💬 Messages
      </h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Select a course to view student conversations.
      </p>

      {loading && <p style={{ color: '#9ca3af' }}>Loading courses...</p>}
      {!loading && myCourses.length === 0 && (
        <p style={{ color: '#9ca3af' }}>No courses found. Create a course first.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {myCourses.map((course) => (
          <div
            key={course._id}
            onClick={() => navigate(`/instructor-dashboard/chat/${course._id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c7d2fe';
              e.currentTarget.style.background = '#fafbff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = 'white';
            }}
          >
            <div
              style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}
            >
              {(course.title || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', margin: 0 }}>
                {course.title}
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                {course.subject}
              </p>
            </div>
            <ChevronRight size={18} style={{ color: '#9ca3af' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

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

          {/* Analytics Overview */}
          <Link
            to="/instructor-dashboard/analytics"
            className={`nav-link-item ${isActive('/instructor-dashboard/analytics') ? 'active' : ''}`}
          >
            <BarChart3 size={18} /> Overview
          </Link>

          {/* Student Analytics */}
          <Link
            to="/instructor-dashboard/students"
            className={`nav-link-item ${isActive('/instructor-dashboard/students') ? 'active' : ''}`}
          >
            <Users size={18} /> Students
          </Link>

          {/* Messages */}
          <Link
            to="/instructor-dashboard/messages"
            className={`nav-link-item ${location.pathname.startsWith('/instructor-dashboard/messages') || location.pathname.startsWith('/instructor-dashboard/chat') ? 'active' : ''}`}
          >
            <MessageCircle size={18} /> Messages
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

          {/* Instructor Analytics Route (Overview) */}
          <Route path="analytics" element={<InstructorAnalytics />} />

          {/* Student Analytics Route */}
          <Route path="students" element={<InstructorStudentAnalytics />} />

          {/* Chat Routes */}
          <Route path="messages" element={<InstructorChatPicker />} />
          <Route path="chat/:courseId" element={<InstructorChat />} />

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