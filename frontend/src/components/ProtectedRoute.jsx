import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useSelector((state) => state.auth);
  
  if (loading) return <div>Loading...</div>;

  // 1. Check if logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Handle Admin Redirection (Admin role overrides Student/Teacher routes)
  if (user.role === 'admin' && allowedRole !== 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
  }

  // 3. Check Role (if specific role is required)
  if (allowedRole && user.role !== allowedRole) {
    // If a student tries to go to instructor page, send them to student dash
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    // If an instructor tries to go to student page, send them to instructor dash
    if (user.role === 'teacher') return <Navigate to="/instructor-dashboard" replace />;
  }
  
  return children;
};

export default ProtectedRoute;