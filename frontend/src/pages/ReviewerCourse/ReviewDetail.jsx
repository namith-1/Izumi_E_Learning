// frontend/src/pages/ReviewerCourse/ReviewDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, CheckCircle2, XCircle, RotateCcw,
    FileText, Video, HelpCircle, BookOpen, ChevronDown, ChevronRight, DollarSign,
} from "lucide-react";
import "../css/AdminDashboard.css";
import "../css/ReviewerDashboard.css";
import { BACKEND_URL } from "../../store";

const BASE_URL = `${BACKEND_URL}/api`;

// ── Module type helpers ───────────────────────────────────────────────────────
const typeIcon = (type) => {
    const s = { size: 15, style: { flexShrink: 0 } };
    switch (type) {
        case "text": case "intro": return <FileText {...s} color="#6366f1" />;
        case "video":              return <Video {...s} color="#0ea5e9" />;
        case "quiz":               return <HelpCircle {...s} color="#f59e0b" />;
        default:                   return <BookOpen {...s} color="#6b7280" />;
    }
};

const typeBadge = (type) => {
    const styles = {
        text:  { background: "#ede9fe", color: "#5b21b6" },
        intro: { background: "#ede9fe", color: "#5b21b6" },
        video: { background: "#e0f2fe", color: "#0369a1" },
        quiz:  { background: "#fef3c7", color: "#92400e" },
    };
    const s = styles[type] || { background: "#f3f4f6", color: "#6b7280" };
    return (
        <span style={{
            ...s, padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem",
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
            {type}
        </span>
    );
};

// ── Single Module Card ────────────────────────────────────────────────────────
const ModuleCard = ({ mod }) => {
    const [open, setOpen] = useState(false);
    const hasContent = mod.text || mod.videoLink || (mod.quizData?.questions?.length > 0);

    return (
        <div style={{
            border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8,
            overflow: "hidden", background: "white",
        }}>
            {/* Header row */}
            <div
                onClick={() => hasContent && setOpen(!open)}
                style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", cursor: hasContent ? "pointer" : "default",
                    background: open ? "#f5f3ff" : "white",
                    borderBottom: open ? "1px solid #e5e7eb" : "none",
                    transition: "background 0.15s",
                }}
            >
                {hasContent ? (
                    open ? <ChevronDown size={15} color="#6b7280" /> : <ChevronRight size={15} color="#6b7280" />
                ) : <span style={{ width: 15 }} />}
                {typeIcon(mod.type)}
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827", flex: 1 }}>
                    {mod.title || "Untitled Module"}
                </span>
                {typeBadge(mod.type)}
            </div>

            {/* Expanded content */}
            {open && (
                <div style={{ padding: "14px 18px", background: "#fafafa" }}>
                    {mod.description && (
                        <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic" }}>
                            {mod.description}
                        </p>
                    )}

                    {/* Text content */}
                    {(mod.type === "text" || mod.type === "intro") && mod.text && (
                        <div style={{
                            background: "white", border: "1px solid #e5e7eb", borderRadius: 6,
                            padding: "12px 14px", fontSize: "0.85rem", color: "#374151",
                            lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto",
                        }}>
                            {mod.text}
                        </div>
                    )}

                    {/* Video */}
                    {mod.type === "video" && mod.videoLink && (
                        <div>
                            {mod.videoLink.includes("youtube.com") || mod.videoLink.includes("youtu.be") ? (
                                <iframe
                                    src={mod.videoLink.replace("watch?v=", "embed/")}
                                    title={mod.title}
                                    style={{ width: "100%", height: 240, border: "none", borderRadius: 8 }}
                                    allowFullScreen
                                />
                            ) : mod.videoLink.includes("cloudinary") || mod.videoLink.match(/\.(mp4|mov|webm)/i) ? (
                                <video controls style={{ width: "100%", borderRadius: 8, maxHeight: 260 }}>
                                    <source src={mod.videoLink} />
                                </video>
                            ) : (
                                <a href={mod.videoLink} target="_blank" rel="noopener noreferrer"
                                    style={{ color: "#6366f1", fontSize: "0.85rem", wordBreak: "break-all" }}>
                                    🔗 {mod.videoLink}
                                </a>
                            )}
                        </div>
                    )}

                    {/* Quiz questions */}
                    {mod.type === "quiz" && mod.quizData?.questions?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {mod.quizData.questions.map((q, qi) => {
                                // Support both {options: [{id,text,isCorrect}]} and {options: [string], correctOption: number}
                                const opts = q.options || [];
                                const isObjectOptions = opts.length > 0 && typeof opts[0] === "object";

                                return (
                                    <div key={qi} style={{
                                        background: "white", border: "1px solid #e5e7eb",
                                        borderRadius: 6, padding: "10px 14px",
                                    }}>
                                        <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: "0.85rem", color: "#111827" }}>
                                            Q{qi + 1}. {q.question}
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                            {isObjectOptions
                                                ? opts.map((opt, oi) => (
                                                    <div key={opt.id || oi} style={{
                                                        padding: "4px 10px", borderRadius: 4, fontSize: "0.8rem",
                                                        background: opt.isCorrect ? "#d1fae5" : "#f9fafb",
                                                        color: opt.isCorrect ? "#065f46" : "#374151",
                                                        fontWeight: opt.isCorrect ? 700 : 400,
                                                        border: opt.isCorrect ? "1px solid #6ee7b7" : "1px solid #e5e7eb",
                                                    }}>
                                                        {opt.isCorrect ? "✓ " : ""}{opt.text}
                                                    </div>
                                                ))
                                                : opts.map((opt, oi) => (
                                                    <div key={oi} style={{
                                                        padding: "4px 10px", borderRadius: 4, fontSize: "0.8rem",
                                                        background: oi === q.correctOption ? "#d1fae5" : "#f9fafb",
                                                        color: oi === q.correctOption ? "#065f46" : "#374151",
                                                        fontWeight: oi === q.correctOption ? 700 : 400,
                                                        border: oi === q.correctOption ? "1px solid #6ee7b7" : "1px solid #e5e7eb",
                                                    }}>
                                                        {oi === q.correctOption ? "✓ " : ""}{opt}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!hasContent && (
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>No content added yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main ReviewDetail ─────────────────────────────────────────────────────────
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
                const res = await fetch(`${BASE_URL}/review/course/${courseId}`, { credentials: "include" });
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

    // Build flat module list preserving tree order
    const buildOrderedModules = () => {
        const modulesObj = course.modules || {};
        const map = modulesObj instanceof Map ? Object.fromEntries(modulesObj) : modulesObj;
        const rootMod = course.rootModule;

        const ordered = [];
        const visit = (mod, depth = 0) => {
            if (!mod) return;
            ordered.push({ ...mod, _depth: depth });
            (mod.children || []).forEach(childId => visit(map[childId], depth + 1));
        };

        if (rootMod) visit(rootMod, 0);
        Object.values(map).forEach(m => {
            if (m && !ordered.find(o => o.id === m.id)) visit(m, 0);
        });

        return ordered;
    };

    const modulesList = buildOrderedModules();

    return (
        <div>
            <button onClick={() => navigate(-1)} className="btn-action-edit" style={{ marginBottom: 16 }}>
                <ArrowLeft size={16} /> Back to Queue
            </button>

            {/* Course header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
                        {course.title}
                    </h2>
                    <p style={{ margin: 0, color: "#6b7280" }}>
                        {course.subject} · {course.teacherId?.name || "Unknown"}
                        {course.price != null && (
                            <span style={{ marginLeft: 10, fontWeight: 600, color: "#4f46e5" }}>
                                <DollarSign size={13} style={{ verticalAlign: "middle" }} />
                                {course.price === 0 ? "Free" : `$${course.price}`}
                            </span>
                        )}
                    </p>
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

            {/* Course Modules — expandable content */}
            <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 10, color: "#111827" }}>
                    Course Content ({modulesList.length} modules) — click to expand
                </h4>
                {modulesList.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No modules added yet.</p>
                ) : (
                    modulesList.map(mod => (
                        <div key={mod.id} style={{ marginLeft: mod._depth * 18 }}>
                            <ModuleCard mod={mod} />
                        </div>
                    ))
                )}
            </div>

            {/* Previous review notes */}
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

            {/* Review Decision — for pending & awaited */}
            {["pending", "awaited"].includes(course.approvalStatus) && (
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                    <h4 style={{ margin: "0 0 8px", color: "#111827" }}>Review Decision</h4>

                    <textarea
                        placeholder="Add feedback (required for rejection/revision)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{
                            width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px",
                            fontSize: "0.9rem", resize: "vertical", minHeight: 70, fontFamily: "inherit",
                            outline: "none", boxSizing: "border-box",
                        }}
                    />

                    {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "8px 0 0" }}>{error}</p>}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                            onClick={() => handleAction("approve")}
                            disabled={actionLoading}
                            className="btn-action-edit"
                            style={{ padding: "8px 16px", fontSize: "0.85rem", backgroundColor: "#10b981", color: "white" }}
                        >
                            <CheckCircle2 size={14} /> Approve & Publish
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
