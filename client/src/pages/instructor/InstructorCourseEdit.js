import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetails, updateCourse, createCourse } from '../../redux/slices/instructorCourseSlice';
import { checkInstructorAuth } from '../../services/instructorAuthApi';
import Sidebar from '../../components/instructor/course-editor/Sidebar';
import ModuleEditor from '../../components/instructor/course-editor/ModuleEditor';
import CourseDetails from '../../components/instructor/course-editor/CourseDetails';
import { findModuleById, updateModuleInTree, addModuleToTree, deleteModuleFromTree, getExpandedTitles, getExpandedIdsFromTitles } from '../../components/instructor/course-editor/utils';
import './InstructorCourseEdit.css';

const InstructorCourseEdit = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentCourse, loading, error, successMessage } = useSelector((state) => state.instructorCourse);
  
  const [modules, setModules] = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [authError, setAuthError] = useState(false);

  // Check authentication first
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkInstructorAuth();
        setAuthError(false);
      } catch (error) {
        console.error('Instructor authentication failed:', error);
        // Check if user is actually an admin instead
        const adminUser = localStorage.getItem('admin');
        if (adminUser) {
          console.log('User is admin, allowing access to course editor');
          setAuthError(false);
          return;
        }
        
        setAuthError(true);
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/instructor/login');
        }, 3000);
      }
    };
    
    verifyAuth();
  }, [navigate]);

  // Fetch course data on mount
  useEffect(() => {
    if (authError) return; // Don't fetch if not authenticated
    
    if (courseId) {
      dispatch(fetchCourseDetails(courseId));
    } else {
      // Creation mode: Initialize empty state
      setCourseInfo({
        title: '',
        subject: '',
        tagline: '',
        overview: '',
        price: 0,
        thumbnail: '',
        whatYouWillLearn: []
      });
      setModules([]);
    }
  }, [dispatch, courseId, authError]);

  // Sync state with fetched data
  useEffect(() => {
    if (courseId && currentCourse) {
      console.log("Syncing modules from currentCourse:", JSON.stringify(currentCourse.modules, null, 2));
      setModules(currentCourse.modules || []);
      setCourseInfo({
        title: currentCourse.title,
        subject: currentCourse.subject || '',
        tagline: currentCourse.tagline || '',
        overview: currentCourse.overview || currentCourse.description || '',
        price: currentCourse.price,
        thumbnail: currentCourse.thumbnail,
        whatYouWillLearn: currentCourse.whatYouWillLearn || [],
        _id: currentCourse._id
      });
    }
  }, [currentCourse, courseId]);

  // --- Sidebar Handlers ---

  const handleSelectModule = (moduleId) => {
    setSelectedModuleId(moduleId);
    setShowCourseDetails(false);
  };

  const handleShowCourseDetails = () => {
    setSelectedModuleId(null);
    setShowCourseDetails(true);
  };

  const handleToggleExpand = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleAddModule = (parentId) => {
    const newModule = {
      id: `new-${Date.now()}`, // Temporary ID
      title: 'New Module',
      text: '',
      url: '',
      subModules: []
    };
    
    // console.log('Adding module:', newModule, 'to parent:', parentId);
    const newModules = addModuleToTree(modules, parentId, newModule);
    console.log("New modules tree after add:", JSON.stringify(newModules, null, 2));
    setModules(newModules);
    
    // Auto-expand parent if adding submodule
    if (parentId) {
      setExpandedModules(prev => ({ ...prev, [parentId]: true }));
    } else {
      // If adding a root module, expand it by default (optional, but good for UX)
      // setExpandedModules(prev => ({ ...prev, [newModule.id]: true }));
    }
    
    // Select the new module
    handleSelectModule(newModule.id);
    
    // Auto-save removed to allow batch editing
    // handleSaveChanges(courseInfo, newModules); 
  };

  const handleDeleteModule = (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module and all its submodules?')) {
      const newModules = deleteModuleFromTree(modules, moduleId);
      setModules(newModules);
      if (selectedModuleId === moduleId) {
        handleShowCourseDetails();
      }
      // Auto-save removed to allow batch editing
      // handleSaveChanges(courseInfo, newModules);
    }
  };

  // --- Editor Handlers ---

  const handleSaveModule = (updatedModule) => {
    const newModules = updateModuleInTree(modules, updatedModule.id, updatedModule);
    setModules(newModules);
    // Trigger save to persist content changes
    // handleSaveChanges(courseInfo, newModules);
  };

  const handleSaveCourseDetails = (updatedDetails) => {
    const newInfo = { ...courseInfo, ...updatedDetails };
    setCourseInfo(newInfo);
    // Trigger full save removed
    // handleSaveChanges(newInfo, modules);
  };

  const handleSaveChanges = async (currentInfo = courseInfo, currentModules = modules) => {
    console.log("handleSaveChanges called", { currentInfo, currentModules });
    if (!currentInfo) {
      console.error("Missing courseInfo, cannot save");
      return;
    }

    // Match legacy logic: Confirmation before save
    if (!window.confirm("Are you sure you want to save this course?")) {
      console.log("Save cancelled by user");
      return;
    }

    const payload = {
      courseId: courseId,
      title: (currentInfo.title || '').trim() || 'Untitled Course',
      subject: (currentInfo.subject || '').trim() || 'General',
      tagline: currentInfo.tagline,
      overview: currentInfo.overview,
      price: Number(currentInfo.price) || 0, // Ensure price is a number
      thumbnail: currentInfo.thumbnail,
      whatYouWillLearn: currentInfo.whatYouWillLearn,
      modules: currentModules
    };

    console.log("Dispatching action with payload:", payload);
    
    // Capture expanded state before save
    const expandedTitles = getExpandedTitles(currentModules, expandedModules);
    
    let result;
    if (courseId) {
      result = await dispatch(updateCourse(payload));
    } else {
      result = await dispatch(createCourse(payload));
    }
    console.log("Result:", result);

    if (updateCourse.fulfilled.match(result) || createCourse.fulfilled.match(result)) {
      // Show verification popup as requested
      window.alert("Success! All changes have been saved.");
      
      if (!courseId) {
        // If created, navigate to instructor dashboard or edit page
        const newCourseId = result.payload.courseId || result.payload._id || result.payload.id;
        if (newCourseId) {
           navigate(`/instructor/course/${newCourseId}/edit`);
        } else {
           navigate('/instructor/dashboard');
        }
        return;
      }
      
      // Refresh data to get new IDs using authoritative ID from backend
      // Add delay to ensure DB consistency
      console.log("Waiting for DB consistency...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const refetchCourseId = result.payload?.courseId || courseId;
      if (refetchCourseId && refetchCourseId !== courseId) {
        // If the course ID changed (e.g., creation/duplication), align URL
        console.log("Course ID changed, navigating to new edit route:", refetchCourseId);
        navigate(`/instructor/course/${refetchCourseId}/edit`, { replace: true });
      }
      console.log("Fetching updated course details for:", refetchCourseId);
      const action = await dispatch(fetchCourseDetails(refetchCourseId));
      
      // Restore expanded state based on titles
      if (fetchCourseDetails.fulfilled.match(action)) {
        const newModules = action.payload.modules;
        console.log("Fetched new modules:", JSON.stringify(newModules, null, 2));
        const newExpandedState = getExpandedIdsFromTitles(newModules, expandedTitles);
        setExpandedModules(newExpandedState);
      }
      
      // Optional: Redirect to dashboard if matching legacy behavior strictly
      // navigate('/instructor-dashboard'); 
    } else {
      console.error("Save failed:", result.payload);
      window.alert("Error: Failed to save changes. Please try again. " + (result.payload || ""));
    }
  };

  // --- Render ---

  if (authError) return (
    <div className="error-message">
      <h3>Authentication Required</h3>
      <p>You need to be logged in as an instructor to access this page.</p>
      <p>Redirecting to login page...</p>
    </div>
  );

  if (loading && !currentCourse) return <div className="loading-spinner">Loading...</div>;
  if (error) return (
    <div className="error-message">
      <h3>Failed to fetch course details</h3>
      <p>{String(error)}</p>
      <p>
        Please ensure the course exists and you have access. If this persists,
        try reloading or returning to the dashboard.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn" onClick={() => dispatch(fetchCourseDetails(courseId))}>Retry</button>
        <button className="btn btn-secondary" onClick={() => navigate('/instructor/dashboard')}>Go to Dashboard</button>
      </div>
    </div>
  );

  const selectedModule = selectedModuleId ? findModuleById(modules, selectedModuleId) : null;

  return (
    <div className="instructor-course-edit-page">
      {currentCourse?._fallback && (
        <div className="alert alert-warning" style={{ marginBottom: '10px' }}>
          Modules are temporarily unavailable. Showing basic course details.
          <button
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
            onClick={() => dispatch(fetchCourseDetails(courseId))}
          >
            Reload Modules
          </button>
        </div>
      )}
      <header className="editor-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/instructor/dashboard')}>
            &larr; Back to Dashboard
          </button>
          <h1>Editing: {courseInfo?.title || 'Untitled Course'}</h1>
        </div>
        <div className="header-right">
          <button className="btn-save-primary" onClick={() => handleSaveChanges()}>
            {courseId ? "Save All Changes" : "Create Course"}
          </button>
        </div>
      </header>

      {successMessage && (
        <div className="alert alert-success" onClick={() => dispatch({ type: 'instructorCourse/clearSuccessMessage' })}>
          {successMessage}
        </div>
      )}

      <div className="editor-layout">
        <aside className="editor-sidebar">
          <Sidebar
            modules={modules}
            selectedModuleId={selectedModuleId}
            expandedModules={expandedModules}
            onSelectModule={handleSelectModule}
            onToggleExpand={handleToggleExpand}
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
            onSelectCourseDetails={handleShowCourseDetails}
          />
        </aside>
        
        <main className="editor-main">
          {showCourseDetails && courseInfo && (
            <CourseDetails 
              course={courseInfo} 
              onSave={handleSaveCourseDetails} 
            />
          )}
          
          {/* Show placeholder if creating new course and no modules yet */}
          {!courseId && !showCourseDetails && modules.length === 0 && (
             <div className="empty-state">
               <p>Please save the course details first to start adding modules.</p>
               <button className="btn btn-primary" onClick={handleShowCourseDetails}>Go to Course Details</button>
             </div>
          )}

          {selectedModule && (
            <ModuleEditor 
              module={selectedModule} 
              onSaveModule={handleSaveModule} 
            />
          )}
          
          {!showCourseDetails && !selectedModule && (
            <div className="empty-state">
              <p>Select a module from the sidebar to edit, or click "Course Details".</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorCourseEdit;
