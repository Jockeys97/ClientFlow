import React, { useEffect, useRef } from 'react';

export default function DetailModal({ title, isOpen, onClose, children }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <button
        type="button"
        aria-label="Chiudi"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div ref={dialogRef} className="relative z-10 card w-full max-w-2xl">
        <div className="card-header flex items-center justify-between">
          <h2 id="modal-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-reply-500"
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}


