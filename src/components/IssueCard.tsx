import { Link } from 'react-router-dom';
import { ThumbsUp, MapPin, Clock, ArrowRight } from 'lucide-react';
import type { Issue } from '../types';

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-green-400/10 text-green-400 border-green-400/30',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  high: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  critical: 'bg-red-400/10 text-red-400 border-red-400/30',
};

const STATUS_STYLES: Record<string, string> = {
  reported: 'bg-blue-400/10 text-blue-400',
  verified: 'bg-purple-400/10 text-purple-400',
  in_progress: 'bg-yellow-400/10 text-yellow-400',
  resolved: 'bg-green-400/10 text-green-400',
  rejected: 'bg-slate-400/10 text-slate-400',
};

interface Props {
  issue: Issue;
  compact?: boolean;
}

export default function IssueCard({ issue, compact = false }: Props) {
  const timeAgo = (ts: any) => {
    const now = Date.now();
    const then = ts?.toDate?.()?.getTime?.() ?? 0;
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex gap-3">
      {/* Thumbnail */}
      <img
        src={issue.photoURL}
        alt={issue.title}
        className={`rounded-xl object-cover flex-shrink-0 ${compact ? 'w-20 h-20' : 'w-24 h-24'}`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {issue.title}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${SEVERITY_STYLES[issue.severity]}`}>
            {issue.severity}
          </span>
        </div>

        {!compact && (
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{issue.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} />
            {issue.verificationCount}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin size={12} />
            <span className="truncate">{issue.location.address.split(',')[0]}</span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock size={12} />
            {timeAgo(issue.reportedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[issue.status]}`}>
            {issue.status.replace('_', ' ')}
          </span>
          <Link
            to={`/issue/${issue.id}`}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            View <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
