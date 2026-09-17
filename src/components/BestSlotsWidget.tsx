import React, { useState } from 'react';
import { Sparkles, Calendar, Download, Clock, Check, Users, ExternalLink } from 'lucide-react';
import { Member, OverlapSlot } from '../types';
import { calculateWeeklyOverlapMatrix, downloadIcsFile, formatInTimezone, generateGoogleCalendarUrl } from '../utils/timeEngine';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';

interface BestSlotsWidgetProps {
  members: Member[];
  selectedMemberIds: string[];
  activeTimeZone: string;
  onOpenScheduleModal: (slot: OverlapSlot) => void;
}

export const BestSlotsWidget: React.FC<BestSlotsWidgetProps> = ({
  members,
  selectedMemberIds,
  activeTimeZone,
  onOpenScheduleModal
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const matrix = calculateWeeklyOverlapMatrix(
    members,
    selectedMemberIds,
    activeTimeZone,
    new Date(),
    60
  );

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));
  const bestWindows = matrix.fullOverlapWindows.slice(0, 3);

  const handleQuickGCal = (startIsoUtc: string, endIsoUtc: string) => {
    const title = 'Team Sync: Sincronización de Equipo';
    const attendeeEmails = activeMembers.map((m) => m.email);
    const details = `Reunión coordinada mediante TimeSync.\n\nParticipantes y sus husos horarios:\n` +
      activeMembers.map((m) => `- ${m.firstName} ${m.lastName} (${m.timeZone}): ${formatInTimezone(startIsoUtc, m.timeZone, 'time')} - ${formatInTimezone(endIsoUtc, m.timeZone, 'time')}`).join('\n');
    
    const url = generateGoogleCalendarUrl(title, startIsoUtc, endIsoUtc, details, attendeeEmails);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleQuickIcs = (startIsoUtc: string, endIsoUtc: string) => {
    const title = 'Team Sync - Sincronizacion de Equipo';
    const attendeeEmails = activeMembers.map((m) => m.email);
    const details = `Reunión coordinada con TimeSync.\nHorario UTC: ${startIsoUtc} a ${endIsoUtc}`;
    downloadIcsFile(title, startIsoUtc, endIsoUtc, details, attendeeEmails);
  };

  const handleRunAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      if (bestWindows.length === 0) {
        setAiAnalysis(
          `No se detectaron franjas de coincidencia del 100% entre los ${activeMembers.length} participantes seleccionados en esta semana. Se sugiere deseleccionar miembros con husos opuestos (ej. Tokio UTC+9 con San Francisco UTC-7) o habilitar franjas asíncronas de traspaso de guardia.`
        );
      } else {
        const top = bestWindows[0];
        setAiAnalysis(
          `Análisis de Fatiga Horaria: La mejor ventana es el ${top.dayName} a las ${top.startLocalFormatted} - ${top.endLocalFormatted} (${activeTimeZone.split('/')[1]}). En este intervalo, todos los participantes se encuentran dentro de su franja laboral estándar sin sobrecargar horas nocturnas ni madrugadas extremas.`
        );
      }
      setIsAnalyzing(false);
    }, 600);
  };

  if (activeMembers.length < 2) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#acc917]/20 text-[#141f5b] border border-[#acc917]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Recomendación Inteligente de Traslape
            </h3>
            <p className="text-xs text-gray-500">
              Mejores espacios para reunir a los {activeMembers.length} colaboradores activos
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors font-semibold self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <Sparkles className={`w-3.5 h-3.5 text-[#141f5b] ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Evaluando...' : 'Diagnóstico de Fatiga'}</span>
        </button>
      </div>

      {/* AI Narrative Banner */}
      {aiAnalysis && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-gray-700 flex items-start gap-2.5 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-[#141f5b] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#141f5b]">Optimización de Sincronización:</span>
            <p>{aiAnalysis}</p>
          </div>
        </div>
      )}

      {/* Top 3 Window Cards */}
      {bestWindows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bestWindows.map((win, idx) => (
            <div
              key={win.id}
              className="bg-gray-50/50 border border-gray-200 hover:border-[#141f5b] rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#141f5b] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#acc917]" />
                    Opción #{idx + 1} ({win.dayName})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#acc917] text-[#141f5b] font-bold border border-[#96b10f]">
                    {win.durationMinutes} min
                  </span>
                </div>

                <div className="font-mono text-base font-extrabold text-gray-900 mt-1.5">
                  {win.startLocalFormatted} - {win.endLocalFormatted}
                </div>
                <div className="text-[11px] text-gray-500">
                  Hora local ({activeTimeZone.split('/')[1] || activeTimeZone})
                </div>

                {/* Micro breakdowns of attendee local times */}
                <div className="mt-2.5 pt-2 border-t border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">
                    Hora para cada colaborador:
                  </span>
                  <div className="space-y-1">
                    {activeMembers.slice(0, 5).map((m) => {
                      const mTime = formatInTimezone(win.startUTC, m.timeZone, 'time');
                      const flag = COUNTRY_FLAG_MAP[m.country]?.flag || '🌐';
                      return (
                        <div key={m.id} className="flex items-center justify-between text-xs font-mono text-gray-700">
                          <span className="truncate flex items-center gap-1.5">
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <span>{flag}</span>
                            )}
                            <span className="text-xs font-medium">{m.firstName} {m.lastName}</span>
                          </span>
                          <span className="text-[#141f5b] font-semibold">{mTime}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons: GCal + ICS using #141f5b */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleQuickGCal(win.startUTC, win.endUTC)}
                  className="bg-[#141f5b] hover:bg-[#1a2875] text-white py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                  title="Abrir Google Calendar con enlace directo"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Google Cal</span>
                </button>

                <button
                  onClick={() => handleQuickIcs(win.startUTC, win.endUTC)}
                  className="bg-white hover:bg-gray-50 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-gray-200 shadow-2xs cursor-pointer"
                  title="Descargar archivo iCalendar (.ics)"
                >
                  <Download className="w-3.5 h-3.5 text-gray-500" />
                  <span>.ICS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-gray-500">
          No hay una franja de coincidencia del 100% con todos los participantes seleccionados.
          <p className="text-[11px] text-[#141f5b] font-medium mt-1">
            Intenta deseleccionar temporalmente un colaborador con zona horaria opuesta o revisa la Matriz Semanal para coincidencias parciales.
          </p>
        </div>
      )}
    </div>
  );
};
