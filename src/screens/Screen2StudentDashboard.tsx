import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

interface Props { onNavigate: (s: number) => void; }

const progressData = [
  { week: "W1", score: 58 }, { week: "W2", score: 65 }, { week: "W3", score: 62 },
  { week: "W4", score: 71 }, { week: "W5", score: 74 }, { week: "W6", score: 78 },
  { week: "W7", score: 82 }, { week: "W8", score: 80 },
];

const subjectData = [
  { subject: "DSA", score: 78 }, { subject: "OS", score: 84 }, { subject: "DBMS", score: 88 },
  { subject: "Networks", score: 72 }, { subject: "AI", score: 81 },
];

const NAV = ["Dashboard", "My Courses", "AI Learning Path", "Cognitive Profile", "Assessments", "Exams", "Results"];

export default function Screen2StudentDashboard({ onNavigate }: Props) {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar - Fixed & Non-Scrollable */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen flex-shrink-0 select-none">
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-bold font-mono">A</span>
            </div>
            <div>
              <div className="font-bold text-indigo-700 text-sm">AMLE</div>
              <div className="text-[10px] text-slate-400">ABC Engineering College</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {NAV.map((item, i) => (
            <button
              key={item}
              onClick={() => { if (i === 2) onNavigate(4); if (i === 3) onNavigate(3); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium mb-0.5 transition-all cursor-pointer ${i === 0 ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/70" : "text-slate-600 hover:bg-slate-50 border border-transparent"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-indigo-600" : "bg-slate-300"}`} />
              {item}
            </button>
          ))}
        </nav>
        <div className="p-3.5 border-t border-slate-100 flex-shrink-0 space-y-2 bg-slate-50/40">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">RS</div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Rahul Sharma</div>
              <div className="text-[10px] text-slate-400">CS · Semester 5</div>
            </div>
          </div>
          <button
            onClick={() => onNavigate(1)}
            className="group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 bg-white/60 hover:bg-rose-50/80 border border-slate-200/80 hover:border-rose-200/90 backdrop-blur-sm transition-all duration-200 active:scale-[0.98] shadow-xs cursor-pointer"
            title="Sign Out"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100/80 group-hover:bg-rose-100/80 border border-slate-200/50 group-hover:border-rose-200/60 flex items-center justify-center transition-colors shadow-xs">
                <svg
                  className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 transition-colors"
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
              </div>
              <span className="font-semibold tracking-tight">Sign Out</span>
            </div>
            <svg
              className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome back, Rahul! 👋</h1>
            <p className="text-slate-500 text-sm">Here's your learning overview for today.</p>
          </div>
          <button onClick={() => onNavigate(5)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
            Start Exam →
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Overall Progress", value: "78%", icon: "📈", color: "from-indigo-500 to-indigo-600", sub: "+3% this week" },
            { label: "Average Score", value: "82%", icon: "⭐", color: "from-purple-500 to-purple-600", sub: "Top 15% in class" },
            { label: "Courses Enrolled", value: "5", icon: "📚", color: "from-blue-500 to-blue-600", sub: "2 in progress" },
            { label: "Learning Streak", value: "12 days", icon: "🔥", color: "from-orange-500 to-pink-500", sub: "Keep it up!" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
              <div className="text-xl font-bold text-slate-900 mb-0.5">{s.value}</div>
              <div className="text-xs font-medium text-slate-700 mb-0.5">{s.label}</div>
              <div className="text-xs text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Progress chart */}
          <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Learning Progress</h3>
                <p className="text-xs text-slate-400">Weekly performance trend</p>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Last 8 weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[50, 90]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: "#6366f1", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Subject performance */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">Subject Performance</h3>
            <p className="text-xs text-slate-400 mb-4">Current semester</p>
            <div className="space-y-2.5">
              {subjectData.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{s.subject}</span>
                    <span className="text-slate-500">{s.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.score >= 85 ? "bg-emerald-500" : s.score >= 75 ? "bg-indigo-500" : "bg-amber-500"}`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* AI Recommendation */}
          <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-md text-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
              <div>
                <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1">AI Recommendation</div>
                <p className="text-sm leading-relaxed text-white/90 mb-3">
                  Your performance in <strong>Data Structures</strong> is improving, but your problem-solving accuracy is below your average. We recommend practising <strong>Trees and Graphs</strong>.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => onNavigate(4)} className="bg-white text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors">
                    View Learning Path
                  </button>
                  <button onClick={() => onNavigate(3)} className="border border-white/30 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition-colors">
                    See Cognitive Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming exam */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📅</span>
              <h3 className="font-semibold text-slate-800 text-sm">Upcoming Exam</h3>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
              <div className="font-semibold text-slate-800 text-sm">Data Structures & Algorithms</div>
              <div className="text-xs text-slate-500 mt-0.5">Tomorrow · 10:00 AM · 2 Hours</div>
              <div className="mt-2 text-xs text-red-600 font-medium">⏰ 14 hours remaining</div>
            </div>
            <button onClick={() => onNavigate(5)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-xs font-semibold transition-colors">
              Enter Exam Hall →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
