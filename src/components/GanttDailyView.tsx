import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CalendarPlus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';
import { Member, OverlapSlot } from '../types';
import { 
  formatHourAmPm, 
  localTimeToUtcIso, 
  isMemberAvailableAtSlot 
} from '../utils/timeEngine';
import { SlotMemberItem } from './SlotMemberItem';

interface GanttDailyViewProps {
  members: Member[];
  selectedMemberIds: string[];
  activeTimeZone: string;
  referenceDate: Date;
  onChangeReferenceDate: (newDate: Date) => void;
  onSelectSlotToSchedule: (slot: OverlapSlot) => void;
}

export const GanttDailyView: React.FC<GanttDailyViewProps> = ({
  members,
  selectedMemberIds,
  activeTimeZone,
  referenceDate,
  onChangeReferenceDate,
  onSelectSlotToSchedule
}) => {
  // Hours mode: 'work' (8:00 am - 8:00 pm) or 'full' (24 hours)
  const [hoursMode, setHoursMode] = useState<'work' | 'full'>('work');
  // Meeting window rule: default to true (use designated meeting hours)
  const [useMeetingHours, setUseMeetingHours] = useState(true);

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));

  // Determine hours array dynamically based on members' meeting and work slots
  const hoursToDisplay = (() => {
    if (hoursMode === 'full') {
      return Array.from({ length: 24 }, (_, i) => i);
    }

    let minH = 8;
    let maxH = 20; // 8:00 pm default

    activeMembers.forEach((member) => {
      const slots = [
        ...(member.meetingSlots || []),
        ...(member.saturdaySlots || []),
        ...(member.sundaySlots || [])
      ];
      if (member.meetingStart && member.meetingEnd) {
        slots.push({ start: member.meetingStart, end: member.meetingEnd });
      }
      if (member.workStart && member.workEnd) {
        slots.push({ start: member.workStart, end: member.workEnd });
      }

      slots.forEach((s) => {
        if (s.start) {
          const startH = parseInt(s.start.split(':')[0], 10);
          if (!isNaN(startH) && startH < minH) minH = Math.max(0, startH);
        }
        if (s.end) {
          const parts = s.end.split(':');
          const endH = parseInt(parts[0], 10);
          const endM = parseInt(parts[1] || '0', 10);
          if (!isNaN(endH)) {
            let targetMaxH = endM > 0 ? endH : (endH > 0 ? endH - 1 : 23);
            if (targetMaxH > maxH) maxH = Math.min(23, targetMaxH);
          }
        }
      });
    });

    return Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);
  })();

  const startHourLabel = formatHourAmPm(hoursToDisplay[0] ?? 8);
  const endHourLabel = formatHourAmPm(hoursToDisplay[hoursToDisplay.length - 1] ?? 20);

  const dateStr = referenceDate.toISOString().substring(0, 10);

  // Formatted date title in Spanish (e.g. "Martes 15 de Septiembre")
  const formattedDayTitle = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(referenceDate);

  const capitalizedDayTitle = formattedDayTitle.charAt(0).toUpperCase() + formattedDayTitle.slice(1);

  // Navigation handlers
  const handlePrevDay = () => {
    const prev = new Date(referenceDate);
    prev.setDate(prev.getDate() - 1);
    onChangeReferenceDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 1);
    onChangeReferenceDate(next);
  };

  const handleToday = () => {
    onChangeReferenceDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Header bar: Day navigator, Time Range & Visual Legend */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Day Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-gray-200/70 text-gray-700 transition-colors cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#141f5b] hover:bg-[#1a2875] transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-gray-200/70 text-gray-700 transition-colors cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#141f5b]" />
            <span className="text-sm font-extrabold text-gray-900">
              {capitalizedDayTitle}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              ({activeTimeZone.split('/')[1] || activeTimeZone})
            </span>
          </div>
        </div>

        {/* Legend & Controls */}
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
              title={`Ver rango dinámico (${startHourLabel} - ${endHourLabel})`}
            >
              {startHourLabel} - {endHourLabel}
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

      {/* Main Daily Table as requested:
          "Para la vista día la tabla debe mostrar en la primera row LAs horas indicando si es am o pm y dentro de los slots debe mostrar de igual forma la imagen que te adjunto donde todos los mienbors aparecen con su imagen nombre y apellido y la bandera de su pais si todos coinciden el fondo debe verse verde y si solo uno no coincide debe ser color amarillo y el miembro que no coincida debe tener el borde rojo. Quiere decir que si solo uno no coincide el color debe ser amarillo si nadie coincide mostrar el borde rojo. Si todos estan disponibles debe permitir agendar tanto en semana como en día."
      */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            {/* FIRST ROW: The hours indicating AM or PM */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90">
                {hoursToDisplay.map((hour24) => {
                  const hourAmPm = formatHourAmPm(hour24); // e.g. "8:00 am", "1:00 pm", "7:00 pm"
                  return (
                    <th 
                      key={hour24}
                      className="py-3.5 px-3 text-center border-r border-gray-200 last:border-r-0 min-w-[200px]"
                    >
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-2xs">
                        <Clock className="w-3 h-3 text-[#141f5b]" />
                        <span className="text-xs font-mono font-extrabold text-[#141f5b]">
                          {hourAmPm}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* SECOND ROW: The slots under each hour */}
            <tbody>
              <tr>
                {hoursToDisplay.map((hour24) => {
                  const hourAmPm = formatHourAmPm(hour24);
                  const hour24TimeStr = `${String(hour24).padStart(2, '0')}:00`;

                  const slotStartIso = localTimeToUtcIso(dateStr, hour24TimeStr, activeTimeZone);
                  const slotEndIso = new Date(new Date(slotStartIso).getTime() + 60 * 60 * 1000).toISOString();

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

                  // Exact states:
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
                    dateKey: dateStr
                  };

                  // Slot background styling according to exact user rules:
                  // Green if ALL match, Yellow ONLY if exactly ONE person does NOT match, otherwise Grey/Neutral.
                  let slotContainerStyle = 'bg-gray-50/60 border border-gray-200/90';
                  if (isAllCoincide) {
                    slotContainerStyle = 'bg-emerald-50/80 border-2 border-emerald-400 shadow-2xs';
                  } else if (isOnlyOneMissing) {
                    slotContainerStyle = 'bg-[#FFFDF4] border-2 border-[#F4DF77] shadow-2xs';
                  }

                  return (
                    <td 
                      key={hour24}
                      className="p-2 border-r border-gray-200 last:border-r-0 align-top"
                    >
                      <div className={`rounded-2xl p-3 transition-all flex flex-col justify-between gap-2.5 min-h-[200px] ${slotContainerStyle}`}>
                        
                        {/* Slot Top Header: Status label & counter badge */}
                        <div className="flex items-center justify-between gap-1 pb-1">
                          {isAllCoincide ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Coinciden todos</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-mono font-semibold bg-white text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                                  {availableCount}/{total}
                                </span>
                                <button
                                  onClick={() => onSelectSlotToSchedule(overlapSlot)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141f5b] hover:bg-[#1a2875] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  title="Agendar reunión con todos los participantes en este horario"
                                >
                                  <CalendarPlus className="w-3.5 h-3.5 text-[#acc917]" />
                                  <span>Agendar</span>
                                </button>
                              </div>
                            </>
                          ) : isNobodyCoincides ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                                <span>{total} no coinciden</span>
                              </span>
                              <span className="text-[11px] font-mono font-medium bg-white text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                                0/{total}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-gray-800">
                                {unavailableCount === 1 ? '1 no coincide' : `${unavailableCount} no coinciden`}
                              </span>
                              <span className="text-[11px] font-mono font-medium bg-white text-gray-700 px-2 py-0.5 rounded-md border border-gray-200/90 shadow-2xs">
                                {availableCount}/{total}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Slot Members List: showing all available participants + missing member if 1 fails */}
                        <div className="space-y-1.5 flex-1 pt-0.5">
                          {availableCount > 0 ? (
                            <>
                              {activeMembers
                                .filter((member) => availableMemberIds.includes(member.id))
                                .map((member) => (
                                  <SlotMemberItem
                                    key={member.id}
                                    member={member}
                                    isAvailable={true}
                                  />
                                ))}
                              {isOnlyOneMissing && (
                                activeMembers
                                  .filter((member) => unavailableMemberIds.includes(member.id))
                                  .map((member) => (
                                    <SlotMemberItem
                                      key={member.id}
                                      member={member}
                                      isAvailable={false}
                                    />
                                  ))
                              )}
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center p-3 text-center">
                              <span className="text-[11px] text-gray-400 italic">
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
