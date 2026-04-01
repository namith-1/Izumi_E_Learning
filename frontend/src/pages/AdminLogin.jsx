// frontend/src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, clearAuthErrors } from "../store";
import UnauthenticatedNavbar from "../components/UnauthenticatedNavbar";
import "./css/Login.css";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "teacher") {
        navigate("/instructor-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
    return () => {
      dispatch(clearAuthErrors());
    };
  }, [user, navigate, dispatch]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Force role to admin for this page
    dispatch(loginUser({ ...formData, role: "admin" }));
  };

  return (
    <>
      <UnauthenticatedNavbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Admin Sign In</h2>
            <p>Sign in with your administrator account</p>
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
            <a href="/signup" className="link-text">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
