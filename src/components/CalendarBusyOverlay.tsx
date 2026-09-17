import React, { useState } from 'react';
import { X, Calendar, Plus, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Member, TimeSlot } from '../types';
import { formatInTimezone, localTimeToUtcIso } from '../utils/timeEngine';
import { sanitizeString } from '../utils/security';

interface CalendarBusyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onUpdateBusySlots: (memberId: string, updatedSlots: TimeSlot[]) => void;
  activeTimeZone: string;
}

export const CalendarBusyOverlay: React.FC<CalendarBusyOverlayProps> = ({
  isOpen,
  onClose,
  member,
  onUpdateBusySlots,
  activeTimeZone
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().substring(0, 10));
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const handleAddBusySlot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = sanitizeString(newTitle) || 'Bloqueo de Agenda';
    
    // Convert local start & end in member timezone to UTC
    const startUtc = localTimeToUtcIso(newDate, newStartTime, member.timeZone);
    const endUtc = localTimeToUtcIso(newDate, newEndTime, member.timeZone);

    if (new Date(startUtc).getTime() >= new Date(endUtc).getTime()) {
      setError('La hora de inicio del bloqueo debe ser anterior a la hora de fin.');
      return;
    }

    const newSlot: TimeSlot = {
      start: startUtc,
      end: endUtc,
      title: cleanTitle,
      source: 'manual'
    };

    const updated = [...(member.busySlots || []), newSlot];
    onUpdateBusySlots(member.id, updated);
    setNewTitle('');
  };

  const handleRemoveSlot = (index: number) => {
    const updated = (member.busySlots || []).filter((_, idx) => idx !== index);
    onUpdateBusySlots(member.id, updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        id="busy-overlay-modal"
        className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Bloqueos de Agenda: {member.firstName} {member.lastName}
              </h3>
              <p className="text-[11px] text-gray-500">Eventos privados que bloquean coincidencia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Simulador de Bloqueo de Horas:</span>
              <p className="text-gray-600 mt-0.5 text-[11px]">
                Cualquier evento o reunión en esta lista bloquea automáticamente la disponibilidad de {member.firstName}, recalculando el traslape en tiempo real.
              </p>
            </div>
          </div>

          {/* Form to Add Slot */}
          <form onSubmit={handleAddBusySlot} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
            <span className="font-bold text-gray-900 block">Añadir Nuevo Bloqueo / Reunión</span>
            
            {error && (
              <p className="text-red-600 font-medium">{error}</p>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-1">Título del Evento</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Sincronización con cliente o Cita médica"
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Inicio (HH:mm)</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Fin (HH:mm)</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#141f5b] hover:bg-[#1a2875] text-white py-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Bloqueo de Horas</span>
            </button>
          </form>

          {/* List of Existing Busy Slots */}
          <div className="space-y-1.5">
            <span className="font-bold text-gray-600 uppercase tracking-wider block text-[11px]">
              Bloqueos Actuales ({member.busySlots?.length || 0}):
            </span>

            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {member.busySlots && member.busySlots.length > 0 ? (
                member.busySlots.map((slot, idx) => {
                  const startLocal = formatInTimezone(slot.start, activeTimeZone, 'time');
                  const endLocal = formatInTimezone(slot.end, activeTimeZone, 'time');
                  const dateLocal = formatInTimezone(slot.start, activeTimeZone, 'shortDate');

                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {slot.title || 'Bloqueo de horario'}
                        </div>
                        <div className="text-gray-500 text-[11px] font-mono">
                          {dateLocal} • {startLocal} - {endLocal} ({activeTimeZone.split('/')[1] || activeTimeZone})
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveSlot(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 cursor-pointer"
                        title="Eliminar bloqueo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                  No hay bloqueos de agenda registrados para este colaborador.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
