// frontend/src/components/SubjectPicker.jsx
// Cascading 3-level subject picker for CourseEditor.
// Level 0 = Domain, Level 1 = Subject, Level 2 = Sub-topic.
// Each column has an inline "Request new topic" form.

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, CheckCircle, Plus, Send, X, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { BACKEND_URL } from "../store";

const API = BACKEND_URL.replace(/\/$/, "") + "/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) =>
  s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// ─── ProposePanel ─────────────────────────────────────────────────────────────
// Shown at the bottom of any column when user clicks "+ Can't find it?"
const ProposePanel = ({ parentId, parentName, level, onProposed, onCancel }) => {
  const [name,    setName]    = useState("");
  const [emoji,   setEmoji]   = useState("📚");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const levelLabel = ["domain", "subject", "sub-topic"][level] || "topic";

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/subjects/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          parentId: parentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.message || "Failed." });
      } else {
        setMsg({ ok: true, text: `"${name}" sent to reviewers for approval!` });
        onProposed && onProposed(data.proposal);
        setTimeout(onCancel, 1800);
      }
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={css.proposePanel}>
      <p style={css.proposeHeading}>
        ✏️ Request new {levelLabel}
        {parentName ? <span style={{ color: "#6b7280" }}> under "{parentName}"</span> : ""}
      </p>
      {msg && (
        <div style={{ ...css.msg, background: msg.ok ? "#d1fae5" : "#fee2e2", color: msg.ok ? "#065f46" : "#b91c1c" }}>
          {msg.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />} {msg.text}
        </div>
      )}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={emoji} onChange={(e) => setEmoji(e.target.value)}
            maxLength={2} style={{ ...css.input, width: 44, textAlign: "center", fontSize: 18 }}
            title="Pick an emoji"
          />
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder={`New ${levelLabel} name...`}
            style={{ ...css.input, flex: 1 }} required
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="submit" disabled={loading} style={css.btnPrimary}>
            {loading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={12} />}
            {loading ? "Sending…" : "Request"}
          </button>
          <button type="button" onClick={onCancel} style={css.btnGhost}>
            <X size={12} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────
// One column of the cascading picker.
const Column = ({
  title, items, selectedId, onSelect, level, parentId, parentName,
  onProposed, canPropose, emptyText,
}) => {
  const [proposing, setProposing] = useState(false);

  return (
    <div style={css.column}>
      <div style={css.colHeader}>{title}</div>
      <div style={css.colBody}>
        {items.length === 0 && !proposing && (
          <p style={css.emptyText}>{emptyText || "Select a parent first"}</p>
        )}
        {items.map((item) => {
          const isSel = String(item._id) === String(selectedId);
          return (
            <div
              key={item._id}
              onClick={() => onSelect(item)}
              style={{
                ...css.item,
                ...(isSel ? css.itemActive : {}),
              }}
              onMouseEnter={(e) => !isSel && (e.currentTarget.style.background = "#f5f3ff")}
              onMouseLeave={(e) => !isSel && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.emoji || "📚"}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: isSel ? 700 : 400,
                color: isSel ? "#5b21b6" : "#1f2937", lineHeight: 1.35 }}>
                {item.name}
              </span>
              {isSel
                ? <CheckCircle size={14} color="#7c3aed" style={{ flexShrink: 0 }} />
                : item.children?.length > 0
                ? <ChevronRight size={13} style={{ color: "#d1d5db", flexShrink: 0 }} />
                : null}
            </div>
          );
        })}
      </div>
      {canPropose && !proposing && (
        <div style={css.proposeBtn} onClick={() => setProposing(true)}>
          <Plus size={12} /> Can't find it? Request new
        </div>
      )}
      {canPropose && proposing && (
        <ProposePanel
          parentId={parentId}
          parentName={parentName}
          level={level}
          onCancel={() => setProposing(false)}
          onProposed={(p) => { onProposed && onProposed(p); setProposing(false); }}
        />
      )}
    </div>
  );
};

