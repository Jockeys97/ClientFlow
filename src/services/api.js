import { useDataStore } from '../store/useDataStore.js';
import { authService } from './auth.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function safeFetch(url, options = {}) {
  const { signal, ...fetchOptions } = options;
  
  const headers = {
    ...authService.getAuthHeaders(),
    ...fetchOptions.headers
  };
  
  const res = await fetch(url, {
    signal,
    ...fetchOptions,
    headers
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      authService.logout();
      window.location.href = '/login';
      return;
    }
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed ${res.status}`);
  }
  return res.json();
}

export async function getClients({ signal, page = 1, limit = 10, search } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  
  const response = await safeFetch(`${API_BASE}/clients?${params}`, { signal });
  return response; // Already contains { data, pagination }
}

export async function getProjects({ signal, page = 1, limit = 10, search, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  
  const response = await safeFetch(`${API_BASE}/projects?${params}`, { signal });
  return response;
}

export async function getTickets({ signal, page = 1, limit = 10, search, status, priority, type, projectId } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  if (type) params.append('type', type);
  if (projectId) params.append('projectId', projectId);
  
  const response = await safeFetch(`${API_BASE}/tickets?${params}`, { signal });
  return response;
}

export async function getClientById(id, { signal } = {}) {
  return await safeFetch(`${API_BASE}/clients/${id}`, { signal });
}

export async function getProjectsByClient(clientId, { signal } = {}) {
  return await getProjects({ signal, clientId });
}

export async function getTicketsByProject(projectId, { signal } = {}) {
  return await getTickets({ signal, projectId });
}

// CRUD Operations for Clients
export async function createClient(clientData) {
  const created = await safeFetch(`${API_BASE}/clients`, {
    method: 'POST',
    body: JSON.stringify(clientData)
  });
  try {
    const { cache, setCache } = useDataStore.getState();
    const existing = (cache && Array.isArray(cache.clients)) ? cache.clients : (cache?.clients?.data || []);
    setCache((prev) => ({ ...prev, clients: [created, ...existing] }));
  } catch (e) {
    // ignore cache update errors
  }
  return created;
}

export async function updateClient(id, clientData) {
  return await safeFetch(`${API_BASE}/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientData)
  });
}

export async function deleteClient(id) {
  return await safeFetch(`${API_BASE}/clients/${id}`, {
    method: 'DELETE'
  });
}

// CRUD Operations for Projects
export async function getProjectById(id, { signal } = {}) {
  return await safeFetch(`${API_BASE}/projects/${id}`, { signal });
}

export async function createProject(projectData) {
  return await safeFetch(`${API_BASE}/projects`, {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
}

export async function updateProject(id, projectData) {
  return await safeFetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData)
  });
}

export async function deleteProject(id) {
  return await safeFetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE'
  });
}

// CRUD Operations for Tickets
export async function getTicketById(id, { signal } = {}) {
  return await safeFetch(`${API_BASE}/tickets/${id}`, { signal });
}

export async function createTicket(ticketData) {
  return await safeFetch(`${API_BASE}/tickets`, {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
}

export async function updateTicket(id, ticketData) {
  return await safeFetch(`${API_BASE}/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ticketData)
  });
}

export async function deleteTicket(id) {
  return await safeFetch(`${API_BASE}/tickets/${id}`, {
    method: 'DELETE'
  });
}

// High-level helpers leveraging zustand cache
export async function ensureAllDataLoaded(controller = new AbortController()) {
  if (!authService.isAuthenticated()) {
    throw new Error('Authentication required');
  }

  const { cache, setCache } = useDataStore.getState();
  if (cache.clients && cache.projects && cache.tickets) {
    return { 
      clients: cache.clients.data || cache.clients, 
      projects: cache.projects.data || cache.projects, 
      tickets: cache.tickets.data || cache.tickets 
    };
  }
  
  try {
    const [clientsResponse, projectsResponse, ticketsResponse] = await Promise.all([
      cache.clients ? Promise.resolve(cache.clients) : getClients({ signal: controller.signal, page: 1, limit: 1000 }),
      cache.projects ? Promise.resolve(cache.projects) : getProjects({ signal: controller.signal, page: 1, limit: 1000 }),
      cache.tickets ? Promise.resolve(cache.tickets) : getTickets({ signal: controller.signal, page: 1, limit: 1000 }),
    ]);
    
    const clients = clientsResponse.data || clientsResponse;
    const projects = projectsResponse.data || projectsResponse;
    const tickets = ticketsResponse.data || ticketsResponse;
    
    setCache((prev) => ({ ...prev, clients, projects, tickets }));
    return { clients, projects, tickets };
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw e;
  }
}


