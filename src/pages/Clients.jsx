import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import SearchInput from '../components/SearchInput.jsx';
import Select from '../components/Select.jsx';
import Skeleton from '../components/Skeleton.jsx';
import DetailModal from '../components/DetailModal.jsx';
import { ensureAllDataLoaded, createClient, deleteClient } from '../services/api.js';
import { downloadCsv } from '../utils/csv.js';
import { includesAll } from '../utils/filters.js';
import { useNavigate } from 'react-router-dom';

export default function Clients() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    ensureAllDataLoaded(controller)
      .then((d) => setClients(d.clients))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    let res = clients;
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      res = res.filter((c) => includesAll(`${c.name} ${c.email} ${c.company}`, terms));
    }
    if (city) res = res.filter((c) => c.city === city);
    res = [...res].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      return a[sort.key].localeCompare(b[sort.key]) * dir;
    });
    return res;
  }, [clients, query, city, sort]);

  const total = filtered.length;
  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const cities = useMemo(() => Array.from(new Set(clients.map((c) => c.city))), [clients]);

  function exportCsv() {
    const rows = filtered.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company,
      city: c.city || '',
      phone: c.phone || '',
      createdAt: c.createdAt || '',
    }));
    downloadCsv('clients.csv', rows);
  }

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', city: '', phone: '', address: '' });
  const [formError, setFormError] = useState('');

  async function handleCreateClient(e) {
    e.preventDefault();
    setFormError('');
    
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      setFormError('Nome, email e azienda sono obbligatori');
      return;
    }

    try {
      const newClient = await createClient({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        city: form.city.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setClients((prev) => [newClient, ...prev]);
      setIsNewOpen(false);
      setForm({ name: '', email: '', company: '', city: '', phone: '', address: '' });
    } catch (error) {
      setFormError(error.message);
    }
  }

  if (loading) return <Skeleton className="h-72" />;
  if (error)
    return (
      <div className="card"><div className="card-body text-sm text-red-600">Errore: {String(error.message || error)}</div></div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Cerca nome/email/company" />
        <Select value={city} onChange={(v) => { setCity(v); setPage(1); }} ariaLabel="Filtro città">
          <option value="">Tutte le città</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <button className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={exportCsv}>Esporta CSV</button>
        <button className="ml-auto px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsNewOpen(true)}>
          Nuovo cliente
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Nome', sortable: true },
          { key: 'email', header: 'Email' },
          { key: 'company', header: 'Azienda' },
          { key: 'city', header: 'Città', sortable: true },
          { key: 'actions', header: '', className: 'text-right', render: (_, row) => (
            <button
              className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`Eliminare il cliente "${row.name}"?`)) return;
                try {
                  await deleteClient(row.id);
                  setClients((prev) => prev.filter((c) => c.id !== row.id));
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
        onRowClick={(row) => navigate(`/clients/${row.id}`)}
        pagination={{ page, pageSize, total, onPageChange: setPage }}
      />

      <DetailModal title="Nuovo Cliente" isOpen={isNewOpen} onClose={() => setIsNewOpen(false)}>
        <form onSubmit={handleCreateClient} className="space-y-3">
          {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm">Nome *</label>
              <input 
                id="name" 
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" 
                value={form.name} 
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm">Email *</label>
              <input 
                id="email" 
                type="email" 
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" 
                value={form.email} 
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                required
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="company" className="text-sm">Azienda *</label>
              <input 
                id="company" 
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" 
                value={form.company} 
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} 
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="city" className="text-sm">Città</label>
              <input 
                id="city" 
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" 
                value={form.city} 
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} 
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="phone" className="text-sm">Telefono</label>
              <input 
                id="phone" 
                type="tel" 
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" 
                value={form.phone} 
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="address" className="text-sm">Indirizzo</label>
              <input 
                id="address" 
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" 
                value={form.address} 
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} 
              />
            </div>
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


