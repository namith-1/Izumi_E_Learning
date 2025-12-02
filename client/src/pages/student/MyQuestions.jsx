import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyQuestions, createQuestion } from '../../redux/slices/studentSlice';
import './MyQuestions.css';

const MyQuestions = () => {
    const dispatch = useDispatch();
    const { myQuestions, loading } = useSelector(state => state.student);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        dispatch(fetchMyQuestions());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(createQuestion({ title, description }));
        setTitle('');
        setDescription('');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="my-questions-page">
            <h2>My Questions</h2>
            <ul>
                {myQuestions.map(q => (
                    <li key={q._id || q.id}>
                        <Link to={`/student/questions/${q._id || q.id}`}>{q.title}</Link>
                    </li>
                ))}
            </ul>

            <h3>Post a New Question</h3>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Title" 
                    required 
                />
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Description" 
                    required
                ></textarea>
                <button type="submit">Submit</button>
            </form>

            <Link to="/student/questions" className="back-link">Back to All Questions</Link>
        </div>
    );
};

export default MyQuestions;
