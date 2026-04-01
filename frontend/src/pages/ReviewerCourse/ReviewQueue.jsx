// frontend/src/pages/ReviewerCourse/ReviewQueue.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, BookOpen, Users } from "lucide-react";
import "../css/AdminDashboard.css";
import "../css/StudentDashboard.css";
import "../css/ReviewerDashboard.css";

const BASE_URL = "http://localhost:5000/api";

const ReviewQueue = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [queueRes, statsRes] = await Promise.all([
                    fetch(`${BASE_URL}/review/queue`, { credentials: "include" }),
                    fetch(`${BASE_URL}/review/stats`, { credentials: "include" }),
                ]);
                if (queueRes.ok) setCourses(await queueRes.json());
                if (statsRes.ok) setStats(await statsRes.json());
            } catch (err) {
                console.error("Failed to load queue:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div>
            {/* Stats — reusing existing metrics-grid and stat-card */}
            <div className="metrics-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card orange">
                    <div className="stat-icon"><Loader2 size={24} /></div>
                    <div className="stat-content"><h3>Pending</h3><p className="stat-value">{stats.pending || 0}</p></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon"><BookOpen size={24} /></div>
                    <div className="stat-content"><h3>Approved</h3><p className="stat-value">{stats.approved || 0}</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><BookOpen size={24} /></div>
                    <div className="stat-content"><h3>Rejected</h3><p className="stat-value">{stats.rejected || 0}</p></div>
                </div>
            </div>

            <h3 className="tab-section-title">Review Queue ({courses.length})</h3>

            {loading && <div className="p-4 text-center"><Loader2 className="animate-spin inline" /> Loading...</div>}

            {!loading && courses.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>No courses pending review. All clear!</p>
                </div>
            )}

            {!loading && courses.length > 0 && (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Subject</th>
                                <th>Instructor</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={course._id}>
                                    <td style={{ fontWeight: 600 }}>{course.title}</td>
                                    <td>{course.subject}</td>
                                    <td>{course.teacherId?.name || "Unknown"}</td>
                                    <td>{course.submittedAt ? new Date(course.submittedAt).toLocaleDateString() : "—"}</td>
                                    <td>
                                        <button
                                            className="btn-action-edit"
                                            onClick={() => navigate(`/reviewer-dashboard/course/${course._id}`)}
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReviewQueue;
