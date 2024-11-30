import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext<WebSocket | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const userId = user && user.id ? String(user.id) : null;

  useEffect(() => {
    if (!ws && userId) {
      const socket = new WebSocket(`ws://localhost:5000/ws?userId=${userId}`);

      socket.onopen = () => {
        console.log("WebSocket connected for user:", userId);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed for user:", userId);
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);
      };

      setWs(socket);
      wsRef.current = socket;
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        console.log("WebSocket connection closed.");
      }
    };
  }, [ws, userId]);

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
};
