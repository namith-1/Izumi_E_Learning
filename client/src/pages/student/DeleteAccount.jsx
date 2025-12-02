import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DeleteAccount.css';

const DeleteAccount = () => {
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone immediately.")) {
            try {
                const response = await axios.get('/delete'); // Assuming this is the endpoint from updateStudentRoutes
                if (response.status === 200) {
                    alert("Account deleted successfully.");
                    // Clear local storage or session if needed
                    localStorage.removeItem('student');
                    navigate('/');
                }
            } catch (error) {
                console.error("Delete account error:", error);
                alert("Error deleting account. Please try again.");
            }
        }
    };

    return (
        <div className="delete-account-page">
            <div className="delete-card">
                <div className="warning-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h1>Delete Account</h1>
                <p>
                    Warning: You are about to delete your account. This action will remove your access to all courses and progress.
                    Are you absolutely sure you want to proceed?
                </p>
                <button className="btn-delete" onClick={handleDelete}>
                    Yes, Delete My Account
                </button>
                <button className="btn-cancel" onClick={() => navigate('/student/profile')}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default DeleteAccount;
