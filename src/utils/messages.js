// Supportive messages for different risk levels
const highRiskMessages = [
  "This one's coming up fast — but you've got this. Let's break it into small steps.",
  "Time is tight, but you're more capable than you think. Focus on one thing at a time.",
  "Deep breath — you've handled tight deadlines before. Let's take it one step at a time.",
  "It's crunch time, but remember: progress over perfection. Every little bit counts.",
  "The deadline is close, but so is your ability to push through. You've got this."
];

const overdueMessages = [
  "It's not too late — break the remaining work into small chunks and tackle the most critical part first.",
  "This one's past the deadline, but a focused effort now can still make a real difference.",
  "Don't worry about being late — focus on what you can do right now. Every step forward counts.",
  "Overdue doesn't mean over. Start with the most important part and build from there.",
  "Let's get this done — focus on the essentials and you'll make progress today."
];

const mediumRiskMessages = [
  "You're in a good spot. A little focused effort each day and you'll be just fine.",
  "Nice timing — you've got enough room to work at a comfortable pace. Keep it up.",
  "Good news: you're not in the danger zone yet. A bit of steady effort will get you there.",
  "You've got a reasonable timeline. Stay consistent and you'll finish strong.",
  "You're on track. Just keep showing up — that's all it takes."
];

const lowRiskMessages = [
  "Plenty of time! Starting early means less stress later — your future self will thank you.",
  "You're ahead of the game. Use this breathing room to do your best work.",
  "Great planning — you've given yourself plenty of time. Enjoy the process.",
  "You can work at your own pace here. No rush, no pressure.",
  "You're in a great spot. A small start now keeps things easy later."
];

// Get a random message from the appropriate array
export const getSupportiveMessage = (risk, daysUntilDeadline) => {
  // Use overdue-specific messages for overdue tasks
  if (daysUntilDeadline !== undefined && daysUntilDeadline < 0) {
    return overdueMessages[Math.floor(Math.random() * overdueMessages.length)];
  }
  let messages;
  switch (risk) {
    case 'High':
      messages = highRiskMessages;
      break;
    case 'Medium':
      messages = mediumRiskMessages;
      break;
    case 'Low':
      messages = lowRiskMessages;
      break;
    default:
      messages = mediumRiskMessages;
  }
  return messages[Math.floor(Math.random() * messages.length)];
};

// Get "why this matters" explanation
export const getWhyItMatters = (risk, daysUntilDeadline) => {
  // Overdue tasks
  if (daysUntilDeadline < 0) {
    const overdueDays = Math.abs(daysUntilDeadline);
    return `This task is overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}. Consider updating the deadline or prioritising the remaining work.`;
  }
  // Due today
  if (daysUntilDeadline === 0) {
    return `This task is due today. Focus on one key section first and make progress where you can.`;
  }
  switch (risk) {
    case 'High':
      return `With ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left, starting now gives you the best shot at finishing well. You've got this.`;
    case 'Medium':
      return `You have ${daysUntilDeadline} days left. A steady pace now means no stressful rush later.`;
    case 'Low':
      return `With ${daysUntilDeadline} days until deadline, you've got time on your side. Starting early means less stress and better work.`;
    default:
      return "A little planning goes a long way — you'll thank yourself later.";
  }
};

// Get next action suggestion
export const getNextAction = (risk, taskName, daysUntilDeadline) => {
  // Overdue tasks
  if (daysUntilDeadline !== undefined && daysUntilDeadline < 0) {
    return `"${taskName}" is overdue — break the remaining work into small chunks and tackle the most critical part first.`;
  }
  // Due today
  if (daysUntilDeadline === 0) {
    return `"${taskName}" is due today. Focus on one key section first — even a small effort counts.`;
  }
  switch (risk) {
    case 'High':
      return `Let's start on "${taskName}" now — break it into 30-minute chunks and tackle the hardest part first.`;
    case 'Medium':
      return `Set aside 1–2 hours today for "${taskName}". A simple outline or quick research session is a great start.`;
    case 'Low':
      return `Spend 30 minutes this week planning "${taskName}". A small start now makes everything easier later.`;
    default:
      return `Take the first step on "${taskName}" today — even a small one counts.`;
  }
};

