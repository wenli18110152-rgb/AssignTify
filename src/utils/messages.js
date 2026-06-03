// Supportive messages for different risk levels
const highRiskMessages = [
  "This one's coming up fast! Let's break it into smaller steps together. You've got this.",
  "Time is tight, but you're capable of great things under pressure. Focus on one task at a time.",
  "Deep breath — you've handled tough deadlines before. Let's create a clear action plan right now.",
  "It's crunch time, but remember: progress over perfection. Every step forward counts.",
  "The deadline is close, but so is your ability to rise to the challenge. Let's tackle this together."
];

const mediumRiskMessages = [
  "You're in a good position! A little focused effort each day will get you there smoothly.",
  "Nice timing! You have enough room to work at a comfortable pace. Keep up the steady progress.",
  "Good news — you're not in the danger zone yet. Consistent daily effort will make this manageable.",
  "You've got a reasonable timeline. Stay consistent and you'll finish with confidence.",
  "Perfect balance of time and effort needed. You're on track for success."
];

const lowRiskMessages = [
  "Plenty of time! Consider starting early to reduce future stress. Your future self will thank you.",
  "You're ahead of the game! Use this buffer to create something you're truly proud of.",
  "Great planning! You've given yourself plenty of breathing room. Enjoy the process.",
  "Excellent timing! You can work at your own pace and still finish with time to spare.",
  "You're in control! This is a great opportunity to work without pressure."
];

// Get a random message from the appropriate array
export const getSupportiveMessage = (risk) => {
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
  switch (risk) {
    case 'High':
      return `With only ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left, starting now gives you the best chance of completing this task well. Delaying could lead to rushed work and unnecessary stress.`;
    case 'Medium':
      return `You have ${daysUntilDeadline} days remaining. Starting soon will help you maintain quality while staying on track. A steady pace now prevents a sprint later.`;
    case 'Low':
      return `With ${daysUntilDeadline} days until deadline, you have the luxury of time. Starting early means you can refine your work and handle any unexpected challenges.`;
    default:
      return "Planning ahead always helps reduce stress and improve quality.";
  }
};

