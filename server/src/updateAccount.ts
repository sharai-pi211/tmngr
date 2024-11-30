import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import { authenticateToken } from "./authMiddleware.js";

const router = express.Router();

interface UpdateAccountRequestBody {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  avatar_url?: string;
}

// Роут для обновления данных пользователя
router.put(
  "/me",
  authenticateToken, // Проверяем токен перед выполнением запроса
  async (req: Request, res: Response) => {
    const { username, email, first_name, last_name, password, avatar_url } =
      req.body as UpdateAccountRequestBody;
    const userId = req.body.userId; // ID пользователя из middleware

    try {
      // Проверяем, существует ли пользователь
      const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Хэшируем пароль, если его обновляют
      let passwordHash = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      // Формируем динамический запрос для обновления
      const updates = [];
      const values: any[] = [userId]; // Первый параметр - ID пользователя
      if (username) {
        updates.push(`username = $${values.length + 1}`);
        values.push(username);
      }
      if (email) {
        updates.push(`email = $${values.length + 1}`);
        values.push(email);
      }
      if (first_name) {
        updates.push(`first_name = $${values.length + 1}`);
        values.push(first_name);
      }
      if (last_name) {
        updates.push(`last_name = $${values.length + 1}`);
        values.push(last_name);
      }
      if (passwordHash) {
        updates.push(`password_hash = $${values.length + 1}`);
        values.push(passwordHash);
      }
      if (avatar_url) {
        updates.push(`avatar_url = $${values.length + 1}`);
        values.push(avatar_url);
      }

      // Если нет изменений
      if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const query = `
        UPDATE users
        SET ${updates.join(", ")}
        WHERE id = $1
        RETURNING id, username, email, first_name, last_name, avatar_url;
      `;

      const updatedUser = await pool.query(query, values);

      res.status(200).json({
        message: "Account updated successfully",
        user: updatedUser.rows[0],
      });
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.body.userId; // ID пользователя из middleware

  try {
    const user = await pool.query(
      "SELECT id, username, email, first_name, last_name, avatar_url FROM users WHERE id = $1",
      [userId],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.rows[0]);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
