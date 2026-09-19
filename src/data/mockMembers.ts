import { Member } from '../types';

/**
 * Initial Team Members Dataset (5 team members according to spec)
 * Contains realistic timezones, working hours, and sample busy/available slots.
 */

// Helper to get today's date formatted as YYYY-MM-DD
const today = new Date();
const getFormattedDay = (offsetDays: number = 0) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return d.toISOString().substring(0, 10);
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    auth_id: 'auth_usr_sofia_admin_01',
    firstName: 'Sofía',
    lastName: 'Morales',
    email: 'sofia.morales@team.internal',
    password: 'password123',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'SV',
    timeZone: 'America/El_Salvador',
    workStart: '08:00',
    workEnd: '17:00',
    meetingStart: '09:00',
    meetingEnd: '12:00',
    meetingSlots: [
      { start: '09:00', end: '12:00' }
    ],
    saturdaySlots: [],
    sundaySlots: [],
    role: 'admin',
    avatarSeed: 'sofia',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    busySlots: [
      {
        start: `${getFormattedDay(0)}T15:00:00Z`, // 09:00 AM SV
        end: `${getFormattedDay(0)}T16:00:00Z`,   // 10:00 AM SV
        title: 'Daily Standup & Sync',
        source: 'google_calendar'
      },
      {
        start: `${getFormattedDay(1)}T17:00:00Z`,
        end: `${getFormattedDay(1)}T18:00:00Z`,
        title: 'Architecture Review',
        source: 'manual'
      }
    ],
    availableSlots: [
      {
        start: `${getFormattedDay(0)}T16:00:00Z`,
        end: `${getFormattedDay(0)}T21:00:00Z`,
        title: 'Espacio abierto para sincronizaciones'
      }
    ]
  },
  {
    id: 'b56ea21f-11ca-4921-9988-2e34a1b2c890',
    auth_id: 'auth_usr_pamela_member_02',
    firstName: 'Pamela',
    lastName: 'Medina',
    email: 'bpamelamedina@gmail.com',
    password: 'password123',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'SV',
    timeZone: 'America/El_Salvador',
    workStart: '09:00',
    workEnd: '18:00',
    meetingStart: '08:00',
    meetingEnd: '22:00',
    meetingSlots: [
      { start: '08:00', end: '09:00' },
      { start: '10:00', end: '12:00' },
      { start: '17:00', end: '22:00' }
    ],
    saturdaySlots: [
      { start: '10:00', end: '12:00' }
    ],
    sundaySlots: [],
    role: 'member',
    avatarSeed: 'pamela',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    busySlots: [
      {
        start: `${getFormattedDay(0)}T18:00:00Z`, // 12:00 PM SV
        end: `${getFormattedDay(0)}T19:00:00Z`,
        title: 'Sync Proyecto Core',
        source: 'google_calendar'
      }
    ],
    availableSlots: [
      {
        start: `${getFormattedDay(0)}T16:00:00Z`,
        end: `${getFormattedDay(0)}T19:00:00Z`,
        title: 'Ventana de reuniones y sincronizaciones'
      }
    ]
  },
  {
    id: 'c89fa34b-44fa-4621-8201-9a13b6e8d504',
    auth_id: 'auth_usr_karla_member_03',
    firstName: 'Karla',
    lastName: 'Gómez',
    email: 'karla.gomez@team.internal',
    password: 'password123',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'MX',
    timeZone: 'America/Mexico_City',
    workStart: '09:00',
    workEnd: '17:00',
    meetingStart: '10:00',
    meetingEnd: '12:00',
    meetingSlots: [
      { start: '10:00', end: '12:00' }
    ],
    saturdaySlots: [],
    sundaySlots: [],
    role: 'member',
    avatarSeed: 'karla',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    busySlots: [
      {
        start: `${getFormattedDay(1)}T19:00:00Z`,
        end: `${getFormattedDay(1)}T20:00:00Z`,
        title: 'UX Review Sprint',
        source: 'google_calendar'
      }
    ],
    availableSlots: [
      {
        start: `${getFormattedDay(0)}T16:00:00Z`,
        end: `${getFormattedDay(0)}T18:00:00Z`,
        title: 'Horas disponibles para coordinar'
      }
    ]
  },
  {
    id: 'd12ab78d-12ab-4903-a341-8c45d9e2f671',
    auth_id: 'auth_usr_denisse_member_04',
    firstName: 'Denisse',
    lastName: 'Alvarado',
    email: 'denisse.alvarado@team.internal',
    password: 'password123',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'SV',
    timeZone: 'America/El_Salvador',
    workStart: '08:30',
    workEnd: '17:30',
    meetingStart: '10:00',
    meetingEnd: '14:00',
    meetingSlots: [
      { start: '10:00', end: '14:00' }
    ],
    saturdaySlots: [
      { start: '15:00', end: '17:00' }
    ],
    sundaySlots: [],
    role: 'member',
    avatarSeed: 'denisse',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    busySlots: [
      {
        start: `${getFormattedDay(0)}T20:00:00Z`,
        end: `${getFormattedDay(0)}T21:00:00Z`,
        title: 'QA Gate Validation',
        source: 'manual'
      }
    ],
    availableSlots: [
      {
        start: `${getFormattedDay(0)}T17:00:00Z`,
        end: `${getFormattedDay(0)}T20:00:00Z`,
        title: 'Disponibilidad para pruebas y sync'
      }
    ]
  },
  {
    id: 'e12bc30a-91ff-4832-b712-4f81a7b1c312',
    auth_id: 'auth_usr_carlos_member_05',
    firstName: 'Carlos',
    lastName: 'Méndez',
    email: 'carlos.mendez@team.internal',
    password: 'password123',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'ES',
    timeZone: 'Europe/Madrid',
    workStart: '09:00',
    workEnd: '19:00',
    meetingStart: '15:00',
    meetingEnd: '19:00',
    meetingSlots: [
      { start: '15:00', end: '19:00' }
    ],
    saturdaySlots: [],
    sundaySlots: [],
    role: 'member',
    avatarSeed: 'carlos',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    busySlots: [
      {
        start: `${getFormattedDay(0)}T13:00:00Z`, // 15:00 Madrid
        end: `${getFormattedDay(0)}T14:00:00Z`,   // 16:00 Madrid
        title: 'Sprint Planning (EU)',
        source: 'google_calendar'
      },
      {
        start: `${getFormattedDay(2)}T10:00:00Z`,
        end: `${getFormattedDay(2)}T11:30:00Z`,
        title: 'Client Demo',
        source: 'google_calendar'
      }
    ],
    availableSlots: [
      {
        start: `${getFormattedDay(0)}T14:00:00Z`,
        end: `${getFormattedDay(0)}T16:00:00Z`,
        title: 'Tarde disponible traslape LATAM'
      }
    ]
  }
];

