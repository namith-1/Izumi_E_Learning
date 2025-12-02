import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin, clearError } from '../../redux/slices/authSlice';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  // Handle error messages
  useEffect(() => {
    if (error && error !== localError) {
      console.log('[AdminLogin] Error received:', error);
      setLocalError(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    dispatch(adminLogin({ email, password }))
      .unwrap()
      .then(() => {
        navigate('/admin/dashboard');
      })
      .catch((err) => {
        setLocalError(err || 'Login failed. Please check your credentials.');
        console.error('Login error:', err);
      });
  };

  const handleClearError = () => {
    setLocalError('');
    dispatch(clearError());
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Admin Login</h1>
          <p>Enter your credentials to access the admin panel</p>
        </div>

        {localError && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error!</strong> {localError}
            <button
              type="button"
              className="btn-close"
              onClick={handleClearError}
              aria-label="Close"
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-login w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-4 text-center border-top pt-3">
          <p className="text-muted mb-2">Don't have an admin account?</p>
          <Link to="/admin/signup" className="btn btn-outline-secondary w-100">
            Create Admin Account
          </Link>
        </div>

        <div className="mt-3 text-center text-muted small">
          <p className="mb-1">Back to user logins?</p>
          <div>
            <Link to="/student/login" className="me-2">Student Login</Link>
            <Link to="/instructor/login">Instructor Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;