import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createNewCourse, fetchCourseById, updateCourse } from '../../store';
import { 
    Plus, Trash2, Save, BookOpen, Clock, Layers, GitBranch, 
    Video, FileText, CheckSquare, Settings, ChevronRight, ChevronDown, MoreVertical, Loader2, AlertCircle
} from 'lucide-react';
import QuizBuilder from '../../components/QuizBuilder'; 
import '../css/CourseEditor.css'; 

// ==========================================
// 1. UTILITIES & CONFIGURATION
// ==========================================
const COURSE_DATA_PATH = 'local_course_draft'; 
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

const createNewModule = (type = 'text', parentId = null) => ({
    id: generateId(),
    parentId: parentId,
    type: type, 
    title: type === 'intro' ? 'Course Introduction' : `New ${type.charAt(0).toUpperCase() + type.slice(1)} Module`,
    description: '',
    text: type === 'text' ? 'Start writing your content here...' : '',
    videoLink: type === 'video' ? '' : '',
    quizData: {
        questions: [] 
    },
    children: [], 
});

const initialCourseStructure = {
    rootModule: createNewModule('intro', null),
    modules: {}, 
    courseTitle: "Untitled Course",
    courseDescription: "A description for the entire course.",
    subject: "General",
    price: 0,
    duration: 0,
    imageUrl: null,
    _id: null, 
};

const renderModuleIcon = (type) => {
    const props = { size: 16, className: "module-icon-type" };
    switch (type) {
        case 'intro': return <BookOpen {...props} />;
        case 'text': return <FileText {...props} />;
        case 'video': return <Video {...props} />;
        case 'quiz': return <CheckSquare {...props} />;
        default: return <Layers {...props} />;
    }
};

