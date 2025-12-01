import React from 'react';
import { Plus, Clock } from 'lucide-react';
import { createNewModule, QUIZ_API_PATH } from './CourseEditorUtils';

const ModuleForm = ({ 
    selectedModule, 
    isIntro, 
    courseMeta, 
    onModuleChange, 
    onCourseMetaChange, 
    onAddChild, 
    isSaving, 
    lastSaved 
}) => {
    
    // --- Render Helpers ---
    const renderSpecificFields = () => {
        if (isIntro) {
            return (
                <div className="form-field">
                    <label>Course Description</label>
                    <textarea 
                        rows="6"
                        value={courseMeta.description}
                        onChange={(e) => onCourseMetaChange('courseDescription', e.target.value)}
                        placeholder="Describe what students will learn..."
                    />
                </div>
            );
        }

        return (
            <>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Type</label>
                        <select 
                            value={selectedModule.type}
                            onChange={(e) => {
                                onModuleChange('type', e.target.value);
                                // Reset defaults based on new type
                                const def = createNewModule(e.target.value);
                                onModuleChange('text', def.text);
                                onModuleChange('videoLink', def.videoLink);
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
                            onChange={(e) => onModuleChange('description', e.target.value)}
                            placeholder="Short summary..."
                        />
                    </div>
                </div>

                {selectedModule.type === 'text' && (
                    <div className="form-field">
                        <label>Content</label>
                        <textarea 
                            rows="12"
                            value={selectedModule.text}
                            onChange={(e) => onModuleChange('text', e.target.value)}
                        />
                    </div>
                )}

                {selectedModule.type === 'video' && (
                    <div className="form-field">
                        <label>Video Embed URL</label>
                        <input 
                            type="url"
                            value={selectedModule.videoLink}
                            onChange={(e) => onModuleChange('videoLink', e.target.value)}
                            placeholder="https://www.youtube.com/embed/..."
                        />
                    </div>
                )}

                {selectedModule.type === 'quiz' && (
                    <div className="form-field">
                         <label>Quiz URL</label>
                         <input 
                            type="text"
                            value={selectedModule.quizUrl || QUIZ_API_PATH}
                            readOnly
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Quiz content is managed externally.</p>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="module-editor-card">
            <div className="card-header">
                <h2>{isIntro ? 'Course Settings' : 'Edit Module'}</h2>
                <span className="module-id-badge">ID: {selectedModule.title}</span>
            </div>
            
            <div className="form-field">
                <label>Title</label>
                <input 
                    type="text"
                    value={selectedModule.title}
                    onChange={(e) => onModuleChange('title', e.target.value)}
                />
            </div>

            {renderSpecificFields()}

            <div className="editor-footer">
                <button className="btn-add-child" onClick={onAddChild}>
                    <Plus size={16} /> Add Sub-Module
                </button>
                    
                <div className="autosave-status">
                    <Clock size={14} />
                    <span>{isSaving ? 'Saving...' : `Draft saved: ${lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Just now'}`}</span>
                </div>
            </div>
        </div>
    );
};

export default ModuleForm;