// Get reminder suggestion
export const getReminderSuggestion = (risk) => {
  switch (risk) {
    case 'High':
      return "Set a daily reminder to check your progress on this task.";
    case 'Medium':
      return "Consider setting a reminder every 2-3 days to stay on track.";
    case 'Low':
      return "A weekly check-in reminder would be helpful for this task.";
    default:
      return "Set a reminder that works for your schedule.";
  }
};

// Greeting messages based on time of day
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Priority order for sorting
const priorityOrder = { High: 0, Medium: 1, Low: 2 };

// Get the most important task to focus on
export const getRecommendedTask = (tasks) => {
  if (!tasks || tasks.length === 0) return null;

  const sorted = [...tasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 1;
    const pB = priorityOrder[b.priority] ?? 1;
    if (pA !== pB) return pA - pB;

    const deadlineA = new Date(a.deadline).getTime();
    const deadlineB = new Date(b.deadline).getTime();
    return deadlineA - deadlineB;
  });

  return sorted[0];
};

// Get a friendly message explaining why this task is recommended
export const getAIRecommendationMessage = (task, risk, daysLeft) => {
  const name = `"${task.name}"`;
  const absDays = Math.abs(daysLeft);
  const dayText = `day${absDays !== 1 ? 's' : ''}`;

  // Overdue tasks
  if (daysLeft < 0) {
    return `${name} is overdue by ${absDays} ${dayText}. Consider updating the deadline or prioritising the remaining work.`;
  }

  // Due today
  if (daysLeft === 0) {
    return `${name} is due today. Focus on one key section first. You've got this.`;
  }

  if (risk === 'High') {
    if (daysLeft === 1) {
      return `Heads up — ${name} is due tomorrow. Let's focus on this one first. You've got this.`;
    }
    return `${name} is high priority with only ${daysLeft} ${dayText} left. Tackling this first will take a big weight off your shoulders.`;
  }

  if (risk === 'Medium') {
    return `${name} has ${daysLeft} ${dayText} left. Starting now means a more relaxed finish — let's get going.`;
  }

  if (daysLeft <= 3) {
    return `${name} is coming up in ${daysLeft} ${dayText}. It's low priority, but a quick session today keeps things easy.`;
  }
  return `${name} has plenty of time (${daysLeft} ${dayText}). A quick look now means less stress later.`;
};

// Get a simple next-step study suggestion
export const getStudyNextStep = (task, risk, daysLeft) => {
  const hours = task.hoursPerDay || 1;

  // Overdue tasks
  if (daysLeft < 0) {
    return `Break the remaining work into small chunks and tackle the most critical part first. A focused session now can still make a difference.`;
  }

  // Due today
  if (daysLeft === 0) {
    return `Start a focused ${Math.min(hours, 2)}-hour session right now. Focus on one key section first.`;
  }

  if (risk === 'High') {
    if (daysLeft <= 1) {
      return `Start a focused ${Math.min(hours, 2)}-hour session right now. Break it into chunks: 25 min work, 5 min rest. Focus on the hardest part first.`;
    }
    return `Schedule a ${hours}-hour session today. Begin by listing the key subtasks, then tackle the most critical one first.`;
  }

  if (risk === 'Medium') {
    return `Try a ${Math.min(hours, 2)}-hour study block today. Start with a 10-minute overview, then dive into the main work. Steady progress wins.`;
  }

  if (daysLeft <= 3) {
    return `Spend ${Math.min(hours, 1)} hour(s) doing a quick review or outline. Even a small start builds momentum.`;
  }
  return `Consider a light ${Math.min(hours, 1)}-hour planning session — jot down what needs to be done and gather any resources you'll need. No rush.`;
};

// Get a smart recommendation explaining why a task should be prioritized
export const getSmartRecommendation = (tasks) => {
  if (!tasks || tasks.length === 0) return null;

  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length === 0) return null;

  const sorted = [...incompleteTasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 1;
    const pB = priorityOrder[b.priority] ?? 1;
    if (pA !== pB) return pA - pB;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const task = sorted[0];
  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const risk = getRiskLevelFromDays(daysLeft, task.priority, task.hoursPerDay);

  let reason = '';
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    reason = `it's overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''} and needs your attention`;
  } else if (daysLeft === 0) {
    reason = `it's due today and could use your attention`;
  } else if (daysLeft <= 1) {
    reason = `it's due tomorrow and could use your attention`;
  } else if (daysLeft <= 3) {
    reason = `it's coming up in ${daysLeft} days — a little effort now goes a long way`;
  } else if (task.priority === 'High') {
    reason = `it's important and getting ahead now means less stress later`;
  } else {
    reason = `starting early keeps you feeling in control`;
  }

  return {
    task,
    risk,
    daysLeft,
    message: `A great next step is "${task.name}" — ${reason}.`
  };
};

