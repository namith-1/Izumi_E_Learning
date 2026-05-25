import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, AlertTriangle, Send, Loader2, CheckCircle, Clock } from 'lucide-react';

const QuizModule = ({ module, enrollmentStatus, onScoreSubmit, isCompleted, isProcessing }) => {
    // Score rule: Completion requires >= 35%
    const PASS_THRESHOLD = 35; 
    const timeLimitMinutes = module.quizData?.timeLimit || 5; // Default 5 minutes
    const timeLimitSeconds = timeLimitMinutes * 60;
    
    const lastScore = enrollmentStatus?.quizScore;
    const questions = module.quizData?.questions || [];
    
    // State to hold the user's selected answers (key: questionId, value: selectedOptionId)
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
    const [quizActive, setQuizActive] = useState(false);
    const [quizStarted, setQuizStarted] = useState(isCompleted); // Start true if already completed
    const timerRef = useRef(null);
    
    // Derived state
    const answersCount = Object.keys(selectedAnswers).length;
    const isReadyToSubmit = quizStarted && answersCount === questions.length && quizActive;
    const isTimeUp = timeLeft <= 0;
    const showRetake = !isCompleted && lastScore !== undefined && !quizActive;

    // Reset component state when module or completion status changes
    useEffect(() => {
        clearInterval(timerRef.current);
        setQuizStarted(isCompleted);
        setQuizActive(false);
        setTimeLeft(timeLimitSeconds);
        setSelectedAnswers({});
    }, [module.id, isCompleted, timeLimitSeconds]);
    
    // Cleanup timer on unmount
    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);
    
    // --- Timer Management ---
    const startTimer = () => {
        if (isCompleted || quizActive) return; 
        
        setSelectedAnswers({});
        
        setQuizStarted(true);
        setQuizActive(true);
        setTimeLeft(timeLimitSeconds);
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmitQuiz(true); // Auto-submit on time up
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    };

    // --- Handlers ---
    
    const handleAnswerSelect = (questionId, optionId) => {
        if (!quizActive) return;
        
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmitQuiz = (timedOut = false) => {
        if (isProcessing || isCompleted) return;
        if (!isReadyToSubmit && !timedOut) return;
        
        clearInterval(timerRef.current);
        setQuizActive(false);

        let correctCount = 0;
        
        questions.forEach(q => {
            const selectedOptionId = selectedAnswers[q.id];
            const correctOption = q.options.find(o => o.isCorrect);

            if (correctOption && correctOption.id === selectedOptionId) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= PASS_THRESHOLD;

        // FIX: Manually set quizStarted to false to transition back to the Start/Retake screen
        setQuizStarted(false); 
        
        // Send score and completion status
        onScoreSubmit(module.id, { 
            quizScore: score, 
            completed: passed,
            timeSpent: (enrollmentStatus?.timeSpent || 0) + 1 
        });
    };
    
    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    // --- Render Logic ---

    // Case 1: Start Screen or Completed Screen
    // This includes the screen shown after a failed attempt (when quizStarted is false)
    if (!quizStarted || isCompleted) {
        return (
            <div className="content-module-card text-center py-10">
                <h3 className="module-content-header justify-center"><CheckSquare size={24} /> {module.title}</h3>
                <p className="description-text">
                    Time Limit: **{timeLimitMinutes} minutes**. You must score {PASS_THRESHOLD}% or higher to pass.
                </p>
                
                {isCompleted && (
                    <div className="quiz-status-box justify-center mx-auto my-4 w-fit">
                         <CheckCircle size={18} className="text-green-600"/> 
                         <span className="text-green-600 font-bold">Quiz Passed! Final Score: {lastScore}%</span>
                    </div>
                )}
                
                {showRetake && (
                     <div className="quiz-status-box justify-center mx-auto my-4 w-fit">
                        <AlertTriangle size={18} className="text-red-500"/> 
                        <span className="text-red-500 font-bold">Last attempt: {lastScore}% (Failed)</span>
                    </div>
                )}

                <button 
                    onClick={startTimer}
                    disabled={isCompleted} 
                    className={`btn-start-learning mx-auto mt-4 ${isCompleted ? 'completed' : ''}`}
                >
                    {isCompleted ? <CheckCircle size={18} /> : (showRetake ? 'Retake Quiz' : 'Start Quiz')}
                </button>
            </div>
        );
    }

    // Case 2: Active Quiz Session
    return (
        <div className="content-module-card">
            <h3 className="module-content-header"><CheckSquare size={20} /> {module.title}</h3>
            
            {/* Timer Display */}
            <div className={`timer-box ${isTimeUp || timeLeft <= 30 ? 'text-red-600' : 'text-gray-700'}`}>
                <Clock size={20} /> 
                <span className="font-bold text-xl">{formatTime(timeLeft)}</span>
                {(isTimeUp || !quizActive) && <span className="text-sm ml-2 font-medium">TIME {isTimeUp ? 'UP' : 'ENDED'}!</span>}
            </div>

            {/* Quiz Content */}
            <div className="quiz-questions-list">
                {questions.length === 0 ? (
                    <div className="text-gray-500 bg-gray-100 p-4 rounded-lg">No questions defined for this quiz.</div>
                ) : (
                    questions.map((q, qIndex) => (
                        <div key={q.id} className="question-item">
                            <p className="question-text">Q{qIndex + 1}: {q.text}</p>
                            <div className="options-group">
                                {q.options.map(o => (
                                    <div 
                                        key={o.id} 
                                        className={`option-choice ${selectedAnswers[q.id] === o.id ? 'selected' : ''} ${!quizActive ? 'disabled-choice' : ''}`}
                                        onClick={() => handleAnswerSelect(q.id, o.id)}
                                    >
                                        <input 
                                            type="radio" 
                                            name={`q_${q.id}`}
                                            checked={selectedAnswers[q.id] === o.id}
                                            onChange={() => handleAnswerSelect(q.id, o.id)}
                                            disabled={!quizActive}
                                        />
                                        <span>{o.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Status Box */}
            <div className="quiz-status-box">
                <p className="text-gray-500">
                    Status: {isTimeUp ? 'Time Up' : 'In Progress'}. Selected {answersCount} of {questions.length} required.
                </p>
            </div>
            
            {/* Action Footer */}
            <div className="module-action-footer">
                <p className="completion-rule">Rule: Quiz is complete if score is {PASS_THRESHOLD}% or higher.</p>
                <button 
                    onClick={() => handleSubmitQuiz(false)}
                    disabled={isProcessing || !isReadyToSubmit || !quizActive}
                    className={`btn-complete-module ${isReadyToSubmit ? '' : 'disabled-btn'}`}
                >
                    {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Submit Quiz</>}
                </button>
            </div>
        </div>
    );
};

export default QuizModule;