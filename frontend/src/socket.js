import { io } from "socket.io-client";

// Connect to the backend server dynamically relative to the host
export const socket = io(window.location.hostname === 'localhost' ? "http://localhost:5000" : "/", {
  withCredentials: true,
});
