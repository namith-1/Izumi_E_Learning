// v2/src/pages/StudentCourse/CourseViewer.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseById, enrollInCourse, fetchEnrollmentStatus, resetEnrollment } from '../../store';
import { BookOpen, Layers, Clock, Loader2, User, Play } from 'lucide-react';

// Placeholder for the actual learning page. This will handle the course structure navigation.
// NOTE: Must be relative to the CourseViewer component's path in the Route definition.
const COURSE_LEARN_ROUTE = 'learn/module/'; 

const CourseViewer = () => {
    // --- 1. HOOK CALLS (MUST BE UNCONDITIONAL) ---
    const { courseId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentCourse: course, loading: courseLoading, error: courseError } = useSelector(state => state.courses);
    const { currentEnrollment, loading: enrollmentLoading, error: enrollmentError } = useSelector(state => state.enrollment);
    const { entities: teacherEntities } = useSelector(state => state.teachers); 
    
    const [isProcessing, setIsProcessing] = useState(false);
    
    const loading = courseLoading || enrollmentLoading || isProcessing;
    
    const courseBgUrl = "https://placehold.co/1200x300/4c7c9f/ffffff?text=Course+Introduction"; 

    // --- 2. EFFECTS ---
    useEffect(() => {
        dispatch(resetEnrollment()); 
        dispatch(fetchCourseById(courseId));
        dispatch(fetchEnrollmentStatus(courseId));
    }, [dispatch, courseId]);

    // ** NEW EFFECT FOR AUTOMATIC REDIRECT **
    useEffect(() => {
        // Only run this check once course and enrollment data are confirmed
        if (courseLoading || enrollmentLoading) return;

        // If the user is enrolled (currentEnrollment is truthy) and course structure exists
        if (currentEnrollment && course && course.rootModule) {
            const firstModuleId = getFirstModuleId();
            
            // Navigate directly to the learning page
            navigate(`learn/module/${firstModuleId}`, { replace: true });
        }
    }, [currentEnrollment, course, courseLoading, enrollmentLoading, navigate]);

    // --- 3. CALLBACKS ---
    const getFirstModuleId = useCallback(() => {
        if (!course || !course.rootModule) return 'root';
        
        const rootId = course.rootModule.id;
        if (course.rootModule.children && course.rootModule.children.length > 0) {
            // NOTE: Using your specific module ID structure (the first child)
            // Hardcoding a specific ID would break flexibility. We use the first module ID dynamically.
            // If you need a hardcoded module ID (e.g., 1764632801910.2048), you must ensure it is the first child.
            
            // Using a dynamic check to ensure the feature is generally useful:
            return course.rootModule.children[0]; 
        }
        return rootId;
    }, [course]);

    const handleStartLearning = useCallback(() => {
        const firstModuleId = getFirstModuleId();
        // Use relative path to navigate to the learning component
        navigate(`learn/module/${firstModuleId}`); 
    }, [getFirstModuleId, navigate]);
    
    const handleEnroll = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        try {
            const result = await dispatch(enrollInCourse(courseId));

            if (enrollInCourse.fulfilled.match(result) || (result.payload && result.payload.includes('Already enrolled'))) {
                handleStartLearning(); 
            } else {
                console.error("Enrollment failed:", result.payload);
            }
        } catch (error) {
            console.error("Enrollment error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- 4. CONDITIONAL RENDERING (Must be AFTER ALL HOOKS) ---
    
    // Check 1: Initial Loading or Course Error
    if (loading && !course) {
        return <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Loading Course Details...</div>;
    }

    // Check 2: Fatal Errors (After loading completes)
    if (courseError || !course) {
        return <div className="error-state-full">Error: {courseError || "Course not found."}</div>;
    }

    // --- 5. RENDER CONTENT ---
    const isEnrolled = !!currentEnrollment;
    
    const instructor = teacherEntities[course.teacherId];
    const instructorName = instructor ? instructor.name : 'Unknown Instructor';
    
    const rootModule = course.rootModule;
    const introModule = course.modules[rootModule.id] || rootModule; 

    // If the user is enrolled, but the automatic redirect hasn't happened yet (e.g., waiting for data fetch to complete), 
    // we still show a loading screen to prevent a flicker.
    if (isEnrolled && (courseLoading || enrollmentLoading)) {
        return <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Redirecting to course content...</div>;
    }


    return (
        <div className="course-viewer-layout">
            
            {/* Background Image Header */}
            <div 
                className="course-header-banner"
                style={{ backgroundImage: `url(${courseBgUrl})` }}
            >
                <div className="header-overlay">
                    <h1 className="text-white text-3xl font-bold">{course.title}</h1>
                    <p className="text-gray-200 mt-2">{course.description}</p>
                    <div className="course-meta-bar">
                        <span className="meta-item"><User size={16} /> {instructorName}</span>
                        <span className="meta-item"><Layers size={16} /> {course.subject}</span>
                        <span className="meta-item"><Clock size={16} /> Est. Duration: N/A</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="course-viewer-grid">
                
                {/* Left Sidebar (Enrollment/Module Navigation) */}
                <aside className="module-sidebar">
                    <h2 className="sidebar-title"><BookOpen size={20} /> Course Content</h2>
                    <ul className="module-list">
                        <li className="module-list-item active">
                            {introModule.title || 'Course Introduction'}
                        </li>
                    </ul>

                    {/* Button based on Enrollment Status */}
                    <div className="sidebar-action-box">
                        {isEnrolled ? (
                            <button 
                                onClick={handleStartLearning} 
                                className="btn-start-learning"
                            >
                                <Play size={18} /> Start Learning
                            </button>
                        ) : (
                            <button 
                                onClick={handleEnroll} 
                                className="btn-enroll-now"
                                disabled={isProcessing || loading}
                            >
                                {isProcessing || loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <BookOpen size={18} /> Enroll Now
                                    </>
                                )}
                            </button>
                        )}
                        {enrollmentError && !isEnrolled && 
                            <p className="text-red-500 text-xs mt-2 text-center">Enrollment Status: {enrollmentError}</p>
                        }
                    </div>
                </aside>

                {/* Right Content Area (Intro Module Details) */}
                <main className="module-content-area">
                    <h2 className="module-title">{introModule.title}</h2>
                    <div className="intro-module-content">
                        <p className="intro-description">{introModule.description || course.description}</p>
                        <div className="lesson-text">
                           {introModule.text || "Welcome to the course! This is the introduction module. Enroll to start tracking your progress."}
                        </div>
                    </div>
                    
                </main>
            </div>
        </div>
    );
};

export default CourseViewer;