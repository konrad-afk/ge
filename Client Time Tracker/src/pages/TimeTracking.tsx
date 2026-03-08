import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, CalendarIcon, Pencil } from 'lucide-react';
import { format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TimeTracking() {
  const { clients, projects, timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useApp();

  // Log/edit time form
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [rateOverride, setRateOverride] = useState('');

  // Filters
  const [filterClient, setFilterClient] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const monthStr = format(currentMonth, 'yyyy-MM');

  const filteredEntries = useMemo(() =>
    timeEntries
      .filter(e => e.date.startsWith(monthStr))
      .filter(e => filterClient === 'all' || e.clientId === filterClient)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [timeEntries, monthStr, filterClient]
  );

  const clientProjects = projects.filter(p => p.clientId === selectedClient && p.isActive);
  const selectedProjectObj = projects.find(p => p.id === selectedProject);

  const handleAdd = () => {
    if (!selectedClient || !selectedProject || !hours || !description.trim()) return;
    const rate = rateOverride ? parseFloat(rateOverride) : (selectedProjectObj?.defaultRate || 0);
    if (editingId) {
      updateTimeEntry(editingId, {
        projectId: selectedProject,
        clientId: selectedClient,
        date: format(date, 'yyyy-MM-dd'),
        hours: parseFloat(hours),
        description: description.trim(),
        rate,
      });
    } else {
      addTimeEntry({
        projectId: selectedProject,
        clientId: selectedClient,
        date: format(date, 'yyyy-MM-dd'),
        hours: parseFloat(hours),
        description: description.trim(),
        rate,
      });
    }
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setHours(''); setDescription(''); setRateOverride(''); setEditingId(null);
  };

  const startEdit = (entry: typeof timeEntries[0]) => {
    setEditingId(entry.id);
    setSelectedClient(entry.clientId);
    setSelectedProject(entry.projectId);
    setDate(new Date(entry.date));
    setHours(String(entry.hours));
    setDescription(entry.description);
    setRateOverride(String(entry.rate));
    setOpen(true);
  };

  const totalHours = filteredEntries.reduce((s, e) => s + e.hours, 0);
  const totalAmount = filteredEntries.reduce((s, e) => s + e.hours * e.rate, 0);

  // Group entries by client
  const groupedByClient = useMemo(() => {
    const groups: Record<string, typeof filteredEntries> = {};
    filteredEntries.forEach(e => {
      if (!groups[e.clientId]) groups[e.clientId] = [];
      groups[e.clientId].push(e);
    });
    return groups;
  }, [filteredEntries]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Log and manage hours across all clients</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); if (v && !editingId && !selectedClient && clients.length > 0) setSelectedClient(clients[0].id); }}>
          <DialogTrigger asChild>
            <Button disabled={projects.filter(p => p.isActive).length === 0}>
              <Plus className="h-4 w-4 mr-2" />Log Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit Time Entry' : 'Log Time Entry'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Client *</Label>
                <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setSelectedProject(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Project *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject} disabled={!selectedClient}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{clientProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency} {p.defaultRate}/h)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div><Label>Hours *</Label><Input type="number" step="0.25" value={hours} onChange={e => setHours(e.target.value)} placeholder="1.5" /></div>
              </div>
              <div><Label>Description *</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What did you work on?" /></div>
              <div>
                <Label>Rate Override (optional)</Label>
                <Input type="number" step="0.01" value={rateOverride} onChange={e => setRateOverride(e.target.value)} placeholder={selectedProjectObj ? `Default: ${selectedProjectObj.defaultRate}` : 'Select project first'} />
              </div>
              <Button onClick={handleAdd} className="w-full">{editingId ? 'Save Changes' : 'Log Entry'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & month nav */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
          <span className="font-medium min-w-[130px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Total Hours</p><p className="text-2xl font-bold font-mono">{totalHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Total Amount</p><p className="text-2xl font-bold font-mono">€{totalAmount.toFixed(2)}</p></CardContent></Card>
      </div>

      {/* Entries grouped by client */}
      {filteredEntries.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {projects.filter(p => p.isActive).length === 0
            ? 'Add a client and project first, then start logging time.'
            : 'No entries for this period. Click "Log Time" to get started.'}
        </CardContent></Card>
      ) : (
        Object.entries(groupedByClient).map(([clientId, entries]) => {
          const client = clients.find(c => c.id === clientId);
          const clientHours = entries.reduce((s, e) => s + e.hours, 0);
          const clientAmount = entries.reduce((s, e) => s + e.hours * e.rate, 0);
          return (
            <Card key={clientId}>
              <CardContent className="p-0">
                <div className="px-6 py-3 bg-muted/30 border-b flex items-center justify-between">
                  <span className="font-semibold">{client?.name || 'Unknown'}</span>
                  <span className="text-sm font-mono text-muted-foreground">{clientHours.toFixed(1)}h · €{clientAmount.toFixed(2)}</span>
                </div>
                <div className="divide-y">
                  {entries.map(entry => {
                    const project = projects.find(p => p.id === entry.projectId);
                    return (
                      <div key={entry.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">{project?.name} · {entry.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-mono">{entry.hours}h × €{entry.rate}</p>
                            <p className="text-xs font-mono text-muted-foreground">€{(entry.hours * entry.rate).toFixed(2)}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteTimeEntry(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
