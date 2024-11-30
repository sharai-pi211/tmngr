import React from "react";
import "../styles/KanbanBoard.css";

export interface KanbanTask {
  id: number;
  title: string;
  status: string;
  updated_at: string;
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  onTaskStatusChange: (taskId: number, newStatus: string) => void; // Callback для изменения статуса задачи
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    tasks,
    onTaskClick,
    onTaskStatusChange,
  }) => {
    // Сортировка задач внутри каждой колонки по `updated_at` (по убыванию)
    const sortTasksByUpdatedAt = (tasks: KanbanTask[]) => {
      return tasks.sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateA - dateB; // Новые задачи выше
      });
    };
  
    // Группируем задачи по статусу и применяем сортировку
    const tasksByStatus = {
      todo: sortTasksByUpdatedAt(tasks.filter((task) => task.status === "todo")),
      "in progress": sortTasksByUpdatedAt(
        tasks.filter((task) => task.status === "in progress")
      ),
      completed: sortTasksByUpdatedAt(
        tasks.filter((task) => task.status === "completed")
      ),
    };
  
    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, task: KanbanTask) => {
      event.dataTransfer.setData("taskId", task.id.toString());
    };
  
    const handleDrop = (event: React.DragEvent<HTMLDivElement>, newStatus: string) => {
      event.preventDefault();
      const taskId = parseInt(event.dataTransfer.getData("taskId"));
      onTaskStatusChange(taskId, newStatus);
    };
  
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    };
  
    return (
      <div className="kanban-board">
        {(["todo", "in progress", "completed"] as const).map((status) => (
          <div
            key={status}
            className="kanban-column"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <h2>{status.replace("_", " ").toUpperCase()}</h2>
            <div className="kanban-tasks">
              {tasksByStatus[status].map((task) => (
                <div
                  key={task.id}
                  className={`kanban-task ${status}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => onTaskClick(task)}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  

export default KanbanBoard;
