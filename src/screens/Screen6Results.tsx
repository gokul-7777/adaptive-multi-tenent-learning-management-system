import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props { onNavigate: (s: number) => void; }

const NAV = ["Dashboard", "My Courses", "AI Learning Path", "Cognitive Profile", "Assessments", "Exams", "Results"];

const TOPICS = [
  { topic: "Arrays", score: 92 },
  { topic: "Linked Lists", score: 85 },
  { topic: "Stacks", score: 88 },
  { topic: "Trees", score: 68 },
  { topic: "Graphs", score: 65 },
];

export default function Screen6Results({ onNavigate }: Props) {
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
              onClick={() => { if (i === 0) onNavigate(2); if (i === 3) onNavigate(3); if (i === 2) onNavigate(4); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium mb-0.5 transition-colors ${i === 6 ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === 6 ? "bg-indigo-600" : "bg-slate-300"}`} />
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
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Exam Results</h1>
            <p className="text-slate-500 text-sm">Data Structures & Algorithms · Mid Semester · 2024</p>
          </div>
          <button onClick={() => onNavigate(2)} className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            ← Back to Dashboard
          </button>
        </div>

        {/* Score hero */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-md text-white flex flex-col items-center justify-center">
            <div className="text-5xl font-extrabold mb-1">82%</div>
            <div className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-3">Final Score</div>
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
              <span className="text-indigo-700 text-2xl font-extrabold">A</span>
            </div>
            <div className="text-white text-sm font-semibold mt-1.5">Grade A</div>
          </div>
          {[
            { label: "Correct Answers", value: "41/50", icon: "✅", sub: "2 wrong · 7 skipped" },
            { label: "Time Taken", value: "42 min", icon: "⏱️", sub: "18 min remaining" },
            { label: "Class Rank", value: "#8", icon: "🏆", sub: "Top 12% of class" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xl font-bold text-slate-900 mb-0.5">{s.value}</div>
              <div className="text-xs font-medium text-slate-700">{s.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Topic performance */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Topic-wise Performance</h3>
            <div className="space-y-3">
              {TOPICS.map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{t.topic}</span>
                    <span className={`font-semibold ${t.score >= 85 ? "text-emerald-600" : t.score >= 70 ? "text-indigo-600" : "text-amber-600"}`}>{t.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.score >= 85 ? "bg-emerald-500" : t.score >= 70 ? "bg-indigo-500" : "bg-amber-500"}`}
                      style={{ width: `${t.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Correct vs Incorrect */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Answer Breakdown</h3>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOPICS} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="topic" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500" />Correct: 41</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-500" />Wrong: 2</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-400" />Skipped: 7</div>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-md text-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
              <div>
                <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1">AI Insight</div>
                <p className="text-sm leading-relaxed text-white/90 mb-3">
                  Your performance is <strong>strong in fundamental data structures</strong> — Arrays (92%), Linked Lists (85%), and Stacks (88%) are well-mastered. <strong>Trees (68%) and Graphs (65%) require additional practice</strong>. Your cognitive profile shows room for improvement in problem solving, which correlates with these lower scores.
                </p>
                <button className="bg-white text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 transition-colors">
                  Generate Personalised Practice →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Next Steps</h3>
            <div className="space-y-2">
              {[
                { icon: "📚", text: "Practice Trees — 3 modules available" },
                { icon: "🎯", text: "Take Graphs mini-quiz (20 min)" },
                { icon: "🧠", text: "Review cognitive profile update" },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-base flex-shrink-0">{s.icon}</span>
                  <span className="text-xs text-slate-700 font-medium leading-snug">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
