import { ContextType, User, Signal, NetworkConnection } from './types';

export const MOCK_USER: User = {
  id: 'me',
  name: 'Alex Rivera',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  tagline: 'Student @ Stanford CS',
  stats: {
    responseRate: 98,
    medianReplyTime: '42m',
    conversationsCompleted: 156,
    peopleHelped: 82,
    reciprocityCredits: 12
  },
  profiles: [
    {
      id: 'p1',
      type: ContextType.LEARNER,
      bio: 'Junior at Stanford. Building a distributed database in Rust. Want to chat with engineers who have shipped to production.',
      goals: ['Code reviews', 'Career paths in infra'],
      availabilityRules: '30 mins blocks, Tue/Thu eves',
      openTo: ['Learning', 'Tough feedback'],
      isActive: true
    }
  ]
};

export const MOCK_SIGNALS: Signal[] = [
  {
    id: 's1',
    userId: 'u1',
    userName: 'Sarah Chen',
    contextType: ContextType.PROFESSIONAL,
    content: 'Open to 2 founder chats about early GTM mistakes this week.',
    type: 'OFFER',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48)
  },
  {
    id: 's2',
    userId: 'u2',
    userName: 'Marcus Bell',
    contextType: ContextType.BUILDER,
    content: 'Looking for a warm intro to infra-focused seed VCs this week.',
    type: 'ASK',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12)
  },
  {
    id: 's3',
    userId: 'u3',
    userName: 'J.D. Vance',
    contextType: ContextType.LEARNER,
    content: 'Anyone who’s scaled B2B sales from 0–5, would love 15 min.',
    type: 'ASK',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
  }
];

export const MOCK_CONNECTIONS: NetworkConnection[] = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Sarah Chen',
    tagline: 'Founder, Sequoia Scout',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    ranking: 5,
    privateNotes: 'Insanely helpful on GTM. Follow up on the Stripe intro.',
    status: 'ACTIVE'
  },
  {
    id: 'c2',
    userId: 'u2',
    name: 'Marcus Bell',
    tagline: 'Staff Eng @ Google',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    ranking: 4,
    privateNotes: 'Expert in distributed systems. Ask about Paxos next time.',
    status: 'ACTIVE'
  }
];

export const MOCK_DISCOVERY_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    tagline: 'Founder, Sequoia Scout',
    stats: {
      responseRate: 94,
      medianReplyTime: '3h',
      conversationsCompleted: 842,
      peopleHelped: 310,
      reciprocityCredits: 45
    },
    profiles: [
      {
        id: 'u1p1',
        type: ContextType.PROFESSIONAL,
        bio: 'I help early stage founders find their first 10 customers. Former engineer at Stripe.',
        goals: ['Meeting builders', 'Giving feedback'],
        availabilityRules: 'I have 30 mins this week for students',
        openTo: ['Pitch feedback', 'Mentorship'],
        isActive: true
      }
    ]
  },
  {
    id: 'u2',
    name: 'Marcus Bell',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    tagline: 'Staff Eng @ Google',
    stats: {
      responseRate: 100,
      medianReplyTime: '12m',
      conversationsCompleted: 231,
      peopleHelped: 180,
      reciprocityCredits: 92
    },
    profiles: [
      {
        id: 'u3p1',
        type: ContextType.PROFESSIONAL,
        bio: 'Helping first-gen students break into systems programming. Happy to listen, not give advice.',
        goals: ['Mentorship'],
        availabilityRules: '2 slots/week max',
        openTo: ['Career Advice', 'Resume Roast'],
        isActive: true
      }
    ]
  }
];