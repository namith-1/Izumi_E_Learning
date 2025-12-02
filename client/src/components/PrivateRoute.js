import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ user, children, requiredRole }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    if (user.role === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
};

export default PrivateRoute;
