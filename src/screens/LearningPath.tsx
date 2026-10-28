import { useState, useEffect } from "react";
import {
  buildLearningPlan,
  INITIAL_TOPICS,
  type LearningTopic,
} from "../ai/engine";
import {
  fetchCourses,
  fetchResources,
  fetchCourseMCQs,
  getAllStudentProgress,
  type CourseProgress,
} from "../services/api";
import { COURSES, type Course, type Resource, type CourseMCQ } from "../data";
import StudyPdfViewerModal from "../components/StudyPdfViewerModal";
import { getStudyPdfForCourse, type RealStudyPdf } from "../data/realStudyPdfs";

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

export default function LearningPath({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const studentId = activeUser?.rollNo || activeUser?.userId || "CS2022001";

  const [coursesList, setCoursesList] = useState<Course[]>(COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("c1");
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [courseMcqs, setCourseMcqs] = useState<CourseMCQ[]>([]);
  const [studentProgressMap, setStudentProgressMap] = useState<Record<string, CourseProgress>>({});
  const [topics, setTopics] = useState<LearningTopic[]>(INITIAL_TOPICS);
  const [activeTopic, setActiveTopic] = useState<LearningTopic | null>(null);
  const [curriculumMode, setCurriculumMode] = useState<"adaptive" | "fast" | "mastery">("adaptive");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<RealStudyPdf | null>(null);

  // Practice problem & navigation state inside modal
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [modalTab, setModalTab] = useState<"all" | "prep" | "quiz">("all");

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCourses(), fetchResources()]).then(([courses, res]) => {
      if (isMounted) {
        if (courses && courses.length > 0) {
          setCoursesList(courses);
          setSelectedCourseId(courses[0].id);
        }
        if (res) setResourcesList(res);
        setStudentProgressMap(getAllStudentProgress(studentId));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  useEffect(() => {
    fetchCourseMCQs(selectedCourseId).then((mcqs) => {
      setCourseMcqs(mcqs || []);
    });
  }, [selectedCourseId]);

  // Dynamically derive syllabus & focus topics from the teacher's MCQs and resources
  useEffect(() => {
    const selectedCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];
    if (!selectedCourse) return;

    const prog = studentProgressMap[selectedCourse.id] || { studied: false, passed: false, attempts: 0 };
    const courseRes = resourcesList.filter(
      (r) => r.courseId === selectedCourse.id || r.courseId === selectedCourse.code
    );
    const mcqTopics = Array.from(new Set(courseMcqs.map((q) => q.topic).filter(Boolean)));
    const resTitles = courseRes.map((r) => r.title);

    let topicLabels = Array.from(new Set([...mcqTopics, ...resTitles]));
    if (topicLabels.length === 0) {
      if (selectedCourse.code === "CS301" || selectedCourse.id === "c1") {
        setTopics(INITIAL_TOPICS);
        return;
      }
      topicLabels = [
        `${selectedCourse.name} Fundamentals & Architecture`,
        `${selectedCourse.name} Core Principles & Models`,
        `${selectedCourse.name} Advanced Analysis & Case Studies`,
      ];
    }

    const dynamicTopics: LearningTopic[] = topicLabels.map((label, idx) => {
      const isWeak = prog.weakTopics?.some(
        (w) => label.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(label.toLowerCase())
      );
      const matchingRes = courseRes.filter((r) => r.title.toLowerCase().includes(label.toLowerCase()));
      const firstRes = matchingRes[0] || courseRes[0];

      let status: "done" | "current" | "pending" = "pending";
      if (prog.passed) {
        status = "done";
      } else if (isWeak) {
        status = "current";
      } else if (prog.studied && idx < 2) {
        status = "done";
      } else if (idx === 0) {
        status = "current";
      }

      return {
        id: `topic-${selectedCourse.id}-${idx}`,
        label,
        status,
        difficulty: idx === 0 ? "Foundation" : idx === 1 ? "Intermediate" : "Advanced",
        estimatedMinutes: 25 + idx * 10,
        summary: isWeak
          ? `⚠️ Weak area diagnosed from your ${prog.lastScore || 0}/10 assessment score. Review faculty resources before retaking.`
          : `Core study module based on faculty curriculum for ${selectedCourse.name}.`,
        codeSnippet: `// Faculty Syllabus Module: ${label}\n// Course: ${selectedCourse.code} (${selectedCourse.name})\n// Status: ${prog.passed ? "Mastered" : isWeak ? "Needs Review" : "Pending Study"}`,
        prepMaterials: {
          recommendedCourse: {
            title: `${selectedCourse.code} — ${selectedCourse.name}`,
            platform: "Faculty LMS Courseware",
            instructor: selectedCourse.instructor || "Department Faculty",
            level: "Undergraduate Core",
            badge: prog.passed ? "Certified ✓" : isWeak ? "Review Required" : "Curriculum Standard",
            description: firstRes?.description || `${selectedCourse.name} core academic materials uploaded by faculty.`,
            linkUrl: firstRes?.url || "#study-pdf",
          },
          textbook: {
            title: `${selectedCourse.name} Standard Reference Guide`,
            chapter: `Chapter ${idx + 1}: ${label}`,
            authors: selectedCourse.instructor || "Faculty Author",
          },
          interactiveTool: {
            name: `${selectedCourse.code} Interactive Practice Module`,
            platform: "Department Sandbox",
            feature: "Interactive assessment concept review and topic drills",
          },
          practicePlatform: {
            title: `Assessment MCQs for ${label}`,
            curatedProblems: courseMcqs.filter((q) => q.topic === label).map((q) => q.question).slice(0, 3),
          },
          keyExamTips: isWeak
            ? [
                `Review faculty resource "${firstRes?.title || label}" thoroughly.`,
                "Target at least 7 / 10 marks on the 10-question MCQ test to pass.",
                "Ensure understanding of fundamental terminology and problem definitions.",
              ]
            : [
                "Study all faculty-uploaded PDFs and lecture notes before attending the assessment.",
                "Passing benchmark is 70% (7 out of 10 correct answers).",
                "Earning a passing score automatically generates your verified Certificate.",
              ],
        },
      };
    });

    setTopics(dynamicTopics);
  }, [selectedCourseId, courseMcqs, resourcesList, studentProgressMap, coursesList]);

  const plan = buildLearningPlan(topics);

  const handleToggleComplete = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          const nextStatus = t.status === "done" ? "pending" : "done";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    const target = topics.find((t) => t.id === topicId);
    setToastMessage(`Topic "${target?.label}" marked as ${target?.status === "done" ? "incomplete" : "completed"}! Progress recalculated.`);
    setTimeout(() => setToastMessage(null), 3500);
    if (activeTopic && activeTopic.id === topicId) {
      setActiveTopic((prev) => prev ? { ...prev, status: prev.status === "done" ? "pending" : "done" } : null);
    }
  };

  const openTopicModal = (topic: LearningTopic) => {
    setActiveTopic(topic);
    setSelectedAnswer(null);
    setHasCheckedAnswer(false);
    setModalTab("all");
  };

  const currentTopic = topics.find((t) => t.status === "current") || topics.find((t) => t.status === "pending") || topics[0];

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
              <div className="text-slate-400 text-[10px]">Learning Path</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: "⊞", action: () => onNavigate("student") },
            { id: "learning", label: "AI Learning Path", icon: "🧭", active: true },
            { id: "cognitive", label: "Cognitive Profile", icon: "🧠", action: () => onNavigate("cognitive") },
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
              <span className="text-slate-600 text-xs font-medium">Personalized Learning Path</span>
            </div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Adaptive Knowledge Graph & Study Hub</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Personalized syllabus graph tailored to your Cognitive Profile & teacher assessment benchmarks.{" "}
              {(() => {
                const curCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];
                return curCourse ? (
                  <span className="text-indigo-600 font-semibold">{curCourse.code} — {curCourse.name}</span>
                ) : null;
              })()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Subject Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Subject:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-xs font-bold text-slate-800 focus:outline-hidden bg-transparent"
              >
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Curriculum Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setCurriculumMode("adaptive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  curriculumMode === "adaptive" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⚡ Adaptive
              </button>
              <button
                onClick={() => setCurriculumMode("fast")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  curriculumMode === "fast" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🚀 Exam Cram
              </button>
              <button
                onClick={() => setCurriculumMode("mastery")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  curriculumMode === "mastery" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🎓 Deep Mastery
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic AI Diagnostic Guidance Banner for This Course */}
        {(() => {
          const selectedCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];
          const prog = studentProgressMap[selectedCourse?.id] || { studied: false, passed: false, attempts: 0 };
          const courseRes = resourcesList.filter(
            (r) => r.courseId === selectedCourse?.id || r.courseId === selectedCourse?.code
          );

          if (prog.passed) {
            return (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🎓</span>
                  <div>
                    <span className="font-bold">Course Assessment Passed!</span> You scored <strong>{prog.bestScore || prog.lastScore} / 10</strong> on this course (Pass requirement: ≥7/10). Official Certificate issued: <strong className="font-mono">{prog.certificateId || "CERT-VERIFIED"}</strong>.
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("student")}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  View Certificate →
                </button>
              </div>
            );
          }

          if (prog.lastScore !== undefined && prog.lastScore < 7) {
            return (
              <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-900 text-xs px-4 py-3.5 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <span className="text-base">⚠️</span>
                    <span>AI Diagnostic Review Required — Score: {prog.lastScore} / 10 (Pass mark: 7 / 10)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-rose-200/60 text-rose-800 px-2.5 py-0.5 rounded-full">
                    Attempt {prog.attempts}
                  </span>
                </div>
                <p className="leading-relaxed text-rose-700 mb-2">
                  To pass and unlock your Certificate, you need at least <strong>7 marks</strong>. The AI diagnostic sentinel has flagged these focus areas for revision:{" "}
                  <strong>{prog.weakTopics && prog.weakTopics.length > 0 ? prog.weakTopics.join(", ") : "Key Concepts"}</strong>.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-rose-800 font-semibold bg-white/70 p-2.5 rounded-xl border border-rose-100">
                  <span>💡 Action:</span> Review the {courseRes.length} teacher-uploaded study assets below, then re-attend the 10-question MCQ test.
                </div>
              </div>
            );
          }

          if (prog.studied) {
            return (
              <div className="mb-5 bg-blue-50 border border-blue-200 text-blue-900 text-xs px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔓</span>
                  <div>
                    <span className="font-bold">Course Resources Studied!</span> You are ready to attend the 10-Question Assessment (Pass mark: 7/10).
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("student")}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Take Assessment Now →
                </button>
              </div>
            );
          }

          return null;
        })()}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mb-5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 font-bold">✓</span>
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-indigo-500 hover:text-indigo-800 text-sm font-bold">
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Learning Journey & Topics (8 cols) */}
          <div className="col-span-8 space-y-5">
            {/* Phase Progression Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 text-sm font-bold">Syllabus Milestones</h3>
                <span className="text-xs font-semibold text-slate-500">{plan.progressPercent}% Completed</span>
              </div>
              <div className="flex items-center gap-0">
                {plan.phases.map((phase, i) => (
                  <div key={phase.label} className="flex items-center flex-1">
                    <div className={`flex-1 ${i > 0 ? "border-t-2 border-dashed " + (i === 1 ? "border-indigo-400" : "border-slate-200") : ""}`} />
                    <div
                      className={`flex flex-col items-center px-3.5 py-2.5 rounded-2xl text-center flex-shrink-0 border transition-all ${
                        phase.done === phase.topics.length
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                          : phase.done > 0
                          ? "bg-indigo-50/80 border-indigo-200 text-indigo-800"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                          phase.done === phase.topics.length
                            ? "bg-emerald-500 text-white"
                            : phase.done > 0
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {phase.done === phase.topics.length ? "✓" : i + 1}
                      </div>
                      <div className="text-xs font-bold tracking-tight">{phase.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {phase.done}/{phase.topics.length} topics
                      </div>
                    </div>
                    {i < plan.phases.length - 1 && <div className="flex-1 border-t-2 border-dashed border-slate-200" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Topic Sequence List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-slate-800 text-sm font-bold">Adaptive Topic Sequence</h3>
                  <p className="text-slate-400 text-xs">Click any topic to launch the interactive AI study module.</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{topics.length} Topics Total</span>
              </div>

              <div className="divide-y divide-slate-100">
                {topics.map((t, idx) => {
                  const isDone = t.status === "done";
                  const isCurrent = t.status === "current";
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80 ${
                        isCurrent ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      {/* Status indicator button */}
                      <button
                        onClick={() => handleToggleComplete(t.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                          isDone
                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-2xs"
                            : isCurrent
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                            : "border-2 border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                        title={isDone ? "Click to mark incomplete" : "Click to mark completed"}
                      >
                        {isDone ? "✓" : isCurrent ? "→" : idx + 1}
                      </button>

                      {/* Topic metadata */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTopicModal(t)}>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isDone ? "text-slate-400 line-through" : isCurrent ? "text-indigo-900 font-bold" : "text-slate-800"
                            }`}
                          >
                            {t.label}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              t.difficulty === "Foundation"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : t.difficulty === "Intermediate"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                : "bg-purple-50 text-purple-700 border border-purple-200/60"
                            }`}
                          >
                            {t.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{t.summary}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">{t.estimatedMinutes}m</span>
                        <button
                          onClick={() => openTopicModal(t)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Study →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Teacher Uploaded Study Resources Section */}
            {(() => {
              const selectedCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];
              const courseRes = resourcesList.filter(
                (r) => r.courseId === selectedCourse?.id || r.courseId === selectedCourse?.code
              );
              const prog = studentProgressMap[selectedCourse?.id] || { studied: false, passed: false, attempts: 0 };

              return (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-slate-800 text-sm font-bold flex items-center gap-2">
                        <span>📚</span> Faculty Study Resources & Materials ({courseRes.length})
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Authentic study assets published directly by {selectedCourse?.instructor || "Course Faculty"}.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate("student")}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📝</span> Go to Assessment (10 MCQs)
                    </button>
                  </div>

                  {courseRes.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No materials uploaded yet by faculty for {selectedCourse?.code}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {courseRes.map((r) => {
                        const isFocus = prog.weakTopics?.some(
                          (w) => r.title.toLowerCase().includes(w.toLowerCase()) || (r.description && r.description.toLowerCase().includes(w.toLowerCase()))
                        );

                        return (
                          <div
                            key={r.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isFocus
                                ? "bg-rose-50/70 border-rose-200 shadow-2xs"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                {r.type.toUpperCase()}
                              </span>
                              {isFocus && (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                  ⚠️ AI Focus Area
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{r.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-2.5">
                              {r.description || "Faculty reference material for course curriculum."}
                            </p>
                            {r.type === "pdf" || r.type === "notes" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const studyPdf = getStudyPdfForCourse(selectedCourse?.id || selectedCourse?.code || r.courseId);
                                  setViewingPdf(studyPdf);
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>📄 View Real Study PDF</span>
                                <span>📖</span>
                              </button>
                            ) : (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                              >
                                <span>Open {r.type === "video" ? "Video Lecture" : "Resource"}</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: AI Next Action & Metrics (4 cols) */}
          <div className="col-span-4 space-y-4">
            {/* AI Recommendation Banner */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">🤖</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Recommended Next Step</span>
              </div>
              <h3 className="text-xl font-extrabold mb-1">{plan.recommendation.title}</h3>
              <p className="text-white/85 text-xs leading-relaxed mb-4">{plan.recommendation.description}</p>

              <div className="bg-white/10 rounded-xl p-3 space-y-2 mb-4 backdrop-blur-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-200">Difficulty</span>
                  <span className="font-semibold text-white">{plan.recommendation.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-200">Estimated Duration</span>
                  <span className="font-semibold text-white">{plan.recommendation.estimatedTime}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-200">Cognitive Fit</span>
                  <span className="font-semibold text-emerald-300">{plan.recommendation.matchScore}% Match</span>
                </div>
              </div>

              <button
                onClick={() => openTopicModal(currentTopic)}
                className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Launch Study Session →
              </button>
            </div>

            {/* Overall Syllabus Progress Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Curriculum Completion</h4>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-extrabold text-slate-800">
                  {topics.filter((t) => t.status === "done").length}
                </span>
                <span className="text-xs text-slate-400">/ {topics.length} topics finished</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${plan.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{plan.progressPercent}% Progress</span>
                <span>{plan.estimate}</span>
              </div>
            </div>

            {/* One-Stop Curated Preparation Target Card */}
            {currentTopic.prepMaterials && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">📚</span>
                    <h4 className="text-xs font-bold text-slate-800">One-Stop Course Prep</h4>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                    Curated
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Recommended Course</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">{currentTopic.prepMaterials.recommendedCourse.title}</div>
                  <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">{currentTopic.prepMaterials.recommendedCourse.platform}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Standard Textbook</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">{currentTopic.prepMaterials.textbook.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{currentTopic.prepMaterials.textbook.chapter}</div>
                </div>
                <button
                  onClick={() => openTopicModal(currentTopic)}
                  className="w-full text-center text-xs font-bold text-indigo-700 hover:text-indigo-900 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  Open Full Reference Hub & Sandbox →
                </button>
                <p className="text-[10px] text-slate-400 italic mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1">
                  <span className="font-bold text-slate-400">*</span>
                  <span>Not a sponsored result. Curated independently for academic study.</span>
                </p>
              </div>
            )}

            {/* Quick Practice shortcut to exam */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">🖥️</span>
                <h4 className="text-xs font-bold text-slate-800">Ready to test your knowledge?</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Take the timed Mid-Semester Exam simulation with real-time AI automated proctoring.
              </p>
              <button
                onClick={() => onNavigate("exam")}
                className="w-full bg-slate-900 hover:bg-black text-white text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                Enter Examination Mode →
              </button>
            </div>
          </div>
        </div>

        {/* Topic Study Modal */}
        {activeTopic && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {activeTopic.difficulty}
                    </span>
                    <span className="text-slate-400 text-xs">⏱ {activeTopic.estimatedMinutes} minutes</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{activeTopic.label}</h3>
                </div>
                <button
                  onClick={() => setActiveTopic(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-base cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Navigation View Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
                <button
                  onClick={() => setModalTab("all")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === "all"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🌟</span> All-in-One Guide
                </button>
                <button
                  onClick={() => setModalTab("prep")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === "prep"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>📚</span> Preparation Hub & Courses
                </button>
                <button
                  onClick={() => setModalTab("quiz")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === "quiz"
                      ? "bg-white text-indigo-700 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🧪</span> Concept Quiz
                </button>
              </div>

              {/* Key Concepts (shown on 'all') */}
              {modalTab === "all" && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key Concepts</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {activeTopic.summary}
                  </p>
                </div>
              )}

              {/* Algorithmic Implementation (shown on 'all') */}
              {modalTab === "all" && activeTopic.codeSnippet && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Algorithmic Implementation</h4>
                  <pre className="bg-slate-900 text-indigo-200 text-xs p-3.5 rounded-xl font-mono overflow-x-auto leading-relaxed">
                    {activeTopic.codeSnippet}
                  </pre>
                </div>
              )}

              {/* Curated Preparation Materials & References (shown on 'all' and 'prep') */}
              {(modalTab === "all" || modalTab === "prep") && activeTopic.prepMaterials && (
                <div className="mb-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                        <span>📚</span> Curated Preparation Materials & References
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Comprehensive one-stop study resources to master {activeTopic.label}.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                      One-Stop Solution
                    </span>
                  </div>

                  {/* Recommended Academic Course */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md inline-block mb-1">
                          🎓 Recommended Academic Course
                        </span>
                        <h5 className="text-sm font-bold text-slate-800">{activeTopic.prepMaterials.recommendedCourse.title}</h5>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">{activeTopic.prepMaterials.recommendedCourse.platform}</span>
                          {activeTopic.prepMaterials.recommendedCourse.instructor && (
                            <>
                              <span>•</span>
                              <span>{activeTopic.prepMaterials.recommendedCourse.instructor}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{activeTopic.prepMaterials.recommendedCourse.badge}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md flex-shrink-0">
                        {activeTopic.prepMaterials.recommendedCourse.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                      {activeTopic.prepMaterials.recommendedCourse.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const studyPdf = getStudyPdfForCourse(selectedCourseId);
                          setViewingPdf(studyPdf);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-colors cursor-pointer border border-indigo-200"
                      >
                        <span>📄 Open Official Study Guide & Notes (PDF)</span>
                        <span className="text-xs">→</span>
                      </button>
                      {activeTopic.prepMaterials.recommendedCourse.linkUrl && activeTopic.prepMaterials.recommendedCourse.linkUrl !== "#study-pdf" && (
                        <a
                          href={activeTopic.prepMaterials.recommendedCourse.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-800 hover:underline"
                        >
                          <span>External Syllabus Link</span>
                          <span className="text-xs">↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Textbook and Visualizer Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Standard Reference Textbook */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md inline-block mb-1">
                        📖 Standard Reference Textbook
                      </span>
                      <div className="text-xs font-bold text-slate-800">{activeTopic.prepMaterials.textbook.title}</div>
                      <div className="text-xs text-indigo-700 font-medium mt-1">{activeTopic.prepMaterials.textbook.chapter}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">By {activeTopic.prepMaterials.textbook.authors}</div>
                      {activeTopic.prepMaterials.textbook.pageRef && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">Reference: {activeTopic.prepMaterials.textbook.pageRef}</div>
                      )}
                    </div>

                    {/* Interactive Sandbox & Visualizer */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md inline-block mb-1">
                        🛠️ Interactive Visualizer & Sandbox
                      </span>
                      <div className="text-xs font-bold text-slate-800">{activeTopic.prepMaterials.interactiveTool.name}</div>
                      <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{activeTopic.prepMaterials.interactiveTool.feature}</div>
                      <div className="text-[10px] text-teal-700 font-semibold mt-1">Platform: {activeTopic.prepMaterials.interactiveTool.platform}</div>
                    </div>
                  </div>

                  {/* Curated Problems & Exam Traps */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1.5 flex items-center gap-1">
                        <span>🎯</span> {activeTopic.prepMaterials.practicePlatform.title}
                      </div>
                      <div className="space-y-1">
                        {activeTopic.prepMaterials.practicePlatform.curatedProblems.map((prob, i) => (
                          <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="font-medium truncate">{prob}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1.5 flex items-center gap-1">
                        <span>⚠️</span> High-Yield Exam Invariants & Traps
                      </div>
                      <div className="space-y-1.5">
                        {activeTopic.prepMaterials.keyExamTips.map((tip, i) => (
                          <div key={i} className="text-[11px] text-slate-600 leading-snug flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Non-sponsored Result Note (Grammatically Correct & Short) */}
                  <div className="text-[11px] text-slate-400 italic pt-2 border-t border-indigo-100/80 flex items-center gap-1.5">
                    <span className="font-bold text-slate-400">*</span>
                    <span>Not a sponsored result. All courses, textbooks, and practice materials are independently curated for academic preparation.</span>
                  </div>
                </div>
              )}

              {/* Practice Problem Quiz (shown on 'all' and 'quiz') */}
              {(modalTab === "all" || modalTab === "quiz") && activeTopic.practiceProblem && (
                <div className="mb-5 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                    <span>🧪</span> Quick Concept Check
                  </h4>
                  <p className="text-xs text-slate-800 font-medium mb-3">{activeTopic.practiceProblem.question}</p>
                  <div className="space-y-1.5 mb-3">
                    {activeTopic.practiceProblem.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => setSelectedAnswer(optIdx)}
                        className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all cursor-pointer ${
                          selectedAnswer === optIdx
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}. {opt}
                      </button>
                    ))}
                  </div>

                  {selectedAnswer !== null && !hasCheckedAnswer && (
                    <button
                      onClick={() => setHasCheckedAnswer(true)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Verify Answer
                    </button>
                  )}

                  {hasCheckedAnswer && activeTopic.practiceProblem && (
                    <div
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        selectedAnswer === activeTopic.practiceProblem.answer
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      <strong>{selectedAnswer === activeTopic.practiceProblem.answer ? "✓ Correct!" : "⚠️ Review:"}</strong>{" "}
                      {activeTopic.practiceProblem.explanation}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleToggleComplete(activeTopic.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTopic.status === "done"
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {activeTopic.status === "done" ? "Mark as Incomplete" : "✓ Mark Topic Completed"}
                </button>
                <button
                  onClick={() => setActiveTopic(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Real Academic Study PDF Viewer Modal */}
        {viewingPdf && (
          <StudyPdfViewerModal
            pdfData={viewingPdf}
            onClose={() => setViewingPdf(null)}
            onLaunchAssessment={() => onNavigate("student")}
          />
        )}
      </main>
    </div>
  );
}
