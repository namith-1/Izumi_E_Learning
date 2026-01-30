import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Key } from 'lucide-react';
import { updateStudentProfile } from '../../store';

const ProfileSettings = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '', // Assuming email is available in session/me payload
        password: '',
        newPassword: '',
    });
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Clear message after a short period
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Payload only includes fields that are non-empty or non-read-only
        const payload = {
            name: formData.name,
            currentPassword: formData.password,
        };

        if (formData.newPassword) {
            payload.newPassword = formData.newPassword;
        }

        try {
            const result = await dispatch(updateStudentProfile(payload));
            if (updateStudentProfile.fulfilled.match(result)) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setFormData({ ...formData, password: '', newPassword: '' }); // Clear password fields
            } else {
                // If backend returns an error message in payload
                setMessage({ type: 'error', text: result.payload || 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-settings-container">
            <div className="dashboard-intro">
                <h1>Profile Settings</h1>
                <p className="text-gray-600">Update your account details and password.</p>
            </div>

            <div className="profile-card">
                {message && (
                    <div className={`message-box ${message.type}`}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    
                    <div className="form-group">
                        <label><User size={16} /> Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label><Mail size={16} /> Email Address (Read Only)</label>
                        <input
                            type="email"
                            name="email"
                            value={user?.email} // Display the email from Redux state
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                    
                    <h2 className="section-divider">Update Password (Optional)</h2>

                    <div className="form-group">
                        <label><Key size={16} /> Current Password <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Required to save any changes"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label><Key size={16} /> New Password (Leave blank to keep old)</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password (min 6 chars)"
                            minLength="6"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-save-profile">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;