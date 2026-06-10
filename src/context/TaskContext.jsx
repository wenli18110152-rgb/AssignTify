import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { calculateRisk, getDaysUntilDeadline } from '../utils/riskCalculator';
import { calculateWorkload } from '../utils/workload';
import { useAuth } from './AuthContext';
import { getDemoTaskData } from '../utils/demoData';

const TaskContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '';

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null); // For the task creation flow
  const [demoMode, setDemoMode] = useState(false);
  const [demoTasks, setDemoTasks] = useState([]);
  const { user } = useAuth();

  // Load tasks from the Python backend API (which reads from Supabase)
  useEffect(() => {
    const loadTasks = async () => {
      if (user?.email) {
        try {
          const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(user.email)}`);
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.detail || `Failed to load tasks (${res.status})`);
          }
          const data = await res.json();
          // Backend already returns camelCase data
          setTasks(data.tasks || []);
        } catch (err) {
          console.error('Failed to load tasks from backend:', err.message);
        }
      } else {
        setTasks([]);
      }
      // Always exit demo mode on user change / refresh
      setDemoMode(false);
      setDemoTasks([]);
    };
    loadTasks();
  }, [user?.email]);

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

  // Add a new task via the Python backend API
  const addTask = useCallback(async (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false
    };

    if (demoMode) {
      setDemoTasks(prev => [...prev, newTask]);
      return newTask;
    }

    try {
      // Send snake_case fields matching the backend's TaskCreate model
      const body = {
        id: newTask.id,
        user_email: user.email,
        name: newTask.name,
        description: newTask.description || '',
        deadline: newTask.deadline,
        priority: newTask.priority || 'Medium',
        hours_per_day: newTask.hoursPerDay || 1,
        created_at: newTask.createdAt,
        completed: newTask.completed
      };

      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Failed to create task (${res.status})`);
      }

      const data = await res.json();
      const savedTask = data.task; // Backend returns { task: {...} } in camelCase
      setTasks(prev => [savedTask, ...prev]);
      return savedTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [demoMode, user?.email]);

  // Update a task via the Python backend API
  const updateTask = useCallback(async (taskId, updates) => {
    if (demoMode) {
      setDemoTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));
      return;
    }

    // Capture previous task for rollback
    const previousTask = tasks.find(t => t.id === taskId);

    // Optimistic update
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));

    try {
      // Map frontend camelCase → backend snake_case for the PUT body
      const body = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.deadline !== undefined) body.deadline = updates.deadline;
      if (updates.priority !== undefined) body.priority = updates.priority;
      if (updates.hoursPerDay !== undefined) body.hours_per_day = updates.hoursPerDay;
      if (updates.completed !== undefined) body.completed = updates.completed;

      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Failed to update task (${res.status})`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on failure
      if (previousTask) {
        setTasks(prev => prev.map(task =>
          task.id === taskId ? previousTask : task
        ));
      }
      throw error;
    }
  }, [demoMode, tasks]);

  // Delete a task via the Python backend API
  const deleteTask = useCallback(async (taskId) => {
    if (demoMode) {
      setDemoTasks(prev => prev.filter(task => task.id !== taskId));
      return;
    }

    // Capture the task before deleting for rollback
    const deletedTask = tasks.find(t => t.id === taskId);

    // Optimistic delete
    setTasks(prev => prev.filter(task => task.id !== taskId));

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Failed to delete task (${res.status})`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      // Revert optimistic delete on failure
      if (deletedTask) {
        setTasks(prev => [deletedTask, ...prev]);
      }
      throw error;
    }
  }, [demoMode, tasks]);

  // Toggle task completion via the Python backend API
  const toggleComplete = useCallback(async (taskId) => {
    if (demoMode) {
      setDemoTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
      return;
    }

    // Capture previous state for rollback
    const previousTask = tasks.find(t => t.id === taskId);

    // Optimistic toggle
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/toggle`, {
        method: 'PATCH'
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Failed to toggle task (${res.status})`);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert optimistic toggle on failure
      if (previousTask) {
        setTasks(prev => prev.map(task =>
          task.id === taskId ? previousTask : task
        ));
      }
      throw error;
    }
  }, [demoMode, tasks]);

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
      
      daysUntilNextDeadline = getDaysUntilDeadline(nearestDeadline);
    }

    return {
      totalTasks,
      highRiskTasks,
      daysUntilNextDeadline
    };
  };

  // Unified workload calculation — single source of truth for all pages
  // hoursPerDay represents estimated total weekly study hours per task (not daily recurring).
  const getUnifiedWorkload = () => {
    const base = calculateWorkload(effectiveTasks);

    // Find busiest day in next 7 (tasks with nearest deadlines)
    const incompleteTasks = effectiveTasks.filter(t => !t.completed);
    const now = new Date();
    let busiestDay = null;
    let busiestDayHours = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      let dayHours = 0;
      incompleteTasks.forEach(task => {
        const daysUntil = getDaysUntilDeadline(task.deadline);
        if (daysUntil >= 0 && daysUntil <= 3) {
          dayHours += task.hoursPerDay || 1;
        }
      });
      if (dayHours > busiestDayHours) {
        busiestDayHours = dayHours;
        busiestDay = date.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    return {
      ...base,
      busiestDay,
      busiestDayHours: Math.round(busiestDayHours * 10) / 10
    };
  };

  // Centralized progress statistics — single source of truth for Progress page
  const getProgressStats = () => {
    const now = new Date();
    const totalCount = effectiveTasks.length;
    const completedTasks = effectiveTasks.filter(t => t.completed);
    const completedCount = completedTasks.length;
    const incompleteTasks = effectiveTasks.filter(t => !t.completed);
    const activeCount = incompleteTasks.length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Upcoming deadline (nearest incomplete task)
    let upcomingDeadline = null;
    if (incompleteTasks.length > 0) {
      const sorted = [...incompleteTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      const nearest = sorted[0];
      const daysLeft = getDaysUntilDeadline(nearest.deadline);
      upcomingDeadline = { task: nearest, daysLeft };
    }

    // Weekly productivity: tasks completed this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weeklyProductivity = completedTasks.filter(t => {
      // Use createdAt as a proxy for when it was completed if no completedAt field
      return true; // Count all completed tasks as productivity since we can't track completion date
    }).length;

    // Recent completed tasks (last 5, sorted by deadline descending)
    const recentCompleted = [...completedTasks]
      .sort((a, b) => new Date(b.deadline) - new Date(a.deadline))
      .slice(0, 5);

    // Risk breakdown for active tasks
    const riskCounts = { High: 0, Medium: 0, Low: 0 };
    incompleteTasks.forEach(t => {
      const risk = calculateRisk(t.deadline, t.priority, t.hoursPerDay);
      riskCounts[risk]++;
    });

    // Priority breakdown for active tasks
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    incompleteTasks.forEach(t => {
      const p = t.priority || 'Medium';
      priorityCounts[p]++;
    });

    return {
      completionPercent,
      completedCount,
      totalCount,
      activeCount,
      upcomingDeadline,
      weeklyProductivity,
      recentCompleted,
      riskBreakdown: riskCounts,
      priorityBreakdown: priorityCounts
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
      getUnifiedWorkload,
      getProgressStats,
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