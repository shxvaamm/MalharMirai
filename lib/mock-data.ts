export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date_time: string;
  venue: string;
  poster_url: string;
  max_capacity: number;
  registered_count: number;
  status: "upcoming" | "ongoing" | "completed";
  rules: string[];
  prizes: string[];
  registration_deadline?: string;
  coordinators?: { name: string; phone: string }[];
}

export interface ClubMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "admin" | "member" | "volunteer";

  department: string;
  avatar_url?: string;
  avatar_initials: string;
  bio: string;
  year?: string;
  specialty: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    email?: string;
  };
}

export interface Department {
  id: string;
  name: string;
  description: string;
  lead: string;
  memberCount: number;
  image_url?: string;
  logo_url?: string;
  icon?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "normal" | "urgent";
  is_emergency: boolean;
  created_at: string;
}

export interface GalleryMedia {
  id: string;
  title: string;
  media_url: string;
  media_type: "image" | "video";
  category: "general" | "previous_events" | "workshops";
  date: string;
  event_title?: string;
  thumbnail_color?: string;
}

export interface ClubStats {
  activeMembers: number;
  eventsOrganised: number;
}

export const SOCIETY_INFO = {
  name: "MALHAR – The Cultural Society of Mirai",
  shortName: "MALHAR",
  tagline: "The Cultural Society of Mirai School of Technology",
  founded: "Started by the 2025–29 batch",
  aboutText: "Malhar is the cultural society of Mirai School of Technology, started by the 2025–29 batch.",
  college: "Mirai School of Technology",
  contact: {
    email: "malharmirai01@gmail.com",
    instagram: "https://www.instagram.com/malhar_mirai.hiet/",
    location: "Mirai School of Technology Campus, Student Center",
  },
};

export const DEFAULT_CLUB_STATS: ClubStats = {
  activeMembers: 7,
  eventsOrganised: 8,
};

// ===================== OFFICIAL SOCIETY DEPARTMENTS =====================
export const OFFICIAL_DEPARTMENTS: Department[] = [
  {
    id: "dept-management",
    name: "Management Department",
    description: "Festival logistics, stage coordination, artist hospitality, crowd flow management, and event operations.",
    lead: "Management Coordinator",
    memberCount: 0,
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dept-media",
    name: "Media Department",
    description: "Photography, cinematography, aftermovies, reel production, live streaming, and official campus coverage.",
    lead: "Media Coordinator",
    memberCount: 0,
    image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dept-tech",
    name: "Tech Department",
    description: "Web application development, portal systems, audio-visual technical setups, stage tech, and digital infrastructure.",
    lead: "Tech Coordinator",
    memberCount: 0,
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dept-designing",
    name: "Designing Department",
    description: "Visual identity, creative typography, digital stage posters, UI banners, 3D assets, and fest branding.",
    lead: "Designing Coordinator",
    memberCount: 0,
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dept-pr",
    name: "PR Department",
    description: "Public relations, stage anchoring, formal presentations, inter-college sponsorships, and institutional outreach.",
    lead: "PR Coordinator",
    memberCount: 0,
    image_url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
  },
];


export interface HeroSlide {
  id: string;
  image_url: string;
  title?: string;
  caption?: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export const MOCK_DEPARTMENTS: Department[] = OFFICIAL_DEPARTMENTS;

export const MOCK_MEMBERS: ClubMember[] = [];

export const MOCK_EVENTS: ClubEvent[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [];

export const MOCK_GALLERY: GalleryMedia[] = [];

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&auto=format&fit=crop&q=80",
    title: "Stage Performances & Lights",
    caption: "Mirai Annual Cultural Fest",
    order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "slide-2",
    image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1920&auto=format&fit=crop&q=80",
    title: "Live Band Showdown",
    caption: "Music & Rhythm Battles",
    order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "slide-3",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&auto=format&fit=crop&q=80",
    title: "Choreography Showcase",
    caption: "Street Dance & Theatre",
    order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "slide-4",
    image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1920&auto=format&fit=crop&q=80",
    title: "Auditorium Celebrations",
    caption: "Together on Stage and Beyond",
    order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];


