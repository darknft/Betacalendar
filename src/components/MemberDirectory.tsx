import React, { useState } from 'react';
import { 
  User, 
  Clock, 
  MapPin, 
  Edit3, 
  Plus, 
  CheckSquare, 
  Square, 
  Briefcase, 
  Calendar,
  AlertCircle,
  Trash2,
  Shield
} from 'lucide-react';
import { Member } from '../types';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { formatInTimezone, localTimeToUtcIso, getMemberMeetingSlots, formatTime24to12 } from '../utils/timeEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface MemberDirectoryProps {
  members: Member[];
  selectedMemberIds: string[];
  onToggleMember: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  currentUser: Member;
  activeTimeZone: string;
  onEditMember: (member: Member) => void;
  onAddNewMember: () => void;
  onOpenManageBusy: (member: Member) => void;
  onDeleteMembers: (memberIds: string[]) => void;
}

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({
  members,
  selectedMemberIds,
  onToggleMember,
  onSelectAll,
  onDeselectAll,
  currentUser,
  activeTimeZone,
  onEditMember,
  onAddNewMember,
  onOpenManageBusy,
  onDeleteMembers
}) => {
  const isAdmin = currentUser.role === 'admin';
  const todayStr = new Date().toISOString().substring(0, 10);
  const [membersPendingDelete, setMembersPendingDelete] = useState<Member[]>([]);

  // Calculate selected non-admin members (Admin can NEVER be deleted)
  const selectedNonAdmins = members.filter(
    (m) => selectedMemberIds.includes(m.id) && m.role !== 'admin'
  );

  // Determine current active status for each member
  const getMemberStatus = (member: Member) => {
    const nowUtc = new Date().toISOString();
    
    // Check if in busy slot
    const isBusy = member.busySlots?.some((s) => {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      const now = Date.now();
      return now >= start && now <= end;
    });

    if (isBusy) {
      return { label: 'En Reunión', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    }

    // Check if within work hours
    const memberLocalTime = formatInTimezone(nowUtc, member.timeZone, 'time');
    const [h, m] = memberLocalTime.split(':').map(Number);
    const currentMins = h * 60 + m;

    const [startH, startM] = member.workStart.split(':').map(Number);
    const [endH, endM] = member.workEnd.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    const isWorking = startMins < endMins 
      ? currentMins >= startMins && currentMins <= endMins
      : currentMins >= startMins || currentMins <= endMins;

    if (isWorking) {
      return { label: 'Jornada Activa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    }

    return { label: 'Fuera de Horario', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' };
  };

  // Convert member's workStart & workEnd into the active user's local timezone
  const getConvertedLocalHours = (member: Member) => {
    const workStartUtc = localTimeToUtcIso(todayStr, member.workStart, member.timeZone);
    const workEndUtc = localTimeToUtcIso(todayStr, member.workEnd, member.timeZone);

    const startLocal = formatInTimezone(workStartUtc, activeTimeZone, 'time');
    const endLocal = formatInTimezone(workEndUtc, activeTimeZone, 'time');

    const userDateStart = formatInTimezone(workStartUtc, activeTimeZone, 'shortDate');
    const memberDateStart = formatInTimezone(workStartUtc, member.timeZone, 'shortDate');
    const dayShiftNote = userDateStart !== memberDateStart ? ` (${userDateStart})` : '';

    return {
      formatted: `${startLocal} - ${endLocal}${dayShiftNote}`,
      startLocal,
      endLocal
    };
  };

  return (
    <div className="space-y-4">
      {/* Controls and Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Participantes para el cálculo:
            </span>
            <span className="bg-gray-100 text-[#141f5b] border border-gray-200 text-xs font-mono px-2 py-0.5 rounded-md font-bold">
              {selectedMemberIds.length} de {members.length} activos
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <button 
              onClick={onSelectAll}
              className="text-[#141f5b] font-semibold hover:underline cursor-pointer"
            >
              Seleccionar todos
            </button>
            <span className="text-gray-300">•</span>
            <button 
              onClick={onDeselectAll}
              className="text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action button named strictly "Borrar" allowing selection of chosen members */}
          <button
            id="delete-selected-members-btn"
            onClick={() => {
              if (selectedNonAdmins.length > 0) {
                setMembersPendingDelete(selectedNonAdmins);
              }
            }}
            disabled={selectedNonAdmins.length === 0}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-2xs ${
              selectedNonAdmins.length > 0
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
            }`}
            title={
              selectedNonAdmins.length > 0
                ? `Borrar ${selectedNonAdmins.length} colaborador(es) seleccionado(s)`
                : 'Selecciona los colaboradores que desees borrar (el Admin está protegido)'
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar</span>
            {selectedNonAdmins.length > 0 && (
              <span className="bg-white/25 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {selectedNonAdmins.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              id="add-member-btn"
              onClick={onAddNewMember}
              className="flex items-center gap-1.5 bg-[#141f5b] hover:bg-[#1a2875] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Colaborador</span>
            </button>
          )}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const isSelected = selectedMemberIds.includes(member.id);
          const status = getMemberStatus(member);
          const localConverted = getConvertedLocalHours(member);
          const countryInfo = COUNTRY_FLAG_MAP[member.country] || { name: member.country, flag: '🌐' };
          const canEditThisMember = isAdmin || currentUser.id === member.id;

          return (
            <div
              key={member.id}
              id={`member-card-${member.id}`}
              className={`relative bg-white rounded-xl border transition-all duration-150 shadow-xs ${
                isSelected
                  ? 'border-[#141f5b] ring-1 ring-[#141f5b]/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Card Header with Checkbox and Status */}
              <div className="p-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleMember(member.id)}
                    className="text-gray-400 hover:text-[#141f5b] cursor-pointer shrink-0 transition-colors"
                    title={isSelected ? "Excluir del cálculo" : "Incluir en el cálculo"}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#141f5b]" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300" />
                    )}
                  </button>

                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#141f5b] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="font-bold text-sm text-gray-900 truncate">
                        {member.firstName} {member.lastName}
                      </h3>
                      <span title={countryInfo.name} className="text-base cursor-default">
                        {countryInfo.flag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-mono">{member.email}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>

                  {member.role === 'admin' ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 shadow-2xs">
                      <Shield className="w-3 h-3 text-purple-600" />
                      Admin (Protegido)
                    </span>
                  ) : (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      member.type === 'INTERNAL'
                        ? 'bg-blue-50 text-[#141f5b] border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {member.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Timezone & Shift Details */}
              <div className="p-4 space-y-2.5 text-xs">
                
                {/* 1. Native Schedule */}
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      Horario Nativo ({member.timeZone.split('/')[1] || member.timeZone})
                    </span>
                    <span className="font-mono text-[11px] text-[#141f5b] font-semibold">
                      {formatInTimezone(new Date().toISOString(), member.timeZone, 'time')} actual
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm text-gray-900 font-bold">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{member.workStart} - {member.workEnd}</span>
                  </div>
                </div>

                {/* 2. Projected to Active User's Local Time */}
                <div className="bg-blue-50/50 rounded-lg p-2.5 border border-blue-100 space-y-1">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#141f5b]">
                      Jornada en tu Zona ({activeTimeZone.split('/')[1] || activeTimeZone})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm text-[#141f5b] font-extrabold">
                    <span>{localConverted.formatted}</span>
                  </div>
                </div>

                {/* 3. Meeting Hours Destined */}
                <div className="bg-[#acc917]/15 rounded-lg p-2.5 border border-[#acc917]/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#141f5b] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#acc917]" />
                      Horas Libres para Reunión
                    </span>
                    <span className="text-[9px] font-bold text-[#141f5b] bg-white px-1.5 py-0.5 rounded border border-[#acc917]/50">
                      {getMemberMeetingSlots(member).length} {getMemberMeetingSlots(member).length === 1 ? 'franja' : 'franjas'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {getMemberMeetingSlots(member).map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#141f5b] font-bold border border-[#acc917] shadow-2xs"
                      >
                        {formatTime24to12(s.start)} - {formatTime24to12(s.end)}
                      </span>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-600">
                    Ventana preferida para coordinar llamadas y sesiones síncronas.
                  </p>
                </div>

                {/* Credentials display for Admin or Self */}
                {(isAdmin || currentUser.id === member.id) && (
                  <div className="bg-gray-100/80 rounded-lg p-2 border border-gray-200 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className="font-semibold text-gray-700">Clave de Acceso:</span>
                      <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-900 font-bold">
                        {member.password || 'password123'}
                      </code>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {member.role === 'admin' ? 'Admin' : 'Miembro'}
                    </span>
                  </div>
                )}

                {/* Busy Slots Count */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {member.busySlots?.length || 0} bloqueos de agenda
                  </span>
                  
                  <button
                    onClick={() => onOpenManageBusy(member)}
                    className="text-[#141f5b] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Ver eventos ocupados
                  </button>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-2.5 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between rounded-b-xl">
                <span className="text-[10px] font-mono text-gray-400">
                  ID: {member.id.substring(0, 8)}...
                </span>

                {canEditThisMember ? (
                  <div className="flex items-center gap-1.5">
                    {member.role !== 'admin' ? (
                      <button
                        onClick={() => setMembersPendingDelete([member])}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer shadow-2xs"
                        title={`Eliminar a ${member.firstName} ${member.lastName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span 
                        className="text-[10px] text-purple-700 bg-purple-50 px-2 py-1 rounded font-bold border border-purple-200 cursor-default"
                        title="El administrador no puede ser eliminado"
                      >
                        Admin protegido
                      </span>
                    )}
                    <button
                      onClick={() => onEditMember(member)}
                      className="flex items-center gap-1.5 text-xs text-[#141f5b] hover:text-[#1a2875] font-bold py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-blue-200 bg-white shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#141f5b]" />
                      <span>Editar Perfil</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic flex items-center gap-1">
                    Solo lectura (RLS)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-app Confirmation Modal for safe deletion in iframe / browser */}
      <ConfirmDeleteModal
        isOpen={membersPendingDelete.length > 0}
        onClose={() => setMembersPendingDelete([])}
        onConfirm={() => {
          const ids = membersPendingDelete.map((m) => m.id);
          setMembersPendingDelete([]);
          onDeleteMembers(ids);
        }}
        membersToDelete={membersPendingDelete}
      />
    </div>
  );
};