// Helper: get risk level from days/priority/hours (mirrors calculateRisk)
const getRiskLevelFromDays = (days, priority, hours) => {
  if (days < 0) return 'High'; // Overdue
  if (days < 2) return 'High';
  if (priority === 'High' && hours < 4) return 'High';
  if (days < 3 && priority === 'High') return 'High';
  if (days < 7) return 'Medium';
  if (priority === 'Medium' && hours < 6) return 'Medium';
  if (priority === 'High' && hours < 8) return 'Medium';
  return 'Low';
};

// Generate reminders based on task due dates (smarter, task-context-aware)
export const generateReminders = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { reminders: [], summary: "You're on track — no urgent deadlines right now.", overdueSummary: '', count: 0 };
  }

  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length === 0) {
    return { reminders: [], summary: "You're on track — no urgent deadlines right now.", overdueSummary: '', count: 0 };
  }

  const reminders = [];
  const now = new Date();

  incompleteTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    const diffTime = deadline - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const focus = getTaskFocus(task.description);

    let category, message;

    if (daysLeft < 0) {
      category = 'overdue';
      const overdueDays = Math.abs(daysLeft);
      if (focus) {
        message = `"${task.name}" is overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}. Start with: ${focus}`;
      } else {
        message = `"${task.name}" is overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}. Consider updating the deadline or prioritising the remaining work.`;
      }
    } else if (daysLeft === 0) {
      category = 'today';
      if (focus) {
        message = `"${task.name}" is due today. Focus on: ${focus}`;
      } else {
        message = `"${task.name}" is due today. Focus on one key section first.`;
      }
    } else if (daysLeft === 1) {
      category = 'tomorrow';
      message = `"${task.name}" is due tomorrow. Starting today will reduce last-minute stress.`;
    } else if (daysLeft <= 3) {
      category = 'in-3days';
      message = `"${task.name}" is due in ${daysLeft} days. Completing one section today will reduce pressure later.`;
    } else if (daysLeft <= 7) {
      category = 'in-7days';
      message = `"${task.name}" is due in ${daysLeft} days. Consider starting your prep soon.`;
    } else {
      return; // No reminder needed for tasks due in more than 7 days
    }

    reminders.push({
      taskId: task.id,
      taskName: task.name,
      daysLeft,
      category,
      message,
      priority: task.priority || 'Medium'
    });
  });

  // Sort: overdue first, then today, tomorrow, 3days, 7days
  const categoryOrder = { overdue: 0, today: 1, tomorrow: 2, 'in-3days': 3, 'in-7days': 4 };
  reminders.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);

  // Generate summary based on most urgent reminder
  let summary = "You're on track — no urgent deadlines right now.";
  if (reminders.length > 0) {
    summary = reminders[0].message;
  }

  // Generate overdue summary for multi-overdue situations
  const overdueReminders = reminders.filter(r => r.category === 'overdue');
  let overdueSummary = '';
  if (overdueReminders.length >= 2) {
    overdueSummary = `You currently have ${overdueReminders.length} overdue tasks. Focus on ${overdueReminders[0].taskName} first.`;
  }

  return { reminders, summary, overdueSummary, count: reminders.length };
};

