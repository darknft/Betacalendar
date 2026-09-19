import React from 'react';
import { Member } from '../types';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { formatMeetingSlotsSummary } from '../utils/timeEngine';

interface SlotMemberItemProps {
  member: Member;
  isAvailable?: boolean;
}

export const SlotMemberItem: React.FC<SlotMemberItemProps> = ({ member, isAvailable = true }) => {
  const flag = COUNTRY_FLAG_MAP[member.country]?.flag || '🌐';

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
        isAvailable
          ? 'bg-white border border-gray-200 shadow-2xs hover:shadow-xs'
          : 'bg-gray-50/90 border border-gray-200/80 text-gray-400 opacity-70'
      }`}
      title={
        isAvailable
          ? `${member.firstName} ${member.lastName}: Disponible para reunión (${formatMeetingSlotsSummary(member)} en su zona)`
          : `${member.firstName} ${member.lastName}: No coincide en este horario`
      }
    >
      {/* Left: Avatar image and First + Last name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={`${member.firstName} ${member.lastName}`}
              referrerPolicy="no-referrer"
              className={`w-6 h-6 rounded-full object-cover shrink-0 shadow-2xs ${
                isAvailable ? 'border border-gray-200' : 'border border-gray-300 opacity-80'
              }`}
            />
          ) : (
            <div
              className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isAvailable ? 'bg-[#141f5b]' : 'bg-gray-400'
              }`}
            >
              {member.firstName[0]}
            </div>
          )}
        </div>
        <span
          className={`text-xs truncate leading-tight ${
            isAvailable ? 'font-semibold text-gray-800' : 'font-normal text-gray-500'
          }`}
        >
          {member.firstName} {member.lastName}
        </span>
      </div>

      {/* Right: Country flag */}
      <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
        <span className={`text-sm select-none leading-none ${!isAvailable ? 'opacity-60' : ''}`}>
          {flag}
        </span>
      </div>
    </div>
  );
};

