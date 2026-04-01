// frontend/src/pages/ReviewerCourse/ReviewHistory.jsx
import React, { useState, useEffect } from "react";
import { Loader2, BookOpen } from "lucide-react";
import "../css/AdminDashboard.css";
import "../css/ReviewerDashboard.css";

const BASE_URL = "http://localhost:5000/api";

const ReviewHistory = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${BASE_URL}/review/history`, { credentials: "include" });
                if (res.ok) setCourses(await res.json());
            } catch (err) {
                console.error("Failed to load history:", err);
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    return (
        <div>
            <h3 className="tab-section-title">Review History ({courses.length})</h3>

            {loading && <div className="p-4 text-center"><Loader2 className="animate-spin inline" /> Loading...</div>}

            {!loading && courses.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>No review history yet.</p>
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
                                <th>Decision</th>
                                <th>Reviewed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c._id}>
                                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                                    <td>{c.subject}</td>
                                    <td>{c.teacherId?.name || "—"}</td>
                                    <td><span className={`status-badge ${c.approvalStatus}`}>{c.approvalStatus}</span></td>
                                    <td>{c.reviewedAt ? new Date(c.reviewedAt).toLocaleDateString() : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReviewHistory;
