export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  cause: string;
  availability: string[];
  experience: string;
  idType: string;
  idFileName?: string;
  registeredAt: string;
  faceDescriptor?: number[];   // 128-dim face recognition vector
  facePhoto?: string;          // base64 JPEG data URL of registered face
}

export interface VolunteerEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  cause: string;
  organizerName: string;
  eventDate: string;
  registrationDeadline: string;
  createdAt: string;
}

export interface EventRegistration {
  id: string;
  volunteerId: string;
  eventId: string;
  registeredAt: string;
  certificateGenerated: boolean;
}

export const CITIES = [
  "Mumbai",
  "Pune",
  "Nagpur",
  "Nashik",
  "Thane",
  "Aurangabad",
  "Navi Mumbai",
  "Solapur",
  "Kolhapur",
  "Amravati",
];

export const CAUSES = [
  "Education", "Environment", "Healthcare", "Animal Welfare",
  "Disaster Relief", "Poverty Alleviation", "Community Development",
  "Women Empowerment", "Child Welfare", "Elder Care",
];

export const ID_TYPES = [
  "Passport", "Driver's License", "National ID", "Voter ID", "Aadhaar Card",
];

export const AVAILABILITY = [
  "Weekdays", "Weekends", "Mornings", "Afternoons", "Evenings",
];

export const EXPERIENCE_LEVELS = [
  "No Experience", "Beginner (< 1 year)", "Intermediate (1-3 years)", "Expert (3+ years)",
];

export interface EventFeedback {
  id: string;
  eventId: string;
  volunteerId: string;
  rating: number;
  comment: string;
  submittedAt: string;
}
