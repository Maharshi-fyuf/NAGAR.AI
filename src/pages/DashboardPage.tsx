import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../lib/firestore';
import { seedIssues } from '../lib/seedData';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  pothole: '#F97316',
  streetlight: '#FACC15',
  garbage: '#4ADE80',
  water: '#38BDF8',
  drainage: '#818CF8',
  other: '#94A3B8',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4ADE80',
  medium: '#FACC15',
  high: '#FB923C',
  critical: '#EF4444',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    await seedIssues(user.uid);
    setSeeding(false);
    setSeeded(true);
  };

  useEffect(() => {
    getDashboardStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (!stats) return null;

  const categoryData = Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }));
  const severityData = Object.entries(stats.bySeverity).map(([name, value]) => ({ name, value }));

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {!seeded && (
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-xl text-sm transition-colors"
        >
          {seeding ? '⏳ Seeding demo data...' : '🌱 Seed 10 Demo Issues (one time only)'}
        </button>
      )}
      {seeded && (
        <p className="text-green-400 text-sm text-center">✅ Demo issues seeded! Refresh the map.</p>
      )}
      <div>
        <h1 className="text-2xl font-bold">Impact Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Community civic issue tracker</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<TrendingUp size={20} className="text-blue-400" />}
          label="Total Issues"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-400" />}
          label="Resolved"
          value={stats.resolved}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle size={20} className="text-purple-400" />}
          label="Verified"
          value={stats.verified}
          color="purple"
        />
        <StatCard
          icon={<Clock size={20} className="text-orange-400" />}
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          color="orange"
        />
      </div>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="font-semibold mb-4">Issues by Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#94A3B8'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map(({ name, value }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: CATEGORY_COLORS[name] ?? '#94A3B8' }}
                    />
                    <span className="text-slate-400 capitalize">{name}</span>
                  </div>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Severity bar chart */}
      {severityData.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <h3 className="font-semibold mb-4">Issues by Severity</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={severityData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.total === 0 && (
        <div className="text-center py-16 text-slate-500">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <p>No issues reported yet.</p>
          <p className="text-sm mt-1">Be the first to report a civic problem!</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    orange: 'border-orange-500/20 bg-orange-500/5',
  };

  return (
    <div className={`rounded-2xl p-4 border ${colorMap[color] ?? ''} bg-slate-900`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
