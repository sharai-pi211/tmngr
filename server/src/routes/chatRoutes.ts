import express, { Request, Response } from "express";
import pool from "../db.js";
import { authenticateToken } from "../authMiddleware.js";

const chatRouter = express.Router();

// Получить сообщения команды
chatRouter.get("/:teamId", authenticateToken, async (req: Request, res: Response) => {
    const { teamId } = req.params;

    try {
        const messages = await pool.query(
            "SELECT messages.id, messages.content, messages.created_at, users.username AS sender FROM messages JOIN users ON messages.user_id = users.id WHERE messages.team_id = $1 ORDER BY messages.created_at ASC",
            [teamId]
        );

        res.status(200).json({ messages: messages.rows });
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Отправить сообщение
chatRouter.post("/:teamId", authenticateToken, async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { userId, content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Message content cannot be empty" });
    }

    try {
        const newMessage = await pool.query(
            "INSERT INTO messages (team_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
            [teamId, userId, content]
        );

        res.status(201).json({ message: newMessage.rows[0] });
    } catch (error) {
        console.error("Error sending chat message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default chatRouter;
