// Import the Socket.io client library and project API helpers.
import { io } from "socket.io-client";
import { adminUrl, getAuthToken } from "./apiHelper";

// Extract the base server URL from the adminUrl by stripping the path suffix.
// WHY: The adminUrl points to the REST API endpoints (e.g. "/api/v1/admin"),
// but Socket.io must connect to the root domain of the backend server.
// WHAT PROBLEM IT SOLVES: Solves hardcoding the backend server URL, making
// the client portable across local, staging, and production environments.
// HOW IT WORKS: Replaces "/api/v1/admin" or "/api/v1" at the end of the adminUrl
// with an empty string, yielding the host URL.
const socketUrl = adminUrl.replace(/\/api\/v1\/admin$/, "").replace(/\/api\/v1$/, "");

// Singleton instance container.
// WHY: We must not create duplicate socket instances during page navigation or re-renders.
// WHAT PROBLEM IT SOLVES: Prevents multiple active WebSocket connections, which would
// exhaust server connection pools and cause duplicate event triggers.
// HOW IT WORKS: The variable holds a reference to the active socket. Subsequent calls
// to getSocket retrieve this single shared instance.
let socket = null;

/**
 * Retrieves the shared Socket.io client singleton.
 * Configures the auth details dynamically to support user context changes.
 * 
 * WHY: This function manages the lifecycle of the Socket.io connection instance.
 * WHAT PROBLEM IT SOLVES: Handles cases where user authentication tokens change
 * (e.g., login/logout) without recreating the socket connection container itself.
 * HOW IT WORKS: Initializes the socket connection if it does not exist. On every request,
 * it updates the auth token and query parameters, then returns the socket instance.
 */
export const getSocket = () => {
  const token = getAuthToken();
  const appName = typeof window !== "undefined" ? localStorage.getItem("selectedAdminApp") || "0" : "0";

  if (!socket) {
    socket = io(socketUrl, {
      auth: {
        token: token,
        appName: appName,
      },
      query: {
        token: token,
        appName: appName,
      },
      transports: ["websocket", "polling"],
      autoConnect: false, // Page components will explicitly call connect()
    });
  } else {
    // Dynamically update authorization settings on the existing socket container.
    socket.auth = {
      token: token,
      appName: appName,
    };
    if (socket.io && socket.io.opts) {
      socket.io.opts.query = {
        token: token,
        appName: appName,
      };
    }
  }

  return socket;
};
