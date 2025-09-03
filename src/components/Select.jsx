import React from 'react';

export default function Select({ value, onChange, children, className = '', ariaLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={`px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-reply-500 focus:border-reply-500 ${className}`}
    >
      {children}
    </select>
  );
}


