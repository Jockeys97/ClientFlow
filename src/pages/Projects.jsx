import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import SearchInput from '../components/SearchInput.jsx';
import Select from '../components/Select.jsx';
import Skeleton from '../components/Skeleton.jsx';
import DetailModal from '../components/DetailModal.jsx';
import { ensureAllDataLoaded, createProject, deleteProject } from '../services/api.js';
import { downloadCsv } from '../utils/csv.js';
import { includesAll } from '../utils/filters.js';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [client, setClient] = useState('');
  const [sort, setSort] = useState({ key: 'title', direction: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    ensureAllDataLoaded(controller)
      .then((d) => {
        setClients(d.clients);
        setProjects(d.projects);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Apply pre-filter if query contains clientId or clientName
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientIdParam = params.get('clientId');
    const clientNameParam = params.get('clientName');
    if (clientIdParam) {
      setClient(clientIdParam);
      setPage(1);
    } else if (clientNameParam) {
      const match = clients.find((c) => c.name === clientNameParam);
      if (match) {
        setClient(match.id);
        setPage(1);
      }
    }
  }, [location.search, clients]);

  const filtered = useMemo(() => {
    let res = projects;
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      res = res.filter((p) => includesAll(`${p.title} ${p.description}`, terms));
    }
    if (client) res = res.filter((p) => String(p.clientId) === client);
    res = [...res].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      return a[sort.key].localeCompare(b[sort.key]) * dir;
    });
    return res;
  }, [projects, query, client, sort]);

  const total = filtered.length;
  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  // New Project modal state
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', clientId: '' });
  const [formError, setFormError] = useState('');

  async function handleCreateProject(e) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || !form.clientId) {
      setFormError('Titolo e Cliente sono obbligatori');
      return;
    }
    try {
      const created = await createProject({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        clientId: form.clientId,
        status: 'ACTIVE',
      });
      setProjects((prev) => [created, ...prev]);
      setIsNewOpen(false);
      setForm({ title: '', description: '', clientId: '' });
    } catch (err) {
      setFormError(err.message);
    }
  }

  function exportCsv() {
    const rows = filtered.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      clientId: p.clientId,
      createdAt: p.createdAt || '',
      status: p.status || '',
      budget: p.budget ?? '',
    }));
    downloadCsv('projects.csv', rows);
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
        <Select value={client} onChange={(v) => { setClient(v); setPage(1); }} ariaLabel="Filtro cliente">
          <option value="">Tutti i clienti</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <button className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={exportCsv}>Esporta CSV</button>
        <button className="ml-auto px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsNewOpen(true)}>
          Nuovo progetto
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: 'Titolo', sortable: true },
          { key: 'description', header: 'Descrizione' },
          { key: 'clientId', header: 'Cliente', render: (v) => clients.find((c) => c.id === v)?.name || '—' },
          { key: 'actions', header: '', className: 'text-right', render: (_, row) => (
            <button
              className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Eliminare il progetto "${row.title}"?`)) return;
                try {
                  await deleteProject(row.id);
                  setProjects((prev) => prev.filter((p) => p.id !== row.id));
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
        onRowClick={(row) => navigate(`/projects/${row.id}`)}
        pagination={{ page, pageSize, total, onPageChange: setPage }}
      />

      <DetailModal title="Nuovo Progetto" isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}>
        <form onSubmit={handleCreateProject} className="space-y-3">
          {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-sm">Titolo *</label>
              <input id="title" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="clientId" className="text-sm">Cliente *</label>
              <select id="clientId" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} required>
                <option value="">Seleziona cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm">Descrizione</label>
            <textarea id="description" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" rows="3" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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


