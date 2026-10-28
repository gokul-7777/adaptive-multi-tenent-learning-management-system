interface Props {
  onNavigate: (screen: string) => void;
}

const FLOW = [
  { label: "MULTI-TENANT LMS", icon: "🏛️", color: "from-indigo-500 to-indigo-600" },
  { label: "STUDENT DATA", icon: "📂", color: "from-blue-500 to-blue-600" },
  { label: "AI COGNITIVE ASSESSMENT", icon: "🧪", color: "from-purple-500 to-purple-600" },
  { label: "COGNITIVE PROFILE", icon: "🧠", color: "from-violet-500 to-violet-600" },
  { label: "ADAPTIVE LEARNING ENGINE", icon: "⚙️", color: "from-indigo-600 to-purple-600" },
  { label: "PERSONALIZED CONTENT", icon: "📖", color: "from-blue-600 to-indigo-500" },
  { label: "ONLINE EXAM", icon: "🖥️", color: "from-emerald-500 to-emerald-600" },
  { label: "AI AUTOMATED PROCTORING", icon: "👁️", color: "from-orange-500 to-red-500" },
  { label: "RESULTS & ANALYTICS", icon: "📊", color: "from-purple-600 to-pink-600" },
  { label: "CONTINUOUS LEARNING", icon: "🔄", color: "from-indigo-500 to-blue-500" },
];

const PILLARS = [
  {
    icon: "🏛️",
    title: "MULTI-TENANT LMS",
    desc: "Multiple institutions on one secure platform.",
    detail: "Each institution has fully isolated data, custom branding, and independent configuration. Students and faculty from ABC Engineering College cannot access data from XYZ Institute of Technology.",
    color: "border-indigo-200 bg-indigo-50",
    badge: "bg-indigo-600",
    stats: [{ label: "Institutions", value: "3+" }, { label: "Data Isolation", value: "100%" }, { label: "Uptime SLA", value: "99.9%" }],
  },
  {
    icon: "🧠",
    title: "AI-DRIVEN ADAPTIVE LEARNING",
    desc: "Personalized learning based on student performance and learning profile.",
    detail: "Cognitive profiling assesses 6 dimensions per student. The AI engine generates a unique learning path, adapting in real-time after each quiz and assessment.",
    color: "border-purple-200 bg-purple-50",
    badge: "bg-purple-600",
    stats: [{ label: "Profile Dimensions", value: "6" }, { label: "Path Accuracy", value: "94%" }, { label: "Adaptation Delay", value: "<1s" }],
  },
  {
    icon: "👁️",
    title: "AUTOMATED PROCTORING",
    desc: "AI-assisted monitoring of online examinations.",
    detail: "Real-time face detection, identity verification, tab-switch detection, and single-person detection. Flagged sessions are marked for Review Required with an integrity score.",
    color: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-600",
    stats: [{ label: "Detection Accuracy", value: "97%" }, { label: "Checks per Minute", value: "60" }, { label: "False Positive Rate", value: "<3%" }],
  },
];

export default function SystemOverview({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top nav */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <div className="text-white text-sm font-bold">Adaptive LMS</div>
            <div className="text-white/40 text-[10px]">System Architecture Overview</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate("admin")} className="text-white/50 hover:text-white text-xs transition-colors">← Admin Dashboard</button>
          <button
            onClick={() => onNavigate("login")}
            className="group flex items-center gap-2 text-xs font-medium text-white/80 hover:text-rose-300 bg-white/[0.06] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 px-3.5 py-1.5 rounded-xl backdrop-blur-sm transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-xs"
          >
            <svg
              className="w-3.5 h-3.5 text-white/50 group-hover:text-rose-300 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="px-8 py-10">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-white/70 text-xs">First Review Prototype · AY 2024–25</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Intelligent Learning Ecosystem
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            Adaptive Multi-Tenant Learning Management with AI-Driven Cognitive Profile Assessment and Automated Proctoring
          </p>
        </div>

        {/* System flow */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-10">
          <h2 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-6 text-center">System Flow</h2>
          <div className="flex flex-wrap items-center justify-center gap-0">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="text-white/70 text-[9px] font-bold text-center mt-2 max-w-[72px] leading-tight">{step.label}</div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex flex-col items-center mx-1 pb-5">
                    <div className="text-indigo-400 text-sm">↓</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {PILLARS.map((p) => (
            <div key={p.title} className={`bg-white rounded-2xl border ${p.color} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${p.badge} flex items-center justify-center text-xl`}>{p.icon}</div>
                <div>
                  <div className="text-slate-800 text-xs font-bold uppercase tracking-wider">{p.title}</div>
                </div>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">{p.detail}</p>
              <div className="grid grid-cols-3 gap-2">
                {p.stats.map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-slate-800 text-sm font-bold">{s.value}</div>
                    <div className="text-slate-400 text-[9px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation guide */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-4">Prototype Navigation</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: "Login", action: "login" },
              { label: "Student Dashboard", action: "student" },
              { label: "Cognitive Profile", action: "cognitive" },
              { label: "Learning Path", action: "learning" },
              { label: "Online Exam", action: "exam" },
              { label: "Results", action: "results" },
              { label: "Admin Analytics", action: "admin" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(s.action)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  {s.label}
                </button>
                {i < 6 && <span className="text-white/30 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
