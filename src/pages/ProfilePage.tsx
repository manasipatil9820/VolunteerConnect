import { useState, useEffect } from 'react';
import {
  getVolunteers,
  getRegistrations,
  getPastEvents,
  addFeedback,
  hasVolunteerRatedEvent,
} from '@/lib/store';
import type { Volunteer, EventRegistration, VolunteerEvent } from '@/lib/types';
import { Award, Star, History, Target, ShieldCheck, Send, CheckCircle2, ScanFace, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import FaceVerify from '@/components/FaceVerify';

/* ---------- tiny helpers ---------- */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-7 h-7 cursor-pointer transition-colors ${
            n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
          }`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        />
      ))}
    </div>
  );
}

/* ---------- Face ID status card ---------- */
function FaceIdCard({ volunteer, onSetupRequest }: { volunteer: Volunteer; onSetupRequest: () => void }) {
  const [verifyOpen, setVerifyOpen] = useState(false);

  const hasId = !!(volunteer.faceDescriptor && volunteer.faceDescriptor.length > 0);

  return (
    <>
      <div className="bg-card p-5 rounded-2xl border shadow-sm">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <ScanFace className="h-4 w-4" /> Face ID
        </h3>

        {hasId ? (
          <div className="flex flex-col items-center gap-3">
            {/* Registered face thumbnail */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md">
              {volunteer.facePhoto ? (
                <img src={volunteer.facePhoto} alt="Registered face" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <ScanFace className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-0.5 shadow">
                <ShieldCheck className="h-3 w-3" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-green-600 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Face ID Registered
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">On-device biometric only</p>
            </div>
            <Button
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => setVerifyOpen(true)}
            >
              <ScanFace className="h-3.5 w-3.5" /> Verify Face ID
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShieldX className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">Not Set Up</p>
              <p className="text-xs text-muted-foreground mt-0.5">Secure biometric verification</p>
            </div>
            <Button size="sm" variant="outline" className="w-full gap-2 text-xs" onClick={onSetupRequest}>
              <ScanFace className="h-3.5 w-3.5" /> Set Up Face ID
            </Button>
          </div>
        )}
      </div>

      {/* FaceVerify dialog */}
      {hasId && (
        <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ScanFace className="h-5 w-5 text-primary" />
                <DialogTitle>Face ID Verification</DialogTitle>
              </div>
              <DialogDescription>
                Look at the camera. The system will compare your live face against your registered profile in real time.
              </DialogDescription>
            </DialogHeader>
            <FaceVerify
              storedDescriptor={volunteer.faceDescriptor!}
              onClose={() => setVerifyOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* ---------- main page ---------- */
export default function ProfilePage() {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [hoursLogged, setHoursLogged] = useState(0);
  const [pastEvents, setPastEvents] = useState<VolunteerEvent[]>([]);

  // rating form state
  const [selectedEvent, setSelectedEvent] = useState<VolunteerEvent | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    const vols = getVolunteers();
    const curr = vols[vols.length - 1];
    if (curr) {
      setVolunteer(curr);
      const regs = getRegistrations().filter((r) => r.volunteerId === curr.id);
      setRegistrations(regs);
      const past = getPastEvents();
      setPastEvents(past);
      const pastEventsAttended = regs.filter((r) => past.find((e) => e.id === r.eventId));
      setHoursLogged(pastEventsAttended.length * 4);
    }
  }, []);

  const handleEventSelect = (evt: VolunteerEvent) => {
    setSelectedEvent(evt);
    setRating(0);
    setComment('');
    setSubmitted(false);
    setAlreadyRated(volunteer ? hasVolunteerRatedEvent(volunteer.id, evt.id) : false);
  };

  const handleSubmit = () => {
    if (!volunteer || !selectedEvent || rating === 0) return;
    addFeedback({
      id: `fb-${Date.now()}`,
      eventId: selectedEvent.id,
      volunteerId: volunteer.id,
      rating,
      comment,
      submittedAt: new Date().toISOString(),
    });
    setSubmitted(true);
    setAlreadyRated(true);
  };

  if (!volunteer) {
    return (
      <div className="min-h-screen py-20 text-center animate-fade-in">
        <h2 className="text-2xl font-bold">No Profile Found</h2>
        <p className="text-muted-foreground mt-2">Please register or switch to a volunteer account.</p>
      </div>
    );
  }

  const badges = [
    { name: 'First Step', icon: <Target className="w-8 h-8 text-blue-500" />, desc: 'Joined your first event', earned: registrations.length > 0 },
    { name: 'Rising Star', icon: <Star className="w-8 h-8 text-yellow-500" />, desc: 'Participated in 3+ events', earned: registrations.length >= 3 },
    { name: 'Community Pillar', icon: <ShieldCheck className="w-8 h-8 text-green-500" />, desc: 'Logged over 20 hours', earned: hoursLogged >= 20 },
    { name: 'Veteran', icon: <Award className="w-8 h-8 text-purple-500" />, desc: 'Completed 10 events', earned: registrations.length >= 10 },
  ];

  return (
    <div className="min-h-screen py-12 bg-muted/20">
      <div className="container mx-auto px-4 max-w-4xl animate-fade-in">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Your Profile</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="md:col-span-1 space-y-5">
            {/* Avatar card */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                {volunteer.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-center">{volunteer.name}</h2>
              <p className="text-sm text-muted-foreground">{volunteer.email}</p>
              <div className="mt-4 px-3 py-1 bg-muted rounded-full text-xs font-semibold text-foreground">
                Level {Math.max(1, Math.floor(registrations.length / 2))}
              </div>
            </div>

            {/* Details card */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Details</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">City:</strong> {volunteer.city}</p>
                <p><strong className="text-foreground">Phone:</strong> {volunteer.phone}</p>
                <p><strong className="text-foreground">Primary Cause:</strong> {volunteer.cause}</p>
                <p><strong className="text-foreground">ID Type:</strong> {volunteer.idType}</p>
              </div>
            </div>

            {/* Face ID card */}
            <FaceIdCard
              volunteer={volunteer}
              onSetupRequest={() => window.location.href = '/register'}
            />
          </div>

          {/* ── Right column ── */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center">
                <History className="h-8 w-8 text-primary mb-2" />
                <h4 className="text-3xl font-bold text-foreground">{registrations.length}</h4>
                <p className="text-sm text-muted-foreground">Events Joined</p>
              </div>
              <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center">
                <Award className="h-8 w-8 text-primary mb-2" />
                <h4 className="text-3xl font-bold text-foreground">{hoursLogged}</h4>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Achievements &amp; Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {badges.map((b, i) => (
                  <div key={i} className={`flex flex-col items-center p-4 rounded-xl text-center transition-all ${b.earned ? 'bg-primary/5 border-primary/20 border shadow-sm' : 'opacity-40 grayscale border border-dashed'}`}>
                    <div className="mb-2">{b.icon}</div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs mt-1 text-muted-foreground">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Rate an Event ── */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Rate an Event
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Share your experience for any past event.</p>

              {pastEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past events available yet.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Select Event</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedEvent?.id ?? ''}
                      onChange={(e) => {
                        const evt = pastEvents.find((ev) => ev.id === e.target.value);
                        if (evt) handleEventSelect(evt);
                      }}
                    >
                      <option value="">-- Choose a past event --</option>
                      {pastEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && (
                    alreadyRated && !submitted ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium py-2">
                        <CheckCircle2 className="w-5 h-5" />
                        You've already rated this event.
                      </div>
                    ) : submitted ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium py-2 animate-fade-in">
                        <CheckCircle2 className="w-5 h-5" />
                        Thank you! Your rating has been submitted.
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-sm font-medium mb-2">Your Rating</label>
                          <StarPicker value={rating} onChange={setRating} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Comment <span className="text-muted-foreground font-normal">(optional)</span></label>
                          <textarea
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Share your experience…"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                        </div>
                        <button
                          disabled={rating === 0}
                          onClick={handleSubmit}
                          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <Send className="w-4 h-4" />
                          Submit Rating
                        </button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
