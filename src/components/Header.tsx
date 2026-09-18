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
  Layers,
  KeyRound,
  UserCheck,
  CalendarDays,
  CalendarRange,
  LogOut,
  Edit3
} from 'lucide-react';
import { Member } from '../types';
import { COMMON_TIMEZONES, COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { formatInTimezone } from '../utils/timeEngine';

interface HeaderProps {
  currentUser: Member | null;
  allMembers: Member[];
  onSwitchUser: (member: Member) => void;
  activeTimeZone: string;
  onChangeTimeZone: (tz: string) => void;
  onOpenDevSecModal: () => void;
  onOpenAuthModal: () => void;
  onOpenMyProfile: () => void;
  onLogout: () => void;
  activeTab: 'gantt' | 'team';
  onChangeTab: (tab: 'gantt' | 'team') => void;
  ganttSubView: 'semanal' | 'diaria';
  onChangeGanttSubView: (subView: 'semanal' | 'diaria') => void;
  selectedCount: number;
  totalCount: number;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allMembers,
  onSwitchUser,
  activeTimeZone,
  onChangeTimeZone,
  onOpenDevSecModal,
  onOpenAuthModal,
  onOpenMyProfile,
  onLogout,
  activeTab,
  onChangeTab,
  ganttSubView,
  onChangeGanttSubView,
  selectedCount,
  totalCount,
  cloudSyncStatus = 'synced'
}) => {
  const [showTzDropdown, setShowTzDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentTimeInActiveTz = formatInTimezone(new Date().toISOString(), activeTimeZone, 'time');
  const isAdmin = currentUser?.role === 'admin';
  const userCountryFlag = currentUser ? (COUNTRY_FLAG_MAP[currentUser.country]?.flag || '🌐') : '';

  // Quick switch to current user's local timezone
  const handleResetToMyTimezone = () => {
    if (currentUser?.timeZone) {
      onChangeTimeZone(currentUser.timeZone);
      setShowTzDropdown(false);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Top Global Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#141f5b] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4 text-[#acc917]" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-gray-900 text-base tracking-tight font-sans">
              TimeSync
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Workspace Multizona
            </span>
            {cloudSyncStatus === 'synced' && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Cloud Sync
              </span>
            )}
            {cloudSyncStatus === 'syncing' && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
                Sincronizando...
              </span>
            )}
            {cloudSyncStatus === 'offline' && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Modo Local
              </span>
            )}
          </div>
        </div>

        {/* Center: In Gantt mode, show the two sub-views: Semanal and Diaria directly in header */}
        {activeTab === 'gantt' && (
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => onChangeGanttSubView('semanal')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ganttSubView === 'semanal'
                  ? 'bg-[#141f5b] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Vista Semanal</span>
            </button>
            <button
              onClick={() => onChangeGanttSubView('diaria')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ganttSubView === 'diaria'
                  ? 'bg-[#141f5b] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Vista Diaria</span>
            </button>
          </div>
        )}

        {/* Right: Timezone, Member Login / Profile & Security */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Active Local Time & Timezone Selector */}
          <div className="relative">
            <button
              id="tz-selector-btn"
              onClick={() => { setShowTzDropdown(!showTzDropdown); setShowUserDropdown(false); }}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="Cambiar proyección de zona horaria"
            >
              <Globe className="w-3.5 h-3.5 text-[#141f5b]" />
              <span className="font-mono text-[#141f5b] font-bold">{currentTimeInActiveTz}</span>
              <span className="hidden lg:inline text-gray-500 max-w-[120px] truncate text-[11px]">
                {activeTimeZone.split('/')[1] || activeTimeZone}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showTzDropdown && (
              <div 
                id="tz-dropdown-menu"
                className="absolute right-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-500 border-b border-gray-100 flex items-center justify-between">
                  <span>ZONA HORARIA ACTIVA</span>
                  {currentUser && (
                    <button
                      onClick={handleResetToMyTimezone}
                      className="text-[#141f5b] hover:underline text-[10px] font-bold cursor-pointer"
                    >
                      Mi Hora Local
                    </button>
                  )}
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
                        activeTimeZone === tz.value ? 'text-[#141f5b] font-bold bg-blue-50/60' : 'text-gray-700'
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

          {/* User Session / Login Button */}
          {currentUser ? (
            <div className="relative">
              <button
                id="user-profile-btn"
                onClick={() => { setShowUserDropdown(!showUserDropdown); setShowTzDropdown(false); }}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer"
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
                <span className="hidden sm:inline font-bold text-gray-900">
                  {currentUser.firstName}
                </span>
                <span className="text-xs">{userCountryFlag}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {currentUser.role || 'member'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showUserDropdown && (
                <div 
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in"
                >
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900">
                        {currentUser.firstName} {currentUser.lastName} {userCountryFlag}
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate font-mono">{currentUser.email}</p>
                    <p className="text-[10px] text-[#141f5b] font-mono mt-0.5">
                      Zona local: {currentUser.timeZone}
                    </p>
                  </div>

                  {/* Member Actions: Edit Profile and Schedule */}
                  <div className="p-2 space-y-1 border-b border-gray-100">
                    <button
                      onClick={() => {
                        onOpenMyProfile();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#141f5b] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#141f5b]" />
                      <span>Editar Mi Perfil y Horario</span>
                    </button>

                    <button
                      onClick={() => {
                        handleResetToMyTimezone();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-gray-500" />
                      <span>Ver vistas en mi hora local</span>
                    </button>
                  </div>

                  {/* Switch user / quick test - Solo para Admin */}
                  {isAdmin && (
                    <>
                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Cambiar de Perfil (Admin)
                      </div>
                      <div className="max-h-48 overflow-y-auto px-1">
                        {allMembers.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              onSwitchUser(m);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between rounded-lg hover:bg-gray-50 transition-colors ${
                              currentUser.id === m.id ? 'bg-gray-50 text-[#141f5b] font-bold' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {m.avatarUrl ? (
                                <img 
                                  src={m.avatarUrl} 
                                  alt="" 
                                  referrerPolicy="no-referrer" 
                                  className="w-5 h-5 rounded-full object-cover" 
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                                  {m.firstName[0]}
                                </div>
                              )}
                              <span className="truncate">{m.firstName} {m.lastName}</span>
                            </div>
                            {currentUser.id === m.id && <Check className="w-3.5 h-3.5 text-[#141f5b]" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Logout */}
                  <div className="pt-1.5 mt-1 border-t border-gray-100 px-2">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-[#141f5b] hover:bg-[#1a2875] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#acc917]" />
              <span>Acceso Miembros</span>
            </button>
          )}

          {/* DevSec Audit button - Solo visible para Administradores */}
          {isAdmin && (
            <button
              onClick={onOpenDevSecModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors shadow-2xs cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
              title="Consola de Seguridad DevSec & Pentest (Solo Administrador)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">DevSec</span>
            </button>
          )}
        </div>
      </div>

      {/* ONLY TWO TABS AS EXPLICITLY REQUESTED:
          "1. Solo seran dos tabs: Vista Gantt y Equipo, borra la Matriz Semanal de translape de esto solo conservaras el contenedor de Recomendación Inteligente de Traslape que deberas moverlo a la tab de Vista Custom en vez de Vista Gantt."
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-3 py-1 border-t border-gray-100">
          
          {/* TAB 1: Vista Gantt */}
          <button
            id="tab-gantt"
            onClick={() => onChangeTab('gantt')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'gantt'
                ? 'bg-[#141f5b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 text-[#acc917]" />
            <span>Vista Gantt</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'gantt' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              Semanal / Diaria
            </span>
          </button>

          {/* TAB 2: Equipo */}
          <button
            id="tab-team"
            onClick={() => onChangeTab('team')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#141f5b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 text-[#acc917]" />
            <span>Equipo</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {selectedCount}/{totalCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
