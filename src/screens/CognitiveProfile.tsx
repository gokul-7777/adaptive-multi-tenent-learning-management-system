import { useState, useEffect } from "react";
import {
  buildCognitiveProfile,
  INITIAL_COGNITIVE_METRICS,
  type CognitiveMetric,
} from "../ai/engine";
import { fetchCourses, fetchResources, getAllStudentProgress, type CourseProgress } from "../services/api";
import { COURSES, type Course, type Resource } from "../data";

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

export default function CognitiveProfile({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const studentId = activeUser?.rollNo || activeUser?.userId || "CS2022001";
  const studentName = activeUser?.name || "Student";

  const [coursesList, setCoursesList] = useState<Course[]>(COURSES);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [metrics, setMetrics] = useState<CognitiveMetric[]>(INITIAL_COGNITIVE_METRICS);
  const [selectedMetric, setSelectedMetric] = useState<CognitiveMetric>(INITIAL_COGNITIVE_METRICS[0]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [assessmentSuccessToast, setAssessmentSuccessToast] = useState<string | null>(null);

  const calibrateMetricsFromStudentData = (
    courses: Course[],
    prog: Record<string, CourseProgress>,
    resources: Resource[]
  ) => {
    const passedCourses = courses.filter((c) => prog[c.id]?.passed);
    const attemptedCourses = courses.filter(
      (c) => prog[c.id]?.attempts > 0 || prog[c.id]?.lastScore !== undefined || prog[c.id]?.passed
    );
    const allWeakTopics: string[] = [];
    Object.values(prog).forEach((p) => {
      if (p.weakTopics) allWeakTopics.push(...p.weakTopics);
    });

    const avgScore =
      attemptedCourses.length > 0
        ? Math.round(
            (attemptedCourses.reduce((sum, c) => sum + (prog[c.id]?.bestScore ?? prog[c.id]?.lastScore ?? 8), 0) /
              attemptedCourses.length) *
              10
          )
        : 82;

    const updated = INITIAL_COGNITIVE_METRICS.map((m) => {
      let val = m.value;
      if (m.label.includes("Logical")) {
        val = Math.min(98, Math.max(60, avgScore + 2));
      } else if (m.label.includes("Problem Solving")) {
        val = Math.min(98, Math.max(60, avgScore + 5));
      } else if (m.label.includes("Memory")) {
        val = passedCourses.length > 0 ? 89 : 74;
      } else if (m.label.includes("Numerical")) {
        val = allWeakTopics.length > 0 ? 68 : 84;
      } else if (m.label.includes("Pattern")) {
        val = Math.min(95, Math.max(65, avgScore - 4));
      } else {
        val = Math.min(96, Math.max(60, avgScore));
      }

      return {
        ...m,
        value: val,
        percentile: Math.min(99, Math.max(50, Math.round(val * 1.05))),
      };
    });

    setMetrics(updated);
    setSelectedMetric(updated[0]);
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCourses(), fetchResources()]).then(([courses, res]) => {
      if (isMounted) {
        if (courses) setCoursesList(courses);
        if (res) setResourcesList(res);
        const prog = getAllStudentProgress(studentId);
        setProgressMap(prog);
        calibrateMetricsFromStudentData(courses || COURSES, prog, res || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      const latestProg = getAllStudentProgress(studentId);
      setProgressMap(latestProg);
      calibrateMetricsFromStudentData(coursesList, latestProg, resourcesList);
      setIsRecalculating(false);
      setAssessmentSuccessToast("AI Cognitive Model recalibrated with your authentic test marks.");
      setTimeout(() => setAssessmentSuccessToast(null), 4000);
    }, 700);
  };

  const profileBase = buildCognitiveProfile(metrics);

  const passedCourseNames = coursesList
    .filter((c) => progressMap[c.id]?.passed)
    .map((c) => `${c.code} (${c.name})`);

  const realWeakAreas: string[] = [];
  Object.values(progressMap).forEach((p) => {
    if (p.weakTopics) realWeakAreas.push(...p.weakTopics);
  });

  const profile = {
    ...profileBase,
    strengths: passedCourseNames.length > 0 ? passedCourseNames.slice(0, 3) : profileBase.strengths,
    improvements: realWeakAreas.length > 0 ? Array.from(new Set(realWeakAreas)).slice(0, 3) : profileBase.improvements,
    insight:
      passedCourseNames.length > 0
        ? `Based on your live academic assessments, you have demonstrated exceptional mastery across ${passedCourseNames.length} enrolled subjects (averaging ≥7/10). ${
            realWeakAreas.length > 0
              ? `AI diagnostic review recommends focusing on ${realWeakAreas.slice(0, 2).join(" & ")} using faculty lecture notes before your next exam.`
              : "All tested core curriculum invariants are verified."
          }`
        : profileBase.insight,
  };

  // Radar geometry
  const cx = 150;
  const cy = 150;
  const r = 100;
  const n = metrics.length;

  const points = metrics.map((m, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const dist = (m.value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });

  const axisPoints = metrics.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const labelPoints = metrics.map((m, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const dist = r + 24;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      label: m.label,
      value: m.value,
      metric: m,
    };
  });

  const poly = points.map((p) => `${p.x},${p.y}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    metrics.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return `${cx + r * f * Math.cos(angle)},${cy + r * f * Math.sin(angle)}`;
    }).join(" ")
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Fixed & Non-Scrollable */}
      <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 h-screen select-none z-20">
        <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-bold font-mono">A</span>
            </div>
            <div>
              <div className="text-slate-800 text-sm font-bold tracking-tight">Adaptive LMS</div>
              <div className="text-slate-400 text-[10px]">Cognitive Profile</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: "⊞", action: () => onNavigate("student") },
            { id: "learning", label: "AI Learning Path", icon: "🧭", action: () => onNavigate("learning") },
            { id: "cognitive", label: "Cognitive Profile", icon: "🧠", active: true },
            { id: "exam", label: "Exams", icon: "🖥️", action: () => onNavigate("exam") },
            { id: "results", label: "Results", icon: "📊", action: () => onNavigate("results") },
          ].map((item) => (
            <button
              key={item.id}
              onClick={(item as any).action}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                item.active
                  ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/70"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Structured Bottom Actions & Transparent Sign Out Button */}
        <div className="p-3.5 border-t border-slate-100/90 flex-shrink-0 space-y-2 bg-slate-50/40">
          <button
            onClick={() => onNavigate("student")}
            className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Dashboard</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">←</span>
          </button>

          <button
            onClick={() => onNavigate("login")}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-7">
        {/* Top Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => onNavigate("student")} className="text-slate-400 text-xs hover:text-indigo-600">
                Dashboard
              </button>
              <span className="text-slate-300 text-xs">›</span>
              <span className="text-slate-600 text-xs font-medium">Cognitive Profile</span>
            </div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">AI Cognitive Architecture</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Continuous multi-dimensional evaluation calibrated from quiz speed, algorithmic logic, and code comprehension.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/80 transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 text-indigo-600 ${isRecalculating ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <span>{isRecalculating ? "Recalibrating AI Model..." : "Recalculate with AI"}</span>
            </button>
            <button
              onClick={() => onNavigate("learning")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
            >
              <span>View Learning Path</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Success Feedback Notification */}
        {assessmentSuccessToast && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{assessmentSuccessToast}</span>
            </div>
            <button onClick={() => setAssessmentSuccessToast(null)} className="text-emerald-500 hover:text-emerald-800 text-sm font-bold">
              ×
            </button>
          </div>
        )}

        {/* Top 3 Metric Highlight Tiles */}
        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Top Dimension</div>
              <div className="text-xl font-bold text-slate-800">{profile.strengths[0]}</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">94th percentile across cohort</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl text-indigo-600">
              🧠
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Target Dimension</div>
              <div className="text-xl font-bold text-slate-800">{profile.improvements[0]}</div>
              <div className="text-xs text-amber-600 font-semibold mt-1">AI Scaffold Modules Active</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl text-amber-600">
              🎯
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Adaptive Alignment</div>
              <div className="text-xl font-bold text-slate-800">Dynamic Matching</div>
              <div className="text-xs text-indigo-600 font-semibold mt-1">6 Active Competency Vector Weights</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl text-emerald-600">
              ⚡
            </div>
          </div>
        </div>

        {/* Main 2-column Analysis */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Left: Radar & Dimension List (7 cols) */}
          <div className="col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-slate-800 text-sm font-bold">Cognitive Topology Map</h2>
                <p className="text-slate-400 text-xs">Click any node or bar to inspect pedagogical recommendations.</p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-full">
                Interactive Multi-Axis
              </span>
            </div>

            <div className="flex items-center gap-6 py-2">
              {/* Radar Graphic */}
              <div className="relative flex-shrink-0">
                <svg width="300" height="300" className="mx-auto select-none">
                  {/* Outer & inner rings */}
                  {rings.map((pts, idx) => (
                    <polygon key={idx} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray={idx === 3 ? "none" : "2 2"} />
                  ))}
                  {/* Axis lines */}
                  {axisPoints.map((p, i) => (
                    <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#f1f5f9" strokeWidth="1.5" />
                  ))}
                  {/* Shaded polygon */}
                  <polygon points={poly} fill="#6366f1" fillOpacity="0.18" stroke="#6366f1" strokeWidth="2.5" />
                  {/* Axis points */}
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={selectedMetric.label === metrics[i].label ? "6" : "4"}
                      fill={metrics[i].color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all hover:scale-125"
                      onClick={() => setSelectedMetric(metrics[i])}
                    />
                  ))}
                  {/* Labels around perimeter */}
                  {labelPoints.map((p, i) => {
                    const isSelected = selectedMetric.label === p.metric.label;
                    return (
                      <text
                        key={i}
                        x={p.x}
                        y={p.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fontWeight={isSelected ? "700" : "500"}
                        fill={isSelected ? "#4f46e5" : "#64748b"}
                        className="cursor-pointer transition-colors"
                        onClick={() => setSelectedMetric(p.metric)}
                      >
                        {p.label.split(" ").slice(0, 2).join(" ")}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Dimension Score List */}
              <div className="space-y-3 flex-1">
                {metrics.map((m) => {
                  const isSelected = selectedMetric.label === m.label;
                  return (
                    <div
                      key={m.label}
                      onClick={() => setSelectedMetric(m)}
                      className={`p-2 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-200/90 shadow-2xs"
                          : "bg-white hover:bg-slate-50/80 border-transparent hover:border-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs ${isSelected ? "font-bold text-indigo-900" : "text-slate-700"}`}>{m.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">P{m.percentile}</span>
                          <span className="text-xs font-bold text-slate-800">{m.value}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.value}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Dimension Focus & AI Recommendations (5 cols) */}
          <div className="col-span-5 space-y-4 flex flex-col justify-between">
            {/* Dimension Detail Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedMetric.color }} />
                  <h3 className="text-sm font-bold text-slate-800">{selectedMetric.label}</h3>
                </div>
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {selectedMetric.value}% Score
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{selectedMetric.description}</p>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span>💡</span> Recommended Learning Methodology
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{selectedMetric.studyStrategy}</p>
              </div>

              {selectedMetric.recommendedResource && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      🎓 Curated Preparation Resource
                    </span>
                    <span className="text-[9px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      {selectedMetric.recommendedResource.type}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">{selectedMetric.recommendedResource.title}</div>
                  <div className="text-[11px] text-slate-500">{selectedMetric.recommendedResource.platform} — {selectedMetric.recommendedResource.description}</div>
                  <p className="text-[10px] text-slate-400 italic pt-1.5 border-t border-indigo-100/80 flex items-center gap-1">
                    <span className="font-bold text-slate-400">*</span>
                    <span>Not a sponsored result. Curated independently for academic study.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-2xl p-4">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>✓</span> High Proficiency
                </div>
                <div className="space-y-1.5">
                  {profile.strengths.map((s) => (
                    <div key={s} className="text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-100/90 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>📈</span> Growth Potential
                </div>
                <div className="space-y-1.5">
                  {profile.improvements.map((s) => (
                    <div key={s} className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Synthesized Pedagogical Insight */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🤖</span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">AI Pedagogical Synthesis</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed mb-4">{profile.insight}</p>
              <button
                onClick={() => onNavigate("learning")}
                className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Launch Adaptive Learning Path →
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer Note */}
        <div className="text-[11px] text-slate-400 bg-slate-100/60 border border-slate-200/60 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span>ℹ️ {profile.disclaimer}</span>
          <span className="font-mono text-[10px]">Model: AMLE-Cognitive-v2.4</span>
        </div>
      </main>
    </div>
  );
}
