import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../styles/PomodoroTimer.css";

const PomodoroTimer: React.FC = () => {
  const [workInterval, setWorkInterval] = useState(25); // Рабочий интервал (в минутах)
  const [shortBreak, setShortBreak] = useState(5); // Короткий перерыв (в минутах)
  const [longBreak, setLongBreak] = useState(15); // Длинный перерыв (в минутах)
  const [timeLeft, setTimeLeft] = useState(workInterval * 60); // Время в секундах
  const [isRunning, setIsRunning] = useState(false); // Запущен ли таймер
  const [cycle, setCycle] = useState(1); // Текущий цикл работы/перерыва
  const [isWorkInterval, setIsWorkInterval] = useState(true); // Рабочий интервал или перерыв

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            handleIntervalEnd(); // Когда таймер заканчивается
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer); // Очищаем таймер при остановке
  }, [isRunning]);

  const handleIntervalEnd = () => {
    setIsRunning(false); // Останавливаем таймер
    if (isWorkInterval) {
      // Если завершился рабочий интервал
      if (cycle % 4 === 0) {
        setTimeLeft(longBreak * 60); // Длинный перерыв
      } else {
        setTimeLeft(shortBreak * 60); // Короткий перерыв
      }
    } else {
      // Если завершился перерыв
      setTimeLeft(workInterval * 60); // Новый рабочий интервал
      setCycle((prevCycle) => prevCycle + 1); // Увеличиваем цикл
    }
    setIsWorkInterval(!isWorkInterval); // Переключаемся между работой и перерывом
  };

  const handleStartPause = () => {
    setIsRunning((prev) => !prev); // Переключаем запуск/пауза
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(workInterval * 60);
    setCycle(1);
    setIsWorkInterval(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress =
    ((isWorkInterval
      ? workInterval * 60
      : cycle % 4 === 0
      ? longBreak * 60
      : shortBreak * 60) -
      timeLeft) /
    (isWorkInterval
      ? workInterval * 60
      : cycle % 4 === 0
      ? longBreak * 60
      : shortBreak * 60);

  return (
    <div className="pomodoro-timer">
      <h1>Pomodoro Timer</h1>
      <div className="settings">
        <label>
          Work Interval:
          <input
            type="number"
            value={workInterval}
            onChange={(e) => {
              setWorkInterval(parseInt(e.target.value, 10) || 25);
              if (isWorkInterval) setTimeLeft((parseInt(e.target.value, 10) || 25) * 60);
            }}
          />
        </label>
        <label>
          Short Break:
          <input
            type="number"
            value={shortBreak}
            onChange={(e) =>
              setShortBreak(parseInt(e.target.value, 10) || 5)
            }
          />
        </label>
        <label>
          Long Break:
          <input
            type="number"
            value={longBreak}
            onChange={(e) =>
              setLongBreak(parseInt(e.target.value, 10) || 15)
            }
          />
        </label>
      </div>
      <div className="progress-container">
        <CircularProgressbar
          value={progress * 100}
          text={formatTime(timeLeft)}
          styles={buildStyles({
            textColor: "#333",
            pathColor: isWorkInterval ? "#3e98c7" : "#ff6347",
            trailColor: "#d6d6d6",
          })}
        />
      </div>
      <div className="controls">
        <button onClick={handleStartPause}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>
      <div className="cycle-info">
        <p>Current Cycle: {cycle}</p>
        <p>{cycle % 4 === 0 ? "Long Break After This" : "Short Break"}</p>
      </div>
    </div>
  );
};

export default PomodoroTimer;
