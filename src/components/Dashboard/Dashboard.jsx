import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { getGreeting, getNextAction, getRecommendedTask, getAIRecommendationMessage, getStudyNextStep, getSortedStudyTasks, getTaskSuggestion, getSmartRecommendation, generateReminders, getStudentInsights } from '../../utils/messages';
import { calculateRisk, getDaysUntilDeadline, getRiskColor, getTimeRemaining, isDueWithin24Hours, isDueWithin6Hours, getRiskExplanation, calculateRiskScore, getRiskLevel, getRiskLevelColor, calculateAcademicHealth, calculateStudyLoadForecast, getWorkloadSummary, getStudyMomentum, getDeadlineOverview, getWeeklyInsights } from '../../utils/riskCalculator';
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
    deleteTask,
    enterDemoMode,
    exitDemoMode,
    isDemoMode
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
      const timer = setTimeout(() => setCompletionToast(null), 2200);
      return () => clearTimeout(timer);
    }
  }, [completionToast]);

  const handleToggleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      toggleComplete(taskId);
      setCompletionToast('Nice! One less thing to worry about.');
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

  const academicHealth = calculateAcademicHealth(tasks);
  const smartRec = getSmartRecommendation(tasks);
  const loadForecast = calculateStudyLoadForecast(tasks);
  const studentInsights = getStudentInsights(tasks);
  const workload = getWorkloadSummary(tasks);
  const momentum = getStudyMomentum(tasks);
  const deadlineOverview = getDeadlineOverview(tasks);
  const weeklyInsights = getWeeklyInsights(tasks);

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

                  {/* Right: Health Score */}
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
                      {Icons.coach}
                    </div>
                    <div className="study-buddy-title-area">
                      <h3>Student Success Coach</h3>
                      <span className="study-buddy-subtitle">AI-powered academic guidance</span>
                    </div>
                  </div>
                  <div className="study-buddy-messages">
                    {buddyMessages.map((msg, index) => (
                      <div key={index} className={`buddy-message ${msg.type}`}>
                        <div className="buddy-message-avatar">
                          {Icons.coach}
                        </div>
                        <div className="buddy-message-bubble">
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {buddyMessages.length === 0 && (
                      <div className="buddy-message encouraging">
                        <div className="buddy-message-avatar">
                          {Icons.coach}
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
                      <span className={`insight-mini-badge ${workload.load.toLowerCase()}`}>{workload.load}</span>
                    </div>
                    <div className="insight-mini-bar-track">
                      <div className={`insight-mini-bar-fill ${workload.load.toLowerCase()}`}
                        style={{ width: `${Math.min((workload.totalWeeklyHours / 40) * 100, 100)}%` }} />
                    </div>
                    <span className="insight-mini-stat">{workload.totalWeeklyHours}h/week &middot; {workload.activeTasks} tasks</span>
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
            <p className="page-description">Your deadlines at a glance. Click any task for details.</p>
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
            <p className="page-description">Your personalised study plan. Start with what matters most.</p>
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
                    <p>Here's a plan sorted by priority. Focus on one task at a time — that's all you need.</p>
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
                            <span>{Icons.clock} {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}` : daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</span>
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
            <p className="page-description">Every task you complete is progress. Here's how you're tracking.</p>
            <div className="progress-overview-card">
              <div className="progress-overview-left">
                <div className="completion-ring-wrapper">
                  <svg className="completion-ring" viewBox="0 0 120 120">
                    <circle className="completion-ring-bg" cx="60" cy="60" r="52" />
                    <circle className="completion-ring-fill" cx="60" cy="60" r="52"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 52}`,
                        strokeDashoffset: `${2 * Math.PI * 52 * (1 - (tasks.length > 0 ? completedTasks.length / tasks.length : 0))}`,
                      }}
                    />
                    <text x="60" y="55" className="completion-ring-value" textAnchor="middle" dominantBaseline="central">
                      {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                    </text>
                    <text x="60" y="72" className="completion-ring-label" textAnchor="middle" dominantBaseline="central">Complete</text>
                  </svg>
                </div>
                <div className="progress-overview-info">
                  <h3>Overall Completion</h3>
                  <p className="progress-overview-desc">
                    {completedTasks.length === 0 && tasks.length > 0
                      ? "Ready to make your first mark? Complete a task to start building momentum."
                      : completedTasks.length === tasks.length && tasks.length > 0
                      ? "Incredible — you've completed everything! Take a moment to celebrate."
                      : completedTasks.length >= tasks.length / 2
                      ? `You've completed ${completedTasks.length} of ${tasks.length} tasks. You're more than halfway — keep going!`
                      : `${completedTasks.length} of ${tasks.length} tasks done. Every completion is a step forward.`
                    }
                  </p>
                  <div className="progress-milestone-badges">
                    {completedTasks.length >= 1 && <span className="milestone-badge achieved">{Icons.checkCircle} First Step</span>}
                    {completedTasks.length >= 3 && <span className="milestone-badge achieved">{Icons.target} Building Momentum</span>}
                    {completedTasks.length >= 5 && <span className="milestone-badge achieved">{Icons.trendingUp} On a Roll</span>}
                    {completedTasks.length === tasks.length && tasks.length > 0 && <span className="milestone-badge achieved gold">{Icons.sparkles} All Clear</span>}
                    {completedTasks.length < 1 && <span className="milestone-badge">{Icons.target} Complete your first task</span>}
                    {completedTasks.length >= 1 && completedTasks.length < 3 && <span className="milestone-badge">{Icons.target} Complete 3 tasks</span>}
                    {completedTasks.length >= 3 && completedTasks.length < 5 && <span className="milestone-badge">{Icons.trendingUp} Complete 5 tasks</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon blue">{Icons.list}</div><div className="stat-content"><span className="stat-value">{stats.totalTasks}</span><span className="stat-label">All Tasks</span></div></div>
              <div className="stat-card success"><div className="stat-icon green">{Icons.checkCircle}</div><div className="stat-content"><span className="stat-value">{completedTasks.length}</span><span className="stat-label">Done</span></div></div>
              <div className="stat-card"><div className="stat-icon blue">{Icons.clock}</div><div className="stat-content"><span className="stat-value">{activeTasks.length}</span><span className="stat-label">Active Tasks</span></div></div>
              <div className="stat-card"><div className="stat-icon blue">{Icons.calendar}</div><div className="stat-content"><span className="stat-value">{stats.daysUntilNextDeadline !== null ? (stats.daysUntilNextDeadline < 0 ? `Overdue ${Math.abs(stats.daysUntilNextDeadline)}d` : `${stats.daysUntilNextDeadline}d`) : '\u2014'}</span><span className="stat-label">Next Due Date</span></div></div>
            </div>
            {tasks.length > 0 && (
              <div className="risk-breakdown-card">
                <h3 className="risk-breakdown-title">Risk Breakdown</h3>
                <div className="risk-breakdown-bars">
                  {(() => {
                    const riskCounts = { High: 0, Medium: 0, Low: 0 };
                    tasks.filter(t => !t.completed).forEach(t => { const r = calculateRisk(t.deadline, t.priority, t.hoursPerDay); riskCounts[r]++; });
                    const total = riskCounts.High + riskCounts.Medium + riskCounts.Low;
                    return total > 0 ? (
                      <>
                        <div className="risk-bar-row"><span className="risk-bar-label high">High</span><div className="risk-bar-track"><div className="risk-bar-fill high" style={{ width: `${(riskCounts.High / total) * 100}%` }} /></div><span className="risk-bar-count">{riskCounts.High}</span></div>
                        <div className="risk-bar-row"><span className="risk-bar-label medium">Medium</span><div className="risk-bar-track"><div className="risk-bar-fill medium" style={{ width: `${(riskCounts.Medium / total) * 100}%` }} /></div><span className="risk-bar-count">{riskCounts.Medium}</span></div>
                        <div className="risk-bar-row"><span className="risk-bar-label low">Low</span><div className="risk-bar-track"><div className="risk-bar-fill low" style={{ width: `${(riskCounts.Low / total) * 100}%` }} /></div><span className="risk-bar-count">{riskCounts.Low}</span></div>
                      </>
                    ) : <p className="risk-breakdown-empty">All tasks completed — no active risks!</p>;
                  })()}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <section className="page-section">
            <h2>Settings</h2>
            <p className="page-description">Personalize your experience.</p>
            <div className="settings-profile-card">
              <div className="settings-profile-avatar">{user?.name?.charAt(0).toUpperCase() || 'S'}</div>
              <div className="settings-profile-info">
                <h3>{user?.name || 'Student'}</h3>
                <p>{user?.email || 'student@example.com'}</p>
              </div>
              <span className="settings-profile-badge">Student Plan</span>
            </div>
            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.palette}</div><div><h3>Theme</h3><p>Choose your preferred color scheme</p></div></div>
                <ThemeToggle />
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.user}</div><div><h3>Account</h3><p>{user?.email || 'student@example.com'}</p></div></div>
              </div>
              <div className="settings-item">
                <div className="settings-info"><div className="settings-icon-wrapper blue">{Icons.info}</div><div><h3>App Version</h3><p>AssignTify v1.0.0</p></div></div>
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