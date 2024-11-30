// import React, { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
// import Home from "./pages/Home";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import Dashboard from "./components/Dashboard";
// import Me from "./components/Me";
// import Teams from "./components/Teams";
// import Tasks from "./components/Tasks";
// import Navbar from "./components/Navbar";
// import PomodoroTimer from "./components/PomodoroTimer";
// import Notifications from "./components/Notifications";
// import { WebSocketProvider } from "./components/WebSocketContext";

// import "./App.css";

// const Layout: React.FC = () => {
//   return (
//     <div className="layout">
//       <Navbar />
//       <main className="main-content">
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// const App: React.FC = () => {
//   const [userId, setUserId] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Загружаем userId из localStorage
//     const userJson = localStorage.getItem("user");
//     const user = userJson ? JSON.parse(userJson) : null;
//     const id = user && user.id ? String(user.id) : null;

//     setUserId(id);
//     setIsLoading(false); // Указываем, что данные загружены
//   }, []);

//   if (isLoading) {
//     // Пока данные загружаются, показываем индикатор загрузки
//     return <p>Loading...</p>;
//   }

//   if (!userId) {
//     // Если userId нет, перенаправляем на страницу логина
//     return <Login />;
//   }

//   return (
//     <WebSocketProvider userId={userId}>
//       <Router>
//         <Routes>
//           <Route path="/" element={<Layout />}>
//             <Route index element={<Home />} />
//             <Route path="dashboard" element={<Dashboard />} />
//             <Route path="me" element={<Me />} />
//             <Route path="pomodoro" element={<PomodoroTimer />} />
//             <Route path="teams" element={<Teams />} />
//             <Route path="tasks" element={<Tasks />} />
//             <Route path="notifications" element={<Notifications />} />
//             <Route path="/tasks/:teamId" element={<Tasks />} />
//           </Route>
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//         </Routes>
//       </Router>
//     </WebSocketProvider>
//   );
// };

// export default App;


import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Me from "./components/Me";
import Teams from "./components/Teams";
import Tasks from "./components/Tasks";
import Navbar from "./components/Navbar";
import PomodoroTimer from "./components/PomodoroTimer";
import Notifications from "./components/Notifications";

import "./App.css";
import { WebSocketProvider } from "./components/WebSocketContext";
import TeamChat from "./components/TeamChat";

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id ? String(user.id) : null;
    setUserId(userId);
  }, []);

  return (
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="me" element={<Me />} />
            <Route path="pomodoro" element={<PomodoroTimer />} />
            <Route path="teams" element={<Teams />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="/tasks/:teamId" element={<Tasks />} />
            <Route path="/chat" element={<TeamChat />} />

          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
};

export default App;
