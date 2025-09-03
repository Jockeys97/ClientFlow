import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import SearchInput from '../components/SearchInput.jsx';
import Select from '../components/Select.jsx';
import Skeleton from '../components/Skeleton.jsx';
import DetailModal from '../components/DetailModal.jsx';
import Badge from '../components/Badge.jsx';
import { ensureAllDataLoaded, deleteTicket } from '../services/api.js';
import { includesAll } from '../utils/filters.js';
import { useDataStore } from '../store/useDataStore.js';
import { downloadCsv } from '../utils/csv.js';

export default function Tickets() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Note: clients loaded but not used directly in UI now. Keep for potential filters.
  const [clients, setClients] = useState([]); // eslint-disable-line no-unused-vars
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'title', direction: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedTicket, setSelectedTicket] = useState(null);
  const addLocalTicket = useDataStore((s) => s.addLocalTicket);

  useEffect(() => {
    const controller = new AbortController();
    ensureAllDataLoaded(controller)
      .then((d) => {
        setClients(d.clients);
        setProjects(d.projects);
        setTickets(d.tickets);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    let res = tickets;
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      res = res.filter((t) => includesAll(`${t.title || ''} ${t.description || ''}`, terms));
    }
    if (status) res = res.filter((t) => t.status === status);
    res = [...res].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      const aVal = a[sort.key] || '';
      const bVal = b[sort.key] || '';
      return aVal.toString().localeCompare(bVal.toString()) * dir;
    });
    return res;
  }, [tickets, query, status, sort]);

  const total = filtered.length;
  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', requester: '', projectId: '' });
  const [formError, setFormError] = useState('');

  function exportCsv() {
    const rows = filtered.map((t) => ({
      id: t.id,
      title: t.title || t.subject || '',
      requester: t.requester || '',
      project: t.project?.title || '',
      status: t.status || '',
      priority: t.priority || '',
      createdAt: t.createdAt || '',
    }));
    downloadCsv('tickets.csv', rows);
  }

  function handleCreateTicket(e) {
    e.preventDefault();
    setFormError('');
    if (!form.subject.trim() || !form.requester.trim() || !form.projectId) {
      setFormError('Compila tutti i campi');
      return;
    }
    const newTicket = {
      id: `local-${Date.now()}`,
      projectId: Number(form.projectId),
      subject: form.subject.trim(),
      requester: form.requester.trim(),
      description: '(Mock) creato localmente',
      status: 'open',
      createdAt: new Date(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    };
    addLocalTicket(newTicket);
    setTickets((prev) => [newTicket, ...prev]);
    setIsNewOpen(false);
    setForm({ subject: '', requester: '', projectId: '' });
  }

  if (loading) return <Skeleton className="h-72" />;
  if (error)
    return (
      <div className="card"><div className="card-body text-sm text-red-600">Errore: {String(error.message || error)}</div></div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Cerca titolo/descrizione" />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} ariaLabel="Filtro stato">
          <option value="">Tutti gli stati</option>
          <option value="OPEN">Aperti</option>
          <option value="IN_PROGRESS">In corso</option>
          <option value="RESOLVED">Risolti</option>
          <option value="CLOSED">Chiusi</option>
        </Select>
        <button className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={exportCsv}>Esporta CSV</button>
        <button className="ml-auto px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsNewOpen(true)}>
          Nuovo ticket
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: 'Titolo', sortable: true },
          { key: 'priority', header: 'Priorità', sortable: true, render: (v) => <Badge color={v === 'URGENT' ? 'red' : v === 'HIGH' ? 'orange' : 'gray'}>{v}</Badge> },
          { key: 'project', header: 'Progetto', render: (v) => v?.title || '—' },
          { key: 'status', header: 'Stato', render: (v) => <Badge color={v === 'OPEN' ? 'green' : v === 'IN_PROGRESS' ? 'blue' : 'gray'}>{v}</Badge> },
          { key: 'actions', header: '', className: 'text-right', render: (_, row) => (
            <button
              className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Eliminare il ticket "${row.title || row.subject}"?`)) return;
                try {
                  await deleteTicket(row.id);
                  setTickets((prev) => prev.filter((t) => t.id !== row.id));
                } catch (err) {
                  alert(`Errore: ${err.message}`);
                }
              }}
            >
              Elimina
            </button>
          ) },
        ]}
        data={pageData}
        sort={sort}
        onSort={(key, direction) => setSort({ key, direction })}
        onRowClick={(row) => setSelectedTicket(row)}
        pagination={{ page, pageSize, total, onPageChange: setPage }}
      />

      <DetailModal
        title="Dettaglio Ticket"
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      >
        {selectedTicket ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Titolo:</span> {selectedTicket.title}
            </div>
            <div>
              <span className="font-medium">Descrizione:</span> {selectedTicket.description || 'Nessuna descrizione'}
            </div>
            <div>
              <span className="font-medium">Progetto:</span> {selectedTicket.project?.title || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Stato:</span> <Badge color={selectedTicket.status === 'open' ? 'green' : 'gray'}>{selectedTicket.status}</Badge>
            </div>
            <p className="pt-2 whitespace-pre-line">{selectedTicket.description}</p>
          </div>
        ) : null}
      </DetailModal>

      <DetailModal title="Nuovo Ticket" isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}>
        <form onSubmit={handleCreateTicket} className="space-y-3">
          {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="subject" className="text-sm">Subject</label>
              <input id="subject" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="requester" className="text-sm">Requester Email</label>
              <input id="requester" type="email" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" value={form.requester} onChange={(e) => setForm((f) => ({ ...f, requester: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="project" className="text-sm">Progetto</label>
            <select id="project" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
              <option value="">Seleziona progetto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button type="submit" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Crea</button>
            <button type="button" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700" onClick={() => setIsNewOpen(false)}>Annulla</button>
          </div>
        </form>
      </DetailModal>
    </div>
  );
}


