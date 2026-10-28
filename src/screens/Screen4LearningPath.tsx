interface Props { onNavigate: (s: number) => void; }

const NAV = ["Dashboard", "My Courses", "AI Learning Path", "Cognitive Profile", "Assessments", "Exams", "Results"];

const PATH_STAGES = [
  {
    stage: "Foundation",
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    topics: [
      { name: "Arrays", status: "done" },
      { name: "Linked Lists", status: "done" },
    ],
  },
  {
    stage: "Intermediate",
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    topics: [
      { name: "Stacks", status: "done" },
      { name: "Trees", status: "current" },
      { name: "Graphs", status: "upcoming" },
    ],
  },
  {
    stage: "Advanced",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    topics: [
      { name: "Advanced Algorithms", status: "locked" },
      { name: "Dynamic Programming", status: "locked" },
    ],
  },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs flex-shrink-0">✓</span>;
  if (status === "current") return <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 ring-4 ring-indigo-100"><span className="w-2 h-2 rounded-full bg-white" /></span>;
  if (status === "upcoming") return <span className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0"><span className="w-2 h-2 rounded-full bg-slate-300" /></span>;
  return <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">🔒</span>;
}

export default function Screen4LearningPath({ onNavigate }: Props) {
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
              onClick={() => { if (i === 0) onNavigate(2); if (i === 3) onNavigate(3); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium mb-0.5 transition-colors ${i === 2 ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === 2 ? "bg-indigo-600" : "bg-slate-300"}`} />
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
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">🤖 AI Personalized</span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Personalized Learning Path</h1>
          <p className="text-slate-500 text-sm">Data Structures & Algorithms · Adaptive to your cognitive profile</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Journey */}
          <div className="col-span-2 space-y-4">
            {PATH_STAGES.map((stage, si) => (
              <div key={stage.stage}>
                <div className={`rounded-xl border ${stage.borderColor} ${stage.bgColor} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <h3 className={`font-semibold text-sm ${stage.textColor}`}>{stage.stage}</h3>
                  </div>
                  <div className="space-y-2">
                    {stage.topics.map((topic) => (
                      <div
                        key={topic.name}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${topic.status === "current" ? "bg-white border-indigo-300 shadow-sm" : "bg-white/60 border-transparent"}`}
                      >
                        <StatusIcon status={topic.status} />
                        <span className={`text-sm font-medium ${topic.status === "done" ? "text-slate-500 line-through" : topic.status === "current" ? "text-indigo-800" : topic.status === "locked" ? "text-slate-400" : "text-slate-700"}`}>
                          {topic.name}
                        </span>
                        {topic.status === "current" && (
                          <span className="ml-auto text-[10px] font-semibold bg-indigo-600 text-white px-2 py-0.5 rounded-full">In Progress</span>
                        )}
                        {topic.status === "done" && (
                          <span className="ml-auto text-[10px] font-semibold text-emerald-600">Completed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {si < PATH_STAGES.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-6 bg-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Progress bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between text-xs text-slate-600 mb-2">
                <span className="font-medium">Overall Path Progress</span>
                <span className="font-semibold text-indigo-600">43% Complete</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[43%] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>3 of 7 topics completed</span>
                <span>Estimated: 3 hours remaining</span>
              </div>
            </div>
          </div>

          {/* Recommendation panel */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-md text-white">
              <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1">🎯 Recommended Next</div>
              <h3 className="text-xl font-bold mb-2">Trees</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Recommended based on your recent quiz performance and cognitive profile.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-xs text-white/70">Difficulty</span>
                  <span className="text-xs font-semibold text-amber-300">Intermediate</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-xs text-white/70">Est. Time</span>
                  <span className="text-xs font-semibold">45 minutes</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-xs text-white/70">Match Score</span>
                  <span className="text-xs font-semibold text-emerald-300">94% fit</span>
                </div>
              </div>
              <button className="w-full bg-white text-indigo-700 rounded-lg py-2.5 text-sm font-bold hover:bg-indigo-50 transition-colors">
                🚀 Start Learning
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Why Trees next?</h3>
              <div className="space-y-2">
                {[
                  "Prerequisite for Graphs (next topic)",
                  "Aligns with your logical reasoning strength",
                  "Quiz gaps detected in tree traversal",
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs text-slate-600">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Adaptive Engine</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This path updates in real-time as you complete quizzes and assessments. Difficulty adjusts to your cognitive profile automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
