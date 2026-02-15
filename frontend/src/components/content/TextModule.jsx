import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';

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
                <p className="description-text">{module.description}</p>
                <div 
                    className="lesson-markdown"
                    // In a real application, you would use a markdown parser here:
                    dangerouslySetInnerHTML={{ __html: module.text }} 
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