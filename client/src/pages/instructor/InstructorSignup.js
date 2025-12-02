import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { signupInstructor } from '../../redux/slices/instructorAuthSlice';

const InstructorSignup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    contact: '',
    address: ''
  });
  const { username, email, password, contact, address } = formData;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.instructorAuth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/instructor/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(signupInstructor(formData));
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Instructor Signup</h3>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={username}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                  />
                  <small className="text-muted">Must be a valid institute email.</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="contact"
                    value={contact}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={address}
                    onChange={onChange}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Signing up...' : 'Sign Up'}
                </button>
              </form>
              <div className="mt-3 text-center">
                <p>Already have an account? <Link to="/instructor/login">Login</Link></p>
                <p><Link to="/">Back to Home</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorSignup;
