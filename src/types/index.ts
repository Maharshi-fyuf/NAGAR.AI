import { Timestamp } from 'firebase/firestore';

export type IssueCategory =
  | 'pothole'
  | 'streetlight'
  | 'garbage'
  | 'water'
  | 'drainage'
  | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus =
  | 'reported'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export interface IssueLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
  ward?: string;
}

export interface IssueTimelineEntry {
  status: IssueStatus;
  timestamp: Timestamp;
  note?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  photoURL: string;

  // AI fields
  category: IssueCategory;
  severity: IssueSeverity;
  aiConfidence: number;
  suggestedAuthority: string;
  complaintLetter?: string;

  // Location
  location: IssueLocation;

  // Status
  status: IssueStatus;
  timeline: IssueTimelineEntry[];

  // Community
  reportedBy: string;
  reportedAt: Timestamp;
  upvotes: string[];
  verificationCount: number;

  updatedAt: Timestamp;
}

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  points: number;
  reportCount: number;
  verifyCount: number;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

export interface GeminiAnalysis {
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestedAuthority: string;
}
