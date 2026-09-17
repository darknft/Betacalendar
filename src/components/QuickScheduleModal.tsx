import React, { useState } from 'react';
import { X, Calendar, Download, Copy, Check, Clock, Users, ExternalLink } from 'lucide-react';
import { Member, OverlapSlot } from '../types';
import { downloadIcsFile, formatInTimezone, generateGoogleCalendarUrl } from '../utils/timeEngine';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: OverlapSlot | null;
  activeMembers: Member[];
  activeTimeZone: string;
}

export const QuickScheduleModal: React.FC<QuickScheduleModalProps> = ({
  isOpen,
  onClose,
  slot,
  activeMembers,
  activeTimeZone
}) => {
  const [copied, setCopied] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Sync de Coordinación de Equipo');
  const [durationHours, setDurationHours] = useState(1);

  if (!isOpen || !slot) return null;

  // Calculate start & end ISO strings
  const startIsoUtc = slot.isoUTC;
  const startDate = new Date(startIsoUtc);
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
  const endIsoUtc = endDate.toISOString();

  const attendeeEmails = activeMembers.map((m) => m.email);

  // Generate meeting summary text
  const generateMeetingSummary = () => {
    let summary = `📅 Reunión: ${meetingTitle}\n`;
    summary += `⏰ Fecha y Hora Local (${activeTimeZone.split('/')[1] || activeTimeZone}):\n`;
    summary += `   ${slot.dateKey} | ${slot.localTime} - ${String(slot.localHour + durationHours).padStart(2, '0')}:00\n`;
    summary += `🌐 Horario por Participante:\n`;
    activeMembers.forEach((m) => {
      const startLocal = formatInTimezone(startIsoUtc, m.timeZone, 'time');
      const endLocal = formatInTimezone(endIsoUtc, m.timeZone, 'time');
      const flag = COUNTRY_FLAG_MAP[m.country]?.flag || '🌐';
      summary += `   • ${flag} ${m.firstName} ${m.lastName} (${m.timeZone}): ${startLocal} - ${endLocal}\n`;
    });
    return summary;
  };

  const handleOpenGoogleCalendar = () => {
    const details = generateMeetingSummary();
    const url = generateGoogleCalendarUrl(meetingTitle, startIsoUtc, endIsoUtc, details, attendeeEmails);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    const details = generateMeetingSummary();
    downloadIcsFile(meetingTitle, startIsoUtc, endIsoUtc, details, attendeeEmails);
  };

  const handleCopySummary = () => {
    const summary = generateMeetingSummary();
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        id="schedule-modal-content"
        className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#acc917]/20 text-[#141f5b] border border-[#acc917]">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">
              Agendar Reunión en Franja de Traslape
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Meeting Title Input */}
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Título de la Sesión</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Time & Duration highlight card using #acc917 */}
          <div className="p-3.5 bg-[#acc917]/15 border border-[#acc917] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[#141f5b]">
              <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Horario Seleccionado ({activeTimeZone.split('/')[1] || activeTimeZone})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#acc917] text-[#141f5b] font-extrabold border border-[#96b10f]">
                100% Coincidencia
              </span>
            </div>

            <div className="text-lg font-mono font-extrabold text-[#141f5b]">
              {slot.dateKey} • {slot.localTime} - {String(slot.localHour + durationHours).padStart(2, '0')}:00
            </div>
            <p className="text-gray-600 text-[11px]">
              UTC Timestamp: {slot.isoUTC.substring(0, 19)}Z
            </p>
          </div>

          {/* Participant Breakdown with Avatar Photos and Full Names */}
          <div className="space-y-1.5">
            <span className="text-gray-600 font-bold text-[11px] uppercase tracking-wider block">
              Hora de la reunión para cada participante ({activeMembers.length}):
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              {activeMembers.map((m) => {
                const pStart = formatInTimezone(startIsoUtc, m.timeZone, 'time');
                const pEnd = formatInTimezone(endIsoUtc, m.timeZone, 'time');
                const flag = COUNTRY_FLAG_MAP[m.country]?.flag || '🌐';

                return (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-200/60 last:border-b-0">
                    <div className="flex items-center gap-2 truncate">
                      {m.avatarUrl ? (
                        <img 
                          src={m.avatarUrl} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover border border-gray-200" 
                        />
                      ) : (
                        <span>{flag}</span>
                      )}
                      <span className="font-bold text-gray-800 truncate">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="text-gray-400 text-[11px] font-mono">
                        ({m.timeZone.split('/')[1] || m.timeZone})
                      </span>
                    </div>

                    <div className="font-mono text-[#141f5b] font-bold shrink-0 ml-2">
                      {pStart} - {pEnd}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Action Buttons using #141f5b */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 border-t border-gray-100">
            <button
              onClick={handleOpenGoogleCalendar}
              className="w-full sm:flex-1 bg-[#141f5b] hover:bg-[#1a2875] text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Abrir Google Calendar</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            <button
              onClick={handleDownloadIcs}
              className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-2xs"
              title="Descargar archivo de calendario estándar .ics"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Descargar .ICS</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-2xs"
              title="Copiar texto resumen de horarios para chat"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