// Generate Student Success Companion insights
export const getStudentInsights = (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  const now = new Date();
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalCount = tasks.length;
  const overdueTasks = incompleteTasks.filter(t => new Date(t.deadline) < now);
  const overdueCount = overdueTasks.length;
  const completionRate = totalCount > 0 ? completedTasks.length / totalCount : 0;
  const upcomingUrgent = incompleteTasks.filter(t => {
    const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 2;
  });

  const insights = [];

  // Risk spotlight — always show the highest-risk incomplete task
  if (overdueCount > 0) {
    const mostOverdue = overdueTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
    const overdueDays = Math.abs(Math.ceil((new Date(mostOverdue.deadline) - now) / (1000 * 60 * 60 * 24)));
    insights.push({
      icon: 'alertTriangle',
      text: `Your biggest risk right now is ${mostOverdue.name} — it's overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}.`,
      tone: 'action'
    });
  } else if (upcomingUrgent.length > 0) {
    const urgentTask = upcomingUrgent[0];
    const daysLeft = Math.ceil((new Date(urgentTask.deadline) - now) / (1000 * 60 * 60 * 24));
    insights.push({
      icon: 'target',
      text: `Your biggest focus right now is ${urgentTask.name} — ${daysLeft === 0 ? 'due today' : `due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}.`,
      tone: 'action'
    });
  }

  // Completion encouragement
  if (overdueCount === 0 && completionRate > 0 && completionRate < 1) {
    const remaining = totalCount - completedTasks.length;
    if (remaining <= 3) {
      insights.push({
        icon: 'trendingUp',
        text: `Just ${remaining} task${remaining !== 1 ? 's' : ''} to go — completing ${remaining === 1 ? 'it' : 'them'} will boost your Academic Health Score.`,
        tone: 'encouraging'
      });
    } else {
      insights.push({
        icon: 'trendingUp',
        text: `Completing 1 more task this week would improve your Academic Health Score.`,
        tone: 'encouraging'
      });
    }
  }

  // Active subjects awareness
  const uniqueSubjects = [...new Set(incompleteTasks.map(t => t.name.split(' — ')[0].split(' Assignment')[0].split(' Exam')[0].trim()))];
  if (uniqueSubjects.length >= 3) {
    insights.push({
      icon: 'sparkles',
      text: `You're managing ${uniqueSubjects.length} active subjects — great balance across your workload.`,
      tone: 'awareness'
    });
  }

  // Momentum celebration
  if (completedTasks.length >= 3 && completionRate < 0.8) {
    insights.push({
      icon: 'checkCircle',
      text: `You've completed ${completedTasks.length} tasks — keep that momentum going!`,
      tone: 'encouraging'
    });
  }

  // Workload awareness (hoursPerDay is total weekly per task)
  const weeklyHours = incompleteTasks.reduce((sum, t) => sum + (t.hoursPerDay || 1), 0);
  if (weeklyHours > 20 && incompleteTasks.length > 0) {
    insights.push({
      icon: 'clock',
      text: `Your estimated weekly study load is ${Math.round(weeklyHours)} hours — consider spreading tasks across more days.`,
      tone: 'awareness'
    });
  }

  // Multiple overdue warning
  if (overdueCount >= 3) {
    insights.push({
      icon: 'alertTriangle',
      text: `You currently have ${overdueCount} overdue tasks. Focus on the nearest deadline first.`,
      tone: 'action'
    });
  }

  // Deadline cluster warning
  if (upcomingUrgent.length >= 2) {
    insights.push({
      icon: 'target',
      text: `You have ${upcomingUrgent.length} deadlines within the next 48 hours. Consider prioritising ${upcomingUrgent[0].name}.`,
      tone: 'action'
    });
  }

  // Progress nudge
  if (completionRate >= 0.6 && completionRate < 1) {
    const pct = Math.round(completionRate * 100);
    insights.push({
      icon: 'trendingUp',
      text: `You're ${pct}% through your tasks. One more push and you'll cross the finish line.`,
      tone: 'encouraging'
    });
  }

  // Fallback for tasks with no urgency
  if (insights.length === 0 && incompleteTasks.length > 0) {
    insights.push({
      icon: 'sparkles',
      text: `${incompleteTasks.length} task${incompleteTasks.length !== 1 ? 's' : ''} on your plate — a small step today keeps everything manageable.`,
      tone: 'encouraging'
    });
  }

  // Return top 3 most relevant insights (action first, then encouraging, then awareness)
  const toneOrder = { action: 0, encouraging: 1, awareness: 2 };
  insights.sort((a, b) => (toneOrder[a.tone] ?? 1) - (toneOrder[b.tone] ?? 1));
  return insights.slice(0, 3);
};

