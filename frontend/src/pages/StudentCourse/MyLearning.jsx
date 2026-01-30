// v1/frontend/src/pages/StudentCourse/MyLearning.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEnrolledCourses } from '../../store'; // New thunk
import { Loader2 } from 'lucide-react';

// Helper to calculate completion percentage for a single course
const getCourseCompletionPercentage = (course) => {
    // FIX: Calculate completed modules directly from the modules_status array.
    const completed = course.modules_status?.filter(s => s.completed).length || 0;
    
    // FIX: Calculate total modules using the length of the modules_status array 
    // (the total number of modules the student has interacted with and has a record for).
    const totalModules = course.modules_status?.length || 1; 
    
    if (totalModules === 0) return 0;
    return Math.min(100, (completed / totalModules) * 100);
};

const MyLearning = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    // Fetch enrollment list and loading status
    const { enrolledList, loading, error } = useSelector((state) => state.enrollment);

    useEffect(() => {
        // Fetch the list of courses the student is enrolled in on load
        dispatch(fetchEnrolledCourses());
    }, [dispatch]);

    // Calculate only the enrolled count
    const enrolledCount = enrolledList.length;

    const handleViewCourse = (courseId) => {
        // Navigate directly to the nested viewer route
        navigate(`/student-dashboard/courses/${courseId}`);
    };

    return (
        <>
            <div className="dashboard-intro">
                <h1>My Learning</h1>
                <p className="text-gray-600">Welcome back, {user?.name}. You are enrolled in {enrolledCount} courses.</p>
            </div>
            
            {/* Removed: Stats Overview section (overall progress bar and completed count) */}

            {/* My Learning Section - Wrapped to constrain width to ~60% */}
            <section className="course-section course-list-area-60-percent"> 
                <h2>Active Courses</h2>
                
                {loading ? (
                    <div className="loading-state-full">
                        <Loader2 className="animate-spin" size={32} /> Loading your enrolled courses...
                    </div>
                ) : enrolledList.length > 0 ? (
                    <div className="course-grid student-course-grid">
                        {enrolledList.map(course => {
                            // Calculate required counts for display and percentage
                            const completedCount = course.modules_status?.filter(s => s.completed).length || 0;
                            const totalModulesDisplay = course.modules_status?.length || '?';
                            
                            const completionPercent = getCourseCompletionPercentage(course);
                            const progressBarColor = course.completionStatus === 'completed' ? '#10b981' : '#3b82f6'; // Use actual status for color

                            return (
                                <div key={course._id} className="course-card horizontal-progress-card"> 
                                    {/* Left Side: Title and Meta */}
                                    <div className="card-content-wrapper">
                                        <div className="course-card-header">
                                            <span className="badge-subject">{course.subject}</span>
                                            {/* Use accurate completion status from enrollment object */}
                                            <span className="badge-rating" style={{color: progressBarColor, fontWeight: 'bold'}}>
                                                {course.completionStatus === 'completed' ? 'Completed' : 'In Progress'}
                                            </span>
                                        </div>
                                        <p className="course-instructor">By: {course.instructorName || 'Unknown Instructor'}</p>
                                        <h3>{course.courseTitle}</h3>
                                        {/* Description is now hidden in CSS for the compact view */}
                                    </div>
                                    
                                    {/* Right Side: Progress Bar & Button */}
                                    <div className="progress-action-wrapper">
                                        {/* Per-Course Progress Bar */}
                                        <div className="course-progress-container">
                                            <span className="progress-text-card">
                                                {/* Display completed count vs Total Modules in status array */}
                                                Progress: {completedCount}/{totalModulesDisplay} Modules Watched
                                                ({completionPercent.toFixed(0)}%)
                                            </span>
                                            <div className="module-progress-bar-container">
                                                <div 
                                                    className="module-progress-bar" 
                                                    style={{ 
                                                        width: `${completionPercent}%`, 
                                                        backgroundColor: progressBarColor 
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="course-card-footer">
                                            <button 
                                                className="btn-browse"
                                                onClick={() => handleViewCourse(course._id)}
                                            >
                                                {course.completionStatus === 'completed' ? 'Review' : 'Continue Learning'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>You haven't enrolled in any courses yet.</p>
                        <Link to="/student-dashboard/catalog" className="browse-btn">Browse Catalog</Link>
                    </div>
                )}

                {error && <div className="text-red-500 mt-4">Error loading courses: {error}</div>}
            </section>
        </>
    );
};

export default MyLearning;