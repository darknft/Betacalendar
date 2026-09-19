import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  MemberDirectory 
} from './components/MemberDirectory';
import { 
  GanttWeeklyView 
} from './components/GanttWeeklyView';
import { 
  GanttDailyView 
} from './components/GanttDailyView';
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
  AuthModal 
} from './components/AuthModal';
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
  CheckCircle2,
  CalendarRange,
  CalendarDays,
  KeyRound
} from 'lucide-react';
import { safeJsonParse } from './utils/security';
import { 
  testFirestoreConnection, 
  subscribeToMembers, 
  saveMemberToFirestore, 
  updateMemberBusySlotsInFirestore,
  deleteMemberFromFirestore,
  deleteMultipleMembersFromFirestore
} from './lib/firebase';

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
      const saved = localStorage.getItem('timesync_team_members_v4');
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
  const [currentUser, setCurrentUser] = useState<Member | null>(() => 
    members.find((m) => m.role === 'admin') || members[0]
  );

  // Active projection timezone
  const [activeTimeZone, setActiveTimeZone] = useState<string>(
    currentUser?.timeZone || defaultTz
  );

  // Reference date for navigation
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // ONLY TWO MAIN TABS AS REQUESTED: 'gantt' and 'team'
  const [activeTab, setActiveTab] = useState<'gantt' | 'team'>('gantt');

  // For Gantt view: only two sub-views: 'semanal' and 'diaria'
  const [ganttSubView, setGanttSubView] = useState<'semanal' | 'diaria'>('semanal');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDevSecModalOpen, setIsDevSecModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSlotToSchedule, setSelectedSlotToSchedule] = useState<OverlapSlot | null>(null);

  const [isBusyOverlayOpen, setIsBusyOverlayOpen] = useState(false);
  const [memberForBusy, setMemberForBusy] = useState<Member | null>(null);

  // Cloud Sync Status: 'synced' | 'syncing' | 'offline'
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // Toast notification for timezone or login feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize members to localStorage as resilient offline cache
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('timesync_team_members_v4', JSON.stringify(members));
    }
  }, [members]);

  // Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    let isMounted = true;

    // Test connection on startup
    testFirestoreConnection().catch(() => {});

    // Listen to real-time changes from any teammate
    const unsubscribe = subscribeToMembers(
      (cloudMembers) => {
        if (!isMounted) return;
        if (cloudMembers && cloudMembers.length > 0) {
          setMembers(cloudMembers);
          setCloudSyncStatus('synced');
        }
      },
      (err) => {
        if (!isMounted) return;
        console.warn('Firestore offline/fallback:', err);
        setCloudSyncStatus('offline');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Keep currentUser state in sync if member updated
  useEffect(() => {
    if (currentUser) {
      const updated = members.find((m) => m.id === currentUser.id);
      if (updated) {
        setCurrentUser(updated);
      }
    }
  }, [members, currentUser?.id]);

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

  // Member CRUD handlers (with Cloud Firestore Persistence)
  const handleSaveMember = async (member: Member) => {
    // Optimistic local state update
    setMembers((prev) => {
      const exists = prev.some((m) => m.id === member.id);
      if (exists) {
        return prev.map((m) => (m.id === member.id ? member : m));
      }
      return [...prev, member];
    });

    // If the saved member is the current user, update active timezone
    if (currentUser?.id === member.id) {
      setCurrentUser(member);
      setActiveTimeZone(member.timeZone);
      showToast(`Perfil sincronizado en la nube. Proyectando en tu zona: ${member.timeZone}`);
    } else {
      showToast(`Datos del colaborador ${member.firstName} guardados y sincronizados.`);
    }

    // Auto-select newly created member
    if (!selectedMemberIds.includes(member.id)) {
      setSelectedMemberIds((prev) => [...prev, member.id]);
    }

    // Write to Firebase Firestore in background
    try {
      setCloudSyncStatus('syncing');
      await saveMemberToFirestore(member);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Error saving to cloud Firestore:', err);
      showToast('Guardado localmente. Se sincronizará cuando se restablezca la conexión.');
      setCloudSyncStatus('offline');
    }
  };

  const handleOpenEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsMemberModalOpen(true);
  };

  const handleOpenMyProfile = () => {
    if (currentUser) {
      setMemberToEdit(currentUser);
      setIsMemberModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAddNewMember = () => {
    setMemberToEdit(null);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member?.role === 'admin') {
      showToast('El usuario Administrador está protegido y no puede ser eliminado.');
      return;
    }

    const memberName = member ? `${member.firstName} ${member.lastName}` : 'Colaborador';

    // Optimistically remove from state
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setSelectedMemberIds((prev) => prev.filter((id) => id !== memberId));

    if (currentUser?.id === memberId) {
      const remaining = members.filter((m) => m.id !== memberId);
      setCurrentUser(remaining.length > 0 ? remaining[0] : null);
    }

    showToast(`${memberName} ha sido eliminado.`);

    try {
      setCloudSyncStatus('syncing');
      await deleteMemberFromFirestore(memberId);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting member from Firestore:', err);
      showToast('Error al sincronizar eliminación en la nube.');
      setCloudSyncStatus('offline');
    }
  };

  const handleDeleteMultipleMembers = async (memberIds: string[]) => {
    // Filter out any admin members to guarantee admin protection
    const safeIdsToDelete = memberIds.filter((id) => {
      const m = members.find((mem) => mem.id === id);
      return m && m.role !== 'admin';
    });

    if (safeIdsToDelete.length === 0) {
      showToast('Los usuarios con rol Administrador están protegidos y no pueden ser eliminados.');
      return;
    }

    // Optimistically update state
    setMembers((prev) => prev.filter((m) => !safeIdsToDelete.includes(m.id)));
    setSelectedMemberIds((prev) => prev.filter((id) => !safeIdsToDelete.includes(id)));

    if (currentUser && safeIdsToDelete.includes(currentUser.id)) {
      const remaining = members.filter((m) => !safeIdsToDelete.includes(m.id));
      setCurrentUser(remaining.length > 0 ? remaining[0] : null);
    }

    showToast(
      safeIdsToDelete.length === 1
        ? 'Colaborador eliminado correctamente.'
        : `${safeIdsToDelete.length} colaboradores eliminados correctamente.`
    );

    try {
      setCloudSyncStatus('syncing');
      await deleteMultipleMembersFromFirestore(safeIdsToDelete);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting members from Firestore:', err);
      showToast('Error al sincronizar eliminación en la nube.');
      setCloudSyncStatus('offline');
    }
  };

  // Auth handlers
  const handleLogin = (member: Member) => {
    setCurrentUser(member);
    setActiveTimeZone(member.timeZone);
    showToast(`¡Hola ${member.firstName}! Visualizando el calendario en tu hora local: ${member.timeZone}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente.');
  };

  // Busy slot management
  const handleOpenManageBusy = (member: Member) => {
    setMemberForBusy(member);
    setIsBusyOverlayOpen(true);
  };

  const handleUpdateBusySlots = async (memberId: string, updatedSlots: TimeSlot[]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, busySlots: updatedSlots } : m))
    );
    if (memberForBusy && memberForBusy.id === memberId) {
      setMemberForBusy((prev) => (prev ? { ...prev, busySlots: updatedSlots } : null));
    }
    showToast('Bloqueos de agenda sincronizados.');

    try {
      setCloudSyncStatus('syncing');
      await updateMemberBusySlotsInFirestore(memberId, updatedSlots);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Error updating busy slots in Firestore:', err);
      setCloudSyncStatus('offline');
    }
  };

  // Scheduling handler (opens Google Calendar / Quick schedule modal)
  const handleSelectSlotToSchedule = (slot: OverlapSlot) => {
    setSelectedSlotToSchedule(slot);
    setIsScheduleModalOpen(true);
  };

  const activeMembers = members.filter((m) => selectedMemberIds.includes(m.id));

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900 flex flex-col font-sans selection:bg-[#acc917]/40 selection:text-[#141f5b]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#141f5b] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 border border-[#acc917]/30">
          <CheckCircle2 className="w-4 h-4 text-[#acc917] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header with 2 Tabs and Member Authentication */}
      <Header
        currentUser={currentUser}
        allMembers={members}
        onSwitchUser={handleLogin}
        activeTimeZone={activeTimeZone}
        onChangeTimeZone={setActiveTimeZone}
        onOpenDevSecModal={() => setIsDevSecModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenMyProfile={handleOpenMyProfile}
        onLogout={handleLogout}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        ganttSubView={ganttSubView}
        onChangeGanttSubView={setGanttSubView}
        selectedCount={selectedMemberIds.length}
        totalCount={members.length}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Workspace Quick Actions & Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-gray-900">
                {activeTab === 'gantt' 
                  ? `Vista Gantt - ${ganttSubView === 'semanal' ? 'Calendario Semanal' : 'Calendario Diario'}`
                  : 'Directorio de Equipo y Preferencias'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#acc917]/25 text-[#141f5b] border border-[#acc917] font-bold">
                12h AM/PM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-[#141f5b] border border-blue-200 font-bold">
                Zona: {activeTimeZone.split('/')[1] || activeTimeZone}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Visualización con avatares, banderas y coincidencias de disponibilidad. Verde: todos coinciden. Amarillo: 1 miembro en discrepancia (borde rojo). Borde rojo: nadie coincide.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser && (
              <button
                onClick={handleOpenMyProfile}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-[#141f5b] transition-colors cursor-pointer shadow-2xs"
              >
                <span>Editar Mi Horario</span>
              </button>
            )}

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#141f5b]" />
              <span>Acceso de Miembros</span>
            </button>
          </div>
        </div>

        {/* TAB 1: VISTA GANTT (with Semanal & Diaria sub-views) */}
        {activeTab === 'gantt' && (
          <div className="space-y-4">
            {/* View Switcher Controls Bar */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2 px-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tipo de Vista:
                </span>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                  <button
                    onClick={() => setGanttSubView('semanal')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      ganttSubView === 'semanal'
                        ? 'bg-[#141f5b] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    <span>Semanal (Lunes 14, Martes 15...)</span>
                  </button>
                  <button
                    onClick={() => setGanttSubView('diaria')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      ganttSubView === 'diaria'
                        ? 'bg-[#141f5b] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Diaria (Horas AM/PM)</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 hidden sm:block">
                Mostrando horas en formato <strong>12 Horas (AM / PM)</strong>
              </div>
            </div>

            {/* Render Weekly Calendar View */}
            {ganttSubView === 'semanal' && (
              <GanttWeeklyView
                members={members}
                selectedMemberIds={selectedMemberIds}
                activeTimeZone={activeTimeZone}
                referenceDate={referenceDate}
                onChangeReferenceDate={setReferenceDate}
                onSelectSlotToSchedule={handleSelectSlotToSchedule}
              />
            )}

            {/* Render Daily Calendar View */}
            {ganttSubView === 'diaria' && (
              <GanttDailyView
                members={members}
                selectedMemberIds={selectedMemberIds}
                activeTimeZone={activeTimeZone}
                referenceDate={referenceDate}
                onChangeReferenceDate={setReferenceDate}
                onSelectSlotToSchedule={handleSelectSlotToSchedule}
              />
            )}
          </div>
        )}

        {/* TAB 2: EQUIPO (with Recomendación Inteligente container & Team Directory) */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* As requested: "borra la Matriz Semanal de translape de esto solo conservaras el contenedor de Recomendación Inteligente de Traslape que deberas moverlo a la tab de Vista Custom en vez de Vista Gantt." */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#acc917]" />
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">
                  Recomendación Inteligente de Traslape
                </h3>
              </div>

              <BestSlotsWidget
                members={members}
                selectedMemberIds={selectedMemberIds}
                activeTimeZone={activeTimeZone}
                onOpenScheduleModal={handleSelectSlotToSchedule}
              />
            </div>

            {/* Member Directory and Schedule Management */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">
                  Colaboradores del Equipo y Credenciales de Acceso
                </h3>
              </div>

              <MemberDirectory
                members={members}
                selectedMemberIds={selectedMemberIds}
                onToggleMember={handleToggleMember}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                currentUser={currentUser || members[0]}
                activeTimeZone={activeTimeZone}
                onEditMember={handleOpenEditMember}
                onAddNewMember={handleAddNewMember}
                onOpenManageBusy={handleOpenManageBusy}
                onDeleteMembers={handleDeleteMultipleMembers}
              />
            </div>
          </div>
        )}

        {/* Legend / Status Helper Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">Verde: Coincidencia Total</span>
              <p className="text-gray-500 text-[11px]">
                Todos los colaboradores seleccionados están disponibles. Permite agendar reunión de inmediato en Google Calendar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-amber-100 border border-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">Amarillo: 1 Discrepancia</span>
              <p className="text-gray-500 text-[11px]">
                Exactamente 1 miembro no coincide en la franja. Ese miembro se destaca con borde rojo en su ficha.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-red-50 border-2 border-red-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">Borde Rojo: Sin Coincidencia</span>
              <p className="text-gray-500 text-[11px]">
                Ningún miembro está disponible en este horario o la franja queda totalmente descalificada.
              </p>
            </div>
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
            <span>Diseño tipo calendario con formato 12 Horas AM/PM y avatares</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-gray-600">Zona Activa: <strong className="text-gray-900">{activeTimeZone}</strong></span>
            <span className="text-gray-300">•</span>
            <span className="text-[#141f5b] font-bold">DevSec: Verificado</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        members={members}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        memberToEdit={memberToEdit}
        currentUser={currentUser || members[0]}
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
        currentUser={currentUser || members[0]}
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