const deleteModuleFromStructure = (modules, moduleId) => {
    const moduleToDelete = modules[moduleId];
    if (!moduleToDelete) return modules;
    
    const moduleIdsToDelete = [moduleId];
    const findChildrenToDelete = (children) => {
        children.forEach(childId => {
            moduleIdsToDelete.push(childId);
            if (modules[childId] && modules[childId].children) {
                findChildrenToDelete(modules[childId].children);
            }
        });
    };
    findChildrenToDelete(moduleToDelete.children);

    if (moduleToDelete.parentId && modules[moduleToDelete.parentId]) {
        modules[moduleToDelete.parentId].children = modules[moduleToDelete.parentId].children.filter(id => id !== moduleId);
    }
    
    const newModules = { ...modules };
    moduleIdsToDelete.forEach(id => delete newModules[id]);
    return newModules;
};

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================
const ModuleActions = ({ module, onAction, isRoot }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="module-actions-wrapper">
            <button 
                className="module-actions-btn" 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                title="Options"
            >
                <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
                <div ref={menuRef} className="module-actions-menu">
                    <button onClick={(e) => { e.stopPropagation(); onAction('add', module.id); setIsMenuOpen(false); }}>
                        <Plus size={14} className="text-green-600" /> Add Sub-Module
                    </button>
                    {!isRoot && (
                        <button onClick={(e) => { e.stopPropagation(); onAction('delete', module.id); setIsMenuOpen(false); }}>
                            <Trash2 size={14} className="text-red-600" /> Delete Module
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const ModuleTreeItem = ({ modules, moduleId, onSelect, onAction, selectedId, rootId, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const module = modules[moduleId];
    
    if (!module) return null;

    const isSelected = module.id === selectedId;
    const hasChildren = module.children && module.children.length > 0;
    const isRoot = module.id === rootId;

    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <li className="tree-node">
            <div 
                className={`module-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelect(module.id)}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
                <div className="module-title-wrapper">
                    <div 
                        className={`expand-icon ${hasChildren ? 'visible' : 'hidden'}`} 
                        onClick={hasChildren ? toggleExpand : undefined}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    {renderModuleIcon(module.type)}
                    <span className="module-title-text">{module.title}</span>
                </div>
                <ModuleActions module={module} onAction={onAction} isRoot={isRoot} />
            </div>
            {hasChildren && isExpanded && (
                <ul className="module-children-list">
                    {module.children.map(childId => (
                        <ModuleTreeItem 
                            key={childId}
                            modules={modules}
                            moduleId={childId}
                            onSelect={onSelect}
                            onAction={onAction}
                            selectedId={selectedId}
                            rootId={rootId}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// ==========================================
// 3. MAIN COMPONENT (CourseEditor)
// ==========================================
const CourseEditor = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { courseId } = useParams(); 
    
    const { currentCourse } = useSelector(state => state.courses);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [courseStructure, setCourseStructure] = useState(initialCourseStructure);
    const [selectedModuleId, setSelectedModuleId] = useState(initialCourseStructure.rootModule.id);
    const [isIntroModuleForm, setIsIntroModuleForm] = useState(true);
    const [isLoadingCourse, setIsLoadingCourse] = useState(!!courseId);
    const [validationErrors, setValidationErrors] = useState({});

    // Image upload state
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const allModules = useMemo(() => ({
        [courseStructure.rootModule.id]: courseStructure.rootModule,
        ...courseStructure.modules
    }), [courseStructure]);

    const selectedModule = allModules[selectedModuleId] || courseStructure.rootModule;
    
    // Load Data
    useEffect(() => {
        if (courseId) {
            dispatch(fetchCourseById(courseId));
        } else {
            const storedData = localStorage.getItem(COURSE_DATA_PATH);
            if (storedData) {
                try {
                    const loaded = JSON.parse(storedData);
                    if (loaded.rootModule) {
                        setCourseStructure(loaded);
                        setLastSaved(localStorage.getItem(COURSE_DATA_PATH + '_time'));
                        setSelectedModuleId(loaded.rootModule.id);
                        setIsIntroModuleForm(true);
                    }
                } catch (e) {
                    console.error("Error loading draft", e);
                }
            }
        }
    }, [dispatch, courseId]);
    
    useEffect(() => {
        if (courseId && currentCourse && currentCourse._id === courseId && isLoadingCourse) {
            setCourseStructure({
                rootModule: currentCourse.rootModule,
                modules: currentCourse.modules,
                courseTitle: currentCourse.title,
                courseDescription: currentCourse.description,
                subject: currentCourse.subject,
                price: currentCourse.price || 0,
                duration: currentCourse.duration || 0,
                imageUrl: currentCourse.imageUrl || null,
                _id: currentCourse._id, 
            });
            setSelectedModuleId(currentCourse.rootModule.id);
            setIsIntroModuleForm(true);
            setIsLoadingCourse(false);
            setLastSaved(new Date().toISOString());
            if (currentCourse.imageUrl) setImagePreviewUrl(currentCourse.imageUrl);
        }
    }, [courseId, currentCourse, isLoadingCourse]);

    const saveDraft = useCallback((structure) => {
        if (!courseId) {
            setIsSaving(true);
            localStorage.setItem(COURSE_DATA_PATH, JSON.stringify(structure));
            localStorage.setItem(COURSE_DATA_PATH + '_time', new Date().toISOString());
            setTimeout(() => setIsSaving(false), 500);
            setLastSaved(new Date().toISOString());
        }
    }, [courseId]);

    // Handlers
    const handleSelectModule = (id) => {
        setSelectedModuleId(id);
        setIsIntroModuleForm(id === courseStructure.rootModule.id);
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.moduleTitle;
            delete newErrors.videoLink;
            return newErrors;
        });
    };

    const handleAddModule = useCallback((parentId) => {
        const parentModule = allModules[parentId];
        if (!parentModule) return;
        const newModule = createNewModule('text', parentId);
        const updatedParent = { ...parentModule, children: [...parentModule.children, newModule.id] };
        
        setCourseStructure(prev => {
            const newModulesMap = { ...prev.modules };
            newModulesMap[newModule.id] = newModule;
            let nextState;
            if (parentId === prev.rootModule.id) {
                nextState = { ...prev, rootModule: updatedParent, modules: newModulesMap };
            } else {
                newModulesMap[parentId] = updatedParent;
                nextState = { ...prev, modules: newModulesMap };
            }
            saveDraft(nextState);
            return nextState;
        });
        setSelectedModuleId(newModule.id);
        setIsIntroModuleForm(false);
    }, [allModules, saveDraft]);
    
    const handleDeleteModule = useCallback((moduleId) => {
        if (moduleId === courseStructure.rootModule.id) {
            alert("Cannot delete the root module.");
            return;
        }
        if (window.confirm("Delete this module and ALL sub-modules?")) {
            const updatedModules = deleteModuleFromStructure(allModules, moduleId);
            const moduleToDelete = allModules[moduleId];
            const parentId = moduleToDelete.parentId;
            let updatedRoot = { ...courseStructure.rootModule };
            
            if (parentId === courseStructure.rootModule.id) {
                updatedRoot.children = updatedRoot.children.filter(id => id !== moduleId);
            } else if (updatedModules[parentId]) {
                updatedModules[parentId] = {
                    ...updatedModules[parentId],
                    children: updatedModules[parentId].children.filter(id => id !== moduleId)
                };
            }
            delete updatedModules[courseStructure.rootModule.id];

            const newModulesMap = Object.keys(updatedModules).reduce((acc, key) => {
                 if (key !== updatedRoot.id) acc[key] = updatedModules[key];
                 return acc;
            }, {});

            const newStructure = { ...courseStructure, modules: newModulesMap, rootModule: updatedRoot };
            setCourseStructure(newStructure);
            saveDraft(newStructure);
            setSelectedModuleId(courseStructure.rootModule.id);
            setIsIntroModuleForm(true);
        }
    }, [allModules, courseStructure, saveDraft]);

    const handleModuleAction = (action, moduleId) => {
        if (action === 'add') handleAddModule(moduleId);
        if (action === 'delete') handleDeleteModule(moduleId);
    };

    const handleModuleFormChange = (field, value) => {
        if (validationErrors[field] || (field === 'title' && validationErrors.moduleTitle)) {
            setValidationErrors(prev => {
                const n = { ...prev };
                delete n[field];
                if (field === 'title') delete n.moduleTitle;
                return n;
            });
        }
        setCourseStructure(prev => {
            const isRoot = selectedModuleId === prev.rootModule.id;
            const current = isRoot ? prev.rootModule : prev.modules[selectedModuleId];
            if (!current) return prev;
            const newModuleData = { ...current, [field]: value };
            const nextState = isRoot 
                ? { ...prev, rootModule: newModuleData } 
                : { ...prev, modules: { ...prev.modules, [selectedModuleId]: newModuleData } };
            saveDraft(nextState);
            return nextState;
        });
    };

    const handleCourseMetaChange = (field, value) => {
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const n = { ...prev };
                delete n[field];
                return n;
            });
        }
        setCourseStructure(prev => {
             const nextState = { ...prev, [field]: value };
             saveDraft(nextState);
             return nextState;
        });
    };

    const handleImageSelect = (file) => {
        setSelectedImageFile(file);
        const preview = URL.createObjectURL(file);
        // setImagePreviewUrl(preview);
    };

    const uploadImageToServer = async (file) => {
        const fd = new FormData();
        fd.append("image", file);
        // const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
        const API_BASE = "http://localhost:5000";
        const res = await fetch(`${API_BASE}/api/courses/upload-image`, {
            method: "POST",
            body: fd,
            credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");
        return data.imageUrl;
    };

    const validateEntireCourse = () => {
        const errors = {};
        if (!courseStructure.courseTitle.trim()) errors.courseTitle = "Course Title is required.";
        if (!courseStructure.subject.trim()) errors.subject = "Subject is required.";
        if (!selectedModule.title.trim()) errors.moduleTitle = "Module Title is required.";
        if (selectedModule.type === 'video') {
            if (!selectedModule.videoLink || !URL_REGEX.test(selectedModule.videoLink)) errors.videoLink = "A valid Video URL is required.";
        }
        if (selectedModule.type === 'quiz') {
            if (!selectedModule.quizData?.questions?.length) errors.quizData = "Quiz must have at least one question.";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePublishCourse = async () => {
        if (!validateEntireCourse()) {
            alert("Please fix the errors highlighted in red before publishing.");
            return;
        }
        
        const isEditing = !!courseId;
        const actionText = isEditing ? "Update" : "Publish";

        if (window.confirm(`${actionText} this course?`)) {
            setIsSaving(true);
            try {
                const payload = {
                    courseTitle: courseStructure.courseTitle,
                    courseDescription: courseStructure.courseDescription,
                    subject: courseStructure.subject,
                    price: Number(courseStructure.price),
                    duration: Number(courseStructure.duration),
                    rootModule: courseStructure.rootModule,
                    modules: courseStructure.modules,
                    imageUrl: courseStructure.imageUrl
                };

                if (selectedImageFile) {
                    try {
                        payload.imageUrl = await uploadImageToServer(selectedImageFile);
                        setImagePreviewUrl(payload.imageUrl);
                    } catch (upErr) {
                        alert("Image upload failed: " + upErr.message);
                        setIsSaving(false);
                        return;
                    }
                }
                
                let result;
                if (isEditing) {
                    result = await dispatch(updateCourse({ id: courseId, data: payload }));
                } else {
                    result = await dispatch(createNewCourse(payload));
                    if (createNewCourse.fulfilled.match(result)) localStorage.removeItem(COURSE_DATA_PATH);
                }

                if (result.meta.requestStatus === 'fulfilled') {
                    alert(`Course ${actionText.toLowerCase()}ed successfully!`);
                    navigate('/instructor-dashboard');
                } else {
                    alert(`${actionText} failed: ${result.payload}`);
                }
            } catch (e) {
                console.error(e);
                alert(`An error occurred.`);
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    if (courseId && isLoadingCourse) {
         return (
            <div className="loading-state-full">
                <Loader2 className="animate-spin" size={32} /> Loading course for editing...
            </div>
         );
    }

    return (
        <div className="course-editor-app">
            <div className="module-tree-sidebar">
                <div className="editor-header">
                    <h2>Course Builder</h2>
                    <Settings size={18} className="icon-btn" onClick={() => handleSelectModule(courseStructure.rootModule.id)} />
                </div>
                
                <div className="save-course-bar">
                    <div className="input-group">
                        <label className="image-upload-label">Course Thumbnail</label>
                        <div className="image-upload-row">
                            <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e.target.files[0])} />
                            {imagePreviewUrl && <img src={imagePreviewUrl} alt="preview" className="image-preview-small" />}
                        </div>
                    </div>

                    <div className="input-group">
                        <input 
                            type="text" 
                            className={`sidebar-input ${validationErrors.courseTitle ? 'input-error' : ''}`}
                            placeholder="Course Title *"
                            value={courseStructure.courseTitle}
                            onChange={(e) => handleCourseMetaChange('courseTitle', e.target.value)}
                        />
                        {validationErrors.courseTitle && <span className="error-tooltip">{validationErrors.courseTitle}</span>}
                    </div>

                    <div className="input-group">
                         <input 
                            type="text" 
                            className={`sidebar-input ${validationErrors.subject ? 'input-error' : ''}`}
                            placeholder="Subject *"
                            value={courseStructure.subject}
                            onChange={(e) => handleCourseMetaChange('subject', e.target.value)}
                        />
                        {validationErrors.subject && <span className="error-tooltip">{validationErrors.subject}</span>}
                    </div>

                    <button onClick={handlePublishCourse} disabled={isSaving} className="btn-publish-course">
                        <Save size={16} /> {courseId ? 'Update Course' : 'Publish Course'}
                    </button>
                </div>

                <div className="tree-container">
                    <ul className="module-tree-list">
                        <ModuleTreeItem 
                            modules={allModules} 
                            moduleId={courseStructure.rootModule.id}
                            onSelect={handleSelectModule}
                            onAction={handleModuleAction}
                            selectedId={selectedModuleId}
                            rootId={courseStructure.rootModule.id}
                        />
                    </ul>
                </div>
            </div>

            <div className="module-editor-content">
                <div className="module-editor-card">
                    <div className="card-header">
                        <h2>{isIntroModuleForm ? 'Course Settings' : 'Edit Module'}</h2>
                        <span className="module-id-badge">ID: {selectedModule.title}</span>
                    </div>
                    
                    <div className="form-field">
                        <label>Title <span className="required-star">*</span></label>
                        <input 
                            type="text"
                            className={validationErrors.moduleTitle ? 'input-error' : ''}
                            value={selectedModule.title}
                            onChange={(e) => handleModuleFormChange('title', e.target.value)}
                        />
                        {validationErrors.moduleTitle && (
                            <span className="error-text"><AlertCircle size={12}/> {validationErrors.moduleTitle}</span>
                        )}
                    </div>

                    {!isIntroModuleForm ? (
                        <>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Type</label>
                                    <select 
                                        value={selectedModule.type}
                                        onChange={(e) => {
                                            handleModuleFormChange('type', e.target.value);
                                            const def = createNewModule(e.target.value);
                                            handleModuleFormChange('text', def.text);
                                            handleModuleFormChange('videoLink', def.videoLink);
                                            if (e.target.value === 'quiz') handleModuleFormChange('quizData', { questions: [] });
                                        }}
                                    >
                                        <option value="text">Text Lesson</option>
                                        <option value="video">Video Lesson</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Description</label>
                                    <input 
                                        type="text"
                                        value={selectedModule.description}
                                        onChange={(e) => handleModuleFormChange('description', e.target.value)}
                                        placeholder="Short summary..."
                                    />
                                </div>
                            </div>

                            {selectedModule.type === 'text' && (
                                <div className="form-field">
                                    <label>Content</label>
                                    <textarea rows="12" value={selectedModule.text} onChange={(e) => handleModuleFormChange('text', e.target.value)} />
                                </div>
                            )}

                            {selectedModule.type === 'video' && (
                                <div className="form-field">
                                    <label>Video Embed URL <span className="required-star">*</span></label>
                                    <input 
                                        type="url"
                                        className={validationErrors.videoLink ? 'input-error' : ''}
                                        value={selectedModule.videoLink}
                                        onChange={(e) => handleModuleFormChange('videoLink', e.target.value)}
                                        placeholder="https://www.youtube.com/embed/..."
                                    />
                                </div>
                            )}

                            {selectedModule.type === 'quiz' && (
                                <div className="form-field">
                                    <QuizBuilder quizData={selectedModule.quizData || { questions: [] }} onChange={(newData) => handleModuleFormChange('quizData', newData)} />
                                    {validationErrors.quizData && <div className="error-banner"><AlertCircle size={14}/> {validationErrors.quizData}</div>}
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="form-grid">
                            <div className="form-field">
                                <label>Course Price (USD)</label>
                                <input type="number" min="0" step="0.01" value={courseStructure.price} onChange={(e) => handleCourseMetaChange('price', e.target.value)} />
                            </div>
                            <div className="form-field">
                                <label>Course Duration (Minutes)</label>
                                <input type="number" min="0" value={courseStructure.duration} onChange={(e) => handleCourseMetaChange('duration', e.target.value)} />
                            </div>
                            <div className="form-field" style={{ gridColumn: 'span 2' }}>
                                <label>Course Description</label>
                                <textarea rows="6" value={courseStructure.courseDescription} onChange={(e) => handleCourseMetaChange('courseDescription', e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div className="editor-footer">
                        <button className="btn-add-child" onClick={() => handleAddModule(selectedModuleId)}><Plus size={16} /> Add Sub-Module</button>
                        {!isIntroModuleForm && <button className="btn-delete-module" onClick={() => handleDeleteModule(selectedModuleId)}><Trash2 size={16} /> Delete</button>}
                        <div className="autosave-status">
                            <Clock size={14} />
                            <span>{isSaving ? 'Saving...' : `Draft saved: ${lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Just now'}`}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEditor;