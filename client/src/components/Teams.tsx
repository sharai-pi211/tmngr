import React, { useState, useEffect } from "react";
import CreateTeam from "./CreateTeam";
import "../styles/Teams.css";

interface Team {
  team_id: number;
  team_name: string;
  user_role: string;
}

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreateTeamVisible, setIsCreateTeamVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setTeams(data.teams);
        } else {
          throw new Error("Failed to fetch teams");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load teams. Please try again.");
      }
    };

    fetchTeams();
  }, []);

  const toggleCreateTeam = () => {
    setIsCreateTeamVisible((prev) => !prev);
  };

  return (
    <div className="teams-container">
      <h1 className="teams-title">Teams</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="your-teams">
        <h2>Your Teams</h2>
        {teams.length === 0 ? (
          <p>You are not a member of any teams yet.</p>
        ) : (
          <ul className="teams-list">
            {teams.map((team) => (
              <li key={team.team_id} className="team-item">
                <div className="team-details column">
                  <span className="team-name">{team.team_name}</span>
                  <span className="team-role">Role: {team.user_role}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Кнопка для открытия CreateTeam */}
      <button className="create-task-button" onClick={toggleCreateTeam}>
        +
      </button>

      {/* Отображение CreateTeam по состоянию */}
      {isCreateTeamVisible && <CreateTeam />}
    </div>
  );
};

export default Teams;
