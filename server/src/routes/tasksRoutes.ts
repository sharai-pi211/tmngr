import express, { Request, Response } from "express";
import pool from "../db.js";
import { authenticateToken } from "../authMiddleware.js";
import { notifyUser } from "../websocket.js";

const router = express.Router();

interface CreateTaskBody {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: number;
}

router.post(
  "/:teamId/tasks",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { title, description, priority, due_date, assigned_to } =
      req.body as CreateTaskBody;
    const creatorId = req.body.userId;

    try {
      const teamCheck = await pool.query("SELECT * FROM teams WHERE id = $1", [
        teamId,
      ]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }

      const newTask = await pool.query(
        `INSERT INTO tasks (title, description, priority, status, due_date, creator_id, team_id, assigned_to) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          title,
          description || null,
          priority || "normal",
          req.body.status || "todo", // Добавляем явное указание статуса
          due_date || null,
          creatorId,
          teamId,
          assigned_to || null,
        ]
      );

      const createdTask = newTask.rows[0];

      if (assigned_to) {
        console.log("assigned_to");
        notifyUser(assigned_to.toString(), "task_assigned", {
          taskId: createdTask.id,
          title: createdTask.title,
          message: "You have been assigned a new task.",
        });
      }

      res.status(201).json({
        message: "Task created successfully",
        task: createdTask,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get(
  "/:teamId/tasks",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId } = req.params;

    try {
      const teamCheck = await pool.query("SELECT * FROM teams WHERE id = $1", [
        teamId,
      ]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }

      const tasks = await pool.query(
        `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.due_date,
          t.created_at,
          t.updated_at,
          t.team_id,
          json_build_object(
            'name', u_creator.username,
            'avatar', u_creator.avatar_url
          ) AS creator,
          CASE 
            WHEN t.assigned_to IS NOT NULL THEN 
              json_build_object(
                'name', u_assigned.username,
                'avatar', u_assigned.avatar_url
              )
            ELSE NULL
          END AS assigned_to
        FROM tasks t
        LEFT JOIN users u_creator ON t.creator_id = u_creator.id
        LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
        WHERE t.team_id = $1
        ORDER BY t.created_at DESC
        `,
        [teamId]
      );

      res.status(200).json({
        message: "Tasks fetched successfully",
        tasks: tasks.rows,
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

interface UpdateTaskBody {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  assigned_to?: number;
}

router.put(
  "/:teamId/tasks/:taskId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId, taskId } = req.params;
    const { title, description, priority, status, due_date, assigned_to } =
      req.body as UpdateTaskBody;

    try {
      const teamCheck = await pool.query("SELECT * FROM teams WHERE id = $1", [
        teamId,
      ]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }

      const taskCheck = await pool.query(
        "SELECT * FROM tasks WHERE id = $1 AND team_id = $2",
        [taskId, teamId]
      );
      if (taskCheck.rows.length === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      const updates = [];
      const values: any[] = [taskId];
      if (title) {
        updates.push(`title = $${values.length + 1}`);
        values.push(title);
      }
      if (description) {
        updates.push(`description = $${values.length + 1}`);
        values.push(description);
      }
      if (priority) {
        updates.push(`priority = $${values.length + 1}`);
        values.push(priority);
      }
      if (status) {
        updates.push(`status = $${values.length + 1}`);
        values.push(status);
      }
      if (due_date) {
        updates.push(`due_date = $${values.length + 1}`);
        values.push(due_date);
      }
      if (assigned_to) {
        updates.push(`assigned_to = $${values.length + 1}`);
        values.push(assigned_to);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const query = `UPDATE tasks SET ${updates.join(
        ", "
      )} WHERE id = $1 RETURNING *`;
      const updatedTask = await pool.query(query, values);

      // Теперь возвращаем задачу с подробной информацией
      const detailedTaskQuery = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.due_date,
          t.created_at,
          t.updated_at,
          t.team_id,
          json_build_object(
            'name', u_creator.first_name || ' ' || u_creator.last_name,
            'avatar', u_creator.avatar_url
          ) AS creator,
          CASE 
            WHEN t.assigned_to IS NOT NULL THEN 
              json_build_object(
                'name', u_assigned.first_name || ' ' || u_assigned.last_name,
                'avatar', u_assigned.avatar_url
              )
            ELSE NULL
          END AS assigned_to
        FROM tasks t
        LEFT JOIN users u_creator ON t.creator_id = u_creator.id
        LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
        WHERE t.id = $1
      `;
      const detailedTask = await pool.query(detailedTaskQuery, [taskId]);

      res.status(200).json({
        message: "Task updated successfully",
        task: detailedTask.rows[0],
      });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/:teamId/tasks/:taskId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId, taskId } = req.params;

    try {
      const teamCheck = await pool.query("SELECT * FROM teams WHERE id = $1", [
        teamId,
      ]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }

      const taskCheck = await pool.query(
        "SELECT * FROM tasks WHERE id = $1 AND team_id = $2",
        [taskId, teamId]
      );
      if (taskCheck.rows.length === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);

      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/:teamId", authenticateToken, async (req, res) => {
  const { teamId } = req.params;

  try {
    const tasks = await pool.query("SELECT * FROM tasks WHERE team_id = $1", [
      teamId,
    ]);
    res.status(200).json({ tasks: tasks.rows });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  const { teamId, sortField = "created_at", sortOrder = "asc" } = req.query;

  if (!teamId) {
    return res.status(400).json({ message: "Team ID is required" });
  }

  try {
    const query = `
        SELECT 
          tasks.id,
          tasks.title,
          tasks.description,
          tasks.priority,
          tasks.status,
          tasks.due_date,
          tasks.created_at,
          tasks.updated_at,
          tasks.assigned_to,
          creators.first_name AS creator_first_name,
          creators.last_name AS creator_last_name,
          creators.avatar_url AS creator_avatar_url,
          assignees.first_name AS assigned_to_name,
          assignees.last_name AS assigned_to_last_name,
          assignees.avatar_url AS assigned_to_avatar
        FROM 
          tasks
        LEFT JOIN 
          users AS creators ON tasks.creator_id = creators.id
        LEFT JOIN 
          users AS assignees ON tasks.assigned_to = assignees.id
        WHERE 
          tasks.team_id = $1
        ORDER BY 
          ${sortField} ${sortOrder === "desc" ? "DESC" : "ASC"}
      `;

    const tasks = await pool.query(query, [teamId]);
    res.json({ tasks: tasks.rows });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch(
  "/:taskId",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { status } = req.body;

    // Проверяем, что статус является допустимым
    if (!["todo", "in progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const updatedTask = await pool.query(
        `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, taskId]
      );

      if (updatedTask.rowCount === 0) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(200).json(updatedTask.rows[0]);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get(
  "/:teamId/assigned",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { teamId } = req.params; // Получаем teamId из параметров маршрута
    const userId = req.body.userId ; // Берем userId из токена через authenticateToken

    try {
      // Проверяем, существует ли команда
      const teamCheck = await pool.query("SELECT * FROM teams WHERE id = $1", [
        teamId,
      ]);
      if (teamCheck.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Получаем задачи, назначенные на пользователя
      const assignedTasks = await pool.query(
        "SELECT * FROM tasks WHERE team_id = $1 AND assigned_to = $2 ORDER BY created_at DESC",
        [teamId, userId]
      );

      res.status(200).json({
        message: "Assigned tasks fetched successfully",
        tasks: assignedTasks.rows,
      });
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


export default router;
