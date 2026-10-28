import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

interface Props { onNavigate: (s: number) => void; }

const INSTITUTIONS = ["ABC Engineering College", "XYZ Institute of Technology", "Global University"];

const perfData = [
  { month: "Aug", avg: 68 }, { month: "Sep", avg: 72 }, { month: "Oct", avg: 71 },
  { month: "Nov", avg: 75 }, { month: "Dec", avg: 76 }, { month: "Jan", avg: 79 },
];

const coursePerf = [
  { course: "DSA", avg: 74 }, { course: "OS", avg: 81 }, { course: "DBMS", avg: 86 },
  { course: "Networks", avg: 69 }, { course: "AI/ML", avg: 77 },
];

export default function Screen7Analytics({ onNavigate }: Props) {
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
              <div className="text-[10px] text-slate-400">Admin Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {["Dashboard", "Students", "Courses", "Exams", "Analytics", "Proctoring Logs", "Settings"].map((item, i) => (
            <button key={item}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium mb-0.5 transition-all cursor-pointer ${i === 4 ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/70" : "text-slate-600 hover:bg-slate-50 border border-transparent"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === 4 ? "bg-indigo-600" : "bg-slate-300"}`} />
              {item}
            </button>
          ))}
        </nav>
        <div className="p-3.5 border-t border-slate-100 flex-shrink-0 space-y-2 bg-slate-50/40">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">AD</div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Dr. Anitha Desai</div>
              <div className="text-[10px] text-slate-400">Administrator</div>
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

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-500 text-sm">Academic Year 2024–25 · Semester 5</p>
          </div>

          {/* Institution selector — multi-tenant demo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select className="appearance-none border border-slate-200 bg-white rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm">
                {INSTITUTIONS.map((i) => <option key={i}>{i}</option>)}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▾</div>
            </div>
            <button onClick={() => onNavigate(8)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
              System Overview →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Students", value: "1,240", icon: "👥", color: "from-indigo-500 to-indigo-600", sub: "+48 this semester" },
            { label: "Active Courses", value: "48", icon: "📘", color: "from-purple-500 to-purple-600", sub: "Across 6 departments" },
            { label: "Average Performance", value: "76%", icon: "📊", color: "from-blue-500 to-blue-600", sub: "↑ 3.2% vs last sem" },
            { label: "Upcoming Exams", value: "12", icon: "📅", color: "from-orange-500 to-pink-500", sub: "Next 14 days" },
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
          {/* Performance trend */}
          <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Student Performance Trend</h3>
                <p className="text-xs text-slate-400">Monthly average score across all courses</p>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">AY 2024–25</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={perfData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[60, 85]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* At-risk + proctoring */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">⚠ At-Risk Students</h3>
              <div className="text-3xl font-extrabold text-red-600 mb-1">18</div>
              <p className="text-xs text-slate-500">Showing declining performance over 3 weeks</p>
              <div className="mt-3 h-1.5 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full w-[14%] bg-red-500 rounded-full" />
              </div>
              <div className="text-xs text-slate-400 mt-1">14% of active students</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">🔒 Proctoring Alerts</h3>
              <div className="space-y-1.5">
                {[
                  { type: "Tab Switch", count: 34, color: "bg-amber-500" },
                  { type: "Suspicious Activity", count: 7, color: "bg-red-500" },
                  { type: "Review Required", count: 12, color: "bg-orange-500" },
                ].map((a) => (
                  <div key={a.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${a.color}`} />
                      <span className="text-slate-600">{a.type}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Course performance */}
          <div className="col-span-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Course Performance</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coursePerf} margin={{ left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="course" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[60, 95]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Bar dataKey="avg" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Class Insights */}
          <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-md text-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-3">AI Class Insights</div>
                <div className="space-y-2.5">
                  {[
                    { icon: "📉", text: "32% of students are struggling with Graph Algorithms.", action: "View Students" },
                    { icon: "⚠️", text: "18 students show declining performance over last 3 weeks.", action: "Review List" },
                    { icon: "💡", text: "Recommended action: Provide additional Graph Algorithm practice sessions.", action: "Create Module" },
                  ].map((insight, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 bg-white/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">{insight.icon}</span>
                        <span className="text-sm text-white/90">{insight.text}</span>
                      </div>
                      <button className="text-indigo-200 text-[10px] font-semibold border border-white/20 rounded px-2 py-1 hover:bg-white/10 transition-colors whitespace-nowrap flex-shrink-0">
                        {insight.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
