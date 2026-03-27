// frontend/src/pages/ReviewerCourse/ReviewDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, CheckCircle2, XCircle, RotateCcw, FileText, Video, HelpCircle, Folder,
} from "lucide-react";
import "../css/AdminDashboard.css";
import "../css/ReviewerDashboard.css";

const BASE_URL = "http://localhost:5000/api";

const typeLabel = (type) => {
    switch (type) {
        case "text": case "intro": return "TEXT";
        case "video": return "VIDEO";
        case "quiz": return "QUIZ";
        default: return "FOLDER";
    }
};

const ReviewDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`${BASE_URL}/review/course/${courseId}`, {
                    credentials: "include",
                });
                if (res.ok) setCourse(await res.json());
                else setError("Failed to load course.");
            } catch (err) {
                setError("Network error.");
            }
            setLoading(false);
        };
        fetchCourse();
    }, [courseId]);

    const handleAction = async (action) => {
        if (action !== "approve" && !note.trim()) {
            setError("Please provide feedback for rejection or revision.");
            return;
        }
        setActionLoading(true);
        setError("");
        try {
            const res = await fetch(`${BASE_URL}/review/course/${courseId}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ note: note.trim() || undefined }),
            });
            if (res.ok) {
                navigate("/reviewer-dashboard", { replace: true });
            } else {
                const data = await res.json();
                setError(data.message || "Action failed.");
            }
        } catch (err) {
            setError("Network error.");
        }
        setActionLoading(false);
    };

    if (loading) return <div style={{ padding: 24, color: "#9ca3af" }}>Loading course...</div>;
    if (!course) return <div style={{ padding: 24, color: "#ef4444" }}>{error || "Course not found."}</div>;

    const modulesObj = course.modules || {};
    const modulesList = Object.values(
        modulesObj instanceof Map ? Object.fromEntries(modulesObj) : modulesObj,
    ).filter((m) => m && m.id);

    return (
        <div>
            <button
                onClick={() => navigate(-1)}
                className="btn-action-edit"
                style={{ marginBottom: 16 }}
            >
                <ArrowLeft size={16} /> Back to Queue
            </button>

            {/* Course Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{course.title}</h2>
                    <p style={{ margin: 0, color: "#6b7280" }}>{course.subject} &middot; {course.teacherId?.name || "Unknown"}</p>
                </div>
                <span className={`status-badge ${course.approvalStatus}`}>{course.approvalStatus}</span>
            </div>

            {/* Description */}
            {course.description && (
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "#111827" }}>Description</h4>
                    <p style={{ margin: 0, color: "#374151", fontSize: "0.9rem", lineHeight: 1.6 }}>{course.description}</p>
                </div>
            )}

            {/* Module List — reusing admin-table */}
            <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8, color: "#111827" }}>Course Structure ({modulesList.length} items)</h4>
                <div className="admin-table-container">
                    <table className="admin-table" style={{ minWidth: "auto" }}>
                        <thead><tr><th>Type</th><th>Title</th></tr></thead>
                        <tbody>
                            {modulesList.map((mod) => (
                                <tr key={mod.id}>
                                    <td><span className={`status-badge ${mod.type === "quiz" ? "completed" : "in-progress"}`}>{typeLabel(mod.type)}</span></td>
                                    <td>{mod.title}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Notes */}
            {course.reviewNotes?.length > 0 && (
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "#111827" }}>Review Notes ({course.reviewNotes.length})</h4>
                    {course.reviewNotes.map((n, i) => (
                        <div key={i} style={{
                            padding: "8px 12px", borderRadius: 6, marginBottom: 6, fontSize: "0.85rem",
                            background: n.authorRole === "reviewer" ? "#fef3c7" : "#eff6ff",
                            border: `1px solid ${n.authorRole === "reviewer" ? "#fde68a" : "#bfdbfe"}`,
                        }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 2 }}>
                                {n.author} ({n.authorRole}) — {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                            {n.content}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions (only if pending) */}
            {course.approvalStatus === "pending" && (
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "#111827" }}>Review Decision</h4>

                    <textarea
                        placeholder="Add feedback (required for rejection/revision)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{
                            width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px",
                            fontSize: "0.9rem", resize: "vertical", minHeight: 70, fontFamily: "inherit", outline: "none",
                        }}
                    />

                    {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "8px 0 0" }}>{error}</p>}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                            onClick={() => handleAction("approve")}
                            disabled={actionLoading}
                            className="btn-action-edit"
                            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        >
                            <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                            onClick={() => handleAction("request-revision")}
                            disabled={actionLoading}
                            style={{
                                padding: "8px 16px", fontSize: "0.85rem", border: "none", borderRadius: 4,
                                cursor: "pointer", background: "#fef3c7", color: "#92400e", fontWeight: 500,
                                display: "inline-flex", alignItems: "center", gap: 4,
                            }}
                        >
                            <RotateCcw size={14} /> Request Revision
                        </button>
                        <button
                            onClick={() => handleAction("reject")}
                            disabled={actionLoading}
                            className="btn-action-delete"
                            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        >
                            <XCircle size={14} /> Reject
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewDetail;
