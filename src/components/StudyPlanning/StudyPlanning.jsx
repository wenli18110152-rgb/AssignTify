import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import Icons from '../../utils/icons';
import './StudyPlanning.css';

const StudyPlanning = () => {
  const navigate = useNavigate();
  const { currentTask, clearCurrentTask } = useTasks();
  
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [error, setError] = useState('');

  if (!currentTask) {
    navigate('/add-task');
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const hours = parseFloat(hoursPerDay);
    if (!hoursPerDay || isNaN(hours)) { setError('Please enter the number of hours you can study per day'); return; }
    if (hours <= 0) { setError('Study hours must be greater than 0'); return; }
    if (hours > 24) { setError('Study hours cannot exceed 24 hours per day'); return; }

    navigate('/result', { state: { taskData: currentTask, hoursPerDay: hours } });
  };

  const handleBack = () => {
    clearCurrentTask();
    navigate('/add-task');
  };

  return (
    <div className="study-planning">
      <div className="study-planning-container">
        <div className="study-planning-card">
          <div className="card-header">
            <button className="back-btn" onClick={handleBack}>
              {Icons.arrowLeft} Back
            </button>
            <h1>Study Planning</h1>
            <p className="step-indicator">Step 2 of 2</p>
          </div>

          <div className="task-preview">
            <div className="preview-icon">{Icons.fileText}</div>
            <div className="preview-content">
              <h3>{currentTask.name}</h3>
              <p>Priority: {currentTask.priority}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="planning-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">{Icons.alertCircle}</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="hoursPerDay">How many hours per day can you dedicate to this task?</label>
              <div className="hours-input-wrapper">
                <input type="number" id="hoursPerDay" value={hoursPerDay}
                  onChange={(e) => { setHoursPerDay(e.target.value); setError(''); }}
                  placeholder="e.g., 2" min="0.5" max="24" step="0.5" />
                <span className="hours-unit">hours/day</span>
              </div>
              <p className="help-text">Be realistic — consistent, manageable sessions work best.</p>
            </div>

            <div className="suggestions">
              <h4>Quick Suggestions</h4>
              <div className="suggestion-buttons">
                {[1, 2, 3, 4, 6].map(hours => (
                  <button key={hours} type="button"
                    className={`suggestion-btn ${hoursPerDay === hours.toString() ? 'selected' : ''}`}
                    onClick={() => { setHoursPerDay(hours.toString()); setError(''); }}>
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Generate My Plan {Icons.sparkles}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanning;