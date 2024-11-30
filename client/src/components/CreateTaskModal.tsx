import React, { useState, useEffect } from "react";
import "../styles/CreateTaskModal.css";

interface CreateTaskModalProps {
  teamId: string;
  onClose: () => void;
  onTaskUpdated: () => void; // Обновление задач в родительском компоненте
}

interface TeamMember {
  id: number;
  username: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ teamId, onClose, onTaskUpdated }) => {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "normal",
    status: "todo",
    assigned_to: "",
    due_date: "",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");

      try {
        const response = await fetch(`http://localhost:5000/team/${teamId}/members`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const members = data.members.map((member: any) => ({
            id: member.id,
            username: member.username,
          }));
          setTeamMembers(members);
        } else {
          throw new Error("Failed to fetch team members");
        }
      } catch (err) {
        console.error("Error fetching team members:", err);
      }
    };

    fetchTeamMembers();
  }, [teamId]);

  const handleNewTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };
  

  const createTask = async () => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, ""); // Убираем кавычки из токена

    try {
      const response = await fetch(`http://localhost:5000/tasks/${teamId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          due_date: newTask.due_date,
          assigned_to: newTask.assigned_to || null, // Назначенный пользователь (если есть)
        }),
      });

      let a = JSON.stringify({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: newTask.status,
        due_date: newTask.due_date,
        assigned_to: newTask.assigned_to || null, // Назначенный пользователь (если есть)
      })

      console.log(a);
      
      if (response.ok) {
        // Обновляем задачи
        onTaskUpdated();
        onClose(); // Закрываем модалку
      } else {
        throw new Error("Failed to create task");
      }
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create New Task</h2>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newTask.title}
          onChange={handleNewTaskChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newTask.description}
          onChange={handleNewTaskChange}
        ></textarea>
        <select name="priority" value={newTask.priority} onChange={handleNewTaskChange}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <select name="status" value={newTask.status} onChange={handleNewTaskChange}>
          <option value="todo">To Do</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          name="assigned_to"
          value={newTask.assigned_to}
          onChange={handleNewTaskChange}
        >
          <option value="">Unassigned</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.username}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="due_date"
          value={newTask.due_date}
          onChange={handleNewTaskChange}
        />
        <button onClick={createTask}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CreateTaskModal;
