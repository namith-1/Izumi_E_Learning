import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="izumi-navbar">
      <div className="izumi-navbar-brand">🎓 Izumi Learning</div>
      <div className="izumi-nav-links">
        <a href="http://localhost:4000/dashboard" className="izumi-nav-link">
          Home
        </a>
      </div>
    </nav>
  );
};

export default Navbar;