import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Key, Camera, X } from 'lucide-react';
import { updateStudentProfile } from '../../store';

const ProfileSettings = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        newPassword: '',
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.profilePic ? `http://localhost:5000${user.profilePic}` : null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); 
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setPreviewUrl(user?.profilePic ? `http://localhost:5000${user.profilePic}` : null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('currentPassword', formData.password);
        if (formData.newPassword) data.append('newPassword', formData.newPassword);
        if (selectedFile) data.append('profileImage', selectedFile);

        try {
            const result = await dispatch(updateStudentProfile(data));
            if (updateStudentProfile.fulfilled.match(result)) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setFormData({ ...formData, password: '', newPassword: '' });
                setSelectedFile(null);
            } else {
                setMessage({ type: 'error', text: result.payload || 'Update failed.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-settings-container">
            <div className="dashboard-intro">
                <h1>Profile Settings</h1>
                <p>Update your account details and profile photo.</p>
            </div>

            <div className="profile-card">
                {message && <div className={`message-box ${message.type}`}>{message.text}</div>}
                
                <form onSubmit={handleSubmit}>
                    {/* SIMPLE HTML/CSS PHOTO SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    width: '128px',
                                    height: '128px',
                                    borderRadius: '50%',
                                    border: '2px dashed #ccc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    backgroundColor: '#f9f9f9',
                                    cursor: 'pointer'
                                }}
                            >
                                {previewUrl ? (
                                    <img 
                                        src={previewUrl} 
                                        alt="Profile" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#888' }}>
                                        <Camera size={24} />
                                        <div style={{ fontSize: '10px' }}>ADD PHOTO</div>
                                    </div>
                                )}
                            </div>

                            {selectedFile && (
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }}
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        backgroundColor: '#ff4d4f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                            Click image to upload
                        </p>
                    </div>

                    <div className="form-group">
                        <label><User size={16} /> Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label><Mail size={16} /> Email Address</label>
                        <input type="email" value={user?.email || ''} disabled style={{ backgroundColor: '#eee' }} />
                    </div>

                    <div className="form-group">
                        <label><Key size={16} /> Current Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
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