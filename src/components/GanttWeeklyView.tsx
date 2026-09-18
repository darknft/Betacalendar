import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CalendarPlus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Member, OverlapSlot } from '../types';
import { 
  getWeekDates, 
  formatHourAmPm, 
  localTimeToUtcIso, 
  isMemberAvailableAtSlot 
} from '../utils/timeEngine';
import { SlotMemberItem } from './SlotMemberItem';

interface GanttWeeklyViewProps {
  members: Member[];
  selectedMemberIds: string[];
  activeTimeZone: string;
  referenceDate: Date;
  onChangeReferenceDate: (newDate: Date) => void;
  onSelectSlotToSchedule: (slot: OverlapSlot) => void;
}

export const GanttWeeklyView: React.FC<GanttWeeklyViewProps> = ({
  members,
  selectedMemberIds,
  activeTimeZone,
  referenceDate,
  onChangeReferenceDate,
  onSelectSlotToSchedule
}) => {
  // Hours mode: 'work' (8:00 am - 8:00 pm) or 'full' (24 hours)
  const [hoursMode, setHoursMode] = useState<'work' | 'extended' | 'full'>('work');
  // Meeting window rule: default to true (use designated meeting hours)
  const [useMeetingHours, setUseMeetingHours] = useState(true);

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));
  const weekDays = getWeekDates(referenceDate);

  // Determine hours array (no military hours!)
  const hoursToDisplay = (() => {
    if (hoursMode === 'work') {
      // 8:00 am to 7:00 pm / 8:00 pm
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8 to 20
    }
    if (hoursMode === 'extended') {
      // 7:00 am to 10:00 pm
      return Array.from({ length: 16 }, (_, i) => i + 7); // 7 to 22
    }
    // 24 hours
    return Array.from({ length: 24 }, (_, i) => i);
  })();

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(referenceDate);
    prev.setDate(prev.getDate() - 7);
    onChangeReferenceDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 7);
    onChangeReferenceDate(next);
  };

  const handleCurrentWeek = () => {
    onChangeReferenceDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Header bar: Week selector, Time Range & Visual Legend */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Week Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-2xs">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-200/70 text-gray-700 transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#141f5b] hover:bg-[#1a2875] transition-colors cursor-pointer"
            >
              Semana Actual
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-200/70 text-gray-700 transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#141f5b]" />
            <span className="text-sm font-extrabold text-gray-900">
              {weekDays[0].calendarLabel} — {weekDays[6].calendarLabel}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              ({activeTimeZone.split('/')[1] || activeTimeZone})
            </span>
          </div>
        </div>

        {/* Legend & Config controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Status color badges */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-2xs" />
            <span className="text-emerald-950 font-bold">Verde: Todos Coinciden</span>
          </div>

          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-300 px-2.5 py-1 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block shadow-2xs" />
            <span className="text-amber-950 font-semibold">Amarillo: Coincidencia Parcial</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block shadow-2xs" />
            <span className="text-gray-700 font-medium">Gris: Nadie Coincide</span>
          </div>

          {/* Range Mode Switcher */}
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5 ml-auto lg:ml-0">
            <button
              onClick={() => setHoursMode('work')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                hoursMode === 'work' ? 'bg-[#141f5b] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="8:00 am a 8:00 pm"
            >
              8:00 am - 8:00 pm
            </button>
            <button
              onClick={() => setHoursMode('full')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                hoursMode === 'full' ? 'bg-[#141f5b] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="24 Horas"
            >
              24h
            </button>
          </div>

          {/* Toggle Meeting hours vs Full Work day */}
          <button
            onClick={() => setUseMeetingHours(!useMeetingHours)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              useMeetingHours
                ? 'bg-[#acc917]/25 text-[#141f5b] border-[#acc917]'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
            title="Alternar entre evaluar horas libres de reunión o toda la jornada laboral"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{useMeetingHours ? 'Horas Libres Reunión' : 'Toda la Jornada'}</span>
          </button>
        </div>
      </div>

      {/* Main Weekly Calendar Grid:
          - First row: Days of week as requested: "Lunes 14", "Martes 15"..
          - First column: Hours formatted as "8:00 am", "7:00 pm" (no military hours!)
          - Inside each slot: all members displayed as capsules with photo, name, flag,
            verde if all coincide, amarillo if 1 doesn't coincide, and red border on non-coinciding members!
      */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            {/* FIRST ROW: Days of the week as "Lunes 14", "Martes 15" */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90">
                {/* First Column Header: Hours */}
                <th className="py-3 px-3 w-28 text-center text-xs font-mono font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 bg-gray-100/70">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#141f5b]" />
                    <span>Hora</span>
                  </div>
                </th>

                {/* Day Columns */}
                {weekDays.map((day) => {
                  const isToday = day.dateStr === new Date().toISOString().substring(0, 10);
                  return (
                    <th 
                      key={day.dateStr}
                      className={`py-3 px-2 text-center border-r border-gray-200 last:border-r-0 transition-colors ${
                        isToday ? 'bg-blue-50/80 text-[#141f5b]' : 'text-gray-800'
                      }`}
                    >
                      {/* Prominently formatted as requested: "Lunes 14", "Martes 15" */}
                      <div className="text-xs sm:text-sm font-extrabold font-sans">
                        {day.calendarLabel}
                      </div>
                      {isToday && (
                        <span className="inline-block px-2 py-0.2 mt-0.5 rounded-full text-[10px] font-bold bg-[#141f5b] text-white shadow-2xs">
                          Hoy
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* TABLE ROWS: Hourly slots */}
            <tbody className="divide-y divide-gray-200">
              {hoursToDisplay.map((hour24) => {
                const hourAmPm = formatHourAmPm(hour24); // e.g. "8:00 am" or "7:00 pm"
                const hour24TimeStr = `${String(hour24).padStart(2, '0')}:00`;
                const nextHour24TimeStr = `${String((hour24 + 1) % 24).padStart(2, '0')}:00`;

                return (
                  <tr key={hour24} className="hover:bg-gray-50/30 transition-colors">
                    
                    {/* FIRST COLUMN (Left): Formatted in 12-hour AM/PM (NO MILITARY HOURS!) */}
                    <td className="py-3 px-2.5 text-center text-xs font-mono font-bold text-[#141f5b] border-r border-gray-200 bg-gray-50/50 select-none align-top">
                      <div className="sticky top-14 py-1 px-1.5 rounded-md bg-white border border-gray-200 shadow-2xs">
                        {hourAmPm}
                      </div>
                    </td>

                    {/* Day Slot Cells */}
                    {weekDays.map((day) => {
                      const slotStartIso = localTimeToUtcIso(day.dateStr, hour24TimeStr, activeTimeZone);
                      const slotEndIso = localTimeToUtcIso(day.dateStr, nextHour24TimeStr, activeTimeZone);

                      // Calculate availability for active members
                      const availableMemberIds: string[] = [];
                      const unavailableMemberIds: string[] = [];

                      activeMembers.forEach((member) => {
                        const isAvail = isMemberAvailableAtSlot(member, slotStartIso, slotEndIso, useMeetingHours);
                        if (isAvail) {
                          availableMemberIds.push(member.id);
                        } else {
                          unavailableMemberIds.push(member.id);
                        }
                      });

                      const total = activeMembers.length;
                      const availableCount = availableMemberIds.length;
                      const unavailableCount = unavailableMemberIds.length;

                      // Exact matching states according to user rules:
                      // 1. All coincide: all available -> Verde
                      // 2. Only 1 does not coincide: unavailableCount === 1 -> Amarillo, non-coinciding member gets red border
                      // 3. Nobody coincides: availableCount === 0 -> Red border
                      // 4. Multiple do not coincide: partial yellow
                      const isAllCoincide = total > 0 && availableCount === total;
                      const isOnlyOneMissing = total > 1 && unavailableCount === 1;
                      const isNobodyCoincides = total > 0 && availableCount === 0;
                      const isPartial = !isAllCoincide && !isOnlyOneMissing && !isNobodyCoincides && availableCount > 0;

                      // Overlap slot payload for scheduling modal
                      const overlapSlot: OverlapSlot = {
                        isoUTC: slotStartIso,
                        localTime: hourAmPm,
                        localHour: hour24,
                        localMinute: 0,
                        availableMemberIds,
                        totalSelected: total,
                        percentage: total > 0 ? Math.round((availableCount / total) * 100) : 0,
                        isFullOverlap: isAllCoincide,
                        dateKey: day.dateStr
                      };

                      // Slot background styling matching user screenshot
                      let slotContainerStyle = 'bg-white border-gray-200';
                      if (isAllCoincide) {
                        slotContainerStyle = 'bg-emerald-50/80 border-2 border-emerald-400 shadow-2xs';
                      } else if (!isNobodyCoincides) {
                        // Partial overlap (e.g. 1 or 2 do not coincide) -> Soft yellow with gold border
                        slotContainerStyle = 'bg-[#FFFDF4] border-2 border-[#F4DF77] shadow-2xs';
                      } else {
                        slotContainerStyle = 'bg-gray-50/60 border border-gray-200/90';
                      }

                      return (
                        <td
                          key={day.dateStr}
                          className="p-1.5 border-r border-gray-200 last:border-r-0 align-top"
                        >
                          <div
                            className={`rounded-2xl p-2.5 transition-all flex flex-col justify-between gap-2.5 min-h-[140px] ${slotContainerStyle}`}
                          >
                            {/* Slot Top Header: Status label & counter badge */}
                            <div className="flex items-center justify-between gap-1 pb-1">
                              {isAllCoincide ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Coinciden todos</span>
                                  </span>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-semibold bg-white text-emerald-900 px-1.5 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                                      {availableCount}/{total}
                                    </span>
                                    <button
                                      onClick={() => onSelectSlotToSchedule(overlapSlot)}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#141f5b] hover:bg-[#1a2875] text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                                      title="Agendar reunión con todos los participantes en este horario"
                                    >
                                      <CalendarPlus className="w-3 h-3 text-[#acc917]" />
                                      <span>Agendar</span>
                                    </button>
                                  </div>
                                </>
                              ) : isNobodyCoincides ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                                    <span>{total} no coinciden</span>
                                  </span>
                                  <span className="text-[10px] font-mono font-medium bg-white text-gray-500 px-1.5 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                                    0/{total}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[11px] font-medium text-gray-800 truncate">
                                    {unavailableCount === 1 ? '1 no coincide' : `${unavailableCount} no coinciden`}
                                  </span>
                                  <span className="text-[10px] font-mono font-medium bg-white text-gray-700 px-1.5 py-0.5 rounded-md border border-gray-200/90 shadow-2xs">
                                    {availableCount}/{total}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Slot Members List: ONLY showing the members who ARE available! */}
                            <div className="space-y-1.5 flex-1 pt-0.5">
                              {availableCount > 0 ? (
                                activeMembers
                                  .filter((member) => availableMemberIds.includes(member.id))
                                  .map((member) => (
                                    <SlotMemberItem
                                      key={member.id}
                                      member={member}
                                    />
                                  ))
                              ) : (
                                <div className="h-full flex items-center justify-center p-2 text-center">
                                  <span className="text-[10px] text-gray-400 italic">
                                    Nadie disponible
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
