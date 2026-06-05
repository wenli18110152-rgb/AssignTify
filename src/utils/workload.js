/**
 * Shared workload utility — single source of truth for all workload calculations.
 *
 * Model: hoursPerDay on each task represents the estimated total weekly study
 * hours for that task (NOT a recurring daily amount). So weekly workload is
 * simply the sum of hoursPerDay for all active tasks.
 */

/**
 * Calculate total weekly study hours for active (incomplete) tasks.
 * @param {Array} tasks - Full task list
 * @returns {number} Sum of hoursPerDay for all incomplete tasks
 */
export function calculateWeeklyHours(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const active = tasks.filter(t => !t.completed);
  return Math.round(active.reduce((sum, t) => sum + (t.hoursPerDay || 1), 0) * 10) / 10;
}

/**
 * Derive the load level from weekly hours.
 * 0–15h  = Light
 * 16–30h = Moderate
 * 31–40h = Busy
 * 40h+   = Heavy
 */
export function getLoadLevel(weeklyHours) {
  if (weeklyHours > 40) return 'Heavy';
  if (weeklyHours > 30) return 'Busy';
  if (weeklyHours > 15) return 'Moderate';
  return 'Light';
}

/**
 * Average daily study hours (weekly / 7).
 */
export function calculateDailyAvg(weeklyHours) {
  return Math.round((weeklyHours / 7) * 10) / 10;
}

/**
 * Full workload breakdown — used by TaskContext and any page that needs all values.
 */
export function calculateWorkload(tasks) {
  const active = tasks ? tasks.filter(t => !t.completed) : [];
  const weeklyHours = calculateWeeklyHours(tasks);
  const loadLevel = getLoadLevel(weeklyHours);
  const dailyAvg = calculateDailyAvg(weeklyHours);

  return {
    weeklyHours,
    dailyAvg,
    activeTasks: active.length,
    loadLevel,
  };
}