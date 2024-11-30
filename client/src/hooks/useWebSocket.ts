import { useEffect } from "react";

// Define the type for the task assigned data
interface TaskAssignedData {
  taskId: number;
  title: string;
  message: string;
}

// Define the type for the WebSocket message
interface WebSocketMessage {
  event: string;
  data: TaskAssignedData;
}

// WebSocket Hook
const useWebSocket = (
  userId: string, // Ensure userId is a string
  onTaskAssigned: (task: TaskAssignedData) => void // Callback to handle task assignments
) => {
  useEffect(() => {
    const WS_URL = "ws://localhost:5000/ws"; // Replace with your WebSocket URL
    const socket = new WebSocket(`${WS_URL}?userId=${userId}`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      if (message.event === "task_assigned") {
        console.log("New task assigned:", message.data);

        // Call the callback function
        if (onTaskAssigned) {
          onTaskAssigned(message.data);
        }
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup when the component is unmounted
    return () => {
      socket.close();
    };
  }, [userId, onTaskAssigned]);
};

export default useWebSocket;
