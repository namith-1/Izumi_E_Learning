import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="logo">🎓 IZUMI E-Learning</h1>
          <div className="nav-links">
            <div className="student-nav">
              <a href="/student/login" className="nav-link">Student Login</a>
              <a href="/student/signup" className="nav-link signup-btn">Student Sign Up</a>
            </div>
            <div className="instructor-nav">
              <a href="/instructor/login" className="nav-link">Instructor Login</a>
              <a href="/instructor/signup" className="nav-link signup-btn">Instructor Sign Up</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Learn Anything, Anytime, Anywhere</h2>
          <p>Transform your education with our interactive e-learning platform</p>
          <div className="hero-buttons">
            <a href="/signup" className="btn btn-primary">Get Started as Student</a>
            <a href="/signup?role=instructor" className="btn btn-secondary">Join as Instructor</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="circle-1"></div>
          <div className="circle-2"></div>
          <div className="circle-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why Choose Izumi?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Comprehensive Courses</h3>
            <p>Learn from expertly crafted courses designed for all skill levels</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Expert Instructors</h3>
            <p>Learn from industry professionals with years of experience</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Goal Tracking</h3>
            <p>Set and achieve your learning goals with our tracking system</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Analytics</h3>
            <p>Monitor your learning progress with detailed analytics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Gamification</h3>
            <p>Earn badges and achievements while learning</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Community Q&A</h3>
            <p>Connect with other learners and get help from the community</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-item">
          <h3>1000+</h3>
          <p>Active Students</p>
        </div>
        <div className="stat-item">
          <h3>50+</h3>
          <p>Expert Instructors</p>
        </div>
        <div className="stat-item">
          <h3>100+</h3>
          <p>Courses Available</p>
        </div>
        <div className="stat-item">
          <h3>95%</h3>
          <p>Satisfaction Rate</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Start Learning?</h2>
        <p>Join thousands of students transforming their careers with Izumi E-Learning</p>
        <div className="cta-buttons">
          <a href="/signup" className="btn btn-large">Start Learning as Student</a>
          <a href="/signup?role=instructor" className="btn btn-large btn-secondary">Teach with Izumi</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Izumi</h4>
            <p>A comprehensive e-learning platform designed to help students achieve their goals.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="/student/login">Student Login</a></li>
              <li><a href="/instructor/login">Instructor Login</a></li>
              <li><a href="/signup">Sign Up</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@izumi.com</p>
            <p>Phone: +1-800-IZUMI</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Izumi E-Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
