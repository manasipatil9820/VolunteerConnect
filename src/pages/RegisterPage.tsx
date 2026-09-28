import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { addVolunteer } from '@/lib/store';
import { CITIES, CAUSES, ID_TYPES, AVAILABILITY, EXPERIENCE_LEVELS } from '@/lib/types';
import type { Volunteer } from '@/lib/types';
import { UserPlus, CheckCircle2, ScanFace, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import FaceCapture, { FaceCaptureData } from '@/components/FaceCapture';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', cause: '',
    experience: '', idType: '', idFileName: '',
  });
  const [availability, setAvailability] = useState<string[]>([]);
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [pendingVolunteer, setPendingVolunteer] = useState<Volunteer | null>(null);

  // Step 1: Validate form → open Face ID dialog
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.city || !form.cause || !form.experience || !form.idType) {
      toast.error('Please fill all required fields');
      return;
    }
    const volunteer: Volunteer = {
      id: crypto.randomUUID(),
      ...form,
      availability,
      registeredAt: new Date().toISOString(),
    };
    setPendingVolunteer(volunteer);
    setShowFaceDialog(true);
  };

  // Step 2a: Face captured → save with descriptor
  const handleFaceCapture = (data: FaceCaptureData) => {
    if (!pendingVolunteer) return;
    const vol: Volunteer = {
      ...pendingVolunteer,
      faceDescriptor: data.descriptor,
      facePhoto: data.photo,
    };
    addVolunteer(vol);
    setShowFaceDialog(false);
    setShowSuccessDialog(true);
    toast.success('Face ID registered! 🎉');
  };

  // Step 2b: Skip face capture → save without descriptor
  const handleFaceSkip = () => {
    if (!pendingVolunteer) return;
    addVolunteer(pendingVolunteer);
    setShowFaceDialog(false);
    setShowSuccessDialog(true);
  };

  const toggleAvail = (val: string) =>
    setAvailability(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Volunteer Registration</h1>
          <p className="mt-2 text-muted-foreground">Join our community and start making a difference</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <select id="city" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cause">Preferred Cause *</Label>
              <select id="cause" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))}>
                <option value="">Select cause</option>
                {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idType">Government ID Type *</Label>
              <select id="idType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.idType} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}>
                <option value="">Select ID type</option>
                {ID_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Availability *</Label>
            <div className="flex flex-wrap gap-3">
              {AVAILABILITY.map(a => (
                <label key={a} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={availability.includes(a)} onCheckedChange={() => toggleAvail(a)} />
                  <span className="text-sm">{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Experience Level *</Label>
            <div className="flex flex-wrap gap-4">
              {EXPERIENCE_LEVELS.map(exp => (
                <label key={exp} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="experience" value={exp} checked={form.experience === exp} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} className="h-4 w-4 accent-primary" />
                  <span className="text-sm">{exp}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idFile">Upload ID Document</Label>
            <Input id="idFile" type="file" accept="image/*,.pdf" onChange={e => setForm(f => ({ ...f, idFileName: e.target.files?.[0]?.name || '' }))} />
            <p className="text-xs text-muted-foreground">Upload a scanned copy of your government ID for verification</p>
          </div>

          {/* Face ID teaser */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <ScanFace className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Face ID Biometric Verification</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Next step: optionally register your face for secure identity verification using on-device AI — no data leaves your browser.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-semibold gap-2" size="lg">
            Next: Face ID Setup <ChevronRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* ── Face ID capture dialog ── */}
      <Dialog open={showFaceDialog} onOpenChange={open => { if (!open) handleFaceSkip(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-primary" />
              <DialogTitle>Register Your Face ID</DialogTitle>
            </div>
            <DialogDescription>
              Look straight at the camera and allow face detection to activate, then click <strong>Capture Face</strong>.
              Your face data is stored only on this device — never uploaded.
            </DialogDescription>
          </DialogHeader>
          <FaceCapture onCapture={handleFaceCapture} onSkip={handleFaceSkip} />
        </DialogContent>
      </Dialog>

      {/* ── Success dialog ── */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md text-center">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-2xl text-center">Registration Successful!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Welcome aboard, <strong>{form.name}</strong>! 🎉 You are now registered as a volunteer.
              {pendingVolunteer?.faceDescriptor
                ? ' Your Face ID has been set up for biometric verification.'
                : ' You can set up Face ID anytime from your profile.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-4">
            <AlertDialogAction onClick={() => navigate('/events')} className="w-full sm:w-auto">
              Continue to Events
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
