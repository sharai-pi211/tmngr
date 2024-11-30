import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/Navbar.css";

interface Team {
  team_id: number;
  team_name: string;
}

const Navbar: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(
    JSON.parse(localStorage.getItem("selectedTeam") || "null")
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");

      try {
        const response = await fetch("http://localhost:5000/team", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);

          if (!selectedTeam && data.teams.length > 0) {
            const defaultTeam = data.teams[0];
            setSelectedTeam(defaultTeam);
            localStorage.setItem("selectedTeam", JSON.stringify(defaultTeam));
            navigate(`/tasks/${defaultTeam.team_id}`);
          }
        } else {
          throw new Error("Failed to fetch teams");
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };

    fetchTeams();
  }, [selectedTeam, navigate]);

  const handleTeamChange = (selectedOption: Team | null) => {
    setSelectedTeam(selectedOption);

    if (selectedOption) {
      let teamId = selectedOption?.team_id.toString();
      localStorage.setItem("selectedTeamId", teamId);
      navigate(`/tasks/${selectedOption.team_id}`);
    }
  };

  const customStyles = {
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#498205" : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      fontSize: "16px",
      "&:hover": {
        backgroundColor: "#f4f4f4",
        color: "#000",
      },
    }),
    singleValue: (provided: any, state: any) => ({
      ...provided,

      fontSize: "16px",
    }),
    control: (provided: any) => ({
      ...provided,
      borderColor: "#ddd",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#aaa",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 100,
    }),
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <h2>TaskManager</h2>
      </div>

      <div className="sidebar-team-select">
        <div className="column custom-select-wrapper">
          <label htmlFor="team-select">Select Team:</label>
          <Select
            options={teams}
            getOptionLabel={(e) => e.team_name}
            getOptionValue={(e) => e.team_id.toString()}
            value={selectedTeam}
            onChange={handleTeamChange}
            placeholder="Select your team..."
            styles={customStyles}
          />
        </div>
      </div>

      <ul className="sidebar-links">
        <li>
          <Link to="/tasks">Tasks</Link>
        </li>
        <li>
          <Link to="/teams">Teams</Link>
        </li>
        <li>
          <Link to="/notifications">Notifications</Link>
        </li>
        <li>
          <Link to="/me">Me</Link>
        </li>
        <li>
          <Link to="/pomodoro">Pomodoro</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/chat">Chats</Link>
        </li>
      </ul>

      <div className="sidebar-actions">
        <button className="sidebar-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
