import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutInstructor } from '../../redux/slices/instructorAuthSlice';

const InstructorNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutInstructor());
    navigate('/instructor/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/instructor/dashboard">Izumi Instructor</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/instructor/dashboard">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/instructor/profile">Profile</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/instructor/stats">Stats</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/instructor/student-info">Student Info</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/instructor/contact">Contact Admin</Link>
            </li>
          </ul>
          <div className="d-flex">
            <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default InstructorNavbar;
