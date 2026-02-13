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
  const [remainingSeconds, setRemainingSeconds] = useState(0);

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

  // Watch for blocking error (structured object may contain blockedUntil)
  useEffect(() => {
    if (error && typeof error === "object" && error.blockedUntil) {
      const until = new Date(error.blockedUntil);
      const tick = () => {
        const secs = Math.max(
          0,
          Math.ceil((until.getTime() - Date.now()) / 1000),
        );
        setRemainingSeconds(secs);
      };
      tick();
      const timerId = setInterval(tick, 1000);
      return () => clearInterval(timerId);
    } else {
      // If error is cleared or not a block, reset
      setRemainingSeconds(0);
    }
  }, [error]);

  const formatRemaining = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const formatAbsoluteTime = (isoOrDate) => {
    try {
      const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
      if (Number.isNaN(d.getTime())) return '';
      // Show date and time in user's locale
      return d.toLocaleString();
    } catch (e) {
      return '';
    }
  };

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

          {error && (
            <div className="error-msg">
              {typeof error === "object" ? error.message || "Error" : error}
              {error?.blockedUntil && remainingSeconds > 0 && (
                <div style={{ marginTop: 6 }}>
                  Too many attempts. Try again in {formatRemaining(remainingSeconds)}.
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    (until {formatAbsoluteTime(error.blockedUntil)})
                  </div>
                </div>
              )}
            </div>
          )}

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

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || remainingSeconds > 0}
            >
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
