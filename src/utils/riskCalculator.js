// Calculate risk level based on deadline, priority, and study hours
export const calculateRisk = (deadline, priority, hoursPerDay) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  
  // Overdue tasks are always high risk
  if (daysUntilDeadline < 0) {
    return 'High';
  }
  
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

// Get days until deadline (negative when overdue, 0 when due today)
export const getDaysUntilDeadline = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const days = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  return days;
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
    return { overdue: true, text: 'Overdue', urgent: true };
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
  
  // Overdue explanations
  if (daysUntilDeadline < 0) {
    const overdueDays = Math.abs(daysUntilDeadline);
    return `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''} — consider updating the deadline or finishing up`;
  }
  
  // Due today
  if (daysUntilDeadline === 0) {
    return `Due today — focus on one key section first`;
  }
  
  // High risk explanations
  if (daysUntilDeadline < 2) {
    return `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} — let's focus on this one`;
  }
  if (priority === 'High' && hoursPerDay < 4) {
    return `High priority with ${hoursPerDay}h/day — a bit more time would help`;
  }
  if (daysUntilDeadline < 3 && priority === 'High') {
    return `High priority due in ${daysUntilDeadline} days — you've got this`;
  }
  
  // Medium risk explanations
  if (daysUntilDeadline < 7) {
    return `Due in ${daysUntilDeadline} days — you've got this with a bit of planning`;
  }
  if (priority === 'Medium' && hoursPerDay < 6) {
    return `Medium priority with ${hoursPerDay}h/day — steady progress will get you there`;
  }
  if (priority === 'High' && hoursPerDay < 8) {
    return `High priority — a bit more study time would help (${hoursPerDay}h/day)`;
  }
  
  // Low risk
  return `${daysUntilDeadline} days left with ${hoursPerDay}h/day — you're in great shape`;
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
  if (!tasks || tasks.length === 0) {
    return {
      score: 100,
      level: 'Excellent',
      explanation: "No tasks yet — add your first assignment to start tracking your academic health.",
      factors: { overdueCount: 0, completedCount: 0, totalCount: 0, upcomingUrgent: 0, weeklyHours: 0 }
    };
  }

  const now = new Date();
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const overdueTasks = incompleteTasks.filter(t => new Date(t.deadline) < now);
  const overdueCount = overdueTasks.length;

  // Upcoming urgent: tasks due within 2 days
  const upcomingUrgent = incompleteTasks.filter(t => {
    const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 2;
  }).length;

  // Weekly hours estimate
  const weeklyHours = incompleteTasks.reduce((sum, t) => sum + (t.hoursPerDay || 1) * 5, 0);

  let score = 100;
  const breakdown = { base: 100, overduePenalty: 0, completionBonus: 0, urgentPenalty: 0, weeklyPenalty: 0, rateBonus: 0 };

  // Overdue penalty: -18 per overdue task (capped at -50)
  const overduePenalty = Math.min(overdueCount * 18, 50);
  score -= overduePenalty;
  breakdown.overduePenalty = -overduePenalty;

  // Completion bonus: +2 per completed task (capped at +15)
  const completionBonus = Math.min(completedCount * 2, 15);
  score += completionBonus;
  breakdown.completionBonus = completionBonus;

  // Upcoming deadline pressure: -5 per task due within 2 days, -3 per task due within 7 days
  const urgent7 = incompleteTasks.filter(t => {
    const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;
  const urgentPenalty = upcomingUrgent * 5 + Math.max(0, urgent7 - upcomingUrgent) * 3;
  score -= urgentPenalty;
  breakdown.urgentPenalty = -urgentPenalty;

  // Workload balance penalty
  let weeklyPenalty = 0;
  if (weeklyHours > 30) weeklyPenalty = 10;
  else if (weeklyHours > 20) weeklyPenalty = 5;
  score -= weeklyPenalty;
  breakdown.weeklyPenalty = -weeklyPenalty;

  // Completion rate bonus
  const completionRate = totalTasks > 0 ? completedCount / totalTasks : 0;
  let rateBonus = 0;
  if (completionRate >= 0.8) rateBonus = 10;
  else if (completionRate >= 0.5) rateBonus = 5;
  score += rateBonus;
  breakdown.rateBonus = rateBonus;

  score = Math.min(100, Math.max(0, score));

  let level;
  if (score >= 80) level = 'Excellent';
  else if (score >= 60) level = 'Good';
  else if (score >= 40) level = 'Fair';
  else level = 'Needs Attention';

  // Generate explanation
  let explanation = '';
  if (overdueCount > 0) {
    const overdueNames = overdueTasks.map(t => t.name);
    const mainOverdue = overdueNames[0];
    explanation = `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} — starting with "${mainOverdue}" will boost your score.`;
  } else if (upcomingUrgent > 0) {
    explanation = `${upcomingUrgent} task${upcomingUrgent > 1 ? 's' : ''} due within 48 hours. Staying focused now keeps you on track.`;
  } else if (completionRate >= 0.8) {
    explanation = `Excellent progress — ${completedCount} of ${totalTasks} tasks complete. Keep it up!`;
  } else if (incompleteTasks.length > 0) {
    explanation = `${completedCount} of ${totalTasks} tasks complete. Steady progress will keep your score healthy.`;
  } else {
    explanation = `All tasks completed — outstanding work!`;
  }

  return {
    score,
    level,
    explanation,
    breakdown,
    factors: {
      overdueCount,
      completedCount,
      totalCount: totalTasks,
      upcomingUrgent,
      weeklyHours: Math.round(weeklyHours)
    }
  };
};

// Get workload summary for the week
export const getWorkloadSummary = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { totalWeeklyHours: 0, busiestDay: null, busiestDayHours: 0, activeTasks: 0, load: 'Balanced' };
  }

  const now = new Date();
  const incompleteTasks = tasks.filter(t => !t.completed);
  const totalWeeklyHours = incompleteTasks.reduce((sum, t) => sum + (t.hoursPerDay || 1) * 5, 0);

  // Find busiest day in next 7
  let busiestDay = null;
  let busiestDayHours = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    let dayHours = 0;
    incompleteTasks.forEach(task => {
      const deadline = new Date(task.deadline);
      const daysUntil = Math.ceil((deadline - date) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 3) {
        dayHours += task.hoursPerDay || 1;
      }
    });
    if (dayHours > busiestDayHours) {
      busiestDayHours = dayHours;
      busiestDay = date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }

  let load = 'Balanced';
  if (totalWeeklyHours > 30) load = 'Heavy';
  else if (totalWeeklyHours > 20) load = 'Busy';

  return {
    totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
    busiestDay,
    busiestDayHours: Math.round(busiestDayHours * 10) / 10,
    activeTasks: incompleteTasks.length,
    load
  };
};

