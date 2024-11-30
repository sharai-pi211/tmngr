import express from "express";
import http from "http";
import cors from "cors";
import { testConnection } from "./db.js";
import authRoutes from "./auth.js";
import UpdateRoutes from "./updateAccount.js";
import teamRoutes from "./routes/teamRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import tasksRoutes from "./routes/tasksRoutes.js";
import { initializeWebSocketServer } from "./websocket.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/update", UpdateRoutes);
app.use("/team", teamRoutes);
app.use("/users", usersRoutes);
app.use("/tasks", tasksRoutes);
app.use("/chat", chatRoutes);

const server = http.createServer(app);

initializeWebSocketServer(server);

const startServer = async () => {
  await testConnection();
  server.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
  });
};

startServer();
