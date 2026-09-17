import React, { useState, useEffect } from 'react';
import { X, Save, Shield, AlertCircle, Clock, MapPin, Mail, User, Plus, Trash2 } from 'lucide-react';
import { Member, MemberType, MeetingSlot } from '../types';
import { COMMON_TIMEZONES, COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { isValid24HourTime, isValidIanaTimeZone, sanitizeString, verifyRLSPermission } from '../utils/security';
import { formatTime24to12 } from '../utils/timeEngine';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  memberToEdit?: Member | null;
  currentUser: Member;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
  currentUser
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [type, setType] = useState<MemberType>('INTERNAL');
  const [country, setCountry] = useState('SV');
  const [timeZone, setTimeZone] = useState('America/El_Salvador');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([
    { start: '09:00', end: '12:00' }
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberToEdit) {
      setFirstName(memberToEdit.firstName);
      setLastName(memberToEdit.lastName);
      setEmail(memberToEdit.email);
      setPassword(memberToEdit.password || 'password123');
      setRole(memberToEdit.role || 'member');
      setType(memberToEdit.type);
      setCountry(memberToEdit.country);
      setTimeZone(memberToEdit.timeZone);
      setWorkStart(memberToEdit.workStart);
      setWorkEnd(memberToEdit.workEnd);
      
      if (memberToEdit.meetingSlots && memberToEdit.meetingSlots.length > 0) {
        setMeetingSlots(memberToEdit.meetingSlots);
      } else if (memberToEdit.meetingStart && memberToEdit.meetingEnd) {
        setMeetingSlots([{ start: memberToEdit.meetingStart, end: memberToEdit.meetingEnd }]);
      } else {
        setMeetingSlots([{ start: '09:00', end: '12:00' }]);
      }
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('password123');
      setRole('member');
      setType('INTERNAL');
      setCountry('SV');
      setTimeZone('America/El_Salvador');
      setWorkStart('08:00');
      setWorkEnd('17:00');
      setMeetingSlots([{ start: '09:00', end: '12:00' }]);
    }
    setError(null);
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!memberToEdit;
  const isSelf = currentUser?.id === memberToEdit?.id;
  const isAdmin = currentUser?.role === 'admin';
  const targetId = memberToEdit?.id || 'new-user';
  const rlsCheck = verifyRLSPermission(currentUser, targetId, isEditing ? 'UPDATE_PROFILE' : 'ADMIN_TOOLING');

  const handleUpdateSlot = (index: number, field: 'start' | 'end', val: string) => {
    setMeetingSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleRemoveSlot = (index: number) => {
    if (meetingSlots.length <= 1) {
      setError('Debes mantener al menos una franja o rango disponible para reuniones.');
      return;
    }
    setMeetingSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSlot = (start: string = '17:00', end: string = '19:00') => {
    setMeetingSlots((prev) => [...prev, { start, end }]);
  };

  const handleAddQuickPreset = (start: string, end: string) => {
    const exists = meetingSlots.some((s) => s.start === start && s.end === end);
    if (!exists) {
      setMeetingSlots((prev) => [...prev, { start, end }]);
    }
  };

  const handleAddSingleHour = (hour24: number) => {
    const startStr = `${String(hour24).padStart(2, '0')}:00`;
    const nextH = (hour24 + 1) % 24;
    const endStr = `${String(nextH).padStart(2, '0')}:00`;
    handleAddQuickPreset(startStr, endStr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verify permission: allowed if admin or updating self
    if (!isAdmin && !isSelf && isEditing) {
      setError(`Solo los Administradores o el propio usuario pueden modificar este perfil.`);
      return;
    }

    // Strict input sanitization (DevSec)
    const cleanFirstName = sanitizeString(firstName);
    const cleanLastName = sanitizeString(lastName);
    const cleanEmail = sanitizeString(email);

    if (!cleanFirstName || !cleanLastName || !cleanEmail) {
      setError('Todos los campos marcados como requeridos deben ser completados con caracteres válidos.');
      return;
    }

    if (!isValid24HourTime(workStart) || !isValid24HourTime(workEnd)) {
      setError('El horario laboral debe respetar el formato de 24 horas HH:mm (ej. 08:00, 17:00).');
      return;
    }

    if (meetingSlots.length === 0) {
      setError('Debes configurar al menos una hora o franja disponible para reunión.');
      return;
    }

    for (let i = 0; i < meetingSlots.length; i++) {
      const s = meetingSlots[i];
      if (!isValid24HourTime(s.start) || !isValid24HourTime(s.end)) {
        setError(`El slot ${i + 1} (${s.start} - ${s.end}) debe tener formato de 24 horas HH:mm (ej. 08:00, 17:00).`);
        return;
      }
    }

    if (!isValidIanaTimeZone(timeZone)) {
      setError('La zona horaria debe ser un identificador IANA canónico válido.');
      return;
    }

    const updatedMember: Member = {
      id: memberToEdit ? memberToEdit.id : `usr_${Date.now()}`,
      auth_id: memberToEdit ? memberToEdit.auth_id : `auth_${Date.now()}`,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      password: password.trim() || 'password123',
      teamSpaceId: memberToEdit?.teamSpaceId || 'space_core_engineering',
      type,
      country,
      timeZone,
      workStart,
      workEnd,
      meetingStart: meetingSlots[0]?.start || '09:00',
      meetingEnd: meetingSlots[0]?.end || '12:00',
      meetingSlots,
      role: isAdmin ? role : (memberToEdit?.role || 'member'),
      avatarUrl: memberToEdit?.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      busySlots: memberToEdit?.busySlots || [],
      availableSlots: memberToEdit?.availableSlots || []
    };

    onSave(updatedMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div 
        id="member-form-modal"
        className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 my-auto"
      >
        {/* Header - Stays sticky at top */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#141f5b] flex items-center justify-center text-[#acc917]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {isEditing ? 'Editar Perfil y Horario' : 'Registrar Nuevo Colaborador'}
              </h3>
              <p className="text-[11px] text-gray-500">Configura jornada nativa y huso horario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form with scrollable body and fixed sticky action footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs pr-3">
            {/* RLS Warning / Security Banner */}
            {!rlsCheck.allowed && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aviso de Privacidad (Supabase RLS):</span>
                  <p className="text-[11px]">{rlsCheck.reason}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
                placeholder="Carlos"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
                placeholder="Méndez"
              />
            </div>
          </div>

          {/* Email and Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
                placeholder="carlos.mendez@empresa.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Clave de Acceso (Contraseña)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
                placeholder="password123"
              />
              <span className="text-[10px] text-gray-400">Credencial para inicio de sesión</span>
            </div>
          </div>

          {/* Role selector for Admin */}
          {isAdmin && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Rol de Acceso en Plataforma</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
              >
                <option value="member">Colaborador / Miembro (Member)</option>
                <option value="admin">Administrador (Admin - puede crear credenciales)</option>
              </select>
            </div>
          )}

          {/* Type and Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Tipo de Miembro</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MemberType)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
              >
                <option value="INTERNAL">INTERNAL (Equipo Interno)</option>
                <option value="EXTERNAL">EXTERNAL (Consultor Externo)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">País (Código ISO)</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
              >
                {Object.entries(COUNTRY_FLAG_MAP).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {code} - {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TimeZone IANA */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Zona Horaria (IANA)</label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Work Hours: Start and End */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Inicio de Jornada (HH:mm)</label>
              <input
                type="text"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                maxLength={5}
                pattern="^(?:[01]\d|2[0-3]):[0-5]\d$"
                required
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20"
                placeholder="08:00"
              />
              <span className="text-[10px] text-gray-400">Formato 24h</span>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Fin de Jornada (HH:mm)</label>
              <input
                type="text"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                maxLength={5}
                pattern="^(?:[01]\d|2[0-3]):[0-5]\d$"
                required
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20"
                placeholder="17:00"
              />
              <span className="text-[10px] text-gray-400">Formato 24h</span>
            </div>
          </div>

          {/* Meeting Hours: Múltiples Slots y Horas Libres Destinadas para Reunión */}
          <div className="bg-[#acc917]/15 p-3.5 rounded-xl border border-[#acc917]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#141f5b]" />
                <span className="font-bold text-[#141f5b] text-xs">
                  Horas Libres Destinadas para Reunión (Slots Disponibles)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#141f5b] font-bold border border-[#acc917] shadow-2xs">
                {meetingSlots.length} {meetingSlots.length === 1 ? 'Franja' : 'Franjas'}
              </span>
            </div>

            <p className="text-[11px] text-gray-600 leading-snug">
              Puedes configurar tus franjas por rango (ej. 5:00 pm a 10:00 pm) o agregar horas sueltas independientes (ej. 8:00 am).
            </p>

            {/* List of configured slots */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {meetingSlots.map((slot, index) => (
                <div 
                  key={index}
                  className="bg-white p-2.5 rounded-lg border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#141f5b] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div className="font-bold text-xs text-[#141f5b] flex items-center gap-1 truncate">
                      <span>{formatTime24to12(slot.start) || slot.start}</span>
                      <span className="text-gray-400 font-normal">→</span>
                      <span>{formatTime24to12(slot.end) || slot.end}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={slot.start}
                        onChange={(e) => handleUpdateSlot(index, 'start', e.target.value)}
                        maxLength={5}
                        placeholder="08:00"
                        className="w-16 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-gray-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#141f5b]"
                        title="Hora inicio (HH:mm)"
                      />
                      <span className="text-gray-400 text-xs font-mono">-</span>
                      <input
                        type="text"
                        value={slot.end}
                        onChange={(e) => handleUpdateSlot(index, 'end', e.target.value)}
                        maxLength={5}
                        placeholder="09:00"
                        className="w-16 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-gray-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#141f5b]"
                        title="Hora fin (HH:mm)"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Eliminar esta franja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Button to add another custom range */}
            <div className="flex items-center justify-between pt-1 border-t border-[#acc917]/30">
              <button
                type="button"
                onClick={() => handleAddSlot('17:00', '19:00')}
                className="flex items-center gap-1 text-xs font-bold text-[#141f5b] hover:text-[#1a2875] bg-white px-2.5 py-1.5 rounded-lg border border-[#acc917] hover:bg-lime-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar otra Franja / Rango</span>
              </button>
            </div>

            {/* Quick hour presets & single-hour quick buttons */}
            <div className="pt-2 border-t border-[#acc917]/20 space-y-1.5">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                Atajos rápidos para agregar horas o rangos comunes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddQuickPreset('08:00', '09:00')}
                  className="text-[11px] font-semibold bg-white hover:bg-gray-50 text-[#141f5b] px-2 py-1 rounded border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  title="Agregar 8:00 am (1 hora)"
                >
                  + 8:00 am (1h)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickPreset('07:00', '08:00')}
                  className="text-[11px] font-semibold bg-white hover:bg-gray-50 text-[#141f5b] px-2 py-1 rounded border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  title="Agregar 7:00 am a 8:00 am"
                >
                  + 7:00 am - 8:00 am
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickPreset('17:00', '19:00')}
                  className="text-[11px] font-semibold bg-white hover:bg-gray-50 text-[#141f5b] px-2 py-1 rounded border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  title="Agregar 5:00 pm a 7:00 pm"
                >
                  + 5:00 pm - 7:00 pm
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickPreset('17:00', '22:00')}
                  className="text-[11px] font-semibold bg-white hover:bg-gray-50 text-[#141f5b] px-2 py-1 rounded border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  title="Agregar 5:00 pm a 10:00 pm"
                >
                  + 5:00 pm - 10:00 pm
                </button>
              </div>

              {/* Single hours quick selector (7am to 10pm) */}
              <div className="pt-1.5 space-y-1">
                <span className="text-[10px] text-gray-500 block">
                  O toca una hora suelta para activarla/desactivarla (1 hora):
                </span>
                <div className="flex flex-wrap gap-1">
                  {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => {
                    const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                    const startStr = `${String(h).padStart(2, '0')}:00`;
                    const nextH = (h + 1) % 24;
                    const endStr = `${String(nextH).padStart(2, '0')}:00`;
                    const isSelected = meetingSlots.some(
                      (s) => s.start === startStr && s.end === endStr
                    );

                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (meetingSlots.length > 1) {
                              setMeetingSlots((prev) =>
                                prev.filter((s) => !(s.start === startStr && s.end === endStr))
                              );
                            }
                          } else {
                            handleAddSingleHour(h);
                          }
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors cursor-pointer font-bold ${
                          isSelected
                            ? 'bg-[#141f5b] text-white shadow-2xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                        title={isSelected ? `Quitar ${label}` : `Agregar ${label} (1 hora)`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions - Fixed at bottom, always visible */}
        <div className="p-3.5 bg-gray-50/95 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors font-semibold cursor-pointer shadow-2xs text-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141f5b] hover:bg-[#1a2875] text-white font-semibold transition-colors shadow-xs cursor-pointer text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
