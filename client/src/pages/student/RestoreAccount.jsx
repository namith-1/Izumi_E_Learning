import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RestoreAccount.css';

const RestoreAccount = () => {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleRestore = async () => {
        try {
            const response = await axios.post('/restore', { email });
            alert(response.data);
            if (response.status === 200) {
                navigate('/login');
            }
        } catch (error) {
            console.error("Restore account error:", error);
            alert(error.response?.data || "Error restoring account.");
        }
    };

    return (
        <div className="restore-account-page">
            <div className="restore-card">
                <h1>Restore Your Account</h1>
                <p>Enter your email to restore your previously deleted account.</p>
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                />
                <button className="btn-restore" onClick={handleRestore}>
                    Restore Account
                </button>
                <p>
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default RestoreAccount;
