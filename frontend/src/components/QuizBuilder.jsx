import React from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import './css/QuizBuilder.css';

const QuizBuilder = ({ quizData, onChange }) => {
    // Structure: { timeLimit: number, questions: [...] }
    // Ensure defaults
    const data = {
        timeLimit: quizData.timeLimit || 0,
        questions: quizData.questions || []
    };

    const handleTimeLimitChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        onChange({ ...data, timeLimit: val });
    };

    const addQuestion = () => {
        const newQ = {
            id: Date.now(),
            text: "",
            options: [
                { id: Date.now() + 1, text: "", isCorrect: false },
                { id: Date.now() + 2, text: "", isCorrect: false }
            ]
        };
        onChange({ ...data, questions: [...data.questions, newQ] });
    };

    const updateQuestionText = (qId, text) => {
        const updated = data.questions.map(q => q.id === qId ? { ...q, text } : q);
        onChange({ ...data, questions: updated });
    };

    const deleteQuestion = (qId) => {
        const updated = data.questions.filter(q => q.id !== qId);
        onChange({ ...data, questions: updated });
    };

    const addOption = (qId) => {
        const updated = data.questions.map(q => {
            if (q.id === qId) {
                return { ...q, options: [...q.options, { id: Date.now(), text: "", isCorrect: false }] };
            }
            return q;
        });
        onChange({ ...data, questions: updated });
    };

    const updateOptionText = (qId, optId, text) => {
        const updated = data.questions.map(q => {
            if (q.id === qId) {
                const newOpts = q.options.map(o => o.id === optId ? { ...o, text } : o);
                return { ...q, options: newOpts };
            }
            return q;
        });
        onChange({ ...data, questions: updated });
    };

    const toggleCorrectOption = (qId, optId) => {
        const updated = data.questions.map(q => {
            if (q.id === qId) {
                // Radio button logic: only one correct answer per question
                const newOpts = q.options.map(o => ({
                    ...o,
                    isCorrect: o.id === optId ? !o.isCorrect : false 
                }));
                return { ...q, options: newOpts };
            }
            return q;
        });
        onChange({ ...data, questions: updated });
    };

    const deleteOption = (qId, optId) => {
        const updated = data.questions.map(q => {
            if (q.id === qId) {
                return { ...q, options: q.options.filter(o => o.id !== optId) };
            }
            return q;
        });
        onChange({ ...data, questions: updated });
    };

    return (
        <div className="quiz-builder-container">
            {/* Header / Global Settings */}
            <div className="quiz-global-settings">
                <div className="setting-item">
                    <Clock size={16} className="text-gray-500" />
                    <label>Total Time Limit (mins):</label>
                    <input 
                        type="number" 
                        min="0" 
                        value={data.timeLimit} 
                        onChange={handleTimeLimitChange}
                        className="time-input"
                         required={true}
                    />
                </div>
            </div>

            {/* Questions List */}
            <div className="questions-stack">
                {data.questions.map((q, qIndex) => (
                    <div key={q.id} className="question-block">
                        <div className="question-header">
                            <span className="q-number">Q{qIndex + 1}</span>
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    className="question-text-input"
                                    placeholder="Type your question here..." 
                                    value={q.text}
                                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                                     required={true}
                                />
                            </div>
                            <button onClick={() => deleteQuestion(q.id)} className="btn-icon-delete">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="options-container">
                            {q.options.map((opt) => (
                                <div key={opt.id} className={`option-row ${opt.isCorrect ? 'correct-highlight' : ''}`}>
                                    <button 
                                        className={`btn-check ${opt.isCorrect ? 'active' : ''}`}
                                        onClick={() => toggleCorrectOption(q.id, opt.id)}
                                        title={opt.isCorrect ? "Correct Answer" : "Mark as Correct"}
                                    >
                                        {opt.isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                    </button>
                                    
                                    <input 
                                        type="text" 
                                        className="option-text-input"
                                        placeholder="Option text..."
                                        value={opt.text}
                                        onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                                         required={true}
                                    />
                                    
                                    <button onClick={() => deleteOption(q.id, opt.id)} className="btn-icon-delete-small">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            <button onClick={() => addOption(q.id)} className="btn-add-option">
                                <Plus size={14} /> Add Option
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={addQuestion} className="btn-add-question-block">
                <Plus size={18} /> Add New Question
            </button>
        </div>
    );
};

export default QuizBuilder;