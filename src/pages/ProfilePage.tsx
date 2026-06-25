import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Star, MapPin, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUser, getAllIssues } from '../lib/firestore';
import type { AppUser, Issue } from '../types';
import IssueCard from '../components/IssueCard';

export default function ProfilePage() {
  const { user, logout, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      getUser(user.uid),
      getAllIssues(200),
    ]).then(([userData, allIssues]) => {
      setAppUser(userData);
      setMyIssues(allIssues.filter((i) => i.reportedBy === user.uid));
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
          <Star size={32} className="text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold">Sign in to see your profile</h2>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
        <img
          src={user.photoURL ?? ''}
          alt="avatar"
          className="w-16 h-16 rounded-full border-2 border-orange-500"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{user.displayName}</h2>
          <p className="text-slate-400 text-sm truncate">{user.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">{appUser?.points ?? 0} points</span>
          </div>
        </div>
        <button
          onClick={async () => { await logout(); navigate('/'); }}
          className="text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <MapPin size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{appUser?.reportCount ?? 0}</p>
            <p className="text-xs text-slate-500">Issues Reported</p>
          </div>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <ThumbsUp size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{appUser?.verifyCount ?? 0}</p>
            <p className="text-xs text-slate-500">Issues Verified</p>
          </div>
        </div>
      </div>

      {/* My Reports */}
      <div>
        <h3 className="font-semibold mb-3">My Reports ({myIssues.length})</h3>
        {myIssues.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <MapPin size={32} className="mx-auto mb-3 opacity-30" />
            <p>No issues reported yet</p>
            <p className="text-sm mt-1">Help your community — report a civic issue!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myIssues.map((issue) => (
              <div key={issue.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                <IssueCard issue={issue} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
