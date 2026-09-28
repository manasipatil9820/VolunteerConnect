import { Volunteer, VolunteerEvent, EventRegistration, EventFeedback } from './types';

const VOLUNTEERS_KEY = 'vc_volunteers';
const EVENTS_KEY = 'vc_events';
const REGISTRATIONS_KEY = 'vc_registrations';

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Volunteers
export const getVolunteers = () => get<Volunteer>(VOLUNTEERS_KEY);
export const addVolunteer = (v: Volunteer) => {
  const all = getVolunteers();
  all.push(v);
  set(VOLUNTEERS_KEY, all);
  fetch('http://localhost:3000/api/volunteers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) }).catch(console.error);
};

// Events
export const getEvents = () => get<VolunteerEvent>(EVENTS_KEY);
export const addEvent = (e: VolunteerEvent) => {
  const all = getEvents();
  all.push(e);
  set(EVENTS_KEY, all);
  fetch('http://localhost:3000/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }).catch(console.error);
};
export const deleteEvent = (id: string) => {
  set(EVENTS_KEY, getEvents().filter(e => e.id !== id));
};

export const getUpcomingEvents = () => {
  const now = new Date().toISOString();
  return getEvents().filter(e => e.registrationDeadline >= now);
};

export const getPastEvents = () => {
  const now = new Date().toISOString();
  return getEvents().filter(e => e.eventDate < now);
};

// Registrations
export const getRegistrations = () => get<EventRegistration>(REGISTRATIONS_KEY);
export const addRegistration = (r: EventRegistration) => {
  const all = getRegistrations();
  all.push(r);
  set(REGISTRATIONS_KEY, all);
  fetch('http://localhost:3000/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }).catch(console.error);
};
export const isVolunteerRegistered = (volunteerId: string, eventId: string) => {
  return getRegistrations().some(r => r.volunteerId === volunteerId && r.eventId === eventId);
};
export const markCertificateGenerated = (registrationId: string) => {
  const all = getRegistrations();
  const idx = all.findIndex(r => r.id === registrationId);
  if (idx >= 0) { all[idx].certificateGenerated = true; set(REGISTRATIONS_KEY, all); }
};

// Feedback
const FEEDBACK_KEY = 'vc_feedback';
export const getFeedback = () => get<EventFeedback>(FEEDBACK_KEY);
export const addFeedback = (f: EventFeedback) => {
  const all = getFeedback();
  all.push(f);
  set(FEEDBACK_KEY, all);
  fetch('http://localhost:3000/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }).catch(console.error);
};
export const getFeedbackForEvent = (eventId: string) => getFeedback().filter(f => f.eventId === eventId);
export const hasVolunteerRatedEvent = (volunteerId: string, eventId: string) => {
  return getFeedback().some(f => f.volunteerId === volunteerId && f.eventId === eventId);
};

// Seed initial events if empty
export const seedEvents = () => {
  const now = new Date();
  const seedData: any[] = [
    {
      id: 'evt-1', name: 'Juhu Beach Cleanup Drive', description: 'Join us at Juhu Beach for a cleanup to protect marine life and keep Mumbai\'s shores pristine.',
      location: 'Juhu Beach, Mumbai, Maharashtra', cause: 'Environment', eventDate: new Date(now.getTime() + 14 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 10 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-2', name: 'Teach a Child Program', description: 'Volunteer to teach underprivileged children basic literacy and numeracy skills.',
      location: 'Community Center, Pune, Maharashtra', cause: 'Education', eventDate: new Date(now.getTime() + 21 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 17 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-3', name: 'Free Health Camp', description: 'Assist doctors and nurses in conducting free health checkups for rural communities.',
      location: 'Rural Health Center, Nagpur, Maharashtra', cause: 'Healthcare', eventDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 5 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-6', name: 'River Cleanup at Mula-Mutha', description: 'Help clean river banks and spread awareness about water pollution.',
      location: 'Mula-Mutha River, Pune, Maharashtra', cause: 'Environment', eventDate: new Date(now.getTime() + 5 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 3 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-7', name: 'Slum Education Drive', description: 'Teach basic reading and writing skills to children in urban slums.',
      location: 'Dharavi, Mumbai, Maharashtra', cause: 'Education', eventDate: new Date(now.getTime() + 28 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 24 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-8', name: 'Blood Donation Camp', description: 'Support blood donation efforts and assist organizers with registrations.',
      location: 'Civil Hospital, Nashik, Maharashtra', cause: 'Healthcare', eventDate: new Date(now.getTime() + 10 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 8 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-4', name: 'Animal Shelter Support', description: 'Help feed, groom, and care for rescued animals at the local shelter.',
      location: 'City Animal Shelter, Nashik, Maharashtra', cause: 'Animal Welfare', eventDate: new Date(now.getTime() - 110 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() - 115 * 86400000).toISOString(), createdAt: new Date(now.getTime() - 120 * 86400000).toISOString(),
    },
    {
      id: 'evt-5', name: 'Tree Plantation Drive', description: 'Plant trees and contribute to a greener future for our community.',
      location: 'Central Park, Thane, Maharashtra', cause: 'Environment', eventDate: new Date(now.getTime() - 95 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() - 100 * 86400000).toISOString(), createdAt: new Date(now.getTime() - 105 * 86400000).toISOString(),
    },
    {
      id: 'evt-9', name: 'Road Safety Awareness Rally', description: 'Distribute pamphlets and guide commuters on road safety rules.',
      location: 'MG Road, Pune, Maharashtra', cause: 'Community Development', eventDate: new Date(now.getTime() - 80 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() - 85 * 86400000).toISOString(), createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
    },
    {
      id: 'evt-10', name: 'Old Age Home Visit', description: 'Spend time with elders, organize games, and provide companionship.',
      location: 'Old Age Home, Navi Mumbai, Maharashtra', cause: 'Elder Care', eventDate: new Date(now.getTime() - 60 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() - 65 * 86400000).toISOString(), createdAt: new Date(now.getTime() - 70 * 86400000).toISOString(),
    },
    {
      id: 'evt-11', name: 'Heritage Fort Cleanup', description: 'Help preserve history by cleaning the surroundings of the iconic Shaniwar Wada.',
      location: 'Shaniwar Wada, Pune, Maharashtra', cause: 'Community Development', eventDate: new Date(now.getTime() + 3 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 2 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-12', name: 'Hill Station Plantation Drive', description: 'Plant saplings along the hills and roadsides of Mahabaleshwar to support green cover.',
      location: 'Mahabaleshwar, Satara, Maharashtra', cause: 'Environment', eventDate: new Date(now.getTime() + 18 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 14 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-13', name: 'Rural School Renovation', description: 'Repair classrooms, paint walls, and set up basic facilities at a Zilla Parishad school.',
      location: 'Zilla Parishad School, Kolhapur, Maharashtra', cause: 'Education', eventDate: new Date(now.getTime() + 25 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 20 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-14', name: 'Women Self-Help Group Workshop', description: 'Conduct financial literacy and entrepreneurship sessions for women self-help groups.',
      location: 'Community Hall, Aurangabad, Maharashtra', cause: 'Women Empowerment', eventDate: new Date(now.getTime() + 30 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() + 26 * 86400000).toISOString(), createdAt: now.toISOString(),
    },
    {
      id: 'evt-15', name: 'Farmers Support Helpline Drive', description: 'Raise awareness about government schemes and mental health support for farmers.',
      location: 'Agricultural Market Yard, Sangli, Maharashtra', cause: 'Community Development', eventDate: new Date(now.getTime() - 50 * 86400000).toISOString(),
      registrationDeadline: new Date(now.getTime() - 55 * 86400000).toISOString(), createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
    },
  ];
  const seedEvents: VolunteerEvent[] = seedData.map(e => ({ ...e, organizerName: 'Volunteer Connect' as string }));

  const existing = getEvents();

  // If no events at all, just seed fresh
  if (existing.length === 0) {
    set(EVENTS_KEY, seedEvents);
    return;
  }

  // Merge seed events into existing ones (update defaults, keep custom events)
  const byId = new Map<string, VolunteerEvent>(existing.map((e) => [e.id, { ...e, organizerName: e.organizerName || 'Volunteer Connect' }]));

  for (const evt of seedEvents) {
    const current = byId.get(evt.id);
    if (current) {
      // Overwrite default events with latest seed data (location, description, dates, etc.)
      byId.set(evt.id, { ...current, ...evt });
    } else {
      // New seeded event that didn't exist before
      byId.set(evt.id, evt);
    }
  }

  set(EVENTS_KEY, Array.from(byId.values()));
  seedDemoData();
};

export const seedDemoData = () => {
  const feedbacks = getFeedback();
  if (feedbacks.length === 0) {
    const v1: Volunteer = {
      id: 'vol-1', name: 'Alice Smith', email: 'alice@example.com', phone: '9876543210', city: 'Mumbai', cause: 'Environment', experience: 'Intermediate (1-3 years)', idType: 'Aadhaar Card', availability: ['Weekends'], registeredAt: new Date(Date.now() - 130 * 86400000).toISOString()
    };
    const v2: Volunteer = {
      id: 'vol-2', name: 'Bob Jones', email: 'bob@example.com', phone: '9876543211', city: 'Pune', cause: 'Education', experience: 'No Experience', idType: 'Voter ID', availability: ['Weekdays'], registeredAt: new Date(Date.now() - 100 * 86400000).toISOString()
    };
    const v3: Volunteer = {
      id: 'vol-3', name: 'Charlie Doe', email: 'charlie@example.com', phone: '9876543212', city: 'Nashik', cause: 'Healthcare', experience: 'Expert (3+ years)', idType: 'Passport', availability: ['Weekends', 'Evenings'], registeredAt: new Date(Date.now() - 80 * 86400000).toISOString()
    };
    set(VOLUNTEERS_KEY, [v1, v2, v3]);
    
    const regs: EventRegistration[] = [
      { id: 'reg-1', eventId: 'evt-4', volunteerId: 'vol-1', registeredAt: new Date(Date.now() - 115 * 86400000).toISOString(), certificateGenerated: true },
      { id: 'reg-2', eventId: 'evt-5', volunteerId: 'vol-1', registeredAt: new Date(Date.now() - 100 * 86400000).toISOString(), certificateGenerated: false },
      { id: 'reg-3', eventId: 'evt-9', volunteerId: 'vol-2', registeredAt: new Date(Date.now() - 85 * 86400000).toISOString(), certificateGenerated: true },
      { id: 'reg-4', eventId: 'evt-10', volunteerId: 'vol-3', registeredAt: new Date(Date.now() - 65 * 86400000).toISOString(), certificateGenerated: true },
      { id: 'reg-5', eventId: 'evt-10', volunteerId: 'vol-1', registeredAt: new Date(Date.now() - 65 * 86400000).toISOString(), certificateGenerated: true },
    ];
    set(REGISTRATIONS_KEY, regs);
    
    const feedbacks: EventFeedback[] = [
      { id: 'fb-1', eventId: 'evt-4', volunteerId: 'vol-1', rating: 5, comment: 'Amazing experience! the shelter animals were adorable.', submittedAt: new Date(Date.now() - 105 * 86400000).toISOString() },
      { id: 'fb-2', eventId: 'evt-5', volunteerId: 'vol-1', rating: 4, comment: 'Great initiative. Need more shovels next time.', submittedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
      { id: 'fb-3', eventId: 'evt-9', volunteerId: 'vol-2', rating: 5, comment: 'People were very receptive to the safety rules.', submittedAt: new Date(Date.now() - 75 * 86400000).toISOString() },
      { id: 'fb-4', eventId: 'evt-10', volunteerId: 'vol-3', rating: 5, comment: 'Very fulfilling to spend time at the old age home.', submittedAt: new Date(Date.now() - 55 * 86400000).toISOString() },
      { id: 'fb-5', eventId: 'evt-10', volunteerId: 'vol-1', rating: 3, comment: 'Good event, but it was slightly unorganized at the start.', submittedAt: new Date(Date.now() - 55 * 86400000).toISOString() },
    ];
    set(FEEDBACK_KEY, feedbacks);
  }
};
