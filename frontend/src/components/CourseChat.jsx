// frontend/src/components/CourseChat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { connectSocket } from "../utils/socketService";
import { MessageCircle, Send, X, CheckCheck, Check } from "lucide-react";
import "../pages/css/CourseChat.css";

const BASE_URL = "http://localhost:5000/api";

// Relative time helper
const relativeTime = (dateStr) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

// Date divider helper
const getDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const CourseChat = ({ courseId, otherUserId, otherUserName, otherUserRole }) => {
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isOnline, setIsOnline] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimerRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Load chat history via REST
    const loadHistory = useCallback(async () => {
        if (!courseId || !otherUserId) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${BASE_URL}/chat/${courseId}/messages?otherUserId=${otherUserId}&limit=100`,
                { credentials: "include" },
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to load chat history:", err);
        }
        setLoading(false);
    }, [courseId, otherUserId]);

    // Connect socket and join DM room
    useEffect(() => {
        if (!courseId || !otherUserId || !user) return;

        const socket = connectSocket();
        socketRef.current = socket;

        socket.emit("join-dm", { courseId, otherUserId });

        // Listen for events
        socket.on("new-message", (msg) => {
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
            // If panel is open, mark as read
            if (isOpen && msg.senderId !== user.id) {
                socket.emit("mark-read", { courseId, otherUserId });
            } else if (!isOpen && msg.senderId !== user.id) {
                setUnreadCount((c) => c + 1);
            }
        });

        socket.on("user-status", (data) => {
            if (data.userId === otherUserId) {
                setIsOnline(data.online);
            }
        });

        socket.on("user-typing", (data) => {
            if (data.userId === otherUserId) {
                setTypingUser(data.userName);
            }
        });

        socket.on("user-stop-typing", (data) => {
            if (data.userId === otherUserId) {
                setTypingUser(null);
            }
        });

        socket.on("messages-read", () => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.senderId === user.id ? { ...m, read: true } : m,
                ),
            );
        });

        socket.on("chat-error", (err) => {
            console.error("Chat error:", err.message);
        });

        loadHistory();

        return () => {
            socket.off("new-message");
            socket.off("user-status");
            socket.off("user-typing");
            socket.off("user-stop-typing");
            socket.off("messages-read");
            socket.off("chat-error");
        };
    }, [courseId, otherUserId, user]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // When panel opens, mark as read and reset unread
    useEffect(() => {
        if (isOpen && socketRef.current && otherUserId) {
            socketRef.current.emit("mark-read", { courseId, otherUserId });
            setUnreadCount(0);
        }
    }, [isOpen, courseId, otherUserId]);

    const handleSend = () => {
        if (!input.trim() || !socketRef.current) return;
        socketRef.current.emit("send-message", {
            courseId,
            receiverId: otherUserId,
            content: input.trim(),
        });
        socketRef.current.emit("stop-typing", { courseId, receiverId: otherUserId });
        setInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (socketRef.current) {
            socketRef.current.emit("typing", { courseId, receiverId: otherUserId });
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
                socketRef.current?.emit("stop-typing", { courseId, receiverId: otherUserId });
            }, 2000);
        }
    };

    // Group messages by date
    let lastDate = null;

    if (!user) return null;

    return (
        <>
            {/* FAB Toggle */}
            <button className="chat-fab" onClick={() => setIsOpen(!isOpen)} title="Chat">
                <MessageCircle size={24} />
                {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
            </button>

            {/* Overlay */}
            <div
                className={`chat-overlay ${isOpen ? "open" : ""}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Chat Panel */}
            <div className={`chat-panel ${isOpen ? "open" : ""}`}>
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <span className={`online-dot ${isOnline ? "online" : "offline"}`} />
                        <h4>
                            {otherUserName || "Chat"}
                            {otherUserRole === "teacher" && (
                                <span className="instructor-badge">Instructor</span>
                            )}
                        </h4>
                    </div>
                    <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {loading && <div className="chat-empty"><p>Loading...</p></div>}
                    {!loading && messages.length === 0 && (
                        <div className="chat-empty">
                            <MessageCircle size={40} />
                            <p>No messages yet. Say hello! 👋</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => {
                        const isOwn = msg.senderId === user.id;
                        const dateLabel = getDateLabel(msg.createdAt);
                        let showDate = false;
                        if (dateLabel !== lastDate) {
                            showDate = true;
                            lastDate = dateLabel;
                        }

                        return (
                            <React.Fragment key={msg._id || idx}>
                                {showDate && <div className="chat-date-divider">{dateLabel}</div>}
                                <div className={`chat-msg ${isOwn ? "own" : "other"}`}>
                                    {!isOwn && (
                                        <div className="msg-sender">
                                            {msg.senderName}
                                            {msg.senderRole === "teacher" && (
                                                <span className="instructor-badge">Instructor</span>
                                            )}
                                        </div>
                                    )}
                                    <div>{msg.content}</div>
                                    <div className="msg-meta">
                                        <span>{relativeTime(msg.createdAt)}</span>
                                        {isOwn && (
                                            <span className="read-indicator">
                                                {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing indicator */}
                <div className="chat-typing">
                    {typingUser ? `${typingUser} is typing...` : ""}
                </div>

                {/* Input */}
                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim()}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default CourseChat;
