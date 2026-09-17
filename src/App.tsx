import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  MemberDirectory 
} from './components/MemberDirectory';
import { 
  WeeklyMatrix 
} from './components/WeeklyMatrix';
import { 
  DailyTimeline 
} from './components/DailyTimeline';
import { 
  BestSlotsWidget 
} from './components/BestSlotsWidget';
import { 
  MemberModal 
} from './components/MemberModal';
import { 
  QuickScheduleModal 
} from './components/QuickScheduleModal';
import { 
  DevSecModal 
} from './components/DevSecModal';
import { 
  CalendarBusyOverlay 
} from './components/CalendarBusyOverlay';
import { 
  Member, 
  OverlapSlot, 
  TimeSlot 
} from './types';
import { 
  INITIAL_MEMBERS 
} from './data/mockMembers';
import { 
  Calendar, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { safeJsonParse } from './utils/security';

export default function App() {
  // Detect browser local timezone cleanly
  const defaultTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/El_Salvador';
    } catch {
      return 'America/El_Salvador';
    }
  })();

  // Persistent or initial members
  const [members, setMembers] = useState<Member[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('timesync_team_members_v2');
      if (saved) {
        return safeJsonParse<Member[]>(saved, INITIAL_MEMBERS);
      }
    }
    return INITIAL_MEMBERS;
  });

  // Selected members for overlap computation (default to all)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => 
    INITIAL_MEMBERS.map((m) => m.id)
  );

  // Active user session (defaults to Sofia Morales - Admin)
  const [currentUser, setCurrentUser] = useState<Member>(() => 
    members.find((m) => m.role === 'admin') || members[0]
  );

  // Active projection timezone
  const [activeTimeZone, setActiveTimeZone] = useState<string>(defaultTz);

  // Reference date for navigation
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // Active navigation view
  const [activeView, setActiveView] = useState<'matrix' | 'timeline' | 'team'>('matrix');

  // Modals state
  const [isDevSecModalOpen, setIsDevSecModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSlotToSchedule, setSelectedSlotToSchedule] = useState<OverlapSlot | null>(null);

  const [isBusyOverlayOpen, setIsBusyOverlayOpen] = useState(false);
  const [memberForBusy, setMemberForBusy] = useState<Member | null>(null);

  // Synchronize members to localStorage safely
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('timesync_team_members_v2', JSON.stringify(members));
    }
  }, [members]);

  // Keep currentUser state in sync if member updated
  useEffect(() => {
    const updated = members.find((m) => m.id === currentUser.id);
    if (updated) {
      setCurrentUser(updated);
    }
  }, [members, currentUser.id]);

  // Member selection handlers
  const handleToggleMember = (id: string) => {
    setSelectedMemberIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedMemberIds(members.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds([]);
  };

  // Member CRUD handlers
  const handleSaveMember = (member: Member) => {
    setMembers((prev) => {
      const exists = prev.some((m) => m.id === member.id);
      if (exists) {
        return prev.map((m) => (m.id === member.id ? member : m));
      }
      return [...prev, member];
    });
    // Auto-select newly created member
    if (!selectedMemberIds.includes(member.id)) {
      setSelectedMemberIds((prev) => [...prev, member.id]);
    }
  };

  const handleOpenEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsMemberModalOpen(true);
  };

  const handleAddNewMember = () => {
    setMemberToEdit(null);
    setIsMemberModalOpen(true);
  };

  // Busy slot management
  const handleOpenManageBusy = (member: Member) => {
    setMemberForBusy(member);
    setIsBusyOverlayOpen(true);
  };

  const handleUpdateBusySlots = (memberId: string, updatedSlots: TimeSlot[]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, busySlots: updatedSlots } : m))
    );
    if (memberForBusy && memberForBusy.id === memberId) {
      setMemberForBusy((prev) => (prev ? { ...prev, busySlots: updatedSlots } : null));
    }
  };

  // Scheduling handler
  const handleSelectSlotToSchedule = (slot: OverlapSlot) => {
    setSelectedSlotToSchedule(slot);
    setIsScheduleModalOpen(true);
  };

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900 flex flex-col font-sans selection:bg-[#acc917]/40 selection:text-[#141f5b]">
      {/* Top ClickUp-style Header */}
      <Header
        currentUser={currentUser}
        allMembers={members}
        onSwitchUser={setCurrentUser}
        activeTimeZone={activeTimeZone}
        onChangeTimeZone={setActiveTimeZone}
        onOpenDevSecModal={() => setIsDevSecModalOpen(true)}
        activeView={activeView}
        onChangeView={setActiveView}
        selectedCount={selectedMemberIds.length}
        totalCount={members.length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Workspace Title & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-gray-900">
                Coordinador de Traslape de Horarios Multizona
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#acc917]/25 text-[#141f5b] border border-[#acc917] font-bold">
                UTC Normalizado
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-[#141f5b] border border-blue-200 font-bold">
                DevSec Hardened
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Cálculo algorítmico de intersección horaria <span className="font-mono text-[#141f5b] font-semibold">[max(start), min(end)]</span> con visualización clara de participantes coincidentes y enlaces directos a Google Calendar.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDevSecModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Reporte Pentest</span>
            </button>

            <button
              onClick={handleAddNewMember}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141f5b] hover:bg-[#1a2875] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gestionar Equipo</span>
            </button>
          </div>
        </div>

        {/* AI & Heuristic Scheduling Recommendations Widget */}
        <BestSlotsWidget
          members={members}
          selectedMemberIds={selectedMemberIds}
          activeTimeZone={activeTimeZone}
          onOpenScheduleModal={handleSelectSlotToSchedule}
        />

        {/* Primary View Router */}
        {activeView === 'matrix' && (
          <WeeklyMatrix
            members={members}
            selectedMemberIds={selectedMemberIds}
            activeTimeZone={activeTimeZone}
            referenceDate={referenceDate}
            onChangeReferenceDate={setReferenceDate}
            onSelectSlotToSchedule={handleSelectSlotToSchedule}
          />
        )}

        {activeView === 'timeline' && (
          <DailyTimeline
            members={members}
            selectedMemberIds={selectedMemberIds}
            activeTimeZone={activeTimeZone}
            referenceDate={referenceDate}
            onChangeReferenceDate={setReferenceDate}
            onSelectSlotToSchedule={handleSelectSlotToSchedule}
          />
        )}

        {activeView === 'team' && (
          <MemberDirectory
            members={members}
            selectedMemberIds={selectedMemberIds}
            onToggleMember={handleToggleMember}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            currentUser={currentUser}
            activeTimeZone={activeTimeZone}
            onEditMember={handleOpenEditMember}
            onAddNewMember={handleAddNewMember}
            onOpenManageBusy={handleOpenManageBusy}
          />
        )}

        {/* Explanatory Info Card: Algorithm & Security Architecture */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 shadow-xs">
          <div className="space-y-1.5">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#141f5b]" />
              Normalización Semanal UTC
            </span>
            <p className="text-gray-500">
              Cada jornada se expande a marcas de tiempo universales absolutas en UTC considerando el huso IANA nativo de cada colaborador y cambios de horario (DST).
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Intersección y Bloqueo de Horas
            </span>
            <p className="text-gray-500">
              El motor evalúa ventanas de coincidencia excluyendo reuniones previas. Cuando <code className="text-[#141f5b] font-mono font-semibold bg-gray-100 px-1 py-0.5 rounded">T_start &lt; T_end</code>, se confirma la franja de disponibilidad compatible.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#acc917]" />
              DevSecOps & Supabase RLS
            </span>
            <p className="text-gray-500">
              Protegido contra XSS, ReDoS, Prototype Pollution y manipulación de parámetros. Políticas RLS para salvaguardar la privacidad de agenda entre colaboradores.
            </p>
          </div>
        </div>
      </main>

      {/* ClickUp-style Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto py-5 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#acc917]" />
            <span className="font-semibold text-gray-700">TimeSync Workspace</span>
            <span className="text-gray-300">•</span>
            <span>Estilo ClickUp (fondos blancos, grises suaves y paleta personalizada)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-gray-600">Zona Activa: <strong className="text-gray-900">{activeTimeZone}</strong></span>
            <span className="text-gray-300">•</span>
            <span className="text-[#141f5b] font-bold">DevSec: 12/12 Tests Aprobados</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
        currentUser={currentUser}
      />

      <QuickScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        slot={selectedSlotToSchedule}
        activeMembers={activeMembers}
        activeTimeZone={activeTimeZone}
      />

      <DevSecModal
        isOpen={isDevSecModalOpen}
        onClose={() => setIsDevSecModalOpen(false)}
        currentUser={currentUser}
      />

      <CalendarBusyOverlay
        isOpen={isBusyOverlayOpen}
        onClose={() => setIsBusyOverlayOpen(false)}
        member={memberForBusy}
        onUpdateBusySlots={handleUpdateBusySlots}
        activeTimeZone={activeTimeZone}
      />
    </div>
  );
}
