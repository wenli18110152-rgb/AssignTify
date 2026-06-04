// Demo data generator for AssignTify — realistic university tasks

const makeDeadline = (daysFromNow, hour = 23, minute = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 16);
};

// Returns an array of demo task objects with generated IDs (no side effects)
export const getDemoTaskData = () => {
  const now = Date.now();
  return [
    {
      id: `demo_${now}_1`,
      name: 'Research Essay',
      description: 'Write a 2,000-word research essay on the chosen topic, including peer-reviewed sources and proper referencing.',
      deadline: makeDeadline(3),
      priority: 'High',
      hoursPerDay: 3,
      createdAt: new Date().toISOString(),
      completed: false
    },
    {
      id: `demo_${now}_2`,
      name: 'Group Presentation',
      description: 'Prepare and rehearse a 15-minute group presentation covering the assigned topic with visual aids and speaker notes.',
      deadline: makeDeadline(5),
      priority: 'Medium',
      hoursPerDay: 2,
      createdAt: new Date().toISOString(),
      completed: false
    },
    {
      id: `demo_${now}_3`,
      name: 'Statistics Quiz',
      description: 'Revise probability, hypothesis testing, and regression concepts for the upcoming online quiz.',
      deadline: makeDeadline(7),
      priority: 'Medium',
      hoursPerDay: 2,
      createdAt: new Date().toISOString(),
      completed: false
    },
    {
      id: `demo_${now}_4`,
      name: 'Final Exam Revision',
      description: 'Review lecture notes and practice past exam papers for the final exam covering all semester content.',
      deadline: makeDeadline(14),
      priority: 'Low',
      hoursPerDay: 1,
      createdAt: new Date().toISOString(),
      completed: false
    }
  ];
};

// Legacy helper — adds demo tasks directly via addTask (used as fallback)
export const generateDemoTasks = (addTask) => {
  getDemoTaskData().forEach(task => addTask(task));
};