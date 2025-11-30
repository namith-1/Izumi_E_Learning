import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllCourses, enrollInCourse } from '../store';
import { BookOpen, User, Zap, CheckCircle } from 'lucide-react';
import './css/CourseCatalog.css';

const CourseCatalog = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: courses, loading, error } = useSelector((state) => state.courses);
    const { user } = useSelector((state) => state.auth);
    
    // MOCK: Replace this with actual enrolled course IDs fetched from your backend
    // For now, we assume the enrollment list is available globally or fetched separately.
    const mockEnrolledIds = []; // Placeholder for student's enrolled course IDs
    
    useEffect(() => {
        dispatch(fetchAllCourses());
    }, [dispatch]);

    const handleEnroll = async (courseId) => {
        if (!user) return alert("Please log in to enroll.");
        
        try {
            const resultAction = await dispatch(enrollInCourse(courseId));
            
            if (enrollInCourse.fulfilled.match(resultAction)) {
                alert(`Successfully enrolled in the course!`);
                navigate(`/course/${courseId}`);
            } else {
                alert(`Enrollment failed: ${resultAction.payload}`);
            }
        } catch (err) {
            console.error("Enrollment error:", err);
            alert("An unknown error occurred during enrollment.");
        }
    };

    if (loading) return <div className="catalog-loading">Loading Course Catalog...</div>;
    if (error) return <div className="catalog-error">Error loading courses: {error}</div>;

    return (
        <div className="catalog-container">
            <header className="catalog-header">
                <h1>Course Catalog</h1>
                <p>Browse over {courses.length} available courses.</p>
                <button onClick={() => navigate('/student-dashboard')} className="btn-dashboard-link">
                    Go to Dashboard
                </button>
            </header>

            <div className="course-grid">
                {courses.map((course) => {
                    const isEnrolled = mockEnrolledIds.includes(course._id);
                    
                    return (
                        <div key={course._id} className={`course-card ${isEnrolled ? 'enrolled-card' : ''}`}>
                            <div className="card-icon-wrapper">
                                <BookOpen size={30} className="card-icon" />
                            </div>
                            <h2 className="card-title">{course.title}</h2>
                            <p className="card-description">{course.description}</p>
                            
                            <div className="card-meta">
                                <span><Zap size={14} /> Subject: {course.subject}</span>
                                <span><User size={14} /> Taught by: Teacher {course.teacherId.substring(0, 4)}...</span>
                                <span className="rating">★ {course.rating || 0}</span>
                            </div>

                            <button 
                                onClick={() => isEnrolled ? navigate(`/course/${course._id}`) : handleEnroll(course._id)}
                                className={`btn-action ${isEnrolled ? 'btn-view' : 'btn-enroll'}`}
                                disabled={!user}
                            >
                                {isEnrolled ? (
                                    <>
                                        <CheckCircle size={18} /> Continue Learning
                                    </>
                                ) : (
                                    'Enroll Now'
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CourseCatalog;