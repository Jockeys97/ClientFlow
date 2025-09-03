import React from 'react';

const colorMap = {
  green: 'bg-reply-100 text-reply-800 dark:bg-reply-900/40 dark:text-reply-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
};

export default function Badge({ color = 'gray', children }) {
  const klass = colorMap[color] || colorMap.gray;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${klass}`}>{children}</span>;
}


