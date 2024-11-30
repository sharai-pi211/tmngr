import express, { Request, Response } from "express";
import { authenticateToken } from "../authMiddleware.js";
import pool from "../db.js";

const router = express.Router();

interface CreateTeamRequestBody {
  name: string;
}

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { name } = req.body as CreateTeamRequestBody;
  const userId = req.body.userId; // Получаем ID пользователя из токена

  if (!name) {
    return res.status(400).json({ message: "Team name is required" });
  }

  try {
    // Создаем команду
    const newTeam = await pool.query(
      `INSERT INTO teams (name, owner_id) 
       VALUES ($1, $2) 
       RETURNING id, name, owner_id, created_at`,
      [name, userId],
    );

    const teamId = newTeam.rows[0].id;

    // Добавляем создателя как члена команды
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) 
       VALUES ($1, $2, 'owner')`,
      [teamId, userId],
    );

    res
      .status(201)
      .json({ message: "Team created successfully", team: newTeam.rows[0] });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Server error" });
  }
});

interface AddTeamMemberRequestBody {
  addUserId: number;
  role?: string; // По умолчанию 'member'
}

router.post("/:teamId/members", authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const { addUserId, role } = req.body as AddTeamMemberRequestBody; // userId пользователя, которого добавляем
  const currentUserId = req.body.userId; // ID текущего пользователя из токена

  try {

    // Проверяем, существует ли текущий пользователь
    const currentUserCheck = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [currentUserId],
    );
    if (currentUserCheck.rows.length === 0) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // Проверяем, существует ли пользователь, которого добавляем
    const userToAddCheck = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [addUserId],
    );
    if (userToAddCheck.rows.length === 0) {
      return res.status(404).json({ message: "User to add not found" });
    }

    // Проверяем, является ли пользователь уже членом команды
    const memberCheck = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2",
      [teamId, addUserId],
    );
    if (memberCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User is already a member of this team" });
    }

    // Добавляем пользователя в команду
    const newMember = await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING *`,
      [teamId, addUserId, role || "member"],
    );

    res.status(201).json({
      message: "Member added successfully",
      member: newMember.rows[0],
    });
  } catch (error) {
    console.error("Error adding member to team:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(
  "/:teamId/members",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId } = req.params;

    try {
      const members = await pool.query(
        `SELECT users.id, users.username, users.email, team_members.role 
         FROM team_members 
         JOIN users ON team_members.user_id = users.id 
         WHERE team_members.team_id = $1`,
        [teamId],
      );

      res.status(200).json({ members: members.rows });
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Роут для получения всех команд пользователя
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.body.userId; // ID пользователя из токена, добавляется в middleware `authenticateToken`

  try {
    // Получаем список всех команд, в которых состоит пользователь
    const teamsQuery = `
        SELECT 
          t.id AS team_id,
          t.name AS team_name,
          tm.role AS user_role
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = $1;
      `;

    const teamsResult = await pool.query(teamsQuery, [userId]);

    if (teamsResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "You are not a member of any teams." });
    }

    res.status(200).json({
      message: "Teams fetched successfully",
      teams: teamsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
