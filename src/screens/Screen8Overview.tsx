interface Props { onNavigate: (s: number) => void; }

const FLOW = [
  "Multi-Tenant LMS",
  "Student Data",
  "AI Cognitive Assessment",
  "Cognitive Profile",
  "Adaptive Learning Engine",
  "Personalised Content",
  "Online Exam",
  "AI Automated Proctoring",
  "Results & Analytics",
  "Continuous Learning",
];

const PILLARS = [
  {
    number: "01",
    title: "Multi-Tenant LMS",
    desc: "Multiple institutions on one secure platform. Each tenant's data is fully isolated, encrypted, and governed independently.",
    icon: "🏛️",
    color: "from-blue-500 to-indigo-600",
    items: ["Institution-level isolation", "Role-based access control", "Shared infrastructure, separate data", "GDPR & compliance ready"],
  },
  {
    number: "02",
    title: "AI-Driven Adaptive Learning",
    desc: "Personalised learning based on student performance and cognitive profile. The system adapts in real-time.",
    icon: "🧠",
    color: "from-indigo-500 to-purple-600",
    items: ["Cognitive profile assessment", "Adaptive content sequencing", "AI-powered recommendations", "Performance-based difficulty"],
  },
  {
    number: "03",
    title: "Automated AI Proctoring",
    desc: "AI-assisted monitoring of online examinations. Fair, secure, and privacy-preserving.",
    icon: "🔒",
    color: "from-purple-500 to-pink-600",
    items: ["Real-time face detection", "Identity verification", "Suspicious activity flagging", "Instructor review dashboard"],
  },
];

export default function Screen8Overview({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-lg">AMLE</div>
            <div className="text-indigo-300 text-xs">Adaptive Multi-Tenant Learning Ecosystem</div>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Intelligent Learning Ecosystem</h1>
        <p className="text-indigo-300 text-sm max-w-lg mx-auto">
          End-to-end architecture combining multi-tenant infrastructure, AI-driven personalisation, and automated examination proctoring.
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={() => onNavigate(1)} className="text-xs text-indigo-300 hover:text-white border border-indigo-700 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition-colors">
            ← Back to Login
          </button>
          <button onClick={() => onNavigate(7)} className="text-xs text-indigo-300 hover:text-white border border-indigo-700 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition-colors">
            Admin Dashboard
          </button>
        </div>
      </div>

      {/* System flow */}
      <div className="mb-10">
        <h2 className="text-center text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-6">Complete System Flow</h2>
        <div className="flex items-center justify-center flex-wrap gap-2">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${i % 3 === 0 ? "bg-blue-950/60 border-blue-700/40 text-blue-200" : i % 3 === 1 ? "bg-indigo-950/60 border-indigo-700/40 text-indigo-200" : "bg-purple-950/60 border-purple-700/40 text-purple-200"}`}>
                <span className="text-[10px] font-mono text-white/30">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-semibold whitespace-nowrap">{step}</span>
              </div>
              {i < FLOW.length - 1 && (
                <span className="text-indigo-600 text-lg">↓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {PILLARS.map((p) => (
          <div key={p.number} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
              {p.icon}
            </div>
            <div className="text-indigo-400 font-mono text-xs mb-1">{p.number}</div>
            <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">{p.desc}</p>
            <div className="space-y-1.5">
              {p.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  <span className="text-slate-300 text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-white font-bold text-sm mb-4">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { layer: "Frontend", tech: "React.js · TailwindCSS", icon: "⚛️" },
            { layer: "Backend & Auth", tech: "Supabase · PostgreSQL", icon: "🗄️" },
            { layer: "AI/ML Engine", tech: "Python · Scikit-learn", icon: "🤖" },
            { layer: "Proctoring", tech: "OpenCV · TensorFlow.js", icon: "📷" },
          ].map((t) => (
            <div key={t.layer} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-xl mb-2">{t.icon}</div>
              <div className="text-white text-xs font-bold">{t.layer}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">{t.tech}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation to all screens */}
      <div className="text-center">
        <p className="text-indigo-400 text-xs mb-3">Navigate to any screen in the prototype:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { label: "1. Login", s: 1 }, { label: "2. Student Dashboard", s: 2 },
            { label: "3. Cognitive Profile", s: 3 }, { label: "4. Learning Path", s: 4 },
            { label: "5. Exam + Proctoring", s: 5 }, { label: "6. Results", s: 6 },
            { label: "7. Admin Analytics", s: 7 },
          ].map((n) => (
            <button
              key={n.s}
              onClick={() => onNavigate(n.s)}
              className="text-xs text-indigo-300 hover:text-white border border-indigo-800 hover:border-indigo-500 rounded-lg px-3 py-1.5 transition-colors"
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mt-8 text-slate-600 text-xs">
        First Project Review Prototype · AMLE · 2024
      </div>
    </div>
  );
}
