import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Plus, Trash2, Clock, Download, CalendarIcon, Pencil } from 'lucide-react';
import { format, startOfMonth, subMonths, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, projects, timeEntries, addProject, updateProject, deleteProject, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useApp();
  const client = clients.find(c => c.id === id);
  const clientProjects = projects.filter(p => p.clientId === id);

  const [open, setOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pGoal, setPGoal] = useState('');
  const [pRate, setPRate] = useState('');
  const [pCurrency, setPCurrency] = useState('EUR');

  // Time entry form
  const [timeOpen, setTimeOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [teProject, setTeProject] = useState('');
  const [teDate, setTeDate] = useState<Date>(new Date());
  const [teHours, setTeHours] = useState('');
  const [teDesc, setTeDesc] = useState('');
  const [teRate, setTeRate] = useState('');

  // Month filter for entries
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const monthStr = format(currentMonth, 'yyyy-MM');

  const clientEntries = timeEntries
    .filter(e => e.clientId === id && e.date.startsWith(monthStr))
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthHours = clientEntries.reduce((s, e) => s + e.hours, 0);
  const monthAmount = clientEntries.reduce((s, e) => s + e.hours * e.rate, 0);

  if (!client) return (
    <div className="p-6">
      <p className="text-muted-foreground">Client not found.</p>
      <Button variant="ghost" onClick={() => navigate('/clients')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
    </div>
  );

  const handleAddProject = () => {
    if (!pName.trim() || !pRate) return;
    addProject({ clientId: client.id, name: pName.trim(), description: pDesc.trim() || undefined, goal: pGoal.trim() || undefined, progress: 0, defaultRate: parseFloat(pRate), currency: pCurrency, isActive: true });
    setPName(''); setPDesc(''); setPGoal(''); setPRate('');
    setOpen(false);
  };

  const handleAddTime = () => {
    if (!teProject || !teHours || !teDesc.trim()) return;
    const project = projects.find(p => p.id === teProject);
    const rate = teRate ? parseFloat(teRate) : (project?.defaultRate || 0);
    if (editingEntryId) {
      updateTimeEntry(editingEntryId, { projectId: teProject, clientId: client.id, date: format(teDate, 'yyyy-MM-dd'), hours: parseFloat(teHours), description: teDesc.trim(), rate });
    } else {
      addTimeEntry({ projectId: teProject, clientId: client.id, date: format(teDate, 'yyyy-MM-dd'), hours: parseFloat(teHours), description: teDesc.trim(), rate });
    }
    resetTimeForm();
    setTimeOpen(false);
  };

  const resetTimeForm = () => {
    setTeHours(''); setTeDesc(''); setTeRate(''); setEditingEntryId(null);
  };

  const startEditEntry = (entry: typeof timeEntries[0]) => {
    setEditingEntryId(entry.id);
    setTeProject(entry.projectId);
    setTeDate(new Date(entry.date));
    setTeHours(String(entry.hours));
    setTeDesc(entry.description);
    setTeRate(String(entry.rate));
    setTimeOpen(true);
  };

  const exportCSV = () => {
    if (clientEntries.length === 0) return;
    const headers = ['Date', 'Project', 'Description', 'Hours', 'Rate', 'Currency', 'Amount'];
    const rows = clientEntries.map(e => {
      const project = projects.find(p => p.id === e.projectId);
      return [e.date, project?.name || '', `"${e.description.replace(/"/g, '""')}"`, e.hours, e.rate, project?.currency || 'EUR', (e.hours * e.rate).toFixed(2)];
    });
    rows.push(['', '', 'TOTAL', monthHours.toFixed(1), '', '', monthAmount.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, '_')}_${monthStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeProjects = clientProjects.filter(p => p.isActive);

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate('/clients')} className="mb-2"><ArrowLeft className="h-4 w-4 mr-2" />Back to Clients</Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          {client.company && <p className="text-muted-foreground">{client.company}</p>}
        </div>
        <div className="flex gap-2">
          <Dialog open={timeOpen} onOpenChange={(v) => { setTimeOpen(v); if (!v) resetTimeForm(); }}>
            <DialogTrigger asChild><Button variant="outline" disabled={activeProjects.length === 0}><Clock className="h-4 w-4 mr-2" />Log Time</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingEntryId ? 'Edit Time Entry' : `Log Time for ${client.name}`}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project *</Label>
                  <Select value={teProject} onValueChange={setTeProject}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>{activeProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.currency} {p.defaultRate}/h)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !teDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {teDate ? format(teDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={teDate} onSelect={(d) => d && setTeDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div><Label>Hours *</Label><Input type="number" step="0.25" value={teHours} onChange={e => setTeHours(e.target.value)} placeholder="1.5" /></div>
                </div>
                <div><Label>Description *</Label><Input value={teDesc} onChange={e => setTeDesc(e.target.value)} placeholder="What did you work on?" /></div>
                <div><Label>Rate Override (optional)</Label><Input type="number" step="0.01" value={teRate} onChange={e => setTeRate(e.target.value)} placeholder={teProject ? `Default: ${projects.find(p => p.id === teProject)?.defaultRate}` : ''} /></div>
                <Button onClick={handleAddTime} className="w-full">{editingEntryId ? 'Save Changes' : 'Log Entry'}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Project Name *</Label><Input value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g. SEO Campaign" /></div>
                <div><Label>Goal</Label><Input value={pGoal} onChange={e => setPGoal(e.target.value)} placeholder="e.g. Increase organic traffic by 50%" /></div>
                <div><Label>Description</Label><Input value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Brief description" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Hourly Rate *</Label><Input type="number" step="0.01" value={pRate} onChange={e => setPRate(e.target.value)} placeholder="85.00" /></div>
                  <div><Label>Currency</Label><Input value={pCurrency} onChange={e => setPCurrency(e.target.value)} placeholder="EUR" /></div>
                </div>
                <Button onClick={handleAddProject} className="w-full">Add Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects with goals & progress */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Projects</h2>
        {clientProjects.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No projects yet. Add a project to start tracking.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {clientProjects.map(project => (
              <Card key={project.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{project.name}</p>
                        <span className="text-xs font-mono text-muted-foreground">{project.currency} {project.defaultRate}/h</span>
                      </div>
                      {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                      {project.goal && <p className="text-sm text-accent mt-1">🎯 {project.goal}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Active</Label>
                        <Switch checked={project.isActive} onCheckedChange={(v) => updateProject(project.id, { isActive: v })} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteProject(project.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  {/* Progress slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Progress</Label>
                      <span className="text-xs font-mono font-medium">{project.progress || 0}%</span>
                    </div>
                    <Slider
                      value={[project.progress || 0]}
                      onValueChange={(v) => updateProject(project.id, { progress: v[0] })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Client time entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Time Entries</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={clientEntries.length === 0}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
            <span className="font-medium text-sm min-w-[120px] text-center">{format(currentMonth, 'MMM yyyy')}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card><CardContent className="py-3"><p className="text-xs text-muted-foreground">Hours</p><p className="text-xl font-bold font-mono">{monthHours.toFixed(1)}h</p></CardContent></Card>
          <Card><CardContent className="py-3"><p className="text-xs text-muted-foreground">Amount</p><p className="text-xl font-bold font-mono">€{monthAmount.toFixed(2)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {clientEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm p-6 text-center">No entries for this month.</p>
            ) : (
              <div className="divide-y">
                {clientEntries.map(entry => {
                  const project = projects.find(p => p.id === entry.projectId);
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{project?.name} · {entry.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-mono">{entry.hours}h × €{entry.rate}</p>
                          <p className="text-xs font-mono text-muted-foreground">€{(entry.hours * entry.rate).toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => startEditEntry(entry)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTimeEntry(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
