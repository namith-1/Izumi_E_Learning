// backend/sockets/chatSocket.js
const Message = require("../models/Message");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

const markOnline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
};

const markOffline = (userId, socketId) => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) onlineUsers.delete(userId);
    }
};

const isOnline = (userId) => onlineUsers.has(userId);

// Build a deterministic room name for a 1:1 DM in a course
const dmRoom = (courseId, userA, userB) => {
    const sorted = [String(userA), String(userB)].sort();
    return `dm:${courseId}:${sorted[0]}:${sorted[1]}`;
};

module.exports = function registerChatHandlers(io) {
    io.on("connection", (socket) => {
        const session = socket.request.session;
        if (!session || !session.user) {
            socket.disconnect(true);
            return;
        }

        const userId = session.user.id;
        const userRole = session.user.role; // "student" | "teacher"
        const userName = session.user.name || "Unknown";

        markOnline(userId, socket.id);

        // ——— JOIN A DM ROOM ———————————————————————————————————————
        socket.on("join-dm", async ({ courseId, otherUserId }) => {
            try {
                // Verify access: student must be enrolled, teacher must own the course
                if (userRole === "student") {
                    const enrolled = await Enrollment.findOne({
                        courseId,
                        studentId: userId,
                    });
                    if (!enrolled) {
                        socket.emit("chat-error", { message: "Not enrolled in this course." });
                        return;
                    }
                } else if (userRole === "teacher") {
                    const course = await Course.findOne({ _id: courseId, teacherId: userId });
                    if (!course) {
                        socket.emit("chat-error", { message: "You don't own this course." });
                        return;
                    }
                }

                const room = dmRoom(courseId, userId, otherUserId);
                socket.join(room);

                // Notify the other user's online status
                socket.emit("user-status", {
                    userId: otherUserId,
                    online: isOnline(otherUserId),
                });

                // Broadcast own online status to the room
                socket.to(room).emit("user-status", {
                    userId,
                    online: true,
                });
            } catch (err) {
                socket.emit("chat-error", { message: "Failed to join chat." });
            }
        });

        // ——— SEND MESSAGE ————————————————————————————————————————
        socket.on("send-message", async ({ courseId, receiverId, content }) => {
            try {
                if (!content || !content.trim()) return;

                const message = await Message.create({
                    courseId,
                    senderId: userId,
                    receiverId,
                    senderRole: userRole,
                    senderName: userName,
                    content: content.trim().substring(0, 2000),
                });

                const room = dmRoom(courseId, userId, receiverId);
                const msgData = message.toObject();

                // Send to both parties in the room
                io.to(room).emit("new-message", msgData);

                // Also emit to receiver's personal channel for unread badge updates
                io.to(`user:${receiverId}`).emit("unread-update", {
                    courseId,
                    senderId: userId,
                    senderName: userName,
                });
            } catch (err) {
                socket.emit("chat-error", { message: "Failed to send message." });
            }
        });

        // ——— MARK MESSAGES AS READ ———————————————————————————————
        socket.on("mark-read", async ({ courseId, otherUserId }) => {
            try {
                await Message.updateMany(
                    {
                        courseId,
                        senderId: otherUserId,
                        receiverId: userId,
                        read: false,
                    },
                    { $set: { read: true } },
                );

                const room = dmRoom(courseId, userId, otherUserId);
                socket.to(room).emit("messages-read", {
                    readBy: userId,
                    courseId,
                });
            } catch (err) {
                // silent
            }
        });

        // ——— TYPING INDICATOR ————————————————————————————————————
        socket.on("typing", ({ courseId, receiverId }) => {
            const room = dmRoom(courseId, userId, receiverId);
            socket.to(room).emit("user-typing", { userId, userName });
        });

        socket.on("stop-typing", ({ courseId, receiverId }) => {
            const room = dmRoom(courseId, userId, receiverId);
            socket.to(room).emit("user-stop-typing", { userId });
        });

        // ——— JOIN PERSONAL CHANNEL (for unread notifications) ———
        socket.join(`user:${userId}`);

        // ——— DISCONNECT ——————————————————————————————————————————
        socket.on("disconnect", () => {
            markOffline(userId, socket.id);

            // Broadcast offline status to all rooms this socket was in
            for (const room of socket.rooms) {
                if (room.startsWith("dm:")) {
                    socket.to(room).emit("user-status", {
                        userId,
                        online: false,
                    });
                }
            }
        });
    });
};
