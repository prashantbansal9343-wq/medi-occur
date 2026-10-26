import { io } from "socket.io-client";

let socket;

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
