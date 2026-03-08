export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  goal?: string;
  progress: number; // 0-100
  defaultRate: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  clientId: string;
  date: string;
  hours: number;
  description: string;
  rate: number;
  createdAt: string;
}
