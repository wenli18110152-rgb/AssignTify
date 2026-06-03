// Calculate risk level based on deadline, priority, and study hours
export const calculateRisk = (deadline, priority, hoursPerDay) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  
  // High risk conditions
  if (daysUntilDeadline < 2) {
    return 'High';
  }
  if (priority === 'High' && hoursPerDay < 4) {
    return 'High';
  }
  if (daysUntilDeadline < 3 && priority === 'High') {
    return 'High';
  }
  
  // Medium risk conditions
  if (daysUntilDeadline < 7) {
    return 'Medium';
  }
  if (priority === 'Medium' && hoursPerDay < 6) {
    return 'Medium';
  }
  if (priority === 'High' && hoursPerDay < 8) {
    return 'Medium';
  }
  
  // Low risk - enough time and reasonable study hours
  return 'Low';
};

// Get days until deadline
export const getDaysUntilDeadline = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const days = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

// Get risk color for styling
export const getRiskColor = (risk) => {
  switch (risk) {
    case 'High':
      return '#EF4444'; // Red
    case 'Medium':
      return '#F59E0B'; // Amber
    case 'Low':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

// Get risk icon label (text-based, no emoji)
export const getRiskEmoji = (risk) => {
  return '';
};

// Get detailed time remaining (for real-time display)
export const getTimeRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  
  if (diffTime <= 0) {
    return { overdue: true, text: 'Overdue!', urgent: true };
  }
  
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  let text = '';
  let urgent = false;
  
  if (days > 0) {
    text = `${days}d ${hours}h ${minutes}m`;
    urgent = days <= 1;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
    urgent = hours <= 6;
  } else {
    text = `${minutes}m`;
    urgent = true;
  }
  
  return { 
    overdue: false, 
    text, 
    urgent,
    days,
    hours,
    minutes,
    totalMinutes: Math.floor(diffTime / (1000 * 60))
  };
};

// Check if task is due within 24 hours
export const isDueWithin24Hours = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const hours24 = 24 * 60 * 60 * 1000;
  return diffTime > 0 && diffTime <= hours24;
};

// Check if task is due within 6 hours
export const isDueWithin6Hours = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const hours6 = 6 * 60 * 60 * 1000;
  return diffTime > 0 && diffTime <= hours6;
};

// Get risk explanation (why the task is high/medium/low risk)
export const getRiskExplanation = (deadline, priority, hoursPerDay) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  
  // High risk explanations
  if (daysUntilDeadline < 2) {
    return `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} - very urgent!`;
  }
  if (priority === 'High' && hoursPerDay < 4) {
    return `High priority with only ${hoursPerDay}h/day study time`;
  }
  if (daysUntilDeadline < 3 && priority === 'High') {
    return `High priority due in ${daysUntilDeadline} days`;
  }
  
  // Medium risk explanations
  if (daysUntilDeadline < 7) {
    return `Due in ${daysUntilDeadline} days - plan your time`;
  }
  if (priority === 'Medium' && hoursPerDay < 6) {
    return `Medium priority with ${hoursPerDay}h/day study time`;
  }
  if (priority === 'High' && hoursPerDay < 8) {
    return `High priority needs more study time (${hoursPerDay}h/day)`;
  }
  
  // Low risk
  return `${daysUntilDeadline} days left with ${hoursPerDay}h/day - on track!`;
};

// Calculate numeric risk score (0-100) for a single task
export const calculateRiskScore = (deadline, priority, hoursPerDay) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.max(0, Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)));
  
  // Time factor (0-40 points): closer deadline = higher score
  let timeScore = 0;
  if (daysUntilDeadline <= 0) timeScore = 40;
  else if (daysUntilDeadline <= 1) timeScore = 38;
  else if (daysUntilDeadline <= 2) timeScore = 35;
  else if (daysUntilDeadline <= 3) timeScore = 30;
  else if (daysUntilDeadline <= 5) timeScore = 24;
  else if (daysUntilDeadline <= 7) timeScore = 18;
  else if (daysUntilDeadline <= 14) timeScore = 10;
  else timeScore = 5;

  // Priority factor (0-30 points)
  let priorityScore = 0;
  if (priority === 'High') priorityScore = 30;
  else if (priority === 'Medium') priorityScore = 18;
  else priorityScore = 8;

  // Study hours adequacy (0-30 points): fewer hours = higher risk
  const hours = hoursPerDay || 1;
  let hoursScore = 0;
  if (hours <= 1) hoursScore = 30;
  else if (hours <= 2) hoursScore = 24;
  else if (hours <= 3) hoursScore = 18;
  else if (hours <= 4) hoursScore = 14;
  else if (hours <= 6) hoursScore = 8;
  else hoursScore = 3;

  return Math.min(100, Math.max(0, timeScore + priorityScore + hoursScore));
};

// Get risk level from numeric score (4-tier: Low/Medium/High/Critical)
export const getRiskLevel = (score) => {
  if (score >= 80) return 'Critical';
  if (score >= 55) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
};

// Get color for risk level (4-tier)
export const getRiskLevelColor = (level) => {
  switch (level) {
    case 'Critical': return '#DC2626';
    case 'High': return '#EF4444';
    case 'Medium': return '#F59E0B';
    case 'Low': return '#10B981';
    default: return '#6B7280';
  }
};

// Calculate Academic Health Score (0-100) based on all tasks
export const calculateAcademicHealth = (tasks) => {
  if (!tasks || tasks.length === 0) return { score: 100, level: 'Excellent' };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;

  let score = 100;

  // Deduct for high-risk incomplete tasks
  incompleteTasks.forEach(task => {
    const risk = calculateRisk(task.deadline, task.priority, task.hoursPerDay);
    if (risk === 'High') score -= 12;
    else if (risk === 'Medium') score -= 4;
  });

  // Deduct for overdue tasks
  const now = new Date();
  const overdueCount = incompleteTasks.filter(t => new Date(t.deadline) < now).length;
  score -= overdueCount * 15;

  // Bonus for completion rate
  const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
  if (completionRate >= 0.8) score += 10;
  else if (completionRate >= 0.5) score += 5;

  score = Math.min(100, Math.max(0, score));

  let level;
  if (score >= 80) level = 'Excellent';
  else if (score >= 60) level = 'Good';
  else if (score >= 40) level = 'Warning';
  else level = 'Critical';

  return { score, level };
};

// Calculate study load forecast for the next 7 days
export const calculateStudyLoadForecast = (tasks) => {
  const now = new Date();
  const incompleteTasks = tasks.filter(t => !t.completed);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Sum hours for tasks relevant to this day
    let totalHours = 0;
    incompleteTasks.forEach(task => {
      const deadline = new Date(task.deadline);
      const daysUntil = Math.ceil((deadline - date) / (1000 * 60 * 60 * 24));
      // Task contributes hours if deadline is within range
      if (daysUntil >= 0 && daysUntil <= 7) {
        totalHours += task.hoursPerDay || 1;
      }
    });

    let load;
    if (totalHours <= 3) load = 'Balanced';
    else if (totalHours <= 7) load = 'Busy';
    else load = 'Overloaded';

    days.push({ dayName, dayNum, hours: Math.round(totalHours * 10) / 10, load, date: date.toISOString() });
  }

  return days;
};
