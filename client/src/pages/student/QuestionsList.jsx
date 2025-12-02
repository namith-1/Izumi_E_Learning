import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchQuestions } from '../../redux/slices/studentSlice';
import './QuestionsList.css';

const QuestionsList = () => {
    const dispatch = useDispatch();
    const { questions, loading } = useSelector(state => state.student);

    useEffect(() => {
        dispatch(fetchQuestions());
    }, [dispatch]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="questions-list-page">
            <h2>All Questions</h2>
            <ul>
                {questions.map(q => (
                    <li key={q._id || q.id}>
                        <Link to={`/student/questions/${q._id || q.id}`}>{q.title}</Link>
                    </li>
                ))}
            </ul>
            <Link to="/student/questions/my" className="action-link">My Questions</Link>
        </div>
    );
};

export default QuestionsList;
