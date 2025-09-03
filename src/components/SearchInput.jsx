import React from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Cerca…', className = '' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full sm:w-72 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-reply-500 focus:border-reply-500 ${className}`}
      aria-label="search"
    />
  );
}


