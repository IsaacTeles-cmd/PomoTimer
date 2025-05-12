import React, { useState, useEffect, useRef } from 'react';
import './index.css';

function App() {
  // Estados principais
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const audioRef = useRef(null);

  // Estados das tasks
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);

  // Carrega tasks do localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    audioRef.current = new Audio('/sounds/alert.mp3');
  }, []);

  // Salva tasks
  useEffect(() => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Lógica do timer
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval);
            handleTimerEnd();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

 useEffect(() => {
  // Configuração inicial do favicon padrão
  const setDefaultFavicon = () => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍅</text></svg>';
    document.head.appendChild(link);
  };

  // Icon e Title
  const updateTabInfo = () => {
    const emoji = isBreak ? '🍅' : '⏳';
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    
    document.title = isActive 
      ? `${timeStr} ${emoji} Pomodoro Timer`
      : "Pomodoro Timer";

    
    if (isActive) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      
      ctx.fillStyle = isBreak ? '#4ecdc4' : '#ff6b6b';
      ctx.fillRect(0, 0, 64, 64);
      
      
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 32, 32);
      
      
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = canvas.toDataURL();
      document.head.appendChild(link);
    } else {
      setDefaultFavicon();
    }
  };

  updateTabInfo();
  
  
  let interval;
  if (isActive) {
    interval = setInterval(updateTabInfo, 1000);
  }

  
  return () => {
    clearInterval(interval);
    if (!isActive) {
      setDefaultFavicon();
    }
  };
}, [isActive, minutes, seconds, isBreak]);

  const handleTimerEnd = () => {
    playAlert();
    if (!isBreak && currentTaskIndex !== null) {
      // Incrementa sessão apenas na task ativa
      setTasks(tasks.map((task, i) => 
        i === currentTaskIndex ? { 
          ...task, 
          sessions: (task.sessions || 0) + 1 
        } : task
      ));
    }
    setIsBreak(!isBreak);
    setMinutes(isBreak ? 25 : 5);
    setSeconds(0);
    setIsActive(false);
  };

  const playAlert = () => audioRef.current.play().catch(console.error);

  // Adiciona task com sessões ocultas inicialmente
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { 
        text: newTask, 
        completed: false,
        sessions: 0,
        showSessions: false // Novo estado para controlar visibilidade
      }]);
      setNewTask('');
    }
  };

  // Mostra sessões quando a task é selecionada
  const selectTask = (index) => {
    if ( currentTaskIndex === index) {
      setCurrentTaskIndex(null);
      setTasks(tasks.map(task => ({...task, showSessions: false})));
    } else {
      setCurrentTaskIndex(index);
      setTasks(tasks.map((task, i) =>({
        ...task,
        showSessions: i === index
      })));
    }
  };

  return (
    <div className={`app ${isBreak ? 'break' : 'pomodoro'}`}>
      <h1>{isBreak ? 'PAUSA' : 'POMODORO'}</h1>
      <div className="timer">
        {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
      </div>

      {/* Input para nova task */}
      <div className="task-section">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Adicione uma tarefa"
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask}>+</button>
      </div>

      {/* Lista de tasks */}
      <div className="task-list">
        {tasks.map((task, index) => (
          <div 
            key={index}
            className={`task-item ${task.completed ? 'completed' : ''} ${currentTaskIndex === index ? 'active-task' : ''}`}
            onClick={() => selectTask(index)}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => {
                e.stopPropagation();
                const updatedTasks = tasks.map((t, i) => 
                  i === index ? { ...t, completed: !t.completed } : t
                );
                setTasks(updatedTasks);

                if (currentTaskIndex === index) {
                  setCurrentTaskIndex(null);
                  setTasks(updatedTasks.map(task => ({
                    ...task,
                    showSessions: false
                  })))
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="task-text">{task.text}</span>
            
            {/* Mostra sessões apenas se showSessions for true */}
            {task.showSessions && (
              <span className="session-counter">
                {task.sessions}/4 sessões
                {task.sessions >= 4 && (
                  <span className="completed-cycle"> ✅</span>
                )}
              </span>
            )}

            <button 
              className="delete-task"
              onClick={(e) => {
                e.stopPropagation();
                setTasks(tasks.filter((_, i) => i !== index));
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={() => setIsActive(!isActive)}>
          {isActive ? 'PAUSAR' : 'INICIAR'}
        </button>
        <button onClick={() => {
          setIsActive(false);
          setMinutes(25);
          setSeconds(0);
        }}>
          REINICIAR
        </button>
      </div>
    </div>
  );
}

export default App;