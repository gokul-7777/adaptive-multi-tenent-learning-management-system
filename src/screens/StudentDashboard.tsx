import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { buildDashboardSuggestion, askAiTutor, generateAiTestDiagnostic, type AiTestDiagnosticReport } from "../ai/engine";
import { COURSES, type Course, ANNOUNCEMENTS, RESOURCES, type Resource, type CourseMCQ } from "../data";
import {
  fetchCourses,
  fetchResources,
  fetchCourseMCQs,
  getStudentCourseProgress,
  saveStudentCourseProgress,
  getAllStudentProgress,
  type CourseProgress,
  getStudentEnrollments,
  isStudentEnrolled,
  enrollStudentInCourse,
  updateEnrollmentProgress,
  onLmsDataChange,
  type CourseEnrollment,
  matchResourceToCourse,
} from "../services/api";
import CourseCertificate from "../components/CourseCertificate";
import StudyPdfViewerModal from "../components/StudyPdfViewerModal";
import { getStudyPdfForCourse, type RealStudyPdf } from "../data/realStudyPdfs";

const progressData = [
  { month: "Mar", score: 62 }, { month: "Apr", score: 68 }, { month: "May", score: 71 },
  { month: "Jun", score: 74 }, { month: "Jul", score: 78 }, { month: "Aug", score: 84 },
];

const subjectData = [
  { subject: "DSA (CS301)", score: 84 },
  { subject: "DBMS (CS302)", score: 82 },
  { subject: "OS (CS401)", score: 88 },
];

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

const suggestion = buildDashboardSuggestion();

