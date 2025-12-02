import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './StudentHome.css';

const StudentHome = () => {
    const { student } = useSelector(state => state.studentAuth);

    return (
        <div className="student-home-page">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Welcome back, {student?.name || 'Student'}!</h1>
                    <p>Continue your learning journey and achieve your goals.</p>
                </div>
            </section>

            <div className="dashboard-grid">
                <Link to="/student/dashboard" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <h3>My Progress</h3>
                    <p>Track your course completion and achievements.</p>
                </Link>

                <Link to="/student/courses" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-book-open"></i>
                    </div>
                    <h3>Browse Courses</h3>
                    <p>Explore new courses and expand your knowledge.</p>
                </Link>

                <Link to="/student/questions" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-question-circle"></i>
                    </div>
                    <h3>Q&A Forum</h3>
                    <p>Ask questions and help your peers.</p>
                </Link>

                <Link to="/student/gamification" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-trophy"></i>
                    </div>
                    <h3>Goals & Badges</h3>
                    <p>Set goals and view your earned badges.</p>
                </Link>

                <Link to="/student/magazines" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-book-reader"></i>
                    </div>
                    <h3>Magazines</h3>
                    <p>Read our latest educational magazines.</p>
                </Link>

                <Link to="/student/profile" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-user-cog"></i>
                    </div>
                    <h3>Profile Settings</h3>
                    <p>Update your personal information and account settings.</p>
                </Link>
                 <Link to="/student/purchases" className="dashboard-card">
                    <div className="card-icon">
                        <i className="fas fa-shopping-cart"></i>
                    </div>
                    <h3>My Purchases</h3>
                    <p>View your purchase history.</p>
                </Link>
            </div>
        </div>
    );
};

export default StudentHome;
