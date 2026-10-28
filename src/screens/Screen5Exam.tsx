import { useState, useEffect } from "react";

interface Props { onNavigate: (s: number) => void; }

const QUESTIONS = [
  {
    q: "What is the time complexity of searching in a balanced Binary Search Tree?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correct: 1,
  },
  {
    q: "Which traversal visits nodes in Left → Root → Right order?",
    options: ["Pre-order", "Post-order", "In-order", "Level-order"],
    correct: 2,
  },
  {
    q: "In a max-heap, which element is always at the root?",
    options: ["Minimum element", "Maximum element", "Median element", "Random element"],
    correct: 1,
  },
];

const PROCTORING = [
  { label: "Face Detected", ok: true },
  { label: "Identity Verified", ok: true },
  { label: "Single Person Detected", ok: true },
  { label: "Full Screen Active", ok: true },
  { label: "Tab Switch Detected: 1", ok: false },
];

export default function Screen5Exam({ onNavigate }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(7200);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const answered = Object.keys(selected).length;
  const q = QUESTIONS[current];

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">Data Structures & Algorithms — Mid Semester Exam</div>
            <div className="text-xs text-slate-500">ABC Engineering College · CS5 · 50 Questions</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-medium">Answered</div>
            <div className="text-sm font-bold text-slate-800">{answered}/50</div>
          </div>
          <div className={`text-center px-4 py-1.5 rounded-lg ${timeLeft < 900 ? "bg-red-50" : "bg-indigo-50"}`}>
            <div className="text-xs font-medium text-slate-500">Time Remaining</div>
            <div className={`text-lg font-bold font-mono ${timeLeft < 900 ? "text-red-600" : "text-indigo-700"}`}>{fmt(timeLeft)}</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-slate-200 px-6 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Progress:</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(answered / 50) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-indigo-600">{Math.round((answered / 50) * 100)}%</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            {/* Question */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Question {current + 1} of 50</span>
                {marked.has(current) && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">🔖 Marked for Review</span>
                )}
              </div>
              <p className="text-slate-800 font-medium text-base leading-relaxed mb-6">{q.q}</p>
              <div className="space-y-2.5">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected((p) => ({ ...p, [current]: i }))}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all text-sm ${selected[current] === i ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700"}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected[current] === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setMarked((p) => { const n = new Set(p); n.has(current) ? n.delete(current) : n.add(current); return n; })}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${marked.has(current) ? "bg-amber-100 text-amber-700 border border-amber-300" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  🔖 {marked.has(current) ? "Unmark" : "Mark for Review"}
                </button>
                <button
                  onClick={() => { if (current < QUESTIONS.length - 1) setCurrent((c) => c + 1); else onNavigate(6); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                >
                  {current < QUESTIONS.length - 1 ? "Next →" : "Submit Exam →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Proctoring panel */}
        <div className="w-64 bg-white border-l border-slate-200 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">AI PROCTORING</span>
          </div>

          {/* Webcam */}
          <div className="rounded-xl overflow-hidden bg-slate-800 mb-4 aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-1">👤</div>
              <div className="text-slate-400 text-xs">Live Webcam</div>
              <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-1 animate-pulse" />
            </div>
          </div>

          {/* Status badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-700">Proctoring Status: ACTIVE</span>
          </div>

          {/* Checks */}
          <div className="space-y-2 mb-4">
            {PROCTORING.map((p) => (
              <div key={p.label} className={`flex items-center gap-2 p-2 rounded-lg ${p.ok ? "bg-slate-50" : "bg-amber-50 border border-amber-200"}`}>
                <span className={`text-sm ${p.ok ? "text-emerald-500" : "text-amber-500"}`}>{p.ok ? "✓" : "⚠"}</span>
                <span className={`text-xs font-medium ${p.ok ? "text-slate-700" : "text-amber-700"}`}>{p.label}</span>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-bold text-amber-700 mb-1">⚠ Review Required</div>
            <p className="text-xs text-amber-600">Tab switch event detected. This is logged for manual review by your instructor.</p>
          </div>

          {/* Question map */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Question Map</div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 50 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { if (i < QUESTIONS.length) setCurrent(i); }}
                  className={`w-full aspect-square rounded text-[10px] font-medium transition-colors ${i === current ? "bg-indigo-600 text-white" : selected[i] !== undefined ? "bg-emerald-100 text-emerald-700" : marked.has(i) ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
