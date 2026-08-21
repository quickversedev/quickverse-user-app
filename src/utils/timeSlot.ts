type TimeSlot = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  return 'NIGHT';
}

export function filterByTimeSlot<T extends { timeSlot?: string | null }>(items: T[]): T[] {
  const current = getCurrentTimeSlot();
  return items.filter(item => !item.timeSlot || item.timeSlot === current);
}
