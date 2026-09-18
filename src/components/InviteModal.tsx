import React, { useState } from 'react';
import { Mail, Copy, Check, X, Key, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Member } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  member
}) => {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  if (!isOpen || !member) return null;

  const passwordText = member.password || 'password123';
  const appUrl = `${window.location.origin}${window.location.pathname}`;

  const invitationMessage = `¡Hola ${member.firstName}!\n\nHas sido agregada a TimeSync. Puedes iniciar sesión con tus credenciales:\n\n🔗 Enlace de acceso: ${appUrl}\n📧 Correo: ${member.email}\n🔑 Contraseña temporal: ${passwordText}\n\n¡Bienvenida al equipo!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoUrl = `mailto:${member.email}?subject=${encodeURIComponent(
    'Tus credenciales de acceso a TimeSync'
  )}&body=${encodeURIComponent(invitationMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Entrega de Credenciales
              </h3>
              <p className="text-xs text-gray-500">
                Datos de acceso de {member.firstName} {member.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member preview & credentials card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.firstName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#141f5b] text-white flex items-center justify-center font-bold text-xs">
                {member.firstName[0]}
                {member.lastName[0]}
              </div>
            )}
            <div>
              <div className="font-bold text-sm text-gray-900">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-xs text-gray-500 font-mono">{member.email}</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-gray-500 font-semibold">Correo de ingreso:</span>
              <span className="font-mono font-bold text-gray-900">{member.email}</span>
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-gray-500 font-semibold">Contraseña:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-gray-900">
                  {showPassword ? passwordText : '••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-700 p-0.5"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-gray-500 font-semibold">Enlace de acceso:</span>
              <span className="font-mono text-[11px] text-blue-700 truncate max-w-[200px]">
                {appUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141f5b] hover:bg-[#1a2875] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Mensaje copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar invitación completa para WhatsApp / Slack</span>
              </>
            )}
          </button>

          <a
            href={mailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Enviar por correo electrónico (Abrir Gmail / Outlook)</span>
          </a>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Almacenado de forma segura en Firestore</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
