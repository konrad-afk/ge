import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Client, Project, TimeEntry } from '@/types';

interface AppState {
  clients: Client[];
  projects: Project[];
  timeEntries: TimeEntry[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => load('ge_clients', []));
  const [projects, setProjects] = useState<Project[]>(() => load('ge_projects', []));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => load('ge_entries', []));

  useEffect(() => { localStorage.setItem('ge_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('ge_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('ge_entries', JSON.stringify(timeEntries)); }, [timeEntries]);

  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    setClients(prev => [...prev, { ...data, id: uid(), createdAt: now() }]);
  }, []);
  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setProjects(prev => prev.filter(p => p.clientId !== id));
    setTimeEntries(prev => prev.filter(e => e.clientId !== id));
  }, []);

  const addProject = useCallback((data: Omit<Project, 'id' | 'createdAt'>) => {
    setProjects(prev => [...prev, { ...data, id: uid(), createdAt: now() }]);
  }, []);
  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);
  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTimeEntries(prev => prev.filter(e => e.projectId !== id));
  }, []);

  const addTimeEntry = useCallback((data: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    setTimeEntries(prev => [...prev, { ...data, id: uid(), createdAt: now() }]);
  }, []);
  const updateTimeEntry = useCallback((id: string, data: Partial<TimeEntry>) => {
    setTimeEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);
  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      clients, projects, timeEntries,
      addClient, updateClient, deleteClient,
      addProject, updateProject, deleteProject,
      addTimeEntry, updateTimeEntry, deleteTimeEntry,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
