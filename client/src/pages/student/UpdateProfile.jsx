import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { checkStudentAuth, updateStudentProfile } from '../../redux/slices/studentAuthSlice';
import './UpdateProfile.css';

const UpdateProfile = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact: '',
        address: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const dispatch = useDispatch();
    const { student, loading } = useSelector(state => state.studentAuth);

    useEffect(() => {
        if (!student) {
            dispatch(checkStudentAuth());
        } else {
            setFormData({
                name: student.name || '',
                email: student.email || '',
                contact: student.contact || '',
                address: student.address || ''
            });
        }
    }, [dispatch, student]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        const resultAction = await dispatch(updateStudentProfile(formData));
        if (updateStudentProfile.fulfilled.match(resultAction)) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } else {
            setMessage({ type: 'error', text: resultAction.payload || 'Update failed' });
        }
    };

    if (loading && !student) return <div className="loading">Loading profile...</div>;

    return (
        <div className="update-profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>Update Profile</h2>
                    <Link to="/student/dashboard" className="back-link">Back to Dashboard</Link>
                </div>
                
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                
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
                    
                    <button type="submit" className="update-btn">Save Changes</button>
                </form>
                
                <div className="profile-actions">
                    <a href="/updateStudent/my_purchases" className="action-link">My Purchases</a>
                    <a href="/updateStudent/delete" className="action-link delete">Delete Account</a>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfile;
