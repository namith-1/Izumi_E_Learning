// frontend/src/components/TopicPreferences.jsx
// Shared preferences picker — uses the canonical /api/subjects flat list.
// Works for Student (interests) and Instructor/Reviewer (specialization).

import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Sparkles, Search } from "lucide-react";
import { BACKEND_URL } from "../store";

const API = BACKEND_URL.replace(/\/$/, "") + "/api";

// ── Component ──────────────────────────────────────────────────────────────────
/**
 * Props:
 *   selected    — string[]  current selected topic NAMES (stored as name for simplicity)
 *   onChange    — (names[]) => void
 *   label       — string
 *   description — string
 *   max         — number  (default 10)
 */
const TopicPreferences = ({
  selected = [],
  onChange,
  label = "Topic Preferences",
  description = "Choose topics you are interested in",
  max = 10,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeGroup, setActiveGroup] = useState("All");
  const [query, setQuery] = useState("");
  const [allTopics, setAllTopics] = useState([]);   // flat list from API
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Fetch flat approved subject list
  useEffect(() => {
    if (!expanded) return; // lazy-load on open
    if (allTopics.length > 0) return;
    setLoadingTopics(true);
    fetch(`${API}/subjects/flat`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setAllTopics(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingTopics(false));
  }, [expanded, allTopics.length]);

  // Derive unique groups (level-0 domains → use parentId === null)
  // For display we group by level-0 name if we can derive it
  const rootNames = allTopics.filter((t) => t.level === 0).map((t) => t.name);
  const getGroup = (topic) => {
    if (topic.level === 0) return topic.name;
    // Walk path: first segment → look for root with that slug
    const firstSlug = topic.path?.split(".")[0];
    const root = allTopics.find((t) => t.slug === firstSlug && t.level === 0);
    return root ? root.name : "Other";
  };
  const groups = ["All", ...rootNames];

  const filteredTopics = allTopics.filter((t) => {
    const matchGroup = activeGroup === "All" || getGroup(t) === activeGroup;
    const matchQuery = !query || t.name.toLowerCase().includes(query.toLowerCase());
    return matchGroup && matchQuery;
  });

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name));
    } else {
      if (selected.length >= max) return;
      onChange([...selected, name]);
    }
  };

  const selectedTopics = allTopics.filter((t) => selected.includes(t.name));
  // Also keep any selected names that aren't in the list (edge case: old free-text values)
  const legacySelected = selected.filter((s) => !allTopics.find((t) => t.name === s));

  return (
    <div style={styles.wrapper}>
      {/* Header row */}
      <div style={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#6366f1" />
          <div>
            <p style={styles.heading}>{label}</p>
            <p style={styles.subheading}>{description}</p>
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((p) => !p)} style={styles.expandBtn}>
          {expanded ? <><span>Hide</span><ChevronUp size={14} /></> : <><span>Edit</span><ChevronDown size={14} /></>}
        </button>
      </div>

      {/* Selected chips — always visible */}
      <div style={styles.chipsRow}>
        {selected.length === 0 ? (
          <span style={styles.emptyHint}>No topics selected yet — click Edit to choose</span>
        ) : (
          <>
            {selectedTopics.map((t) => (
              <span key={t._id} style={styles.chip}>
                {t.emoji} {t.name}
                <button type="button" onClick={() => toggle(t.name)} style={styles.chipX} title="Remove">
                  <X size={11} />
                </button>
              </span>
            ))}
            {legacySelected.map((name) => (
              <span key={name} style={{ ...styles.chip, background: "linear-gradient(135deg,#6b7280,#9ca3af)" }}>
                {name}
                <button type="button" onClick={() => onChange(selected.filter((s) => s !== name))} style={styles.chipX} title="Remove">
                  <X size={11} />
                </button>
              </span>
            ))}
            <span style={styles.counter}>{selected.length}/{max}</span>
          </>
        )}
      </div>

      {/* Expanded picker */}
      {expanded && (
        <div style={styles.pickerBox}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
            <Search size={13} color="#9ca3af" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics..."
              style={{ border: "none", outline: "none", flex: 1, fontSize: 12, color: "#374151" }} />
            {query && <X size={12} style={{ cursor: "pointer", color: "#9ca3af" }} onClick={() => setQuery("")} />}
          </div>

          {/* Group filter tabs */}
          <div style={styles.groupRow}>
            {groups.map((g) => (
              <button type="button" key={g} onClick={() => setActiveGroup(g)}
                style={{ ...styles.groupTab, ...(activeGroup === g ? styles.groupTabActive : {}) }}>
                {g}
              </button>
            ))}
          </div>

          {/* Topic grid */}
          {loadingTopics ? (
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Loading subjects...</p>
          ) : (
            <div style={styles.topicGrid}>
              {filteredTopics.map((t) => {
                const isSel = selected.includes(t.name);
                const isDisabled = !isSel && selected.length >= max;
                return (
                  <button type="button" key={t._id}
                    onClick={() => !isDisabled && toggle(t.name)}
                    disabled={isDisabled}
                    title={isDisabled ? `Max ${max} topics` : t.name}
                    style={{ ...styles.topicBtn, ...(isSel ? styles.topicBtnActive : {}), ...(isDisabled ? styles.topicBtnDisabled : {}) }}>
                    <span style={{ fontSize: 18 }}>{t.emoji || "📚"}</span>
                    <span style={styles.topicLabel}>{t.name}</span>
                    {isSel && <span style={styles.checkMark}>✓</span>}
                  </button>
                );
              })}
              {filteredTopics.length === 0 && (
                <p style={{ fontSize: 12, color: "#9ca3af", gridColumn: "1/-1", padding: "12px 0" }}>No topics match your search.</p>
              )}
            </div>
          )}

          {selected.length >= max && (
            <p style={styles.limitNote}>Maximum of {max} topics selected. Remove one to add another.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: { border: "1px solid #e0e7ff", borderRadius: 12, background: "#fafbff", padding: "16px 18px", marginBottom: 20 },
  headerRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  heading: { margin: 0, fontWeight: 700, fontSize: 14, color: "#1f2937" },
  subheading: { margin: "2px 0 0", fontSize: 12, color: "#6b7280" },
  expandBtn: { display: "flex", alignItems: "center", gap: 4, background: "#ede9fe", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#5b21b6", cursor: "pointer", flexShrink: 0 },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 28 },
  chip: { display: "inline-flex", alignItems: "center", gap: 5, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 500 },
  chipX: { background: "rgba(255,255,255,0.3)", border: "none", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", padding: 0, flexShrink: 0 },
  emptyHint: { fontSize: 12, color: "#9ca3af", fontStyle: "italic" },
  counter: { fontSize: 11, color: "#9ca3af", marginLeft: 4 },
  pickerBox: { marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 14 },
  groupRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  groupTab: { padding: "4px 12px", borderRadius: 20, border: "1px solid #d1d5db", background: "white", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#6b7280" },
  groupTabActive: { background: "#6366f1", color: "#fff", border: "1px solid #6366f1" },
  topicGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 },
  topicBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: 12, color: "#374151", fontWeight: 500, textAlign: "left", transition: "all 0.15s", position: "relative" },
  topicBtnActive: { background: "#ede9fe", border: "1px solid #a78bfa", color: "#5b21b6" },
  topicBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  topicLabel: { flex: 1, lineHeight: 1.3 },
  checkMark: { fontSize: 11, color: "#7c3aed", fontWeight: 700 },
  limitNote: { marginTop: 10, fontSize: 12, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "6px 10px" },
};

export default TopicPreferences;
