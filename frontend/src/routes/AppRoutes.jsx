// v2/frontend/src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import StudentDashboard from '../pages/StudentDashboard';
import InstructorDashboard from '../pages/InstructorDashboard';
import CourseEditor from '../pages/InstructorCourse/CourseEditor';
import ProtectedRoute from '../components/ProtectedRoute';
import LandingPage from '../pages/LandingPage';
import AdminDashboard from '../pages/AdminDashboard'; // NEW IMPORT

const AppRoutes = () => {
  return (
    <Routes>
      {/* Set the root path to the LandingPage */}
      <Route path="/" element={<LandingPage />} /> 
      
      {/* Login and Signup pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* NEW ADMIN ROUTE (Protected) */}
      <Route 
        path="/admin-dashboard/*" 
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* STUDENT ROUTES */}
      <Route 
        path="/student-dashboard/*" 
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />

      {/* INSTRUCTOR ROUTES - Updated to allow nested routes */}
      <Route 
        path="/instructor-dashboard/*" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <InstructorDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* CREATE COURSE (Instructor Only) - Top Level */}
      <Route 
        path="/create-course" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <CourseEditor />
          </ProtectedRoute>
        } 
      />
      
      {/* EDIT COURSE (Instructor Only) - Path for editing an existing course */}
      <Route 
        path="/courses/edit/:courseId" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <CourseEditor /> 
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;