import React, { useState, useEffect } from "react";
import Select from "react-select";
import "../styles/Teams.css";

interface User {
  id: number;
  username: string;
  email: string;
}

interface TeamMember {
  id: number;
  username: string;
}

const CreateTeam: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");
      try {
        const response = await fetch("http://localhost:5000/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          throw new Error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const addUser = (user: User) => {
    if (!selectedUsers.some((member) => member.id === user.id)) {
      setSelectedUsers((prev) => [
        ...prev,
        { id: user.id, username: user.username },
      ]);
    }
  };

  const removeUser = (id: number) => {
    setSelectedUsers((prev) => prev.filter((member) => member.id !== id));
  };

  const customOption = (props: any) => {
    const { data, innerRef, innerProps } = props;
    return (
      <div ref={innerRef} {...innerProps} className="custom-option">
        <span>
          {data.username} ({data.email})
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addUser(data);
          }}
          className="add-user-button"
        >
          Add
        </button>
      </div>
    );
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, "");

    try {
      const response = await fetch("http://localhost:5000/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: teamName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      const data = await response.json();

      for (const member of selectedUsers) {
        await fetch(`http://localhost:5000/team/${data.team.id}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ addUserId: member.id, role: "member" }),
        });
      }

      alert("Team created successfully!");
      setTeamName("");
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error creating team:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-container">
      <h1>Create a New Team</h1>
      <form onSubmit={handleCreateTeam}>
        <div className="column teams-cont">
          <label>Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="css-13cymwt-control teams-input"
          />
        </div>
        <div className="teams-cont">
          <label>Search and Add Users</label>
          <Select
            options={users}
            getOptionLabel={(e) => e.username}
            getOptionValue={(e) => e.id.toString()}
            components={{ Option: customOption }}
            placeholder="Search for users..."
          />
        </div>

        {selectedUsers.length > 0 && (
          <>
            <div className="selected-users">
              <h2>Selected Members</h2>
              <ul>
                {selectedUsers.map((member) => (
                  <li key={member.id}>
                    {member.username}
                    <button
                      type="button"
                      onClick={() => removeUser(member.id)}
                      className="teams-btn"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button type="submit" disabled={loading} className="teams-btn">
              {loading ? "Creating..." : "Create Team"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default CreateTeam;
