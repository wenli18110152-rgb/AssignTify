import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { getGreeting, getNextAction, getRecommendedTask, getAIRecommendationMessage, getStudyNextStep, getSortedStudyTasks, getTaskSuggestion, getSmartRecommendation, generateReminders } from '../../utils/messages';
import { calculateRisk, getDaysUntilDeadline, getRiskColor, getTimeRemaining, isDueWithin24Hours, isDueWithin6Hours, getRiskExplanation, calculateRiskScore, getRiskLevel, getRiskLevelColor, calculateAcademicHealth, calculateStudyLoadForecast } from '../../utils/riskCalculator';
import { generateDemoTasks } from '../../utils/demoData';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import Icons from '../../utils/icons';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    tasks, 
    addTask,
    getTodaysFocus, 
    getSummaryStats, 
    getTasksSortedByDeadline,
    getHighRiskTasks,
    toggleComplete,
    deleteTask 
  } = useTasks();

  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [activePage, setActivePage] = useState('dashboard');
  const [healthRingReady, setHealthRingReady] = useState(false);
  const [completionToast, setCompletionToast] = useState(null);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

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

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => { setCurrentTime(new Date()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Animate health ring from 0 on mount
  useEffect(() => {
    const timer = setTimeout(() => setHealthRingReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-dismiss completion toast
  useEffect(() => {
    if (completionToast) {
      const timer = setTimeout(() => setCompletionToast(null), 2200);
      return () => clearTimeout(timer);
    }
  }, [completionToast]);

  // Wrapped toggle with toast
  const handleToggleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      toggleComplete(taskId);
      setCompletionToast('Well done! Task completed.');
    } else {
      toggleComplete(taskId);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      return daysLeft <= 3 && daysLeft >= 0;
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
    if (tasks.length === 0) return { text: "Ready to get started? Add your first task to begin tracking your deadlines." };
    if (completedTasks.length === tasks.length && tasks.length > 0) return { text: "All tasks completed. Great work on finishing everything." };
    if (stats.highRiskTasks > 0) return { text: `You have ${stats.highRiskTasks} task${stats.highRiskTasks > 1 ? 's' : ''} that could use some attention. A small step today makes a big difference.` };
    if (completedTasks.length > 0 && completedTasks.length >= tasks.length / 2) return { text: "Over halfway there \u2014 keep up the steady progress." };
    return { text: "You're on track. A small step today will help you stay ahead." };
  };

  const encouragement = getEncouragement();

  const academicHealth = calculateAcademicHealth(tasks);
  const smartRec = getSmartRecommendation(tasks);
  const loadForecast = calculateStudyLoadForecast(tasks);

  const handleLoadDemoData = () => {
    generateDemoTasks(addTask);
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

  // Helper: get due label for a task
  const getDueLabel = (deadline, completed) => {
    if (completed) return null;
    const daysLeft = getDaysUntilDeadline(deadline);
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const actualDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (actualDays < 0) return { text: 'Overdue', cls: 'overdue' };
    if (actualDays === 0) return { text: 'Due today', cls: 'today' };
    if (actualDays === 1) return { text: 'Due tomorrow', cls: 'tomorrow' };
    if (actualDays <= 3) return { text: `Due in ${actualDays} days`, cls: 'in-3days' };
    if (actualDays <= 7) return { text: `Due in ${actualDays} days`, cls: 'in-7days' };
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
      case 'Warning': return 'Needs a Push';
      case 'Critical': return 'Time to Focus';
      default: return level;
    }
  };

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
                      <div className="notification-dropdown-empty">No active reminders</div>
                    ) : (
                      reminders.reminders.map(reminder => (
                        <div 
                          key={reminder.taskId} 
                          className={`notification-dropdown-item ${reminder.category}`}
                          onClick={() => { navigate(`/task/${reminder.taskId}`); setBellOpen(false); }}
                        >
                          <span className={`notification-dot ${reminder.category}`} />
                          <span className="notification-message">{reminder.message}</span>
                        </div>
                      ))
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
        {/* Greeting */}
        <div className="greeting-section">
          <div>
            <h1 className="greeting-text">
              {getGreeting()}, {user?.name || 'Student'}
            </h1>
            <p className="greeting-subtitle">Here's your day at a glance</p>
          </div>
        </div>

        {/* Dashboard Page */}
        {activePage === 'dashboard' && (
          <>
            {/* Reminder Banner */}
            <div className={`reminder-banner ${reminders.count === 0 ? 'clear' : reminders.reminders[0].category}`}>
              <span className="reminder-banner-icon">{reminders.count === 0 ? Icons.checkCircle : Icons.bell}</span>
              <span className="reminder-banner-text">{reminders.summary}</span>
            </div>

            {/* Info Banner */}
            <div className="info-banner">
              <span className="info-banner-icon">{Icons.info}</span>
              <span className="info-banner-text">{encouragement.text}</span>
            </div>

            {/* Today's Focus */}
            <section className="todays-focus">
              <h2>Today's Focus</h2>
              <p className="focus-helper">Your top priority right now.</p>
              
              {focusTask ? (
                <div 
                  className="focus-hero-card"
                  onClick={() => navigate(`/task/${focusTask.id}`)}
                >
                  <div className="focus-hero-content">
                    {(() => {
                      const risk = calculateRisk(focusTask.deadline, focusTask.priority, focusTask.hoursPerDay);
                      const daysLeft = getDaysUntilDeadline(focusTask.deadline);
                      const suggestion = getNextAction(risk, focusTask.name);
                      
                      return (
                        <>
                          {renderRiskBadge(risk, 'md')}
                          <h3 className="focus-hero-title">{focusTask.name}</h3>
                          <div className="focus-hero-meta">
                            <span className="focus-hero-meta-item">
                              {Icons.calendar} Due: {formatDateShort(focusTask.deadline)}
                            </span>
                            <span className="focus-hero-meta-item">
                              {Icons.clock} {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                            </span>
                            <span className="focus-hero-meta-item">
                              {Icons.book} {focusTask.hoursPerDay || 0}h/day
                            </span>
                          </div>
                          <div className="focus-hero-suggestion">
                            {Icons.lightbulb} {suggestion}
                          </div>
                          <button 
                            className="focus-hero-cta"
                            onClick={(e) => { e.stopPropagation(); navigate(`/task/${focusTask.id}`); }}
                          >
                            View Details {Icons.arrowRight}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="focus-hero-card focus-hero-empty">
                  <div className="focus-hero-content" style={{ textAlign: 'center', alignItems: 'center' }}>
                    {renderRiskBadge('Low', 'md')}
                    <h3 className="focus-hero-empty-title">You're all caught up</h3>
                    <p className="focus-hero-empty-text">
                      Nothing urgent right now. Enjoy the breathing room, or add a new task when you're ready.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Academic Health Score */}
            <section className="academic-health-section">
              <div className="health-card">
                <div className="health-left">
                  <div className="health-ring-wrapper">
                    <svg className="health-ring" viewBox="0 0 80 80">
                      <circle className="health-ring-bg" cx="40" cy="40" r="34" />
                      <circle className="health-ring-fill" cx="40" cy="40" r="34"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 34}`,
                          strokeDashoffset: healthRingReady ? `${2 * Math.PI * 34 * (1 - academicHealth.score / 100)}` : `${2 * Math.PI * 34}`,
                          stroke: academicHealth.score >= 80 ? '#10B981' : academicHealth.score >= 60 ? '#3B82F6' : academicHealth.score >= 40 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                      <text x="40" y="40" className="health-ring-text" textAnchor="middle" dominantBaseline="central">
                        {academicHealth.score}
                      </text>
                    </svg>
                  </div>
                  <div className="health-info">
                    <h3>Academic Health</h3>
                    <span className={`health-level ${academicHealth.level.toLowerCase()}`}>{getHealthLevelLabel(academicHealth.level)}</span>
                    <p className="health-description">
                      {academicHealth.level === 'Excellent' && 'Your academic workload is well managed. Great balance!'}
                      {academicHealth.level === 'Good' && 'You\'re on track. Keep an eye on upcoming deadlines and you\'ll do great.'}
                      {academicHealth.level === 'Warning' && 'A few tasks are coming up. Starting today will keep you ahead.'}
                      {academicHealth.level === 'Critical' && 'Some tasks need your attention soon. A small step today can help you get back on track.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Today's Suggestion */}
            {smartRec && (
              <section className="recommendation-section">
                <div className="recommendation-card">
                  <div className="recommendation-header">
                    <span className="recommendation-icon">{Icons.target}</span>
                    <h3>Today's Suggestion</h3>
                  </div>
                  <p className="recommendation-message">{smartRec.message}</p>
                  <div className="recommendation-meta">
                    <span className={`risk-badge sm ${smartRec.risk.toLowerCase()}`}>{smartRec.risk}</span>
                    <span className="recommendation-days">{smartRec.daysLeft} day{smartRec.daysLeft !== 1 ? 's' : ''} left</span>
                    <button className="recommendation-cta" onClick={() => navigate(`/task/${smartRec.task.id}`)}>
                      View Task {Icons.arrowRight}
                    </button>
                  </div>
                </div>
              </section>
            )}

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
                  <span className="stat-label">Needs Attention</span>
                </div>
              </div>
            </section>

            {/* Upcoming Tasks */}
            <section className="upcoming-section">
              <div className="section-header">
                <h2>Coming Up</h2>
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
                          <span className="upcoming-card-meta-item">{Icons.clock} {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
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

            {/* All Tasks */}
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
              {filteredTasks.length === 0 ? (
                <div className="empty-state onboarding">
                  <div className="onboarding-content">
                    <h3>Welcome to AssignTify</h3>
                    <p>Your calm study companion. Track assignments, plan your sessions, and stay on top of deadlines — one step at a time.</p>
                    <div className="onboarding-actions">
                      <button className="add-task-btn-header" onClick={() => navigate('/add-task')}>
                        {Icons.plus} Create Your First Task
                      </button>
                      <button className="demo-data-btn" onClick={handleLoadDemoData}>
                        {Icons.download} Load Sample University Data
                      </button>
                    </div>
                    <div className="onboarding-examples">
                      <h4>Example tasks you can track:</h4>
                      <div className="example-tasks">
                        <div className="example-task high"><span className="example-dot" />BUS4012 Assignment 3 — <em>High Risk</em></div>
                        <div className="example-task medium"><span className="example-dot" />Business Analytics Report — <em>Medium Risk</em></div>
                        <div className="example-task low"><span className="example-dot" />Exam Revision Session — <em>Low Risk</em></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tasks">
                  {filteredTasks.map(task => {
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
                            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Completed Tasks */}
            <section className="completed-section">
              <div className="completed-section-header">
                <h2>Completed Tasks</h2>
                {completedTasks.length > 0 && (
                  <span className="completed-count-badge">{completedTasks.length} done</span>
                )}
              </div>
              <div className="completed-cards-area">
                {completedTasks.length > 0 ? (
                  <div className="completed-tasks-list">
                    {completedTasks.map(task => (
                      <div key={task.id} className="completed-task-item">
                        <span className="completed-task-check">{Icons.checkCircle}</span>
                        <span className="completed-task-name">{task.name}</span>
                        <span className="completed-task-date">Completed &middot; {formatDateShort(task.deadline)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="completed-empty">
                    <p className="completed-empty-text">No completed tasks yet.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* My Tasks Page */}
        {activePage === 'tasks' && (
          <section className="page-section">
            <h2>My Tasks</h2>
<p className="page-description">Manage, filter, and track all your assignments.</p>
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
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks match your filters. Try adjusting them or add a new task.</p>
              </div>
            ) : (
              <div className="tasks">
                {filteredTasks.map(task => {
                  const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                  const timeRemaining = getTimeRemaining(task.deadline);
                  const urgencyClass = getUrgencyClass(task.deadline);
                  const riskTint = getRiskTintClass(risk);
                  
                  return (
                    <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''} ${urgencyClass} ${riskTint}`}>
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
                        <button className="task-action-btn complete-btn" title={task.completed ? 'Mark Incomplete' : 'Mark Complete'} onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id); }}>{Icons.checkCircle}</button>
                        <button className="task-action-btn delete-btn" title="Delete Task" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>{Icons.trash}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Calendar Page */}
        {activePage === 'calendar' && (
          <section className="page-section">
            <h2>Calendar</h2>
<p className="page-description">Your deadlines, organized by date.</p>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks yet. Add a task to see it on the calendar.</p>
              </div>
            ) : (
              <div className="calendar-list">
                {(() => {
                  const calendarGroups = {};
                  tasks.forEach(task => {
                    const rawDate = new Date(task.deadline);
                    const dateKey = rawDate.toISOString().split('T')[0];
                    if (!calendarGroups[dateKey]) calendarGroups[dateKey] = { date: rawDate, tasks: [] };
                    calendarGroups[dateKey].tasks.push(task);
                  });
                  const sortedGroups = Object.values(calendarGroups).sort((a, b) => a.date - b.date);
                  return sortedGroups.map(({ date, tasks: dateTasks }) => {
                    const displayDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                    return (
                      <div key={displayDate} className="calendar-date-group">
                        <h3 className="calendar-date">{displayDate}</h3>
                        <div className="calendar-tasks">
                          {dateTasks.map(task => {
                            const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                            return (
                              <div key={task.id} className={`calendar-task ${task.completed ? 'completed' : ''}`} onClick={() => navigate(`/task/${task.id}`)}>
                                <span className="calendar-task-name">{task.name}</span>
                                {renderRiskBadge(risk, 'sm')}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </section>
        )}

        {/* Study Plan Page */}
        {activePage === 'study' && (
          <section className="page-section">
            <h2>Study Plan</h2>
<p className="page-description">Your priorities, sorted. Tackle one thing at a time.</p>
            {(() => {
              const sortedStudyTasks = getSortedStudyTasks(incompleteTasks);
              if (sortedStudyTasks.length === 0) {
                return (
                  <div className="empty-state">
                    <p>No active tasks. Add a task to create a study plan.</p>
                  </div>
                );
              }
              return (
                <>
                  <div className="study-ai-header">
                    <div className="study-ai-header-top">
                      {Icons.sparkles}
                      <span className="study-ai-badge">YOUR STUDY PLAN</span>
                    </div>
                    <p>
                      Here's your study plan, sorted by priority. Tackle high-priority tasks first for the best results.
                    </p>
                  </div>

                  <div className="study-summary">
                    <div className="study-card">
                      <div className="study-icon blue">{Icons.clock}</div>
                      <div className="study-content">
                        <span className="study-value">{sortedStudyTasks[0]?.hoursPerDay || 2} hrs/day</span>
                        <span className="study-label">Focus: {sortedStudyTasks[0]?.name || 'Top Task'}</span>
                      </div>
                    </div>
                    <div className="study-card">
                      <div className="study-icon green">{Icons.list}</div>
                      <div className="study-content">
                        <span className="study-value">{sortedStudyTasks.length}</span>
                        <span className="study-label">To Do</span>
                      </div>
                    </div>
                  </div>
                  <div className="study-plan-list">
                    <h3>Your Tasks (by priority)</h3>
                    {sortedStudyTasks.map((task, index) => {
                      const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
                      const daysLeft = getDaysUntilDeadline(task.deadline);
                      const suggestion = getTaskSuggestion(task, risk, daysLeft);
                      return (
                        <div key={task.id} className="study-task" onClick={() => navigate(`/task/${task.id}`)}>
                          <div className="study-task-header">
                            <span className={`study-task-number ${risk.toLowerCase()}`}>{index + 1}</span>
                            <span className="study-task-name">{task.name}</span>
                            {renderRiskBadge(risk, 'sm')}
                          </div>
                          <div className="study-task-meta">
                            <span>{Icons.calendar} Due: {formatDate(task.deadline)}</span>
                            <span>{Icons.clock} {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                            <span>{Icons.book} {task.hoursPerDay || 0} hrs/day</span>
                          </div>
                          <p className="study-task-suggestion">{Icons.lightbulb} {suggestion}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Progress Page */}
        {activePage === 'stats' && (
          <section className="page-section">
            <h2>Your Progress</h2>
            <p className="page-description">A quick look at how you're doing.</p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">{Icons.list}</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.totalTasks}</span>
                  <span className="stat-label">All Tasks</span>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon green">{Icons.checkCircle}</div>
                <div className="stat-content">
                  <span className="stat-value">{completedTasks.length}</span>
                  <span className="stat-label">Done</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">{Icons.clock}</div>
                <div className="stat-content">
                  <span className="stat-value">{activeTasks.length}</span>
                  <span className="stat-label">Active Tasks</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">{Icons.calendar}</div>
                <div className="stat-content">
                  <span className="stat-value">{stats.daysUntilNextDeadline !== null ? stats.daysUntilNextDeadline : '\u2014'}</span>
                  <span className="stat-label">Next Due Date</span>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <section className="page-section">
            <h2>Settings</h2>
<p className="page-description">Personalize your experience.</p>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info">
                  <div className="settings-icon-wrapper">{Icons.palette}</div>
                  <div>
                    <h3>Theme</h3>
                    <p>Choose your preferred color scheme</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <div className="settings-item">
                <div className="settings-info">
                  <div className="settings-icon-wrapper">{Icons.user}</div>
                  <div>
                    <h3>Account</h3>
                    <p>{user?.email || 'student@example.com'}</p>
                  </div>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-info">
                  <div className="settings-icon-wrapper">{Icons.info}</div>
                  <div>
                    <h3>App Version</h3>
                    <p>AssignTify v1.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Completion Toast */}
      {completionToast && (
        <div className="completion-toast">
          <div className="completion-toast-icon">{Icons.checkCircle}</div>
          <span className="completion-toast-text">{completionToast}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;