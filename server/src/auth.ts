import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Интерфейс для тела запроса при регистрации
interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// Интерфейс для тела запроса при логине
interface LoginRequestBody {
  email: string;
  password: string;
}

router.post(
  "/register",
  async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
    const { username, email, password, first_name, last_name } = req.body;

    try {
      // Проверяем, существует ли пользователь
      const userCheck = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR username = $2",
        [email, username],
      );
      if (userCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User with this email or username already exists" });
      }

      // Хэшируем пароль
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Генерируем случайную аватарку с использованием новой версии DiceBear
      const style = "identicon"; // Вы можете выбрать другие стили, например: "adventurer", "croodles", "micah"
      const avatarUrl = `https://api.dicebear.com/6.x/${style}/svg?seed=${encodeURIComponent(username)}`;

      // Сохраняем пользователя в базу данных
      const newUser = await pool.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, avatar_url) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, username, email, first_name, last_name, avatar_url`,
        [username, email, passwordHash, first_name, last_name, avatarUrl],
      );

      // Генерируем токен
      const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
      const token = jwt.sign(
        { id: newUser.rows[0].id, username: newUser.rows[0].username },
        JWT_SECRET,
        { expiresIn: "7d" }, // Токен действует 1 час
      );

      // Возвращаем токен и данные пользователя
      res.status(201).json({
        message: "User registered",
        token, // Отправляем токен
        user: newUser.rows[0],
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during registration:", error.message);
      } else {
        console.error("An unknown error occurred");
      }
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Логин пользователя
router.post(
  "/login",
  async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
    const { email, password } = req.body;

    try {
      // Проверяем, существует ли пользователь
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (user.rows.length === 0) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(
        password,
        user.rows[0].password_hash,
      );
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Генерируем JWT
      const token = jwt.sign({ id: user.rows[0].id, email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(200).json({
        message: "Login successful",
        user: { id: user.rows[0].id, email },
        token,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error during login:", error.message);
      } else {
        console.error("An unknown error occurred");
      }
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
