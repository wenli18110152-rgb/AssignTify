import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { calculateRisk, getDaysUntilDeadline, getRiskColor, calculateRiskScore, getRiskLevel, getRiskLevelColor } from '../../utils/riskCalculator';
import { getSupportiveMessage, getWhyItMatters, getNextAction, getReminderSuggestion } from '../../utils/messages';
import Icons from '../../utils/icons';
import './TaskDetail.css';

const TaskDetail = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { getTaskById, toggleComplete, deleteTask } = useTasks();
  const [toggling, setToggling] = useState(false);
  
  const task = getTaskById(taskId);

  if (!task) {
    return (
      <div className="task-detail">
        <div className="task-detail-container">
          <div className="not-found">
            <h2>Task Not Found</h2>
            <p>This task doesn't exist or has been deleted.</p>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
  const riskScore = calculateRiskScore(task.deadline, task.priority, task.hoursPerDay);
  const riskLevel = getRiskLevel(riskScore);
  const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
  const supportiveMessage = getSupportiveMessage(risk, daysUntilDeadline);
  const whyItMatters = getWhyItMatters(risk, daysUntilDeadline);
  const nextAction = getNextAction(risk, task.name, daysUntilDeadline);
  const reminderSuggestion = getReminderSuggestion(risk);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleComplete = async () => {
    setToggling(true);
    try {
      await toggleComplete(task.id);
    } catch (error) {
      alert('Failed to update task status. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id);
        navigate('/dashboard');
      } catch (error) {
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  return (
    <div className="task-detail">
      <div className="task-detail-container">
        <div className="task-detail-card">
          {/* Header */}
          <div className="detail-header">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              {Icons.arrowLeft} Back to Dashboard
            </button>
            <div className="header-actions">
              <button className="edit-btn-header" onClick={() => navigate(`/edit-task/${task.id}`)}>
                {Icons.edit} Edit
              </button>
              <button className={`complete-btn-header ${task.completed ? 'completed' : ''}`} onClick={handleToggleComplete} disabled={toggling}>
                {toggling ? 'Updating...' : task.completed ? 'Completed' : 'Mark Complete'}
              </button>
              <button className="delete-btn-header" onClick={handleDelete}>
                {Icons.trash} Delete
              </button>
            </div>
          </div>

          {/* Risk Badge */}
          <div className="risk-section">
            <span className={`risk-badge md ${risk.toLowerCase()}`}>{risk} Risk</span>
            <span className={`risk-score-badge ${riskLevel.toLowerCase()}`}>{riskScore}</span>
            {task.completed && (
              <span className="completed-badge">Task Completed</span>
            )}
          </div>

          {/* Task Info */}
          <div className="task-info">
            <h1 className={task.completed ? 'completed' : ''}>{task.name}</h1>
            
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}

            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon blue">{Icons.calendar}</div>
                <div className="info-content">
                  <span className="info-label">Deadline</span>
                  <span className="info-value">{formatDate(task.deadline)}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon blue">{Icons.clock}</div>
                <div className="info-content">
                  <span className="info-label">Study Time</span>
                  <span className="info-value">{task.hoursPerDay} hours/day</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon blue">{Icons.target}</div>
                <div className="info-content">
                  <span className="info-label">Priority</span>
                  <span className="info-value">{task.priority}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon blue">{Icons.zap}</div>
                <div className="info-content">
                  <span className="info-label">Time Remaining</span>
                  <span className="info-value">
                    {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''} overdue` : daysUntilDeadline === 0 ? 'Due today' : `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Supportive Message */}
          {task.completed ? (
            <div className="completion-message">
              <div className="completion-icon">{Icons.checkCircle}</div>
              <h3>Great work!</h3>
              <p>This task has been completed.</p>
            </div>
          ) : (
            <div className="supportive-section">
              <div className="supportive-icon">{Icons.messageCircle}</div>
              <p className="supportive-message">{supportiveMessage}</p>
            </div>
          )}

          {/* Insights */}
          {!task.completed && (
            <>
              <div className="insight-section">
                <h3>{Icons.helpCircle} Why This Matters</h3>
                <p>{whyItMatters}</p>
              </div>

              <div className="action-section">
                <h3>{Icons.rocket} What To Do Next</h3>
                <p>{nextAction}</p>
              </div>

              <div className="reminder-section">
                <h3>{Icons.bell} Reminder Suggestion</h3>
                <p>{reminderSuggestion}</p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default TaskDetail;