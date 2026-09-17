import { Member, OverlapSlot, OverlapWindow, TimeSlot } from '../types';

/**
 * TimeSync Multizone Time Calculation Engine
 * - Universal UTC Normalization (RF-4.1)
 * - Interval Intersection Algorithm: [max(start), min(end)] (RF-4.2)
 * - Projection to Active User's Local Timezone (RF-4.3)
 * - Google Calendar URL & iCalendar (.ics) Generator (Phase 2)
 */

/**
 * Computes exact offset in minutes between UTC and a target IANA timezone at a specific point in time.
 */
export function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / (60 * 1000));
  } catch {
    return 0; // Fallback to UTC if timezone is invalid
  }
}

/**
 * Converts a date ("YYYY-MM-DD") and local time ("HH:mm") in a specific IANA timezone
 * into an absolute ISO 8601 UTC string.
 * Example: ("2026-09-15", "08:00", "America/El_Salvador") -> UTC ISO timestamp
 */
export function localTimeToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Initial rough UTC guess
  const guessUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  const offsetMinutes = getTimezoneOffsetMinutes(guessUtc, timeZone);

  // Apply inverse offset to obtain exact UTC timestamp
  const exactUtc = new Date(guessUtc.getTime() - offsetMinutes * 60 * 1000);
  
  // Re-verify in case of DST transitions
  const recheckOffset = getTimezoneOffsetMinutes(exactUtc, timeZone);
  if (recheckOffset !== offsetMinutes) {
    const refinedUtc = new Date(guessUtc.getTime() - recheckOffset * 60 * 1000);
    return refinedUtc.toISOString();
  }

  return exactUtc.toISOString();
}

/**
 * Formats an ISO UTC timestamp into a formatted string in the target timezone
 */
export function formatInTimezone(
  isoUtc: string,
  timeZone: string,
  format: 'time' | 'time12' | 'shortDate' | 'full' = 'time'
): string {
  try {
    const d = new Date(isoUtc);
    if (isNaN(d.getTime())) return '--:--';

    if (format === 'time') {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(d);
    }

    if (format === 'time12') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(d);
    }

    if (format === 'shortDate') {
      return new Intl.DateTimeFormat('es-ES', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }).format(d);
    }

    return new Intl.DateTimeFormat('es-ES', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return isoUtc.substring(11, 16);
  }
}

/**
 * Returns the date string "YYYY-MM-DD" for an ISO UTC string in the target timezone
 */
export function getDateKeyInTimezone(isoUtc: string, timeZone: string): string {
  try {
    const d = new Date(isoUtc);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d); // Returns "YYYY-MM-DD"
  } catch {
    return isoUtc.substring(0, 10);
  }
}

/**
 * Checks if an absolute UTC interval overlaps with any of a member's busy slots
 */
export function isMemberBusyAtInterval(member: Member, startIsoUtc: string, endIsoUtc: string): boolean {
  if (!member.busySlots || member.busySlots.length === 0) return false;

  const targetStart = new Date(startIsoUtc).getTime();
  const targetEnd = new Date(endIsoUtc).getTime();

  return member.busySlots.some((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();
    // Intersection condition: targetStart < slotEnd && targetEnd > slotStart
    return targetStart < slotEnd && targetEnd > slotStart;
  });
}

/**
 * Checks if a member is working and not busy at a given UTC time slot
 */
export function isMemberAvailableAtSlot(
  member: Member,
  slotStartIsoUtc: string,
  slotEndIsoUtc: string
): boolean {
  // Check if busy first
  if (isMemberBusyAtInterval(member, slotStartIsoUtc, slotEndIsoUtc)) {
    return false;
  }

  // Determine the member's local time at slotStart
  const slotDateInMemberTz = getDateKeyInTimezone(slotStartIsoUtc, member.timeZone);
  const memberWorkStartUtc = localTimeToUtcIso(slotDateInMemberTz, member.workStart, member.timeZone);
  const memberWorkEndUtc = localTimeToUtcIso(slotDateInMemberTz, member.workEnd, member.timeZone);

  const slotStartMs = new Date(slotStartIsoUtc).getTime();
  const slotEndMs = new Date(slotEndIsoUtc).getTime();
  const workStartMs = new Date(memberWorkStartUtc).getTime();
  const workEndMs = new Date(memberWorkEndUtc).getTime();

  // Normal day shift (e.g. 08:00 to 17:00)
  if (workStartMs < workEndMs) {
    return slotStartMs >= workStartMs && slotEndMs <= workEndMs;
  }

  // Overnight shift (e.g. 22:00 to 06:00)
  return (slotStartMs >= workStartMs) || (slotEndMs <= workEndMs);
}

/**
 * Calculates weekly dates starting from Monday of the current reference date
 */
export function getWeekDates(referenceDate: Date = new Date()): { dateStr: string; dayName: string; shortDate: string }[] {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day; // Distance to Monday
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dayNamesEs = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const week = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = current.toISOString().substring(0, 10);
    const shortDate = `${current.getDate()}/${current.getMonth() + 1}`;
    week.push({
      dateStr,
      dayName: dayNamesEs[i],
      shortDate
    });
  }

  return week;
}

/**
 * Generates all discrete hourly or 30-min time slots for the week in user local timezone,
 * evaluates mutual team overlap for selected members, and returns matrix data.
 */
