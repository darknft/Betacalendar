export type MemberType = 'INTERNAL' | 'EXTERNAL';

export interface TimeSlot {
  start: string; // ISO 8601 UTC string (ej. "2026-09-15T14:00:00Z")
  end: string;   // ISO 8601 UTC string
  title?: string;
  source?: 'manual' | 'google_calendar' | 'system';
}

export interface MeetingSlot {
  id?: string;
  start: string; // Formato 24h "HH:mm" (ej. "08:00" o "17:00")
  end: string;   // Formato 24h "HH:mm" (ej. "09:00" o "22:00")
}

export interface Member {
  id: string;          // UUID v4
  auth_id: string;     // Supabase Auth User UID
  firstName: string;   // Requerido
  lastName: string;    // Requerido
  email: string;       // Requerido
  password?: string;   // Clave de acceso para login
  teamSpaceId: string; // UUID v4
  type: MemberType;
  country: string;     // ISO 2 (ej. "SV", "ES", "US", "JP", "CO")
  timeZone: string;    // Identificador IANA (ej. "America/El_Salvador")
  workStart: string;   // Formato 24h "HH:mm" (ej. "08:00")
  workEnd: string;     // Formato 24h "HH:mm" (ej. "17:00")
  meetingStart?: string; // Formato 24h "HH:mm" - Horas libres para reunirse (ej. "09:00")
  meetingEnd?: string;   // Formato 24h "HH:mm" - Horas libres para reunirse (ej. "12:00")
  meetingSlots?: MeetingSlot[]; // Múltiples franjas/slots libres para reuniones
  busySlots: TimeSlot[];
  availableSlots: TimeSlot[];
  role?: 'admin' | 'member' | 'guest';
  avatarSeed?: string;
  avatarUrl?: string;
}

export interface UserSession {
  user: Member;
  token: string;
  isAdmin: boolean;
}

export interface OverlapSlot {
  isoUTC: string;
  localTime: string;      // "HH:mm" in user local timezone
  localHour: number;
  localMinute: number;
  availableMemberIds: string[];
  totalSelected: number;
  percentage: number;     // 0 - 100
  isFullOverlap: boolean; // all selected members available
  dateKey: string;        // "YYYY-MM-DD"
}

export interface OverlapWindow {
  id: string;
  startUTC: string;
  endUTC: string;
  startLocalFormatted: string;
  endLocalFormatted: string;
  durationMinutes: number;
  dayName: string;
  dateStr: string;
  participantIds: string[];
  coverageRatio: number; // 1.0 = 100%
  fatigueScore: number;  // Lower is better (avoids early morning or late night for participants)
}

export interface SecurityTestResult {
  id: string;
  category: 'XSS_SANITIZATION' | 'REDOS_PROTECTION' | 'PROTOTYPE_POLLUTION' | 'RLS_AUTHORIZATION' | 'PATH_TRAVERSAL' | 'SECRET_LEAK';
  name: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  durationMs: number;
  payloadUsed?: string;
  outputObserved: string;
  complianceDoc: string;
}

export interface PentestVectorReport {
  id: string;
  vector: string;
  description: string;
  simulatedPayload: string;
  outcome: 'NEUTRALIZED' | 'BLOCKED_BY_WAF' | 'REJECTED_BY_SCHEMA';
  defenseMechanism: string;
  riskRating: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
