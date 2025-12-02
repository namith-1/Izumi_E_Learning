import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../services/studentApi';

import './StudentCourseView.css';

const StudentCourseView = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { student } = useSelector(state => state.studentAuth);
    
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [currentModule, setCurrentModule] = useState(null);
    const [completedModules, setCompletedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompleted, setShowCompleted] = useState(true);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    
    // Quiz State
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);

    useEffect(() => {
        if (!student) {
            navigate('/student/login');
            return;
        }
        fetchCourseData();
        fetchCompletedModules();
    }, [courseId, student]);

    useEffect(() => {
        if (currentModule) {
            fetchComments(currentModule.id);
            // Reset quiz state
            setQuizAnswers({});
            setQuizResult(null);
        }
    }, [currentModule]);

    const fetchCourseData = async () => {
        try {
            // Using the endpoint that returns the module tree
            const data = await apiClient.get(`/course/${courseId}`);
            setCourse(data);
            setModules(data.modules || []);
            
            // Select first module by default if available
            if (data.modules && data.modules.length > 0) {
                setCurrentModule(data.modules[0]);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching course content:", error);
            setLoading(false);
        }
    };

    const fetchCompletedModules = async () => {
        if (!student) return;
        try {
            const studentId = student._id || student.id;
            const data = await apiClient.get(`/completed_modules?studentId=${studentId}&courseId=${courseId}`);
            
            let ids = [];
            if (Array.isArray(data) && data.length > 0) {
                if (typeof data[0] === 'object' && data[0].module_id) {
                    ids = data.map(c => String(c.module_id));
                } else {
                    ids = data.map(c => String(c));
                }
            }
            setCompletedModules(ids);
        } catch (error) {
            console.error("Error fetching completed modules:", error);
        }
    };

    const fetchComments = async (moduleId) => {
        try {
            const data = await apiClient.get(`/comments/${moduleId}`);
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            setComments([]);
        }
    };

    const handleMarkComplete = async () => {
        if (!currentModule || !student) return;
        
        const studentId = student._id || student.id;
        try {
            await apiClient.put('/module_complete', {
                moduleId: currentModule.id,
                studentId: studentId
            });
            
            // Update local state
            setCompletedModules(prev => [...prev, String(currentModule.id)]);
            alert("Module marked as complete!");
        } catch (error) {
            console.error("Error marking module complete:", error);
            alert("Failed to mark complete.");
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !currentModule) return;
        
        try {
            await apiClient.post('/comments', {
                module_id: currentModule.id,
                content: newComment
            });
            setNewComment('');
            fetchComments(currentModule.id);
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const handleQuizSubmit = async () => {
        if (!currentModule || !currentModule.quizData) return;
        
        let score = 0;
        const total = currentModule.quizData.questions.length;
        
        currentModule.quizData.questions.forEach((q, i) => {
            if (quizAnswers[i] === q.answer) {
                score++;
            }
        });
        
        const percentage = (score / total) * 100;
        const passed = percentage >= 75;
        setQuizResult({ score, total, percentage, passed });
        
        // Save progress
        const studentId = student._id || student.id;
        try {
            await apiClient.post(`/progress/${courseId}`, {
                moduleId: currentModule.id,
                studentId: studentId,
                completed: false, // Don't auto-complete, let user click "Mark as Complete"
                quizScore: percentage
            });
            
            // Don't auto-add to completedModules here - wait for explicit "Mark as Complete" click
        } catch (error) {
            console.error("Error saving quiz progress:", error);
        }
    };
    
    const handleQuizRetry = () => {
        setQuizAnswers({});
        setQuizResult(null);
    };
    
    const handleMarkCompleteAfterPass = async () => {
        if (!quizResult || !quizResult.passed) return;
        
        const studentId = student._id || student.id;
        try {
            await apiClient.put('/module_complete', {
                moduleId: currentModule.id,
                studentId: studentId
            });
            setCompletedModules(prev => [...prev, String(currentModule.id)]);
            alert("Module marked as complete!");
        } catch (error) {
            console.error("Error marking module complete:", error);
            alert("Failed to mark complete.");
        }
    };

    const renderQuiz = (module) => {
        if (!module.quizData || !module.quizData.questions) return <p>No questions in this quiz.</p>;
        
        return (
            <div className="quiz-container">
                {module.quizData.questions.map((q, i) => (
                    <div key={i} className="quiz-question">
                        <p><strong>{i + 1}. {q.question}</strong></p>
                        <div className="quiz-options">
                            {q.options.map((opt, oIndex) => (
                                <label key={oIndex} className="quiz-option">
                                    <input 
                                        type="radio" 
                                        name={`q-${i}`} 
                                        value={opt}
                                        checked={quizAnswers[i] === opt}
                                        onChange={() => setQuizAnswers(prev => ({ ...prev, [i]: opt }))}
                                        disabled={quizResult !== null}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                        {quizResult && (
                            <div className="quiz-feedback">
                                {quizAnswers[i] === q.answer ? (
                                    <span className="correct" style={{color: 'green'}}>Correct!</span>
                                ) : (
                                    <span className="incorrect" style={{color: 'red'}}>Incorrect. Answer: {q.answer}</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                
                {!quizResult ? (
                    <button onClick={handleQuizSubmit} className="btn-submit-quiz" style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Submit Quiz</button>
                ) : (
                    <div className="quiz-result" style={{marginTop: '20px', padding: '15px', backgroundColor: quizResult.passed ? '#e8f5e9' : '#ffebee', borderRadius: '5px'}}>
                        <h3 style={{color: quizResult.passed ? '#2e7d32' : '#c62828'}}>
                            You scored {quizResult.score} / {quizResult.total} ({quizResult.percentage.toFixed(0)}%)
                        </h3>
                        {quizResult.passed ? (
                            <div>
                                <p style={{color: '#2e7d32', fontWeight: 'bold'}}>🎉 Congratulations! You passed!</p>
                                {!completedModules.includes(String(currentModule.id)) ? (
                                    <button 
                                        onClick={handleMarkCompleteAfterPass}
                                        style={{marginTop: '10px', padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                                    >
                                        Mark as Complete
                                    </button>
                                ) : (
                                    <div style={{marginTop: '10px', padding: '10px', color: '#2e7d32', fontWeight: 'bold'}}>
                                        ✅ Module Completed!
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p style={{color: '#c62828', fontWeight: 'bold'}}>❌ You need 75% or higher to pass. Please try again!</p>
                                <button 
                                    onClick={handleQuizRetry}
                                    style={{marginTop: '10px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderModuleList = (mods) => {
        return mods.map(mod => {
            const isCompleted = completedModules.includes(String(mod.id));
            if (!showCompleted && isCompleted) return null;

            return (
                <div key={mod.id} className="module-item-container">
                    <div 
                        className={`module-item ${currentModule?.id === mod.id ? 'active' : ''}`}
                        onClick={() => setCurrentModule(mod)}
                    >
                        <span className="module-title">{mod.title}</span>
                        {isCompleted && <span className="completed-tick">✓</span>}
                    </div>
                    {mod.subModules && mod.subModules.length > 0 && (
                        <div className="submodules">
                            {renderModuleList(mod.subModules)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const renderResource = (url) => {
        if (!url) return null;
        
        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
        
        if (isVideo) {
            return (
                <div className="video-player-container">
                    <video controls controlsList="nodownload" className="video-player">
                        <source src={url} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        } else {
            return (
                <div className="iframe-container">
                    <iframe 
                        src={url} 
                        title="Course Content"
                        width="100%" 
                        height="500px" 
                        frameBorder="0"
                        allowFullScreen
                    ></iframe>
                </div>
            );
        }
    };

    if (loading) return <div className="loading">Loading course content...</div>;

    return (
        <div className="student-course-view">
           
            <div className="course-view-container">
                <div className="sidebar">
                    <h3>Course Modules</h3>
                    <div className="toggle-container">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={showCompleted} 
                                onChange={(e) => setShowCompleted(e.target.checked)} 
                            />
                            Show completed modules
                        </label>
                    </div>
                    <div className="module-list">
                        {renderModuleList(modules)}
                    </div>
                </div>

                <div className="main-content">
                    {currentModule ? (
                        <>
                            <div className="module-header">
                                <h2>{currentModule.title}</h2>
                                {currentModule.type !== 'quiz' && (
                                    !completedModules.includes(String(currentModule.id)) ? (
                                        <button onClick={handleMarkComplete} className="btn-mark-complete">
                                            Mark as Complete
                                        </button>
                                    ) : (
                                        <span className="status-completed">Completed ✓</span>
                                    )
                                )}
                            </div>
                            
                            {currentModule.type === 'quiz' ? (
                                renderQuiz(currentModule)
                            ) : (
                                <>
                                    <div className="module-text" dangerouslySetInnerHTML={{ __html: currentModule.text }}></div>
                                    <div className="module-resource">
                                        {renderResource(currentModule.url)}
                                    </div>
                                </>
                            )}

                            <div className="comments-section">
                                <h3>Discussion</h3>
                                <div className="comment-form">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Share your thoughts or ask a question..."
                                        rows="3"
                                    />
                                    <button onClick={handlePostComment} className="btn-post-comment">
                                        Post Comment
                                    </button>
                                </div>
                                <div className="comments-list">
                                    {comments.length === 0 ? (
                                        <p>No comments yet.</p>
                                    ) : (
                                        comments.map((c, i) => (
                                            <div key={i} className="comment-item">
                                                <div className="comment-header">
                                                    <span className="comment-author">{c.name}</span>
                                                    <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="comment-body">{c.content}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-module-selected">
                            <h2>Select a module to start learning</h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentCourseView;
