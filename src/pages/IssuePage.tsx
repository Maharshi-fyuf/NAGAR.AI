import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ThumbsUp, MapPin, FileText, Copy, Loader2,
  CheckCircle, ArrowLeft, Clock, Share2
} from 'lucide-react';
import { getIssue, upvoteIssue, saveComplaintLetter } from '../lib/firestore';
import { generateComplaintLetter } from '../lib/gemini';
import { useAuth } from '../context/AuthContext';
import type { Issue } from '../types';

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-green-400/10 text-green-400 border border-green-400/30',
  medium: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30',
  high: 'bg-orange-400/10 text-orange-400 border border-orange-400/30',
  critical: 'bg-red-400/10 text-red-400 border border-red-400/30',
};

const STATUS_STEPS = ['reported', 'verified', 'in_progress', 'resolved'];
const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  verified: 'Verified',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function IssuePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [letterVisible, setLetterVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getIssue(id).then((data) => {
      setIssue(data);
      setLoading(false);
    });
  }, [id]);

  const hasVoted = user ? issue?.upvotes.includes(user.uid) ?? false : false;

  const handleUpvote = async () => {
    if (!user) { signInWithGoogle(); return; }
    if (!issue) return;
    setUpvoting(true);
    await upvoteIssue(issue.id, user.uid, hasVoted);
    // Refresh issue
    const updated = await getIssue(issue.id);
    setIssue(updated);
    setUpvoting(false);
  };

  const handleGenerateLetter = async () => {
    if (!issue) return;
    setGeneratingLetter(true);
    try {
      let letter = issue.complaintLetter;
      if (!letter) {
        letter = await generateComplaintLetter(issue);
        await saveComplaintLetter(issue.id, letter);
        setIssue({ ...issue, complaintLetter: letter });
      }
      setLetterVisible(true);
    } catch {
      alert('Failed to generate letter. Please try again.');
    } finally {
      setGeneratingLetter(false);
    }
  };

  const copyLetter = () => {
    if (issue?.complaintLetter) {
      navigator.clipboard.writeText(issue.complaintLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareIssue = () => {
    if (navigator.share) {
      navigator.share({ title: issue?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-400">Issue not found</p>
        <button onClick={() => navigate('/')} className="text-orange-400 hover:text-orange-300">
          Back to Map
        </button>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.indexOf(issue.status);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Photo */}
      <div className="rounded-2xl overflow-hidden">
        <img src={issue.photoURL} alt={issue.title} className="w-full h-56 object-cover" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold leading-tight">{issue.title}</h1>
        <span className={`text-xs px-2 py-1 rounded-full capitalize flex-shrink-0 ${SEVERITY_STYLES[issue.severity]}`}>
          {issue.severity}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed">{issue.description}</p>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <MapPin size={14} className="text-orange-400" />
        <span>{issue.location.address}</span>
      </div>

      {/* Authority */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-2">
        <span className="text-xs text-slate-400">Routed to:</span>
        <span className="text-sm text-blue-400 font-medium">{issue.suggestedAuthority}</span>
      </div>

      {/* Status Timeline */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Status Timeline</h3>
        <div className="flex items-center gap-1">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-colors ${
                    i <= currentStatusIndex
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-slate-700 text-slate-600'
                  }`}
                >
                  {i <= currentStatusIndex ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span className={`text-xs mt-1 text-center ${i <= currentStatusIndex ? 'text-orange-400' : 'text-slate-600'}`}>
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 ${i < currentStatusIndex ? 'bg-orange-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleUpvote}
          disabled={upvoting}
          className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${
            hasVoted
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-orange-500'
          }`}
        >
          {upvoting ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
          <span className="text-xs">{issue.verificationCount} Verified</span>
        </button>

        <button
          onClick={handleGenerateLetter}
          disabled={generatingLetter}
          className="flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
        >
          {generatingLetter ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          <span className="text-xs">
            {issue.complaintLetter ? 'View Letter' : 'Generate'}
          </span>
        </button>

        <button
          onClick={shareIssue}
          className="flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:border-green-500 hover:text-green-400 transition-colors"
        >
          <Share2 size={18} />
          <span className="text-xs">Share</span>
        </button>
      </div>

      {/* Complaint Letter Modal */}
      {letterVisible && issue.complaintLetter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-5 w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Complaint Letter</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyLetter}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    copied ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setLetterVisible(false)}
                  className="text-slate-500 hover:text-white px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
              {issue.complaintLetter}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Copy this letter and email it to {issue.suggestedAuthority} with your contact details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
