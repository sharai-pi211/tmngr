import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const teamId = localStorage.getItem("selectedTeamId");
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");

      if (!teamId || !token) {
        setError("No team selected or token missing");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/tasks/${teamId}/tasks`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks);
        } else {
          throw new Error("Failed to fetch tasks");
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getStatusData = () => {
    const todo = tasks.filter((task) => task.status === "todo").length;
    const inProgress = tasks.filter(
      (task) => task.status === "in progress"
    ).length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    return {
      labels: ["To Do", "In Progress", "Completed"],
      datasets: [
        {
          data: [todo, inProgress, completed],
          backgroundColor: ["#ff6384", "#36a2eb", "#4caf50"],
          hoverBackgroundColor: ["#ff6384", "#36a2eb", "#4caf50"],
        },
      ],
    };
  };

  const getTasksByUserData = () => {
    const users: Record<string, number> = {};

    tasks.forEach((task) => {
      if (task.assigned_to && task.assigned_to.name) {
        const userName = task.assigned_to.name;
        users[userName] = (users[userName] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(users),
      datasets: [
        {
          label: "Tasks Assigned",
          data: Object.values(users),
          backgroundColor: "#2196f3",
        },
      ],
    };
  };

  const getOverdueTasksData = () => {
    const overdue = tasks.filter(
      (task) =>
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== "completed"
    ).length;

    const onTime = tasks.length - overdue;

    return {
      labels: ["On Time", "Overdue"],
      datasets: [
        {
          data: [onTime, overdue],
          backgroundColor: ["#4caf50", "#f44336"],
        },
      ],
    };
  };

  const getPriorityData = () => {
    const low = tasks.filter((task) => task.priority === "low").length;
    const normal = tasks.filter((task) => task.priority === "normal").length;
    const high = tasks.filter((task) => task.priority === "high").length;

    return {
      labels: ["Low", "Normal", "High"],
      datasets: [
        {
          label: "Tasks by Priority",
          data: [low, normal, high],
          backgroundColor: ["#2196f3", "#ff9800", "#f44336"],
        },
      ],
    };
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="dashboard-cards">
        <div className="card">
          <h3>Total Tasks</h3>
          <p>{tasks.length}</p>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <p>{tasks.filter((task) => task.status === "completed").length}</p>
        </div>
        <div className="card">
          <h3>In Progress</h3>
          <p>{tasks.filter((task) => task.status === "in progress").length}</p>
        </div>
        <div className="card">
          <h3>To Do</h3>
          <p>{tasks.filter((task) => task.status === "todo").length}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart">
          <h3>Task Status Distribution</h3>
          <Doughnut data={getStatusData()} />
        </div>
        <div className="chart">
          <h3>Tasks by Priority</h3>
          <Bar data={getPriorityData()} />
        </div>
        <div className="chart">
          <h3>Tasks by User</h3>
          <Bar data={getTasksByUserData()} />
        </div>
        <div className="chart">
          <h3>Overdue Tasks</h3>
          <Doughnut data={getOverdueTasksData()} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
