import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Target, DollarSign } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';

export default function Dashboard() {
  const { clients, projects, timeEntries } = useApp();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
  const monthEntries = timeEntries.filter(e => e.date.startsWith(currentMonth));
  const monthHours = monthEntries.reduce((s, e) => s + e.hours, 0);
  const monthRevenue = monthEntries.reduce((s, e) => s + e.hours * e.rate, 0);
  const activeProjects = projects.filter(p => p.isActive);
  const avgProgress = activeProjects.length > 0 ? activeProjects.reduce((s, p) => s + (p.progress || 0), 0) / activeProjects.length : 0;

  const stats = [
    { label: 'Active Clients', value: clients.length, icon: Users },
    { label: 'Hours This Month', value: monthHours.toFixed(1), icon: Clock },
    { label: 'Revenue This Month', value: `€${monthRevenue.toFixed(0)}`, icon: DollarSign },
    { label: 'Avg. Progress', value: `${avgProgress.toFixed(0)}%`, icon: Target },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your agency performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active projects with goals */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Project Goals</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.map(project => {
              const client = clients.find(c => c.id === project.clientId);
              return (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{client?.name}{project.goal ? ` · ${project.goal}` : ''}</p>
                    </div>
                    <span className="text-sm font-mono font-medium">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent time entries */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Time Entries</CardTitle></CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No time entries yet. Start tracking from the Time Tracking page.</p>
          ) : (
            <div className="space-y-2">
              {timeEntries.slice(-5).reverse().map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const client = clients.find(c => c.id === entry.clientId);
                return (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{client?.name} · {project?.name} · {entry.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium">{entry.hours}h</p>
                      <p className="text-xs text-muted-foreground">€{(entry.hours * entry.rate).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
