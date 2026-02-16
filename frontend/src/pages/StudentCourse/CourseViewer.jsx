// v2/src/pages/StudentCourse/CourseViewer.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseById, enrollInCourse, fetchEnrollmentStatus, resetEnrollment } from '../../store';
import { BookOpen, Layers, Clock, Loader2, User, Play, DollarSign } from 'lucide-react';

const CourseViewer = () => {
    // --- 1. HOOK CALLS ---
    const { courseId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentCourse: course, loading: courseLoading, error: courseError } = useSelector(state => state.courses);
    const { currentEnrollment, loading: enrollmentLoading, error: enrollmentError } = useSelector(state => state.enrollment);
    const { entities: teacherEntities } = useSelector(state => state.teachers); 
    
    const [isProcessing, setIsProcessing] = useState(false);
    
    const loading = courseLoading || enrollmentLoading || isProcessing;
    
    // UPDATED: Seeded background image logic to match Catalog and My Learning
    const courseBgUrl = `https://picsum.photos/seed/${courseId}/1200/400`; 

    // --- 2. EFFECTS ---
    useEffect(() => {
        dispatch(resetEnrollment()); 
        dispatch(fetchCourseById(courseId));
        dispatch(fetchEnrollmentStatus(courseId));
    }, [dispatch, courseId]);

    useEffect(() => {
        if (courseLoading || enrollmentLoading) return;

        if (currentEnrollment && course && course.rootModule) {
            const firstModuleId = getFirstModuleId();
            navigate(`learn/module/${firstModuleId}`, { replace: true });
        }
    }, [currentEnrollment, course, courseLoading, enrollmentLoading, navigate]);

    // --- 3. CALLBACKS ---
    const getFirstModuleId = useCallback(() => {
        if (!course || !course.rootModule) return 'root';
        const rootId = course.rootModule.id;
        if (course.rootModule.children && course.rootModule.children.length > 0) {
            return course.rootModule.children[0]; 
        }
        return rootId;
    }, [course]);

    const handleStartLearning = useCallback(() => {
        const firstModuleId = getFirstModuleId();
        navigate(`learn/module/${firstModuleId}`); 
    }, [getFirstModuleId, navigate]);
    
    const handleEnroll = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const result = await dispatch(enrollInCourse(courseId));
            if (enrollInCourse.fulfilled.match(result) || (result.payload && result.payload.includes('Already enrolled'))) {
                handleStartLearning(); 
            }
        } catch (error) {
            console.error("Enrollment error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- 4. CONDITIONAL RENDERING ---
    if (loading && !course) {
        return <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Loading Course Details...</div>;
    }

    if (courseError || !course) {
        return <div className="error-state-full">Error: {courseError || "Course not found."}</div>;
    }

    const isEnrolled = !!currentEnrollment;
    const instructor = teacherEntities[course.teacherId];
    const instructorName = instructor ? instructor.name : 'Unknown Instructor';
    const introModule = course.modules[course.rootModule.id] || course.rootModule; 

    if (isEnrolled && (courseLoading || enrollmentLoading)) {
        return <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Redirecting to course content...</div>;
    }

    return (
        <div className="course-viewer-layout">
            
            {/* UPDATED: Header Banner with Seeded Image */}
            <div 
                className="course-header-banner"
                style={{ 
                    backgroundImage: ` url(${courseBgUrl}`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="header-overlay">
                    <span 
        className="badge-subject-overlay" 
        style={{ 
            color: '#ffffff', 
            background: '#b0b3b9', 
            padding: '4px 12px', 
            borderRadius: '4px', 
            fontWeight: 'bold',
            display: 'inline-block'
        }}
    >
        {course.subject}
    </span>
    
    <h1 
        className="course-viewer-title" 
        style={{ 
            color: '#ffffff', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)', 
            fontSize: '2.5rem', 
            fontWeight: '800',
            margin: '15px 0'
        }}
    >
        {course.title}
    </h1>
    
    <p 
        className="course-viewer-desc" 
        style={{ 
            color: '#f3f4f6', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.6)', 
            fontSize: '1.1rem',
            lineHeight: '1.6',
            maxWidth: '800px'
        }}
    >
        {course.description}
    </p>
                    <div className="course-meta-bar">
                        <span className="meta-item"><User size={16} /> {instructorName}</span>
                        <span className="meta-item"><DollarSign size={16} /> {course.price > 0 ? `$${course.price}` : 'Free'}</span>
                        <span className="meta-item"><Clock size={16} /> Est. Duration: N/A</span>
                    </div>
                </div>
            </div>

            <div className="course-viewer-grid">
                {/* Left Sidebar */}
                <aside className="module-sidebar">
                    <h2 className="sidebar-title"><BookOpen size={20} /> Course Content</h2>
                    <ul className="module-list">
                        <li className="module-list-item active">
                            {introModule.title || 'Course Introduction'}
                        </li>
                    </ul>

                    <div className="sidebar-action-box">
                        {isEnrolled ? (
                            <button onClick={handleStartLearning} className="btn-start-learning">
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
                                    <> <BookOpen size={18} /> Enroll Now </>
                                )}
                            </button>
                        )}
                    </div>
                </aside>

                {/* Right Content Area */}
                <main className="module-content-area">
                    <h2 className="module-title">{introModule.title}</h2>
                    <div className="intro-module-content">
                        <p className="intro-description">{introModule.description || course.description}</p>
                        <div className="lesson-text">
                           {introModule.text || "Welcome to the course! Enroll to start your journey."}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CourseViewer;