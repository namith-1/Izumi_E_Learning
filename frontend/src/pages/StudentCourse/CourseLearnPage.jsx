import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchCourseById, 
    fetchEnrollmentStatus, 
    updateProgress, 
    clearCurrentCourse, 
    resetEnrollment 
} from '../../store';
import { 
    BookOpen, 
    Loader2,
    Home, 
    ChevronRight, 
    ChevronDown, 
    CheckCircle, 
    Clock 
} from 'lucide-react';

// Content Components
import TextModule from '../../components/content/TextModule';
import VideoModule from '../../components/content/VideoModule';
import QuizModule from '../../components/content/QuizModule'; 

const CourseLearnPage = () => {
    // --- 1. HOOK CALLS (MUST BE UNCONDITIONAL) ---
    const { courseId, moduleId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentCourse: course, loading: courseLoading, error: courseError } = 
        useSelector(state => state.courses);
    const { currentEnrollment, loading: enrollmentLoading } = 
        useSelector(state => state.enrollment);
    
    // Initialize activeModuleId state from the URL's moduleId
    const [activeModuleId, setActiveModuleId] = useState(moduleId);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Initialize expandedModules state (can be optimized if tree is large, but functional)
    const [expandedModules, setExpandedModules] = useState({ [moduleId]: true }); 
    
    const loading = courseLoading || enrollmentLoading || isProcessing;
    
    // --- 2. EFFECTS ---

    // ✅ Effect 1: Fetch data (Course and Enrollment) and register cleanup.
    // Runs ONLY on mount or when courseId changes. (Prevents re-fetching on module change)
    useEffect(() => {
        // Fetch course data (conditionally)
        if (!course || course._id !== courseId) {
            dispatch(fetchCourseById(courseId));
        }
        // Fetch enrollment status
        dispatch(fetchEnrollmentStatus(courseId));
        
        // Cleanup function runs on unmount
        return () => {
            dispatch(resetEnrollment());
            dispatch(clearCurrentCourse());
        };
    }, [dispatch, courseId]); 

    // 💥 REMOVED: The effect that synced URL's moduleId to activeModuleId
    // This is no longer necessary, as handleTreeItemClick directly controls activeModuleId.

    // ✅ Effect 2: Initial Redirection and Invalid Module Check
    // Runs when course or enrollment data is resolved.
    useEffect(() => {
        // Wait until course data and enrollment status check is completed
        if (!course || currentEnrollment === undefined || enrollmentLoading) return;
        
        // Check 1: Not Enrolled -> Redirect Immediately
        if (currentEnrollment === null) {
            navigate(`/student-dashboard/courses/${courseId}`, { replace: true });
            return;
        }

        // Check 2: Invalid starting module from URL -> Fix internal state (no navigation)
        const moduleExists = course.modules[moduleId] || (moduleId === course.rootModule.id);
        if (!moduleExists) {
            const validStartId = course.rootModule.children?.[0] || course.rootModule.id;
            // Set internal state to the first valid module, keeping the URL as is
            setActiveModuleId(validStartId);
            setExpandedModules({ [validStartId]: true });
        }
    }, [course, currentEnrollment, enrollmentLoading, courseId, navigate, moduleId]);


    // --- 3. CALLBACKS ---
    const handleProgressUpdate = useCallback(async (moduleIdToUpdate, updates) => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        try {
            await dispatch(updateProgress({ 
                courseId, 
                progressData: { 
                    moduleId: moduleIdToUpdate, 
                    ...updates 
                } 
            }));
        } catch (e) {
            console.error("Failed to save progress:", e);
        } finally {
            setIsProcessing(false);
        }
    }, [dispatch, courseId, isProcessing]);

    const getModuleStatus = useCallback((moduleId) => {
        return currentEnrollment?.modules_status?.find(m => m.moduleId === moduleId) || {};
    }, [currentEnrollment]);
    
    const isModuleCompleted = (moduleId) => {
        return getModuleStatus(moduleId).completed || false;
    };
    
    // 💥 CRITICAL FIX: Module Change Logic (No Navigation/URL Change)
    const handleTreeItemClick = (moduleId) => {
        setActiveModuleId(moduleId);
        // REMOVED: navigate call
    };
    
    const handleToggleExpand = useCallback((e, moduleId) => {
        e.stopPropagation();
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    }, []);

    // --- 4. CONDITIONAL RENDERING ---
    
    if (loading && !course) {
        return <div className="loading-state-full"><Loader2 className="animate-spin" size={32} /> Preparing your course...</div>;
    }
    
    if (courseError) {
        return <div className="error-state-full">Error loading course: {courseError}</div>;
    }
    
    // Final check for course/enrollment data resolution
    if (!course || currentEnrollment === null || currentEnrollment === undefined) {
        // The useEffect will handle the redirection if currentEnrollment === null
        return (
            <div className="loading-state-full">
                <Loader2 className="animate-spin" size={32} /> 
                {currentEnrollment === null ? 'Redirecting...' : 'Finalizing session...'}
            </div>
        );
    }
    
    // --- 5. RENDER CONTENT ---

    const renderTreeItem = (moduleId, depth = 0) => {
        if (!course) return null;

        const module = course.modules[moduleId] || (moduleId === course.rootModule.id ? course.rootModule : null);
        if (!module) return null;
        
        const isCurrent = module.id === activeModuleId;
        const isCompleted = isModuleCompleted(module.id);
        const hasChildren = module.children && module.children.length > 0;
        
        const isExpanded = expandedModules[module.id] || false; 

        return (
            <li key={module.id} className="tree-node">
                <div 
                    className={`module-list-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => handleTreeItemClick(module.id)}
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                >
                    <span className="flex items-center gap-2">
                        {isCompleted ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-gray-400" />}
                        {module.title}
                    </span>
                    {hasChildren && (
                        <span onClick={(e) => handleToggleExpand(e, module.id)}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    )}
                </div>
                
                {hasChildren && isExpanded && (
                    <ul className="module-children-list">
                        {module.children.map(childId => renderTreeItem(childId, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };
    
    const renderModuleContent = () => {
        if (!activeModuleId) return <div>Select a module to begin your learning.</div>;

        const module = course.modules[activeModuleId] || course.rootModule;
        
        if (!module) return <div className="p-4 text-red-500">Module not found in course structure.</div>;

        const status = getModuleStatus(activeModuleId);
        const isCompleted = isModuleCompleted(activeModuleId);

        const commonProps = {
            module,
            enrollmentStatus: status,
            isCompleted: isCompleted,
            isProcessing,
        };

        switch (module.type) {
            case 'text':
            case 'intro':
                return (
                    <TextModule 
                        {...commonProps} 
                        onComplete={handleProgressUpdate} 
                    />
                );
            case 'video':
                return (
                    <VideoModule 
                        {...commonProps} 
                        onProgressUpdate={handleProgressUpdate} 
                    />
                );
            case 'quiz':
                return (
                    <QuizModule 
                        {...commonProps} 
                        onScoreSubmit={handleProgressUpdate} 
                    />
                );
            default:
                return <div className="p-4 text-red-500">Unknown Module Type: {module.type}</div>;
        }
    };
    
    // Calculate overall course progress
    const allModulesList = Object.keys(course.modules).concat(course.rootModule.id);
    const totalModules = allModulesList.length;
    const completedModules = currentEnrollment?.modules_status?.filter(s => s.completed).length || 0;
    const courseCompletion = (completedModules / totalModules) * 100 || 0;

    return (
        <div className="course-learn-layout">
            
            <header className="learning-header">
                <h1 className="course-title-small">{course.title}</h1>
                <div className="completion-bar">
                    <span className="text-sm text-gray-600">{completedModules}/{totalModules} Modules Complete</span>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                        <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${courseCompletion}%` }}
                        ></div>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/student-dashboard')}
                    className="btn-back-to-dash"
                >
                    <Home size={16} /> Dashboard
                </button>
            </header>

            <div className="course-viewer-grid">
                
                {/* Left Sidebar (Module Navigation Tree) */}
                <aside className="module-sidebar">
                    <h2 className="sidebar-title"><BookOpen size={20} /> Course Structure</h2>
                    <ul className="module-tree-list">
                        {renderTreeItem(course.rootModule.id)}
                        {(course.rootModule.children || []).map(childId => renderTreeItem(childId))}
                    </ul>
                </aside>

                {/* Right Content Area (Active Module) */}
                <main className="module-content-area">
                    {renderModuleContent()}
                </main>
            </div>
        </div>
    );
};

export default CourseLearnPage;