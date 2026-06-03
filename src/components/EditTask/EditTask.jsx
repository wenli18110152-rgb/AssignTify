import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import Icons from '../../utils/icons';
import './EditTask.css';

const EditTask = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { getTaskById, updateTask } = useTasks();
  
  const task = getTaskById(taskId);
  
  const [formData, setFormData] = useState({
    name: '', description: '', deadline: '', priority: 'Medium', hoursPerDay: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        deadline: task.deadline ? task.deadline.slice(0, 16) : '',
        priority: task.priority || 'Medium',
        hoursPerDay: task.hoursPerDay?.toString() || ''
      });
    }
  }, [task]);

  if (!task) {
    return (
      <div className="edit-task">
        <div className="edit-task-container">
          <div className="not-found">
            <h2>Task Not Found</h2>
            <p>This task doesn't exist or has been deleted.</p>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Please enter a task name'); return; }
    if (!formData.deadline) { setError('Please select a deadline'); return; }
    if (!formData.hoursPerDay || parseFloat(formData.hoursPerDay) <= 0) { setError('Please enter valid study hours per day'); return; }

    updateTask(taskId, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline,
      priority: formData.priority,
      hoursPerDay: parseFloat(formData.hoursPerDay)
    });
    navigate(`/task/${taskId}`);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="edit-task">
      <div className="edit-task-container">
        <div className="edit-task-card">
          <div className="card-header">
            <button className="back-btn" onClick={() => navigate(`/task/${taskId}`)}>
              {Icons.arrowLeft} Back to Task
            </button>
            <h1>Edit Task</h1>
            <p className="subtitle">Update your task details</p>
          </div>

          <form onSubmit={handleSubmit} className="edit-form">
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

            <div className="form-group">
              <label htmlFor="hoursPerDay">Study Hours Per Day <span className="required">*</span></label>
              <div className="hours-input-wrapper">
                <input type="number" id="hoursPerDay" name="hoursPerDay" value={formData.hoursPerDay}
                  onChange={handleChange} placeholder="e.g., 2" min="0.5" max="24" step="0.5" />
                <span className="hours-unit">hours/day</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate(`/task/${taskId}`)}>Cancel</button>
              <button type="submit" className="save-btn">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTask;