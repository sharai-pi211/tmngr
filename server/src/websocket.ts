import { WebSocketServer, WebSocket } from "ws";
import pool from "./db.js"; // Assuming you're using a pool instance for database queries.

const clients = new Map<string, WebSocket>();

export const initializeWebSocketServer = (server: any) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req) => {
    const params = new URLSearchParams(req.url?.split("?")[1]);
    const userId = params.get("userId");

    if (userId) {
      clients.set(userId, ws);
      console.log(`User ${userId} connected`);

      // Handle incoming WebSocket messages
      ws.on("message", async (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          const { event, data } = parsedMessage;

          if (event === "send_message") {
            const { teamId, content } = data;

            if (!teamId || !content) {
              console.error("Invalid message data");
              return;
            }

            // Save the chat message to the database
            const newMessage = await pool.query(
              "INSERT INTO messages (team_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
              [teamId, userId, content]
            );

            console.log(newMessage);

            // Broadcast the message to all users in the team
            clients.forEach((clientWs, clientId) => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    event: "new_message",
                    data: {
                      id: newMessage.rows[0].id,
                      content: newMessage.rows[0].content,
                      sender: userId,
                      teamId, // Добавляем teamId, чтобы клиенты могли фильтровать сообщения
                      created_at: newMessage.rows[0].created_at,
                    },
                  })
                );
              }
            });
          } else if (event === "notify_user") {
            // Individual notification logic
            const { recipientId, title, message } = data;

            if (!recipientId || !title || !message) {
              console.error("Invalid notification data");
              return;
            }

            notifyUser(recipientId, "notification", {
              title,
              message,
            });
          }
        } catch (err) {
          console.error("Error handling WebSocket message:", err);
        }
      });

      ws.on("close", () => {
        clients.delete(userId);
        console.log(`User ${userId} disconnected`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });
    }
  });

  return wss;
};

export const notifyUser = (userId: string, event: string, data: any) => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data }));
    console.log(`Notification sent to user ${userId}:`, data);
  }
};

export const broadcast = (event: string, data: any) => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  });
};
