// frontend/src/pages/ReviewerCourse/TopicProposals.jsx
// Reviewer queue: approve or reject instructor topic proposals.
// Shows the full hierarchy path and proposer context.
import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, ChevronRight, RefreshCw,
  Tag, AlertCircle, User, Calendar,
} from "lucide-react";
import { BACKEND_URL } from "../../store";

const API = BACKEND_URL.replace(/\/$/, "") + "/api";

// ── Level badge ───────────────────────────────────────────────────────────────
const LEVEL_META = [
  { label: "Root Domain", color: "#7c3aed", bg: "#ede9fe" },
  { label: "Subject",     color: "#1d4ed8", bg: "#dbeafe" },
  { label: "Sub-topic",   color: "#0891b2", bg: "#cffafe" },
];

const LevelBadge = ({ level }) => {
  const m = LEVEL_META[level] || LEVEL_META[2];
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20, letterSpacing: "0.03em" }}>
      {m.label}
    </span>
  );
};

// ── TopicProposals ────────────────────────────────────────────────────────────
const TopicProposals = () => {
  const [proposals,   setProposals]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeId,    setActiveId]    = useState(null);
  const [reviewNote,  setReviewNote]  = useState("");
  const [acting,      setActing]      = useState(false);
  const [actionMsg,   setActionMsg]   = useState(null);   // per-card success flash

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/subjects/pending`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load proposals");
      setProposals(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const act = async (id, action) => {
    setActing(true);
    try {
      const res  = await fetch(`${API}/subjects/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reviewNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");

      setActionMsg({ id, action, text: action === "approve" ? "Approved ✓" : "Rejected ✗" });
      setTimeout(() => {
        setProposals((prev) => prev.filter((p) => p._id !== id));
        setActiveId(null);
        setReviewNote("");
        setActionMsg(null);
      }, 900);
    } catch (e) {
      alert(e.message);
    } finally {
      setActing(false);
    }
  };

  // ── Build hierarchy path string ─────────────────────────────────────────────
  const pathOf = (p) => {
    if (!p.path) return p.slug;
    return p.path.split(".").join(" → ");
  };

  const pendingCount = proposals.length;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1f2937", margin: 0 }}>
              🏷️ Topic Proposals
            </h1>
            {pendingCount > 0 && (
              <span style={{ background: "#f59e0b", color: "#fff", fontSize: 12, fontWeight: 800,
                padding: "2px 10px", borderRadius: 20, minWidth: 24, textAlign: "center" }}>
                {pendingCount}
              </span>
            )}
          </div>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Instructors propose new topics when they can't find a match in the taxonomy.
            Approved topics are immediately available for course tagging and student filtering.
          </p>
        </div>
        <button onClick={fetchPending} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12,
            color: "#374151", cursor: "pointer", fontWeight: 500 }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* States */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <p>Loading proposals…</p>
        </div>
      )}
      {error && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fef2f2",
          border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#b91c1c" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {!loading && !error && proposals.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.35, color: "#10b981" }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>All caught up! 🎉</p>
          <p style={{ fontSize: 13 }}>No pending topic proposals at this time.</p>
        </div>
      )}

      {/* Proposal cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {proposals.map((p) => {
          const isExpanded = activeId === p._id;
          const flash = actionMsg?.id === p._id;
          return (
            <div key={p._id} style={{
              background: flash
                ? (actionMsg.action === "approve" ? "#d1fae5" : "#fee2e2")
                : "white",
              border: `1px solid ${isExpanded ? "#a78bfa" : flash ? "transparent" : "#e5e7eb"}`,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: isExpanded ? "0 4px 20px rgba(99,102,241,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.25s",
            }}>

              {/* ── Card header (always visible) ── */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  cursor: "pointer" }}
                onClick={() => {
                  setActiveId(isExpanded ? null : p._id);
                  setReviewNote("");
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>{p.emoji || "📚"}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>
                      {p.name}
                    </p>
                    <LevelBadge level={p.level} />
                  </div>

                  {/* Hierarchy path */}
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "3px 0 0", fontFamily: "monospace" }}>
                    📂 {pathOf(p)}
                    {p.parentId?.name && <span style={{ color: "#9ca3af" }}> (under "{p.parentId.name}")</span>}
                  </p>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
                      <User size={10} /> {p.proposedByName || "Instructor"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
                      <Calendar size={10} /> {new Date(p.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
                      <Clock size={10} /> {new Date(p.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Status badge + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 20 }}>
                    Pending
                  </span>
                  <ChevronRight size={16} style={{ color: "#9ca3af",
                    transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                </div>
              </div>

              {/* ── Expanded review panel ── */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid #f3f4f6", padding: "18px 20px", background: "#fafbff" }}>

                  {/* Info tiles */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Slug",  value: p.slug },
                      { label: "Full Path", value: pathOf(p) },
                      { label: "Level", value: LEVEL_META[p.level]?.label || `Level ${p.level}` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: "white", border: "1px solid #e5e7eb",
                        borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
                          letterSpacing: "0.06em", margin: "0 0 3px" }}>{label}</p>
                        <code style={{ fontSize: 12, color: "#374151", wordBreak: "break-all" }}>{value}</code>
                      </div>
                    ))}
                  </div>

                  {/* Review note input */}
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Review Note <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional — sent to instructor)</span>
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="e.g. 'Approved — fits well under Web Development' or 'Rejected — duplicate of existing React topic'"
                    rows={2}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical",
                      padding: "8px 11px", borderRadius: 8, border: "1px solid #d1d5db",
                      fontSize: 13, outline: "none", marginBottom: 14, fontFamily: "inherit" }}
                  />

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => act(p._id, "approve")} disabled={acting}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px",
                        borderRadius: 9, border: "none", background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        opacity: acting ? 0.7 : 1 }}>
                      <CheckCircle size={16} /> Approve Topic
                    </button>
                    <button onClick={() => act(p._id, "reject")} disabled={acting}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px",
                        borderRadius: 9, border: "1px solid #fca5a5", background: "#fff5f5",
                        color: "#b91c1c", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        opacity: acting ? 0.7 : 1 }}>
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => setActiveId(null)}
                      style={{ marginLeft: "auto", padding: "9px 16px", borderRadius: 9,
                        border: "1px solid #e5e7eb", background: "white", color: "#6b7280",
                        fontSize: 12, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>

                  {/* Decision guide */}
                  <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
                    <strong>Approve</strong> if the topic is genuinely distinct and fits the taxonomy.{" "}
                    <strong>Reject</strong> if it already exists (as a differently-named entry), is too broad,
                    or is better suited under a different parent.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicProposals;
