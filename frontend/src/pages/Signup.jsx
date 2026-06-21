// v2/frontend/src/pages/Signup.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearAuthErrors } from '../store';
import UnauthenticatedNavbar from '../components/UnauthenticatedNavbar'; // NEW IMPORT
import './css/Signup.css';
import GoogleOAuthButton from '../components/buttons/googleOAuth'; // NEW IMPORT

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    resume: '',
    linkedIn: '',
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher' && user.applicationStatus === 'pending') {
        // Stay on page and show success modal
        setShowSuccessModal(true);
        return;
      }
      
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

  const [resumeFile, setResumeFile] = useState(null);
  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.role === 'teacher' && !resumeFile) {
        alert("Please upload your resume.");
        return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('role', formData.role);
    data.append('linkedIn', formData.linkedIn);
    
    if (resumeFile) {
        data.append('resumeFile', resumeFile);
    }

    dispatch(registerUser(data));
  };

  return (
    <> {/* Added fragment */}
      <UnauthenticatedNavbar /> {/* Added Navbar */}
      {showSuccessModal && <SuccessModal />}
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

          {error && (
            <div className="alert-error">
              {typeof error === "object" ? error.message || "An unexpected error occurred" : error}
            </div>
          )}

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
            
            {formData.role === 'teacher' && (
              <>
                <div className="input-group">
                  <label>LinkedIn Profile URL</label>
                  <input
                    type="url"
                    name="linkedIn"
                    className="styled-input"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedIn}
                    onChange={handleChange}
                    required={formData.role === 'teacher'}
                  />
                </div>

                <div className="input-group">
                  <label>Resume (PDF/DOCX)</label>
                  <input
                    type="file"
                    name="resumeFile"
                    className="styled-input"
                    accept=".pdf,.docx,.doc,.jpg,.png,.jpeg"
                    onChange={handleFileChange}
                    required={formData.role === 'teacher'}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="signup-footer">
            Already have an account? <Link to="/login" className="footer-link">Sign in</Link>
          </div>
          {formData.role === 'student' && (
            <div className="oauth-section">
              <GoogleOAuthButton />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Simple Modal Component
const SuccessModal = ({ onClose }) => (
  <div className="modal-overlay" style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }}>
    <div className="signup-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '50px', marginBottom: '20px' }}>📩</div>
      <h2 style={{ marginBottom: '15px' }}>Application Received!</h2>
      <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.6' }}>
        Thank you for applying to be an instructor. Your application is now <strong>under review</strong>.
        <br/><br/>
        We will verify your credentials and send you an email once your account is approved.
      </p>
      <button 
        className="btn-submit" 
        onClick={() => window.location.href = '/login'}
        style={{ width: '100%' }}
      >
        Back to Login
      </button>
    </div>
  </div>
);

export default Signup;