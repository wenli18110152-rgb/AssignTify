import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useStudyBuddy } from '../../context/StudyBuddyContext';
import { studyBuddies, buddyList, getRandomMessage } from '../../utils/studyBuddyData';
import { getGreeting, getNextAction, getRecommendedTask, getAIRecommendationMessage, getStudyNextStep, getSortedStudyTasks, getTaskSuggestion, getSmartRecommendation, generateReminders, getStudentInsights } from '../../utils/messages';
import { calculateRisk, getDaysUntilDeadline, getRiskColor, getTimeRemaining, isDueWithin24Hours, isDueWithin6Hours, getRiskExplanation, calculateRiskScore, getRiskLevel, getRiskLevelColor, calculateAcademicHealth, calculateStudyLoadForecast, getWorkloadSummary, getStudyMomentum, getDeadlineOverview, getWeeklyInsights } from '../../utils/riskCalculator';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import Icons from '../../utils/icons';
import StudyPlanPage from '../StudyPlanPage/StudyPlanPage';
import StudyBuddyCard from '../StudyBuddy/StudyBuddy';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const { studyBuddy, setStudyBuddy, getBuddyData, getBuddyMessage } = useStudyBuddy();
  const buddy = getBuddyData();
  const { 
    tasks, 
    addTask,
    getTodaysFocus, 
    getSummaryStats, 
    getTasksSortedByDeadline,
    getHighRiskTasks,
    toggleComplete,
    deleteTask,
    enterDemoMode,
    exitDemoMode,
    isDemoMode,
    getUnifiedWorkload,
    getProgressStats
  } = useTasks();

  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [activePage, setActivePage] = useState('dashboard');
  const [healthRingReady, setHealthRingReady] = useState(false);
  const [completionToast, setCompletionToast] = useState(null);
  const [toastFading, setToastFading] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Profile management state
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const todaysFocus = getTodaysFocus();
  const stats = getSummaryStats();
  const sortedTasks = getTasksSortedByDeadline();
  const highRiskTasks = getHighRiskTasks();
  const nearestDeadlineTask = sortedTasks.length > 0 ? sortedTasks[0] : null;

  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];
    if (filterRisk !== 'all') {
      filtered = filtered.filter(task => {
        const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
        return risk === filterRisk;
      });
    }
    if (filterStatus === 'active') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'deadline-desc':
          return new Date(b.deadline) - new Date(a.deadline);
        case 'priority': {
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'priority-desc': {
          const priorityOrderDesc = { High: 2, Medium: 1, Low: 0 };
          return priorityOrderDesc[a.priority] - priorityOrderDesc[b.priority];
        }
        case 'risk': {
          const riskOrder = { High: 0, Medium: 1, Low: 2 };
          const riskA = calculateRisk(a.deadline, a.priority, a.hoursPerDay);
          const riskB = calculateRisk(b.deadline, b.priority, b.hoursPerDay);
          return riskOrder[riskA] - riskOrder[riskB];
        }
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return filtered;
  };

  const filteredTasks = getFilteredAndSortedTasks();
  // Dashboard "All Tasks" section: exclude completed so they only appear in the Completed Tasks section
  const dashboardActiveTasks = filteredTasks.filter(t => !t.completed);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => { setCurrentTime(new Date()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setHealthRingReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (completionToast) {
      setToastFading(false);
      const fadeTimer = setTimeout(() => setToastFading(true), 2000);
      const removeTimer = setTimeout(() => {
        setCompletionToast(null);
        setToastFading(false);
      }, 2500);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [completionToast]);

  const handleToggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await toggleComplete(taskId);
      if (task && !task.completed) {
        setCompletionToast({ title: '\ud83c\udf89 Task completed!', message: 'Great job staying on track.' });
      }
    } catch (error) {
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  // Initialize display name when user loads
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  // Clear messages after 4 seconds
  useEffect(() => {
    if (profileMessage) {
      const timer = setTimeout(() => setProfileMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => setPasswordMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  // Save display name handler
  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setProfileMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    const result = await updateProfile(displayName.trim());
    if (result.success) {
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setProfileMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
  };

  // Update password handler
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    const result = await updatePassword(newPassword);
    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Failed to update password.' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUrgencyClass = (deadline) => {
    if (isDueWithin6Hours(deadline)) return 'urgent-6h';
    if (isDueWithin24Hours(deadline)) return 'urgent-24h';
    return '';
  };

  const getRiskTintClass = (risk) => {
    switch (risk) {
      case 'High': return 'risk-high-tint';
      case 'Medium': return 'risk-medium-tint';
      case 'Low': return 'risk-low-tint';
      default: return '';
    }
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => {
      if (task.completed) return false;
      const daysLeft = getDaysUntilDeadline(task.deadline);
      return daysLeft <= 3;
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  };

  const getActiveTasks = () => {
    return tasks.filter(task => {
      if (task.completed) return false;
      const daysLeft = getDaysUntilDeadline(task.deadline);
      return daysLeft > 3;
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  };

  const getCompletedTasks = () => tasks.filter(task => task.completed);

  const upcomingTasks = getUpcomingTasks();
  const activeTasks = getActiveTasks();
  const completedTasks = getCompletedTasks();

  const getEncouragement = () => {
    if (tasks.length === 0) return { text: "Ready to get started? Add your first task and we'll help you stay on top of everything." };
    if (completedTasks.length === tasks.length && tasks.length > 0) return { text: "All done \u2014 amazing work finishing everything!" };
    if (stats.highRiskTasks > 0) return { text: `You have ${stats.highRiskTasks} task${stats.highRiskTasks > 1 ? 's' : ''} that could use some attention. A small step today makes a big difference.` };
    if (completedTasks.length > 0 && completedTasks.length >= tasks.length / 2) return { text: "Over halfway there \u2014 you're doing great. Keep going!" };
    return { text: "You're on track. One small step today can reduce stress tomorrow." };
  };

  const encouragement = getEncouragement();

  // Workload data (must be declared before functions that reference it)
  const workload = getUnifiedWorkload() ?? { loadLevel: 'Normal', weeklyHours: 0, activeTasks: 0 };

  // Workload-based motivational message
  const getMotivationalMessage = () => {
    if (tasks.length === 0) return { text: "Ready to start your journey? Add your first task and let's make progress together!", icon: Icons.rocket };
    if (completedTasks.length === tasks.length && tasks.length > 0) return { text: "Incredible work! You've tackled everything. Take a well-earned break.", icon: Icons.sparkles };
    if (workload.loadLevel === 'Heavy') return { text: "Deep breath — you've got a full plate. One step at a time, and you'll get through it!", icon: Icons.zap };
    if (workload.loadLevel === 'Busy') return { text: "Steady progress today means less stress tomorrow. You've got this!", icon: Icons.trendingUp };
    return { text: "Great balance! Use this momentum to get ahead on upcoming tasks.", icon: Icons.rocket };
  };
  const motivation = getMotivationalMessage();

  const academicHealth = calculateAcademicHealth(tasks);
  const smartRec = getSmartRecommendation(tasks);
  const loadForecast = calculateStudyLoadForecast(tasks);
  const studentInsights = getStudentInsights(tasks);
  const legacyWorkload = getWorkloadSummary(tasks);
  const momentum = getStudyMomentum(tasks);
  const deadlineOverview = getDeadlineOverview(tasks);
  const weeklyInsights = getWeeklyInsights(tasks);
  const progressStats = getProgressStats();

  const handleLoadDemoData = () => {
    enterDemoMode();
  };

  const handleExitDemoMode = () => {
    exitDemoMode();
  };

  const getFocusTask = () => {
    if (highRiskTasks.length > 0) return highRiskTasks[0];
    if (nearestDeadlineTask) return nearestDeadlineTask;
    return null;
  };

  const focusTask = getFocusTask();

  const incompleteTasks = tasks.filter(task => !task.completed);
  const reminders = generateReminders(incompleteTasks);
  const recommendedTask = getRecommendedTask(incompleteTasks);
  const recommendedRisk = recommendedTask ? calculateRisk(recommendedTask.deadline, recommendedTask.priority, recommendedTask.hoursPerDay) : null;
  const recommendedDaysLeft = recommendedTask ? getDaysUntilDeadline(recommendedTask.deadline) : null;
  const aiMessage = recommendedTask ? getAIRecommendationMessage(recommendedTask, recommendedRisk, recommendedDaysLeft) : '';
  const studyNextStep = recommendedTask ? getStudyNextStep(recommendedTask, recommendedRisk, recommendedDaysLeft) : '';

  const getDueLabel = (deadline, completed) => {
    if (completed) return null;
    const daysLeft = getDaysUntilDeadline(deadline);
    if (daysLeft < 0) {
      const overdueDays = Math.abs(daysLeft);
      return { text: `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`, cls: 'overdue' };
    }
    if (daysLeft === 0) return { text: 'Due today', cls: 'today' };
    if (daysLeft === 1) return { text: 'Due tomorrow', cls: 'tomorrow' };
    if (daysLeft <= 3) return { text: `Due in ${daysLeft} days`, cls: 'in-3days' };
    if (daysLeft <= 7) return { text: `Due in ${daysLeft} days`, cls: 'in-7days' };
    return null;
  };

  const navItems = [
    { id: 'dashboard', icon: Icons.home, label: 'Dashboard' },
    { id: 'tasks', icon: Icons.list, label: 'My Tasks' },
    { id: 'calendar', icon: Icons.calendar, label: 'Calendar' },
    { id: 'study', icon: Icons.book, label: 'Study Plan' },
    { id: 'stats', icon: Icons.chart, label: 'Progress' },
    { id: 'settings', icon: Icons.gear, label: 'Settings' },
  ];

  const renderRiskBadge = (risk, size = 'sm') => (
    <span className={`risk-badge ${size} ${risk.toLowerCase()}`}>
      {risk}
    </span>
  );

  const renderDueLabel = (deadline, completed) => {
    const label = getDueLabel(deadline, completed);
    if (!label) return null;
    return <span className={`due-label ${label.cls}`}>{label.text}</span>;
  };

  const getHealthLevelLabel = (level) => {
    switch (level) {
      case 'Excellent': return 'Thriving';
      case 'Good': return 'On Track';
      case 'Fair': return 'Needs a Push';
      case 'Needs Attention': return 'Time to Focus';
      default: return level;
    }
  };

  // Generate conversational study buddy messages
  const getStudyBuddyMessages = () => {
    const messages = [];
    if (smartRec) {
      messages.push({ text: smartRec.message, type: 'suggestion' });
    }
    studentInsights.forEach(insight => {
      messages.push({ text: insight.text, type: insight.tone });
    });
    if (messages.length === 0 && tasks.length > 0) {
      messages.push({ text: `${incompleteTasks.length} task${incompleteTasks.length !== 1 ? 's' : ''} on your plate — a small step today keeps everything manageable.`, type: 'encouraging' });
    }
    return messages.slice(0, 4);
  };

  const buddyMessages = getStudyBuddyMessages();

  // Calendar helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const isToday = (date) => isSameDay(date, new Date());

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate.getFullYear() === date.getFullYear() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getDate() === date.getDate();
    });
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month trailing days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(prevYear, prevMonth, daysInPrevMonth - i), currentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), currentMonth: true });
    }

    // Next month leading days (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(nextYear, nextMonth, d), currentMonth: false });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const monthYearLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Calendar stats computations
  const getCalendarStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tasksThisWeek = tasks.filter(t => {
      const d = new Date(t.deadline);
      return d >= today && d < endOfWeek;
    });
    const upcomingDeadlines = tasks.filter(t => {
      const d = new Date(t.deadline);
      const daysLeft = getDaysUntilDeadline(t.deadline);
      return !t.completed && daysLeft >= 0 && daysLeft <= 14;
    });
    const completedThisMonth = tasks.filter(t => {
      if (!t.completed) return false;
      const d = new Date(t.deadline);
      return d >= startOfMonth && d <= endOfMonth;
    });
    const highPriorityTasks = tasks.filter(t => {
      return !t.completed && calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'High';
    });

    return {
      thisWeek: tasksThisWeek.length,
      upcoming: upcomingDeadlines.length,
      completedMonth: completedThisMonth.length,
      highPriority: highPriorityTasks.length,
    };
  };

  const calStats = getCalendarStats();

  // AI insights for calendar
  const getCalendarInsights = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const next5Days = new Date(today);
    next5Days.setDate(next5Days.getDate() + 5);

    const weekTasks = tasks.filter(t => {
      const d = new Date(t.deadline);
      return !t.completed && d >= today && d < endOfWeek;
    });
    const next5DayTasks = tasks.filter(t => {
      const d = new Date(t.deadline);
      return !t.completed && d >= today && d < next5Days;
    });
    const weeklyHours = weekTasks.reduce((sum, t) => sum + (t.hoursPerDay || 1), 0);

    const insights = [];
    if (weekTasks.length >= 3) {
      insights.push({ text: `Busy week ahead — ${weekTasks.length} tasks due`, type: 'warning' });
    } else if (weekTasks.length === 0) {
      insights.push({ text: 'Clear week — great time to get ahead on future tasks', type: 'positive' });
    }
    if (next5DayTasks.length >= 2) {
      insights.push({ text: `${next5DayTasks.length} deadlines in the next 5 days`, type: 'info' });
    }
    if (weeklyHours > 0) {
      insights.push({ text: `Recommended: ${weeklyHours}h of study this week`, type: 'study' });
    }

    // Selected date insight
    if (selectedDate) {
      const selTasks = getTasksForDate(selectedDate);
      const selActive = selTasks.filter(t => !t.completed);
      if (selActive.length >= 3) {
        insights.push({ text: `Heavy day — ${selActive.length} tasks to focus on`, type: 'warning' });
      } else if (selActive.length === 0 && selTasks.length === 0) {
        insights.push({ text: 'Free day — perfect for revision or rest', type: 'positive' });
      }
    }

    return insights;
  };

  const calInsights = getCalendarInsights();

  // Selected date priority breakdown
  const getSelectedDateBreakdown = () => {
    if (!selectedDateTasks.length) return null;
    const active = selectedDateTasks.filter(t => !t.completed);
    const high = active.filter(t => calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'High').length;
    const medium = active.filter(t => calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'Medium').length;
    const low = active.filter(t => calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'Low').length;
    const done = selectedDateTasks.filter(t => t.completed).length;
    const total = selectedDateTasks.length;
    return { high, medium, low, done, total };
  };

  const selectedBreakdown = getSelectedDateBreakdown();

  return (
    <div className="dashboard">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-mark">A</div>
            <span className="logo-text">AssignTify</span>
          </div>
          <div className="sidebar-header-actions">
            <div className="notification-bell" ref={bellRef}>
              <button className="notification-bell-btn" onClick={() => setBellOpen(!bellOpen)} title="Reminders">
                {Icons.bell}
                {reminders.count > 0 && (
                  <span className="notification-badge">{reminders.count}</span>
                )}
              </button>
              {bellOpen && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <span>Reminders</span>
                    <span className="notification-dropdown-count">{reminders.count}</span>
                  </div>
                  <div className="notification-dropdown-list">
                    {reminders.reminders.length === 0 ? (
                      <div className="notification-dropdown-empty">
                        <span className="notification-empty-icon">{Icons.checkCircle}</span>
                        <span>All clear — no urgent reminders</span>
                      </div>
                    ) : (
                      (() => {
                        const dueSoon = reminders.reminders.filter(r => r.category === 'overdue' || r.category === 'today' || r.category === 'tomorrow');
                        const upcoming = reminders.reminders.filter(r => r.category === 'in-3days' || r.category === 'in-7days');
                        return (
                          <>
                            {dueSoon.length > 0 && (
                              <div className="notification-category-group">
                                <div className="notification-category-header">
                                  <span className="notification-category-dot urgent" />
                                  <span>Due Soon</span>
                                </div>
                                {dueSoon.map(reminder => (
                                  <div
                                    key={reminder.taskId}
                                    className={`notification-reminder-card ${reminder.category}`}
                                    onClick={() => { navigate(`/task/${reminder.taskId}`); setBellOpen(false); }}
                                  >
                                    <span className={`notification-dot ${reminder.category}`} />
                                    <div className="notification-reminder-body">
                                      <span className="notification-reminder-name">{reminder.taskName}</span>
                                      <span className="notification-reminder-meta">
                                        {reminder.daysLeft < 0
                                          ? `Overdue by ${Math.abs(reminder.daysLeft)}d`
                                          : reminder.daysLeft === 0
                                            ? 'Due today'
                                            : reminder.daysLeft === 1
                                              ? 'Due tomorrow'
                                              : `Due in ${reminder.daysLeft} days`}
                                        {' · '}{reminder.priority} Priority
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {upcoming.length > 0 && (
                              <div className="notification-category-group">
                                <div className="notification-category-header">
                                  <span className="notification-category-dot upcoming" />
                                  <span>Upcoming</span>
                                </div>
                                {upcoming.map(reminder => (
                                  <div
                                    key={reminder.taskId}
                                    className={`notification-reminder-card ${reminder.category}`}
                                    onClick={() => { navigate(`/task/${reminder.taskId}`); setBellOpen(false); }}
                                  >
                                    <span className={`notification-dot ${reminder.category}`} />
                                    <div className="notification-reminder-body">
                                      <span className="notification-reminder-name">{reminder.taskName}</span>
                                      <span className="notification-reminder-meta">
                                        Due in {reminder.daysLeft} days · {reminder.priority} Priority
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="sidebar-theme">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <StudyBuddyCard />

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'S'}</span>
            <span className="user-name">{user?.name || 'Student'}</span>
          </div>
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            {Icons.logout}
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Dashboard Page */}
        {activePage === 'dashboard' && (
          <>
            {/* ═══════════ ZONE 1: PREMIUM HERO ═══════════ */}
            <section className="premium-hero">
              <div className="hero-gradient-bg">
                <div className="hero-content-wrapper">
                  {/* Left: Greeting + Focus */}
                  <div className="hero-left">
                    <div className="hero-greeting-area">
                      <h1 className="hero-greeting">
                        {getGreeting()}, {user?.name || 'Student'}
                      </h1>
                      <p className="hero-subtitle">{encouragement.text}</p>
                    </div>

                    {/* Reminder pill */}
                    {reminders.count > 0 && (
                      <div className={`hero-reminder-pill ${reminders.reminders[0].category}`}>
                        <span className="hero-reminder-dot" />
                        <span>{reminders.summary}</span>
                      </div>
                    )}

                    {/* Focus task */}
                    {focusTask ? (
                      <div className="hero-focus-card" onClick={() => navigate(`/task/${focusTask.id}`)}>
                        {(() => {
                          const risk = calculateRisk(focusTask.deadline, focusTask.priority, focusTask.hoursPerDay);
                          const daysLeft = getDaysUntilDeadline(focusTask.deadline);
                          return (
                            <>
                              <div className="hero-focus-top">
                                {renderRiskBadge(risk, 'sm')}
                                <span className="hero-focus-deadline">
                                  {Icons.clock} {daysLeft < 0 ? `Overdue ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                                </span>
                              </div>
                              <h3 className="hero-focus-name">{focusTask.name}</h3>
                              <p className="hero-focus-suggestion">{getNextAction(risk, focusTask.name, daysLeft)}</p>
                              <button className="hero-focus-cta" onClick={(e) => { e.stopPropagation(); navigate(`/task/${focusTask.id}`); }}>
                                View Details {Icons.arrowRight}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="hero-focus-card hero-focus-empty">
                        <h3 className="hero-focus-empty-title">You're all caught up</h3>
                        <p className="hero-focus-empty-text">Nothing urgent right now. Take a breather, or add a new task.</p>
                      </div>
                    )}
                  </div>

                  {/* Motivational Message */}
                  <div className="hero-motivation">
                    <span className="hero-motivation-icon">{motivation.icon}</span>
                    <span className="hero-motivation-text">{motivation.text}</span>
                  </div>
                </div>

                {/* Right: Health Score + Mascot */}
                <div className="hero-right-wrapper">
                  {/* Mascot area */}
                  <div className="hero-mascot-area">
                    <div className="hero-mascot-icon">
                      <span className="hero-buddy-emoji">{buddy.emoji}</span>
                    </div>
                    <span className="hero-mascot-label">{buddy.name}</span>
                  </div>
                  <div className="hero-right">
                    <div className="hero-health-ring-wrapper">
                      <svg className="hero-health-ring" viewBox="0 0 120 120">
                        <circle className="hero-health-ring-bg" cx="60" cy="60" r="52" />
                        <circle className="hero-health-ring-fill" cx="60" cy="60" r="52"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 52}`,
                            strokeDashoffset: healthRingReady ? `${2 * Math.PI * 52 * (1 - academicHealth.score / 100)}` : `${2 * Math.PI * 52}`,
                            stroke: academicHealth.score >= 80 ? '#34D399' : academicHealth.score >= 60 ? '#60A5FA' : academicHealth.score >= 40 ? '#FBBF24' : '#F87171'
                          }}
                        />
                        <text x="60" y="54" className="hero-health-score-text" textAnchor="middle" dominantBaseline="central">
                          {academicHealth.score}
                        </text>
                        <text x="60" y="72" className="hero-health-label-text" textAnchor="middle" dominantBaseline="central">
                          Health
                        </text>
                      </svg>
                    </div>
                    <span className={`hero-health-level ${academicHealth.level.toLowerCase()}`}>{getHealthLevelLabel(academicHealth.level)}</span>
                    <div className="hero-health-factors">
                      {academicHealth.factors.overdueCount > 0 && (
                        <span className="hero-health-tag overdue">{academicHealth.factors.overdueCount} overdue</span>
                      )}
                      {academicHealth.factors.completedCount > 0 && (
                        <span className="hero-health-tag done">{academicHealth.factors.completedCount} done</span>
                      )}
                      {academicHealth.factors.upcomingUrgent > 0 && (
                        <span className="hero-health-tag urgent">{academicHealth.factors.upcomingUrgent} due soon</span>
                      )}
                      <span className="hero-health-tag hours">{academicHealth.factors.weeklyHours}h/wk</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ═══════════ ZONE 2: STUDENT SUCCESS COACH + INSIGHTS ═══════════ */}
            <div className="insights-zone">
              {/* Left: Student Success Coach */}
              <section className="study-buddy-section">
                <div className="study-buddy-card">
                  <div className="study-buddy-header">
                    <div className="study-buddy-avatar">
                      <span className="study-buddy-avatar-emoji">{buddy.emoji}</span>
                    </div>
                    <div className="study-buddy-title-area">
                      <h3>Student Success Coach</h3>
                      <span className="study-buddy-subtitle">AI-powered academic guidance &middot; {buddy.name}</span>
                    </div>
                  </div>
                  <div className="study-buddy-messages">
                    {buddyMessages.map((msg, index) => (
                      <div key={index} className={`buddy-message ${msg.type}`}>
                        <div className="buddy-message-avatar">
                          <span className="buddy-message-avatar-emoji">{buddy.emoji}</span>
                        </div>
                        <div className="buddy-message-bubble">
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {buddyMessages.length === 0 && (
                      <div className="buddy-message encouraging">
                        <div className="buddy-message-avatar">
                          <span className="buddy-message-avatar-emoji">{buddy.emoji}</span>
                        </div>
                        <div className="buddy-message-bubble">
                          <p>Add your first task and I'll provide personalised study recommendations.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Right: Insights Panel */}
              <aside className="insights-panel">
                {/* Workload Balance */}
                {tasks.length > 0 && (
                  <div className="insight-mini-card">
                    <div className="insight-mini-header">
                      <span className="insight-mini-icon">{Icons.scale}</span>
                      <span className="insight-mini-title">Workload</span>
                      <span className={`insight-mini-badge ${workload.loadLevel.toLowerCase()}`}>{workload.loadLevel}</span>
                    </div>
                    <div className="insight-mini-bar-track">
                      <div className={`insight-mini-bar-fill ${workload.loadLevel.toLowerCase()}`}
                        style={{ width: `${Math.min((workload.weeklyHours / 40) * 100, 100)}%` }} />
                    </div>
                    <span className="insight-mini-stat">{workload.weeklyHours}h/week &middot; {workload.activeTasks} tasks</span>
                  </div>
                )}

                {/* Study Momentum */}
                {tasks.length > 0 && (
                  <div className="insight-mini-card">
                    <div className="insight-mini-header">
                      <span className="insight-mini-icon">{Icons.activity}</span>
                      <span className="insight-mini-title">Momentum</span>
                      <span className={`insight-mini-badge ${momentum.status}`}>{momentum.label}</span>
                    </div>
                    <div className="insight-mini-bar-track">
                      <div className={`insight-mini-bar-fill ${momentum.status}`}
                        style={{ width: `${momentum.progressPercent}%` }} />
                    </div>
                    <span className="insight-mini-stat">{momentum.progressPercent}% complete &middot; Next: {momentum.nextMilestone}</span>
                  </div>
                )}

                {/* Weekly Chart */}
                {tasks.length > 0 && weeklyInsights.dailyHours && (
                  <div className="insight-mini-card">
                    <div className="insight-mini-header">
                      <span className="insight-mini-icon">{Icons.barChart}</span>
                      <span className="insight-mini-title">This Week</span>
                      <span className="insight-mini-stat-inline">{weeklyInsights.totalWeekHours}h total</span>
                    </div>
                    <div className="insight-mini-chart">
                      {weeklyInsights.dailyHours.map((day, i) => {
                        const maxH = Math.max(...weeklyInsights.dailyHours.map(d => d.hours), 1);
                        const pct = (day.hours / maxH) * 100;
                        const barCls = day.hours <= 3 ? 'balanced' : day.hours <= 7 ? 'busy' : 'overloaded';
                        return (
                          <div key={i} className="mini-bar-col">
                            <div className="mini-bar-track">
                              <div className={`mini-bar ${barCls}`} style={{ height: `${Math.max(pct, 4)}%` }} />
                            </div>
                            <span className="mini-bar-label">{day.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Deadline Summary */}
                {tasks.length > 0 && deadlineOverview.deadlines && deadlineOverview.deadlines.length > 0 && (
                  <div className="insight-mini-card">
                    <div className="insight-mini-header">
                      <span className="insight-mini-icon">{Icons.flag}</span>
                      <span className="insight-mini-title">Deadlines</span>
                    </div>
                    <div className="insight-mini-deadlines">
                      {deadlineOverview.deadlines.slice(0, 4).map(dl => (
                        <div key={dl.id} className={`mini-deadline-item risk-${dl.risk.toLowerCase()}`}
                          onClick={() => navigate(`/task/${dl.id}`)}>
                          <span className="mini-deadline-name">{dl.name}</span>
                          <span className="mini-deadline-days">
                            {dl.daysLeft < 0 ? `${Math.abs(dl.daysLeft)}d late` : dl.daysLeft === 0 ? 'Today' : `${dl.daysLeft}d`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>

            {/* Summary Stats */}
            <section className="summary-stats">
              <div className="stat-card active-tasks">
                <div className="stat-icon-wrapper blue">{Icons.list}</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.totalTasks}</span>
                  <span className="stat-label">Active</span>
                </div>
              </div>
              <div className="stat-card completed-tasks">
                <div className="stat-icon-wrapper green">{Icons.checkCircle}</div>
                <div className="stat-content">
                  <span className="stat-value">{completedTasks.length}</span>
                  <span className="stat-label">Done</span>
                </div>
              </div>
              <div className="stat-card high-risk-tasks">
                <div className="stat-icon-wrapper amber">{Icons.alertTriangle}</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.highRiskTasks}</span>
                  <span className="stat-label">Needs Care</span>
                </div>
              </div>
            </section>

            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div className="demo-mode-banner">
                <div className="demo-mode-banner-content">
                  <span className="demo-mode-banner-icon">{Icons.info}</span>
                  <span className="demo-mode-banner-text">Demo Mode Active — You are viewing sample tasks</span>
                </div>
                <button className="demo-mode-exit-btn" onClick={handleExitDemoMode}>
                  Exit Demo Mode
                </button>
              </div>
            )}

            {/* Overdue Summary Banner */}
            {reminders.overdueSummary && (
              <div className="overdue-summary-banner">
                <span className="overdue-summary-icon">{Icons.alertTriangle}</span>
                <span className="overdue-summary-text">{reminders.overdueSummary}</span>
              </div>
            )}

            {/* Upcoming Tasks */}
            <section className="upcoming-section">
              <div className="section-header">
                <div className="section-header-left">
                  <h2>Coming Up</h2>
                  <span className="coming-up-summary">{deadlineOverview.summary}</span>
                </div>
                <button className="section-header-action" onClick={() => setActivePage('tasks')}>
                  View All {Icons.arrowRight}
                </button>
              </div>
              
              {upcomingTasks.length > 0 ? (
                <div className="upcoming-scroll">
                  {upcomingTasks.map(task => {
                    const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                    const daysLeft = getDaysUntilDeadline(task.deadline);
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`upcoming-card risk-${risk.toLowerCase()}`}
                        onClick={() => navigate(`/task/${task.id}`)}
                      >
                        <h4 className="upcoming-card-title">{task.name}</h4>
                        <div className="upcoming-card-meta">
                          <span className="upcoming-card-meta-item">{Icons.calendar} {formatDateShort(task.deadline)}</span>
                          <span className="upcoming-card-meta-item">{Icons.clock} {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}` : daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</span>
                          <span className="upcoming-card-meta-item">{Icons.book} {task.hoursPerDay || 0}h/day</span>
                        </div>
                        {renderRiskBadge(risk, 'sm')}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="upcoming-empty">
                  <p className="upcoming-empty-text">Nothing due soon — you're in great shape.</p>
                </div>
              )}
            </section>

            {/* All Tasks — show only active (incomplete) tasks; completed tasks live in the section below */}
            <section className="task-list">
              <div className="task-list-header">
                <h2>All Tasks</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="filter-sort-controls">
                    <div className="filter-group">
                      <label>Risk:</label>
                      <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="filter-select">
                        <option value="all">All</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Status:</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Sort:</label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                        <option value="deadline">Deadline (Nearest)</option>
                        <option value="deadline-desc">Deadline (Farthest)</option>
                        <option value="priority">Priority (High to Low)</option>
                        <option value="priority-desc">Priority (Low to High)</option>
                        <option value="risk">Risk (High to Low)</option>
                        <option value="name">Name (A-Z)</option>
                      </select>
                    </div>
                  </div>
                  <button className="add-task-btn-header" onClick={() => navigate('/add-task')}>
                    {Icons.plus} Add Task
                  </button>
                </div>
              </div>
              {dashboardActiveTasks.length === 0 ? (
                <div className="empty-state onboarding">
                  <div className="onboarding-content">
                    <h3>Welcome to AssignTify</h3>
                    <p>Your calm study companion. Track assignments, plan your sessions, and stay on top of deadlines — one step at a time.</p>
                    <div className="onboarding-actions">
                      <button className="add-task-btn-header" onClick={() => navigate('/add-task')}>
                        {Icons.plus} Create Your First Task
                      </button>
                      <button className="demo-data-btn" onClick={isDemoMode ? handleExitDemoMode : handleLoadDemoData}>
                        {Icons.download} {isDemoMode ? 'Exit Demo Mode' : 'Try Demo Mode'}
                      </button>
                    </div>
                    <div className="onboarding-examples">
                      <h4>Example tasks you can track:</h4>
                      <div className="example-tasks">
                        <div className="example-task high"><span className="example-dot" />Research Essay — <em>High Risk</em></div>
                        <div className="example-task medium"><span className="example-dot" />Group Presentation — <em>Medium Risk</em></div>
                        <div className="example-task medium"><span className="example-dot" />Statistics Quiz — <em>Medium Risk</em></div>
                        <div className="example-task low"><span className="example-dot" />Final Exam Revision — <em>Low Risk</em></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tasks">
                  {dashboardActiveTasks.map(task => {
                    const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                    const timeRemaining = getTimeRemaining(task.deadline);
                    const urgencyClass = getUrgencyClass(task.deadline);
                    const riskTint = getRiskTintClass(risk);
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`task-card ${task.completed ? 'completed' : ''} ${urgencyClass} ${riskTint}`}
                      >
                        <div className="task-checkbox">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleComplete(task.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="task-content" onClick={() => navigate(`/task/${task.id}`)}>
                          <div className="task-header">
                            <span className="task-name">{task.name}</span>
                            {renderRiskBadge(risk, 'sm')}
                          </div>
                          <div className="task-meta">
                            <span className="task-meta-item">{Icons.calendar} {formatDate(task.deadline)}</span>
                            <span className={`task-meta-item ${timeRemaining.urgent ? 'urgent' : ''}`}
                              style={timeRemaining.urgent ? { color: '#DC2626', fontWeight: 700 } : {}}
                            >
                              {Icons.clock} {timeRemaining.text}
                            </span>
                            <span className="task-meta-item">{Icons.book} {task.hoursPerDay || 0}h/day</span>
                            {renderDueLabel(task.deadline, task.completed)}
                          </div>
                          <span className="task-risk-explanation">
                            {getRiskExplanation(task.deadline, task.priority, task.hoursPerDay)}
                          </span>
                        </div>
                        <div className="task-actions">
                          <button className="task-action-btn view-btn" title="View Details"
                            onClick={(e) => { e.stopPropagation(); navigate(`/task/${task.id}`); }}>
                            {Icons.eye}
                          </button>
                          <button className="task-action-btn edit-btn" title="Edit Task"
                            onClick={(e) => { e.stopPropagation(); navigate(`/edit-task/${task.id}`); }}>
                            {Icons.edit}
                          </button>
                        <button className="task-action-btn complete-btn" title={task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                            onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id); }}>
                            {Icons.checkCircle}
                          </button>
                          <button className="task-action-btn delete-btn" title="Delete Task"
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Completed Tasks — only show when there are completed tasks */}
            {completedTasks.length > 0 && (
              <section className="completed-section">
                <div className="completed-section-header">
                  <h2>Completed Tasks</h2>
                  <span className="completed-count-badge">{completedTasks.length} done</span>
                </div>
                <div className="completed-cards-area">
                  <div className="completed-tasks-list">
                    {completedTasks.map(task => (
                      <div key={task.id} className="completed-task-item">
                        <button
                          className="completed-task-uncheck"
                          onClick={() => handleToggleComplete(task.id)}
                          title="Mark as incomplete"
                        >
                          {Icons.checkCircle}
                        </button>
                        <span className="completed-task-name">{task.name}</span>
                        <span className="completed-task-date">Completed &middot; {formatDateShort(task.deadline)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* My Tasks Page */}
        {activePage === 'tasks' && (
          <section className="page-section">
            <h2>My Tasks</h2>
            <p className="page-description">All your tasks in one place. Filter, sort, and check things off.</p>
            <div className="filter-sort-controls">
              <div className="filter-group">
                <label>Risk:</label>
                <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="filter-select">
                  <option value="all">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Sort:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                  <option value="deadline">Deadline (Nearest)</option>
                  <option value="deadline-desc">Deadline (Farthest)</option>
                  <option value="priority">Priority (High to Low)</option>
                  <option value="priority-desc">Priority (Low to High)</option>
                  <option value="risk">Risk (High to Low)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
              <button className="add-task-btn-header" onClick={() => navigate('/add-task')}>
                {Icons.plus} Add Task
              </button>
            </div>

            {/* Active Tasks Section */}
            {(() => {
              const activeFiltered = getFilteredAndSortedTasks().filter(t => !t.completed);
              return (
                <>
                  {activeFiltered.length === 0 ? (
                    <div className="empty-state">
                      <p>No active tasks match your filters. Try adjusting them or add a new task.</p>
                    </div>
                  ) : (
                    <div className="tasks">
                      {activeFiltered.map(task => {
                        const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                        const timeRemaining = getTimeRemaining(task.deadline);
                        const urgencyClass = getUrgencyClass(task.deadline);
                        const riskTint = getRiskTintClass(risk);
                        
                        return (
                          <div key={task.id} className={`task-card ${urgencyClass} ${riskTint}`}>
                            <div className="task-checkbox">
                              <input type="checkbox" checked={task.completed} onChange={() => handleToggleComplete(task.id)} onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div className="task-content" onClick={() => navigate(`/task/${task.id}`)}>
                              <div className="task-header">
                                <span className="task-name">{task.name}</span>
                                {renderRiskBadge(risk, 'sm')}
                              </div>
                              <div className="task-meta">
                                <span className="task-meta-item">{Icons.calendar} {formatDate(task.deadline)}</span>
                                <span className="task-meta-item" style={timeRemaining.urgent ? { color: '#DC2626', fontWeight: 700 } : {}}>
                                  {Icons.clock} {timeRemaining.text}
                                </span>
                                <span className="task-meta-item">{Icons.book} {task.hoursPerDay || 0}h/day</span>
                                {renderDueLabel(task.deadline, task.completed)}
                              </div>
                              <span className="task-risk-explanation">{getRiskExplanation(task.deadline, task.priority, task.hoursPerDay)}</span>
                            </div>
                            <div className="task-actions">
                              <button className="task-action-btn view-btn" title="View Details" onClick={(e) => { e.stopPropagation(); navigate(`/task/${task.id}`); }}>{Icons.eye}</button>
                              <button className="task-action-btn edit-btn" title="Edit Task" onClick={(e) => { e.stopPropagation(); navigate(`/edit-task/${task.id}`); }}>{Icons.edit}</button>
                              <button className="task-action-btn complete-btn" title="Mark Complete" onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id); }}>{Icons.checkCircle}</button>
                              <button className="task-action-btn delete-btn" title="Delete Task" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}>{Icons.trash}</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Completed Tasks Section — only show when there are completed tasks */}
            {completedTasks.length > 0 && (
              <div className="my-tasks-completed-section">
                <div className="completed-section-header">
                  <h2>Completed Tasks</h2>
                  <span className="completed-count-badge">{completedTasks.length} done</span>
                </div>
                <div className="completed-cards-area">
                  <div className="completed-tasks-list">
                    {completedTasks.map(task => (
                      <div key={task.id} className="completed-task-item">
                        <button
                          className="completed-task-uncheck"
                          onClick={() => handleToggleComplete(task.id)}
                          title="Mark as incomplete"
                        >
                          {Icons.checkCircle}
                        </button>
                        <span className="completed-task-name">{task.name}</span>
                        <span className="completed-task-date">Completed &middot; {formatDateShort(task.deadline)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Calendar Page */}
        {activePage === 'calendar' && (
          <section className="page-section calendar-page-section">
            {/* Calendar Header */}
            <div className="cal-header">
              <div className="cal-header-left">
                <h2 className="cal-title">Calendar</h2>
                <p className="cal-subtitle">Your deadlines at a glance. Click a date to see details.</p>
              </div>
              <div className="cal-header-actions">
                <button className="cal-today-btn" onClick={goToToday}>Today</button>
              </div>
            </div>

            {/* Top Stats Bar */}
            <div className="cal-stats-bar">
              <div className="cal-stat-card">
                <div className="cal-stat-icon blue">{Icons.calendar}</div>
                <div className="cal-stat-info">
                  <span className="cal-stat-value">{calStats.thisWeek}</span>
                  <span className="cal-stat-label">This Week</span>
                </div>
              </div>
              <div className="cal-stat-card">
                <div className="cal-stat-icon amber">{Icons.clock}</div>
                <div className="cal-stat-info">
                  <span className="cal-stat-value">{calStats.upcoming}</span>
                  <span className="cal-stat-label">Upcoming</span>
                </div>
              </div>
              <div className="cal-stat-card">
                <div className="cal-stat-icon green">{Icons.checkCircle}</div>
                <div className="cal-stat-info">
                  <span className="cal-stat-value">{calStats.completedMonth}</span>
                  <span className="cal-stat-label">Done This Month</span>
                </div>
              </div>
              <div className="cal-stat-card">
                <div className="cal-stat-icon red">{Icons.alertTriangle}</div>
                <div className="cal-stat-info">
                  <span className="cal-stat-value">{calStats.highPriority}</span>
                  <span className="cal-stat-label">High Priority</span>
                </div>
              </div>
            </div>

            {/* AI Productivity Insights Banner */}
            {calInsights.length > 0 && (
              <div className="cal-insights-bar">
                <span className="cal-insights-icon">{Icons.sparkles}</span>
                <div className="cal-insights-list">
                  {calInsights.map((insight, i) => (
                    <span key={i} className={`cal-insight-pill ${insight.type}`}>{insight.text}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Layout: Grid + Side Panel */}
            <div className="cal-layout">
              {/* Calendar Grid Card */}
              <div className="cal-grid-card">
                {/* Month Navigation */}
                <div className="cal-month-nav">
                  <button className="cal-nav-btn" onClick={() => navigateMonth(-1)} title="Previous month">
                    {Icons.arrowLeft}
                  </button>
                  <h3 className="cal-month-label">{monthYearLabel}</h3>
                  <button className="cal-nav-btn" onClick={() => navigateMonth(1)} title="Next month">
                    {Icons.arrowRight}
                  </button>
                </div>

                {/* Day Headers */}
                <div className="cal-day-headers">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="cal-day-header">{day}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="cal-grid">
                  {getCalendarDays().map((day, index) => {
                    const dayTasks = getTasksForDate(day.date);
                    const isCurrentDay = isToday(day.date);
                    const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                    const hasHighRisk = dayTasks.some(t => !t.completed && calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'High');
                    const hasMediumRisk = dayTasks.some(t => !t.completed && calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'Medium');
                    const hasLowRisk = dayTasks.some(t => !t.completed && calculateRisk(t.deadline, t.priority, t.hoursPerDay) === 'Low');
                    const hasCompleted = dayTasks.some(t => t.completed);
                    const activeCount = dayTasks.filter(t => !t.completed).length;
                    const isOverdue = dayTasks.some(t => !t.completed && getDaysUntilDeadline(t.deadline) < 0);
                    const now = new Date();
                    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const isPast = day.date < todayDate && day.currentMonth;

                    // Mini preview: show first task name (truncated)
                    const miniTasks = dayTasks.filter(t => !t.completed).slice(0, 2);

                    return (
                      <button
                        key={index}
                        className={`cal-cell ${!day.currentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''} ${hasHighRisk ? 'has-high' : ''} ${isOverdue && isPast ? 'overdue-past' : ''}`}
                        onClick={() => setSelectedDate(new Date(day.date))}
                      >
                        <span className="cal-cell-day">{day.date.getDate()}</span>
                        {dayTasks.length > 0 && (
                          <span className="cal-cell-badge">{dayTasks.length}</span>
                        )}
                        {dayTasks.length > 0 && (
                          <div className="cal-cell-dots">
                            {hasHighRisk && <span className="cal-dot high" />}
                            {hasMediumRisk && <span className="cal-dot medium" />}
                            {hasLowRisk && <span className="cal-dot low" />}
                            {hasCompleted && dayTasks.every(t => t.completed) && <span className="cal-dot completed" />}
                          </div>
                        )}
                        {day.currentMonth && miniTasks.length > 0 && (
                          <div className="cal-cell-preview">
                            {miniTasks.map((t, ti) => {
                              const tRisk = calculateRisk(t.deadline, t.priority, t.hoursPerDay);
                              return (
                                <span key={ti} className={`cal-cell-preview-item ${tRisk.toLowerCase()}`}>
                                  {t.name.length > 8 ? t.name.substring(0, 8) + '…' : t.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="cal-legend">
                  <span className="cal-legend-item"><span className="cal-dot high" /> High Risk</span>
                  <span className="cal-legend-item"><span className="cal-dot medium" /> Medium</span>
                  <span className="cal-legend-item"><span className="cal-dot low" /> Low</span>
                  <span className="cal-legend-item"><span className="cal-dot completed" /> Done</span>
                </div>
              </div>

              {/* Side Task Panel */}
              <div className="cal-panel">
                <div className="cal-panel-header">
                  <h3 className="cal-panel-title">
                    {selectedDate ? (
                      isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    ) : 'Select a date'}
                  </h3>
                  {selectedDateTasks.length > 0 && (
                    <span className="cal-panel-count">{selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Priority Breakdown */}
                {selectedBreakdown && (
                  <div className="cal-breakdown">
                    <div className="cal-breakdown-bar">
                      {selectedBreakdown.high > 0 && (
                        <div className="cal-breakdown-segment high" style={{ width: `${(selectedBreakdown.high / selectedBreakdown.total) * 100}%` }} />
                      )}
                      {selectedBreakdown.medium > 0 && (
                        <div className="cal-breakdown-segment medium" style={{ width: `${(selectedBreakdown.medium / selectedBreakdown.total) * 100}%` }} />
                      )}
                      {selectedBreakdown.low > 0 && (
                        <div className="cal-breakdown-segment low" style={{ width: `${(selectedBreakdown.low / selectedBreakdown.total) * 100}%` }} />
                      )}
                      {selectedBreakdown.done > 0 && (
                        <div className="cal-breakdown-segment done" style={{ width: `${(selectedBreakdown.done / selectedBreakdown.total) * 100}%` }} />
                      )}
                    </div>
                    <div className="cal-breakdown-labels">
                      {selectedBreakdown.high > 0 && <span className="cal-breakdown-label high">{selectedBreakdown.high} High</span>}
                      {selectedBreakdown.medium > 0 && <span className="cal-breakdown-label medium">{selectedBreakdown.medium} Med</span>}
                      {selectedBreakdown.low > 0 && <span className="cal-breakdown-label low">{selectedBreakdown.low} Low</span>}
                      {selectedBreakdown.done > 0 && <span className="cal-breakdown-label done">{selectedBreakdown.done} Done</span>}
                    </div>
                  </div>
                )}

                {/* Task List */}
                {selectedDateTasks.length > 0 ? (
                  <div className="cal-panel-tasks">
                    {selectedDateTasks.map((task, idx) => {
                      const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                      const daysLeft = getDaysUntilDeadline(task.deadline);
                      const priorityColors = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' };
                      return (
                        <div
                          key={task.id}
                          className={`cal-task-card ${task.completed ? 'completed' : ''}`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="cal-task-card-top">
                            <div className="cal-task-card-left-accent" style={{ background: task.completed ? '#94A3B8' : priorityColors[task.priority] || '#3B82F6' }} />
                            <div className="cal-task-card-body">
                              <div className="cal-task-card-header">
                                <span className="cal-task-card-name" onClick={() => navigate(`/task/${task.id}`)}>{task.name}</span>
                                <div className="cal-task-card-badges">
                                  {renderRiskBadge(risk, 'sm')}
                                </div>
                              </div>
                              <div className="cal-task-card-meta">
                                <span className="cal-task-meta-tag">
                                  {Icons.clock}
                                  {task.completed
                                    ? 'Completed'
                                    : daysLeft < 0
                                      ? `Overdue ${Math.abs(daysLeft)}d`
                                      : daysLeft === 0
                                        ? 'Due today'
                                        : `${daysLeft}d left`
                                  }
                                </span>
                                <span className="cal-task-meta-tag">
                                  {Icons.book}
                                  {task.hoursPerDay || 0}h/day
                                </span>
                                <span className="cal-task-meta-tag priority-tag" style={{ color: priorityColors[task.priority] }}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="cal-task-card-actions">
                            <button className="cal-task-action" title="View" onClick={(e) => { e.stopPropagation(); navigate(`/task/${task.id}`); }}>{Icons.eye}</button>
                            <button className="cal-task-action" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/edit-task/${task.id}`); }}>{Icons.edit}</button>
                            <button className="cal-task-action" title={task.completed ? 'Mark Incomplete' : 'Mark Complete'} onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id); }}>{Icons.checkCircle}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : selectedDate ? (
                  <div className="cal-panel-empty">
                    <div className="cal-panel-empty-icon">{Icons.calendar}</div>
                    <p className="cal-panel-empty-text">No tasks for this date</p>
                    <button className="cal-panel-empty-btn" onClick={() => navigate('/add-task')}>
                      {Icons.plus} Add Task
                    </button>
                  </div>
                ) : (
                  <div className="cal-panel-empty">
                    <div className="cal-panel-empty-icon">{Icons.calendar}</div>
                    <p className="cal-panel-empty-text">Click a date to view tasks</p>
                  </div>
                )}

                {/* Study Recommendation Card */}
                {tasks.length > 0 && (
                  <div className="cal-study-rec">
                    <div className="cal-study-rec-header">
                      <span className="cal-study-rec-icon">{Icons.lightbulb}</span>
                      <span className="cal-study-rec-title">Study Tip</span>
                    </div>
                    <p className="cal-study-rec-text">
                      {(() => {
                        const weekTasks = tasks.filter(t => {
                          const d = new Date(t.deadline);
                          const now = new Date();
                          const endW = new Date(now);
                          endW.setDate(endW.getDate() + 7);
                          return !t.completed && d >= now && d < endW;
                        });
                        const weekHours = weekTasks.reduce((s, t) => s + (t.hoursPerDay || 1), 0);
                        if (weekTasks.length === 0) return 'No deadlines this week — use this time to review past material or get ahead.';
                        if (weekHours > 20) return `Heavy week — aim for ${Math.round(weekHours / 5)}h/day across 5 study sessions. Break tasks into 45-min blocks.`;
                        if (weekHours > 10) return `Moderate week — ${Math.round(weekHours / 5)}h/day should cover your ${weekTasks.length} upcoming tasks comfortably.`;
                        return `Light week — ${weekTasks.length} task${weekTasks.length > 1 ? 's' : ''} due. Focus on quality over quantity.`;
                      })()}
                    </p>
                  </div>
                )}

                {/* Quick Add Task Button */}
                <div className="cal-panel-footer">
                  <button className="cal-quick-add-btn" onClick={() => navigate('/add-task')}>
                    {Icons.plus} Quick Add Task
                  </button>
                </div>
              </div>
            </div>

            {/* Empty state when no tasks at all */}
            {tasks.length === 0 && (
              <div className="cal-empty-full">
                <div className="cal-empty-full-icon">{Icons.calendar}</div>
                <h3 className="cal-empty-full-title">No tasks yet</h3>
                <p className="cal-empty-full-text">Add your first task to see deadlines appear on the calendar.</p>
                <button className="add-task-btn-header" onClick={() => navigate('/add-task')}>
                  {Icons.plus} Add Your First Task
                </button>
              </div>
            )}
          </section>
        )}

        {/* Study Plan Page */}
        {activePage === 'study' && <StudyPlanPage />}

        {/* Progress Page */}
        {activePage === 'stats' && (
          <section className="page-section">
            <h2>Your Progress</h2>
            <p className="page-description">Every task you complete is progress. Here's how you're tracking.</p>

            {/* Completion Overview Card */}
            <div className="progress-overview-card">
              <div className="progress-overview-left">
                <div className="completion-ring-wrapper">
                  <svg className="completion-ring" viewBox="0 0 120 120">
                    <circle className="completion-ring-bg" cx="60" cy="60" r="52" />
                    <circle className="completion-ring-fill" cx="60" cy="60" r="52"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 52}`,
                        strokeDashoffset: `${2 * Math.PI * 52 * (1 - (progressStats.totalCount > 0 ? progressStats.completedCount / progressStats.totalCount : 0))}`,
                      }}
                    />
                    <text x="60" y="55" className="completion-ring-value" textAnchor="middle" dominantBaseline="central">
                      {progressStats.completionPercent}%
                    </text>
                    <text x="60" y="72" className="completion-ring-label" textAnchor="middle" dominantBaseline="central">Complete</text>
                  </svg>
                </div>
                <div className="progress-overview-info">
                  <h3>Overall Completion</h3>
                  <p className="progress-overview-desc">
                    {progressStats.completedCount === 0 && progressStats.totalCount > 0
                      ? "Ready to make your first mark? Complete a task to start building momentum."
                      : progressStats.completedCount === progressStats.totalCount && progressStats.totalCount > 0
                      ? "Incredible \u2014 you've completed everything! Take a moment to celebrate."
                      : progressStats.completedCount >= progressStats.totalCount / 2
                      ? `You've completed ${progressStats.completedCount} of ${progressStats.totalCount} tasks. You're more than halfway \u2014 keep going!`
                      : `${progressStats.completedCount} of ${progressStats.totalCount} tasks done. Every completion is a step forward.`
                    }
                  </p>
                  <p className="progress-calculation-note">
                    Progress % = Completed Tasks &divide; Total Tasks
                  </p>
                  <div className="progress-milestone-badges">
                    {progressStats.completedCount >= 1 && <span className="milestone-badge achieved">{Icons.checkCircle} First Step</span>}
                    {progressStats.completedCount >= 3 && <span className="milestone-badge achieved">{Icons.target} Building Momentum</span>}
                    {progressStats.completedCount >= 5 && <span className="milestone-badge achieved">{Icons.trendingUp} On a Roll</span>}
                    {progressStats.completedCount === progressStats.totalCount && progressStats.totalCount > 0 && <span className="milestone-badge achieved gold">{Icons.sparkles} All Clear</span>}
                    {progressStats.completedCount < 1 && <span className="milestone-badge">{Icons.target} Complete your first task</span>}
                    {progressStats.completedCount >= 1 && progressStats.completedCount < 3 && <span className="milestone-badge">{Icons.target} Complete 3 tasks</span>}
                    {progressStats.completedCount >= 3 && progressStats.completedCount < 5 && <span className="milestone-badge">{Icons.trendingUp} Complete 5 tasks</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon blue">{Icons.list}</div><div className="stat-content"><span className="stat-value">{progressStats.completedCount}/{progressStats.totalCount}</span><span className="stat-label">Completed</span></div></div>
              <div className="stat-card success"><div className="stat-icon green">{Icons.checkCircle}</div><div className="stat-content"><span className="stat-value">{progressStats.completedCount}</span><span className="stat-label">Done</span></div></div>
              <div className="stat-card"><div className="stat-icon blue">{Icons.clock}</div><div className="stat-content"><span className="stat-value">{progressStats.activeCount}</span><span className="stat-label">Active Tasks</span></div></div>
              <div className="stat-card"><div className="stat-icon blue">{Icons.calendar}</div><div className="stat-content"><span className="stat-value">{progressStats.upcomingDeadline ? (progressStats.upcomingDeadline.daysLeft < 0 ? `Overdue ${Math.abs(progressStats.upcomingDeadline.daysLeft)}d` : progressStats.upcomingDeadline.daysLeft === 0 ? 'Today' : `${progressStats.upcomingDeadline.daysLeft}d`) : '\u2014'}</span><span className="stat-label">Next Due Date</span></div></div>
              <div className="stat-card"><div className="stat-icon purple">{Icons.trendingUp}</div><div className="stat-content"><span className="stat-value">{progressStats.weeklyProductivity}</span><span className="stat-label">Productivity</span></div></div>
              <div className="stat-card"><div className="stat-icon amber">{Icons.scale}</div><div className="stat-content"><span className="stat-value">{workload.weeklyHours}h</span><span className="stat-label">Weekly Load</span></div></div>
            </div>

            {/* Upcoming Deadline Card */}
            {progressStats.upcomingDeadline && (
              <div className="progress-upcoming-card">
                <div className="progress-upcoming-header">
                  <span className="progress-upcoming-icon">{Icons.calendar}</span>
                  <span className="progress-upcoming-title">Upcoming Deadline</span>
                </div>
                <div className="progress-upcoming-body">
                  <span className="progress-upcoming-task-name">{progressStats.upcomingDeadline.task.name}</span>
                  <span className={`progress-upcoming-days ${progressStats.upcomingDeadline.daysLeft < 0 ? 'overdue' : progressStats.upcomingDeadline.daysLeft <= 2 ? 'urgent' : ''}`}>
                    {progressStats.upcomingDeadline.daysLeft < 0
                      ? `${Math.abs(progressStats.upcomingDeadline.daysLeft)} day${Math.abs(progressStats.upcomingDeadline.daysLeft) !== 1 ? 's' : ''} overdue`
                      : progressStats.upcomingDeadline.daysLeft === 0
                      ? 'Due today'
                      : `${progressStats.upcomingDeadline.daysLeft} day${progressStats.upcomingDeadline.daysLeft !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
              </div>
            )}

            {/* Weekly Productivity Summary */}
            <div className="progress-productivity-card">
              <div className="progress-productivity-header">
                <span className="progress-productivity-icon">{Icons.trendingUp}</span>
                <span className="progress-productivity-title">Weekly Productivity</span>
              </div>
              <div className="progress-productivity-body">
                <span className="progress-productivity-value">{progressStats.weeklyProductivity}</span>
                <span className="progress-productivity-label">tasks completed</span>
              </div>
              <p className="progress-productivity-note">Productivity = total tasks marked complete</p>
            </div>

            {/* Risk & Priority Breakdown Row */}
            <div className="progress-breakdowns-row">
              {/* Risk Breakdown */}
              {tasks.length > 0 && (
                <div className="risk-breakdown-card">
                  <h3 className="risk-breakdown-title">Risk Breakdown</h3>
                  <div className="risk-breakdown-bars">
                    {(() => {
                      const total = progressStats.riskBreakdown.High + progressStats.riskBreakdown.Medium + progressStats.riskBreakdown.Low;
                      return total > 0 ? (
                        <>
                          <div className="risk-bar-row"><span className="risk-bar-label high">High</span><div className="risk-bar-track"><div className="risk-bar-fill high" style={{ width: `${(progressStats.riskBreakdown.High / total) * 100}%` }} /></div><span className="risk-bar-count">{progressStats.riskBreakdown.High}</span></div>
                          <div className="risk-bar-row"><span className="risk-bar-label medium">Medium</span><div className="risk-bar-track"><div className="risk-bar-fill medium" style={{ width: `${(progressStats.riskBreakdown.Medium / total) * 100}%` }} /></div><span className="risk-bar-count">{progressStats.riskBreakdown.Medium}</span></div>
                          <div className="risk-bar-row"><span className="risk-bar-label low">Low</span><div className="risk-bar-track"><div className="risk-bar-fill low" style={{ width: `${(progressStats.riskBreakdown.Low / total) * 100}%` }} /></div><span className="risk-bar-count">{progressStats.riskBreakdown.Low}</span></div>
                        </>
                      ) : <p className="risk-breakdown-empty">All tasks completed \u2014 no active risks!</p>;
                    })()}
                  </div>
                </div>
              )}

              {/* Priority Breakdown */}
              {tasks.length > 0 && (
                <div className="risk-breakdown-card">
                  <h3 className="risk-breakdown-title">Priority Breakdown</h3>
                  <div className="risk-breakdown-bars">
                    {(() => {
                      const total = progressStats.priorityBreakdown.High + progressStats.priorityBreakdown.Medium + progressStats.priorityBreakdown.Low;
                      return total > 0 ? (
                        <>
                          <div className="risk-bar-row"><span className="risk-bar-label high">High</span><div className="risk-bar-track"><div className="risk-bar-fill high" style={{ width: `${(progressStats.priorityBreakdown.High / total) * 100}%` }} /></div><span className="risk-bar-count">{progressStats.priorityBreakdown.High}</span></div>
                          <div className="risk-bar-row"><span className="risk-bar-label medium">Medium</span><div className="risk-bar-track"><div className="risk-bar-fill medium" style={{ width: `${(progressStats.priorityBreakdown.Medium / total) * 100}%` }} /></div><span className="risk-bar-count">{progressStats.priorityBreakdown.Medium}</span></div>
                          <div className="risk-bar-row"><span className="risk-bar-label low">Low</span><div className="risk-bar-track"><div className="risk-bar-fill low" style={{ width: `${(progressStats.priorityBreakdown.Low / total) * 100}%` }} /></div><span className="risk-bar-count">{progressStats.priorityBreakdown.Low}</span></div>
                        </>
                      ) : <p className="risk-breakdown-empty">No active tasks with priority data.</p>;
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Completed Tasks */}
            {progressStats.recentCompleted.length > 0 && (
              <div className="progress-recent-card">
                <h3 className="progress-recent-title">Recently Completed</h3>
                <div className="progress-recent-list">
                  {progressStats.recentCompleted.map(task => (
                    <div key={task.id} className="progress-recent-item">
                      <span className="progress-recent-check">{Icons.checkCircle}</span>
                      <span className="progress-recent-name">{task.name}</span>
                      <span className="progress-recent-date">{formatDateShort(task.deadline)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements Section */}
            <div className="achievements-section">
              <h3 className="achievements-title">Achievements</h3>
              <p className="achievements-subtitle">Track your milestones and celebrate your wins</p>
              <div className="achievements-grid">
                <div className={`achievement-card ${tasks.length >= 1 ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon-area">{Icons.rocket}</div>
                  <div className="achievement-info">
                    <h4>🚀 First Task</h4>
                    <p>Create your first task</p>
                  </div>
                  <span className="achievement-status">{tasks.length >= 1 ? Icons.checkCircle : Icons.lock}</span>
                </div>
                <div className={`achievement-card ${progressStats.completedCount >= 1 ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon-area">{Icons.checkCircle}</div>
                  <div className="achievement-info">
                    <h4>✅ First Completion</h4>
                    <p>Complete your first task</p>
                  </div>
                  <span className="achievement-status">{progressStats.completedCount >= 1 ? Icons.checkCircle : Icons.lock}</span>
                </div>
                <div className={`achievement-card ${progressStats.completedCount >= 3 ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon-area">{Icons.zap}</div>
                  <div className="achievement-info">
                    <h4>🔥 Study Streak</h4>
                    <p>Complete 3 tasks</p>
                  </div>
                  <span className="achievement-status">{progressStats.completedCount >= 3 ? Icons.checkCircle : Icons.lock}</span>
                </div>
                <div className={`achievement-card ${progressStats.totalCount > 0 && progressStats.completedCount >= progressStats.totalCount / 2 ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon-area">{Icons.target}</div>
                  <div className="achievement-info">
                    <h4>🎯 Halfway There</h4>
                    <p>Complete 50% of tasks</p>
                  </div>
                  <span className="achievement-status">{progressStats.totalCount > 0 && progressStats.completedCount >= progressStats.totalCount / 2 ? Icons.checkCircle : Icons.lock}</span>
                </div>
                <div className={`achievement-card ${progressStats.completedCount >= 5 ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon-area">{Icons.trendingUp}</div>
                  <div className="achievement-info">
                    <h4>🌟 Productivity Pro</h4>
                    <p>Complete 5 tasks</p>
                  </div>
                  <span className="achievement-status">{progressStats.completedCount >= 5 ? Icons.checkCircle : Icons.lock}</span>
                </div>
                <div className={`achievement-card ${progressStats.completedCount === progressStats.totalCount && progressStats.totalCount > 0 ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon-area">{Icons.sparkles}</div>
                  <div className="achievement-info">
                    <h4>🧹 All Clear</h4>
                    <p>Complete every task</p>
                  </div>
                  <span className="achievement-status">{progressStats.completedCount === progressStats.totalCount && progressStats.totalCount > 0 ? Icons.checkCircle : Icons.lock}</span>
                </div>
              </div>
            </div>

            {/* Empty state — motivational */}
            {tasks.length === 0 && (
              <div className="progress-empty-welcome">
                <div className="progress-empty-mascot">{Icons.coach}</div>
                <h3>Your Progress Journey Starts Here</h3>
                <p>Every great achievement begins with a single step. Add your first task and watch your progress grow!</p>
                <button className="progress-empty-cta" onClick={() => navigate('/add-task')}>
                  {Icons.plus} Create Your First Task
                </button>
              </div>
            )}
          </section>
        )}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <section className="page-section">
            <h2>Settings</h2>
            <p className="page-description">Personalize your experience.</p>

            {/* Profile Card */}
            <div className="settings-profile-card">
              <div className="settings-profile-avatar">{user?.name?.charAt(0).toUpperCase() || 'S'}</div>
              <div className="settings-profile-info">
                <h3>{user?.name || 'Student'}</h3>
                <p>{user?.email || 'student@example.com'}</p>
              </div>
              <span className="settings-profile-badge">Student Plan</span>
            </div>

            {/* Profile Management */}
            <div className="settings-section-header"><h3>Profile</h3></div>
            <div className="settings-list">
              <div className="settings-item settings-item-form">
                <div className="settings-info">
                  <div className="settings-icon-wrapper blue">{Icons.user}</div>
                  <div>
                    <h3>Display Name</h3>
                    <p>This name appears in your dashboard greeting and sidebar</p>
                  </div>
                </div>
                <div className="settings-form">
                  <input
                    type="text"
                    className="settings-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={30}
                  />
                  <button className="settings-btn" onClick={handleSaveProfile}>
                    Save Profile
                  </button>
                </div>
              </div>
              {profileMessage && (
                <div className={`settings-message ${profileMessage.type}`}>
                  {profileMessage.type === 'success' ? Icons.checkCircle : Icons.alertTriangle}
                  <span>{profileMessage.text}</span>
                </div>
              )}
            </div>

            {/* Account Security */}
            <div className="settings-section-header"><h3>Account Security</h3></div>
            <div className="settings-list">
              <div className="settings-item settings-item-form">
                <div className="settings-info">
                  <div className="settings-icon-wrapper blue">{Icons.shield}</div>
                  <div>
                    <h3>Change Password</h3>
                    <p>Update your account password</p>
                  </div>
                </div>
                <div className="settings-form">
                  <input
                    type="password"
                    className="settings-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    autoComplete="new-password"
                  />
                  <input
                    type="password"
                    className="settings-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button className="settings-btn" onClick={handleUpdatePassword}>
                    Update Password
                  </button>
                </div>
              </div>
              {passwordMessage && (
                <div className={`settings-message ${passwordMessage.type}`}>
                  {passwordMessage.type === 'success' ? Icons.checkCircle : Icons.alertTriangle}
                  <span>{passwordMessage.text}</span>
                </div>
              )}
            </div>

            {/* Appearance */}
            <div className="settings-section-header"><h3>Appearance</h3></div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.palette}</div><div><h3>Theme</h3><p>Choose your preferred color scheme</p></div></div>
                <ThemeToggle />
              </div>
            </div>

            {/* Study Buddy */}
            <div className="settings-section-header"><h3>Study Buddy</h3></div>
            <div className="settings-list">
              {buddyList.map(b => (
                <button
                  key={b.id}
                  className={`settings-item study-buddy-option ${studyBuddy === b.id ? 'active' : ''}`}
                  onClick={() => setStudyBuddy(b.id)}
                >
                  <div className="settings-info">
                    <div className="study-buddy-option-emoji">{b.emoji}</div>
                    <div>
                      <h3>{b.name}</h3>
                      <p>{b.personality}</p>
                    </div>
                  </div>
                  {studyBuddy === b.id && (
                    <span className="settings-status-badge active">Selected</span>
                  )}
                </button>
              ))}
            </div>

            {/* Study Preferences */}
            <div className="settings-section-header"><h3>Study Preferences</h3></div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.clock}</div><div><h3>Daily Study Target</h3><p>Based on your tasks: {workload.dailyAvg}h/day average</p></div></div>
                <span className="settings-value-badge">{workload.dailyAvg}h</span>
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.scale}</div><div><h3>Workload Level</h3><p>Current workload: {workload.activeTasks} active tasks</p></div></div>
                <span className={`settings-value-badge ${workload.loadLevel.toLowerCase()}`}>{workload.loadLevel}</span>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="settings-section-header"><h3>Notifications</h3></div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.bell}</div><div><h3>Upcoming Deadline Reminders</h3><p>Get reminded about tasks approaching their deadlines</p></div></div>
                <span className="settings-status-badge active">{reminders.count} active</span>
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.sparkles}</div><div><h3>AI Study Reminders</h3><p>Smart reminders based on your study patterns</p></div></div>
                <span className="settings-status-badge active">Enabled</span>
              </div>
            </div>

            {/* AI Coach Preferences */}
            <div className="settings-section-header"><h3>AI Coach</h3></div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.coach}</div><div><h3>Coaching Style</h3><p>How the AI coach communicates with you</p></div></div>
                <span className="settings-value-badge">Supportive</span>
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.activity}</div><div><h3>Recommendation Frequency</h3><p>How often you receive AI suggestions</p></div></div>
                <span className="settings-value-badge">Real-time</span>
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="settings-section-header"><h3>Data & Privacy</h3></div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.user}</div><div><h3>Account Information</h3><p>{user?.email || 'student@example.com'}</p></div></div>
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.shield}</div><div><h3>Data Summary</h3><p>Tracking {tasks.length} tasks across your academic journey</p></div></div>
                <span className="settings-value-badge">{tasks.length} tasks</span>
              </div>
            </div>

            {/* App Information */}
            <div className="settings-section-header"><h3>About</h3></div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.info}</div><div><h3>App Version</h3><p>AssignTify v1.0.0</p></div></div>
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.rocket}</div><div><h3>Build</h3><p>React + Vite + Supabase</p></div></div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Completion Toast */}
      {completionToast && (
        <div className={`completion-toast ${toastFading ? 'fading' : ''}`}>
          <div className="completion-toast-icon">{Icons.checkCircle}</div>
          <div className="completion-toast-content">
            <span className="completion-toast-title">{completionToast.title}</span>
            <span className="completion-toast-message">{completionToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;