import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEvents, getVolunteers, getRegistrations, addEvent, deleteEvent, getFeedback } from '@/lib/store';
import { generateCertificate } from '@/lib/certificate';
import { CAUSES } from '@/lib/types';
import type { VolunteerEvent, Volunteer, EventRegistration, EventFeedback } from '@/lib/types';
import { Plus, Trash2, Users, Calendar, Award, ShieldCheck, MessageSquare, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [form, setForm] = useState({ name: '', description: '', location: '', cause: '', organizerName: '', eventDate: '', registrationDeadline: '' });

  const refresh = () => {
    setEvents(getEvents());
    setVolunteers(getVolunteers());
    setRegistrations(getRegistrations());
    setFeedbacks(getFeedback());
  };

  useEffect(refresh, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.location || !form.cause || !form.eventDate || !form.registrationDeadline) {
      toast.error('Please fill all fields');
      return;
    }
    addEvent({
      id: crypto.randomUUID(),
      ...form,
      eventDate: new Date(form.eventDate).toISOString(),
      registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      createdAt: new Date().toISOString(),
    });
    setForm({ name: '', description: '', location: '', cause: '', organizerName: '', eventDate: '', registrationDeadline: '' });
    toast.success('Event created! 🎉');
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    toast.success('Event deleted');
    refresh();
  };

  const handleGenCert = async (reg: EventRegistration) => {
    const vol = volunteers.find(v => v.id === reg.volunteerId);
    const evt = events.find(e => e.id === reg.eventId);
    if (vol && evt) {
      await generateCertificate(vol.name, evt.name, evt.eventDate);
      toast.success(`Certificate generated for ${vol.name}`);
    }
  };

  const getVolunteerName = (id: string) => volunteers.find(v => v.id === id)?.name || 'Unknown';
  const getEventName = (id: string) => events.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage events, volunteers, and certificates</p>
        </div>

        <Tabs defaultValue="create" className="mx-auto max-w-4xl">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="create"><Plus className="mr-1 h-4 w-4 hidden sm:inline" />Create</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="mr-1 h-4 w-4 hidden sm:inline" />Events</TabsTrigger>
            <TabsTrigger value="volunteers"><Users className="mr-1 h-4 w-4 hidden sm:inline" />Vols</TabsTrigger>
            <TabsTrigger value="registrations"><Award className="mr-1 h-4 w-4 hidden sm:inline" />Regs</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare className="mr-1 h-4 w-4 hidden sm:inline" />Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <form onSubmit={handleCreateEvent} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-heading text-lg font-semibold">Create New Event</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input placeholder="Event name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Event description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Organizer NGO Name</Label>
                  <Input placeholder="NGO Name" value={form.organizerName} onChange={e => setForm(f => ({ ...f, organizerName: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Cause</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))}>
                    <option value="">Select cause</option>
                    {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Registration Deadline</Label>
                  <Input type="date" value={form.registrationDeadline} onChange={e => setForm(f => ({ ...f, registrationDeadline: e.target.value }))} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-semibold">
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-card">No events created yet.</p>
              ) : events.map(evt => (
                <div key={evt.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
                  <div>
                    <h4 className="font-heading font-semibold text-foreground">{evt.name}</h4>
                    <p className="text-xs text-muted-foreground">{evt.location} • {evt.cause} • {new Date(evt.eventDate).toLocaleDateString()} • Org: {evt.organizerName || 'Unknown'}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(evt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="volunteers" className="mt-6">
            <div className="space-y-3">
              {volunteers.length === 0 ? (
                <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-card">No volunteers registered yet.</p>
              ) : volunteers.map(vol => (
                <div key={vol.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-semibold text-foreground">{vol.name}</h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{vol.cause}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{vol.email} • {vol.phone} • {vol.city} • {vol.experience}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="registrations" className="mt-6">
            <div className="space-y-3">
              {registrations.length === 0 ? (
                <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-card">No event registrations yet.</p>
              ) : registrations.map(reg => (
                <div key={reg.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
                  <div>
                    <h4 className="font-heading font-semibold text-foreground">{getVolunteerName(reg.volunteerId)}</h4>
                    <p className="text-xs text-muted-foreground">Event: {getEventName(reg.eventId)} • {new Date(reg.registeredAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleGenCert(reg)}>
                    <Award className="mr-1 h-4 w-4" /> Certificate
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card h-[300px]">
                <h3 className="font-heading text-lg font-semibold mb-4">Average Ratings per Event</h3>
                {events.length > 0 && feedbacks.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={events.map(evt => {
                      const evFbs = feedbacks.filter(f => f.eventId === evt.id);
                      const avg = evFbs.length ? evFbs.reduce((a,c) => a + c.rating, 0) / evFbs.length : 0;
                      return { name: evt.name.substring(0, 15)+'...', rating: Number(avg.toFixed(1)), count: evFbs.length };
                    }).filter(d => d.count > 0)}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'var(--muted)'}} />
                      <Bar dataKey="rating" fill="rgba(34, 139, 94, 0.8)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground mt-10">No event review data available.</p>
                )}
              </div>
              
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-semibold">Latest Feedback Comments</h3>
                {feedbacks.length === 0 ? (
                  <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-card">No feedback received yet.</p>
                ) : [...feedbacks].reverse().map(fb => (
                  <div key={fb.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {getEventName(fb.eventId)} 
                        <span className="flex items-center text-yellow-500 text-sm"><Star className="w-3 h-3 fill-yellow-500 mr-1"/> {fb.rating}/5</span>
                      </h4>
                      <span className="text-xs text-muted-foreground">{new Date(fb.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-foreground italic">"{fb.comment || 'No comment provided.'}"</p>
                    <p className="text-xs text-muted-foreground mt-2 text-right">- {getVolunteerName(fb.volunteerId)}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
