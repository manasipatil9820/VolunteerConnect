import { useState, useEffect } from 'react';
import { Heart, Users, Calendar, Award, ArrowRight, Globe, Shield, Sparkles, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const features = [
  { icon: Users, title: 'Connect with NGOs', desc: 'Find and join NGOs that align with your values and passions.' },
  { icon: Calendar, title: 'Discover Events', desc: 'Browse upcoming volunteer events in your city and beyond.' },
  { icon: Award, title: 'Earn Certificates', desc: 'Get recognized with downloadable PDF certificates for your service.' },
  { icon: Globe, title: 'Make an Impact', desc: 'Track your contributions and see the real difference you make.' },
];

const stats = [
  { value: '10K+', label: 'Volunteers' },
  { value: '500+', label: 'Events' },
  { value: '150+', label: 'NGO Partners' },
  { value: '50+', label: 'Cities' },
];

export default function HomePage() {
  const [role, setRole] = useState<string | null>('loading');

  useEffect(() => {
    const savedRole = sessionStorage.getItem('userRole');
    if (savedRole) {
      setRole(savedRole);
    } else {
      setRole(null);
    }

    const handleRoleUpdate = () => {
      setRole(sessionStorage.getItem('userRole'));
    };
    window.addEventListener('roleUpdated', handleRoleUpdate);
    return () => window.removeEventListener('roleUpdated', handleRoleUpdate);
  }, []);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    sessionStorage.setItem('userRole', selectedRole);
    window.dispatchEvent(new Event('roleUpdated'));
  };

  return (
    <div className="min-h-screen">
      <AlertDialog open={role === null}>
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Globe className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-center font-heading text-3xl font-extrabold text-foreground">Welcome to Volunteer Connect</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg text-muted-foreground mt-2">
              How would you like to use the platform today?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-6 py-6 md:grid-cols-2">
            <Button
              className="h-40 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-primary bg-card hover:bg-primary/5 text-foreground transition-all duration-300"
              variant="outline"
              onClick={() => handleRoleSelect('volunteer')}
            >
              <div className="rounded-full bg-blue-100 p-4 text-blue-600">
                <Users className="h-8 w-8" />
              </div>
              <span className="font-heading text-xl font-bold">I want to Volunteer</span>
              <span className="text-sm font-normal text-muted-foreground">Find events & join causes</span>
            </Button>
            <Button
              className="h-40 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-primary bg-card hover:bg-primary/5 text-foreground transition-all duration-300"
              variant="outline"
              onClick={() => handleRoleSelect('ngo')}
            >
              <div className="rounded-full bg-orange-100 p-4 text-orange-600">
                <Building2 className="h-8 w-8" />
              </div>
              <span className="font-heading text-xl font-bold">I am an NGO</span>
              <span className="text-sm font-normal text-muted-foreground">Add events & manage volunteers</span>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 md:py-36">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              {role === 'ngo' ? 'Empowering organizations to make a difference' : 'Making volunteering accessible for everyone'}
            </div>
            <h1 className="mb-6 font-heading text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-6xl">
              {role === 'ngo' ? (
                <>Empower the Change.<br />Host Events Today.</>
              ) : (
                <>Be the Change.<br />Volunteer Today.</>
              )}
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/80 md:text-xl">
              {role === 'ngo' 
                ? "Publish meaningful events, gather passionate volunteers, and easily manage registrations and certificates all in one place."
                : "Connect with meaningful causes, join impactful events, and earn recognition for your service. Your journey to making a difference starts here."}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {role === 'ngo' ? (
                <Link to="/admin">
                  <Button size="lg" className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 text-base shadow-elevated">
                    Go to NGO Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 text-base shadow-elevated">
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button size="lg" className="w-full sm:w-auto bg-blue-500 text-white hover:bg-blue-600 font-semibold px-8 text-base">
                      Browse Events
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-12">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="font-heading text-3xl font-extrabold text-primary md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm font-medium text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">Why Volunteer Connect?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Everything you need to start making a difference, all in one platform.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-primary-foreground/60" />
          <h2 className="mb-4 font-heading text-3xl font-bold text-primary-foreground md:text-4xl">Ready to Make a Difference?</h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            {role === 'ngo' 
              ? "Start adding your events and find passionate volunteers to help you execute your vision."
              : "Join thousands of volunteers who are creating positive change in their communities every day."}
          </p>
          {role === 'ngo' ? (
            <Link to="/admin">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 shadow-elevated">
                Host an Event <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 shadow-elevated">
                Register as a Volunteer <Heart className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Volunteer Connect. Built with ❤️ for the community.
        </div>
      </footer>
    </div>
  );
}