export function calculateWeeklyOverlapMatrix(
  members: Member[],
  selectedMemberIds: string[],
  userTimeZone: string,
  referenceDate: Date = new Date(),
  stepMinutes: number = 60
): {
  days: { dateStr: string; dayName: string; shortDate: string }[];
  hours: number[];
  slotsByDayAndHour: Map<string, OverlapSlot>;
  fullOverlapWindows: OverlapWindow[];
} {
  const weekDays = getWeekDates(referenceDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const slotsByDayAndHour = new Map<string, OverlapSlot>();
  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));

  if (activeMembers.length === 0) {
    return {
      days: weekDays,
      hours,
      slotsByDayAndHour,
      fullOverlapWindows: []
    };
  }

  const consecutiveFullSlots: { startIso: string; endIso: string; dateStr: string }[] = [];

  // Iterate each day of the week
  weekDays.forEach((day) => {
    hours.forEach((hour) => {
      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      const slotStartIso = localTimeToUtcIso(day.dateStr, timeStr, userTimeZone);
      
      const nextHour = hour + 1;
      const nextTimeStr = `${String(nextHour).padStart(2, '0')}:00`;
      const slotEndIso = localTimeToUtcIso(day.dateStr, nextTimeStr, userTimeZone);

      const availableMemberIds: string[] = [];
      activeMembers.forEach((m) => {
        if (isMemberAvailableAtSlot(m, slotStartIso, slotEndIso)) {
          availableMemberIds.push(m.id);
        }
      });

      const totalSelected = activeMembers.length;
      const percentage = totalSelected > 0 ? Math.round((availableMemberIds.length / totalSelected) * 100) : 0;
      const isFullOverlap = availableMemberIds.length === totalSelected;

      const slotKey = `${day.dateStr}_${hour}`;
      const overlapSlot: OverlapSlot = {
        isoUTC: slotStartIso,
        localTime: timeStr,
        localHour: hour,
        localMinute: 0,
        availableMemberIds,
        totalSelected,
        percentage,
        isFullOverlap,
        dateKey: day.dateStr
      };

      slotsByDayAndHour.set(slotKey, overlapSlot);

      if (isFullOverlap) {
        consecutiveFullSlots.push({
          startIso: slotStartIso,
          endIso: slotEndIso,
          dateStr: day.dateStr
        });
      }
    });
  });

  // Group continuous full overlap slots into readable meeting windows
  const fullOverlapWindows = buildContinuousOverlapWindows(
    consecutiveFullSlots,
    activeMembers,
    userTimeZone,
    weekDays
  );

  return {
    days: weekDays,
    hours,
    slotsByDayAndHour,
    fullOverlapWindows
  };
}

/**
 * Merges adjacent 1-hour overlap slots into consolidated meeting windows and scores them
 */
function buildContinuousOverlapWindows(
  fullSlots: { startIso: string; endIso: string; dateStr: string }[],
  activeMembers: Member[],
  userTimeZone: string,
  weekDays: { dateStr: string; dayName: string }[]
): OverlapWindow[] {
  if (fullSlots.length === 0) return [];

  // Sort chronologically
  const sorted = [...fullSlots].sort(
    (a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()
  );

  const merged: { startIso: string; endIso: string; dateStr: string }[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (current.endIso === item.startIso && current.dateStr === item.dateStr) {
      current.endIso = item.endIso;
    } else {
      merged.push(current);
      current = { ...item };
    }
  }
  merged.push(current);

  return merged.map((block, idx) => {
    const startMs = new Date(block.startIso).getTime();
    const endMs = new Date(block.endIso).getTime();
    const durationMinutes = Math.round((endMs - startMs) / (60 * 1000));
    
    const dayMeta = weekDays.find((d) => d.dateStr === block.dateStr) || { dayName: 'Día', dateStr: block.dateStr };
    const startLocalFormatted = formatInTimezone(block.startIso, userTimeZone, 'time');
    const endLocalFormatted = formatInTimezone(block.endIso, userTimeZone, 'time');

    // Calculate fatigue score based on members' local times (prefer 09:00 - 18:00)
    let fatiguePenalty = 0;
    activeMembers.forEach((m) => {
      const memberHour = parseInt(formatInTimezone(block.startIso, m.timeZone, 'time').split(':')[0], 10);
      if (memberHour < 8 || memberHour >= 19) {
        fatiguePenalty += 25; // early morning or night penalty
      }
    });

    return {
      id: `window-${idx}-${block.dateStr}`,
      startUTC: block.startIso,
      endUTC: block.endIso,
      startLocalFormatted,
      endLocalFormatted,
      durationMinutes,
      dayName: dayMeta.dayName,
      dateStr: block.dateStr,
      participantIds: activeMembers.map((m) => m.id),
      coverageRatio: 1.0,
      fatigueScore: fatiguePenalty
    };
  }).sort((a, b) => a.fatigueScore - b.fatigueScore); // Best slots with lowest fatigue first
}

/**
 * Phase 2: Generates a Google Calendar 1-Click scheduling URL with pre-filled details
 */
export function generateGoogleCalendarUrl(
  title: string,
  startIsoUtc: string,
  endIsoUtc: string,
  details: string,
  attendeesEmails: string[]
): string {
  // Google Calendar uses YYYYMMDDTHHmmssZ format
  const formatGCalDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const datesParam = `${formatGCalDate(startIsoUtc)}/${formatGCalDate(endIsoUtc)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details,
    add: attendeesEmails.join(',')
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) download for the meeting
 */
export function downloadIcsFile(
  title: string,
  startIsoUtc: string,
  endIsoUtc: string,
  description: string,
  attendeesEmails: string[]
): void {
  const formatIcsDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeSync GitHub Primer Team Overlap//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:timesync-${Date.now()}@teamspace.local`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(startIsoUtc)}`,
    `DTEND:${formatIcsDate(endIsoUtc)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `STATUS:CONFIRMED`,
    ...attendeesEmails.map((email) => `ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${email}`),
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
