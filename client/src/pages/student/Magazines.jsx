import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Magazines.css';

const Magazines = () => {
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMagazines();
    }, []);

    const fetchMagazines = async () => {
        try {
            const response = await axios.get('/magazines');
            setMagazines(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching magazines:", error);
            setLoading(false);
        }
    };

    const handleLike = (id) => {
        // Implement like functionality if API exists
        console.log("Liked magazine:", id);
    };

    if (loading) return <div className="loading">Loading magazines...</div>;

    return (
        <div className="magazine-page">
            <h1>Our Magazines</h1>
            
            <div className="magazines-grid">
                {magazines.length === 0 ? (
                    <p>No magazines available at the moment.</p>
                ) : (
                    magazines.map(magazine => (
                        <div key={magazine._id} className="magazine-card">
                            {magazine.image_url && (
                                <img 
                                    src={magazine.image_url} 
                                    alt={magazine.title} 
                                    className="magazine-image"
                                />
                            )}
                            <div className="magazine-content">
                                <h3>{magazine.title}</h3>
                                <p>{magazine.description}</p>
                                
                                <div className="magazine-actions">
                                    <button 
                                        className="btn-like"
                                        onClick={() => handleLike(magazine._id)}
                                    >
                                        <i className="fas fa-thumbs-up"></i> Like
                                    </button>
                                    
                                    {magazine.content_url && (
                                        <a 
                                            href={magazine.content_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn-read"
                                        >
                                            Read Now
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Magazines;
