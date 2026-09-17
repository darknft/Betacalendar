import React from 'react';
import { Member } from '../types';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { formatMeetingSlotsSummary } from '../utils/timeEngine';

interface SlotMemberItemProps {
  member: Member;
  isAvailable: boolean;
}

export const SlotMemberItem: React.FC<SlotMemberItemProps> = ({ member, isAvailable }) => {
  const flag = COUNTRY_FLAG_MAP[member.country]?.flag || '🌐';

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all shadow-2xs ${
        !isAvailable
          ? 'border-2 border-red-500 bg-red-50/90 text-gray-900 shadow-xs'
          : 'border border-gray-200/90 bg-white text-gray-800 hover:border-gray-300'
      }`}
      title={
        isAvailable
          ? `${member.firstName} ${member.lastName}: Disponible para reunión (${formatMeetingSlotsSummary(member)} en su zona)`
          : `${member.firstName} ${member.lastName}: No coincide / Fuera de horario o en reunión`
      }
    >
      {/* Left: Avatar image and First + Last name */}
      <div className="flex items-center gap-2 min-w-0">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={`${member.firstName} ${member.lastName}`}
            referrerPolicy="no-referrer"
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0 border border-gray-200 shadow-2xs"
          />
        ) : (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#141f5b] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {member.firstName[0]}
          </div>
        )}
        <span className="text-[11px] font-semibold text-gray-900 truncate leading-tight">
          {member.firstName} {member.lastName}
        </span>
      </div>

      {/* Right: Country flag */}
      <span className="text-sm shrink-0 ml-1.5 select-none leading-none">
        {flag}
      </span>
    </div>
  );
};
