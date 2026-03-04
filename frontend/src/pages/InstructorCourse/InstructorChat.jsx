// frontend/src/pages/InstructorCourse/InstructorChat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { connectSocket } from "../../utils/socketService";
import {
    MessageCircle, Send, X, CheckCheck, Check, Users, ArrowLeft,
} from "lucide-react";
import "../../pages/css/CourseChat.css";

const BASE_URL = "http://localhost:5000/api";

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

const getDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const InstructorChat = () => {
    const { courseId } = useParams();
    const { user } = useSelector((state) => state.auth);
    const [conversations, setConversations] = useState([]);
    const [activeStudent, setActiveStudent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isOnline, setIsOnline] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [loadingConvs, setLoadingConvs] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimerRef = useRef(null);
    const prevStudentRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Load conversation list
    const loadConversations = useCallback(async () => {
        if (!courseId) return;
        setLoadingConvs(true);
        try {
            const res = await fetch(`${BASE_URL}/chat/${courseId}/conversations`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error("Failed to load conversations:", err);
        }
        setLoadingConvs(false);
    }, [courseId]);

    // Load messages for active student
    const loadMessages = useCallback(async (studentId) => {
        if (!courseId || !studentId) return;
        setLoadingMsgs(true);
        try {
            const res = await fetch(
                `${BASE_URL}/chat/${courseId}/messages?otherUserId=${studentId}&limit=100`,
                { credentials: "include" },
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to load messages:", err);
        }
        setLoadingMsgs(false);
    }, [courseId]);

    // Connect socket
    useEffect(() => {
        if (!user || !courseId) return;
        const socket = connectSocket();
        socketRef.current = socket;

        socket.on("new-message", (msg) => {
            // If it's from/to the active student, add to messages
            if (
                activeStudent &&
                (msg.senderId === activeStudent.studentId ||
                    msg.receiverId === activeStudent.studentId)
            ) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }

            // Update conversation list (bump to top, update unread)
            setConversations((prev) => {
                const studentId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
                const existing = prev.find((c) => c.studentId === studentId);
                if (existing) {
                    return [
                        {
                            ...existing,
                            lastMessage: msg.content,
                            lastMessageAt: msg.createdAt,
                            unreadCount:
                                msg.senderId !== user.id &&
                                    (!activeStudent || activeStudent.studentId !== studentId)
                                    ? existing.unreadCount + 1
                                    : existing.unreadCount,
                        },
                        ...prev.filter((c) => c.studentId !== studentId),
                    ];
                } else if (msg.senderId !== user.id) {
                    // New conversation from a student
                    return [
                        {
                            studentId: msg.senderId,
                            studentName: msg.senderName,
                            lastMessage: msg.content,
                            lastMessageAt: msg.createdAt,
                            unreadCount: 1,
                        },
                        ...prev,
                    ];
                }
                return prev;
            });
        });

        socket.on("user-status", (data) => {
            if (activeStudent && data.userId === activeStudent.studentId) {
                setIsOnline(data.online);
            }
        });

        socket.on("user-typing", (data) => {
            if (activeStudent && data.userId === activeStudent.studentId) {
                setTypingUser(data.userName);
            }
        });

        socket.on("user-stop-typing", (data) => {
            if (activeStudent && data.userId === activeStudent.studentId) {
                setTypingUser(null);
            }
        });

        socket.on("messages-read", () => {
            setMessages((prev) =>
                prev.map((m) => (m.senderId === user.id ? { ...m, read: true } : m)),
            );
        });

        loadConversations();

        return () => {
            socket.off("new-message");
            socket.off("user-status");
            socket.off("user-typing");
            socket.off("user-stop-typing");
            socket.off("messages-read");
        };
    }, [user, courseId, activeStudent]);

    // When active student changes, join DM room and load messages
    useEffect(() => {
        if (!activeStudent || !socketRef.current) return;

        // Leave previous room
        if (prevStudentRef.current && prevStudentRef.current !== activeStudent.studentId) {
            // Socket.IO handles room cleanup automatically
        }
        prevStudentRef.current = activeStudent.studentId;

        socketRef.current.emit("join-dm", {
            courseId,
            otherUserId: activeStudent.studentId,
        });
        socketRef.current.emit("mark-read", {
            courseId,
            otherUserId: activeStudent.studentId,
        });

        // Clear unread for this student
        setConversations((prev) =>
            prev.map((c) =>
                c.studentId === activeStudent.studentId ? { ...c, unreadCount: 0 } : c,
            ),
        );

        loadMessages(activeStudent.studentId);
        setTypingUser(null);
    }, [activeStudent, courseId, loadMessages]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = () => {
        if (!input.trim() || !socketRef.current || !activeStudent) return;
        socketRef.current.emit("send-message", {
            courseId,
            receiverId: activeStudent.studentId,
            content: input.trim(),
        });
        socketRef.current.emit("stop-typing", {
            courseId,
            receiverId: activeStudent.studentId,
        });
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
        if (socketRef.current && activeStudent) {
            socketRef.current.emit("typing", {
                courseId,
                receiverId: activeStudent.studentId,
            });
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
                socketRef.current?.emit("stop-typing", {
                    courseId,
                    receiverId: activeStudent.studentId,
                });
            }, 2000);
        }
    };

    let lastDate = null;

    if (!user) return null;

    return (
        <div className="instructor-chat-layout">
            {/* Sidebar: Conversation list */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h3>💬 Messages</h3>
                    <p>{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="chat-conv-list">
                    {loadingConvs && (
                        <div style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>Loading...</div>
                    )}
                    {!loadingConvs && conversations.length === 0 && (
                        <div style={{ padding: 24, color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
                            <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <p>No messages yet</p>
                        </div>
                    )}
                    {conversations.map((conv) => (
                        <div
                            key={conv.studentId}
                            className={`chat-conv-item ${activeStudent?.studentId === conv.studentId ? "active" : ""}`}
                            onClick={() =>
                                setActiveStudent({
                                    studentId: conv.studentId,
                                    studentName: conv.studentName,
                                })
                            }
                        >
                            <div className="chat-conv-avatar">
                                {(conv.studentName || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-conv-details">
                                <p className="chat-conv-name">{conv.studentName}</p>
                                <p className="chat-conv-preview">
                                    {conv.lastSenderRole === "teacher" && "You: "}
                                    {conv.lastMessage}
                                </p>
                            </div>
                            <div className="chat-conv-meta">
                                <span className="chat-conv-time">{relativeTime(conv.lastMessageAt)}</span>
                                {conv.unreadCount > 0 && (
                                    <span className="chat-conv-unread">{conv.unreadCount}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main chat area */}
            <div className="chat-main">
                {!activeStudent ? (
                    <div className="chat-main-empty">
                        <div style={{ textAlign: "center" }}>
                            <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="chat-header" style={{ borderRadius: 0 }}>
                            <div className="chat-header-info">
                                <button
                                    className="chat-close-btn"
                                    style={{ marginRight: 4 }}
                                    onClick={() => setActiveStudent(null)}
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <span className={`online-dot ${isOnline ? "online" : "offline"}`} />
                                <h4>{activeStudent.studentName}</h4>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {loadingMsgs && (
                                <div className="chat-empty"><p>Loading...</p></div>
                            )}
                            {!loadingMsgs && messages.length === 0 && (
                                <div className="chat-empty">
                                    <MessageCircle size={40} />
                                    <p>No messages yet with this student.</p>
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
                                            {!isOwn && <div className="msg-sender">{msg.senderName}</div>}
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

                        {/* Typing */}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default InstructorChat;
