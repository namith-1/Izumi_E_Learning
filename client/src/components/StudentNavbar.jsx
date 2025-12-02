import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { studentLogout } from '../redux/slices/studentAuthSlice';
import './StudentNavbar.css';

const StudentNavbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { student } = useSelector(state => state.studentAuth);

    const handleLogout = () => {
        dispatch(studentLogout());
        navigate('/student/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <nav className="student-navbar">
            <div className="navbar-brand">
                <Link to="/student/home">Izumi Learning</Link>
            </div>
            
            <div className="navbar-links">
                <Link to="/student/home" className={isActive('/student/home')}>
                    <i className="fas fa-home"></i> Home
                </Link>
                <Link to="/student/dashboard" className={isActive('/student/dashboard')}>
                    <i className="fas fa-chart-line"></i> Dashboard
                </Link>
                <Link to="/student/courses" className={isActive('/student/courses')}>
                    <i className="fas fa-book-open"></i> Courses
                </Link>
                <Link to="/student/questions" className={isActive('/student/questions')}>
                    <i className="fas fa-question-circle"></i> Q&A
                </Link>
                <Link to="/student/gamification" className={isActive('/student/gamification')}>
                    <i className="fas fa-trophy"></i> Goals
                </Link>
                <Link to="/student/magazines" className={isActive('/student/magazines')}>
                    <i className="fas fa-book-reader"></i> Magazines
                </Link>
            </div>

            <div className="navbar-user">
                <div className="user-dropdown">
                    <button className="dropbtn">
                        <i className="fas fa-user-circle"></i> {student?.name || 'Student'}
                    </button>
                    <div className="dropdown-content">
                        <Link to="/student/profile">Profile</Link>
                        <Link to="/student/purchases">My Purchases</Link>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default StudentNavbar;
