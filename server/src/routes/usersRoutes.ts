import express, { Request, Response } from "express";
import { authenticateToken } from "../authMiddleware.js";
import pool from "../db.js";

const router = express.Router();
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query("SELECT id, username, email FROM users");
    res.status(200).json({
      message: "Users fetched successfully",
      users: users.rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;