// ─── Main SubjectPicker ───────────────────────────────────────────────────────
/**
 * Props:
 *   value      — string  current subject name stored on the course
 *   onChange   — (name, breadcrumb) => void
 *   error      — string | null
 */
const SubjectPicker = ({ value, onChange, error }) => {
  const [tree,     setTree]     = useState([]);           // level-0 roots
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  // Selected nodes at each level
  const [selL0, setSelL0] = useState(null);  // domain node
  const [selL1, setSelL1] = useState(null);  // subject node
  const [selL2, setSelL2] = useState(null);  // sub-topic node

  // Fetch tree on mount
  const loadTree = useCallback(() => {
    setLoading(true);
    setFetchErr(null);
    fetch(`${API}/subjects`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setTree(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setFetchErr("Failed to load subjects. Check your connection.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  // When the tree loads, try to pre-select columns based on current value
  useEffect(() => {
    if (!tree.length || !value) return;
    // Flatten tree and find the node whose name matches the stored value
    const flat = [];
    const walk = (nodes) => nodes.forEach((n) => { flat.push(n); walk(n.children || []); });
    walk(tree);
    const match = flat.find((n) => n.name === value);
    if (!match) return;
    if (match.level === 0) {
      setSelL0(match); setSelL1(null); setSelL2(null);
    } else if (match.level === 1) {
      const parent = flat.find((n) => String(n._id) === String(match.parentId));
      setSelL0(parent || null); setSelL1(match); setSelL2(null);
    } else if (match.level === 2) {
      const l1 = flat.find((n) => String(n._id) === String(match.parentId));
      const l0 = l1 ? flat.find((n) => String(n._id) === String(l1.parentId)) : null;
      setSelL0(l0 || null); setSelL1(l1 || null); setSelL2(match);
    }
  }, [tree, value]);

  // Breadcrumb string: "Domain → Subject → Sub-topic"
  const breadcrumb = [selL0?.name, selL1?.name, selL2?.name]
    .filter(Boolean).join(" → ");

  const selectAndEmit = (node, level) => {
    if (level === 0) {
      // If re-clicking same domain, deselect
      if (selL0 && String(selL0._id) === String(node._id)) {
        setSelL0(null); setSelL1(null); setSelL2(null);
        onChange("", "");
        return;
      }
      setSelL0(node); setSelL1(null); setSelL2(null);
      onChange(node.name, node.name);
    } else if (level === 1) {
      if (selL1 && String(selL1._id) === String(node._id)) {
        setSelL1(null); setSelL2(null);
        onChange(selL0?.name || "", selL0?.name || "");
        return;
      }
      setSelL1(node); setSelL2(null);
      onChange(node.name, `${selL0?.name || ""} → ${node.name}`);
    } else {
      if (selL2 && String(selL2._id) === String(node._id)) {
        setSelL2(null);
        onChange(selL1?.name || "", `${selL0?.name || ""} → ${selL1?.name || ""}`);
        return;
      }
      setSelL2(node);
      onChange(node.name, `${selL0?.name || ""} → ${selL1?.name || ""} → ${node.name}`);
    }
  };

  const clearAll = () => {
    setSelL0(null); setSelL1(null); setSelL2(null);
    onChange("", "");
  };

  const l1Items = selL0?.children || [];
  const l2Items = selL1?.children || [];

  return (
    <div style={{ marginBottom: 0 }}>
      {/* Selected breadcrumb badge */}
      {value && (
        <div style={css.breadcrumb}>
          <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 600 }}>
            📌 {breadcrumb || value}
          </span>
          <button type="button" onClick={clearAll} style={css.clearBtn} title="Clear selection">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Error state */}
      {error && !value && (
        <p style={{ fontSize: 12, color: "#b91c1c", margin: "0 0 6px", display: "flex", gap: 4 }}>
          <AlertCircle size={13} /> {error}
        </p>
      )}

      {/* Loading / fetch error */}
      {loading && (
        <div style={css.loadingBox}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>Loading subjects…</span>
        </div>
      )}

      {fetchErr && (
        <div style={css.fetchErrBox}>
          <AlertCircle size={14} color="#b91c1c" />
          <span style={{ flex: 1, fontSize: 12 }}>{fetchErr}</span>
          <button type="button" onClick={loadTree} style={{ ...css.btnGhost, padding: "3px 8px" }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* 3-column cascading picker */}
      {!loading && !fetchErr && (
        <div style={{
          border: `1px solid ${error && !value ? "#f87171" : "#e0e7ff"}`,
          borderRadius: 12,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          background: "white",
          boxShadow: "0 2px 8px rgba(99,102,241,0.06)",
        }}>
          {/* Column 0 — Domain */}
          <Column
            title="Domain"
            items={tree}
            selectedId={selL0?._id}
            onSelect={(n) => selectAndEmit(n, 0)}
            level={0}
            parentId={null}
            parentName={null}
            canPropose={true}
            emptyText="No domains loaded"
          />

          {/* Column 1 — Subject */}
          <Column
            title="Subject"
            items={l1Items}
            selectedId={selL1?._id}
            onSelect={(n) => selectAndEmit(n, 1)}
            level={1}
            parentId={selL0?._id}
            parentName={selL0?.name}
            canPropose={!!selL0}
            emptyText={selL0 ? "No subjects under this domain" : "← Select a domain first"}
          />

          {/* Column 2 — Sub-topic */}
          <Column
            title="Sub-topic (optional)"
            items={l2Items}
            selectedId={selL2?._id}
            onSelect={(n) => selectAndEmit(n, 2)}
            level={2}
            parentId={selL1?._id}
            parentName={selL1?.name}
            canPropose={!!selL1}
            emptyText={selL1 ? "No sub-topics yet" : "← Select a subject first"}
          />
        </div>
      )}

      {/* Guidance note */}
      {!loading && !fetchErr && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>
          💡 Select at any level — the most specific topic becomes your course subject. Can't find your topic? Click "Request new" in the relevant column.
        </p>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = {
  column: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #e5e7eb",
    minHeight: 280,
    maxHeight: 360,
  },
  colHeader: {
    padding: "8px 12px",
    background: "#f8f9ff",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 11,
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  colBody: {
    overflowY: "auto",
    flex: 1,
    padding: "6px 6px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 8px",
    borderRadius: 7,
    cursor: "pointer",
    transition: "background 0.12s",
    userSelect: "none",
    marginBottom: 1,
  },
  itemActive: {
    background: "#ede9fe",
    border: "1px solid #c4b5fd",
  },
  proposeBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 12px",
    fontSize: 11,
    color: "#6366f1",
    fontWeight: 600,
    cursor: "pointer",
    borderTop: "1px solid #f3f4f6",
    background: "#fafbff",
    flexShrink: 0,
    transition: "background 0.12s",
  },
  proposePanel: {
    padding: "10px 12px",
    borderTop: "1px solid #e0e7ff",
    background: "#fafbff",
    flexShrink: 0,
  },
  proposeHeading: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 700,
    color: "#1f2937",
  },
  msg: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    padding: "5px 8px",
    borderRadius: 6,
    marginBottom: 6,
  },
  input: {
    padding: "6px 9px",
    borderRadius: 7,
    border: "1px solid #d1d5db",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 12px",
    borderRadius: 7,
    border: "none",
    background: "#6366f1",
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flex: 1,
    justifyContent: "center",
  },
  btnGhost: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 10px",
    borderRadius: 7,
    border: "1px solid #d1d5db",
    background: "white",
    color: "#374151",
    fontSize: 12,
    cursor: "pointer",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#ede9fe",
    border: "1px solid #c4b5fd",
    borderRadius: 8,
    padding: "6px 12px",
    marginBottom: 8,
  },
  clearBtn: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#7c3aed",
    padding: 2,
  },
  loadingBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "20px",
    justifyContent: "center",
  },
  fetchErrBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 12,
    color: "#b91c1c",
  },
  emptyText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    padding: "20px 8px",
    margin: 0,
    fontStyle: "italic",
  },
};

export default SubjectPicker;
