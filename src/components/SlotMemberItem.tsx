import React from 'react';
import { Member } from '../types';
import { COUNTRY_FLAG_MAP } from '../data/mockMembers';
import { formatMeetingSlotsSummary } from '../utils/timeEngine';

interface SlotMemberItemProps {
  member: Member;
  isAvailable?: boolean;
}

export const SlotMemberItem: React.FC<SlotMemberItemProps> = ({ member }) => {
  const flag = COUNTRY_FLAG_MAP[member.country]?.flag || '🌐';

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-gray-150 shadow-2xs hover:shadow-xs transition-all"
      title={`${member.firstName} ${member.lastName}: Disponible para reunión (${formatMeetingSlotsSummary(member)} en su zona)`}
    >
      {/* Left: Avatar image and First + Last name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={`${member.firstName} ${member.lastName}`}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 shadow-2xs"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#141f5b] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {member.firstName[0]}
          </div>
        )}
        <span className="text-xs font-semibold text-gray-800 truncate leading-tight">
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

