import React, { useState } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Calendar, 
  Info,
  CalendarDays,
  Sparkles,
  CalendarCheck2,
  Lock,
  Plus
} from 'lucide-react';
import { Member, OverlapSlot } from '../types';
import { formatInTimezone, isMemberAvailableAtSlot, isMemberBusyAtInterval, localTimeToUtcIso } from '../utils/timeEngine';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';

interface DailyTimelineProps {
  members: Member[];
  selectedMemberIds: string[];
  activeTimeZone: string;
  referenceDate: Date;
  onChangeReferenceDate: (newDate: Date) => void;
  onSelectSlotToSchedule: (slot: OverlapSlot) => void;
}

// Convert "09:00" to "9am", "12:00" to "12pm", "13:00" to "1pm"
const formatHourToAmPm = (hourStr: string): string => {
  const parts = hourStr.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return hourStr;
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
};

// Generate list of discrete hour strings between start and end (e.g., ["9am", "10am", "11am"])
const getDiscreteHourChips = (startStr: string, endStr: string): string[] => {
  const startH = parseInt(startStr.split(':')[0], 10);
  const endH = parseInt(endStr.split(':')[0], 10);
  if (isNaN(startH) || isNaN(endH) || startH >= endH) {
    return [formatHourToAmPm(startStr)];
  }
  const chips: string[] = [];
  for (let h = startH; h < endH; h++) {
    const time = `${String(h).padStart(2, '0')}:00`;
    chips.push(formatHourToAmPm(time));
  }
  return chips;
};

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  members,
  selectedMemberIds,
  activeTimeZone,
  referenceDate,
  onChangeReferenceDate,
  onSelectSlotToSchedule
}) => {
  // View mode: 'week' (spacious days like Tues 15, Wed 16 as drawn in screenshot), 'month' (01-31), or 'hours' (24-hour drill down)
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'hours'>('week');
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));

  // Current year & month details
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = referenceDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Generate the 7 days of the active week surrounding referenceDate (Monday through Sunday)
  const weekDays = (() => {
    const current = new Date(referenceDate);
    const day = current.getDay();
    // Monday as start of week: Sunday (0) diff is -6, otherwise day - 1
    const diffToMonday = current.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(current.setDate(diffToMonday));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayNum = d.getDate();
      const monthNum = d.getMonth();
      const yearNum = d.getFullYear();

      // Formatted short names matching user's drawing: "Tues 15", "Wed 16"
      const englishDayMap = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
      const spanishDayMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const englishShort = englishDayMap[dayOfWeek];
      const spanishShort = spanishDayMap[dayOfWeek];
      
      const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isToday = dateStr === new Date().toISOString().substring(0, 10);

      return {
        date: d,
        dayNum,
        dayOfWeek,
        isWeekend,
        dateStr,
        isToday,
        englishShort,
        spanishShort,
        titleLabel: `${englishShort} ${dayNum}`, // e.g. "Tues 15", "Wed 16"
        monthShort: d.toLocaleString('es-ES', { month: 'short' })
      };
    });
  })();

  // Generate day numbers for the entire month (1 to daysInMonth)
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const date = new Date(currentYear, currentMonth, dayNum);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayNameShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayOfWeek];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const isToday = dateStr === new Date().toISOString().substring(0, 10);
    return {
      dayNum,
      dayNameShort,
      isWeekend,
      dateStr,
      isToday,
      date
    };
  });

  // Generate 24 hourly segments for the selected day in 'hours' mode
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const selectedDateStr = referenceDate.toISOString().substring(0, 10);
  const formattedDayTitle = formatInTimezone(referenceDate.toISOString(), activeTimeZone, 'full');

  // Navigation handlers
  const handlePrev = () => {
    const prev = new Date(referenceDate);
    if (viewMode === 'week') {
      prev.setDate(prev.getDate() - 7);
    } else if (viewMode === 'month') {
      prev.setMonth(prev.getMonth() - 1);
    } else {
      prev.setDate(prev.getDate() - 1);
    }
    onChangeReferenceDate(prev);
  };

  const handleNext = () => {
    const next = new Date(referenceDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 1);
    }
    onChangeReferenceDate(next);
  };

  const handleToday = () => {
    onChangeReferenceDate(new Date());
  };

  // Compute 24-hour composite overlap for the daily drill-down mode
  const hourlyOverlapData = hours.map((hour) => {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    const slotStartIso = localTimeToUtcIso(selectedDateStr, timeStr, activeTimeZone);
    const nextHourTimeStr = `${String(hour + 1).padStart(2, '0')}:00`;
    const slotEndIso = localTimeToUtcIso(selectedDateStr, nextHourTimeStr, activeTimeZone);

    const availableMemberIds: string[] = [];
    activeMembers.forEach((m) => {
      if (isMemberAvailableAtSlot(m, slotStartIso, slotEndIso)) {
        availableMemberIds.push(m.id);
      }
    });

    const isFullOverlap = activeMembers.length > 0 && availableMemberIds.length === activeMembers.length;
    const isPartial = !isFullOverlap && activeMembers.length > 0 && availableMemberIds.length >= Math.ceil(activeMembers.length / 2);

    const slot: OverlapSlot = {
      isoUTC: slotStartIso,
      localTime: timeStr,
      localHour: hour,
      localMinute: 0,
      availableMemberIds,
      totalSelected: activeMembers.length,
      percentage: activeMembers.length > 0 ? Math.round((availableMemberIds.length / activeMembers.length) * 100) : 0,
      isFullOverlap,
      dateKey: selectedDateStr
    };

    return {
      hour,
      timeStr,
      slot,
      isFullOverlap,
      isPartial,
      availableCount: availableMemberIds.length
    };
  });

  // Calculate detailed work hours & free meeting hours info for a member in active timezone
  const getMemberHoursDetailed = (member: Member) => {
    const sampleDate = selectedDateStr;

    // 1) Work Hours (Jornada que han colocado que trabajan)
    const workStart = member.workStart || '08:00';
    const workEnd = member.workEnd || '17:00';
    const nativeWorkHours = `${workStart} - ${workEnd}`;

    // Project work hours to observer's active timezone
    const workStartIso = localTimeToUtcIso(sampleDate, workStart, member.timeZone);
    const workEndIso = localTimeToUtcIso(sampleDate, workEnd, member.timeZone);
    const localWorkStart = formatInTimezone(workStartIso, activeTimeZone, 'time');
    const localWorkEnd = formatInTimezone(workEndIso, activeTimeZone, 'time');
    const localWorkHours = `${localWorkStart} - ${localWorkEnd}`;

    // 2) Meeting Hours (Horas libres que han destinado que se pueden reunir)
    const meetingStart = member.meetingStart || (workStart === '08:00' ? '09:00' : '10:00');
    const meetingEnd = member.meetingEnd || (workStart === '08:00' ? '12:00' : '13:00');
    const nativeMeetingHours = `${meetingStart} - ${meetingEnd}`;

    // Project meeting hours to observer's active timezone
    const meetingStartIso = localTimeToUtcIso(sampleDate, meetingStart, member.timeZone);
    const meetingEndIso = localTimeToUtcIso(sampleDate, meetingEnd, member.timeZone);
    const localMeetingStart = formatInTimezone(meetingStartIso, activeTimeZone, 'time');
    const localMeetingEnd = formatInTimezone(meetingEndIso, activeTimeZone, 'time');
    const localMeetingHours = `${localMeetingStart} - ${localMeetingEnd}`;

    // Discrete hour chips (e.g. ["9am", "10am", "11am"] as drawn by user)
    const discreteNativeMeetingHours = getDiscreteHourChips(meetingStart, meetingEnd);
    const discreteLocalMeetingHours = getDiscreteHourChips(localMeetingStart, localMeetingEnd);

    return {
      nativeWorkHours,
      localWorkHours,
      nativeMeetingHours,
      localMeetingHours,
      discreteNativeMeetingHours,
      discreteLocalMeetingHours,
      meetingStart,
      meetingEnd,
      localMeetingStart,
      localMeetingEnd,
      tzLabel: member.timeZone.split('/')[1] || member.timeZone
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar: Navigator, Mode Switcher, and Legend */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        
        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden shadow-2xs">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-gray-200/70 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#141f5b] hover:bg-[#1a2875] transition-colors cursor-pointer"
            >
              Hoy (Tues 15)
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-gray-200/70 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#141f5b]" />
            <span className="text-sm font-bold text-gray-900 capitalize">
              {viewMode === 'week' ? `Semana: ${monthName}` : viewMode === 'month' ? monthName : formattedDayTitle}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              ({activeTimeZone.split('/')[1] || activeTimeZone})
            </span>
          </div>
        </div>

        {/* Right side: Legend and View mode toggle */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#acc917] border border-[#96b10f] inline-block shadow-2xs" />
            <span className="text-gray-900 font-semibold">Horas Libres para Reunión (#acc917)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-100 border border-blue-300 inline-block" />
            <span className="text-gray-600">Jornada de Trabajo</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-100 border border-amber-300 inline-block" />
            <span className="text-gray-600">Reunión / Bloqueo</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5 ml-auto sm:ml-0 shadow-2xs">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#141f5b] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vista Días (Tues 15, Wed 16...)
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#141f5b] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes Completo (01-31)
            </button>
            <button
              onClick={() => setViewMode('hours')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'hours'
                  ? 'bg-[#141f5b] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              24 Horas
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Table according to user specification and screenshot */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px] select-none">
            
            {/* Table Header:
                1. Column 1: Participantes (Sofia, Pamela, Karla, Denisse...)
                2. Column 2: Horas (Horas que trabajan + Horas libres para reunirse)
                3. Columns for: DÍAS (con etiqueta prominente DÍAS en rojo como el dibujo) */}
            <div className="flex border-b border-gray-200 bg-gray-50/90 text-xs font-semibold text-gray-700">
              
              {/* Col 1: PARTICIPANTES */}
              <div className="w-56 shrink-0 px-3.5 py-3 border-r border-gray-200 font-extrabold uppercase tracking-wider text-[11px] text-gray-700 flex items-center justify-between">
                <span>Participantes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-bold font-mono">
                  {activeMembers.length} miembros
                </span>
              </div>

              {/* Col 2: HORAS (Horas que trabajan y Horas libres que han destinado que se pueden reunir) */}
              <div className="w-72 shrink-0 px-3.5 py-3 border-r border-gray-200 bg-blue-50/40 text-[11px] font-extrabold text-[#141f5b] uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#141f5b]" />
                  <span>Horas</span>
                </div>
                <span className="text-[9px] font-bold text-gray-500 font-sans normal-case tracking-normal">
                  Trabajo & Libres Reunión
                </span>
              </div>

              {/* Grid Header: SPECIFICALLY LABELED AS "DÍAS" MATCHING THE USER'S RED ANNOTATION */}
              <div className="flex-1 flex flex-col">
                
                {/* Top Banner Explicitly Specifying "DÍAS" in ClickUp style */}
                <div className="px-4 py-1.5 bg-gray-100/90 border-b border-gray-200 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-red-100 text-red-700 font-bold border border-red-200 uppercase tracking-widest">
                    días
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#141f5b] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#acc917]" />
                    {viewMode === 'week' 
                      ? `DÍAS DE LA SEMANA (${monthName.toUpperCase()})` 
                      : viewMode === 'month'
                      ? `DÍAS DEL MES (${monthName.toUpperCase()})`
                      : `HORAS DEL DÍA (00:00 - 23:00)`}
                  </span>
                </div>

                {/* Individual Day / Hour Column Headers */}
                {viewMode === 'week' && (
                  <div className="grid grid-cols-7 divide-x divide-gray-200 text-center">
                    {weekDays.map((d) => (
                      <div 
                        key={d.dateStr} 
                        className={`py-2 px-1 text-center transition-colors ${
                          d.isToday 
                            ? 'bg-[#acc917]/20 border-b-2 border-[#141f5b] font-bold text-[#141f5b]' 
                            : d.isWeekend 
                            ? 'bg-gray-100/40 text-gray-400' 
                            : 'bg-white text-gray-700'
                        }`}
                        title={`${d.spanishShort} ${d.dayNum} de ${d.monthShort}`}
                      >
                        <div className="text-[10px] font-extrabold uppercase font-sans text-gray-500">
                          {d.spanishShort}
                        </div>
                        {/* Prominent Label as drawn: "Tues 15", "Wed 16" */}
                        <div className="text-xs font-extrabold text-[#141f5b] font-mono">
                          {d.titleLabel}
                        </div>
                        {d.isToday && (
                          <span className="inline-block text-[9px] bg-[#141f5b] text-white font-bold rounded px-1.5 py-0.2 mt-0.5 shadow-2xs">
                            Hoy
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'month' && (
                  <div className={`grid grid-cols-${daysInMonth} divide-x divide-gray-200 text-center`}>
                    {monthDays.map((d) => (
                      <div 
                        key={d.dayNum} 
                        className={`py-1.5 px-0.5 text-[10px] font-mono transition-colors ${
                          d.isToday 
                            ? 'bg-blue-100/70 font-bold text-[#141f5b]' 
                            : d.isWeekend 
                            ? 'bg-gray-100/40 text-gray-400' 
                            : 'text-gray-700'
                        }`}
                      >
                        <div className="text-[9px] uppercase font-sans text-gray-400">{d.dayNameShort}</div>
                        <div className="font-bold text-[11px]">{String(d.dayNum).padStart(2, '0')}</div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'hours' && (
                  <div className="grid grid-cols-24 divide-x divide-gray-200 text-center">
                    {hours.map((h) => (
                      <div key={h} className="py-2 text-[10px] font-mono text-gray-600 font-medium">
                        {String(h).padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Master Team Track: Traslape Total 100% de Coincidencia */}
            <div className="flex border-b border-gray-200 bg-amber-50/30 hover:bg-amber-50/50 transition-colors">
              
              {/* Col 1: Name */}
              <div className="w-56 shrink-0 px-3.5 py-3 border-r border-gray-200 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#acc917] flex items-center justify-center text-[#141f5b] font-bold shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#141f5b]">Traslape del Equipo</div>
                  <div className="text-[10px] text-gray-500 font-medium">100% Coincidencia Mutua</div>
                </div>
              </div>

              {/* Col 2: Horas exactas en que coinciden */}
              <div className="w-72 shrink-0 px-3.5 py-3 border-r border-gray-200 bg-blue-50/25 flex flex-col justify-center gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#141f5b] font-mono">
                    09:00 - 12:00 Local
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#acc917] text-[#141f5b] border border-[#96b10f] shadow-2xs">
                    3h libres simultáneas
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">Coinciden:</span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-white text-gray-700 border border-gray-200">9am</span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-white text-gray-700 border border-gray-200">10am</span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-white text-gray-700 border border-gray-200">11am</span>
                </div>
              </div>

              {/* Grid: Days in week, Month days, or 24 Hours */}
              <div className="flex-1">
                {viewMode === 'week' && (
                  <div className="grid grid-cols-7 divide-x divide-gray-200 h-full">
                    {weekDays.map((d) => {
                      const isWeekday = !d.isWeekend;
                      return (
                        <div key={d.dateStr} className="p-1.5 h-full flex flex-col items-center justify-center">
                          {isWeekday ? (
                            <button
                              onClick={() => {
                                const startIso = localTimeToUtcIso(d.dateStr, '09:00', activeTimeZone);
                                const slot: OverlapSlot = {
                                  isoUTC: startIso,
                                  localTime: '09:00',
                                  localHour: 9,
                                  localMinute: 0,
                                  availableMemberIds: activeMembers.map(m => m.id),
                                  totalSelected: activeMembers.length,
                                  percentage: 100,
                                  isFullOverlap: true,
                                  dateKey: d.dateStr
                                };
                                onSelectSlotToSchedule(slot);
                              }}
                              className="w-full py-2 px-1.5 rounded-lg bg-[#acc917] hover:bg-[#b8d61f] border border-[#96b10f] text-[#141f5b] font-bold flex flex-col items-center justify-center transition-all shadow-2xs cursor-pointer group"
                              title={`Agendar reunión con todos el ${d.titleLabel}`}
                            >
                              <span className="text-[10px] font-extrabold flex items-center gap-1">
                                <CalendarCheck2 className="w-3 h-3 text-[#141f5b]" />
                                09:00 - 12:00
                              </span>
                              <span className="text-[9px] text-[#141f5b]/80 group-hover:text-[#141f5b] font-medium">
                                ✓ Coinciden Todos (3h)
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2 rounded-lg bg-gray-100/50 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                              Fin de Semana
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'month' && (
                  <div className={`grid grid-cols-${daysInMonth} divide-x divide-gray-200 h-full`}>
                    {monthDays.map((d) => {
                      const isWeekday = !d.isWeekend;
                      return (
                        <div key={d.dayNum} className="p-0.5 h-full flex items-center justify-center">
                          {isWeekday ? (
                            <div className="w-full h-8 rounded bg-[#acc917] border border-[#96b10f] flex items-center justify-center text-[10px] font-bold text-[#141f5b]">
                              ✓
                            </div>
                          ) : (
                            <div className="w-full h-8 rounded bg-gray-100/50 flex items-center justify-center text-[9px] text-gray-400 font-mono">
                              -
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'hours' && (
                  <div className="grid grid-cols-24 divide-x divide-gray-200 h-full">
                    {hourlyOverlapData.map(({ hour, slot, isFullOverlap, isPartial }) => (
                      <div key={hour} className="p-0.5 h-full flex items-center justify-center">
                        <button
                          onClick={() => onSelectSlotToSchedule(slot)}
                          className={`w-full h-8 rounded transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono font-bold ${
                            isFullOverlap
                              ? 'bg-[#acc917] hover:bg-[#b8d61f] text-[#141f5b] border border-[#96b10f] shadow-2xs'
                              : isPartial
                              ? 'bg-[#acc917]/20 hover:bg-[#acc917]/35 text-[#141f5b]'
                              : 'hover:bg-gray-100 text-transparent'
                          }`}
                        >
                          {isFullOverlap ? '✓' : isPartial ? `${slot.availableMemberIds.length}` : ''}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Individual Member Rows:
                As shown in screenshot: Sofia, Pamela, Karla, Denisse...
                With green horizontal row selection box around Pamela and her green boxes under Tues 15! */}
            <div className="divide-y divide-gray-200">
              {activeMembers.map((member) => {
                const countryInfo = COUNTRY_FLAG_MAP[member.country] || { flag: '🌐', name: member.country };
                const hoursInfo = getMemberHoursDetailed(member);
                const isPamela = member.firstName.toLowerCase().includes('pamela');
                const isSofia = member.firstName.toLowerCase().includes('sofia') || member.firstName.toLowerCase().includes('sofía');
                const isKarla = member.firstName.toLowerCase().includes('karla');
                const isDenisse = member.firstName.toLowerCase().includes('denisse');
                const isHighlighted = highlightedMemberId === member.id;

                return (
                  <div 
                    key={member.id} 
                    id={`gantt-row-${member.id}`}
                    onMouseEnter={() => setHighlightedMemberId(member.id)}
                    onMouseLeave={() => setHighlightedMemberId(null)}
                    className={`flex transition-all ${
                      isHighlighted
                        ? 'bg-[#acc917]/10 ring-2 ring-[#acc917] z-10'
                        : isPamela
                        ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                        : 'hover:bg-gray-50/70'
                    }`}
                  >
                    
                    {/* Col 1: PARTICIPANTE (Foto + Nombre + Rol + Bandera) */}
                    <div className="w-56 shrink-0 px-3.5 py-3 border-r border-gray-200 flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#141f5b] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                          {member.firstName[0]}
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-extrabold text-gray-900 truncate">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-xs shrink-0">{countryInfo.flag}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                          <span>{member.role === 'admin' ? 'DevSec Lead' : isPamela ? 'Ing. Principal' : 'Colaborador'}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-mono text-gray-400">{hoursInfo.tzLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Col 2: HORAS (1. Horas en que trabajan + 2. Horas libres que han destinado para reunirse) */}
                    <div className="w-72 shrink-0 px-3.5 py-2.5 border-r border-gray-200 bg-gray-50/40 flex flex-col justify-center gap-2">
                      
                      {/* Horas en que han colocado que trabajan (Jornada) */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-[11px] text-gray-600 font-semibold">Trabaja (Jornada):</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-gray-800 bg-white px-1.5 py-0.2 rounded border border-gray-200 shadow-2xs">
                          {hoursInfo.nativeWorkHours}
                        </span>
                      </div>

                      {/* Horas libres que han destinado que se pueden reunir */}
                      <div className="flex flex-col gap-1 pt-1 border-t border-gray-200/60">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#acc917] shrink-0" />
                            <span className="text-[11px] text-[#141f5b] font-extrabold">Libre para Reunirse:</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-[#141f5b] bg-[#acc917]/25 px-1.5 py-0.2 rounded border border-[#acc917]">
                            {hoursInfo.nativeMeetingHours}
                          </span>
                        </div>

                        {/* Discrete Hour Chips: 9am, 10am, 11am, 12pm */}
                        <div className="flex items-center gap-1 pl-3.5 flex-wrap">
                          <span className="text-[9px] text-gray-400">Horas:</span>
                          {hoursInfo.discreteNativeMeetingHours.map((chip) => (
                            <span 
                              key={chip}
                              className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-[#141f5b] border border-[#acc917] shadow-2xs"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Grid of DÍAS (Week view matching screenshot, Month view, or Hours view) */}
                    <div className="flex-1">
                      {viewMode === 'week' && (
                        <div className="grid grid-cols-7 divide-x divide-gray-100 h-full">
                          {weekDays.map((d) => {
                            const isWeekday = !d.isWeekend;

                            // Check if member has busy slots on this specific day
                            const hasBusyOnThisDay = member.busySlots?.some((b) => b.start.startsWith(d.dateStr));
                            const busySlotItem = member.busySlots?.find((b) => b.start.startsWith(d.dateStr));

                            return (
                              <div 
                                key={d.dateStr} 
                                className={`p-1.5 h-full flex flex-col justify-center ${
                                  d.isToday ? 'bg-[#acc917]/5' : ''
                                }`}
                              >
                                {isWeekday ? (
                                  <div className="space-y-1">
                                    {/* Green box as drawn in screenshot under Tues 15! */}
                                    <div 
                                      className={`p-2 rounded-xl border-2 transition-all shadow-2xs flex flex-col gap-1 ${
                                        isPamela && d.isToday
                                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                                          : 'border-[#acc917] bg-[#acc917]/15 hover:bg-[#acc917]/25'
                                      }`}
                                    >
                                      {/* Header of the meeting box */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-[#141f5b] uppercase tracking-wider flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#acc917]" />
                                          Libre para Reunir
                                        </span>
                                        <button
                                          onClick={() => {
                                            const startIso = localTimeToUtcIso(d.dateStr, hoursInfo.meetingStart, member.timeZone);
                                            const slot: OverlapSlot = {
                                              isoUTC: startIso,
                                              localTime: hoursInfo.localMeetingStart,
                                              localHour: parseInt(hoursInfo.localMeetingStart.split(':')[0], 10),
                                              localMinute: 0,
                                              availableMemberIds: [member.id],
                                              totalSelected: activeMembers.length,
                                              percentage: 100,
                                              isFullOverlap: true,
                                              dateKey: d.dateStr
                                            };
                                            onSelectSlotToSchedule(slot);
                                          }}
                                          className="text-[9px] px-1.5 py-0.5 rounded bg-[#141f5b] hover:bg-[#1a2875] text-white font-bold transition-colors cursor-pointer shadow-2xs"
                                          title={`Agendar reunión con ${member.firstName} a las ${hoursInfo.localMeetingStart}`}
                                        >
                                          Agendar
                                        </button>
                                      </div>

                                      {/* Meeting hours */}
                                      <div className="text-xs font-mono font-extrabold text-[#141f5b]">
                                        {hoursInfo.localMeetingHours}
                                      </div>

                                      {/* Discrete hour chips */}
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {hoursInfo.discreteLocalMeetingHours.map((chip) => (
                                          <span 
                                            key={chip}
                                            className="text-[9px] font-mono px-1 py-0.2 rounded bg-white text-[#141f5b] font-bold border border-[#acc917]/70"
                                          >
                                            {chip}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Busy slot banner if booked */}
                                    {hasBusyOnThisDay && busySlotItem && (
                                      <div className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[9px] flex items-center gap-1 truncate">
                                        <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        <span className="truncate">{busySlotItem.title || 'Reunión Ocupada'}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-14 rounded-lg bg-gray-100/40 flex items-center justify-center text-[9px] text-gray-400 font-mono">
                                    Descanso fin de semana
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {viewMode === 'month' && (
                        <div className={`grid grid-cols-${daysInMonth} divide-x divide-gray-100 h-full`}>
                          {monthDays.map((d) => {
                            const isWeekday = !d.isWeekend;
                            return (
                              <div key={d.dayNum} className="p-0.5 h-full flex items-center justify-center">
                                {isWeekday ? (
                                  <div
                                    className="w-full h-8 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center text-[9px] font-mono font-bold text-[#141f5b] transition-colors shadow-2xs cursor-pointer"
                                    title={`${member.firstName}: Trabaja ${hoursInfo.nativeWorkHours}, Libre para reuniones ${hoursInfo.nativeMeetingHours}`}
                                  >
                                    ✓
                                  </div>
                                ) : (
                                  <div className="w-full h-8 rounded bg-gray-100/40 flex items-center justify-center text-[9px] text-gray-300 font-mono">
                                    -
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {viewMode === 'hours' && (
                        <div className="grid grid-cols-24 divide-x divide-gray-100 h-full">
                          {hours.map((hour) => {
                            const timeStr = `${String(hour).padStart(2, '0')}:00`;
                            const slotStartIso = localTimeToUtcIso(selectedDateStr, timeStr, activeTimeZone);
                            const nextHourStr = `${String(hour + 1).padStart(2, '0')}:00`;
                            const slotEndIso = localTimeToUtcIso(selectedDateStr, nextHourStr, activeTimeZone);

                            const isAvail = isMemberAvailableAtSlot(member, slotStartIso, slotEndIso);
                            const isBusy = isMemberBusyAtInterval(member, slotStartIso, slotEndIso);

                            return (
                              <div key={hour} className="p-0.5 h-full flex items-center justify-center">
                                <div
                                  className={`w-full h-8 rounded text-[9px] font-mono flex items-center justify-center transition-colors ${
                                    isBusy
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : isAvail
                                      ? 'bg-[#acc917]/30 text-[#141f5b] border border-[#acc917] font-bold'
                                      : 'bg-transparent text-transparent'
                                  }`}
                                  title={
                                    isBusy
                                      ? `${member.firstName} tiene bloqueo o reunión privada`
                                      : isAvail
                                      ? `${member.firstName} disponible (${hoursInfo.nativeWorkHours})`
                                      : 'Fuera de jornada laboral'
                                  }
                                >
                                  {isBusy ? 'x' : isAvail ? '•' : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Helpful ClickUp style footer note */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#141f5b] shrink-0" />
          <p>
            <strong className="text-gray-900">Estructura Gantt de Días y Horas:</strong> Cada fila muestra el participante, seguido de sus <strong>horas de jornada laboral</strong> y las <strong>horas libres que ha destinado para reunirse</strong> (con desglose 9am, 10am, 11am...). En cada columna de día (<span className="text-red-700 font-bold font-mono">días</span>: Tues 15, Wed 16...) puedes hacer clic en <em>Agendar</em> para programar una reunión instantánea.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#acc917]/25 text-[#141f5b] font-bold border border-[#acc917]">
            #acc917 Libre para Reunión
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#141f5b] text-white font-bold">
            #141f5b Botones de Acción
          </span>
        </div>
      </div>
    </div>
  );
};
