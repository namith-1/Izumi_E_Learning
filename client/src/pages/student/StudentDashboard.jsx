import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchStudentProgress } from '../../redux/slices/studentSlice';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const dispatch = useDispatch();
    const { progress, loading, error } = useSelector(state => state.student);

    useEffect(() => {
        dispatch(fetchStudentProgress());
    }, [dispatch]);

    // Process progress data for display
    const ongoingCourses = [];
    const completedCourses = [];
    
    if (Array.isArray(progress)) {
        progress.forEach(course => {
            const progVal = Number(course.progress) || 0;
            if (progVal === 100) {
                completedCourses.push(course);
            } else {
                ongoingCourses.push({ ...course, progress: progVal });
            }
        });
    }

    if (loading) return <div className="dashboard-loading">Loading your progress...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;

    return (
        <div className="student-dashboard-page">
            <header className="dashboard-header">
                <h1>My Learning Dashboard</h1>
                <p>Track your progress and achievements</p>
            </header>

            <div className="dashboard-content">
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2><i className="fas fa-spinner"></i> Ongoing Courses</h2>
                    </div>
                    <div className="card-container">
                        {ongoingCourses.length === 0 ? (
                            <div className="empty-state">
                                <p>No ongoing courses. <Link to="/student/courses">Start learning today!</Link></p>
                            </div>
                        ) : (
                            <div className="progress-grid">
                                {ongoingCourses.map(course => (
                                    <div key={course.course_id} className="progress-card">
                                        <div className="card-header">
                                            <h3><Link to={`/course/${course.course_id}`}>{course.title}</Link></h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="progress-info">
                                                <span className="progress-label">Progress</span>
                                                <span className="progress-percentage">{course.progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div 
                                                    className="progress-bar-fill" 
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                            <Link to={`/course/${course.course_id}`} className="continue-btn">
                                                Continue Learning
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="section-header">
                        <h2><i className="fas fa-check-circle"></i> Completed Courses</h2>
                    </div>
                    <div className="card-container">
                        {completedCourses.length === 0 ? (
                            <div className="empty-state">
                                <p>You haven't completed any courses yet. Keep going!</p>
                            </div>
                        ) : (
                            <div className="completed-grid">
                                {completedCourses.map(course => (
                                    <div key={course.course_id} className="completed-card">
                                        <div className="card-icon">
                                            <i className="fas fa-medal"></i>
                                        </div>
                                        <div className="card-info">
                                            <h3><Link to={`/course/${course.course_id}`}>{course.title}</Link></h3>
                                            <span className="completion-badge">Completed</span>
                                        </div>
                                        <Link to={`/course/${course.course_id}`} className="review-btn">
                                            Review
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudentDashboard;
