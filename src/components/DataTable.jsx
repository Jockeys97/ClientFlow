import React, { useMemo, useState } from 'react';

// columns: [{ key, header, render?, sortable?, className? }]
// data: array
// onSort(key, direction)
// onFilter(filters)
// onRowClick(row)
// pagination: { page, pageSize, total, onPageChange }

export default function DataTable({
  columns,
  data,
  sort,
  onSort,
  onRowClick,
  pagination,
  showFilterInput = false,
  filterQuery = '',
  onFilterQueryChange,
  filterFunction,
}) {
  const [dense, setDense] = useState(false);
  const { page, pageSize, total, onPageChange } = pagination || {};

  const filteredData = useMemo(() => {
    if (showFilterInput && filterFunction && filterQuery) {
      return data.filter((row) => filterFunction(row, filterQuery));
    }
    return data;
  }, [data, showFilterInput, filterFunction, filterQuery]);

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [pagination, total, pageSize]);

  const thPadding = dense ? 'py-2' : 'py-3';
  const tdPadding = dense ? 'py-2' : 'py-3';

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      {showFilterInput ? (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <input
            aria-label="Filtra"
            type="search"
            value={filterQuery}
            onChange={(e) => onFilterQueryChange && onFilterQueryChange(e.target.value)}
            placeholder="Filtra…"
            className="w-full sm:w-72 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-reply-500 focus:border-reply-500"
          />
        </div>
      ) : (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end">
          <button
            aria-label="Toggle density"
            className="px-2 py-1 rounded-md text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setDense((d) => !d)}
          >
            {dense ? 'Compatta: ON' : 'Compatta: OFF'}
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 ${thPadding} text-left text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 ${col.className || ''}`}
              >
                {col.sortable ? (
                  <button
                    className="inline-flex items-center gap-1 hover:underline text-reply-700 dark:text-reply-300"
                    onClick={() => {
                      const nextDir = sort?.key === col.key && sort?.direction === 'asc' ? 'desc' : 'asc';
                      onSort && onSort(col.key, nextDir);
                    }}
                  >
                    {col.header}
                    {sort?.key === col.key ? (
                      <span aria-hidden className="text-gray-400">{sort.direction === 'asc' ? '▲' : '▼'}</span>
                    ) : null}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-500">
                Nessun risultato
              </td>
            </tr>
          ) : (
            filteredData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 odd:bg-gray-50/40 dark:odd:bg-gray-800/40 cursor-pointer transition-colors"
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 ${tdPadding} text-sm ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination ? (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm">
          <div>
            Pagina {page} di {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


