import { useState, useEffect } from 'react';
import { getPastEvents, getRegistrations, getVolunteers, markCertificateGenerated, hasVolunteerRatedEvent, addFeedback } from '@/lib/store';
import { generateCertificate } from '@/lib/certificate';
import { Button } from '@/components/ui/button';
import type { VolunteerEvent } from '@/lib/types';
import { Calendar, MapPin, Award, History, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HistoryPage() {
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [ratedEventsMap, setRatedEventsMap] = useState<Record<string, boolean>>({});
  
  // Rating Dialog State
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [eventToRate, setEventToRate] = useState<VolunteerEvent | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const pastEvents = getPastEvents();
    setEvents(pastEvents);
    
    const volunteers = getVolunteers();
    const vol = volunteers[volunteers.length - 1]; // Assume last logged in/registered active
    if (vol) {
      const ratedMap: Record<string, boolean> = {};
      pastEvents.forEach(e => {
        ratedMap[e.id] = hasVolunteerRatedEvent(vol.id, e.id);
      });
      setRatedEventsMap(ratedMap);
    }
  }, []);

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleCertificate = async (evt: VolunteerEvent) => {
    const volunteers = getVolunteers();
    const regs = getRegistrations();
    const vol = volunteers[volunteers.length - 1];
    if (!vol) { toast.error('No volunteer found. Please register first.'); return; }
    const reg = regs.find(r => r.volunteerId === vol.id && r.eventId === evt.id);
    if (!reg) { toast.error('You did not participate in this event.'); return; }
    await generateCertificate(vol.name, evt.name, evt.eventDate);
    markCertificateGenerated(reg.id);
    toast.success('Certificate downloaded! 🎓');
  };

  const handleRatingSubmit = () => {
    if (!eventToRate || rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    const volunteers = getVolunteers();
    const vol = volunteers[volunteers.length - 1];
    if (!vol) {
      toast.error("No volunteer logged in.");
      return;
    }

    addFeedback({
      id: crypto.randomUUID(),
      eventId: eventToRate.id,
      volunteerId: vol.id,
      rating,
      comment,
      submittedAt: new Date().toISOString(),
    });

    setRatedEventsMap(prev => ({ ...prev, [eventToRate.id]: true }));
    toast.success("Thank you for your feedback!");
    setRatingDialogOpen(false);
    setTimeout(() => {
      setEventToRate(null);
      setRating(0);
      setComment("");
    }, 300);
  };

  const openRatingDialog = (evt: VolunteerEvent) => {
    const volunteers = getVolunteers();
    const vol = volunteers[volunteers.length - 1];
    if (!vol) { toast.error('Please register first.'); return; }
    const regs = getRegistrations();
    const reg = regs.find(r => r.volunteerId === vol.id && r.eventId === evt.id);
    if (!reg) { toast.error('You can only rate events you participated in.'); return; }
    
    setEventToRate(evt);
    setRatingDialogOpen(true);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Event History</h1>
          <p className="mt-2 text-muted-foreground">Past events that have been completed</p>
        </div>

        {events.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-heading text-lg font-semibold text-foreground">No Past Events</h3>
            <p className="mt-2 text-sm text-muted-foreground">Events will appear here after their date has passed.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((evt, i) => (
              <div
                key={evt.id}
                className="flex flex-col rounded-xl border border-border bg-card shadow-card animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="rounded-t-xl bg-muted p-4">
                  <span className="inline-block rounded-full bg-muted-foreground/20 px-3 py-1 text-xs font-medium text-muted-foreground">{evt.cause}</span>
                  <span className="ml-2 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">Completed</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 font-heading text-lg font-bold text-foreground">{evt.name}</h3>
                  <p className="mb-4 flex-1 text-sm text-muted-foreground">{evt.description}</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{evt.location}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{fmt(evt.eventDate)}</div>
                  </div>
                  
                  <div className="mt-5 grid border-t pt-4 grid-cols-1 gap-3">
                    <Button variant="outline" className="w-full font-semibold" onClick={() => handleCertificate(evt)}>
                      <Award className="mr-2 h-4 w-4" /> Download Certificate
                    </Button>
                    {!ratedEventsMap[evt.id] ? (
                      <Button variant="secondary" className="w-full font-semibold" onClick={() => openRatingDialog(evt)}>
                        <Star className="mr-2 h-4 w-4" /> Rate Event
                      </Button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-muted-foreground bg-muted/30 rounded-md border border-dashed">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> You rated this event
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rate Event: {eventToRate?.name}</DialogTitle>
              <DialogDescription>
                How was your experience volunteering for this event?
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center gap-5">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-10 w-10 cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                      (hoverRating || rating) >= s
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                  />
                ))}
              </div>
              <textarea
                className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-card shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground resize-none"
                placeholder="Share your thoughts (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setRatingDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleRatingSubmit} className="w-full sm:w-auto">Submit Feedback</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