// Sort all tasks by priority then deadline
export const getSortedStudyTasks = (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  return [...tasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 1;
    const pB = priorityOrder[b.priority] ?? 1;
    if (pA !== pB) return pA - pB;

    const deadlineA = new Date(a.deadline).getTime();
    const deadlineB = new Date(b.deadline).getTime();
    return deadlineA - deadlineB;
  });
};

// Helper: pick a random item from an array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: extract key action items from task description
const getTaskFocus = (description) => {
  if (!description || !description.trim()) return null;
  const clean = description.trim();
  if (clean.length <= 80) return clean;
  return clean.substring(0, 77) + '...';
};

// Get a short, friendly suggestion for each task in the study plan
export const getTaskSuggestion = (task, risk, daysLeft) => {
  const name = task.name;
  const desc = task.description ? task.description.trim() : '';
  const focus = getTaskFocus(desc);

  // Overdue tasks
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    if (focus) {
      return pick([
        `"${name}" is overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}. Focus on: ${focus} Break the remaining work into small chunks and tackle the most critical part first.`,
        `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''} — but it's not too late. Work on: ${focus} A focused session now can still make a difference.`,
      ]);
    }
    return pick([
      `"${name}" is overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}. Break the remaining work into small chunks and tackle the most critical part first.`,
      `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''} — but it's not too late. Focus on one key section and make progress where you can.`,
    ]);
  }

  // Due today
  if (daysLeft === 0) {
    if (focus) {
      return pick([
        `Due today! Focus on: ${focus} Get a working version done first — you can polish later. Even 30 minutes counts.`,
        `"${name}" is due today. Start with: ${focus} A focused effort now can still get you across the line.`,
      ]);
    }
    return pick([
      `"${name}" is due today! Open it up, focus on one key section, and make progress. Even 30 minutes counts.`,
      `Today's the day for "${name}" — tackle the most important part first. You've got this.`,
    ]);
  }

  // High risk + urgent (1 day)
  if (risk === 'High' && daysLeft <= 1) {
    if (focus) {
      return pick([
        `Due tomorrow! Focus on: ${focus} Skip perfection — get a working version done first, then polish. Even 30 minutes counts.`,
        `Time's almost up on "${name}"! Based on your description, start with: ${focus} Get the core done now — you can refine later.`,
        `"${name}" needs your attention RIGHT NOW. Tackle: ${focus} Build from there — a rough draft today beats a perfect one tomorrow.`,
      ]);
    }
    return pick([
      `This is due tomorrow! Open it up, write a quick outline of the key points, and start filling them in. Even 30 minutes counts.`,
      `Time's almost up on "${name}" — skip the perfectionism and get a rough draft done first. You can polish it later!`,
      `"${name}" needs your attention RIGHT NOW. Start by listing what's required, then tackle the most important part first. You've got this.`,
    ]);
  }

  // High risk + close (2-3 days)
  if (risk === 'High' && daysLeft <= 3) {
    if (focus) {
      return pick([
        `${daysLeft} days left! Today, research and outline: ${focus} Tomorrow, write the first draft. Day 3, review and polish. You've got a plan!`,
        `High priority and due in ${daysLeft} days. Start with: ${focus} Break the rest into daily chunks — it'll feel way more doable.`,
        `This one matters! Today, focus on: ${focus} Getting the core done now means less stress and better quality later.`,
      ]);
    }
    return pick([
      `With ${daysLeft} days left, here's a plan: today do your research and outline, tomorrow write the first draft, then review. Three focused sessions!`,
      `"${name}" is high priority and due in ${daysLeft} days. Break it into 3 parts — research, draft, and review — one per day. You've got this.`,
      `Spend today gathering sources and notes for "${name}". Tomorrow you'll thank yourself when the writing flows much easier.`,
    ]);
  }

  // High risk + moderate time (4+ days)
  if (risk === 'High') {
    if (focus) {
      return pick([
        `You have ${daysLeft} days — use them well! Start with: ${focus} Then outline what's left and spread it across the next few days. You'll finish strong.`,
        `Block out time today to work on: ${focus} Then plan the remaining pieces. A solid start now makes all the difference!`,
        `High priority but you've got breathing room. Begin with: ${focus} Tackle the hardest part first while you're fresh, then build from there.`,
      ]);
    }
    return pick([
      `Use this time wisely! Start with research and an outline today, then draft over the next few days. Leave the last day for review.`,
      `Block out time today to plan your approach for "${name}" — what sections do you need? What sources or materials? A clear plan makes writing easier.`,
      `Start "${name}" by listing what needs to be done, then tackle the hardest part first while you're fresh. Break the rest into daily goals.`,
    ]);
  }

  // Medium risk + close (0-3 days)
  if (risk === 'Medium' && daysLeft <= 3) {
    if (focus) {
      return pick([
        `Getting close! Start with: ${focus} Even 20 minutes of focused work today makes a huge difference. A rough version now beats a perfect one later.`,
        `Don't wait! Based on your task details, focus on: ${focus} Jot down your main ideas and key points — you'll be ahead of the game.`,
        `${daysLeft} days out — time to move from planning to doing. Work on: ${focus} Get a first draft down, then refine it.`,
      ]);
    }
    return pick([
      `Getting close! Start with a rough outline today — even 20 minutes of planning makes a huge difference. Then fill in the details tomorrow.`,
      `A quick research session now will make the rest so much easier. Find your key sources, jot down main ideas, and start drafting.`,
      `Time to move from planning to doing! Write a rough first draft of "${name}" today, even if it's messy. You can fix it later!`,
    ]);
  }

  // Medium risk + moderate time (4-7 days)
  if (risk === 'Medium') {
    if (focus) {
      return pick([
        `You've got ${daysLeft} days — solid timeline! Start by working on: ${focus} No rush, but getting started now means less stress later.`,
        `Good pace! Use one session to tackle: ${focus} Then spread the remaining work over the next few days. You've got this.`,
        `"${name}" has ${daysLeft} days left. Try starting with: ${focus} A rough version now gives you plenty of time to refine and improve.`,
      ]);
    }
    return pick([
      `Solid timeline! Start by doing some research and creating an outline. Then draft over a couple of sessions. No rush, but don't leave it to the last minute.`,
      `Use one session to gather your notes and plan "${name}", then start drafting. Spreading it out makes the whole thing less stressful.`,
      `Try the "first draft fast" approach — write a rough version now, then refine it over the next few days. Getting words on paper is the hardest part!`,
    ]);
  }

  // Medium risk + plenty of time (8+ days)
  if (risk === 'Medium') {
    if (focus) {
      return pick([
        `Plenty of time! This week, spend 30 minutes on: ${focus} A small start now means you'll hit the ground running when it's time to really dive in.`,
        `No rush, but a little now goes a long way. Start by looking into: ${focus} You'll thank yourself later for getting ahead early.`,
      ]);
    }
    return pick([
      `Plenty of time! Spend 30 minutes this week brainstorming, outlining, and gathering any materials you'll need. Future you will be grateful.`,
      `No rush, but a little now goes a long way. Jot down your initial thoughts and save any useful sources. You'll hit the ground running later.`,
    ]);
  }

  // Low risk + close (0-3 days)
  if (daysLeft <= 3) {
    if (desc) {
      return pick([
        `Almost due but no stress! Give "${name}" a final review — check against your description to make sure nothing's missing. A quick polish always helps.`,
        `"${name}" is coming up — just needs a finishing touch. Do a read-through, check the details, and wrap it up. You're nearly there.`,
      ]);
    }
    return pick([
      `Almost due but no stress! Give "${name}" a quick review and make sure everything's in order. A final polish always helps.`,
      `"${name}" is coming up — just needs a finishing touch. Do a quick read-through and wrap it up. You're nearly there.`,
    ]);
  }

  // Low risk + plenty of time (4+ days)
  if (desc) {
    return pick([
      `No rush on "${name}"! When you're ready, start by reviewing: ${focus} A small start now means less stress later.`,
      `"${name}" has plenty of time. Consider doing a light planning session — outline what you need and gather any materials. Easy wins.`,
      `You're in great shape with "${name}". Maybe spend 20 minutes brainstorming and noting down key ideas this week? A little momentum goes a long way.`,
    ]);
  }
  return pick([
    `No rush on "${name}"! When you're ready, start by jotting down a few key ideas. A small start now means less stress later.`,
    `"${name}" has plenty of time. Consider doing a light planning session — outline what you need and gather any materials. Easy wins.`,
    `You're in great shape with "${name}". Maybe spend 20 minutes brainstorming this week? A little momentum now makes the rest smooth sailing.`,
  ]);
};