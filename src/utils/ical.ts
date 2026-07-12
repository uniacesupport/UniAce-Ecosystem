import { Assignment } from '../types';

export interface ICalEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
}

/**
 * Format a Date object to the standard iCal date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
const formatToICalDate = (date: Date, isAllDay = false): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  
  if (isAllDay) {
    return `${yyyy}${mm}${dd}`;
  }
  
  const hh = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
};

/**
 * Escape special characters in iCal text fields
 */
const escapeText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate standard iCal (.ics) string from a list of events
 */
export const generateICalString = (events: ICalEvent[]): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniAce//Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    const stamp = formatToICalDate(new Date());
    const startStr = formatToICalDate(event.startDate, event.isAllDay);
    const endStr = formatToICalDate(event.endDate, event.isAllDay);
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@uniace.app`);
    lines.push(`DTSTAMP:${stamp}`);
    
    if (event.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${startStr}`);
      lines.push(`DTEND;VALUE=DATE:${endStr}`);
    } else {
      lines.push(`DTSTART:${startStr}`);
      lines.push(`DTEND:${endStr}`);
    }
    
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Trigger browser download for a calendar file
 */
export const downloadCalendarFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Calculate the correct date based on "Day X" or weekday strings dynamically
 */
export const calculateDayDate = (dayStr: string): Date => {
  const now = new Date();
  
  // Set time to morning for study slot references (e.g. 9:00 AM UTC)
  now.setUTCHours(9, 0, 0, 0);

  // Try to parse "Day X" (e.g., "Day 1", "Day 3")
  const dayMatch = dayStr.match(/Day\s+(\d+)/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    const result = new Date(now);
    result.setUTCDate(now.getUTCDate() + (dayNum - 1));
    return result;
  }

  // Try to parse weekday name (e.g., "Monday")
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = dayStr.trim().toLowerCase();
  const targetIdx = weekdays.indexOf(targetDay);
  
  if (targetIdx !== -1) {
    const currentIdx = now.getUTCDay();
    let daysToAdd = targetIdx - currentIdx;
    if (daysToAdd < 0) {
      daysToAdd += 7; // Next occurrence in the upcoming week
    }
    const result = new Date(now);
    result.setUTCDate(now.getUTCDate() + daysToAdd);
    return result;
  }

  return now;
};

/**
 * Convert dynamic Daily Schedule into printable iCal events
 */
export const convertStudyPlanToEvents = (dailySchedule: { day: string; focus: string; tasks: string[] }[]): ICalEvent[] => {
  return dailySchedule.map((item, idx) => {
    const startDate = calculateDayDate(item.day);
    
    // Create a 2-hour study event by default
    const endDate = new Date(startDate);
    endDate.setUTCHours(startDate.getUTCHours() + 2);

    const description = `Focus: ${item.focus}\n\nTasks:\n${item.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

    return {
      id: `study-plan-${idx}-${startDate.getTime()}`,
      title: `📚 UniAce Study Session: ${item.focus}`,
      description,
      startDate,
      endDate
    };
  });
};

/**
 * Convert pending assignments to iCal events
 */
export const convertAssignmentsToEvents = (assignments: Assignment[]): ICalEvent[] => {
  return assignments.map(assignment => {
    const dueDate = new Date(assignment.dueDate);
    
    // For all-day events, the end date is exclusive and should be the day after the start date
    const endDate = new Date(dueDate);
    endDate.setUTCDate(dueDate.getUTCDate() + 1);

    const description = `Course: ${assignment.courseId}\nStatus: ${assignment.status.toUpperCase()}\n\nSync from your UniAce Academic Planner.`;

    return {
      id: `assignment-${assignment.id}`,
      title: `📝 UniAce Deadline: ${assignment.title} (${assignment.courseId})`,
      description,
      startDate: dueDate,
      endDate,
      isAllDay: true
    };
  });
};