export default function StudentDashboard({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const studentName = activeUser?.name || "Student";
  const studentId = activeUser?.rollNo || activeUser?.userId || "CS2022001";
  const studentDept = activeUser?.department || "Computer Science";
  const studentInitials = studentName
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [resources, setResources] = useState<Resource[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<CourseEnrollment[]>([]);
  const [activeNavTab, setActiveNavTab] = useState<"dashboard" | "enrolled" | "exams" | "catalog">("dashboard");
  const [enrolledSearch, setEnrolledSearch] = useState("");
  const [enrolledStatusFilter, setEnrolledStatusFilter] = useState<"all" | "ongoing" | "finished" | "review">("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [unreadNotices, setUnreadNotices] = useState(ANNOUNCEMENTS.length);

  // Course Hub (Study -> Exam -> AI Diagnostics -> Certificate)
  const [studentProgress, setStudentProgress] = useState<Record<string, CourseProgress>>({});
  const [activeCourseHub, setActiveCourseHub] = useState<Course | null>(null);
  const [activeHubTab, setActiveHubTab] = useState<"resources" | "test" | "certificate">("resources");
  const [courseMcqs, setCourseMcqs] = useState<CourseMCQ[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [lastTestScore, setLastTestScore] = useState<number>(0);
  const [lastWeakTopics, setLastWeakTopics] = useState<string[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<AiTestDiagnosticReport | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [viewingPdf, setViewingPdf] = useState<RealStudyPdf | null>(null);
  const [hubToast, setHubToast] = useState<string | null>(null);

  const showHubToast = (msg: string) => {
    setHubToast(msg);
    setTimeout(() => setHubToast(null), 3500);
  };

  // AI Tutor prompt & chat state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const refreshEnrollments = () => {
    const enrs = getStudentEnrollments(studentId);
    setStudentEnrollments(enrs);
    const prog = getAllStudentProgress(studentId);
    setStudentProgress(prog);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [courseData, resData] = await Promise.all([fetchCourses(), fetchResources()]);
        if (isMounted) {
          const validCourses = courseData && courseData.length > 0 ? courseData : COURSES;
          setCourses(validCourses);
          setResources(resData || []);

          let enrs = getStudentEnrollments(studentId);
          // Auto-enroll new/unregistered students in the 3 core curriculum subjects so they appear immediately
          if (enrs.length === 0 && validCourses.length > 0) {
            validCourses.slice(0, 3).forEach((c) => {
              enrollStudentInCourse(
                {
                  id: studentId,
                  userId: studentId,
                  rollNo: studentId,
                  name: studentName,
                  email: activeUser?.email,
                  department: studentDept,
                },
                c
              );
            });
            enrs = getStudentEnrollments(studentId);
          }

          setStudentEnrollments(enrs);
          const prog = getAllStudentProgress(studentId);
          setStudentProgress(prog);
        }
      } catch {
        if (isMounted) {
          setCourses(COURSES);
          setResources([]);
          setStudentEnrollments(getStudentEnrollments(studentId));
        }
      }
    };
    loadData();
    const unsubscribe = onLmsDataChange(() => {
      loadData();
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [studentId]);

  const handleAskAi = (presetPrompt?: string) => {
    const query = presetPrompt || aiPrompt;
    if (!query.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      const resp = askAiTutor(query);
      setAiResponse(resp);
      setIsAiLoading(false);
    }, 600);
  };

  const handleEnrollCourse = (course: Course) => {
    enrollStudentInCourse(
      {
        id: activeUser?.id,
        userId: activeUser?.userId || studentId,
        rollNo: studentId,
        name: studentName,
        email: activeUser?.email,
        department: studentDept,
      },
      course
    );
    refreshEnrollments();
    showHubToast(`✓ Successfully enrolled in ${course.name} (${course.code})!`);
  };

  const handleOpenCourseHub = async (course: Course, initialTab: "resources" | "test" | "certificate" = "resources") => {
    setActiveCourseHub(course);
    const prog = studentProgress[course.id] || getStudentCourseProgress(studentId, course.id);

    if (initialTab === "certificate" && prog.passed) {
      setCertificateCourse(course);
      setShowCertificateModal(true);
      return;
    }

    if (initialTab === "test" && prog.studied) {
      setActiveHubTab("test");
    } else {
      setActiveHubTab("resources");
    }

    setIsTestSubmitted(false);
    setSelectedAnswers({});
    setDiagnosticReport(null);

    try {
      const mcqs = await fetchCourseMCQs(course.id);
      setCourseMcqs(mcqs && mcqs.length > 0 ? mcqs : []);
    } catch {
      setCourseMcqs([]);
    }
  };

  const handleLaunchExam = (course: Course) => {
    try {
      sessionStorage.setItem("activeExamCourse", JSON.stringify(course));
    } catch {}
    setActiveCourseHub(null);
    onNavigate("exam");
  };

  const handleMarkCourseStudied = (courseId: string) => {
    const updated = saveStudentCourseProgress(studentId, courseId, { studied: true });
    setStudentProgress((prev) => ({ ...prev, [courseId]: updated }));
    updateEnrollmentProgress(studentId, courseId, { studied: true });
    refreshEnrollments();
    showHubToast("✓ Course materials completed! The 10-Question Assessment is now unlocked.");
    setActiveHubTab("test");
  };

  const handleSubmitAssessment = (course: Course) => {
    const totalQs = courseMcqs.length || 10;
    let correct = 0;
    const weakList: string[] = [];

    courseMcqs.forEach((q, idx) => {
      const studentChoice = selectedAnswers[idx];
      if (studentChoice === q.answer) {
        correct++;
      } else {
        if (q.topic && !weakList.includes(q.topic)) {
          weakList.push(q.topic);
        }
      }
    });

    const score = Math.round((correct / totalQs) * 10);
    const isPass = score >= 7;

    setLastTestScore(score);
    setLastWeakTopics(weakList);

    const courseResList = resources.filter((r) => matchResourceToCourse(r, course));
    const report = generateAiTestDiagnostic({
      courseName: course.name,
      courseCode: course.code,
      score,
      totalQuestions: totalQs,
      questions: courseMcqs,
      selectedAnswers,
      availableResources: courseResList,
    });
    setDiagnosticReport(report);
    setIsTestSubmitted(true);

    const prevEnrollment = studentEnrollments.find(
      (e) => e.courseId === course.id || e.courseCode === course.code
    );
    const attempts = (prevEnrollment?.attempts || 0) + 1;
    const prevHistory = prevEnrollment?.attemptHistory || [];
    const newHistory = [
      ...prevHistory,
      {
        attemptNumber: attempts,
        score,
        date: new Date().toISOString(),
        passed: isPass,
        weakTopics: weakList,
      },
    ];

    if (isPass) {
      const certId =
        prevEnrollment?.certificateId ||
        `CERT-${course.code}-${Math.floor(100000 + Math.random() * 900000)}`;
      updateEnrollmentProgress(studentId, course.id, {
        studied: true,
        passed: true,
        status: "Finished",
        score,
        percentage: score * 10,
        attempts,
        completedAt: new Date().toISOString(),
        certificateId: certId,
        weakTopics: [],
        attemptHistory: newHistory,
      });
      saveStudentCourseProgress(studentId, course.id, {
        studied: true,
        passed: true,
        bestScore: Math.max(score, prevEnrollment?.score || 0),
        lastScore: score,
        attempts,
        completedAt: new Date().toISOString(),
        certificateId: certId,
        weakTopics: [],
      });
      refreshEnrollments();
      showHubToast(`🎉 Congratulations! Passed with ${score}/10! Course completed.`);
    } else {
      updateEnrollmentProgress(studentId, course.id, {
        studied: false,
        passed: false,
        status: "Ongoing",
        score,
        percentage: score * 10,
        attempts,
        weakTopics: weakList,
        attemptHistory: newHistory,
      });
      saveStudentCourseProgress(studentId, course.id, {
        studied: false,
        passed: false,
        bestScore: Math.max(score, prevEnrollment?.score || 0),
        lastScore: score,
        attempts,
        weakTopics: weakList,
      });
      refreshEnrollments();
      showHubToast(`Score: ${score}/10. Pass mark is 7/10. AI weak area analysis generated.`);
    }
  };

  const handleRestudyAndUnlockRetake = (courseId: string) => {
    saveStudentCourseProgress(studentId, courseId, { studied: true });
    updateEnrollmentProgress(studentId, courseId, { studied: true });
    refreshEnrollments();
    setIsTestSubmitted(false);
    setSelectedAnswers({});
    setDiagnosticReport(null);
    setActiveHubTab("test");
    showHubToast("✓ Restudy completed! Assessment retake is unlocked.");
  };

  // Enrolled courses vs Available courses
  const enrolledCourses = courses.filter((c) => isStudentEnrolled(studentId, c.id));
  const availableCourses = courses.filter((c) => !isStudentEnrolled(studentId, c.id));

  // Real dynamic metrics calculated from student's enrolled courses and actual test performance
  const totalEnrolledCount = enrolledCourses.length;
  const finishedCoursesCount = studentEnrollments.filter((e) => e.passed || e.status === "Finished").length;
  const attemptedEnrollments = studentEnrollments.filter(
    (e) => e.attempts > 0 || e.score !== undefined
  );

  const totalScoreAcc = attemptedEnrollments.reduce((sum, e) => sum + (e.score || 0), 0);
  const avgScoreOutOf10 = attemptedEnrollments.length > 0 ? totalScoreAcc / attemptedEnrollments.length : 0;
  const realAveragePercent = attemptedEnrollments.length > 0 ? Math.round(avgScoreOutOf10 * 10) : 0;
  const realCgpa = attemptedEnrollments.length > 0 ? `${avgScoreOutOf10.toFixed(1)} / 10` : "0.0 / 10";
  const realOverallProgress = `${totalEnrolledCount > 0 ? Math.round((finishedCoursesCount / totalEnrolledCount) * 100) : 0}%`;

  // Dynamic Subject Performance benchmark data mapped directly to student's enrolled courses and actual scores
  const dynamicSubjectData = enrolledCourses.map((c) => {
    const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
    const prog = studentProgress[c.id];
    const scoreVal = enr?.score ?? prog?.bestScore ?? prog?.lastScore ?? 0;
    return {
      subject: c.code,
      fullName: c.name,
      score: scoreVal > 0 ? scoreVal * 10 : 0,
    };
  });

  const activeCourseCount = enrolledCourses.length;

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
              <div className="text-slate-400 text-[10px]">Student Dashboard</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100/80 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
              {studentInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-800 text-xs font-semibold truncate">{studentName}</div>
              <div className="text-slate-400 text-[10px] truncate">{studentDept} · {studentId}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard Overview", icon: "⊞", active: activeNavTab === "dashboard", action: () => setActiveNavTab("dashboard") },
            { id: "enrolled", label: "My Enrolled Courses", icon: "📚", active: activeNavTab === "enrolled", action: () => setActiveNavTab("enrolled") },
            { id: "exams", label: "Exam Section (Timed Tests)", icon: "⏱️", active: activeNavTab === "exams", action: () => setActiveNavTab("exams") },
            { id: "catalog", label: "Course Catalog (Enroll)", icon: "🌐", active: activeNavTab === "catalog", action: () => setActiveNavTab("catalog") },
            { id: "cognitive", label: "Cognitive Profile", icon: "🧠", active: false, action: () => onNavigate("cognitive") },
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
            onClick={() => onNavigate("admin")}
            className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Switch to Admin View</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">↗</span>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Welcome back, {studentName}! 👋</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              ABC Engineering College · {studentDept}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Announcements Bell */}
            <button
              onClick={() => setShowAnnouncementsModal(true)}
              className="relative p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 cursor-pointer shadow-xs"
              title="Announcements"
            >
              <span className="text-sm">🔔</span>
              {unreadNotices > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotices}
                </span>
              )}
            </button>

            {/* Streak Clickable Pill */}
            <button
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-full text-xs text-emerald-800 font-semibold transition-all cursor-pointer shadow-xs"
              title="Click to view streak breakdown"
            >
              <span>🔥</span>
              <span>12-Day Streak</span>
              <span className="text-[10px] text-emerald-600 bg-white/80 px-1.5 py-0.2 rounded-full">XP +240</span>
            </button>

            {/* Quick Link to Exam Section */}
            <button
              onClick={() => setActiveNavTab("exams")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-full text-xs text-indigo-800 font-bold transition-all cursor-pointer shadow-xs"
              title="Open Subject Examinations Portal"
            >
              <span>⏱️</span>
              <span>Exam Section (Timer)</span>
            </button>

            <button
              onClick={() => onNavigate("cognitive")}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Cognitive Profile"
            >
              {studentInitials}
            </button>
          </div>
        </div>

        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeNavTab === "dashboard" && (
          <>
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Overall Progress", value: realOverallProgress, icon: "📈", light: "bg-indigo-50 text-indigo-700" },
            { label: "Average Test Score", value: attemptedEnrollments.length > 0 ? `${realAveragePercent}%` : "Not attempted", icon: "⭐", light: "bg-purple-50 text-purple-700" },
            { label: "Enrolled Courses", value: `${enrolledCourses.length} Enrolled`, icon: "📚", light: "bg-blue-50 text-blue-700" },
            { label: "Cumulative CGPA", value: realCgpa, icon: "🎓", light: "bg-emerald-50 text-emerald-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${s.light} mb-2 text-base`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-0.5">{s.value}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Middle Section: Progress Chart + Upcoming Exam */}
        <div className="grid grid-cols-3 gap-5 mb-6">
          {/* Progress Chart */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-800 text-sm font-bold">Academic Performance Trajectory</h3>
                <p className="text-slate-400 text-xs">Continuous evaluation average across all {enrolledCourses.length} enrolled courses</p>
              </div>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ↑ +22% improvement
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: "#6366f1", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Next Assessment / Enrolled Priority Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            {(() => {
              const pendingCourse = enrolledCourses.find((c) => {
                const prog = studentProgress[c.id];
                return !prog?.passed;
              }) || enrolledCourses[0];

              const prog = pendingCourse ? studentProgress[pendingCourse.id] : null;

              if (pendingCourse) {
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-slate-800 text-sm font-bold">Next Assessment</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        prog?.studied ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}>
                        {prog?.studied ? "UNLOCKED & READY" : "STUDY REQUIRED"}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 rounded-xl p-3.5 mb-3">
                      <div className="text-indigo-800 font-bold text-sm">{pendingCourse.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{pendingCourse.code} · Faculty: {pendingCourse.instructor || "Faculty"}</div>
                      <div className="flex items-center justify-between text-xs mt-2.5 text-slate-500">
                        <span>Pass Mark: 7 / 10 (70%)</span>
                        <span>10 MCQs</span>
                      </div>
                    </div>
                    <button
                      onClick={() => (prog?.studied ? handleLaunchExam(pendingCourse) : handleOpenCourseHub(pendingCourse, "resources"))}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      {prog?.studied ? "Attend Assessment in Exam Portal →" : "Open Course Materials →"}
                    </button>
                  </div>
                );
              }

              return (
                <div className="text-center py-4">
                  <div className="text-2xl mb-1">🎓</div>
                  <h4 className="text-xs font-bold text-slate-800">No Pending Assessments</h4>
                  <p className="text-[11px] text-slate-500 mt-1 mb-3">
                    {enrolledCourses.length === 0
                      ? "Enroll in a subject from the faculty catalog below to unlock assessments."
                      : "All enrolled courses completed! Great work."}
                  </p>
                  <button
                    onClick={() => setActiveNavTab("catalog")}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                  >
                    Browse Course Catalog →
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* SECTION 1: MY ENROLLED COURSES */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-slate-800 text-sm font-bold flex items-center gap-2">
                <span>📚</span> My Enrolled Courses ({enrolledCourses.length})
              </h3>
              <p className="text-slate-400 text-xs">
                Courses you have registered and enrolled in. Access faculty study materials and 10-MCQ tests.
              </p>
            </div>
            {availableCourses.length > 0 && (
              <button
                onClick={() => setActiveNavTab("catalog")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                + Explore More Faculty Courses ({availableCourses.length}) →
              </button>
            )}
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-indigo-200 p-8 text-center shadow-xs">
              <span className="text-3xl mb-2 block">📖</span>
              <h4 className="text-sm font-bold text-slate-800">You haven't enrolled in any courses yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                Review the courses uploaded by your teachers below and click "Enroll in Course" to begin studying notes and taking your assessments.
              </p>
              <button
                onClick={() => setActiveNavTab("catalog")}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Browse & Enroll in Courses Below ↓
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {enrolledCourses.map((c) => {
                const prog = studentProgress[c.id];
                const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
                const courseResources = resources.filter((r) => matchResourceToCourse(r, c));
                const isPassed = prog?.passed || enr?.passed || enr?.status === "Finished";
                const lastScore = enr?.score ?? prog?.lastScore ?? prog?.bestScore;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{c.credits} Credits</span>
                        </div>

                        {/* Course Status Badge */}
                        {isPassed ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Finished ({lastScore}/10)
                          </span>
                        ) : lastScore !== undefined && lastScore < 7 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⚠️ Retake Needed ({lastScore}/10)
                          </span>
                        ) : prog?.studied ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            🔓 Test Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            ⏳ Studying Materials
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => handleOpenCourseHub(c, "resources")}
                        className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Faculty: {c.instructor || "Faculty Instructor"}</p>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Course Materials</span>
                          <span className="font-bold text-indigo-600">{courseResources.length} resources</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPassed ? "bg-emerald-500 w-full" : prog?.studied ? "bg-blue-500 w-2/3" : "bg-slate-300 w-1/4"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleOpenCourseHub(c, "resources")}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                        title="View course study resources"
                      >
                        <span>📚</span> Study ({courseResources.length})
                      </button>

                      {isPassed ? (
                        <button
                          onClick={() => {
                            setCertificateCourse(c);
                            setShowCertificateModal(true);
                          }}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>🎓</span> Certificate
                        </button>
                      ) : prog?.studied ? (
                        <button
                          onClick={() => handleLaunchExam(c)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>✍️</span> Attend Test →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenCourseHub(c, "resources")}
                          className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer flex items-center gap-1"
                        >
                          <span>🔒</span> Study to Unlock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: AVAILABLE FACULTY COURSES (CATALOG TO ENROLL) */}
        {availableCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-slate-800 text-sm font-bold flex items-center gap-2">
                  <span>🌐</span> Available Faculty Courses ({availableCourses.length})
                </h3>
                <p className="text-slate-400 text-xs">
                  Active courses registered by faculty. Click "Enroll in Course" to add them to your learning roster.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {availableCourses.map((c) => {
                const courseResources = resources.filter((r) => matchResourceToCourse(r, c));

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-dashed border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{c.credits} Credits</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Faculty: {c.instructor || "Faculty Instructor"}</p>
                      <div className="text-[10px] text-indigo-600 font-medium mt-1">
                        {courseResources.length} Study Resources Available
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{c.department || "Engineering"}</span>
                      <button
                        onClick={() => handleEnrollCourse(c)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>+</span> Enroll Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom 2 Columns: Subject Performance + Interactive AI Tutor Assistant */}
        <div className="grid grid-cols-12 gap-6">
          {/* Subject Performance Bar Chart (6 cols) */}
          <div className="col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-slate-800 text-sm font-bold mb-1">Subject Performance Benchmark</h3>
            <p className="text-slate-400 text-xs mb-3">Recent continuous assessment scores</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={dynamicSubjectData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive AI Study Tutor & Recommendation Assistant (6 cols) */}
          <div className="col-span-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    AMLE AI Academic Advisor
                  </h3>
                </div>
                <span className="text-[9px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  Instant Assistant
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed mb-3">
                Ask any question about your curriculum, exam prep, or study strategies.
              </p>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => handleAskAi("Recommend best preparation courses and reference books")}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-indigo-200 transition-colors cursor-pointer"
                >
                  📚 Recommended Courses & Books
                </button>
                <button
                  onClick={() => handleAskAi("Explain Dijkstra shortest path")}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-indigo-200 transition-colors cursor-pointer"
                >
                  ⚡ Dijkstra Algorithm
                </button>
                <button
                  onClick={() => handleAskAi("How do I balance AVL tree rotations?")}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-indigo-200 transition-colors cursor-pointer"
                >
                  🌳 AVL Rotations
                </button>
                <button
                  onClick={() => handleAskAi("What should I review for mid-sem?")}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-indigo-200 transition-colors cursor-pointer"
                >
                  🎯 Exam Prep Strategy
                </button>
              </div>

              {/* AI Response Box */}
              {isAiLoading && (
                <div className="p-3 bg-white/10 rounded-xl text-xs text-indigo-200 animate-pulse mb-3">
                  AI is analyzing cognitive benchmarks & course material...
                </div>
              )}
              {aiResponse && (
                <div className="p-3 bg-white/10 rounded-xl text-xs text-indigo-100 leading-relaxed border border-white/15 max-h-28 overflow-y-auto mb-3">
                  {aiResponse}
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
                placeholder="Ask AI tutor anything (e.g. Dynamic Programming)..."
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs px-3 py-2 rounded-xl focus:outline-hidden focus:border-indigo-400"
              />
              <button
                onClick={() => handleAskAi()}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ask AI
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* VIEW 2: MY ENROLLED COURSES */}
    {activeNavTab === "enrolled" && (() => {
      const filtered = enrolledCourses.filter((c) => {
        const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
        const prog = studentProgress[c.id];
        const isPassed = prog?.passed || enr?.passed || enr?.status === "Finished";
        const lastScore = enr?.score ?? prog?.lastScore ?? prog?.bestScore;

        const q = enrolledSearch.trim().toLowerCase();
        const matchSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.department || "").toLowerCase().includes(q);

        const matchStatus =
          enrolledStatusFilter === "all" ||
          (enrolledStatusFilter === "finished" && isPassed) ||
          (enrolledStatusFilter === "ongoing" && !isPassed) ||
          (enrolledStatusFilter === "review" && lastScore !== undefined && lastScore < 7);

        return matchSearch && matchStatus;
      });

      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">My Enrolled Courses ({enrolledCourses.length})</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Your active subject courses, faculty uploaded study materials, 10-MCQ test status, and completion certificates
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search enrolled subjects..."
                value={enrolledSearch}
                onChange={(e) => setEnrolledSearch(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 w-56 focus:outline-hidden focus:border-indigo-500"
              />
              {availableCourses.length > 0 && (
                <button
                  onClick={() => setActiveNavTab("catalog")}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span> Browse Catalog ({availableCourses.length})
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
            {[
              { id: "all", label: `All (${enrolledCourses.length})` },
              { id: "ongoing", label: `Ongoing (${enrolledCourses.filter((c) => {
                const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
                const prog = studentProgress[c.id];
                return !(prog?.passed || enr?.passed || enr?.status === "Finished");
              }).length})`, color: "text-blue-700 bg-blue-50 border-blue-200" },
              { id: "finished", label: `Finished & Passed (${finishedCoursesCount})`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { id: "review", label: `Review / Retake Required (${enrolledCourses.filter((c) => {
                const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
                const prog = studentProgress[c.id];
                const s = enr?.score ?? prog?.lastScore;
                return s !== undefined && s < 7;
              }).length})`, color: "text-amber-700 bg-amber-50 border-amber-200" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setEnrolledStatusFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  enrolledStatusFilter === chip.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : chip.color || "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No enrolled courses match filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                {enrolledCourses.length === 0
                  ? "You haven't enrolled in any subjects yet. Browse the faculty course catalog to select your subjects."
                  : "Try selecting 'All' or clearing your search term."}
              </p>
              {enrolledCourses.length === 0 && (
                <button
                  onClick={() => setActiveNavTab("catalog")}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Browse Course Catalog →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map((c) => {
                const prog = studentProgress[c.id];
                const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
                const courseResources = resources.filter((r) => matchResourceToCourse(r, c));
                const isPassed = prog?.passed || enr?.passed || enr?.status === "Finished";
                const lastScore = enr?.score ?? prog?.lastScore ?? prog?.bestScore;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                            {c.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{c.credits} Credits</span>
                        </div>

                        {isPassed ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Finished ({lastScore}/10)
                          </span>
                        ) : lastScore !== undefined && lastScore < 7 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            ⚠️ Retake Needed ({lastScore}/10)
                          </span>
                        ) : prog?.studied ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            🔓 Test Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            ⏳ Studying Materials
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-800 mb-1">{c.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Instructor: {c.instructor || "Faculty Instructor"} · {c.department}
                      </p>

                      <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600 bg-slate-50/50 rounded-xl px-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Study Materials:</span>
                          <span className="font-semibold text-indigo-700">{courseResources.length} resources</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Assessment Score:</span>
                          <span className="font-bold text-slate-800">
                            {lastScore !== undefined ? `${lastScore} / 10 (${lastScore * 10}%)` : "Not taken yet"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Test Attempts:</span>
                          <span className="font-semibold text-slate-700">{enr?.attempts || prog?.attempts || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 gap-2 flex-wrap border-t border-slate-100">
                      <button
                        onClick={() => handleOpenCourseHub(c, "resources")}
                        className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>📚</span> Resources ({courseResources.length})
                      </button>

                      {isPassed ? (
                        <button
                          onClick={() => {
                            setCertificateCourse(c);
                            setShowCertificateModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>🎓</span> Certificate
                        </button>
                      ) : prog?.studied ? (
                        <button
                          onClick={() => handleLaunchExam(c)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>✍️</span> Attend Test →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenCourseHub(c, "resources")}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>🔒</span> Complete Study
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    })()}

    {/* VIEW: EXAMS & ASSESSMENTS PORTAL */}
    {activeNavTab === "exams" && (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <h2 className="text-xl font-bold text-slate-800">
                Subject Examination Portal · Live Timed Assessments
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Select any of your enrolled courses below to start the official 10-MCQ examination with a live 20-minute countdown timer, Question Matrix navigation, and AI Proctor Sentinel monitoring.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
              Passing Mark: 7 / 10 (70%)
            </span>
          </div>
        </div>

        {/* Global Exam Features Highlight Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white mb-6 shadow-md">
          <div className="flex items-start justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase bg-white/10 px-2.5 py-0.5 rounded-full">
                Interactive Exam Environment
              </span>
              <h3 className="text-lg font-bold mt-2 mb-1">
                University-Grade Timed Examinations with Instant AI Evaluation
              </h3>
              <p className="text-xs text-white/80 max-w-2xl leading-relaxed mb-4">
                Each subject test presents 10 curriculum-specific questions under a 20-minute countdown timer. Our automated sentinel verifies candidate integrity. Scoring 7/10 or higher immediately awards your accredited Certificate of Completion. Scoring below 7 unlocks the comprehensive AI Diagnostic Remediation Report with targeted study guides.
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-indigo-200 flex-wrap">
                <span className="flex items-center gap-1.5">⏱ 20-Min Live Countdown Timer</span>
                <span>·</span>
                <span className="flex items-center gap-1.5">🔢 Question Matrix 1–10 Jump Grid</span>
                <span>·</span>
                <span className="flex items-center gap-1.5">🛡️ AI Proctor Sentinel Feed</span>
                <span>·</span>
                <span className="flex items-center gap-1.5">🎓 Verifiable Certificate on Pass</span>
              </div>
            </div>
            {enrolledCourses.length > 0 && (
              <button
                onClick={() => handleLaunchExam(enrolledCourses[0])}
                className="px-5 py-3 bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex-shrink-0 active:scale-95 flex items-center gap-2"
              >
                <span>Launch Exam Portal Now</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Enrolled Subject Exams */}
        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-indigo-200 p-10 text-center shadow-xs">
            <span className="text-4xl block mb-2">📚</span>
            <h3 className="text-base font-bold text-slate-800">No Enrolled Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              Enroll in faculty subjects from the course catalog to unlock official subject examinations.
            </p>
            <button
              onClick={() => setActiveNavTab("catalog")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Browse Course Catalog →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {enrolledCourses.map((c) => {
              const prog = studentProgress[c.id];
              const enr = studentEnrollments.find((e) => e.courseId === c.id || e.courseCode === c.code);
              const isPassed = prog?.passed || enr?.passed || enr?.status === "Finished";
              const lastScore = enr?.score ?? prog?.lastScore ?? prog?.bestScore;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {c.code}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{c.credits} Credits</span>
                      </div>

                      {isPassed ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          ✓ Passed ({lastScore} / 10)
                        </span>
                      ) : lastScore !== undefined && lastScore < 7 ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          ⚠️ Retake Needed ({lastScore} / 10)
                        </span>
                      ) : prog?.studied ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          🔓 Unlocked & Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          ⏱️ Timed Test Available
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-800 mb-1">{c.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Department of {c.department || "Computer Science"} · Faculty: {c.instructor || "Faculty Instructor"}
                    </p>

                    {/* Examination Metadata Pill Box */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Test Format</span>
                        <span className="font-bold text-slate-800">10 MCQs</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Timer</span>
                        <span className="font-bold text-indigo-600">20 Minutes</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Pass Mark</span>
                        <span className="font-bold text-emerald-600">7 / 10 (70%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenCourseHub(c, "resources")}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📚</span>
                      <span>Review Materials</span>
                    </button>

                    {isPassed ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCertificateCourse(c);
                            setShowCertificateModal(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>🎓</span>
                          <span>Certificate</span>
                        </button>
                        <button
                          onClick={() => handleLaunchExam(c)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>⏱️ Retake Exam →</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLaunchExam(c)}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <span>⏱️</span>
                        <span>Start Timed Exam Now →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* VIEW 3: COURSE CATALOG */}
    {activeNavTab === "catalog" && (() => {
      const filteredCatalog = courses.filter((c) => {
        const q = catalogSearch.trim().toLowerCase();
        return (
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.department || "").toLowerCase().includes(q)
        );
      });

      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Faculty Course Catalog & Enrollment</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Browse all subjects offered by institutional faculty. Click "Enroll in Course" to add to your semester study roster.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search courses..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 w-56 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                onClick={() => setActiveNavTab("enrolled")}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                View My Enrolled Courses ({enrolledCourses.length}) →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {filteredCatalog.map((c) => {
              const isEnrolled = isStudentEnrolled(studentId, c.id);
              const courseResources = resources.filter((r) => matchResourceToCourse(r, c));

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all ${
                    isEnrolled ? "border-indigo-200" : "border-slate-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                          {c.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{c.credits} Credits</span>
                      </div>

                      {isEnrolled ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          ✓ Enrolled
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Semester {c.semester || 3}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-1">{c.name}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {c.description || `${c.department || "Computer Science"} core departmental curriculum.`}
                    </p>

                    <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-xs text-slate-600 bg-slate-50/50 rounded-xl px-3 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Instructor:</span>
                        <span className="font-semibold text-slate-700">{c.instructor || "Faculty"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Department:</span>
                        <span className="text-slate-600">{c.department || "Engineering"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Study Materials:</span>
                        <span className="font-semibold text-indigo-600">{courseResources.length} published</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    {isEnrolled ? (
                      <>
                        <button
                          onClick={() => handleOpenCourseHub(c, "resources")}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                        >
                          Course Hub
                        </button>
                        <button
                          onClick={() => handleLaunchExam(c)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        >
                          <span>⏱️</span> Take Timed Exam →
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(c)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>+</span> Enroll in Subject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })()}

        {/* Streak Modal */}
        {showStreakModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-lg font-bold text-slate-800">12-Day Learning Streak!</h3>
                </div>
                <button
                  onClick={() => setShowStreakModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                You have completed at least one quiz or reading module for 12 consecutive days. Keep it up to earn the Semester Scholar Badge!
              </p>
              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs mb-4">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="font-bold text-slate-400">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 14 }, (_, i) => (
                  <div
                    key={i}
                    className={`py-2 rounded-lg text-xs font-bold ${
                      i < 12 ? "bg-emerald-500 text-white shadow-2xs" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium text-center">
                Reward: 2x XP multiplier active on all practice quizzes today!
              </div>
            </div>
          </div>
        )}

        {/* Announcements Modal */}
        {showAnnouncementsModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔔</span>
                  <h3 className="text-lg font-bold text-slate-800">Campus & Academic Notices</h3>
                </div>
                <button
                  onClick={() => setShowAnnouncementsModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {ANNOUNCEMENTS.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{a.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{a.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">{a.content}</p>
                    <div className="text-[10px] text-indigo-600 font-semibold">{a.author}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setUnreadNotices(0)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Mark all as read
                </button>
                <button
                  onClick={() => setShowAnnouncementsModal(false)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Learning, Assessment & Certification Hub Modal */}
        {activeCourseHub && (() => {
          const prog = studentProgress[activeCourseHub.id] || getStudentCourseProgress(studentId, activeCourseHub.id);
          const courseResources = resources.filter((r) => matchResourceToCourse(r, activeCourseHub));
          const hasPassed = prog.passed;
          const isStudied = prog.studied;

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
                <div>
                  {/* Hub Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {activeCourseHub.code}
                        </span>
                        <span className="text-xs text-slate-400">{activeCourseHub.credits} Academic Credits</span>
                        {hasPassed && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ Course Completed ({prog.bestScore || prog.lastScore}/10)
                          </span>
                        )}
                        {!hasPassed && isStudied && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            🔓 Assessment Ready
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">{activeCourseHub.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Department of {activeCourseHub.department} · Faculty: {activeCourseHub.instructor || "Faculty Instructor"}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveCourseHub(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>

                  {/* Toast notification */}
                  {hubToast && (
                    <div className="mb-4 bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 animate-fade-in">
                      <span>✨</span>
                      <span>{hubToast}</span>
                    </div>
                  )}

                  {/* Hub Tabs */}
                  <div className="flex items-center gap-3 border-b border-slate-200 mb-5">
                    <button
                      onClick={() => setActiveHubTab("resources")}
                      className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeHubTab === "resources"
                          ? "text-indigo-600 border-b-2 border-indigo-600"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>📚</span> 1. Course Study Resources ({courseResources.length})
                    </button>

                    <button
                      onClick={() => {
                        if (!isStudied && !hasPassed) {
                          showHubToast("🔒 Assessment Locked: Complete course materials in Tab 1 first!");
                          return;
                        }
                        handleLaunchExam(activeCourseHub);
                      }}
                      className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        !isStudied && !hasPassed
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-indigo-600 hover:text-indigo-800 font-extrabold"
                      }`}
                    >
                      <span>{isStudied || hasPassed ? "📝" : "🔒"}</span>
                      2. Subject Assessment (Exam Portal with Timer & Camera →)
                      {!isStudied && !hasPassed && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Locked
                        </span>
                      )}
                    </button>

                    {hasPassed && (
                      <button
                        onClick={() => {
                          setCertificateCourse(activeCourseHub);
                          setShowCertificateModal(true);
                        }}
                        className="pb-2.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <span>🎓</span> View Official Certificate →
                      </button>
                    )}
                  </div>

                  {/* TAB 1: STUDY RESOURCES */}
                  {activeHubTab === "resources" && (
                    <div className="space-y-4">
                      {/* AI Diagnostic Alert if previous test score was < 7 */}
                      {prog.lastScore !== undefined && !prog.passed && prog.weakTopics && prog.weakTopics.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-xs">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">🤖</span>
                            <span className="font-bold text-amber-800 uppercase tracking-wide text-[10px]">
                              AMLE AI Diagnostic Report — Weak Areas Identified
                            </span>
                          </div>
                          <p className="leading-relaxed mb-2">
                            You scored <strong>{prog.lastScore} / 10 marks</strong> on your previous attempt (average pass mark is <strong>7 / 10</strong>).
                            Our AI diagnostic analysis detected weakness in:
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {prog.weakTopics.map((topic, i) => (
                              <span key={i} className="bg-amber-200/70 text-amber-900 font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
                                🎯 {topic}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-amber-800 font-medium">
                            Please carefully study the course materials below to reinforce these concepts. Once you finish reviewing, click the button below to unlock your retake assessment.
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Course Learning Assets & Reference Documents ({courseResources.length})
                          </span>
                        </div>

                        {/* Prominent Official Real Study PDF Card */}
                        <div className="bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-indigo-200/90 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-rose-600 text-white text-xl flex items-center justify-center shadow-sm flex-shrink-0">
                              📖
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.2 rounded-full uppercase">
                                  Official Textbook Guide
                                </span>
                                <span className="text-[10px] font-bold text-indigo-700 font-mono">
                                  {activeCourseHub.code}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-800">
                                {activeCourseHub.code} Comprehensive Syllabus & Study Notes (PDF)
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                Complete lecture units, visual algorithm traces, schema normalization, formulas & practice problems.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const studyPdf = getStudyPdfForCourse(activeCourseHub.id || activeCourseHub.code);
                              setViewingPdf(studyPdf);
                            }}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 flex-shrink-0 active:scale-95"
                          >
                            <span>📄 Open Real Study PDF</span>
                            <span>→</span>
                          </button>
                        </div>

                        {courseResources.length > 0 ? (
                          <div className="space-y-2.5">
                            {courseResources.map((res) => (
                              <div
                                key={res.id}
                                className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-indigo-200 transition-all flex items-start justify-between gap-3 shadow-2xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        res.type === "pdf"
                                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                                          : res.type === "video"
                                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                                          : res.type === "link"
                                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      }`}
                                    >
                                      {res.type}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800 truncate">{res.title}</h4>
                                  </div>
                                  {res.description && (
                                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-1.5">{res.description}</p>
                                  )}
                                  <div className="text-[10px] text-slate-400">
                                    Uploaded by {res.uploadedBy || "Faculty"} · {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : "Recent"}
                                  </div>
                                </div>
                                {res.type === "pdf" || res.type === "notes" ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const studyPdf = getStudyPdfForCourse(activeCourseHub?.id || activeCourseHub?.code || res.courseId);
                                      setViewingPdf(studyPdf);
                                    }}
                                    className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 active:scale-95"
                                  >
                                    <span>📄 View Real Study PDF</span>
                                    <span>📖</span>
                                  </button>
                                ) : res.url ? (
                                  <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                                      res.type === "video"
                                        ? "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                                    }`}
                                  >
                                    <span>
                                      {res.type === "video"
                                        ? "▶ Watch Video"
                                        : "🔗 Open Link"}
                                    </span>
                                    <span>↗</span>
                                  </a>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-5 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-slate-50/50">
                            Faculty has not attached supplemental files yet. Standard syllabus materials and lecture guides are loaded below.
                          </div>
                        )}
                      </div>

                      {/* Standard Syllabus Guide */}
                      <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                            🏛️ University Curriculum & Examination Syllabus
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Verified Syllabus
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          Comprehensive subject curriculum, lecture problem sets & continuous evaluation guide
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Students must review classroom lecture slides, standard textbook references, and problem sets before taking the 10-Question MCQ assessment. Passing threshold is 7 / 10 marks.
                        </p>
                      </div>

                      {/* Study Completion Action Banner */}
                      <div className="pt-2">
                        {!isStudied && !hasPassed ? (
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div>
                              <div className="text-xs font-bold text-indigo-900">Have you finished reviewing the course materials?</div>
                              <div className="text-[11px] text-slate-500">
                                Click to mark study complete and unlock the 10-question MCQ assessment.
                              </div>
                            </div>
                            <button
                              onClick={() => handleMarkCourseStudied(activeCourseHub.id)}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                            >
                              ✓ I Have Completed Studying → Unlock Test
                            </button>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">✓</span>
                              <div>
                                <div className="text-xs font-bold text-emerald-900">Course Materials Completed</div>
                                <div className="text-[11px] text-emerald-700">
                                  Assessment is unlocked and ready for you to take.
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleLaunchExam(activeCourseHub)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                            >
                              Attend 10-Question Test in Exam Portal →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ASSESSMENT (10 MCQS) */}
                  {activeHubTab === "test" && (
                    <div>
                      {!isStudied && !hasPassed ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 text-2xl flex items-center justify-center mx-auto mb-3">
                            🔒
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-1">Assessment Locked</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                            Academic policy requires you to complete studying the course materials and syllabus references before you can attend the subject test.
                          </p>
                          <button
                            onClick={() => setActiveHubTab("resources")}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            ← Return to Course Study Resources
                          </button>
                        </div>
                      ) : !isTestSubmitted ? (
                        <div>
                          {/* Live Timed Exam Portal Gateway */}
                          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-8 text-center shadow-xl border border-indigo-500/30 my-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-3xl flex items-center justify-center mx-auto mb-4">
                              📹
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                              AI PROCTORING & TIMER MANDATORY
                            </span>
                            <h3 className="text-xl font-extrabold text-white mb-2">
                              {activeCourseHub.name} ({activeCourseHub.code})
                            </h3>
                            <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
                              This assessment is conducted in the official AI-Proctored Exam Portal with live webcam facial tracking, gaze monitoring, and a 20-minute countdown timer.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleLaunchExam(activeCourseHub)}
                              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 mx-auto"
                            >
                              <span>🚀 Open Exam Portal with Live Camera & Timer →</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Test Evaluation Result View */
                        <div>
                          {lastTestScore >= 7 ? (
                            /* PASSED (>= 7) */
                            <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 text-center shadow-xs">
                              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white text-3xl flex items-center justify-center mx-auto mb-3 shadow-md">
                                🏆
                              </div>
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
                                Course Successfully Completed!
                              </span>
                              <h3 className="text-2xl font-bold text-slate-900 mt-2 mb-1">
                                Congratulations, {studentName}!
                              </h3>
                              <p className="text-xs text-slate-600 max-w-md mx-auto mb-4">
                                You attained a score of <strong className="text-emerald-700 text-sm">{lastTestScore} / 10 marks ({lastTestScore * 10}%)</strong>.
                                You have fulfilled all academic mastery criteria for {activeCourseHub.name}.
                              </p>

                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => {
                                    setCertificateCourse(activeCourseHub);
                                    setShowCertificateModal(true);
                                  }}
                                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <span>🎓</span> View & Download Official Certificate
                                </button>
                                <button
                                  onClick={() => {
                                    setIsTestSubmitted(false);
                                    setSelectedAnswers({});
                                  }}
                                  className="px-4 py-2.5 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Retake for Higher Score
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* FAILED (< 7): AI Diagnostics & Resources Shown Again */
                            (() => {
                              const diag =
                                diagnosticReport ||
                                generateAiTestDiagnostic({
                                  courseName: activeCourseHub.name,
                                  courseCode: activeCourseHub.code,
                                  score: lastTestScore,
                                  totalQuestions: courseMcqs.length || 10,
                                  questions: courseMcqs,
                                  selectedAnswers,
                                  availableResources: courseResources,
                                });

                              const missedQuestions = diag.mistakes.filter((m) => !m.isCorrect);

                              return (
                                <div className="space-y-5">
                                  {/* Diagnostic Header Alert */}
                                  <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-3xl p-5 shadow-xs">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white text-2xl flex items-center justify-center shadow-xs flex-shrink-0">
                                          ⚠️
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider bg-rose-100 px-2.5 py-0.5 rounded-full">
                                              Score: {diag.score} / {diag.totalQuestions} Marks ({diag.percentage}%)
                                            </span>
                                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                              Pass Mark: 7 / 10 (70%)
                                            </span>
                                            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                                              Gap: {Math.max(1, 7 - diag.score)} More Mark{7 - diag.score > 1 ? "s" : ""} Needed to Pass
                                            </span>
                                          </div>
                                          <h4 className="text-lg font-bold text-slate-900 mt-1">
                                            Did Not Meet Passing Benchmark — Remedial Study Required
                                          </h4>
                                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                            {diag.summaryMessage}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* SECTION 1: AI Weak Area Diagnosis & Topic Preparation Guide */}
                                  <div className="bg-white rounded-3xl border border-indigo-100 p-5 shadow-xs">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                                          🤖
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-slate-900">
                                            AI Topic Diagnosis: What to Study & How to Prepare
                                          </h4>
                                          <p className="text-xs text-slate-500">
                                            Identified {diag.weakTopicsList.length} weak area{diag.weakTopicsList.length > 1 ? "s" : ""} from your incorrect responses. Review the specific guidance below:
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                                        Adaptive Remedial Plan
                                      </span>
                                    </div>

                                    {diag.topicsAnalysis.length > 0 ? (
                                      <div className="space-y-4">
                                        {diag.topicsAnalysis.map((topicItem, idx) => (
                                          <div
                                            key={idx}
                                            className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 transition-all hover:border-indigo-300"
                                          >
                                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                                                <h5 className="text-xs font-bold text-slate-900">
                                                  Weak Area: {topicItem.topic}
                                                </h5>
                                              </div>
                                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md">
                                                {topicItem.missedCount} Question{topicItem.missedCount > 1 ? "s" : ""} Missed
                                              </span>
                                            </div>

                                            {/* What to study */}
                                            <div className="bg-white border border-slate-100 rounded-xl p-3 mb-2.5">
                                              <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                                                <span>📘</span>
                                                <span>What You Should Study:</span>
                                              </div>
                                              <p className="text-xs text-slate-700 leading-relaxed">
                                                {topicItem.whatToStudy}
                                              </p>
                                            </div>

                                            {/* How to prepare like this */}
                                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mb-2.5">
                                              <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5 mb-1.5">
                                                <span>🎯</span>
                                                <span>How to Prepare Like This (Step-by-Step):</span>
                                              </div>
                                              <ol className="space-y-1 text-xs text-slate-700 list-decimal list-inside pl-1">
                                                {topicItem.howToPrepare.map((step, sIdx) => (
                                                  <li key={sIdx} className="leading-relaxed">
                                                    <span className="font-medium">{step}</span>
                                                  </li>
                                                ))}
                                              </ol>
                                            </div>

                                            {/* Recommended study resource for this topic */}
                                            {topicItem.recommendedResourceTitle && (
                                              <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2.5">
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                                                      {topicItem.recommendedResourceType || "Resource"}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-800 truncate">
                                                      {topicItem.recommendedResourceTitle}
                                                    </span>
                                                  </div>
                                                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                                    Recommended study material for {topicItem.topic}
                                                  </span>
                                                </div>
                                                {topicItem.recommendedResourceUrl && (
                                                  <a
                                                    href={topicItem.recommendedResourceUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                                                  >
                                                    Open Material ↗
                                                  </a>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-50">
                                        Review general syllabus materials and lecture slides for this subject.
                                      </div>
                                    )}
                                  </div>

                                  {/* SECTION 2: Question-by-Question Mistake Review */}
                                  {missedQuestions.length > 0 && (
                                    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
                                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base">
                                            🔍
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-slate-900">
                                              Question-by-Question Mistake Breakdown ({missedQuestions.length} Incorrect)
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                              Review what you selected versus the correct solution and faculty explanation:
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        {missedQuestions.map((mistake) => (
                                          <div
                                            key={mistake.questionNumber}
                                            className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2.5"
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <span className="text-xs font-bold text-slate-900">
                                                Q{mistake.questionNumber}: {mistake.questionText}
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md flex-shrink-0">
                                                {mistake.topic}
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                                                <span className="text-[10px] font-bold text-rose-700 block mb-0.5">
                                                  ❌ Your Choice:
                                                </span>
                                                <span className="font-semibold text-rose-900">
                                                  {mistake.studentAnswerText}
                                                </span>
                                              </div>
                                              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                                                <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
                                                  ✅ Correct Answer:
                                                </span>
                                                <span className="font-semibold text-emerald-900">
                                                  {mistake.correctAnswerText}
                                                </span>
                                              </div>
                                            </div>

                                            {mistake.explanation && (
                                              <div className="text-xs text-slate-700 bg-white border border-slate-200/80 rounded-xl p-2.5 leading-relaxed">
                                                <strong className="text-slate-900">Faculty Explanation:</strong>{" "}
                                                {mistake.explanation}
                                              </div>
                                            )}

                                            {mistake.actionableTip && (
                                              <div className="text-xs text-indigo-900 bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 leading-relaxed flex items-start gap-1.5">
                                                <span className="flex-shrink-0">💡</span>
                                                <span>
                                                  <strong>Study Tip:</strong> {mistake.actionableTip}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* SECTION 3: All Subject Resources Shown Again Below */}
                                  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                                          📁
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-slate-900">
                                            Re-assigned Course Study Materials ({courseResources.length})
                                          </h4>
                                          <p className="text-xs text-slate-500">
                                            Review the lecture PDFs, videos, and study guides below before retaking your test:
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {courseResources.length > 0 ? (
                                      <div className="space-y-2.5">
                                        {courseResources.map((res) => (
                                          <div
                                            key={res.id}
                                            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white flex items-center justify-between gap-3 shadow-2xs transition-colors"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                  res.type === "pdf"
                                                    ? "bg-rose-100 text-rose-800"
                                                    : res.type === "video"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-indigo-100 text-indigo-800"
                                                }`}>
                                                  {res.type}
                                                </span>
                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                  {res.title}
                                                </span>
                                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full font-bold">
                                                  🎯 Remedial Study
                                                </span>
                                              </div>
                                              {res.description && (
                                                <p className="text-[11px] text-slate-600 truncate mt-1">
                                                  {res.description}
                                                </p>
                                              )}
                                            </div>
                                            {res.url && (
                                              <a
                                                href={res.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                                                  res.type === "pdf"
                                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                                    : res.type === "video"
                                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                }`}
                                              >
                                                {res.type === "pdf" ? "📄 View PDF ↗" : res.type === "video" ? "▶ Watch Video ↗" : "Open ↗"}
                                              </a>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-50">
                                        Review standard syllabus lectures and textbook notes before your retake.
                                      </div>
                                    )}
                                  </div>

                                  {/* Unlock Retest Action Button */}
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
                                    <p className="text-xs text-indigo-900 font-semibold mb-3">
                                      Once you have reviewed the study guidance and materials above, retake your 10-question assessment with a live timer:
                                    </p>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => handleRestudyAndUnlockRetake(activeCourseHub.id)}
                                        className="flex-1 py-3 bg-white border border-indigo-300 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                      >
                                        ✓ Mark Re-Studied
                                      </button>
                                      <button
                                        onClick={() => handleLaunchExam(activeCourseHub)}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                                      >
                                        <span>🚀 Retake in Exam Portal with Timer →</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hub Modal Bottom Close */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Candidate: {studentName} ({studentId})
                  </span>
                  <button
                    onClick={() => setActiveCourseHub(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Close Course Hub
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Official Course Certificate Modal */}
        {showCertificateModal && certificateCourse && (
          <CourseCertificate
            course={certificateCourse}
            studentName={studentName}
            studentId={studentId}
            score={studentProgress[certificateCourse.id]?.bestScore || lastTestScore || 8}
            completedAt={studentProgress[certificateCourse.id]?.completedAt}
            certificateId={studentProgress[certificateCourse.id]?.certificateId}
            onClose={() => setShowCertificateModal(false)}
          />
        )}

        {/* Official Real Academic Study PDF Viewer Modal */}
        {viewingPdf && (
          <StudyPdfViewerModal
            pdfData={viewingPdf}
            onClose={() => setViewingPdf(null)}
            onLaunchAssessment={activeCourseHub ? () => handleLaunchExam(activeCourseHub) : undefined}
          />
        )}
      </main>
    </div>
  );
}
