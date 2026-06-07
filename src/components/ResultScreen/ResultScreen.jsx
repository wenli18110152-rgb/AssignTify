import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import { calculateRisk, getDaysUntilDeadline, getRiskColor } from '../../utils/riskCalculator';
import { getSupportiveMessage, getWhyItMatters, getNextAction, getReminderSuggestion } from '../../utils/messages';
import Icons from '../../utils/icons';
import './ResultScreen.css';

const ResultScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTask, clearCurrentTask } = useTasks();
  const [saving, setSaving] = useState(false);
  
  const { taskData, hoursPerDay } = location.state || {};

  if (!taskData || !hoursPerDay) {
    navigate('/add-task');
    return null;
  }

  const risk = calculateRisk(taskData.deadline, taskData.priority, hoursPerDay);
  const daysUntilDeadline = getDaysUntilDeadline(taskData.deadline);
  const supportiveMessage = getSupportiveMessage(risk, daysUntilDeadline);
  const whyItMatters = getWhyItMatters(risk, daysUntilDeadline);
  const nextAction = getNextAction(risk, taskData.name, daysUntilDeadline);
  const reminderSuggestion = getReminderSuggestion(risk);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  };

  const handleSaveTask = async () => {
    setSaving(true);
    try {
      await addTask({ ...taskData, hoursPerDay });
      clearCurrentTask();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save your task. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartOver = () => {
    clearCurrentTask();
    navigate('/add-task');
  };

  return (
    <div className="result-screen">
      <div className="result-container">
        <div className="result-card">
          {/* Risk Header */}
          <div className="risk-header">
            <span className={`risk-badge md ${risk.toLowerCase()}`}>{risk} Risk</span>
            <h1>Your Study Plan is Ready</h1>
          </div>

          {/* Task Summary */}
          <div className="task-summary">
            <div className="summary-item">
              <div className="summary-icon blue">{Icons.fileText}</div>
              <div className="summary-content">
                <span className="summary-label">Task</span>
                <span className="summary-value">{taskData.name}</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon blue">{Icons.calendar}</div>
              <div className="summary-content">
                <span className="summary-label">Deadline</span>
                <span className="summary-value">{formatDate(taskData.deadline)}</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon blue">{Icons.clock}</div>
              <div className="summary-content">
                <span className="summary-label">Study Time</span>
                <span className="summary-value">{hoursPerDay} hours/day</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon blue">{Icons.target}</div>
              <div className="summary-content">
                <span className="summary-label">Priority</span>
                <span className="summary-value">{taskData.priority}</span>
              </div>
            </div>
          </div>

          {/* Supportive Message */}
          <div className="supportive-section">
            <div className="supportive-icon">{Icons.messageCircle}</div>
            <p className="supportive-message">{supportiveMessage}</p>
          </div>

          {/* Insights */}
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

          {/* Action Buttons */}
          <div className="result-actions">
            <button className="save-btn" onClick={handleSaveTask} disabled={saving}>
              {saving ? 'Saving...' : 'Save to Dashboard'}
            </button>
            <button className="restart-btn" onClick={handleStartOver}>
              Start Over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;