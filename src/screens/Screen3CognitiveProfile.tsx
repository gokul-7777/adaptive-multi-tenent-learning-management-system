interface Props { onNavigate: (s: number) => void; }

const TRAITS = [
  { label: "Logical Reasoning", value: 82, angle: 0 },
  { label: "Memory", value: 88, angle: 60 },
  { label: "Attention", value: 76, angle: 120 },
  { label: "Problem Solving", value: 70, angle: 180 },
  { label: "Numerical Ability", value: 65, angle: 240 },
  { label: "Processing Speed", value: 79, angle: 300 },
];

const NAV = ["Dashboard", "My Courses", "AI Learning Path", "Cognitive Profile", "Assessments", "Exams", "Results"];

function RadarChart() {
  const cx = 140, cy = 140, r = 110;
  const n = TRAITS.length;

  const toXY = (angle: number, radius: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const axes = TRAITS.map((_, i) => toXY((360 / n) * i, r));
  const dataPoints = TRAITS.map((t) => toXY((360 / n) * TRAITS.indexOf(t), (t.value / 100) * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px]">
      {/* Grid rings */}
      {rings.map((ring) => {
        const pts = TRAITS.map((_, i) => toXY((360 / n) * i, r * ring));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={ring} d={path} fill="none" stroke="#e2e8f0" strokeWidth={1} />;
      })}
      {/* Axes */}
      {axes.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {/* Data fill */}
      <path d={dataPath} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth={2} />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#6366f1" stroke="white" strokeWidth={2} />
      ))}
      {/* Labels */}
      {TRAITS.map((t, i) => {
        const pt = toXY((360 / n) * i, r + 24);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#475569" fontFamily="Inter, sans-serif" fontWeight="500">
            {t.label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

export default function Screen3CognitiveProfile({ onNavigate }: Props) {
  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div>
              <div className="font-bold text-indigo-700 text-sm">AMLE</div>
              <div className="text-[10px] text-slate-400">ABC Engineering College</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2">
          {NAV.map((item, i) => (
            <button key={item}
              onClick={() => { if (i === 0) onNavigate(2); if (i === 2) onNavigate(4); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium mb-0.5 transition-colors ${i === 3 ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === 3 ? "bg-indigo-600" : "bg-slate-300"}`} />
              {item}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">RS</div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Rahul Sharma</div>
              <div className="text-[10px] text-slate-400">CS · Semester 5</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">🧠 AI Generated</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">AI Cognitive Profile</h1>
          <p className="text-slate-500 text-sm">Your learning profile based on assessment and academic performance.</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Radar */}
          <div className="col-span-1 bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col items-center">
            <h3 className="font-semibold text-slate-800 text-sm mb-1 self-start">Cognitive Radar</h3>
            <p className="text-xs text-slate-400 mb-4 self-start">Based on last 4 assessments</p>
            <RadarChart />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full">
              {TRAITS.map((t) => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{t.label.split(" ")[0]}</span>
                  <span className="text-xs font-semibold text-indigo-700">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards column */}
          <div className="col-span-2 space-y-4">
            {/* Strengths */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-base">💪</div>
                <h3 className="font-semibold text-slate-800">Strengths</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Memory · 88%", "Logical Reasoning · 82%"].map((s) => (
                  <div key={s} className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-800">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas to improve */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-base">🎯</div>
                <h3 className="font-semibold text-slate-800">Areas to Improve</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Numerical Ability · 65%", "Problem Solving · 70%"].map((s) => (
                  <div key={s} className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-amber-800">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insight */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-md text-white">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
                <div>
                  <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1">AI Learning Insight</div>
                  <p className="text-sm leading-relaxed text-white/90 mb-3">
                    Your profile indicates <strong>strong memory</strong> and <strong>logical reasoning</strong>. These are excellent foundations for Computer Science. Additional practice is recommended for <strong>numerical problem solving</strong> — your weakest dimension at 65%.
                  </p>
                  <button onClick={() => onNavigate(4)} className="bg-white text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors">
                    View Adaptive Learning Path →
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-sm flex-shrink-0">ℹ️</span>
              <p className="text-xs text-slate-500">
                <strong>Educational learning profile only.</strong> Not a medical or psychological diagnosis. This analysis is derived from academic performance data and assessment responses within this platform.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
