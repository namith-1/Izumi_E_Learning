// frontend/src/pages/ReviewerDashboard.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { ClipboardList, History, Settings, BookOpen, Shield } from "lucide-react";
import ProfileDropdown from "../components/ProfileDropdown";
import ReviewQueue from "./ReviewerCourse/ReviewQueue";
import ReviewDetail from "./ReviewerCourse/ReviewDetail";
import ReviewHistory from "./ReviewerCourse/ReviewHistory";
import "../pages/css/StudentDashboard.css";

const ReviewerDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();

    const isActive = (path) =>
        location.pathname === path || location.pathname === path + "/";

    return (
        <div className="student-dash-layout">
            {/* Navigation Bar */}
            <header className="student-navbar">
                <div className="nav-brand">
                    <Shield size={24} />
                    <span>Reviewer Portal</span>
                </div>

                <nav className="nav-links">
                    <Link
                        to="/reviewer-dashboard/"
                        className={`nav-link-item ${isActive("/reviewer-dashboard") ? "active" : ""}`}
                    >
                        <ClipboardList size={18} /> Review Queue
                    </Link>

                    <Link
                        to="/reviewer-dashboard/history"
                        className={`nav-link-item ${isActive("/reviewer-dashboard/history") ? "active" : ""}`}
                    >
                        <History size={18} /> History
                    </Link>
                </nav>

                <div className="nav-user-info">
                    <ProfileDropdown user={user} currentPath={location.pathname} />
                </div>
            </header>

            {/* Main Content */}
            <main className="student-main-content">
                <Routes>
                    <Route index element={<ReviewQueue />} />
                    <Route path="history" element={<ReviewHistory />} />
                    <Route path="course/:courseId" element={<ReviewDetail />} />
                    <Route path="*" element={<Navigate to="/reviewer-dashboard" replace />} />
                </Routes>
            </main>

            {/* Footer */}
            <footer className="student-footer">
                <p>&copy; {new Date().getFullYear()} Izumi Portal. Reviewer Portal.</p>
                <p>Support | Terms</p>
            </footer>
        </div>
    );
};

export default ReviewerDashboard;
