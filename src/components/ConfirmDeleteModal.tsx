import React from 'react';
import { Trash2, X, ShieldCheck } from 'lucide-react';
import { Member } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  membersToDelete: Member[];
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  membersToDelete,
  isDeleting = false
}) => {
  if (!isOpen || membersToDelete.length === 0) return null;

  const count = membersToDelete.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900">
            {count === 1
              ? `¿Eliminar a ${membersToDelete[0].firstName} ${membersToDelete[0].lastName}?`
              : `¿Eliminar a los ${count} colaboradores seleccionados?`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Esta acción eliminará de forma permanente a estos colaboradores de la base de datos en la nube y del espacio de trabajo.
          </p>
        </div>

        {/* Member preview list */}
        <div className="max-h-44 overflow-y-auto bg-gray-50 rounded-xl p-2.5 space-y-2 border border-gray-100">
          {membersToDelete.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 text-xs bg-white p-1.5 rounded-lg border border-gray-200/60 shadow-2xs">
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl}
                  alt={m.firstName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#141f5b] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  {m.firstName[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-gray-800 block truncate">
                  {m.firstName} {m.lastName}
                </span>
                <span className="text-gray-400 font-mono text-[10px] block truncate">
                  {m.email}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>El usuario administrador está protegido y nunca puede ser eliminado.</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Borrando...' : 'Sí, borrar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
