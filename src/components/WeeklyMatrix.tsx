import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Users, 
  SlidersHorizontal,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { Member, OverlapSlot } from '../types';
import { calculateWeeklyOverlapMatrix, formatInTimezone } from '../utils/timeEngine';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';

interface WeeklyMatrixProps {
  members: Member[];
  selectedMemberIds: string[];
  activeTimeZone: string;
  referenceDate: Date;
  onChangeReferenceDate: (newDate: Date) => void;
  onSelectSlotToSchedule: (slot: OverlapSlot) => void;
}

export const WeeklyMatrix: React.FC<WeeklyMatrixProps> = ({
  members,
  selectedMemberIds,
  activeTimeZone,
  referenceDate,
  onChangeReferenceDate,
  onSelectSlotToSchedule
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<OverlapSlot | null>(null);
  const [isDetailedView, setIsDetailedView] = useState(true);

  // Compute 7-day matrix data
  const matrixData = calculateWeeklyOverlapMatrix(
    members,
    selectedMemberIds,
    activeTimeZone,
    referenceDate,
    60
  );

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));

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
      {/* Header bar: Week selector, Density toggle, and ClickUp-style Legend */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        
        {/* Left: Week navigator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden shadow-2xs">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-gray-200/70 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#141f5b] hover:bg-[#1a2875] transition-colors cursor-pointer"
            >
              Semana Actual
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-gray-200/70 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-medium text-gray-600 font-mono">
            {matrixData.days[0].shortDate} — {matrixData.days[6].shortDate} <span className="text-gray-400">({activeTimeZone.split('/')[1] || activeTimeZone})</span>
          </span>
        </div>

        {/* Right: Legend with #acc917 and #141f5b accents + Density toggle */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#acc917] border border-[#96b10f] inline-block shadow-2xs" />
            <span className="text-gray-900 font-semibold">100% Coinciden Todos</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#acc917]/25 border border-[#acc917] inline-block" />
            <span className="text-gray-600">Parcial (≥ 50%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
            <span className="text-gray-400">Sin coincidencia</span>
          </div>

          {/* Toggle view density */}
          <button
            onClick={() => setIsDetailedView(!isDetailedView)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer ml-auto sm:ml-0"
            title="Alternar entre mostrar nombres completos con fotos o vista compacta"
          >
            <SlidersHorizontal className="w-3 h-3 text-gray-500" />
            <span>{isDetailedView ? 'Vista Detallada' : 'Vista Compacta'}</span>
          </button>
        </div>
      </div>

      {/* Main Weekly Overlap Matrix with ClickUp white layout and clear vertical lines */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            {/* Table Header: Day columns with vertical dividers */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="py-3 px-3 w-18 text-center text-[11px] font-mono font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-100/60">
                  Hora
                </th>
                {matrixData.days.map((day) => {
                  const isToday = day.dateStr === new Date().toISOString().substring(0, 10);
                  return (
                    <th 
                      key={day.dateStr}
                      className={`py-3 px-3 text-center border-r border-gray-200 last:border-r-0 transition-colors ${
                        isToday ? 'bg-blue-50/70 text-[#141f5b]' : 'text-gray-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{day.dayName}</div>
                      <div className="text-[11px] font-mono text-gray-500">{day.shortDate}</div>
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

            {/* Table Body: 24 hourly rows */}
            <tbody className="divide-y divide-gray-100">
              {matrixData.hours.map((hour) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <tr key={hour} className="hover:bg-gray-50/40 transition-colors group">
                    
                    {/* Sticky-like Left Hour Label */}
                    <td className="py-1 px-2 text-center text-xs font-mono text-gray-500 border-r border-gray-200 bg-gray-50/40 select-none group-hover:text-gray-900 font-medium">
                      {hourFormatted}
                    </td>

                    {/* Day Cells with explicit vertical borders and rich member avatars + first/last names */}
                    {matrixData.days.map((day) => {
                      const slotKey = `${day.dateStr}_${hour}`;
                      const slot = matrixData.slotsByDayAndHour.get(slotKey);
                      
                      const isFull = slot?.isFullOverlap;
                      const isPartial = !isFull && (slot?.percentage || 0) >= 50;
                      const hasSome = !isFull && !isPartial && (slot?.percentage || 0) > 0;

                      // Extract member objects for this matching slot
                      const matchingMembers = slot 
                        ? activeMembers.filter((m) => slot.availableMemberIds.includes(m.id))
                        : [];

                      return (
                        <td
                          key={day.dateStr}
                          className={`p-1 border-r border-gray-200 last:border-r-0 relative transition-all ${
                            isDetailedView ? 'min-h-[58px] h-14' : 'h-10'
                          }`}
                          onMouseEnter={() => slot && setHoveredSlot(slot)}
                          onMouseLeave={() => setHoveredSlot(null)}
                        >
                          {slot && (
                            <button
                              onClick={() => onSelectSlotToSchedule(slot)}
                              className={`w-full h-full rounded-lg flex flex-col justify-center p-1.5 text-xs transition-all cursor-pointer text-left select-none ${
                                isFull
                                  ? 'bg-[#acc917] hover:bg-[#b8d61f] text-[#141f5b] border border-[#96b10f] font-semibold shadow-xs'
                                  : isPartial
                                  ? 'bg-[#acc917]/15 hover:bg-[#acc917]/30 text-gray-800 border border-[#acc917]/60'
                                  : hasSome
                                  ? 'bg-gray-100/50 hover:bg-gray-100 text-gray-500 border border-transparent'
                                  : 'hover:bg-gray-50 text-transparent'
                              }`}
                              title={
                                isFull 
                                  ? `100% Coincidencia: ${matchingMembers.map(m => `${m.firstName} ${m.lastName}`).join(', ')}. Clic para agendar reunión.` 
                                  : `${slot.availableMemberIds.length}/${slot.totalSelected} miembros disponibles: ${matchingMembers.map(m => `${m.firstName} ${m.lastName}`).join(', ')}`
                              }
                            >
                              {matchingMembers.length > 0 ? (
                                <div className="w-full flex flex-col justify-between h-full">
                                  {/* Top row: Avatar cluster + status badge */}
                                  <div className="flex items-center justify-between gap-1 w-full">
                                    <div className="flex items-center -space-x-1.5 shrink-0 overflow-hidden">
                                      {matchingMembers.slice(0, 4).map((m) => (
                                        <div key={m.id} className="relative group/avatar">
                                          {m.avatarUrl ? (
                                            <img
                                              src={m.avatarUrl}
                                              alt={`${m.firstName} ${m.lastName}`}
                                              referrerPolicy="no-referrer"
                                              className={`w-5 h-5 rounded-full object-cover ring-1.5 transition-transform hover:scale-110 ${
                                                isFull ? 'ring-[#141f5b]' : 'ring-white'
                                              }`}
                                            />
                                          ) : (
                                            <div className="w-5 h-5 rounded-full bg-[#141f5b] text-white flex items-center justify-center text-[9px] font-bold ring-1.5 ring-white">
                                              {m.firstName[0]}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {matchingMembers.length > 4 && (
                                        <div className="w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center text-[9px] font-bold ring-1.5 ring-white">
                                          +{matchingMembers.length - 4}
                                        </div>
                                      )}
                                    </div>

                                    {/* Availability indicator */}
                                    <span className={`text-[10px] font-mono font-bold px-1 rounded ${
                                      isFull 
                                        ? 'bg-[#141f5b] text-white' 
                                        : 'bg-white/80 text-[#141f5b] border border-gray-200'
                                    }`}>
                                      {isFull ? '100%' : `${matchingMembers.length}/${slot.totalSelected}`}
                                    </span>
                                  </div>

                                  {/* Bottom row: Readable First and Last Names */}
                                  {isDetailedView && (
                                    <div className={`text-[10px] leading-tight truncate mt-1 ${
                                      isFull ? 'font-bold text-[#141f5b]' : 'font-medium text-gray-700'
                                    }`}>
                                      {matchingMembers.map((m) => `${m.firstName} ${m.lastName}`).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="opacity-0">-</span>
                              )}
                            </button>
                          )}
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

      {/* Floating or Docked Slot Inspector with ClickUp card styling */}
      {hoveredSlot && (
        <div className="bg-white border-2 border-[#141f5b] rounded-xl p-3.5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${hoveredSlot.isFullOverlap ? 'bg-[#acc917] text-[#141f5b]' : 'bg-gray-100 text-gray-700'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">
                  Franja {hoveredSlot.localTime} - {String(hoveredSlot.localHour + 1).padStart(2, '0')}:00
                </span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                  hoveredSlot.isFullOverlap ? 'bg-[#acc917] text-[#141f5b] border border-[#96b10f]' : 'bg-gray-100 text-gray-700'
                }`}>
                  {hoveredSlot.percentage}% disponibilidad ({hoveredSlot.availableMemberIds.length}/{hoveredSlot.totalSelected} miembros)
                </span>
              </div>
              <p className="text-gray-500 text-[11px] mt-0.5">
                UTC: {hoveredSlot.isoUTC.substring(11, 16)} • Haz clic en el bloque para agendar reunión con Google Calendar
              </p>
            </div>
          </div>

          {/* Member chips with photo image and full name */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {activeMembers.map((m) => {
              const isAvail = hoveredSlot.availableMemberIds.includes(m.id);
              const flag = COUNTRY_FLAG_MAP[m.country]?.flag || '🌐';
              return (
                <div
                  key={m.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-2 border shadow-2xs ${
                    isAvail
                      ? 'bg-[#acc917]/20 text-[#141f5b] border-[#acc917]'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}
                >
                  {m.avatarUrl ? (
                    <img 
                      src={m.avatarUrl} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-[10px] font-bold">
                      {m.firstName[0]}
                    </div>
                  )}
                  <span className="font-semibold">{m.firstName} {m.lastName}</span>
                  <span className="text-[11px]">{flag}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consolidated Optimal Overlap Windows */}
      {matrixData.fullOverlapWindows.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#acc917]" />
              Ventanas Óptimas de Traslape Semanal (100% Participantes)
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              Mitigación de fatiga y horarios estándar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matrixData.fullOverlapWindows.slice(0, 6).map((win) => (
              <div
                key={win.id}
                className="bg-gray-50/70 border border-gray-200 hover:border-[#141f5b] rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#141f5b]">
                      {win.dayName} ({win.dateStr.substring(5)})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#acc917] text-[#141f5b] font-bold border border-[#96b10f]">
                      {win.durationMinutes} min
                    </span>
                  </div>
                  
                  <div className="font-mono text-base font-extrabold text-gray-900 mt-1.5">
                    {win.startLocalFormatted} - {win.endLocalFormatted}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Hora local ({activeTimeZone.split('/')[1] || activeTimeZone})
                  </p>
                </div>

                {/* Button using #141f5b as requested */}
                <button
                  onClick={() => {
                    const [h] = win.startLocalFormatted.split(':').map(Number);
                    const slotKey = `${win.dateStr}_${h}`;
                    const slot = matrixData.slotsByDayAndHour.get(slotKey);
                    if (slot) onSelectSlotToSchedule(slot);
                  }}
                  className="w-full bg-[#141f5b] hover:bg-[#1a2875] text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Reunión</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
