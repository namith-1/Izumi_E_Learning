import React, { useState, useEffect } from 'react';
import * as studentApi from '../../services/studentApi';
import './Gamification.css';

const Gamification = () => {
    const [goals, setGoals] = useState([]);
    const [completedGoals, setCompletedGoals] = useState([]);
    const [consistencyDates, setConsistencyDates] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Form State
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDesc, setNewGoalDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchGoals();
        fetchConsistency();
    }, []);

    const fetchGoals = async () => {
        try {
            const allGoals = await studentApi.getGoals();
            // Handle both array and wrapped response if any
            const data = Array.isArray(allGoals) ? allGoals : [];
            setGoals(data.filter(g => !g.completed));
            setCompletedGoals(data.filter(g => g.completed));
        } catch (error) {
            console.error("Error fetching goals:", error);
        }
    };

    const fetchConsistency = async () => {
        try {
            const data = await studentApi.getConsistency();
            if (Array.isArray(data)) {
                setConsistencyDates(data.map(d => new Date(d.date).toDateString()));
            }
        } catch (error) {
            console.error("Error fetching consistency:", error);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;

        setIsSubmitting(true);
        try {
            await studentApi.createGoal({
                name: newGoalTitle,
                description: newGoalDesc
            });
            setNewGoalTitle('');
            setNewGoalDesc('');
            fetchGoals();
        } catch (error) {
            console.error("Error creating goal:", error);
            alert("Failed to create goal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const markGoalComplete = async (id) => {
        try {
            await studentApi.updateGoal(id, { completed: true });
            fetchGoals();
        } catch (error) {
            console.error("Error completing goal:", error);
            alert("Failed to update goal.");
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm("Are you sure you want to delete this goal?")) return;
        try {
            await studentApi.deleteGoal(id);
            fetchGoals();
        } catch (error) {
            console.error("Error deleting goal:", error);
        }
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Day headers
        dayNames.forEach(day => {
            days.push(<div key={`header-${day}`} className="calendar-day-name">{day}</div>);
        });

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toDateString();
            const isActive = consistencyDates.includes(dateStr);
            days.push(
                <div key={i} className={`calendar-day ${isActive ? 'active' : ''}`}>
                    {i}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="gamification-page">
            <h1>Student Goals & Consistency</h1>
            
            <div className="main-container">
                <div className="goals-section">
                    {/* Add Goal Form */}
                    <div className="add-goal-container">
                        <h2>Set a New Goal</h2>
                        <form onSubmit={handleAddGoal} className="add-goal-form">
                            <input 
                                type="text" 
                                placeholder="Goal Title (e.g., Finish Module 1)" 
                                value={newGoalTitle}
                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Description (optional)" 
                                value={newGoalDesc}
                                onChange={(e) => setNewGoalDesc(e.target.value)}
                            />
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : 'Add Goal'}
                            </button>
                        </form>
                    </div>

                    <div className="pending-goals-container">
                        <h2>Pending Goals</h2>
                        {goals.length === 0 ? <p className="no-goals-msg">No pending goals. Set one above!</p> : (
                            goals.map(goal => (
                                <div key={goal._id || goal.id} className="goal-item">
                                    <div className="goal-content">
                                        <h4>{goal.name || goal.title}</h4>
                                        <p>{goal.description}</p>
                                    </div>
                                    <div className="goal-actions">
                                        <button 
                                            className="btn-complete" 
                                            onClick={() => markGoalComplete(goal._id || goal.id)}
                                            title="Mark as Done"
                                        >
                                            <i className="fas fa-check"></i> Done
                                        </button>
                                        <button 
                                            className="btn-delete" 
                                            onClick={() => handleDeleteGoal(goal._id || goal.id)}
                                            title="Delete Goal"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="completed-goals-container">
                        <h2>Completed Goals</h2>
                        {completedGoals.length === 0 ? <p className="no-goals-msg">No completed goals yet.</p> : (
                            completedGoals.map(goal => (
                                <div key={goal._id || goal.id} className="goal-item completed">
                                    <div className="goal-content">
                                        <h4>{goal.name || goal.title}</h4>
                                        <p>Completed</p>
                                    </div>
                                    <button 
                                        className="btn-delete" 
                                        onClick={() => handleDeleteGoal(goal._id || goal.id)}
                                        title="Delete Goal"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="calendar-section">
                    <div className="calendar-container">
                        <div className="calendar-header">
                            <h2>Consistency Calendar</h2>
                            <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="calendar-grid">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gamification;