// Get next action suggestion
export const getNextAction = (risk, taskName) => {
  switch (risk) {
    case 'High':
      return `Start working on "${taskName}" immediately. Break it into 30-minute chunks and tackle the hardest part first.`;
    case 'Medium':
      return `Schedule 1-2 hours today to begin "${taskName}". Create a simple outline or gather your resources.`;
    case 'Low':
      return `Spend 30 minutes this week to plan "${taskName}". A small start now sets you up for success later.`;
    default:
      return `Take the first step on "${taskName}" today, even if it's just planning.`;
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
  const dayText = `day${daysLeft !== 1 ? 's' : ''}`;

  if (risk === 'High') {
    if (daysLeft <= 1) {
      return `Heads up! ${name} is due ${daysLeft === 0 ? 'today' : 'tomorrow'} and it's high priority. This one needs your attention right now — let's tackle it first.`;
    }
    return `${name} is high priority with only ${daysLeft} ${dayText} left. I'd recommend focusing on this one first to stay ahead of the deadline.`;
  }

  if (risk === 'Medium') {
    return `${name} has a medium priority and ${daysLeft} ${dayText} until due. Getting a head start now will make things much easier later — let's work on this.`;
  }

  if (daysLeft <= 3) {
    return `${name} is coming up in ${daysLeft} ${dayText}. It's low priority, but starting early never hurts! A small session today keeps you on track.`;
  }
  return `${name} has plenty of time left (${daysLeft} ${dayText}), but starting early means less stress later. A quick review session could be a great start.`;
};

// Get a simple next-step study suggestion
export const getStudyNextStep = (task, risk, daysLeft) => {
  const hours = task.hoursPerDay || 1;

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
  const daysLeft = Math.max(0, Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
  const risk = getRiskLevelFromDays(daysLeft, task.priority, task.hoursPerDay);

  let reason = '';
  if (daysLeft <= 1) {
    reason = `it's due ${daysLeft === 0 ? 'today' : 'tomorrow'} and needs a quick check-in`;
  } else if (daysLeft <= 3) {
    reason = `it's coming up in ${daysLeft} days — a little effort now will help a lot`;
  } else if (task.priority === 'High') {
    reason = `it's important and getting ahead now means less stress later`;
  } else {
    reason = `starting early keeps you comfortable and in control`;
  }

  return {
    task,
    risk,
    daysLeft,
    message: `A good next step is "${task.name}" because ${reason}.`
  };
};

// Helper: get risk level from days/priority/hours (mirrors calculateRisk)
const getRiskLevelFromDays = (days, priority, hours) => {
  if (days < 2) return 'High';
  if (priority === 'High' && hours < 4) return 'High';
  if (days < 3 && priority === 'High') return 'High';
  if (days < 7) return 'Medium';
  if (priority === 'Medium' && hours < 6) return 'Medium';
  if (priority === 'High' && hours < 8) return 'Medium';
  return 'Low';
};

// Generate reminders based on task due dates
export const generateReminders = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { reminders: [], summary: "You're on track. No urgent deadlines right now.", count: 0 };
  }

  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length === 0) {
    return { reminders: [], summary: "You're on track. No urgent deadlines right now.", count: 0 };
  }

  const reminders = [];
  const now = new Date();

  incompleteTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    const diffTime = deadline - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let category, message;

    if (daysLeft < 0) {
      category = 'overdue';
      const overdueDays = Math.abs(daysLeft);
      message = `"${task.name}" was due ${overdueDays} day${overdueDays !== 1 ? 's' : ''} ago. It's not too late to make progress.`;
    } else if (daysLeft === 0) {
      category = 'today';
      message = `"${task.name}" is due today. You've got this \u2014 even a small effort counts.`;
    } else if (daysLeft === 1) {
      category = 'tomorrow';
      message = `"${task.name}" is due tomorrow. A quick session today will help.`;
    } else if (daysLeft <= 3) {
      category = 'in-3days';
      message = `"${task.name}" is due in ${daysLeft} days. A small study session today will help you stay ahead.`;
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
      message
    });
  });

  // Sort: overdue first, then today, tomorrow, 3days, 7days
  const categoryOrder = { overdue: 0, today: 1, tomorrow: 2, 'in-3days': 3, 'in-7days': 4 };
  reminders.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);

  // Generate summary based on most urgent reminder
  let summary = "You're on track. No urgent deadlines right now.";
  if (reminders.length > 0) {
    const mostUrgent = reminders[0];
    if (mostUrgent.category === 'overdue') {
      summary = mostUrgent.message;
    } else if (mostUrgent.category === 'today') {
      summary = mostUrgent.message;
    } else if (mostUrgent.category === 'tomorrow') {
      summary = mostUrgent.message;
    } else if (mostUrgent.category === '3days') {
      summary = mostUrgent.message;
    } else {
      summary = mostUrgent.message;
    }
  }

  return { reminders, summary, count: reminders.length };
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

  // High risk + urgent (0-1 days)
  if (risk === 'High' && daysLeft <= 1) {
    if (focus) {
      return pick([
        `Due ${daysLeft === 0 ? 'today' : 'tomorrow'}! Focus on: ${focus} Skip perfection — get a working version done first, then polish. Even 30 minutes counts.`,
        `Time's almost up on "${name}"! Based on your description, start with: ${focus} Get the core done now — you can refine later.`,
        `"${name}" needs your attention RIGHT NOW. Tackle: ${focus} Build from there — a rough draft today beats a perfect one tomorrow.`,
      ]);
    }
    return pick([
      `This is due ${daysLeft === 0 ? 'today' : 'tomorrow'}! Open it up, write a quick outline of the key points, and start filling them in. Even 30 minutes counts.`,
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