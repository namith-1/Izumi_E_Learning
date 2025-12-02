import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { studentLogin } from '../../redux/slices/studentAuthSlice';
import './StudentLogin.css';

const StudentLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const { loading, error: reduxError } = useSelector(state => state.studentAuth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultAction = await dispatch(studentLogin({ email, password }));
        if (studentLogin.fulfilled.match(resultAction)) {
            window.location.href = '/student/dashboard'; // Redirect to student dashboard
        }
    };

    return (
        <div className="student-login-container">
            <div className="login-card">
                <h2>Welcome Back</h2>
                <p className="subtitle">Login to continue learning</p>
                
                {reduxError && <div className="error-message">{reduxError}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder="Enter your email"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            placeholder="Enter your password"
                        />
                    </div>
                    
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                
                <div className="footer-links">
                    <p>Don't have an account? <Link to="/student/signup">Sign up</Link></p>
                    <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
