import React, { useState } from 'react';
import { 
  Globe, 
  ShieldCheck, 
  Clock, 
  Users, 
  Calendar, 
  ChevronDown, 
  Check, 
  Lock,
  Search,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { Member } from '../types';
import { COMMON_TIMEZONES } from '../data/mockMembers';
import { formatInTimezone } from '../utils/timeEngine';

interface HeaderProps {
  currentUser: Member;
  allMembers: Member[];
  onSwitchUser: (member: Member) => void;
  activeTimeZone: string;
  onChangeTimeZone: (tz: string) => void;
  onOpenDevSecModal: () => void;
  activeView: 'matrix' | 'timeline' | 'team';
  onChangeView: (view: 'matrix' | 'timeline' | 'team') => void;
  selectedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allMembers,
  onSwitchUser,
  activeTimeZone,
  onChangeTimeZone,
  onOpenDevSecModal,
  activeView,
  onChangeView,
  selectedCount,
  totalCount
}) => {
  const [showTzDropdown, setShowTzDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentTimeInActiveTz = formatInTimezone(new Date().toISOString(), activeTimeZone, 'time');
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Top ClickUp Global Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#141f5b] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4 text-[#acc917]" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="font-bold text-gray-900 text-base tracking-tight font-sans">
              TimeSync
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Workspace Interno
            </span>
          </div>
        </div>

        {/* Center: ClickUp style Omnisearch bar (as seen in ClickUp capture) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 items-center relative">
          <div className="w-full flex items-center gap-2 bg-[#f4f5f7] hover:bg-[#ebedf0] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#141f5b]/20 border border-gray-200 rounded-lg px-3 py-1.5 transition-all text-xs text-gray-600">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar colaborador, zona o reunión..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-gray-800 placeholder:text-gray-400"
            />
            <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Timezone Picker, Role Switcher & DevSec Shield */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Active Local Time & Timezone Selector */}
          <div className="relative">
            <button
              id="tz-selector-btn"
              onClick={() => { setShowTzDropdown(!showTzDropdown); setShowUserDropdown(false); }}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="Cambiar zona horaria de referencia"
            >
              <Globe className="w-3.5 h-3.5 text-[#141f5b]" />
              <span className="font-mono text-[#141f5b] font-bold">{currentTimeInActiveTz}</span>
              <span className="hidden lg:inline text-gray-500 max-w-[130px] truncate text-[11px]">
                {activeTimeZone.split('/')[1] || activeTimeZone}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showTzDropdown && (
              <div 
                id="tz-dropdown-menu"
                className="absolute right-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">
                  Proyección Horaria Local
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {COMMON_TIMEZONES.map((tz) => (
                    <button
                      key={tz.value}
                      onClick={() => {
                        onChangeTimeZone(tz.value);
                        setShowTzDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        activeTimeZone === tz.value ? 'text-[#141f5b] font-semibold bg-gray-50' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate">{tz.label}</span>
                      {activeTimeZone === tz.value && <Check className="w-3.5 h-3.5 text-[#141f5b] shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active User Switcher */}
          <div className="relative">
            <button
              id="user-profile-btn"
              onClick={() => { setShowUserDropdown(!showUserDropdown); setShowTzDropdown(false); }}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={`${currentUser.firstName} ${currentUser.lastName}`} 
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#141f5b] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.firstName[0]}
                </div>
              )}
              <span className="hidden sm:inline font-semibold text-gray-800">
                {currentUser.firstName}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
                isAdmin 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {currentUser.role || 'member'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showUserDropdown && (
              <div 
                id="user-dropdown-menu"
                className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50"
              >
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-[11px] text-gray-400">Sesión Activa (Supabase Auth)</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-emerald-600 font-mono mt-0.5">UID: {currentUser.auth_id}</p>
                </div>

                <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Cambiar Usuario para Pruebas
                </div>
                {allMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSwitchUser(m);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      currentUser.id === m.id ? 'bg-gray-50 text-[#141f5b] font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {m.avatarUrl ? (
                        <img 
                          src={m.avatarUrl} 
                          alt="" 
                          referrerPolicy="no-referrer" 
                          className="w-5 h-5 rounded-full object-cover border border-gray-200" 
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                          {m.firstName[0]}
                        </div>
                      )}
                      <span>{m.firstName} {m.lastName}</span>
                      <span className="text-[10px] px-1 rounded bg-gray-100 border border-gray-200 text-gray-500">
                        {m.role}
                      </span>
                    </div>
                    {currentUser.id === m.id && <Check className="w-3.5 h-3.5 text-[#141f5b]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DevSec Ops Button (ClickUp styled) */}
          <button
            id="devsec-audit-btn"
            onClick={onOpenDevSecModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-2xs cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
            title={isAdmin ? "Abrir consola DevSecOps & Pentesting" : "Acceso restringido: Solo el Administrador puede ejecutar Pentesting"}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">DevSec Ops</span>
            {isAdmin ? (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">Admin</span>
            ) : (
              <Lock className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* ClickUp Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            id="tab-matrix"
            onClick={() => onChangeView('matrix')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'matrix'
                ? 'bg-[#141f5b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Matriz Semanal de Traslape</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeView === 'matrix' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              7d
            </span>
          </button>

          <button
            id="tab-timeline"
            onClick={() => onChangeView('timeline')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'timeline'
                ? 'bg-[#141f5b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Vista Gantt (Días & Horas)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeView === 'timeline' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              Días
            </span>
          </button>

          <button
            id="tab-team"
            onClick={() => onChangeView('team')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeView === 'team'
                ? 'bg-[#141f5b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo & Horarios Nativos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeView === 'team' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {selectedCount}/{totalCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
