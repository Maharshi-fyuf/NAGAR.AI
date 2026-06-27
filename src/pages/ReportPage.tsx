import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, Loader2, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadIssuePhoto, createIssue, findNearbyIssues } from '../lib/firestore';
import { analyzeIssueImage, fileToBase64, checkDuplicate } from '../lib/gemini';
import type { GeminiAnalysis, IssueLocation, Issue } from '../types';

const SEVERITY_COLORS = {
  low: 'text-green-400 bg-green-400/10 border-green-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  pothole: 'ðŸ•³ï¸ Pothole',
  streetlight: 'ðŸ’¡ Streetlight',
  garbage: 'ðŸ—‘ï¸ Garbage',
  water: 'ðŸ’§ Water',
  drainage: 'ðŸŒŠ Drainage',
  other: 'âš ï¸ Other',
};

type Step = 1 | 2 | 3;

export default function ReportPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [location, setLocation] = useState<IssueLocation | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{
    issue: Issue;
    confidence: number;
    reason: string;
  } | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError('');
    setAnalyzing(true);
    setStep(2);

    try {
      const base64 = await fileToBase64(selectedFile);
      const result = await analyzeIssueImage(base64, selectedFile.type);
      setAnalysis(result);
      setEditedTitle(result.title);
      setEditedDesc(result.description);
    } catch (err) {
      console.error('GEMINI ERROR:', err); // ADD THIS
      setError('AI analysis failed. Please fill in the details manually.');
      setAnalysis({
        category: 'other',
        severity: 'medium',
        title: '',
        description: '',
        suggestedAuthority: 'Municipal Corporation',
      });
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        console.log('GOT COORDS:', lat, lng);
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();
          const address = data.results?.[0]?.formatted_address ?? 'Ahmedabad, Gujarat, India';
          setLocation({ lat, lng, address, city: 'Ahmedabad' });
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: 'Ahmedabad' });
        }
        setGettingLocation(false);

        // Duplicate detection
        if (analysis) {
          setCheckingDuplicate(true);
          try {
            const nearby = await findNearbyIssues(lat, lng, 500, analysis.category);
            if (nearby.length > 0) {
              const candidates = nearby.map((i) => ({
                id: i.id,
                title: i.title,
                description: i.description,
              }));
              const result = await checkDuplicate(
                editedTitle || analysis.title,
                editedDesc || analysis.description,
                candidates
              );
              if (result.isDuplicate && result.matchedIssueId) {
                const matched = nearby.find((i) => i.id === result.matchedIssueId);
                if (matched) {
                  setDuplicateResult({
                    issue: matched,
                    confidence: result.confidence,
                    reason: result.reason,
                  });
                  setCheckingDuplicate(false);
                  setStep(3);
                  return;
                }
              }
            }
          } catch {
            // Silently fail â€” proceed to normal submit
          }
          setCheckingDuplicate(false);
        }

        setStep(3);
      },
      () => {
        setError('Could not get your location. Please enable location access.');
        setGettingLocation(false);
      }
    );
  }, [analysis, editedTitle, editedDesc]);

  const handleSubmit = useCallback(async () => {
    if (!file || !analysis || !location || !user) return;
    setSubmitting(true);
    setError('');

    try {
      const stripHTML = (str: string) => str.replace(/<[^>]*>/g, '').trim();
      const safeTitle = stripHTML(editedTitle || analysis.title).slice(0, 100);
      const safeDesc = stripHTML(editedDesc || analysis.description).slice(0, 500);

      const { compressImage } = await import('../lib/firestore');
      const compressed = await compressImage(file);
      const photoURL = await uploadIssuePhoto(compressed);
      const finalAnalysis = {
        ...analysis,
        title: safeTitle,
        description: safeDesc,
      };
      const issueId = await createIssue(finalAnalysis, photoURL, location, user.uid);
      navigate(`/issue/${issueId}`);
    } catch (err) {
      console.error('SUBMIT ERROR:', err); // ADD THIS
      setError('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  }, [file, analysis, location, user, editedTitle, editedDesc, navigate]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertTriangle size={48} className="text-orange-400" />
        <h2 className="text-xl font-semibold">Sign in to report an issue</h2>
        <p className="text-slate-400 text-center">Help your community by reporting civic problems</p>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 w-12 transition-colors ${step > s ? 'bg-orange-500' : 'bg-slate-800'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-slate-400 text-sm">
          {step === 1 ? 'Upload Photo' : step === 2 ? 'AI Analysis' : 'Confirm & Submit'}
        </span>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Report an Issue</h1>
          <p className="text-slate-400">Take or upload a photo of the civic problem. AI will analyze it automatically.</p>

          <div className="relative border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <div className="w-16 h-16 bg-slate-800 group-hover:bg-orange-500/20 rounded-full flex items-center justify-center transition-colors">
              <Camera size={28} className="text-slate-400 group-hover:text-orange-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Tap to upload photo</p>
              <p className="text-slate-500 text-sm mt-1">JPG, PNG up to 10MB</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Upload size={14} />
              <span>or drag and drop</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: AI Analysis */}
      {step === 2 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">AI Analysis</h1>

          {preview && (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="Issue" className="w-full h-56 object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-orange-400" />
                  <p className="text-white font-medium">Gemini is analyzing your photo...</p>
                </div>
              )}
            </div>
          )}

          {!analyzing && analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <p className="text-slate-500 text-xs mb-1">Category</p>
                  <p className="font-medium">{CATEGORY_LABELS[analysis.category]}</p>
                </div>
                <div className={`rounded-xl p-3 border ${SEVERITY_COLORS[analysis.severity]}`}>
                  <p className="text-xs mb-1 opacity-70">Severity</p>
                  <p className="font-medium capitalize">{analysis.severity}</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Title</label>
                  <input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Description</label>
                  <textarea
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-orange-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Route to Authority</label>
                  <p className="text-sm text-blue-400">{analysis.suggestedAuthority}</p>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={getLocation}
                disabled={gettingLocation || checkingDuplicate}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {gettingLocation ? (
                  <><Loader2 size={18} className="animate-spin" /> Getting Location...</>
                ) : checkingDuplicate ? (
                  <><Loader2 size={18} className="animate-spin" /> Checking for duplicates...</>
                ) : (
                  <><MapPin size={18} /> Confirm Location</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && analysis && location && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Confirm & Submit</h1>

          {/* Duplicate Warning */}
          {duplicateResult && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />
                <p className="text-yellow-400 font-semibold text-sm">Similar Issue Already Reported</p>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{duplicateResult.reason}</p>
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
                <img
                  src={duplicateResult.issue.photoURL}
                  alt={duplicateResult.issue.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{duplicateResult.issue.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {duplicateResult.issue.verificationCount} verifications · {duplicateResult.issue.status}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate(`/issue/${duplicateResult.issue.id}`)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  ðŸ‘ Upvote Existing
                </button>
                <button
                  onClick={() => setDuplicateResult(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Report Anyway
                </button>
              </div>
            </div>
          )}

          {/* Normal submit flow â€” shown when no duplicate or user chose Report Anyway */}
          {!duplicateResult && (
            <>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <img src={preview} alt="Issue" className="w-full h-40 object-cover" />
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold">{editedTitle || analysis.title}</h3>
                  <p className="text-slate-400 text-sm">{editedDesc || analysis.description}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={14} />
                    <span className="truncate">{location.address}</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle size={18} /> Submit Issue</>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


