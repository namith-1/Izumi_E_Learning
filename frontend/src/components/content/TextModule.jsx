import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import { marked } from 'marked';

const TextModule = ({ module, onComplete, isCompleted, isProcessing }) => {
    // Handler must use the provided onComplete function to update enrollment status
    const handleComplete = () => {
        // Text modules are marked complete simply by confirming review
        onComplete(module.id, { completed: true });
    };

    return (
        <div className="content-module-card">
            <h3 className="module-content-header"><FileText size={20} /> {module.title}</h3>
            
            <div className="text-content-area">
                {module.description && <p className="description-text">{module.description}</p>}
                <div 
                    className="lesson-markdown markdown-content"
                    style={{ wordBreak: "break-word", lineHeight: "1.7", color: "#374151" }}
                    dangerouslySetInnerHTML={{ 
                        __html: marked.parse(module.text || (module.type === 'intro' ? 'Welcome to the course! Use the navigation on the left to explore the modules.' : 'No content available for this module.')) 
                    }} 
                />
            </div>
            
            <div className="module-action-footer">
                <p className="completion-rule">Rule: Text modules are completed by manually confirming review.</p>
                <button 
                    onClick={handleComplete}
                    disabled={isCompleted || isProcessing}
                    className={`btn-complete-module ${isCompleted ? 'completed' : ''}`}
                >
                    <CheckCircle size={18} /> 
                    {isCompleted ? 'Completed' : (isProcessing ? 'Saving...' : 'Mark as Complete')}
                </button>
            </div>
        </div>
    );
};

export default TextModule;