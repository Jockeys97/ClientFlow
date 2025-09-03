import React, { useEffect, useMemo, useState } from 'react';
import KpiCard from '../components/KpiCard.jsx';
import ChartCard from '../components/ChartCard.jsx';
import { ensureAllDataLoaded } from '../services/api.js';
import { monthLabel } from '../utils/formatters.js';
import Skeleton from '../components/Skeleton.jsx';
import DetailModal from '../components/DetailModal.jsx';
import Badge from '../components/Badge.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    ensureAllDataLoaded(controller)
      .then((d) => {
        setClients(d.clients);
        setProjects(d.projects);
        setTickets(d.tickets);
        setError(null);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const kpis = useMemo(() => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => (t.status === 'open' || t.status === 'OPEN' || t.status === 'IN_PROGRESS')).length;
    return [
      { label: 'Clienti', value: clients.length },
      { label: 'Progetti', value: projects.length },
      { label: 'Ticket', value: totalTickets },
      {
        label: 'Ticket aperti',
        value: totalTickets ? Math.round((openTickets / totalTickets) * 100) + '%' : '0%',
        helper: `${openTickets}/${totalTickets}`,
      },
    ];
  }, [clients, projects, tickets]);

  const ticketsPerMonth = useMemo(() => {
    const counts = new Array(12).fill(0);
    tickets.forEach((t) => {
      let m = typeof t.month === 'number' ? t.month : null;
      if (m == null) {
        const d = t.createdAt || t.created_at || t.created_at?.date;
        const date = d ? new Date(d) : null;
        if (date && !isNaN(date)) m = date.getMonth();
      }
      if (typeof m === 'number' && m >= 0 && m <= 11) counts[m] += 1;
    });
    return counts.map((c, i) => ({ month: monthLabel(i), value: c }));
  }, [tickets]);

  const projectsByClient = useMemo(() => {
    const byClient = new Map();
    projects.forEach((p) => {
      const clientId = p.clientId ?? p.client?.id ?? p.client_id;
      if (clientId == null) return;
      byClient.set(clientId, (byClient.get(clientId) || 0) + 1);
    });
    const sorted = Array.from(byClient.entries()).sort((a, b) => b[1] - a[1]);
    const TOP = 6;
    const head = sorted.slice(0, TOP);
    const tailTotal = sorted.slice(TOP).reduce((acc, [, v]) => acc + v, 0);
    const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#22d3ee'];
    const headItems = head.map(([clientId, value], idx) => ({
      name: clients.find((c) => String(c.id) === String(clientId))?.name || `Cliente ${clientId}`,
      value,
      color: colors[idx % colors.length],
    }));
    if (tailTotal > 0) headItems.push({ name: 'Altri', value: tailTotal, color: '#9ca3af' });
    return headItems;
  }, [projects, clients]);

  const lastTickets = useMemo(() => tickets.slice(0, 8), [tickets]);

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-sm text-red-600">Errore nel caricamento: {String(error.message || error)}</div>
          <button className="mt-3 px-3 py-2 rounded border" onClick={() => window.location.reload()}>
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} helper={k.helper} />)
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Ticket per mese">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ticketsPerMonth} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip wrapperStyle={{ borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" fill="#60a5fa" isAnimationActive animationDuration={600} animationBegin={0} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Progetti per cliente">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={projectsByClient} dataKey="value" nameKey="name" outerRadius={110} innerRadius={60} label={false} labelLine={false}
                   onClick={(data) => {
                     if (!data?.name || data.name === 'Altri') return;
                     navigate(`/projects?clientName=${encodeURIComponent(data.name)}`);
                   }}
              >
                {projectsByClient.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1} cursor={entry.name !== 'Altri' ? 'pointer' : 'default'} />
                ))}
              </Pie>
              <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" formatter={(value, entry, index) => {
                const total = projectsByClient.reduce((acc, i) => acc + i.value, 0);
                const current = projectsByClient[index]?.value || 0;
                const pct = total ? Math.round((current / total) * 100) : 0;
                return `${value} (${pct}%)`;
              }} />
              <Tooltip wrapperStyle={{ borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="card">
        <div className="card-header">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ultimi Ticket</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Progetto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lastTickets.map((t) => {
                const proj = projects.find((p) => String(p.id) === String(t.projectId)) || t.project || null;
                const clientId = proj?.clientId ?? proj?.client?.id;
                const client = clients.find((c) => String(c.id) === String(clientId)) || proj?.client || null;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <td className="px-4 py-2 text-sm">{t.subject || t.title || '—'}</td>
                    <td className="px-4 py-2 text-sm">{client?.name || '—'}</td>
                    <td className="px-4 py-2 text-sm">{proj?.title || proj?.name || '—'}</td>
                    <td className="px-4 py-2 text-sm">
                      <Badge color={(t.status === 'open' || t.status === 'OPEN' || t.status === 'IN_PROGRESS') ? 'green' : 'gray'}>{t.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <DetailModal title="Dettaglio Ticket" isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)}>
        {selectedTicket ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Subject:</span> {selectedTicket.subject}
            </div>
            <div>
              <span className="font-medium">Requester:</span> {selectedTicket.requester}
            </div>
            <div>
              <span className="font-medium">Stato:</span> <Badge color={selectedTicket.status === 'open' ? 'green' : 'gray'}>{selectedTicket.status}</Badge>
            </div>
            <div>
              <span className="font-medium">Creato:</span> {selectedTicket.createdAt.toLocaleString('it-IT')}
            </div>
            <p className="pt-2 whitespace-pre-line">{selectedTicket.description}</p>
          </div>
        ) : null}
      </DetailModal>
    </div>
  );
}


