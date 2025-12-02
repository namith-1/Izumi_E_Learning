import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPurchases } from '../../redux/slices/studentSlice';
import './MyPurchases.css';

const MyPurchases = () => {
    const dispatch = useDispatch();
    const { purchases, loading, error } = useSelector(state => state.student);

    useEffect(() => {
        dispatch(fetchPurchases());
    }, [dispatch]);

    if (loading) return <div className="loading">Loading purchases...</div>;

    return (
        <div className="my-purchases-container">
            <div className="purchases-header">
                <h2>My Purchases</h2>
                <Link to="/student/profile" className="back-link">Back to Profile</Link>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="purchases-list">
                {purchases.length === 0 ? (
                    <div className="no-purchases">
                        <p>You haven't purchased any courses yet.</p>
                        <Link to="/student/dashboard" className="browse-btn">Browse Courses</Link>
                    </div>
                ) : (
                    purchases.map(purchase => (
                        <div key={purchase.id || purchase._id} className="purchase-card">
                            <div className="purchase-info">
                                <h3>{purchase.course_title || "Untitled Course"}</h3>
                                <p className="purchase-date">
                                    Purchased on: {new Date(purchase.date).toLocaleDateString()}
                                </p>
                                <p className="purchase-price">
                                    Price: ${purchase.price}
                                </p>
                            </div>
                            <div className="purchase-actions">
                                <Link to={`/course/${purchase.course_id}`} className="view-btn">
                                    Go to Course
                                </Link>
                                <a href={`/invoice/${purchase.id}`} className="invoice-link">
                                    View Invoice
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyPurchases;
