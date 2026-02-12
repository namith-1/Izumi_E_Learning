// v2/frontend/src/pages/Signup.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearAuthErrors } from '../store';
import UnauthenticatedNavbar from '../components/UnauthenticatedNavbar'; // NEW IMPORT
import './css/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        navigate('/instructor-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    }
    // Cleanup errors
    return () => { dispatch(clearAuthErrors()); };
  }, [user, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  return (
    <> {/* Added fragment */}
      <UnauthenticatedNavbar /> {/* Added Navbar */}
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <h2>Create Account</h2>
            <p>Join us as a Student or Instructor</p>
          </div>

          <div className="role-toggle-group">
            <button
              type="button"
              className={`toggle-btn ${formData.role === 'student' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'student' })}
            >
              Student
            </button>
            <button
              type="button"
              className={`toggle-btn ${formData.role === 'teacher' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'teacher' })}
            >
              Instructor
            </button>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                className="styled-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="styled-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="styled-input"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="signup-footer">
            Already have an account? <Link to="/login" className="footer-link">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;