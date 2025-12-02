import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminCourses from './AdminCourses';
import AdminPayments from './AdminPayments';
import AdminRequests from './AdminRequests';
import AdminContent from './AdminContent';

const AdminPanel = () => {
  // Auth is handled by AdminProtectedRoute in App.js
  // We can assume the user is authenticated if this component is rendered

  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="courses" element={<AdminCourses />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="requests" element={<AdminRequests />} />
      <Route path="content" element={<AdminContent />} />
      {/* Default redirect to dashboard */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminPanel;