export const COMMON_TIMEZONES = [
  { label: 'America/El_Salvador (UTC-6) - San Salvador', value: 'America/El_Salvador' },
  { label: 'America/Bogota (UTC-5) - Bogotá / Lima', value: 'America/Bogota' },
  { label: 'America/Mexico_City (UTC-6) - Ciudad de México', value: 'America/Mexico_City' },
  { label: 'America/New_York (UTC-5 / UTC-4) - New York / Miami', value: 'America/New_York' },
  { label: 'America/Los_Angeles (UTC-8 / UTC-7) - San Francisco / Seattle', value: 'America/Los_Angeles' },
  { label: 'America/Buenos_Aires (UTC-3) - Buenos Aires', value: 'America/Buenos_Aires' },
  { label: 'America/Santiago (UTC-4 / UTC-3) - Santiago de Chile', value: 'America/Santiago' },
  { label: 'Europe/Madrid (UTC+1 / UTC+2) - Madrid / Barcelona', value: 'Europe/Madrid' },
  { label: 'Europe/London (UTC+0 / UTC+1) - Londres', value: 'Europe/London' },
  { label: 'Europe/Berlin (UTC+1 / UTC+2) - Berlín / París', value: 'Europe/Berlin' },
  { label: 'Asia/Tokyo (UTC+9) - Tokio', value: 'Asia/Tokyo' },
  { label: 'UTC (Universal Coordinated Time)', value: 'UTC' }
];

export const COUNTRY_FLAG_MAP: Record<string, { name: string; flag: string }> = {
  SV: { name: 'El Salvador', flag: '🇸🇻' },
  ES: { name: 'España', flag: '🇪🇸' },
  US: { name: 'Estados Unidos', flag: '🇺🇸' },
  CO: { name: 'Colombia', flag: '🇨🇴' },
  JP: { name: 'Japón', flag: '🇯🇵' },
  MX: { name: 'México', flag: '🇲🇽' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  CL: { name: 'Chile', flag: '🇨🇱' },
  DE: { name: 'Alemania', flag: '🇩🇪' },
  GB: { name: 'Reino Unido', flag: '🇬🇧' }
};
