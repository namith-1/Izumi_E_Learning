import { io } from "socket.io-client";
import { BACKEND_URL, getStoredAuthToken } from "../store";

const SOCKET_URL = BACKEND_URL;

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            auth: { token: getStoredAuthToken() },
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });
    }
    return socket;
};

export const connectSocket = () => {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    return s;
};

export const disconnectSocket = () => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};

export default { getSocket, connectSocket, disconnectSocket };
