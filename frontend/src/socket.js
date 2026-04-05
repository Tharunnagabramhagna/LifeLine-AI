import { io } from "socket.io-client";

// Connect to the backend server dynamically relative to the host
export const socket = io("http://localhost:5005", {
  withCredentials: true,
});

