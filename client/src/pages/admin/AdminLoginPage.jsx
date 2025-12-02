import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLogin from './AdminLogin';

/**
 * AdminLoginPage - Wrapper that checks authentication status
 * Uses useRef to track if we've already initiated redirect
 */
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const hasInitiatedRef = useRef(false);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const adminInStorage = localStorage.getItem('admin');

  useEffect(() => {
    // Check if auth is ready and we haven't navigated yet
    if (isAuthenticated && adminInStorage && !hasInitiatedRef.current) {
      hasInitiatedRef.current = true; // Mark immediately to prevent re-entrance
      console.log('[AdminLoginPage] Already authenticated, redirecting to dashboard...');
      navigate('/admin/dashboard', { replace: true });
    }
  }, []); // Empty deps - only runs on mount

  return <AdminLogin />;
};

export default AdminLoginPage;
