import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
  where,
  increment,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Issue, AppUser, GeminiAnalysis, IssueLocation } from '../types';

// ─── IMAGE UPLOAD ────────────────────────────────────────────────────────────

export const uploadIssuePhoto = async (file: File): Promise<string> => {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  const form = new FormData();
  form.append('image', base64);
  form.append('key', import.meta.env.VITE_IMGBB_API_KEY);
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!data.success) throw new Error('Upload failed');
  return data.data.url;
};

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  });
};

// ─── ISSUES ──────────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findNearbyIssues(
  lat: number,
  lng: number,
  radiusMeters: number,
  category: string
): Promise<Issue[]> {
  const all = await getAllIssues(200);
  return all.filter((issue) => {
    if (issue.category !== category) return false;
    const dist = haversineDistance(lat, lng, issue.location.lat, issue.location.lng);
    return dist <= radiusMeters;
  });
}

export const createIssue = async (
  analysis: GeminiAnalysis,
  photoURL: string,
  location: IssueLocation,
  userId: string
): Promise<string> => {
  const issueData = {
    title: analysis.title,
    description: analysis.description,
    photoURL,
    category: analysis.category,
    severity: analysis.severity,
    aiConfidence: 0.9,
    suggestedAuthority: analysis.suggestedAuthority,
    location,
    status: 'reported',
    timeline: [
      {
        status: 'reported',
        timestamp: Timestamp.now(),
        note: 'Issue reported by citizen',
      },
    ],
    reportedBy: userId,
    reportedAt: serverTimestamp(),
    upvotes: [],
    verificationCount: 0,
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'issues'), issueData);

  // Update user report count + points
  await updateUserStats(userId, 'report');

  return docRef.id;
};

export const getIssue = async (id: string): Promise<Issue | null> => {
  const snap = await getDoc(doc(db, 'issues', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Issue;
};

export const getAllIssues = async (limitCount = 100): Promise<Issue[]> => {
  const q = query(
    collection(db, 'issues'),
    orderBy('reportedAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue));
};

// Real-time listener for map
export const subscribeToIssues = (
  callback: (issues: Issue[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'issues'),
    orderBy('reportedAt', 'desc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const issues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue));
    callback(issues);
  });
};

export const upvoteIssue = async (
  issueId: string,
  userId: string,
  hasVoted: boolean
): Promise<void> => {
  const issueRef = doc(db, 'issues', issueId);
  if (hasVoted) {
    await updateDoc(issueRef, {
      upvotes: arrayRemove(userId),
      verificationCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(issueRef, {
      upvotes: arrayUnion(userId),
      verificationCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    await updateUserStats(userId, 'verify');

    // Auto-upgrade status to verified if 3+ upvotes
    const snap = await getDoc(issueRef);
    const data = snap.data();
    if (data && data.verificationCount >= 3 && data.status === 'reported') {
      await updateDoc(issueRef, {
        status: 'verified',
        timeline: [
          ...data.timeline,
          {
            status: 'verified',
            timestamp: serverTimestamp(),
            note: 'Auto-verified after 3+ community confirmations',
          },
        ],
      });
    }
  }
};

export const saveComplaintLetter = async (
  issueId: string,
  letter: string
): Promise<void> => {
  await updateDoc(doc(db, 'issues', issueId), {
    complaintLetter: letter,
    updatedAt: serverTimestamp(),
  });
};

// ─── USERS ───────────────────────────────────────────────────────────────────

export const getOrCreateUser = async (firebaseUser: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Promise<void> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      id: firebaseUser.uid,
      displayName: firebaseUser.displayName ?? 'Anonymous',
      email: firebaseUser.email ?? '',
      photoURL: firebaseUser.photoURL ?? '',
      points: 0,
      reportCount: 0,
      verifyCount: 0,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, { lastActiveAt: serverTimestamp() });
  }
};

const updateUserStats = async (
  userId: string,
  action: 'report' | 'verify'
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  if (action === 'report') {
    await updateDoc(userRef, {
      points: increment(10),
      reportCount: increment(1),
    });
  } else {
    await updateDoc(userRef, {
      points: increment(2),
      verifyCount: increment(1),
    });
  }
};

export const getUser = async (userId: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AppUser;
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const snap = await getDocs(collection(db, 'issues'));
  const issues = snap.docs.map((d) => d.data() as Issue);

  const total = issues.length;
  const resolved = issues.filter((i) => i.status === 'resolved').length;
  const verified = issues.filter((i) => i.status === 'verified').length;
  const pending = issues.filter(
    (i) => i.status === 'reported' || i.status === 'in_progress'
  ).length;

  const byCategory = issues.reduce(
    (acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const bySeverity = issues.reduce(
    (acc, i) => {
      acc[i.severity] = (acc[i.severity] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return { total, resolved, verified, pending, byCategory, bySeverity };
};
