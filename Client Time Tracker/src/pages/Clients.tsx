import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Clients() {
  const { clients, projects, timeEntries, addClient, deleteClient } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const navigate = useNavigate();

  const handleAdd = () => {
    if (!name.trim()) return;
    addClient({ name: name.trim(), email: '', company: company.trim() || undefined });
    setName(''); setCompany('');
    setOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your agency clients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Client name" /></div>
              <div><Label>Company</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" /></div>
              <Button onClick={handleAdd} className="w-full">Add Client</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No clients yet. Add your first client to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map(client => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const clientEntries = timeEntries.filter(e => e.clientId === client.id);
            const totalHours = clientEntries.reduce((s, e) => s + e.hours, 0);
            return (
              <Card key={client.id} className="group cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/clients/${client.id}`)}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}><FolderOpen className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}</span>
                    <span>{totalHours.toFixed(1)}h logged</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
