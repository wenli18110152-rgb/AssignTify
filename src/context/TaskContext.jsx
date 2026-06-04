import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { calculateRisk } from '../utils/riskCalculator';
import { useAuth } from './AuthContext';
import { getDemoTaskData } from '../utils/demoData';

const TaskContext = createContext(null);

// Helper function to get user-specific storage key
const getStorageKey = (userEmail) => `assigntify_tasks_${userEmail}`;

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null); // For the task creation flow
  const [demoMode, setDemoMode] = useState(false);
  const [demoTasks, setDemoTasks] = useState([]);
  const { user } = useAuth();

  // Load tasks from localStorage when user changes
  useEffect(() => {
    if (user?.email) {
      const savedTasks = localStorage.getItem(getStorageKey(user.email));
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);
    } else {
      setTasks([]);
    }
    // Always exit demo mode on user change / refresh
    setDemoMode(false);
    setDemoTasks([]);
  }, [user?.email]);

  // Save tasks to localStorage whenever they change (skip during demo mode)
  useEffect(() => {
    if (user?.email && !demoMode) {
      localStorage.setItem(getStorageKey(user.email), JSON.stringify(tasks));
    }
  }, [tasks, user?.email, demoMode]);

  // The effective task list — demo tasks when demo mode is active, real tasks otherwise
  const effectiveTasks = demoMode ? demoTasks : tasks;

  // --- Demo Mode controls ---
  const enterDemoMode = () => {
    const demoData = getDemoTaskData();
    setDemoTasks(demoData);
    setDemoMode(true);
  };

  const exitDemoMode = () => {
    setDemoMode(false);
    setDemoTasks([]);
  };

  const isDemoMode = demoMode;

  // Add a new task
  const addTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false
    };
    if (demoMode) {
      setDemoTasks(prev => [...prev, newTask]);
    } else {
      setTasks(prev => [...prev, newTask]);
    }
    return newTask;
  };

  // Update a task
  const updateTask = (taskId, updates) => {
    const updater = prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    if (demoMode) {
      setDemoTasks(updater);
    } else {
      setTasks(updater);
    }
  };

  // Delete a task
  const deleteTask = (taskId) => {
    const updater = prev => prev.filter(task => task.id !== taskId);
    if (demoMode) {
      setDemoTasks(updater);
    } else {
      setTasks(updater);
    }
  };

  // Toggle task completion
  const toggleComplete = (taskId) => {
    const updater = prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    if (demoMode) {
      setDemoTasks(updater);
    } else {
      setTasks(updater);
    }
  };

  // Get task by ID
  const getTaskById = (taskId) => {
    return effectiveTasks.find(task => task.id === taskId);
  };

  // Get tasks sorted by deadline
  const getTasksSortedByDeadline = () => {
    return [...effectiveTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  };

  // Get high risk tasks
  const getHighRiskTasks = () => {
    return effectiveTasks.filter(task => {
      const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
      return risk === 'High' && !task.completed;
    });
  };

  // Get today's focus (most urgent high/medium risk task)
  const getTodaysFocus = () => {
    const incompleteTasks = effectiveTasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) return null;

    const sortedTasks = incompleteTasks.map(task => ({
      ...task,
      risk: calculateRisk(task.deadline, task.priority, task.hoursPerDay)
    })).sort((a, b) => {
      // Prioritize by risk level, then by deadline
      const riskOrder = { High: 0, Medium: 1, Low: 2 };
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[a.risk] - riskOrder[b.risk];
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });

    return sortedTasks[0];
  };

  // Get summary stats
  const getSummaryStats = () => {
    const totalTasks = effectiveTasks.filter(t => !t.completed).length;
    const highRiskTasks = getHighRiskTasks().length;
    
    const incompleteTasks = effectiveTasks.filter(t => !t.completed);
    let daysUntilNextDeadline = null;
    
    if (incompleteTasks.length > 0) {
      const nearestDeadline = incompleteTasks.reduce((nearest, task) => {
        const taskDate = new Date(task.deadline);
        return taskDate < nearest ? taskDate : nearest;
      }, new Date(incompleteTasks[0].deadline));
      
      daysUntilNextDeadline = Math.ceil((nearestDeadline - new Date()) / (1000 * 60 * 60 * 24));
    }

    return {
      totalTasks,
      highRiskTasks,
      daysUntilNextDeadline
    };
  };

  // Set current task for creation flow
  const setCurrentTaskForFlow = (taskData) => {
    setCurrentTask(taskData);
  };

  // Clear current task
  const clearCurrentTask = () => {
    setCurrentTask(null);
  };

  return (
    <TaskContext.Provider value={{
      tasks: effectiveTasks,
      currentTask,
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      getTaskById,
      getTasksSortedByDeadline,
      getHighRiskTasks,
      getTodaysFocus,
      getSummaryStats,
      setCurrentTaskForFlow,
      clearCurrentTask,
      enterDemoMode,
      exitDemoMode,
      isDemoMode
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};