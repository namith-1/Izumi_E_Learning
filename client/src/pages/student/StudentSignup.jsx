import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { studentSignup } from '../../redux/slices/studentAuthSlice';
import './StudentSignup.css';

const StudentSignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        contact: '',
        address: ''
    });
    const [localError, setLocalError] = useState('');
    const dispatch = useDispatch();
    // We can use loading state from redux if we want, but signup usually redirects
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        const resultAction = await dispatch(studentSignup(formData));
        if (studentSignup.fulfilled.match(resultAction)) {
            window.location.href = '/student/login';
        } else {
            setLocalError(resultAction.payload || 'Signup failed');
        }
    };

    return (
        <div className="student-signup-container">
            <div className="signup-card">
                <h2>Create Account</h2>
                <p className="subtitle">Join our learning community</p>
                
                {localError && <div className="error-message">{localError}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input 
                                type="password" 
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contact Number</label>
                        <input 
                            type="tel" 
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea 
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                        ></textarea>
                    </div>
                    
                    <button type="submit" className="signup-btn">Sign Up</button>
                </form>
                
                <div className="footer-links">
                    <p>Already have an account? <Link to="/student/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default StudentSignup;
