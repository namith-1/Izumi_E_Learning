// frontend/src/components/CourseGroupChat.jsx
// Real-time group chat for a course — supports @mention (instructor/students) and #course tags.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../store";
import { MessageCircle, Send, X, ChevronDown, Users } from "lucide-react";

const API = BACKEND_URL.replace(/\/$/, "");

// ── Highlight @mentions and #tags in rendered messages ───────────────────────
const renderContent = (text) => {
  // @[Name](userId) → blue pill, #tag → purple tag
  const parts = [];
  const regex = /(@\[([^\]]+)\]\([^)]+\))|(#\w[\w-]*)/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) {
      parts.push(
        <span key={match.index} style={{ background: "#dbeafe", color: "#1d4ed8",
          borderRadius: 4, padding: "0 4px", fontSize: 12, fontWeight: 600 }}>
          @{match[2]}
        </span>
      );
    } else {
      parts.push(
        <span key={match.index} style={{ background: "#ede9fe", color: "#5b21b6",
          borderRadius: 4, padding: "0 4px", fontSize: 12, fontWeight: 600 }}>
          {match[0]}
        </span>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

// ── Single message bubble ─────────────────────────────────────────────────────
const Bubble = ({ msg, isOwn }) => (
  <div style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row",
    gap: 6, alignItems: "flex-end", marginBottom: 10 }}>
    {/* Avatar */}
    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: msg.senderRole === "teacher" ? "#6366f1" : "#10b981",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "white" }}>
      {(msg.senderName || "?")[0].toUpperCase()}
    </div>
    <div style={{ maxWidth: "72%" }}>
      {!isOwn && (
        <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 2px 2px" }}>
          {msg.senderName}
          {msg.senderRole === "teacher" && (
            <span style={{ background: "#ede9fe", color: "#6366f1", fontSize: 9,
              borderRadius: 4, padding: "1px 4px", marginLeft: 4, fontWeight: 700 }}>
              Instructor
            </span>
          )}
        </p>
      )}
      <div style={{
        background: isOwn ? "#6366f1" : "white",
        color: isOwn ? "white" : "#111827",
        borderRadius: isOwn ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        padding: "8px 12px", fontSize: 13, lineHeight: 1.45,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: isOwn ? "none" : "1px solid #e5e7eb",
      }}>
        {renderContent(msg.content)}
      </div>
      <p style={{ fontSize: 9, color: "#d1d5db", margin: "2px 4px 0",
        textAlign: isOwn ? "right" : "left" }}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const CourseGroupChat = ({ courseId, courseTitle }) => {
  const { user } = useSelector((s) => s.auth);
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [draft,    setDraft]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [mention,  setMention]  = useState(null);  // autocomplete state
  const [unread,   setUnread]   = useState(0);
  const socketRef  = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = io(API, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = s;
    s.emit("join-course-chat", courseId);
    s.on("group-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!open) setUnread((n) => n + 1);
    });
    return () => {
      s.emit("leave-course-chat", courseId);
      s.disconnect();
    };
  }, [courseId]);

  // ── Load history + members ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, memRes] = await Promise.all([
        fetch(`${API}/api/group-chat/${courseId}/messages?limit=50`, { credentials: "include" }),
        fetch(`${API}/api/group-chat/${courseId}/members`,           { credentials: "include" }),
      ]);
      if (msgRes.ok) setMessages(await msgRes.json());
      if (memRes.ok) { const d = await memRes.json(); setMembers(d.members || []); }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { if (open) { loadData(); setUnread(0); } }, [open, loadData]);

  // Auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ── Mention autocomplete ─────────────────────────────────────────────────────
  const handleInput = (e) => {
    const val = e.target.value;
    setDraft(val);
    // Check if last word starts with @
    const lastWord = val.split(/\s/).pop();
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const query = lastWord.slice(1).toLowerCase();
      setMention(members.filter(m => m.name.toLowerCase().includes(query)));
    } else {
      setMention(null);
    }
  };

  const insertMention = (member) => {
    // Replace the @partial at end with proper mention token
    const words = draft.split(/(\s)/);
    words[words.length - 1] = `@[${member.name}](${member.id}) `;
    setDraft(words.join(""));
    setMention(null);
    inputRef.current?.focus();
  };

  const insertTag = () => {
    setDraft((d) => d + `#${(courseTitle || "course").replace(/\s+/g, "-").toLowerCase()} `);
    inputRef.current?.focus();
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${API}/api/group-chat/${courseId}/messages`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      });
      setDraft("");
      setMention(null);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setMention(null);
  };

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button onClick={() => { setOpen(o => !o); setUnread(0); }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none", cursor: "pointer", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        <MessageCircle size={22} />
        {unread > 0 && (
          <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16,
            background: "#ef4444", borderRadius: "50%", fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 999,
          width: 360, height: 500, background: "#f9fafb",
          borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <MessageCircle size={16} color="white" />
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>
                Course Chat
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, margin: 0 }}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
                borderRadius: 6, padding: "4px 6px", color: "white" }}>
              <X size={13} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {loading && <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading…</p>}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: "center", padding: 30 }}>
                <MessageCircle size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <Bubble key={msg._id} msg={msg} isOwn={msg.senderId === user?._id || msg.senderId === user?.id} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Mention autocomplete dropdown */}
          {mention && mention.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8,
              margin: "0 10px 4px", maxHeight: 140, overflowY: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {mention.map((m) => (
                <button key={m.id} onClick={() => insertMention(m)}
                  style={{ width: "100%", textAlign: "left", padding: "7px 12px",
                    border: "none", background: "none", cursor: "pointer", fontSize: 12,
                    display: "flex", alignItems: "center", gap: 8,
                    color: "#111827" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%",
                    background: m.role === "teacher" ? "#6366f1" : "#10b981",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0 }}>
                    {m.name[0].toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  {m.role === "teacher" && (
                    <span style={{ fontSize: 9, background: "#ede9fe", color: "#6366f1",
                      borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>Instructor</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #e5e7eb",
            background: "white", display: "flex", gap: 6, alignItems: "flex-end" }}>
            {/* Tag course button */}
            <button onClick={insertTag} title={`Tag #${courseTitle}`}
              style={{ flexShrink: 0, padding: "7px 8px", borderRadius: 8,
                border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer",
                fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
              #
            </button>
            <textarea ref={inputRef} value={draft} onChange={handleInput} onKeyDown={handleKey}
              placeholder="Message… @ to mention, # to tag course"
              rows={1}
              style={{ flex: 1, resize: "none", border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "inherit",
                lineHeight: 1.4, maxHeight: 80, overflowY: "auto" }} />
            <button onClick={handleSend} disabled={sending || !draft.trim()}
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                background: draft.trim() ? "#6366f1" : "#e5e7eb",
                border: "none", cursor: draft.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s" }}>
              <Send size={15} color={draft.trim() ? "white" : "#9ca3af"} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseGroupChat;
