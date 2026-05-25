import React, { useState, useEffect } from "react";
import { Check, X, Loader2, User, Link as LinkIcon, FileText } from "lucide-react";
import { BACKEND_URL } from "../../store";
import "../css/AdminDashboard.css";
import "../css/StudentDashboard.css";
import "../css/ReviewerDashboard.css";

const BASE_URL = `${BACKEND_URL}/api`;

const TeacherApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${BASE_URL}/review/teachers/pending`, { credentials: "include" });
            if (res.ok) setApplications(await res.json());
        } catch (err) {
            console.error("Failed to load applications:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleAction = async (id, action) => {
        setActionLoading(id);
        try {
            const res = await fetch(`${BASE_URL}/review/teachers/${id}/${action}`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                setApplications(applications.filter((app) => app._id !== id));
            } else {
                const data = await res.json();
                alert(data.message || `Failed to ${action} instructor.`);
            }
        } catch (err) {
            console.error(`Error ${action}ing instructor:`, err);
        }
        setActionLoading(null);
    };

    return (
        <div>
            <h3 className="tab-section-title">Instructor Applications ({applications.length})</h3>

            {loading && <div className="p-4 text-center"><Loader2 className="animate-spin inline" /> Loading...</div>}

            {!loading && applications.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                    <User size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>No pending instructor applications.</p>
                </div>
            )}

            {!loading && applications.length > 0 && (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Instructor</th>
                                <th>Specialization</th>
                                <th>Credentials</th>
                                <th>Applied On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((app) => (
                                <tr key={app._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{app.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{app.email}</div>
                                    </td>
                                    <td>
                                        {app.specialization && app.specialization.length > 0 
                                            ? app.specialization.join(", ") 
                                            : "Not specified"}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            {app.linkedIn && (
                                                <a 
                                                    href={app.linkedIn} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="btn-action-edit" 
                                                    style={{ 
                                                        padding: "6px 10px", 
                                                        fontSize: "0.75rem",
                                                        backgroundColor: "#0077b5",
                                                        color: "white",
                                                        textDecoration: "none"
                                                    }}
                                                    title="View LinkedIn Profile"
                                                >
                                                    <LinkIcon size={14} /> LinkedIn
                                                </a>
                                            )}
                                            {app.resume && (
                                                <a 
                                                    href={app.resume} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    download={`Resume_${app.name.replace(/\s+/g, '_')}.pdf`}
                                                    className="btn-action-edit" 
                                                    style={{ 
                                                        padding: "6px 10px", 
                                                        fontSize: "0.75rem",
                                                        backgroundColor: "#ef4444",
                                                        color: "white",
                                                        textDecoration: "none"
                                                    }}
                                                    title="Open or Download Resume"
                                                >
                                                    <FileText size={14} /> Resume
                                                </a>
                                            )}
                                            {!app.resume && !app.linkedIn && (
                                                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>No credentials</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                className="btn-action-edit"
                                                style={{ backgroundColor: "#10b981", color: "white" }}
                                                disabled={actionLoading === app._id}
                                                onClick={() => handleAction(app._id, "approve")}
                                            >
                                                {actionLoading === app._id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve
                                            </button>
                                            <button
                                                className="btn-action-delete"
                                                disabled={actionLoading === app._id}
                                                onClick={() => handleAction(app._id, "reject")}
                                            >
                                                {actionLoading === app._id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Reject
                                            </button>
                                        </div>
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

export default TeacherApplications;
