import React from 'react';

export default function KpiCard({ label, value, helper }) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
      </div>
    </section>
  );
}


