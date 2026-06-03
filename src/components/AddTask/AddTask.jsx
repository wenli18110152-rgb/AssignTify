import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import Icons from '../../utils/icons';
import './AddTask.css';

const AddTask = () => {
  const navigate = useNavigate();
  const { setCurrentTaskForFlow } = useTasks();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    priority: 'Medium'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Please enter a task name'); return; }
    if (!formData.deadline) { setError('Please select a deadline'); return; }
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) { setError('Deadline must be in the future'); return; }
    setCurrentTaskForFlow(formData);
    navigate('/study-planning');
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="add-task">
      <div className="add-task-container">
        <div className="add-task-card">
          <div className="card-header">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              {Icons.arrowLeft} Back
            </button>
            <h1>Add New Task</h1>
            <p className="step-indicator">Step 1 of 2</p>
          </div>

          <form onSubmit={handleSubmit} className="task-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">{Icons.alertCircle}</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Task Name <span className="required">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g., Complete essay draft" maxLength={100} />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange}
                placeholder="Add any notes or details about this task..." rows={3} maxLength={500} />
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline <span className="required">*</span></label>
              <input type="datetime-local" id="deadline" name="deadline" value={formData.deadline}
                onChange={handleChange} min={getMinDateTime()} />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <div className="priority-options">
                {['Low', 'Medium', 'High'].map(option => (
                  <label key={option} className={`priority-option ${formData.priority === option ? 'selected' : ''}`}>
                    <input type="radio" name="priority" value={option} checked={formData.priority === option} onChange={handleChange} />
                    <span className="priority-label">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Continue to Study Planning {Icons.arrowRight}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTask;