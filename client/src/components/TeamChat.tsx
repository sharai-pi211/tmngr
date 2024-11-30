import React, { useState, useEffect } from "react";
import { useWebSocket } from "./WebSocketContext";

interface Message {
  id: number;
  content: string;
  sender: string;
  created_at: string;
}

const TeamChat: React.FC = () => {
  const teamId = localStorage.getItem("selectedTeamId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const ws = useWebSocket();

  useEffect(() => {
    const fetchMessages = async () => {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");

      try {
        const response = await fetch(`http://localhost:5000/chat/${teamId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setMessages(data.messages);
        } else {
          console.error("Failed to fetch messages");
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [teamId]);

  useEffect(() => {
    if (!ws) return;
  
    ws.onmessage = (event) => {
      const { event: eventType, data } = JSON.parse(event.data);
  
      if (eventType === "new_message" && data.teamId === teamId) {
        setMessages((prev) => [...prev, data]);
      }
    };
  
    return () => {
      if (ws) ws.onmessage = null;
    };
  }, [ws, teamId]);
  

  const sendMessage = () => {
    if (!ws || !input.trim() || !teamId) return;
  
    // Создаем объект сообщения
    const messageData = {
      event: "send_message",
      data: {
        teamId,
        content: input,
      },
    };
  
    // // Добавляем сообщение в состояние (оптимистичное обновление)
    // setMessages((prev) => [
    //   ...prev,
    //   {
    //     id: Date.now(), // Генерируем временный ID (потом можно заменить)
    //     content: input,
    //     sender: "You", // Замените на реальное имя пользователя, если нужно
    //     created_at: new Date().toISOString(),
    //   },
    // ]);
  
    // Отправляем сообщение через WebSocket
    ws.send(JSON.stringify(messageData));
  
    // Очищаем поле ввода
    setInput("");
  };  

  return (
    <div>
      <h2>Team Chat</h2>
      <div style={{ maxHeight: "400px", overflowY: "scroll" }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender}:</strong> {msg.content}
            <div style={{ fontSize: "0.8em", color: "gray" }}>
              {new Date(msg.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default TeamChat;
