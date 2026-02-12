// v2/frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, clearAuthErrors } from "../store";
import UnauthenticatedNavbar from "../components/UnauthenticatedNavbar";
import "./css/Login.css"; // Importing the separate CSS file

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      if (user.role === "teacher") {
        navigate("/instructor-dashboard");
      } else if (user.role === "admin") {
        // Handle admin redirect
        navigate("/admin-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
    // Cleanup errors
    return () => {
      dispatch(clearAuthErrors());
    };
  }, [user, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <>
      <UnauthenticatedNavbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to your account</p>
          </div>

          {/* ROLE TOGGLE (Student / Instructor) - admin removed from main login */}
          <div className="role-toggle two-options">
            <button
              type="button"
              className={`role-btn ${formData.role === "student" ? "active" : ""}`}
              onClick={() => setFormData({ ...formData, role: "student" })}
            >
              Student
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === "teacher" ? "active" : ""}`}
              onClick={() => setFormData({ ...formData, role: "teacher" })}
            >
              Instructor
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            Don't have an account?{" "}
            <Link to="/signup" className="link-text">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
