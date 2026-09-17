import React, { useState, useEffect } from 'react';
import { X, Save, Shield, AlertCircle, Clock, MapPin, Mail, User } from 'lucide-react';
import { Member, MemberType } from '../types';
import { COMMON_TIMEZONES, COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { isValid24HourTime, isValidIanaTimeZone, sanitizeString, verifyRLSPermission } from '../utils/security';

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
  const [type, setType] = useState<MemberType>('INTERNAL');
  const [country, setCountry] = useState('SV');
  const [timeZone, setTimeZone] = useState('America/El_Salvador');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [meetingStart, setMeetingStart] = useState('09:00');
  const [meetingEnd, setMeetingEnd] = useState('12:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberToEdit) {
      setFirstName(memberToEdit.firstName);
      setLastName(memberToEdit.lastName);
      setEmail(memberToEdit.email);
      setType(memberToEdit.type);
      setCountry(memberToEdit.country);
      setTimeZone(memberToEdit.timeZone);
      setWorkStart(memberToEdit.workStart);
      setWorkEnd(memberToEdit.workEnd);
      setMeetingStart(memberToEdit.meetingStart || '09:00');
      setMeetingEnd(memberToEdit.meetingEnd || '12:00');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setType('INTERNAL');
      setCountry('SV');
      setTimeZone('America/El_Salvador');
      setWorkStart('08:00');
      setWorkEnd('17:00');
      setMeetingStart('09:00');
      setMeetingEnd('12:00');
    }
    setError(null);
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!memberToEdit;
  const targetId = memberToEdit?.id || 'new-user';
  const rlsCheck = verifyRLSPermission(currentUser, targetId, isEditing ? 'UPDATE_PROFILE' : 'ADMIN_TOOLING');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verify RLS policy
    if (!rlsCheck.allowed && isEditing) {
      setError(`Violación de Seguridad RLS: ${rlsCheck.reason}`);
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

    if (meetingStart && !isValid24HourTime(meetingStart)) {
      setError('El inicio de horas libres para reunión debe tener formato HH:mm (ej. 09:00).');
      return;
    }

    if (meetingEnd && !isValid24HourTime(meetingEnd)) {
      setError('El fin de horas libres para reunión debe tener formato HH:mm (ej. 12:00).');
      return;
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
      teamSpaceId: memberToEdit?.teamSpaceId || 'space_core_engineering',
      type,
      country,
      timeZone,
      workStart,
      workEnd,
      meetingStart: meetingStart || '09:00',
      meetingEnd: meetingEnd || '12:00',
      role: memberToEdit?.role || 'member',
      avatarUrl: memberToEdit?.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      busySlots: memberToEdit?.busySlots || [],
      availableSlots: memberToEdit?.availableSlots || []
    };

    onSave(updatedMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div 
        id="member-form-modal"
        className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
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
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          
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

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Correo Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white"
              placeholder="carlos.mendez@empresa.com"
            />
          </div>

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

          {/* Meeting Hours: Horas libres destinadas a reunirse */}
          <div className="grid grid-cols-2 gap-3 bg-[#acc917]/15 p-3 rounded-xl border border-[#acc917]/40">
            <div className="col-span-2 flex items-center justify-between">
              <span className="font-bold text-[#141f5b] text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#141f5b]" />
                Horas Libres Destinadas para Reunión (Ventana Libre)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#141f5b] font-bold border border-[#acc917]">
                ClickUp Style
              </span>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Inicio Reuniones (HH:mm)</label>
              <input
                type="text"
                value={meetingStart}
                onChange={(e) => setMeetingStart(e.target.value)}
                maxLength={5}
                pattern="^(?:[01]\d|2[0-3]):[0-5]\d$"
                required
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20"
                placeholder="09:00"
              />
              <span className="text-[10px] text-gray-500">Ej. 09:00 (9am)</span>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Fin Reuniones (HH:mm)</label>
              <input
                type="text"
                value={meetingEnd}
                onChange={(e) => setMeetingEnd(e.target.value)}
                maxLength={5}
                pattern="^(?:[01]\d|2[0-3]):[0-5]\d$"
                required
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20"
                placeholder="12:00"
              />
              <span className="text-[10px] text-gray-500">Ej. 12:00 (12pm)</span>
            </div>
          </div>

          {/* Modal Actions using #141f5b for the primary button */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors font-semibold cursor-pointer shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141f5b] hover:bg-[#1a2875] text-white font-semibold transition-colors shadow-xs cursor-pointer"
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
