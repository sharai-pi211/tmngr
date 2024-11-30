import React, { useState, useEffect } from "react";
import "../styles/CreateTaskModal.css";

interface EditTaskModalProps {
  teamId: string;
  taskId: number;
  onClose: () => void;
  onTaskUpdated: () => void; 
  taskData: {
    title: string;
    description: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    due_date: string | null;
  };
}

interface TeamMember {
  id: number;
  username: string;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  teamId,
  taskId,
  onClose,
  onTaskUpdated,
  taskData,
}) => {
  const [updatedTask, setUpdatedTask] = useState(taskData); 
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditMode, setIsEditMode] = useState(false); 

  
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

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedTask({ ...updatedTask, [name]: value });
  };

  const saveTask = async () => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, ""); 

    try {
      const response = await fetch(`http://localhost:5000/tasks/${teamId}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updatedTask,
          assigned_to: updatedTask.assigned_to || null, 
        }),
      });

      if (response.ok) {
        onTaskUpdated(); 
        onClose(); 
      } else {
        throw new Error("Failed to update task");
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{isEditMode ? "Edit Task" : "View Task"}</h2>
        {isEditMode ? (
          <>
            {/* Режим редактирования */}
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={updatedTask.title}
              onChange={handleTaskChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={updatedTask.description || ""}
              onChange={handleTaskChange}
            ></textarea>
            <select name="priority" value={updatedTask.priority} onChange={handleTaskChange}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <select name="status" value={updatedTask.status} onChange={handleTaskChange}>
              <option value="todo">To Do</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              name="assigned_to"
              value={updatedTask.assigned_to || ""}
              onChange={handleTaskChange}
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
              value={updatedTask.due_date || ""}
              onChange={handleTaskChange}
            />
            <button onClick={saveTask}>Save</button>
            <button onClick={() => setIsEditMode(false)}>Cancel Edit</button>
          </>
        ) : (
          <>
            {/* Режим просмотра */}
            <p>
              <strong>Title:</strong> {updatedTask.title}
            </p>
            <p>
              <strong>Description:</strong> {updatedTask.description || "No description"}
            </p>
            <p>
              <strong>Priority:</strong> {updatedTask.priority}
            </p>
            <p>
              <strong>Status:</strong> {updatedTask.status}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {updatedTask.assigned_to
                ? teamMembers.find((member) => member.id === updatedTask.assigned_to)?.username ||
                  "Unknown"
                : "Unassigned"}
            </p>
            <p>
              <strong>Due Date:</strong> {updatedTask.due_date || "No due date"}
            </p>
            <button onClick={() => setIsEditMode(true)}>Edit</button>
          </>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default EditTaskModal;