// Get study momentum indicator
export const getStudyMomentum = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { status: 'idle', label: 'Ready to Start', description: 'Add your first task to begin building momentum.', progressPercent: 0, nextMilestone: 'Complete your first task' };
  }

  const now = new Date();
  const completedTasks = tasks.filter(t => t.completed);
  const incompleteTasks = tasks.filter(t => !t.completed);
  const overdueTasks = incompleteTasks.filter(t => new Date(t.deadline) < now);
  const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
  const progressPercent = Math.round(completionRate * 100);

  // Determine next milestone
  let nextMilestone = '';
  if (completedTasks.length < 1) nextMilestone = 'Complete your first task';
  else if (completedTasks.length < 3) nextMilestone = 'Reach 3 completed tasks';
  else if (completedTasks.length < 5) nextMilestone = 'Reach 5 completed tasks';
  else if (completionRate < 0.5) nextMilestone = 'Complete 50% of your tasks';
  else if (completionRate < 0.8) nextMilestone = 'Complete 80% of your tasks';
  else if (completionRate < 1) nextMilestone = 'Finish all tasks';
  else nextMilestone = 'All done!';

  // Check for recent completions (tasks completed recently - approximate)
  if (completionRate >= 0.8) {
    return { status: 'excellent', label: 'On Fire', description: `Incredible — ${completedTasks.length} of ${tasks.length} tasks done. You're nearly there!`, progressPercent, nextMilestone };
  }
  if (overdueTasks.length > 2) {
    return { status: 'struggling', label: 'Needs Focus', description: `${overdueTasks.length} overdue tasks — tackling one right now can turn things around.`, progressPercent, nextMilestone };
  }
  if (overdueTasks.length > 0) {
    return { status: 'behind', label: 'Catch Up Mode', description: `${overdueTasks.length} overdue — start with the nearest deadline to get back on track.`, progressPercent, nextMilestone };
  }
  if (completionRate >= 0.5) {
    return { status: 'building', label: 'Building Momentum', description: `${completedTasks.length} tasks done — you're more than halfway. Keep going!`, progressPercent, nextMilestone };
  }
  if (completedTasks.length > 0) {
    return { status: 'started', label: 'Getting Started', description: `${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} completed — every step forward counts.`, progressPercent, nextMilestone };
  }
  if (incompleteTasks.length > 0) {
    return { status: 'ready', label: 'Ready to Go', description: `${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''} waiting — start with one small step today.`, progressPercent, nextMilestone };
  }
  return { status: 'idle', label: 'All Clear', description: 'Everything is done — take a well-earned break!', progressPercent: 100, nextMilestone: 'All done!' };
};

