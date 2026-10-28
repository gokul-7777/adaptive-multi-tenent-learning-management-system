interface Props { onNext: () => void; }

const INSTITUTIONS = ["ABC Engineering College", "XYZ Institute of Technology", "Global University"];
const ROLES = ["Student", "Teacher", "Admin"];

export default function Screen1Login({ onNext }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left — branding */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-indigo-700 text-lg leading-none">AMLE</div>
              <div className="text-xs text-slate-500">Learning Ecosystem</div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-3">
              Adaptive Multi-Tenant<br />Learning Ecosystem
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              One platform. Multiple institutions. Securely isolated data.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "🏛️", label: "Multi-Tenant Architecture", sub: "Each institution's data is fully isolated and secured" },
              { icon: "🧠", label: "AI Cognitive Profiling", sub: "Personalised learning based on your cognitive strengths" },
              { icon: "🔒", label: "Automated AI Proctoring", sub: "Secure, fair, and intelligent exam monitoring" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-white shadow-sm">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{f.label}</div>
                  <div className="text-slate-500 text-xs">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — login card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">Access your learning portal</p>

          {/* Institution selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Select Institution</label>
            <div className="relative">
              <select className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 pr-8">
                {INSTITUTIONS.map((i) => <option key={i}>{i}</option>)}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▾</div>
            </div>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r, i) => (
                <button
                  key={r}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${i === 0 ? "bg-indigo-600 text-white border-indigo-600 shadow" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                defaultValue="student@abc.edu"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg py-3 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            Sign In to Dashboard →
          </button>

          <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-indigo-700 text-xs text-center font-medium">
              🔐 Enterprise-grade isolation · GDPR compliant · Multi-tenant secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
