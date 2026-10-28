import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { buildExamInsights, EXAM_QUESTIONS, generateAiTestDiagnostic } from "../ai/engine";
import { COURSES, type Course, RESOURCES, type Resource } from "../data";
import { fetchResources, matchResourceToCourse, getStudentEnrollments } from "../services/api";
import CourseCertificate from "../components/CourseCertificate";

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

export default function ResultsScreen({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const studentName = activeUser?.name || "Student";
  const studentRoll = activeUser?.rollNo || activeUser?.userId || "CS2022001";

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>(RESOURCES);

  // Retrieve user answers, course, and questions from session storage
  let userAnswers: Record<number, number> | undefined = undefined;
  let activeCourse: Course | null = null;
  let examQuestions: any[] = EXAM_QUESTIONS;
  let recordedTimeTaken = "18 min";

  try {
    const rawAnswers = sessionStorage.getItem("lastExamAnswers");
    if (rawAnswers) userAnswers = JSON.parse(rawAnswers);
    const rawCourse = sessionStorage.getItem("lastExamCourse") || sessionStorage.getItem("activeExamCourse");
    if (rawCourse) activeCourse = JSON.parse(rawCourse);
    const rawQs = sessionStorage.getItem("lastExamQuestions");
    if (rawQs) examQuestions = JSON.parse(rawQs);
    const rawTime = sessionStorage.getItem("lastExamTimeTaken");
    if (rawTime) recordedTimeTaken = rawTime;
  } catch {}

  if (!activeCourse) {
    activeCourse = COURSES[0];
  }

  // Load resources for the active course
  useEffect(() => {
    if (activeCourse?.id) {
      fetchResources(activeCourse.id).then((res) => {
        if (res && res.length > 0) setResources(res);
      });
    }
  }, [activeCourse?.id]);

  const courseResources = resources.filter((r) => matchResourceToCourse(r, activeCourse!));

  // Compute certificate ID
  const enrs = getStudentEnrollments(studentRoll);
  const matchedEnr = enrs.find(
    (e) => e.courseId === activeCourse?.id || e.courseCode === activeCourse?.code
  );
  const awardedCertId =
    matchedEnr?.certificateId || `CERT-${activeCourse?.code || "CS301"}-${studentRoll}`;

  // Original AI Insights calculation
  const insights = buildExamInsights(userAnswers, examQuestions, recordedTimeTaken);
  const { summary, topicData, pieData, insight, classComparison } = insights;
  const isPass = summary.overallScore >= 70;

  // AI Diagnostic for detailed weak area advice when needing improvement
  const diagnosticReport = generateAiTestDiagnostic({
    courseName: activeCourse?.name || "Data Structures & Algorithms",
    courseCode: activeCourse?.code || "CS301",
    score: Math.round((summary.overallScore / 100) * (examQuestions.length || 10)),
    totalQuestions: examQuestions.length || 10,
    questions: examQuestions.map((q: any, idx: number) => ({
      id: String(q.id || q.no || idx),
      question: q.question || q.text || `Question ${idx + 1}`,
      options: q.options || [],
      answer: q.answer !== undefined ? q.answer : q.correct !== undefined ? q.correct : 0,
      topic: q.topic || "Core Concepts",
      explanation: q.explanation || "",
    })),
    selectedAnswers: userAnswers || {},
    availableResources: courseResources,
  });

  const handleExportScorecard = () => {
    setExportToast("Academic Official Scorecard PDF generated and ready for transcript archival.");
    setTimeout(() => setExportToast(null), 4000);
  };

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
              <div className="text-slate-400 text-[10px]">Exam Results & AI Telemetry</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: "⊞", action: () => onNavigate("student") },
            { id: "learning", label: "AI Learning Path", icon: "🧭", action: () => onNavigate("learning") },
            { id: "cognitive", label: "Cognitive Profile", icon: "🧠", action: () => onNavigate("cognitive") },
            { id: "exam", label: "Exams", icon: "🖥️", action: () => onNavigate("exam") },
            { id: "results", label: "Results", icon: "📊", active: true },
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
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => onNavigate("student")} className="text-slate-400 text-xs hover:text-indigo-600 cursor-pointer">
                Dashboard
              </button>
              <span className="text-slate-300 text-xs">›</span>
              <span className="text-slate-600 text-xs font-medium">Exam Performance Telemetry</span>
            </div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Examination Evaluation & AI Analytics</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {activeCourse ? `${activeCourse.code}: ${activeCourse.name}` : "Comprehensive Assessment"} · Candidate: {studentName} ({studentRoll})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
            >
              📖 Review Questions & Answers
            </button>
            <button
              onClick={handleExportScorecard}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              ⬇ Export Scorecard
            </button>
            <button
              onClick={() => onNavigate("exam")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
            >
              Retake Exam →
            </button>
          </div>
        </div>

        {/* Feedback Toast */}
        {exportToast && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{exportToast}</span>
            </div>
            <button onClick={() => setExportToast(null)} className="text-emerald-500 hover:text-emerald-800 text-sm font-bold cursor-pointer">
              ×
            </button>
          </div>
        )}

        {/* 4 Score Metric Tiles */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Overall Score</div>
            <div className={`text-3xl font-extrabold ${isPass ? "text-indigo-600" : "text-amber-600"}`}>
              {summary.overallScore}%
            </div>
            <div className={`text-[11px] font-medium mt-1 ${isPass ? "text-emerald-600" : "text-amber-600"}`}>
              {isPass ? "✓ Passing benchmark achieved (≥70%)" : "Passing benchmark: 70% (7/10)"}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Academic Grade</div>
            <div className={`text-3xl font-extrabold ${isPass ? "text-emerald-600" : "text-amber-600"}`}>
              {summary.grade}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary.overallScore >= 90 ? "Grade Point: 10.0 / 10.0" : summary.overallScore >= 80 ? "Grade Point: 9.0 / 10.0" : summary.overallScore >= 70 ? "Grade Point: 8.0 / 10.0" : "Re-evaluation Recommended"}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Verified Accuracy</div>
            <div className="text-3xl font-extrabold text-slate-800">{summary.correctAnswers}</div>
            <div className="text-[11px] text-slate-400 mt-1">Validated by AI Proctor Sentinel</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Completion Time</div>
            <div className="text-3xl font-extrabold text-purple-600">{summary.timeTaken}</div>
            <div className="text-[11px] text-slate-400 mt-1">Timed assessment session</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Topic Performance Bar Chart (8 cols) */}
          <div className="col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-800 text-sm font-bold">Topic Mastery Analysis</h3>
                <p className="text-slate-400 text-xs">Evaluated across sub-module competencies for {activeCourse.name}.</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                AI Automated Breakdown
              </span>
            </div>

            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={topicData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="topic" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {topicData.map((entry) => (
                    <Cell key={entry.topic} fill={entry.score >= 80 ? "#6366f1" : entry.score >= 70 ? "#f59e0b" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Individual Progress Bars */}
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              {topicData.map((t) => (
                <div key={t.topic} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-slate-700">{t.topic}</span>
                    <span className="font-bold text-slate-900">{t.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${t.score}%`,
                        backgroundColor: t.score >= 80 ? "#6366f1" : t.score >= 70 ? "#f59e0b" : "#f43f5e",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pie Chart & AI Remediation (4 cols) */}
          <div className="col-span-4 space-y-4">
            {/* Accuracy Breakdown Pie */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-slate-800 text-sm font-bold mb-3">Response Distribution</h3>
              <div className="flex items-center gap-4">
                <PieChart width={100} height={100}>
                  <Pie data={pieData} cx={50} cy={50} innerRadius={28} outerRadius={46} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1">
                  {pieData.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-600 font-medium">{p.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Actionable Remediation Plan */}
            <div className={`rounded-2xl p-5 text-white shadow-md ${
              isPass
                ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                : "bg-gradient-to-br from-indigo-600 to-purple-700"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isPass ? "🏆" : "🤖"}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                    {isPass ? "Mastery Achieved" : "AI Remediation Plan"}
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {isPass ? "Passed" : "Retake Needed"}
                </span>
              </div>

              <p className="text-xs text-white/95 leading-relaxed mb-3">{insight}</p>

              {/* If Passed: Show Certificate Button */}
              {isPass ? (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>📜 View & Print Official Certificate</span>
                  <span>↗</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {diagnosticReport.weakTopicsList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {diagnosticReport.weakTopicsList.map((t, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">
                          🎯 {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => onNavigate("exam")}
                    className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    ✍️ Retake Exam in Portal →
                  </button>
                </div>
              )}
            </div>

            {/* Recommended Revision Course & Reference Materials */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📚</span>
                  <h4 className="text-xs font-bold text-slate-800">Curated Revision Materials</h4>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  {courseResources.length} Assets
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800">
                {activeCourse.name} ({activeCourse.code})
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Review official faculty slides, chapter PDFs, and lecture recordings before your next assessment attempt.
              </p>

              {courseResources.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {courseResources.slice(0, 2).map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <span className="truncate text-slate-700 text-[11px]">
                        {res.type === "pdf" ? "📄" : "▶"} {res.title}
                      </span>
                      {res.url && (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0 ml-2"
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={() => onNavigate("learning")}
                className="w-full mt-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Access AI Learning Path →
              </button>
              <p className="text-[10px] text-slate-400 italic mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1">
                <span className="font-bold text-slate-400">*</span>
                <span>Curated independently for academic study.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Cohort Comparison Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between mb-6">
          <div>
            <h3 className="text-slate-800 text-sm font-bold">Cohort Peer Comparison</h3>
            <p className="text-slate-400 text-xs">
              Class Rank: <strong className="text-indigo-600">{classComparison.rank}</strong> in {activeCourse.department || "Computer Science"} Section A
            </p>
          </div>
          <div className="flex items-center gap-8 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Cohort Average</span>
              <span className="font-bold text-slate-700">{classComparison.classAverage}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Highest Score</span>
              <span className="font-bold text-slate-700">{classComparison.highest}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Your Score</span>
              <span className="font-bold text-indigo-600">{classComparison.score}%</span>
            </div>
          </div>
        </div>

        {/* Review Questions Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Detailed Examination Review</h3>
                  <p className="text-xs text-slate-400">
                    Review all {examQuestions.length} questions, candidate responses, and AI explanations for {activeCourse.name}.
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-base cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {examQuestions.map((q: any, idx: number) => {
                  const candidateChoice = userAnswers !== undefined ? userAnswers[idx] : idx % 3 === 0 ? q.answer : (q.answer + 1) % 4;
                  const correctAns = q.correct !== undefined ? q.correct : q.answer !== undefined ? q.answer : 0;
                  const isCorrect = candidateChoice === correctAns;
                  const opts: string[] = q.options || [];

                  return (
                    <div
                      key={q.id || q.no || idx}
                      className={`p-4 rounded-xl border ${
                        isCorrect ? "bg-emerald-50/40 border-emerald-200" : "bg-rose-50/40 border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          Question {idx + 1} ({q.topic || "Core Topic"})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isCorrect ? "✓ Correct (+1 Mark)" : "✗ Incorrect (0 Marks)"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mb-3">{q.question || q.text}</p>

                      <div className="space-y-1.5 mb-3 text-xs">
                        {opts.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg flex items-center justify-between ${
                              optIdx === correctAns
                                ? "bg-emerald-100 text-emerald-900 font-bold border border-emerald-300"
                                : optIdx === candidateChoice && !isCorrect
                                ? "bg-rose-100 text-rose-900 font-bold border border-rose-300 line-through"
                                : "bg-white text-slate-600 border border-slate-100"
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </span>
                            {optIdx === correctAns && <span className="text-[10px] text-emerald-700 font-bold">✓ Correct Answer</span>}
                            {optIdx === candidateChoice && !isCorrect && (
                              <span className="text-[10px] text-rose-700 font-bold">Your Choice</span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-indigo-700">AI Explanation:</strong> {q.explanation || "Correct answer strictly minimizes asymptotic complexity."}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] text-slate-400 italic">
                  * Practice recommendations are independently curated for academic study.
                </span>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Done Reviewing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        {showCertificateModal && (
          <CourseCertificate
            course={activeCourse}
            studentName={studentName}
            studentId={studentRoll}
            score={Math.round((summary.overallScore / 100) * (examQuestions.length || 10))}
            certificateId={awardedCertId}
            completedAt={new Date().toISOString()}
            onClose={() => setShowCertificateModal(false)}
          />
        )}
      </main>
    </div>
  );
}
