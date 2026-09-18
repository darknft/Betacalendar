import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Shield, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Mail, 
  User, 
  Plus, 
  Trash2, 
  Camera, 
  Upload, 
  Image as ImageIcon,
  Copy,
  Check,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';
import { Member, MemberType, MeetingSlot } from '../types';
import { COMMON_TIMEZONES, COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { isValid24HourTime, isValidIanaTimeZone, sanitizeString, verifyRLSPermission } from '../utils/security';
import { formatTime24to12 } from '../utils/timeEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const AVATAR_PRESETS = [
  { label: 'Perfil 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { label: 'Perfil 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Perfil 3', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Perfil 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Perfil 5', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Perfil 6', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
];

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  onDelete?: (memberId: string) => void;
  memberToEdit?: Member | null;
  currentUser: Member;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  memberToEdit,
  currentUser
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([
    { start: '09:00', end: '12:00' }
  ]);
  const [saturdaySlots, setSaturdaySlots] = useState<MeetingSlot[]>([]);
  const [sundaySlots, setSundaySlots] = useState<MeetingSlot[]>([]);
  const [activeSlotDayType, setActiveSlotDayType] = useState<'weekdays' | 'saturday' | 'sunday'>('weekdays');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvitation = () => {
    const inviteText = `¡Hola ${firstName || 'compañero'}!\nHas sido agregado a TimeSync.\n\nAcceso a la plataforma:\n🔗 Enlace: ${window.location.origin}${window.location.pathname}\n📧 Correo: ${email}\n🔑 Contraseña: ${password || 'password123'}\n\n¡Bienvenido!`;
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const getMailtoUrl = () => {
    const subject = encodeURIComponent("Tus credenciales de acceso a TimeSync");
    const body = encodeURIComponent(
      `¡Hola ${firstName || ''}!\n\nHas sido agregado a TimeSync.\n\nPuedes acceder con los siguientes datos:\n• Enlace de la app: ${window.location.origin}${window.location.pathname}\n• Usuario / Correo: ${email}\n• Contraseña temporal: ${password || 'password123'}\n\n¡Saludos!`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

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
      setAvatarUrl(memberToEdit.avatarUrl || '');
      
      if (memberToEdit.meetingSlots && memberToEdit.meetingSlots.length > 0) {
        setMeetingSlots(memberToEdit.meetingSlots);
      } else if (memberToEdit.meetingStart && memberToEdit.meetingEnd) {
        setMeetingSlots([{ start: memberToEdit.meetingStart, end: memberToEdit.meetingEnd }]);
      } else {
        setMeetingSlots([{ start: '09:00', end: '12:00' }]);
      }

      if (memberToEdit.saturdaySlots !== undefined) {
        setSaturdaySlots(memberToEdit.saturdaySlots);
      } else if (memberToEdit.weekendSlots) {
        setSaturdaySlots(memberToEdit.weekendSlots);
      } else {
        setSaturdaySlots([]);
      }

      if (memberToEdit.sundaySlots !== undefined) {
        setSundaySlots(memberToEdit.sundaySlots);
      } else {
        setSundaySlots([]);
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
      setAvatarUrl('');
      setMeetingSlots([{ start: '09:00', end: '12:00' }]);
      setSaturdaySlots([]);
      setSundaySlots([]);
    }
    setActiveSlotDayType('weekdays');
    setError(null);
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!memberToEdit;
  const isSelf = currentUser?.id === memberToEdit?.id;
  const isAdmin = currentUser?.role === 'admin';
  const targetId = memberToEdit?.id || 'new-user';
  const rlsCheck = verifyRLSPermission(currentUser, targetId, isEditing ? 'UPDATE_PROFILE' : 'ADMIN_TOOLING');

  // Handle local image file upload with lightweight compression for instant cloud storage
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressed);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Weekdays slots handlers
  const handleUpdateSlot = (index: number, field: 'start' | 'end', val: string) => {
    setMeetingSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleRemoveSlot = (index: number) => {
    if (meetingSlots.length <= 1) {
      setError('Debes mantener al menos una franja o rango disponible para reuniones de Lunes a Viernes.');
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

  // Saturday slots handlers
  const handleUpdateSaturdaySlot = (index: number, field: 'start' | 'end', val: string) => {
    setSaturdaySlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleRemoveSaturdaySlot = (index: number) => {
    setSaturdaySlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSaturdaySlot = (start: string = '10:00', end: string = '12:00') => {
    setSaturdaySlots((prev) => [...prev, { start, end }]);
  };

  const handleAddSaturdayQuickPreset = (start: string, end: string) => {
    const exists = saturdaySlots.some((s) => s.start === start && s.end === end);
    if (!exists) {
      setSaturdaySlots((prev) => [...prev, { start, end }]);
    }
  };

  const handleAddSaturdaySingleHour = (hour24: number) => {
    const startStr = `${String(hour24).padStart(2, '0')}:00`;
    const nextH = (hour24 + 1) % 24;
    const endStr = `${String(nextH).padStart(2, '0')}:00`;
    handleAddSaturdayQuickPreset(startStr, endStr);
  };

  const handleClearSaturdaySlots = () => {
    setSaturdaySlots([]);
  };

  // Sunday slots handlers
  const handleUpdateSundaySlot = (index: number, field: 'start' | 'end', val: string) => {
    setSundaySlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleRemoveSundaySlot = (index: number) => {
    setSundaySlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSundaySlot = (start: string = '10:00', end: string = '12:00') => {
    setSundaySlots((prev) => [...prev, { start, end }]);
  };

  const handleAddSundayQuickPreset = (start: string, end: string) => {
    const exists = sundaySlots.some((s) => s.start === start && s.end === end);
    if (!exists) {
      setSundaySlots((prev) => [...prev, { start, end }]);
    }
  };

  const handleAddSundaySingleHour = (hour24: number) => {
    const startStr = `${String(hour24).padStart(2, '0')}:00`;
    const nextH = (hour24 + 1) % 24;
    const endStr = `${String(nextH).padStart(2, '0')}:00`;
    handleAddSundayQuickPreset(startStr, endStr);
  };

  const handleClearSundaySlots = () => {
    setSundaySlots([]);
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
      setError('Debes configurar al menos una hora o franja disponible para reunión de Lunes a Viernes.');
      return;
    }

    for (let i = 0; i < meetingSlots.length; i++) {
      const s = meetingSlots[i];
      if (!isValid24HourTime(s.start) || !isValid24HourTime(s.end)) {
        setError(`El slot de Lunes a Viernes ${i + 1} (${s.start} - ${s.end}) debe tener formato de 24 horas HH:mm (ej. 08:00, 17:00).`);
        return;
      }
    }

    for (let i = 0; i < saturdaySlots.length; i++) {
      const s = saturdaySlots[i];
      if (!isValid24HourTime(s.start) || !isValid24HourTime(s.end)) {
        setError(`El slot de Sábado ${i + 1} (${s.start} - ${s.end}) debe tener formato de 24 horas HH:mm (ej. 10:00, 12:00).`);
        return;
      }
    }

    for (let i = 0; i < sundaySlots.length; i++) {
      const s = sundaySlots[i];
      if (!isValid24HourTime(s.start) || !isValid24HourTime(s.end)) {
        setError(`El slot de Domingo ${i + 1} (${s.start} - ${s.end}) debe tener formato de 24 horas HH:mm (ej. 10:00, 12:00).`);
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
      saturdaySlots,
      sundaySlots,
      weekendSlots: saturdaySlots.length > 0 ? saturdaySlots : sundaySlots, // fallback compatibility
      role: isAdmin ? role : (memberToEdit?.role || 'member'),
      avatarUrl: avatarUrl.trim() || undefined,
      busySlots: memberToEdit?.busySlots || [],
      availableSlots: memberToEdit?.availableSlots || []
    };

    onSave(updatedMember);
    onClose();
  };

  const handleDeleteThisMember = () => {
    if (!memberToEdit || !onDelete || memberToEdit.role === 'admin') return;
    setIsConfirmingDelete(true);
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
              <p className="text-[11px] text-gray-500">Configura foto de perfil, jornada nativa y huso horario</p>
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

            {/* Photo / Avatar Section */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-800 font-bold text-xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#141f5b]" />
                  <span>Foto de Perfil del Colaborador</span>
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-[11px] text-red-500 hover:underline font-semibold cursor-pointer"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3.5">
                {/* Avatar Preview */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#141f5b] shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#141f5b] text-white flex items-center justify-center font-bold text-base border-2 border-gray-200 shadow-xs">
                      {firstName ? firstName[0].toUpperCase() : ''}{lastName ? lastName[0].toUpperCase() : ''}
                      {!firstName && !lastName && <User className="w-6 h-6 text-gray-300" />}
                    </div>
                  )}
                </div>

                {/* Upload & Preset Options */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="member-photo-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#141f5b] text-gray-700 hover:text-[#141f5b] font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#141f5b]" />
                      <span>Subir foto desde tu dispositivo</span>
                    </button>
                  </div>

                  {/* URL Input */}
                  <div className="space-y-1">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="O pega el enlace de una foto (https://...)"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Avatars */}
              <div className="space-y-1 pt-2 border-t border-gray-200/60">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                  O elige una foto sugerida:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      className={`relative shrink-0 rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                        avatarUrl === p.url ? 'border-[#141f5b] scale-110' : 'border-transparent hover:border-gray-300'
                      }`}
                      title={p.label}
                    >
                      <img
                        src={p.url}
                        alt={p.label}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

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

          {/* Credential Delivery & Invitation Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Entrega de Credenciales e Invitación
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                Guardado en Firestore
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              La contraseña se almacena de forma segura en la base de datos Firestore. Para que el colaborador reciba sus datos de acceso, puedes copiar la invitación o enviársela directamente a su correo:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyInvitation}
                disabled={!email || !password}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copiar invitación con clave al portapapeles"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar invitación con clave</span>
                  </>
                )}
              </button>

              {email && (
                <a
                  href={getMailtoUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition-colors shadow-2xs"
                  title="Abrir tu cliente de correo (Gmail, Outlook o Mail) con el mensaje listo"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Enviar por correo (Email)</span>
                </a>
              )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#141f5b]" />
                <span className="font-bold text-[#141f5b] text-xs">
                  Horas Libres Destinadas para Reunión (Slots Disponibles)
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#141f5b] font-bold border border-[#acc917] shadow-2xs">
                  Lun-Vie: {meetingSlots.length} {meetingSlots.length === 1 ? 'franja' : 'franjas'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs border ${
                  saturdaySlots.length > 0 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-white text-gray-500 border-gray-200'
                }`}>
                  Sáb: {saturdaySlots.length > 0 ? `${saturdaySlots.length} franjas` : 'Libre'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs border ${
                  sundaySlots.length > 0 
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
                    : 'bg-white text-gray-500 border-gray-200'
                }`}>
                  Dom: {sundaySlots.length > 0 ? `${sundaySlots.length} franjas` : 'Libre'}
                </span>
              </div>
            </div>

            {/* Sub-selector tabs: Lun-Vie, Sábado, Domingo separados */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/70 rounded-lg border border-[#acc917]/30">
              <button
                type="button"
                onClick={() => setActiveSlotDayType('weekdays')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSlotDayType === 'weekdays'
                    ? 'bg-[#141f5b] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lunes a Viernes</span>
                <span className="sm:hidden">Lun-Vie</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeSlotDayType === 'weekdays' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {meetingSlots.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSlotDayType('saturday')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSlotDayType === 'saturday'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Sábado</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeSlotDayType === 'saturday' 
                    ? 'bg-white/20 text-white' 
                    : saturdaySlots.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'
                }`}>
                  {saturdaySlots.length > 0 ? saturdaySlots.length : '0'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSlotDayType('sunday')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSlotDayType === 'sunday'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>Domingo</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeSlotDayType === 'sunday' 
                    ? 'bg-white/20 text-white' 
                    : sundaySlots.length > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-400'
                }`}>
                  {sundaySlots.length > 0 ? sundaySlots.length : '0'}
                </span>
              </button>
            </div>

            {/* TAB 1: Lunes a Viernes */}
            {activeSlotDayType === 'weekdays' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#141f5b]">
                    📅 Disponibilidad habitual de Lunes a Viernes:
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Aplica para todos los días laborales
                  </span>
                </div>

                <p className="text-[11px] text-gray-600 leading-snug">
                  Configura tus franjas por rango (ej. 5:00 pm a 11:00 pm) o agrega horas sueltas independientes (ej. 8:00 am).
                </p>

                {/* List of configured weekday slots */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {meetingSlots.map((slot, index) => (
                    <div 
                      key={index}
                      className="bg-white p-2 rounded-lg border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
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
                    <span>+ Agregar franja Lun-Vie</span>
                  </button>
                </div>

                {/* Quick hour presets & single-hour quick buttons for weekdays */}
                <div className="pt-2 border-t border-[#acc917]/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                    Atajos rápidos de Lunes a Viernes:
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
                      onClick={() => handleAddQuickPreset('17:00', '23:00')}
                      className="text-[11px] font-semibold bg-white hover:bg-gray-50 text-[#141f5b] px-2 py-1 rounded border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                      title="Agregar 5:00 pm a 11:00 pm"
                    >
                      + 5:00 pm - 11:00 pm
                    </button>
                  </div>

                  {/* Single hours quick selector */}
                  <div className="pt-1.5 space-y-1">
                    <span className="text-[10px] text-gray-500 block">
                      O activa/desactiva horas sueltas (1 hora cada una):
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
            )}

            {/* TAB 2: Sábado */}
            {activeSlotDayType === 'saturday' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ☀️ Disponibilidad solo para Sábado:
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Opcional (1 hora, rango o ninguna)
                  </span>
                </div>

                <p className="text-[11px] text-gray-600 leading-snug">
                  Configura tus horas disponibles exclusivamente para los <strong>Sábados</strong>. Puedes definir 1 sola hora, n cantidad de horas o dejarlo vacío (0h) si no te reúnes este día.
                </p>

                {saturdaySlots.length === 0 ? (
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-center space-y-2">
                    <div className="text-amber-900 font-semibold text-xs flex items-center justify-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Sin horas asignadas para Sábado (Día Libre)</span>
                    </div>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                      Actualmente estás libre los sábados. Si deseas destinar 1 hora o un rango para llamadas, pulsa un atajo:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddSaturdaySingleHour(10)}
                        className="px-2.5 py-1 rounded bg-[#141f5b] text-white text-xs font-semibold shadow-2xs hover:bg-[#1a2875] cursor-pointer"
                        title="Agregar 10:00 am a 11:00 am"
                      >
                        + 1 sola hora: 10:00 am (1h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSaturdaySingleHour(11)}
                        className="px-2.5 py-1 rounded bg-white text-[#141f5b] border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
                        title="Agregar 11:00 am a 12:00 pm"
                      >
                        + 11:00 am (1h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSaturdayQuickPreset('10:00', '12:00')}
                        className="px-2.5 py-1 rounded bg-white text-[#141f5b] border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
                        title="Agregar 10:00 am a 12:00 pm"
                      >
                        + 10:00 am - 12:00 pm (2h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSaturdaySlot('15:00', '17:00')}
                        className="px-2.5 py-1 rounded bg-white text-[#141f5b] border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
                        title="Agregar 3:00 pm a 5:00 pm"
                      >
                        + 3:00 pm - 5:00 pm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSaturdaySlot('09:00', '11:00')}
                        className="px-2.5 py-1 rounded bg-lime-50 text-lime-900 border border-lime-300 text-xs font-semibold hover:bg-lime-100 shadow-2xs cursor-pointer"
                      >
                        + Personalizar franja
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* List of configured Saturday slots */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {saturdaySlots.map((slot, index) => (
                        <div 
                          key={index}
                          className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {index + 1}
                            </span>
                            <div className="font-bold text-xs text-amber-950 flex items-center gap-1 truncate">
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
                                onChange={(e) => handleUpdateSaturdaySlot(index, 'start', e.target.value)}
                                maxLength={5}
                                placeholder="10:00"
                                className="w-16 bg-amber-50/50 border border-amber-200 rounded px-1.5 py-1 text-gray-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                title="Hora inicio (HH:mm)"
                              />
                              <span className="text-gray-400 text-xs font-mono">-</span>
                              <input
                                type="text"
                                value={slot.end}
                                onChange={(e) => handleUpdateSaturdaySlot(index, 'end', e.target.value)}
                                maxLength={5}
                                placeholder="11:00"
                                className="w-16 bg-amber-50/50 border border-amber-200 rounded px-1.5 py-1 text-gray-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                title="Hora fin (HH:mm)"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSaturdaySlot(index)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Eliminar esta franja de sábado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions for Saturday slots */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#acc917]/30">
                      <button
                        type="button"
                        onClick={() => handleAddSaturdaySlot('10:00', '12:00')}
                        className="flex items-center gap-1 text-xs font-bold text-[#141f5b] hover:text-[#1a2875] bg-white px-2.5 py-1.5 rounded-lg border border-[#acc917] hover:bg-lime-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar franja Sábado</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearSaturdaySlots}
                        className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
                        title="Quitar todas las horas y dejar sábado libre"
                      >
                        Dejar libre (0 horas)
                      </button>
                    </div>

                    {/* Quick presets for Saturday */}
                    <div className="pt-2 border-t border-[#acc917]/20 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                        Atajos para Sábado:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddSaturdaySingleHour(9)}
                          className="text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 9:00 am (1 sola hora)"
                        >
                          + 9:00 am (1h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSaturdaySingleHour(10)}
                          className="text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 10:00 am (1 sola hora)"
                        >
                          + 10:00 am (1h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSaturdayQuickPreset('10:00', '12:00')}
                          className="text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 10:00 am a 12:00 pm (2 horas)"
                        >
                          + 10:00 am - 12:00 pm (2h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSaturdayQuickPreset('15:00', '17:00')}
                          className="text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 3:00 pm a 5:00 pm"
                        >
                          + 3:00 pm - 5:00 pm
                        </button>
                      </div>

                      {/* Single hours quick selector for Saturday */}
                      <div className="pt-1.5 space-y-1">
                        <span className="text-[10px] text-gray-500 block">
                          Toca una hora para activarla/desactivarla el Sábado (1 hora):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => {
                            const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                            const startStr = `${String(h).padStart(2, '0')}:00`;
                            const nextH = (h + 1) % 24;
                            const endStr = `${String(nextH).padStart(2, '0')}:00`;
                            const isSelected = saturdaySlots.some(
                              (s) => s.start === startStr && s.end === endStr
                            );

                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSaturdaySlots((prev) =>
                                      prev.filter((s) => !(s.start === startStr && s.end === endStr))
                                    );
                                  } else {
                                    handleAddSaturdaySingleHour(h);
                                  }
                                }}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors cursor-pointer font-bold ${
                                  isSelected
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                                }`}
                                title={isSelected ? `Quitar ${label} del sábado` : `Agregar ${label} (1 hora)`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: Domingo */}
            {activeSlotDayType === 'sunday' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    🌙 Disponibilidad solo para Domingo:
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Opcional (1 hora, rango o ninguna)
                  </span>
                </div>

                <p className="text-[11px] text-gray-600 leading-snug">
                  Configura tus horas disponibles exclusivamente para los <strong>Domingos</strong>. Puedes definir 1 sola hora, n cantidad de horas o dejarlo vacío (0h) si descansas este día.
                </p>

                {sundaySlots.length === 0 ? (
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-200 text-center space-y-2">
                    <div className="text-indigo-900 font-semibold text-xs flex items-center justify-center gap-1.5">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>Sin horas asignadas para Domingo (Día Libre)</span>
                    </div>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                      Actualmente estás libre los domingos. Si deseas destinar 1 hora o un rango para llamadas, pulsa un atajo:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddSundaySingleHour(10)}
                        className="px-2.5 py-1 rounded bg-[#141f5b] text-white text-xs font-semibold shadow-2xs hover:bg-[#1a2875] cursor-pointer"
                        title="Agregar 10:00 am a 11:00 am"
                      >
                        + 1 sola hora: 10:00 am (1h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSundaySingleHour(11)}
                        className="px-2.5 py-1 rounded bg-white text-[#141f5b] border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
                        title="Agregar 11:00 am a 12:00 pm"
                      >
                        + 11:00 am (1h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSundayQuickPreset('10:00', '12:00')}
                        className="px-2.5 py-1 rounded bg-white text-[#141f5b] border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
                        title="Agregar 10:00 am a 12:00 pm"
                      >
                        + 10:00 am - 12:00 pm (2h)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSundaySlot('16:00', '18:00')}
                        className="px-2.5 py-1 rounded bg-white text-[#141f5b] border border-gray-300 text-xs font-semibold hover:bg-gray-50 shadow-2xs cursor-pointer"
                        title="Agregar 4:00 pm a 6:00 pm"
                      >
                        + 4:00 pm - 6:00 pm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSundaySlot('19:00', '21:00')}
                        className="px-2.5 py-1 rounded bg-lime-50 text-lime-900 border border-lime-300 text-xs font-semibold hover:bg-lime-100 shadow-2xs cursor-pointer"
                      >
                        + Personalizar franja
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* List of configured Sunday slots */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {sundaySlots.map((slot, index) => (
                        <div 
                          key={index}
                          className="bg-white p-2 rounded-lg border border-indigo-200 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {index + 1}
                            </span>
                            <div className="font-bold text-xs text-indigo-950 flex items-center gap-1 truncate">
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
                                onChange={(e) => handleUpdateSundaySlot(index, 'start', e.target.value)}
                                maxLength={5}
                                placeholder="10:00"
                                className="w-16 bg-indigo-50/50 border border-indigo-200 rounded px-1.5 py-1 text-gray-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                title="Hora inicio (HH:mm)"
                              />
                              <span className="text-gray-400 text-xs font-mono">-</span>
                              <input
                                type="text"
                                value={slot.end}
                                onChange={(e) => handleUpdateSundaySlot(index, 'end', e.target.value)}
                                maxLength={5}
                                placeholder="11:00"
                                className="w-16 bg-indigo-50/50 border border-indigo-200 rounded px-1.5 py-1 text-gray-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                title="Hora fin (HH:mm)"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSundaySlot(index)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Eliminar esta franja de domingo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions for Sunday slots */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#acc917]/30">
                      <button
                        type="button"
                        onClick={() => handleAddSundaySlot('10:00', '12:00')}
                        className="flex items-center gap-1 text-xs font-bold text-[#141f5b] hover:text-[#1a2875] bg-white px-2.5 py-1.5 rounded-lg border border-[#acc917] hover:bg-lime-50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar franja Domingo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearSundaySlots}
                        className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
                        title="Quitar todas las horas y dejar domingo libre"
                      >
                        Dejar libre (0 horas)
                      </button>
                    </div>

                    {/* Quick presets for Sunday */}
                    <div className="pt-2 border-t border-[#acc917]/20 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                        Atajos para Domingo:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddSundaySingleHour(10)}
                          className="text-[11px] font-semibold bg-white hover:bg-indigo-50 text-indigo-900 px-2 py-1 rounded border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 10:00 am (1 sola hora)"
                        >
                          + 10:00 am (1h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSundaySingleHour(11)}
                          className="text-[11px] font-semibold bg-white hover:bg-indigo-50 text-indigo-900 px-2 py-1 rounded border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 11:00 am (1 sola hora)"
                        >
                          + 11:00 am (1h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSundayQuickPreset('10:00', '12:00')}
                          className="text-[11px] font-semibold bg-white hover:bg-indigo-50 text-indigo-900 px-2 py-1 rounded border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 10:00 am a 12:00 pm (2 horas)"
                        >
                          + 10:00 am - 12:00 pm (2h)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSundayQuickPreset('16:00', '18:00')}
                          className="text-[11px] font-semibold bg-white hover:bg-indigo-50 text-indigo-900 px-2 py-1 rounded border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          title="Agregar 4:00 pm a 6:00 pm"
                        >
                          + 4:00 pm - 6:00 pm
                        </button>
                      </div>

                      {/* Single hours quick selector for Sunday */}
                      <div className="pt-1.5 space-y-1">
                        <span className="text-[10px] text-gray-500 block">
                          Toca una hora para activarla/desactivarla el Domingo (1 hora):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => {
                            const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                            const startStr = `${String(h).padStart(2, '0')}:00`;
                            const nextH = (h + 1) % 24;
                            const endStr = `${String(nextH).padStart(2, '0')}:00`;
                            const isSelected = sundaySlots.some(
                              (s) => s.start === startStr && s.end === endStr
                            );

                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSundaySlots((prev) =>
                                      prev.filter((s) => !(s.start === startStr && s.end === endStr))
                                    );
                                  } else {
                                    handleAddSundaySingleHour(h);
                                  }
                                }}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors cursor-pointer font-bold ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
                                }`}
                                title={isSelected ? `Quitar ${label} del domingo` : `Agregar ${label} (1 hora)`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions - Fixed at bottom, always visible */}
        <div className="p-3.5 bg-gray-50/95 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0 rounded-b-2xl">
          <div>
            {isEditing && onDelete && (isAdmin || isSelf) && (
              memberToEdit?.role === 'admin' ? (
                <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg font-bold border border-purple-200 flex items-center gap-1.5 shadow-2xs cursor-default">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin protegido</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteThisMember}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors font-semibold text-xs cursor-pointer shadow-2xs"
                  title="Eliminar este colaborador del equipo"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Eliminar Colaborador</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      </form>
    </div>

    {/* Safe In-App Confirmation Modal */}
    {memberToEdit && (
      <ConfirmDeleteModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={() => {
          if (onDelete && memberToEdit.role !== 'admin') {
            onDelete(memberToEdit.id);
          }
          setIsConfirmingDelete(false);
          onClose();
        }}
        membersToDelete={[memberToEdit]}
      />
    )}
  </div>
);
};
