// v1/frontend/src/components/ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, Settings, LogOut, Layers } from 'lucide-react';
import { logoutUser } from '../store';

const ProfileDropdown = ({ user, currentPath }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        setIsOpen(false);
    };
    
    // Determine the base dashboard path for dynamic navigation
    const basePath = user?.role === 'teacher' ? '/instructor-dashboard' : '/student-dashboard';
    
    // Check if the link to Profile Settings is the current active route
    const isSettingsActive = currentPath.includes('/settings');

    return (
        <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`profile-toggle-btn ${isOpen || isSettingsActive ? 'active' : ''}`}
            >
                <User size={18} />
                <span>{user?.name}</span>
                <ChevronDown size={14} className={`chevron ${isOpen ? 'rotate-up' : ''}`} />
            </button>

            {isOpen && (
                <div className="profile-dropdown-menu">
                    <div className="menu-header">
                        <User size={20} className="text-blue-500" />
                        <span className="font-semibold">{user?.name}</span>
                        <span className="text-xs text-gray-500 capitalize">({user?.role})</span>
                    </div>
                    
                    {/* Dynamic link to Profile Settings */}
                    <button 
                        onClick={() => handleNavigation(`${basePath}/settings`)}
                        className="menu-item"
                    >
                        <Settings size={16} /> Profile Settings
                    </button>
                    
                    {/* Dynamic link to main Dashboard */}
                    <button 
                        onClick={() => handleNavigation(basePath)}
                        className="menu-item"
                    >
                        <Layers size={16} /> Dashboard
                    </button>

                    <button 
                        onClick={handleLogout}
                        className="menu-item text-red-500"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;