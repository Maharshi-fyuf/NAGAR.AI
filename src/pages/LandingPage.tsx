import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  
  // Parallax marker refs
  const m1 = useRef<HTMLDivElement>(null);
  const m2 = useRef<HTMLDivElement>(null);
  const m3 = useRef<HTMLDivElement>(null);
  const m4 = useRef<HTMLDivElement>(null);
  const m5 = useRef<HTMLDivElement>(null);

  // Stats ref
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimatedRef = useRef(false);
  const [issuesCount, setIssuesCount] = useState(0);
  const [stepsCount, setStepsCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [timeCount, setTimeCount] = useState(0);

  useEffect(() => {
    // ── CANVAS BACKGROUND ──
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    let cW: number, cH: number, pts: any[] = [];
    let animationFrameId: number;

    const resizeCV = () => {
      cW = cv.width = window.innerWidth;
      cH = cv.height = window.innerHeight;
      pts = [];
      for (let i = 0; i < 120; i++) {
        pts.push({
          x: Math.random() * cW,
          y: Math.random() * cH,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 1.5 + 0.5,
          a: Math.random()
        });
      }
    };

    const drawCV = () => {
      cx.clearRect(0, 0, cW, cH);
      // Grid
      cx.strokeStyle = 'rgba(26,39,68,.35)';
      cx.lineWidth = 0.5;
      for (let x = 0; x < cW; x += 80) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, cH); cx.stroke(); }
      for (let y = 0; y < cH; y += 80) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(cW, y); cx.stroke(); }
      // Connect nearby points
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            cx.strokeStyle = `rgba(26,39,68,${(1 - d / 120) * 0.4})`;
            cx.lineWidth = 0.5;
            cx.beginPath();
            cx.moveTo(pts[i].x, pts[i].y);
            cx.lineTo(pts[j].x, pts[j].y);
            cx.stroke();
          }
        }
      }
      pts.forEach(p => {
        p.x = (p.x + p.vx + cW) % cW;
        p.y = (p.y + p.vy + cH) % cH;
        cx.beginPath();
        cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        cx.fillStyle = `rgba(100,116,139,${p.a * 0.4})`;
        cx.fill();
      });
      animationFrameId = requestAnimationFrame(drawCV);
    };

    resizeCV();
    drawCV();
    window.addEventListener('resize', resizeCV);

    return () => {
      window.removeEventListener('resize', resizeCV);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    // ── SCROLL HANDLER ──
    const markers = [
      { el: m1.current, speed: 0.08 },
      { el: m2.current, speed: 0.13 },
      { el: m3.current, speed: 0.06 },
      { el: m4.current, speed: 0.1 },
      { el: m5.current, speed: 0.15 },
    ];

    const onScroll = () => {
      const sy = window.scrollY;

      // Parallax markers
      markers.forEach(m => {
        if (m.el) {
          m.el.style.transform = `translate3d(0, ${-sy * m.speed}px, 0)`;
        }
      });

      // Sticky section scroll progress
      if (wrapRef.current) {
        const wTop = wrapRef.current.offsetTop;
        const wH = wrapRef.current.offsetHeight - window.innerHeight;
        const progress = Math.max(0, Math.min(1, (sy - wTop) / wH));
        const panelIndex = Math.min(2, Math.floor(progress * 3));
        setCurrentPanel(panelIndex);
      }

      // Stats counter
      if (!statsAnimatedRef.current && statsRef.current) {
        const r = statsRef.current.getBoundingClientRect();
        if (r.top < window.innerHeight - 100) {
          statsAnimatedRef.current = true;
          
          const animateValue = (setter: React.Dispatch<React.SetStateAction<number>>, target: number) => {
            let n = 0;
            const step = target / 40;
            const iv = setInterval(() => {
              n = Math.min(n + step, target);
              setter(Math.floor(n));
              if (n >= target) clearInterval(iv);
            }, 30);
          };

          animateValue(setIssuesCount, 10);
          animateValue(setStepsCount, 3);
          animateValue(setCategoriesCount, 6);
          animateValue(setTimeCount, 2);
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Trigger once on mount
    onScroll();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nums = ['01', '02', '03'];

  return (
    <div className="landing-page">
      <div className="orbs">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      {/* NAV */}
      <nav className="lp-nav">
        <div className="nav-logo">Nagar<span>AI</span></div>
        <div className="nav-links">
          <Link to="/map">Map</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/about">About</Link>
        </div>
        <Link to="/report" className="nav-cta">Report an Issue →</Link>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <canvas ref={canvasRef} className="hero-bg-grid"></canvas>

        {/* Floating issue markers with parallax */}
        <div className="fmarker" ref={m1} style={{ top: '20%', left: '12%' }}>
          <div className="fm-dot" style={{ width: '14px', height: '14px', background: '#ef4444' }}></div>
          <div className="fm-ring" style={{ width: '28px', height: '28px', border: '1.5px solid #ef4444', animationDelay: '0s' }}></div>
          <div className="fm-label" style={{ background: 'rgba(239,68,68,.15)', color: '#f87171' }}>CRITICAL</div>
        </div>
        <div className="fmarker" ref={m2} style={{ top: '30%', right: '14%' }}>
          <div className="fm-dot" style={{ width: '12px', height: '12px', background: '#f97316' }}></div>
          <div className="fm-ring" style={{ width: '24px', height: '24px', border: '1.5px solid #f97316', animationDelay: '.8s' }}></div>
          <div className="fm-label" style={{ background: 'rgba(249,115,22,.15)', color: '#fb923c' }}>POTHOLE</div>
        </div>
        <div className="fmarker" ref={m3} style={{ bottom: '28%', left: '18%' }}>
          <div className="fm-dot" style={{ width: '10px', height: '10px', background: '#facc15' }}></div>
          <div className="fm-ring" style={{ width: '20px', height: '20px', border: '1.5px solid #facc15', animationDelay: '1.4s' }}></div>
          <div className="fm-label" style={{ background: 'rgba(250,204,21,.15)', color: '#fde047' }}>STREETLIGHT</div>
        </div>
        <div className="fmarker" ref={m4} style={{ bottom: '22%', right: '20%' }}>
          <div className="fm-dot" style={{ width: '11px', height: '11px', background: '#22c55e' }}></div>
          <div className="fm-ring" style={{ width: '22px', height: '22px', border: '1.5px solid #22c55e', animationDelay: '2s' }}></div>
          <div className="fm-label" style={{ background: 'rgba(34,197,94,.15)', color: '#4ade80' }}>VERIFIED</div>
        </div>
        <div className="fmarker" ref={m5} style={{ top: '55%', left: '7%' }}>
          <div className="fm-dot" style={{ width: '9px', height: '9px', background: '#38bdf8' }}></div>
          <div className="fm-ring" style={{ width: '18px', height: '18px', border: '1.5px solid #38bdf8', animationDelay: '.4s' }}></div>
        </div>

        <div className="hero-content" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="hero-eyebrow"><div className="live-dot"></div>Live · Ahmedabad, Gujarat</div>
          <div className="hero-headline">
            <span className="row1">Photograph it.</span>
            <span className="row2">AI fixes it.</span>
            <span className="row3">City thanks you.</span>
          </div>
          <p className="hero-sub">Gemini Vision identifies the civic issue. Google Maps pins it. A formal complaint is drafted — automatically. <b>No paperwork. No bureaucracy.</b></p>
          <div className="hero-ctas">
            <Link to="/map" className="btn-p">🗺 Explore the Map</Link>
            <Link to="/report" className="btn-g">📸 Report an Issue →</Link>
          </div>
        </div>

        <div className="scroll-prompt"><div className="scroll-bar"></div>SCROLL</div>
      </section>

      {/* STICKY HOW IT WORKS */}
      <div className="sticky-wrap" id="stickyWrap" ref={wrapRef}>
        <div className="sticky-inner">
          <div className="steps-container">

            {/* Panel 1 */}
            <div className={`step-panel ${currentPanel === 0 ? 'active' : 'exit-left'}`}>
              <div>
                <div className="step-num-big">01</div>
                <div className="step-tag">Step 1 · Perceive</div>
                <h2 className="step-title">Gemini sees what you see</h2>
                <p className="step-desc">Point your phone at any civic problem. Gemini Vision 2.5 Flash analyzes the image in under 2 seconds — detecting category, severity, and the exact authority responsible.</p>
                <div className="step-chip">🔷 Gemini Vision 2.5 Flash API</div>
              </div>
              <div className="step-visual">📸
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: 'rgba(6,10,20,.9)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '12px' }}>
                  <div style={{ color: '#f97316', fontWeight: 600, marginBottom: '4px' }}>AI Analysis Complete</div>
                  <div style={{ color: '#64748b' }}>Category: <span style={{ color: '#94a3b8' }}>Pothole · Critical</span></div>
                  <div style={{ color: '#64748b' }}>Authority: <span style={{ color: '#94a3b8' }}>PWD Department</span></div>
                </div>
              </div>
            </div>

            {/* Panel 2 */}
            <div className={`step-panel ${currentPanel === 1 ? 'active' : currentPanel > 1 ? 'exit-left' : ''}`}>
              <div>
                <div className="step-num-big">02</div>
                <div className="step-tag">Step 2 · Reason</div>
                <h2 className="step-title">AI routes it to the right authority</h2>
                <p className="step-desc">The agent determines routing — Municipal Corporation, PWD, Water Board, or Electricity Board. Your GPS coordinates are reverse-geocoded and the issue appears live on the city map.</p>
                <div className="step-chip">🗺 Google Maps JS API + Geocoding</div>
              </div>
              <div className="step-visual">🗺️
                <div style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(6,10,20,.9)', border: '1px solid rgba(249,115,22,.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#fb923c' }}>📍 Maninagar Cross Roads</div>
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', background: 'rgba(6,10,20,.9)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>Routing to → <span style={{ color: '#38bdf8' }}>Municipal Corporation</span></div>
              </div>
            </div>

            {/* Panel 3 */}
            <div className={`step-panel ${currentPanel === 2 ? 'active' : ''}`}>
              <div>
                <div className="step-num-big">03</div>
                <div className="step-tag">Step 3 · Act</div>
                <h2 className="step-title">Complaint letter, drafted instantly</h2>
                <p className="step-desc">A formal complaint letter is generated for the relevant authority — ready to copy and email in one tap. Community verifies via upvotes. Three verifications auto-escalates the issue status.</p>
                <div className="step-chip">✅ Community-verified · Auto-escalated</div>
              </div>
              <div className="step-visual">📨
                <div style={{ position: 'absolute', inset: '16px', background: 'rgba(6,10,20,.95)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', fontSize: '11px', color: '#475569', lineHeight: 1.8, overflow: 'hidden' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>COMPLAINT LETTER · GENERATED</div>
                  To: The Commissioner<br />Municipal Corporation of Ahmedabad<br /><br />
                  <span style={{ color: '#64748b' }}>Subject: Urgent — Critical Pothole at Maninagar Cross Roads requiring immediate repair...</span>
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'var(--orange)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px' }}>Copy Letter</div>
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="progress-bar-wrap">
              <div className={`prog-dot ${currentPanel === 0 ? 'active' : ''}`} onClick={() => setCurrentPanel(0)}></div>
              <div className="prog-line"></div>
              <div className={`prog-dot ${currentPanel === 1 ? 'active' : ''}`} onClick={() => setCurrentPanel(1)}></div>
              <div className="prog-line"></div>
              <div className={`prog-dot ${currentPanel === 2 ? 'active' : ''}`} onClick={() => setCurrentPanel(2)}></div>
            </div>

            <div className="step-counter">Step <span>{nums[currentPanel]}</span> / 03</div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip" ref={statsRef}>
        <div className="stat-item"><div className="stat-big"><span>{issuesCount}</span><span style={{ color: '#f97316' }}>+</span></div><div className="stat-lbl">Issues Mapped</div></div>
        <div className="stat-item"><div className="stat-big"><span>{stepsCount}</span></div><div className="stat-lbl">AI Agent Steps</div></div>
        <div className="stat-item"><div className="stat-big"><span>{categoriesCount}</span></div><div className="stat-lbl">Issue Categories</div></div>
        <div className="stat-item"><div className="stat-big"><span>{timeCount}</span><span style={{ color: 'var(--orange)' }}>s</span></div><div className="stat-lbl">AI Analysis Time</div></div>
      </div>

      {/* TECH */}
      <div className="tech-sec">
        <p>Built with Google Technologies</p>
        <div className="tech-row">
          <div className="t-pill"><div className="t-dot" style={{ background: '#f97316' }}></div>Gemini 2.5 Flash</div>
          <div className="t-pill"><div className="t-dot" style={{ background: '#3b82f6' }}></div>Firebase Firestore</div>
          <div className="t-pill"><div className="t-dot" style={{ background: '#22c55e' }}></div>Google Maps JS API</div>
          <div className="t-pill"><div className="t-dot" style={{ background: '#06b6d4' }}></div>Geocoding API</div>
          <div className="t-pill"><div className="t-dot" style={{ background: '#ef4444' }}></div>Firebase Auth</div>
          <div className="t-pill"><div className="t-dot" style={{ background: '#facc15' }}></div>Firebase Hosting</div>
          <div className="t-pill"><div className="t-dot" style={{ background: '#8b5cf6' }}></div>Google Sign-In</div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="final">
        <div className="final-small">Join the movement</div>
        <h2>Fix <span style={{ color: 'var(--orange)' }}>Ahmedabad.</span><br />One photo at a time.</h2>
        <p>Citizens are already reporting. Be the first to verify.</p>
        <Link to="/map" className="btn-p" style={{ fontSize: '16px', padding: '16px 36px' }}>Enter NagarAI →</Link>
        <div className="city-line">Vibe2Ship Hackathon · Coding Ninjas × Google for Developers · 2026</div>
      </div>
    </div>
  );
}
