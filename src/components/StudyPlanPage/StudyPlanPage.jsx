import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { calculateRisk, getDaysUntilDeadline, getStudyMomentum } from '../../utils/riskCalculator';
import { getSortedStudyTasks, getTaskSuggestion } from '../../utils/messages';
import Icons from '../../utils/icons';
import './StudyPlanPage.css';

const StudyPlanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    tasks,
    getTodaysFocus,
    getSummaryStats,
    getHighRiskTasks,
    getTasksSortedByDeadline,
    getUnifiedWorkload,
  } = useTasks();

  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ── Derived Data ──────────────────────────────────────────
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const stats = getSummaryStats();
  const highRiskTasks = getHighRiskTasks();
  const sortedTasks = getTasksSortedByDeadline();
  const todaysFocus = getTodaysFocus();
  const momentum = getStudyMomentum(tasks);
  const sortedStudyTasks = getSortedStudyTasks(incompleteTasks);

  const nearestDeadline = sortedTasks.length > 0 ? sortedTasks[0] : null;
  const nearestDaysLeft = nearestDeadline ? getDaysUntilDeadline(nearestDeadline.deadline) : null;

  // Focus task: highest risk incomplete task
  const focusTask = highRiskTasks.length > 0 ? highRiskTasks[0] : (sortedTasks.find(t => !t.completed) || null);
  const focusTaskRisk = focusTask ? calculateRisk(focusTask.deadline, focusTask.priority, focusTask.hoursPerDay) : null;
  const focusTaskDaysLeft = focusTask ? getDaysUntilDeadline(focusTask.deadline) : null;

  // ── Smart Study Recommendations ──────────────────────────
  // Weighted calculation: priority + urgency drive daily allocation.
  // Weekly = sum of hoursPerDay (each is total weekly per task).
  const getSmartStudyHours = () => {
    if (incompleteTasks.length === 0) return { daily: 0, weekly: 0, perTask: {} };

    const priorityWeight = { High: 1.5, Medium: 1.0, Low: 0.6 };
    const perTask = {};
    let weightedTotal = 0;

    incompleteTasks.forEach(t => {
      const daysLeft = Math.max(getDaysUntilDeadline(t.deadline), 1);
      const pWeight = priorityWeight[t.priority] || 1.0;
      // Urgency factor: tasks due sooner get more share (1/daysLeft scaled)
      const urgencyFactor = Math.min(30 / daysLeft, 3); // cap at 3x boost
      const baseHours = t.hoursPerDay || 1;
      const smartHours = Math.min(baseHours * pWeight * (0.5 + urgencyFactor * 0.3), 6);
      perTask[t.id] = Math.max(Math.round(smartHours * 10) / 10, 0.5);
      weightedTotal += perTask[t.id];
    });

    // Cap daily between 1–6h
    const daily = Math.max(1, Math.min(6, Math.round(weightedTotal * 10) / 10));
    // Weekly: sum of all task hoursPerDay (each is total weekly per task)
    const weekly = incompleteTasks.reduce((sum, t) => sum + (t.hoursPerDay || 1), 0);

    return { daily, weekly: Math.round(weekly * 10) / 10, perTask };
  };

  const smartHours = getSmartStudyHours();
  const totalHoursToday = smartHours.daily;

  // Use unified workload from context for consistent numbers across all pages
  const workload = getUnifiedWorkload();
  const smartWeeklyHours = workload.weeklyHours;
  // Map 4-tier load levels: Light, Moderate, Busy, Heavy
  const smartLoadLevel = workload.loadLevel;

  // Focus score
  const getFocusScore = () => {
    if (incompleteTasks.length === 0) return 100;
    const highCount = highRiskTasks.length;
    const overdueCount = incompleteTasks.filter(t => getDaysUntilDeadline(t.deadline) < 0).length;
    if (overdueCount > 0) return 25;
    if (highCount >= 3) return 30;
    if (highCount >= 1) return 55;
    if (workload.loadLevel === 'Heavy') return 60;
    return 85;
  };
  const focusScore = getFocusScore();

  // ── Weekly Schedule ───────────────────────────────────────
  const getWeeklySchedule = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const todayDayIndex = (today.getDay() + 6) % 7;

    return days.map((day, index) => {
      const dayTasks = incompleteTasks.filter(t => {
        const d = new Date(t.deadline);
        return (d.getDay() + 6) % 7 === index;
      });

      // Smart suggested hours: weighted by priority/urgency, capped at 6h/day
      const rawHours = dayTasks.reduce((sum, t) => sum + (smartHours.perTask[t.id] || (t.hoursPerDay || 1)), 0);
      const suggestedHours = Math.min(Math.round(rawHours * 10) / 10, 6);

      return {
        day,
        tasks: dayTasks,
        isToday: index === todayDayIndex,
        hasTasks: dayTasks.length > 0,
        suggestedHours,
      };
    });
  };
  const weekSchedule = getWeeklySchedule();

  // ── AI Recommendations ────────────────────────────────────
  const getAiRecommendations = () => {
    const recs = [];

    if (highRiskTasks.length > 0) {
      recs.push({
        icon: Icons.alertTriangle,
        title: 'Prioritise High-Risk Tasks',
        text: `You have ${highRiskTasks.length} high-risk task${highRiskTasks.length > 1 ? 's' : ''}. Start with "${highRiskTasks[0].name}" to lower your risk exposure.`,
        type: 'warning',
      });
    }

    if (smartLoadLevel === 'Heavy') {
      recs.push({
        icon: Icons.scale,
        title: 'Workload Alert',
        text: `${smartWeeklyHours}h/week across ${workload.activeTasks} tasks. Consider deferring lower-priority items or reducing daily hours.`,
        type: 'alert',
      });
    } else if (smartLoadLevel === 'Moderate') {
      recs.push({
        icon: Icons.lightbulb,
        title: 'Steady Progress Strategy',
        text: `With ${smartWeeklyHours}h/week, use 45-min focused blocks with short breaks for optimal retention.`,
        type: 'tip',
      });
    } else {
      recs.push({
        icon: Icons.rocket,
        title: 'Room to Grow',
        text: 'Your workload is light — great time to get ahead on upcoming tasks or revisit weaker areas.',
        type: 'positive',
      });
    }

    const overdueTasks = incompleteTasks.filter(t => getDaysUntilDeadline(t.deadline) < 0);
    if (overdueTasks.length > 0) {
      recs.push({
        icon: Icons.zap,
        title: 'Overdue Tasks Detected',
        text: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} past deadline. Tackle "${overdueTasks[0].name}" first to get back on track.`,
        type: 'warning',
      });
    } else if (focusTask && focusTaskDaysLeft !== null && focusTaskDaysLeft <= 3 && focusTaskDaysLeft >= 0) {
      recs.push({
        icon: Icons.zap,
        title: 'Sprint Mode',
        text: `"${focusTask.name}" is due ${focusTaskDaysLeft === 0 ? 'today' : `in ${focusTaskDaysLeft} day${focusTaskDaysLeft > 1 ? 's' : ''}`}. Dedicate focused blocks now.`,
        type: 'warning',
      });
    }

    return recs.slice(0, 3);
  };
  const aiRecs = getAiRecommendations();

  // ── Helpers ───────────────────────────────────────────────
  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderRiskBadge = (risk) => (
    <span className={`sp-risk-badge ${risk.toLowerCase()}`}>{risk}</span>
  );

  const getDaysLeftLabel = (daysLeft) => {
    if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ── Empty State ───────────────────────────────────────────
  if (incompleteTasks.length === 0) {
    return (
      <div className="study-plan-page">
        <section className={`sp-hero ${heroReady ? 'ready' : ''}`}>
          <div className="sp-hero-bg">
            <div className="sp-hero-content">
              <div className="sp-hero-left">
                <h1 className="sp-hero-title">AI Study Coach</h1>
                <p className="sp-hero-subtitle">
                  {getGreeting()}, {user?.name || 'Student'}. You're all caught up — no active tasks to plan for.
                </p>
              </div>
            </div>
          </div>
        </section>
        <div className="sp-empty-full">
          <div className="sp-empty-full-icon">{Icons.checkCircle}</div>
          <h3>All Caught Up</h3>
          <p>No active tasks — add a new task to generate a study plan.</p>
          <button className="sp-add-task-btn" onClick={() => navigate('/add-task')}>
            {Icons.plus} Add Your First Task
          </button>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────
  return (
    <div className="study-plan-page">
      {/* ═══ HERO SECTION ═══ */}
      <section className={`sp-hero ${heroReady ? 'ready' : ''}`}>
        <div className="sp-hero-bg">
          <div className="sp-hero-content">
            <div className="sp-hero-left">
              <div className="sp-hero-badge-row">
                <span className="sp-ai-badge">{Icons.sparkles} AI Powered</span>
              </div>
              <h1 className="sp-hero-title">AI Study Coach</h1>
              <p className="sp-hero-subtitle">
                {getGreeting()}, {user?.name || 'Student'}. You have <strong>{incompleteTasks.length} active task{incompleteTasks.length !== 1 ? 's' : ''}</strong> requiring <strong>{totalHoursToday}h/day</strong> of study. Here's your personalised plan.
              </p>

              {focusTask && (
                <div className="sp-hero-focus-card">
                  <div className="sp-hero-focus-top">
                    {renderRiskBadge(focusTaskRisk)}
                    <span className="sp-hero-focus-deadline">
                      {Icons.clock} {getDaysLeftLabel(focusTaskDaysLeft)}
                    </span>
                  </div>
                  <h3 className="sp-hero-focus-name">{focusTask.name}</h3>
                  <p className="sp-hero-focus-meta">
                    {Icons.flag} {focusTask.priority} Priority &middot; {focusTask.hoursPerDay || 1}h/day
                  </p>
                </div>
              )}
            </div>

            <div className="sp-hero-right">
              <div className="sp-hero-stat-grid">
                <div className="sp-hero-mini-stat">
                  <span className="sp-hero-mini-value">{totalHoursToday}h</span>
                  <span className="sp-hero-mini-label">Study / Day</span>
                </div>
                <div className="sp-hero-mini-stat">
                  <span className="sp-hero-mini-value">{smartWeeklyHours}h</span>
                  <span className="sp-hero-mini-label">This Week</span>
                </div>
                <div className="sp-hero-mini-stat">
                  <span className="sp-hero-mini-value">{momentum.progressPercent}%</span>
                  <span className="sp-hero-mini-label">Progress</span>
                </div>
              </div>
              <div className={`sp-hero-workload-pill ${smartLoadLevel.toLowerCase()}`}>
                {Icons.scale} {smartLoadLevel} Workload
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4 STAT CARDS ═══ */}
      <section className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-icon blue">{Icons.clock}</div>
          <div className="sp-stat-body">
            <span className="sp-stat-value">{totalHoursToday}h</span>
            <span className="sp-stat-label">Study Hours Today</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-icon amber">{Icons.list}</div>
          <div className="sp-stat-body">
            <span className="sp-stat-value">{incompleteTasks.length}</span>
            <span className="sp-stat-label">Tasks To Do</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-icon purple">{Icons.calendar}</div>
          <div className="sp-stat-body">
            <span className="sp-stat-value">
              {nearestDaysLeft !== null ? (nearestDaysLeft < 0 ? `${Math.abs(nearestDaysLeft)}d late` : nearestDaysLeft === 0 ? 'Today' : `${nearestDaysLeft}d`) : '—'}
            </span>
            <span className="sp-stat-label">Closest Deadline</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className={`sp-stat-icon ${focusScore >= 70 ? 'green' : focusScore >= 45 ? 'amber' : 'red'}`}>{Icons.target}</div>
          <div className="sp-stat-body">
            <span className="sp-stat-value">{focusScore}</span>
            <span className="sp-stat-label">Focus Score</span>
          </div>
        </div>
      </section>

      {/* ═══ TOP ROW: Weekly Schedule + AI Recommendations ═══ */}
      <div className="sp-top-grid">
        <section className="sp-weekly-section">
          <div className="sp-section-header">
            <div className="sp-section-header-left">
              <span className="sp-section-icon">{Icons.calendar}</span>
              <h2>Weekly Study Schedule</h2>
            </div>
          </div>
          <div className="sp-week-grid">
            {weekSchedule.map((day, i) => (
              <div key={i} className={`sp-day-card ${day.isToday ? 'today' : ''} ${day.hasTasks ? 'has-tasks' : ''}`}>
                <span className="sp-day-label">{day.day}</span>
                <span className="sp-day-date">
                  {(() => {
                    const d = new Date();
                    const diff = i - ((d.getDay() + 6) % 7);
                    const target = new Date(d);
                    target.setDate(d.getDate() + diff);
                    return target.getDate();
                  })()}
                </span>
                {day.hasTasks ? (
                  <>
                    <div className="sp-day-indicators">
                      {day.tasks.slice(0, 3).map((t, ti) => {
                        const risk = calculateRisk(t.deadline, t.priority, t.hoursPerDay);
                        return <span key={ti} className={`sp-day-dot ${risk.toLowerCase()}`} title={t.name} />;
                      })}
                      {day.tasks.length > 3 && <span className="sp-day-more">+{day.tasks.length - 3}</span>}
                    </div>
                    <span className="sp-day-hours">{day.suggestedHours}h</span>
                  </>
                ) : (
                  <span className="sp-day-empty">Free</span>
                )}
                {day.isToday && <span className="sp-day-today-badge">Today</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="sp-ai-section">
          <div className="sp-section-header">
            <div className="sp-section-header-left">
              <span className="sp-section-icon">{Icons.sparkles}</span>
              <h2>AI Recommendations</h2>
            </div>
            <span className="sp-ai-tag">AI</span>
          </div>
          <div className="sp-ai-cards">
            {aiRecs.map((rec, i) => (
              <div key={i} className={`sp-ai-card ${rec.type}`}>
                <div className="sp-ai-card-icon">{rec.icon}</div>
                <div className="sp-ai-card-body">
                  <h4>{rec.title}</h4>
                  <p>{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ═══ MIDDLE ROW: Workload + Priority Focus ═══ */}
      <div className="sp-mid-grid">
        <section className="sp-workload-section">
          <div className="sp-section-header">
            <div className="sp-section-header-left">
              <span className="sp-section-icon">{Icons.scale}</span>
              <h2>Workload Balance</h2>
            </div>
            <span className={`sp-workload-badge ${smartLoadLevel.toLowerCase()}`}>{smartLoadLevel}</span>
          </div>
          <div className="sp-workload-card">
            <div className="sp-workload-ring-wrapper">
              <svg className="sp-workload-ring" viewBox="0 0 120 120">
                <circle className="sp-workload-ring-bg" cx="60" cy="60" r="52" />
                <circle
                  className={`sp-workload-ring-fill ${smartLoadLevel.toLowerCase()}`}
                  cx="60" cy="60" r="52"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - Math.min(smartWeeklyHours / 40, 1))}`,
                  }}
                />
                <text x="60" y="52" className="sp-workload-value" textAnchor="middle" dominantBaseline="central">
                  {smartWeeklyHours}h
                </text>
                <text x="60" y="72" className="sp-workload-label" textAnchor="middle" dominantBaseline="central">
                  / week
                </text>
              </svg>
            </div>
            <div className="sp-workload-details">
              <div className="sp-workload-detail-row">
                <span className="sp-workload-detail-label">Active Tasks</span>
                <span className="sp-workload-detail-value">{workload.activeTasks}</span>
              </div>
              <div className="sp-workload-detail-row">
                <span className="sp-workload-detail-label">Avg Hours / Day</span>
                <span className="sp-workload-detail-value">{smartWeeklyHours > 0 ? Math.round(smartWeeklyHours / 7 * 10) / 10 : 0}h</span>
              </div>
              <div className="sp-workload-detail-row">
                <span className="sp-workload-detail-label">Capacity Used</span>
                <span className="sp-workload-detail-value">{Math.round(Math.min((smartWeeklyHours / 40) * 100, 100))}%</span>
              </div>
            </div>
            <div className="sp-workload-bar-track">
              <div
                className={`sp-workload-bar-fill ${smartLoadLevel.toLowerCase()}`}
                style={{ width: `${Math.min((smartWeeklyHours / 40) * 100, 100)}%` }}
              />
            </div>
          </div>
        </section>

        {focusTask && (
          <section className="sp-focus-section">
            <div className="sp-section-header">
              <div className="sp-section-header-left">
                <span className="sp-section-icon">{Icons.target}</span>
                <h2>Priority Focus</h2>
              </div>
            </div>
            <div className="sp-focus-card" onClick={() => navigate(`/task/${focusTask.id}`)}>
              <div className="sp-focus-card-top">
                {renderRiskBadge(focusTaskRisk)}
                <span className="sp-focus-deadline">{Icons.clock} {getDaysLeftLabel(focusTaskDaysLeft)}</span>
              </div>
              <h3 className="sp-focus-name">{focusTask.name}</h3>
              <p className="sp-focus-suggestion">
                {Icons.lightbulb} {getTaskSuggestion(focusTask, focusTaskRisk, focusTaskDaysLeft)}
              </p>
              <div className="sp-focus-meta-row">
                <span>{Icons.calendar} {formatDateShort(focusTask.deadline)}</span>
                <span>{Icons.book} {focusTask.hoursPerDay || 1}h/day</span>
                <span>{Icons.flag} {focusTask.priority}</span>
              </div>
              <button className="sp-focus-cta" onClick={(e) => { e.stopPropagation(); navigate(`/task/${focusTask.id}`); }}>
                View Task Details {Icons.arrowRight}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* ═══ PRIORITY STUDY QUEUE ═══ */}
      <section className="sp-queue-section">
        <div className="sp-section-header">
          <div className="sp-section-header-left">
            <span className="sp-section-icon">{Icons.book}</span>
            <h2>Priority Study Queue</h2>
          </div>
          <span className="sp-queue-count">{sortedStudyTasks.length} task{sortedStudyTasks.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="sp-queue-grid">
          {sortedStudyTasks.map((task, index) => {
            const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
            const daysLeft = getDaysUntilDeadline(task.deadline);
            const suggestion = getTaskSuggestion(task, risk, daysLeft);

            return (
              <div
                key={task.id}
                className={`sp-queue-card ${risk.toLowerCase()}`}
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="sp-queue-card-header">
                  <div className="sp-queue-rank-col">
                    <span className={`sp-queue-rank ${risk.toLowerCase()}`}>{index + 1}</span>
                  </div>
                  <div className="sp-queue-title-col">
                    <h4 className="sp-queue-name">{task.name}</h4>
                    <div className="sp-queue-meta">
                      {renderRiskBadge(risk)}
                      <span className="sp-queue-meta-item">{Icons.calendar} {formatDateShort(task.deadline)}</span>
                      <span className="sp-queue-meta-item">{Icons.clock} {getDaysLeftLabel(daysLeft)}</span>
                      <span className="sp-queue-meta-item">{Icons.book} {task.hoursPerDay || 1}h/day</span>
                      <span className="sp-queue-meta-item">{Icons.flag} {task.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="sp-queue-recommendation">
                  <span className="sp-queue-reco-icon">{Icons.lightbulb}</span>
                  <p>{suggestion}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <div className="sp-page-footer">
        <p>{Icons.shield} Your data stays private & secure &middot; AssignTify AI Study Coach</p>
      </div>
    </div>
  );
};

export default StudyPlanPage;