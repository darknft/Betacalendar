import { Member } from '../types';

/**
 * Initial Team Members Dataset (All Female Team Members as in original app / image.png)
 */

const today = new Date();
const getFormattedDay = (offsetDays: number = 0) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return d.toISOString().substring(0, 10);
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'b56ea21f-11ca-4921-9988-2e34a1b2c890',
    auth_id: 'auth_usr_pamela_admin_02',
    firstName: 'Pamela',
    lastName: 'Medina',
    email: 'bpamelamedina@gmail.com',
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
      { start: '09:00', end: '12:00' },
      { start: '17:00', end: '23:00' }
    ],
    saturdaySlots: [],
    sundaySlots: [],
    role: 'admin',
    avatarSeed: 'pamela',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    busySlots: [],
    availableSlots: [
      {
        start: `${getFormattedDay(0)}T15:00:00Z`,
        end: `${getFormattedDay(0)}T18:00:00Z`,
        title: 'Ventana de reuniones'
      }
    ]
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    auth_id: 'auth_usr_sofia_member_01',
    firstName: 'Sofia',
    lastName: 'Aubone',
    email: 'aubonesofia@gmail.com',
    password: 'Guestlocal26@',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'ES',
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
    role: 'member',
    avatarSeed: 'sofia',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    busySlots: [],
    availableSlots: []
  },
  {
    id: 'usr_guillermina_01',
    auth_id: 'auth_usr_guillermina_01',
    firstName: 'Guillermina',
    lastName: 'Lazzari',
    email: 'guillerminalazzari@gmail.com',
    password: 'Guesttwo26@',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'AR',
    timeZone: 'America/Buenos_Aires',
    workStart: '08:00',
    workEnd: '17:00',
    meetingStart: '09:00',
    meetingEnd: '12:00',
    meetingSlots: [
      { start: '09:00', end: '12:00' }
    ],
    saturdaySlots: [],
    sundaySlots: [],
    role: 'member',
    avatarSeed: 'guillermina',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    busySlots: [],
    availableSlots: []
  },
  {
    id: 'usr_lara_02',
    auth_id: 'auth_usr_lara_02',
    firstName: 'Lara',
    lastName: 'Ferenandez',
    email: 'laratfernandez@gmail.com',
    password: 'Guestlspain26@',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'ES',
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
    role: 'member',
    avatarSeed: 'lara',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    busySlots: [],
    availableSlots: []
  },
  {
    id: 'usr_rebeca_03',
    auth_id: 'auth_usr_rebeca_03',
    firstName: 'Rebeca',
    lastName: 'Origel',
    email: 'rebecaorigel.m@gmail.com',
    password: 'Guestone26@',
    teamSpaceId: '7b8c2e1f-49a3-4812-9c3f-1d4e7a8b9c0d',
    type: 'INTERNAL',
    country: 'US',
    timeZone: 'America/Bogota',
    workStart: '08:00',
    workEnd: '17:00',
    meetingStart: '17:00',
    meetingEnd: '21:00',
    meetingSlots: [
      { start: '17:00', end: '21:00' }
    ],
    saturdaySlots: [
      { start: '09:00', end: '12:00' }
    ],
    sundaySlots: [],
    role: 'member',
    avatarSeed: 'rebeca',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    busySlots: [],
    availableSlots: []
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
