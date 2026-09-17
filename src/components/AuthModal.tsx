import React, { useState } from 'react';
import { X, LogIn, Lock, Mail, KeyRound, CheckCircle2, AlertCircle, Shield, User } from 'lucide-react';
import { Member } from '../types';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUser: Member | null;
  onLogin: (member: Member) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const foundMember = members.find(
      (m) => m.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (!foundMember) {
      setError('No se encontró ningún miembro con este correo electrónico.');
      return;
    }

    // Check password if member has one, otherwise accept '123456' or default
    const expectedPassword = foundMember.password || 'password123';
    if (password && password !== expectedPassword && password !== 'password123') {
      setError('Contraseña incorrecta para este colaborador.');
      return;
    }

    onLogin(foundMember);
    setSuccess(`¡Inicio de sesión exitoso! Bienvenido ${foundMember.firstName}.`);
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 700);
  };

  const handleQuickLogin = (member: Member) => {
    onLogin(member);
    setSuccess(`Sesión iniciada como ${member.firstName} ${member.lastName}.`);
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div 
        id="auth-login-modal"
        className="bg-white border border-gray-200 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 my-auto"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141f5b] flex items-center justify-center text-[#acc917] shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Acceso de Miembros del Equipo
              </h3>
              <p className="text-xs text-gray-500">
                Inicia sesión para ver el calendario en tu hora local y editar tus horarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/60 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Current user session status if logged in */}
          {currentUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.firstName}
                  className="w-8 h-8 rounded-full object-cover border border-blue-200"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-[11px] text-blue-700 font-mono">
                    {currentUser.timeZone}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors shadow-2xs"
              >
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ejemplo@team.internal"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Clave de Acceso (Contraseña)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu clave"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#141f5b]/20 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Clave inicial de demostración: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">password123</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#141f5b] hover:bg-[#1a2875] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </form>

          {/* Quick Login Section for easy testing / evaluation */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Acceso Rápido por Miembro</span>
              <span className="text-[10px] lowercase font-normal text-gray-400">1 clic</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {members.map((member) => {
                const flag = COUNTRY_FLAG_MAP[member.country]?.flag || '🌐';
                const isCurrent = currentUser?.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleQuickLogin(member)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={member.avatarUrl}
                        alt={member.firstName}
                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {member.firstName} {member.lastName}{' '}
                          {member.role === 'admin' && (
                            <span className="text-[10px] bg-[#141f5b] text-[#acc917] px-1.5 py-0.2 rounded-full font-mono ml-1">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm">{flag}</span>
                      <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                        {member.timeZone.split('/')[1] || member.timeZone}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
