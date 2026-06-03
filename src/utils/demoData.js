// Demo data generator for AssignTify — realistic university tasks
export const generateDemoTasks = (addTask) => {
  const now = new Date();

  const makeDeadline = (daysFromNow, hour = 23, minute = 59) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const demoTasks = [
    {
      name: 'BUS4012 Assignment 3',
      description: 'Analyse the financial performance of two competing firms using ratio analysis and write a 2,500-word comparative report.',
      deadline: makeDeadline(3),
      priority: 'High',
      hoursPerDay: 3
    },
    {
      name: 'Business Analytics Report',
      description: 'Complete the data visualisation dashboard using Tableau and write the methodology section of the report.',
      deadline: makeDeadline(7),
      priority: 'Medium',
      hoursPerDay: 2
    },
    {
      name: 'Cybersecurity Presentation',
      description: 'Prepare a 15-minute presentation on recent ransomware attack vectors and mitigation strategies for enterprise systems.',
      deadline: makeDeadline(5),
      priority: 'High',
      hoursPerDay: 2
    },
    {
      name: 'Marketing Case Study',
      description: 'Analyse the market entry strategy of a chosen brand into the Australian market. Include PESTLE and SWOT analysis.',
      deadline: makeDeadline(10),
      priority: 'Medium',
      hoursPerDay: 2
    },
    {
      name: 'Exam Revision Session',
      description: 'Review lecture notes and practice past exam papers for the upcoming final exam covering weeks 6-12 content.',
      deadline: makeDeadline(14),
      priority: 'Low',
      hoursPerDay: 1
    }
  ];

  demoTasks.forEach(task => addTask(task));
};