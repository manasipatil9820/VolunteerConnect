import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, X, LogOut, UserRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(sessionStorage.getItem('userRole'));

  useEffect(() => {
    const handleStorageChange = () => {
      setRole(sessionStorage.getItem('userRole'));
    };
    
    window.addEventListener('roleUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('roleUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const volunteerNav = [
    { label: 'Home', path: '/' },
    { label: 'Register', path: '/register' },
    { label: 'Events', path: '/events' },
    { label: 'History', path: '/history' },
    { label: 'Profile', path: '/profile' },
  ];

  const ngoNav = [
    { label: 'Home', path: '/' },
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Database Logs', path: '/sql-viewer' },
  ];

  let navItems = [];
  if (role === 'volunteer') navItems = volunteerNav;
  if (role === 'ngo') navItems = ngoNav;

  const handleSwitchRole = () => {
    sessionStorage.removeItem('userRole');
    window.dispatchEvent(new Event('roleUpdated'));
    if (location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          Volunteer Connect {role === 'ngo' && <span className="text-xs ml-2 bg-orange-100 text-orange-700 px-2 py-1 rounded-full">For NGOs</span>}
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {role && (
            <button
              onClick={handleSwitchRole}
              className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Switch Role
            </button>
          )}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 rounded-lg hover:bg-muted" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 pb-4">
          <div className="pt-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {role && (
              <button
                onClick={() => { setOpen(false); handleSwitchRole(); }}
                className="w-full text-left flex items-center gap-2 mt-2 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Switch Role
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
