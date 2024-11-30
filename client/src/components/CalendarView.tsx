import React from "react";
import Calendar from "react-calendar";
import "../styles/Calendar.css";

interface CalendarTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

interface CalendarViewProps {
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick }) => {

  const getTileContent = (date: Date) => {
    // Преобразуем дату календаря в формат YYYY-MM-DD
    const calendarDate = date.toISOString().split("T")[0];

    // Фильтруем задачи для текущей даты
    const tasksForDate = tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split("T")[0];
      return taskDate === calendarDate;
    });

    // Возвращаем задачи в плитке календаря
    return (
      <>
        {tasksForDate.map((task) => (
          <div
            key={task.id}
            className={`calendar-task ${task.priority.toLowerCase()} ${task.status.toLowerCase()}`}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task); // Открытие задачи
            }}
          >
            {task.title}
          </div>
        ))}
        
      </>
    );
  };

  return (
    <div className="task-calendar">
      <Calendar tileContent={({ date }) => getTileContent(date)} />
    </div>
  );
};

export default CalendarView;
