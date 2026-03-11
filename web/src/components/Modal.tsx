'use client';

import React from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function Modal({ open, title, message, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-panel border border-dark-border rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 text-lg leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">
          {children ? children : (
            <p className="text-sm text-gray-200 whitespace-pre-line">{message}</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-dark-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-role-citizen text-dark-main text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

