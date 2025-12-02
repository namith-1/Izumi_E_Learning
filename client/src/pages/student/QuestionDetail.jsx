import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as studentApi from '../../services/studentApi';
import './QuestionDetail.css';

const QuestionDetail = () => {
    const { id } = useParams();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        studentApi.getQuestionDetail(id)
            .then(data => {
                setQuestion(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [id]);

    const vote = async (answerId, voteType) => {
        try {
            const data = await studentApi.voteAnswer({ answer_id: answerId, vote: voteType });

            if (data.success) {
                // Update local state
                setQuestion(prev => ({
                    ...prev,
                    answers: prev.answers.map(ans => 
                        (ans._id || ans.id) === answerId ? { ...ans, votes: data.votes } : ans
                    )
                }));
            } else {
                alert(data.message || "You have already voted.");
            }
        } catch (error) {
            console.error("Vote error:", error);
            alert("Error while voting.");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!question) return <div>Question not found</div>;

    return (
        <div className="question-detail-page">
            <Link to="/student/questions" className="back-link">← Back to Questions</Link>
            <h2>{question.title}</h2>
            <p>{question.description}</p>

            <h3>Answers:</h3>
            <ul>
                {question.answers && question.answers.map(ans => (
                    <li key={ans._id || ans.id}>
                        <p>
                            {ans.content} - Votes: <span>{ans.votes}</span>
                        </p>
                        <button onClick={() => vote(ans._id || ans.id, 'up')}>Upvote</button>
                        <button onClick={() => vote(ans._id || ans.id, 'down')}>Downvote</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuestionDetail;