// Get upcoming deadline overview
export const getDeadlineOverview = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { total: 0, overdue: 0, dueToday: 0, dueThisWeek: 0, summary: 'No upcoming deadlines.' };
  }

  const now = new Date();
  const incompleteTasks = tasks.filter(t => !t.completed);
  const overdue = incompleteTasks.filter(t => new Date(t.deadline) < now).length;
  const dueToday = incompleteTasks.filter(t => {
    const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
    return days === 0;
  }).length;
  const dueThisWeek = incompleteTasks.filter(t => {
    const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  let summary = '';
  if (overdue > 0) {
    summary = `${overdue} overdue · ${dueThisWeek} due this week`;
  } else if (dueToday > 0) {
    summary = `${dueToday} due today · ${dueThisWeek} due this week`;
  } else if (dueThisWeek > 0) {
    summary = `${dueThisWeek} deadline${dueThisWeek > 1 ? 's' : ''} this week`;
  } else {
    summary = 'All clear for the next 7 days';
  }

  // Build individual deadline entries for visual display
  const deadlines = incompleteTasks
    .map(t => {
      const daysLeft = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
      const risk = daysLeft < 0 ? 'High' : daysLeft < 2 ? 'High' : daysLeft < 7 ? 'Medium' : 'Low';
      return { id: t.id, name: t.name, daysLeft, deadline: t.deadline, risk };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);

  return { total: incompleteTasks.length, overdue, dueToday, dueThisWeek, summary, deadlines };
};

// Get weekly study insights from task data
export const getWeeklyInsights = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { busiestDay: null, quietestDay: null, peakHours: 0, avgDailyHours: 0, totalWeekHours: 0, recommendation: 'Add tasks to see your weekly study insights.' };
  }

  const now = new Date();
  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length === 0) {
    return { busiestDay: null, quietestDay: null, peakHours: 0, avgDailyHours: 0, totalWeekHours: 0, recommendation: 'All tasks completed — enjoy your free time!' };
  }

  // Calculate hours for each day of the week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyHours = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    let hours = 0;
    incompleteTasks.forEach(task => {
      const deadline = new Date(task.deadline);
      const daysUntil = Math.ceil((deadline - date) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 7) {
        hours += task.hoursPerDay || 1;
      }
    });
    dailyHours.push({ day: dayNames[date.getDay()], dayIndex: i, hours: Math.round(hours * 10) / 10 });
  }

  // Find busiest and quietest days
  let busiestIdx = 0;
  let quietestIdx = 0;
  dailyHours.forEach((d, i) => {
    if (d.hours > dailyHours[busiestIdx].hours) busiestIdx = i;
    if (d.hours < dailyHours[quietestIdx].hours) quietestIdx = i;
  });

  const totalWeekHours = dailyHours.reduce((sum, d) => sum + d.hours, 0);
  const avgDailyHours = Math.round((totalWeekHours / 7) * 10) / 10;
  const peakHours = dailyHours[busiestIdx].hours;

  // Generate recommendation
  let recommendation = '';
  if (peakHours > 10) {
    recommendation = `Your busiest day (${dailyHours[busiestIdx].day}) has ${peakHours}h of study. Try spreading some tasks to ${dailyHours[quietestIdx].day} for better balance.`;
  } else if (totalWeekHours > 25) {
    recommendation = `With ${Math.round(totalWeekHours)}h of study this week, remember to take breaks. Your lightest day is ${dailyHours[quietestIdx].day}.`;
  } else if (avgDailyHours > 0) {
    recommendation = `Your week looks manageable at ${avgDailyHours}h/day average. Focus on ${dailyHours[busiestIdx].day} — your busiest day.`;
  } else {
    recommendation = 'No study hours expected this week. Great time to get ahead on future tasks!';
  }

  return {
    busiestDay: dailyHours[busiestIdx].day,
    quietestDay: dailyHours[quietestIdx].day,
    peakHours,
    avgDailyHours,
    totalWeekHours: Math.round(totalWeekHours * 10) / 10,
    dailyHours,
    recommendation
  };
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
