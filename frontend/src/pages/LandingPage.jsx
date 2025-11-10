// v2/frontend/src/pages/LandingPage.jsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UnauthenticatedNavbar from '../components/UnauthenticatedNavbar';
import { LogIn, UserPlus, Layers } from 'lucide-react';
import './css/LandingPage.css'; 

const LandingPage = () => {
    const { user, loading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Redirect authenticated users to their respective dashboards
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'teacher') {
                navigate('/instructor-dashboard', { replace: true });
            } else {
                navigate('/student-dashboard', { replace: true });
            }
        }
    }, [user, loading, navigate]);
    
    // Return empty fragment while checking auth status to prevent flicker
    if (loading) {
        return <div></div>; 
    }

    return (
        <div className="landing-page-layout">
            <UnauthenticatedNavbar />
            
            <main className="landing-content">
                <div className="hero-section">
                    <h1>Unlock Your Potential with Izumi Portal</h1>
                    <p className="subtitle">Interactive courses, engaging projects, and educational games await. Start your learning journey today.</p>
                    
                    <div className="action-buttons">
                        <button 
                            className="btn-primary-landing" 
                            onClick={() => navigate('/login')}
                        >
                            <LogIn size={20} /> Get Started - Login
                        </button>
                        <button 
                            className="btn-secondary-landing" 
                            onClick={() => navigate('/signup')}
                        >
                            <UserPlus size={20} /> Create an Account
                        </button>
                    </div>
                </div>
                
                <section className="features-section">
                    <div className="feature-card">
                        <Layers size={32} className="feature-icon" />
                        <h3>Comprehensive Catalog</h3>
                        <p>Browse courses in Math, Science, CS, and more.</p>
                    </div>
                    <div className="feature-card">
                        <LogIn size={32} className="feature-icon" />
                        <h3>Interactive Learning</h3>
                        <p>Engage with videos, quizzes, and simulations.</p>
                    </div>
                    <div className="feature-card">
                        <UserPlus size={32} className="feature-icon" />
                        <h3>Instructor Tools</h3>
                        <p>Build, publish, and manage your own educational content.</p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;