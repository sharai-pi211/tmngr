import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import "../styles/Me.css"; // Стили для страницы

const updateSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().optional(),
});

type UpdateFormInputs = z.infer<typeof updateSchema>;

const Me: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue, // Для заполнения формы данными пользователя
  } = useForm<UpdateFormInputs>({
    resolver: zodResolver(updateSchema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const rawToken = localStorage.getItem("token");
        const token = rawToken?.replace(/^"|"$/g, "");
        const response = await fetch("http://localhost:5000/update/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const user = await response.json();

        // Заполняем форму данными пользователя
        setValue("username", user.username);
        setValue("email", user.email);
        setValue("first_name", user.first_name || "");
        setValue("last_name", user.last_name || "");
        setLoading(false);
      } catch (err: unknown) {
        setError("Failed to load user data. Please try again.");
        setLoading(false);
      }
    };

    fetchUser();
  }, [setValue]);

  const onSubmit = async (data: UpdateFormInputs) => {
    try {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");
      const response = await fetch("http://localhost:5000/update/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        alert("Your account has been updated successfully!");
      } else {
        const error = await response.json();
        alert(`Update failed: ${error.message}`);
      }
    } catch (err) {
      console.error("Error updating account:", err);
      alert("An error occurred while updating your account. Please try again.");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="me-container">
      <h1 className="me-title">Update Your Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="me-form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className="form-input"
          />
          {errors.username && (
            <p className="error-message">{errors.username.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="form-input"
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="first_name" className="form-label">
            First Name
          </label>
          <input
            id="first_name"
            type="text"
            {...register("first_name")}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name" className="form-label">
            Last Name
          </label>
          <input
            id="last_name"
            type="text"
            {...register("last_name")}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            New Password (optional)
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="form-input"
          />
        </div>
        <button type="submit" className="submit-button">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Me;
