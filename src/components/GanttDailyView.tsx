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

  // Determine hours array (no military hours!)
  const hoursToDisplay = (() => {
    if (hoursMode === 'work') {
      // 8:00 am to 8:00 pm
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8 to 20
    }
    // 24 hours
    return Array.from({ length: 24 }, (_, i) => i);
  })();

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

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-2xs" />
            <span className="text-amber-950 font-semibold">Amarillo: 1 No Coincide (Borde Rojo)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-50 border border-red-300 px-2.5 py-1 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-2xs" />
            <span className="text-red-950 font-semibold">Borde Rojo: Nadie Coincide</span>
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
                  const nextHour24TimeStr = `${String((hour24 + 1) % 24).padStart(2, '0')}:00`;

                  const slotStartIso = localTimeToUtcIso(dateStr, hour24TimeStr, activeTimeZone);
                  const slotEndIso = localTimeToUtcIso(dateStr, nextHour24TimeStr, activeTimeZone);

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

                  // Slot background styling
                  let slotContainerStyle = 'bg-white border-gray-200';
                  if (isAllCoincide) {
                    slotContainerStyle = 'bg-emerald-100/90 border-2 border-emerald-500 shadow-xs';
                  } else if (isOnlyOneMissing) {
                    slotContainerStyle = 'bg-amber-100/90 border-2 border-amber-400 shadow-xs';
                  } else if (isNobodyCoincides) {
                    slotContainerStyle = 'bg-red-50/60 border-2 border-red-400 shadow-xs';
                  } else if (isPartial) {
                    slotContainerStyle = 'bg-amber-50/70 border border-amber-300';
                  }

                  return (
                    <td 
                      key={hour24}
                      className="p-2 border-r border-gray-200 last:border-r-0 align-top"
                    >
                      <div className={`rounded-2xl p-3 transition-all flex flex-col justify-between gap-3 min-h-[220px] ${slotContainerStyle}`}>
                        
                        {/* Slot Top Header: Status label & Agendar button when all coincide */}
                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-black/5">
                          {isAllCoincide ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-900">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Coinciden Todos</span>
                              </span>

                              {/* Allow scheduling when all coincide */}
                              <button
                                onClick={() => onSelectSlotToSchedule(overlapSlot)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141f5b] hover:bg-[#1a2875] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Agendar reunión con todos los participantes en este horario"
                              >
                                <CalendarPlus className="w-3.5 h-3.5 text-[#acc917]" />
                                <span>Agendar</span>
                              </button>
                            </>
                          ) : isOnlyOneMissing ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-950">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>1 No Coincide</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-white/90 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                {availableCount}/{total}
                              </span>
                            </>
                          ) : isNobodyCoincides ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-red-900">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                <span>Nadie Coincide</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-300">
                                0/{total}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700">
                                <span>{unavailableCount} no coinciden</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-white/80 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                                {availableCount}/{total}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Slot Members List matching image.png */}
                        <div className="space-y-1.5 flex-1">
                          {activeMembers.map((member) => {
                            const isAvail = availableMemberIds.includes(member.id);
                            return (
                              <SlotMemberItem
                                key={member.id}
                                member={member}
                                isAvailable={isAvail}
                              />
                            );
                          })}
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
