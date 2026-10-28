import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  fetchCourses,
  createCourse,
  deleteCourse,
  fetchResources,
  createResource,
  deleteResource,
  clearAllResources,
  fetchCourseMCQs,
  createCourseMCQ,
  deleteCourseMCQ,
  resetCourseMCQs,
  fetchAllStudentGrades,
  computeCourseRealStats,
  computeTeacherRealStats,
  onLmsDataChange,
  type StudentCourseGrade,
  matchResourceToCourse,
  getProctorIncidents,
  resolveProctorIncident,
  type ProctorIncident,
} from "../services/api";
import { COURSES, type Course, RESOURCES, type Resource, type CourseMCQ } from "../data";
import StudyPdfViewerModal from "../components/StudyPdfViewerModal";
import { getStudyPdfForCourse, type RealStudyPdf } from "../data/realStudyPdfs";

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

type TeacherSection = "overview" | "courses" | "students" | "grades" | "assignments" | "proctoring" | "profile";

interface AssignmentItem {
  id: string;
  name: string;
  class: string;
  date: string;
  sub: string;
  score: string;
  status: "Graded" | "Grading" | "Open";
}

interface StudentGradeRow {
  name: string;
  a1: number;
  a2: number;
  mid: number;
  final: string;
}

export default function TeacherDashboard({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const [section, setSection] = useState<TeacherSection>("overview");

  // Notifications / Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Courses & Resources state
  const [coursesList, setCoursesList] = useState<Course[]>(COURSES);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [activeCourseTab, setActiveCourseTab] = useState<"courses" | "resources" | "mcqs">("courses");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [viewingPdf, setViewingPdf] = useState<RealStudyPdf | null>(null);
  const [resourceSearch, setResourceSearch] = useState<string>("");

  // MCQ Question Bank state (Teacher uploaded - max 10 per course)
  const [mcqsList, setMcqsList] = useState<CourseMCQ[]>([]);
  const [selectedMcqCourse, setSelectedMcqCourse] = useState<string>("c1");
  const [showAddMcqModal, setShowAddMcqModal] = useState(false);
  const [mcqCourseId, setMcqCourseId] = useState("c1");
  const [mcqQuestion, setMcqQuestion] = useState("");
  const [mcqTopic, setMcqTopic] = useState("");
  const [mcqOptionA, setMcqOptionA] = useState("");
  const [mcqOptionB, setMcqOptionB] = useState("");
  const [mcqOptionC, setMcqOptionC] = useState("");
  const [mcqOptionD, setMcqOptionD] = useState("");
  const [mcqAnswer, setMcqAnswer] = useState<number>(0);
  const [mcqExplanation, setMcqExplanation] = useState("");
  const [isSubmittingMcq, setIsSubmittingMcq] = useState(false);

  // Course Modal state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCredits, setCourseCredits] = useState(4);
  const [courseDept, setCourseDept] = useState("Computer Science");
  const [courseSemester, setCourseSemester] = useState(3);
  const [courseDesc, setCourseDesc] = useState("");
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Resource Modal state
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [resCourseId, setResCourseId] = useState("c1");
  const [resTitle, setResTitle] = useState("");
  const [resType, setResType] = useState<"pdf" | "video" | "link" | "notes">("pdf");
  const [resUrl, setResUrl] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);

  // Real Student Grades & Enrolled Roster State
  const [studentGrades, setStudentGrades] = useState<StudentCourseGrade[]>([]);
  const [gradeFilterCourse, setGradeFilterCourse] = useState<string>("all");
  const [gradeStatusFilter, setGradeStatusFilter] = useState<string>("all");
  const [gradeSearchQuery, setGradeSearchQuery] = useState<string>("");

  // Enrolled Students View State
  const [studentFilterCourse, setStudentFilterCourse] = useState<string>("all");
  const [studentFilterStatus, setStudentFilterStatus] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const syncData = () => {
      fetchCourses().then((res) => {
        if (isMounted && Array.isArray(res)) setCoursesList(res);
      });
      fetchResources().then((res) => {
        if (isMounted && Array.isArray(res)) setResourcesList(res);
      });
      fetchCourseMCQs().then((res) => {
        if (isMounted && res) setMcqsList(res);
      });
      fetchAllStudentGrades().then((res) => {
        if (isMounted && res) setStudentGrades(res);
      });
      if (isMounted) {
        setIncidents(getProctorIncidents());
      }
    };

    syncData();
    const unsubscribe = onLmsDataChange(syncData);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshGrades = async () => {
    try {
      const grades = await fetchAllStudentGrades();
      setStudentGrades(grades);
      showToast("Live student marks and attendance synchronized.");
    } catch {
      showToast("Could not sync grades.");
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) {
      showToast("Please enter Course Code and Course Name.");
      return;
    }
    setIsSubmittingCourse(true);
    try {
      const resp = await createCourse({
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        credits: Number(courseCredits) || 3,
        department: courseDept.trim() || profileDept,
        semester: Number(courseSemester) || 3,
        instructor: profileName,
        facultyId: activeUser?.id || "u2",
        description: courseDesc.trim(),
      });
      const created = resp.course || {
        id: "c" + Date.now(),
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        credits: Number(courseCredits) || 3,
        department: courseDept.trim() || profileDept,
        semester: Number(courseSemester) || 3,
        instructor: profileName,
        facultyId: activeUser?.id || "u2",
        enrolled: 45,
        description: courseDesc.trim(),
      };
      setCoursesList((prev) => [created, ...prev]);
      setShowAddCourseModal(false);
      setCourseCode("");
      setCourseName("");
      setCourseDesc("");
      showToast(`Course "${created.name}" created and added!`);
    } catch (err: any) {
      showToast(err.message || "Failed to add course.");
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove course "${name}" and all associated resources?`)) {
      return;
    }
    try {
      await deleteCourse(id);
      setCoursesList((prev) => prev.filter((c) => c.id !== id && c.code !== id));
      setResourcesList((prev) => prev.filter((r) => r.courseId !== id));
      showToast(`Course "${name}" removed successfully.`);
    } catch (err: any) {
      showToast(err.message || "Failed to remove course.");
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourse = resCourseId || (coursesList[0]?.id ?? "c1");
    if (!resTitle.trim()) {
      showToast("Please provide Resource Title.");
      return;
    }
    setIsSubmittingRes(true);
    try {
      const resp = await createResource({
        courseId: targetCourse,
        title: resTitle.trim(),
        type: resType,
        url: resUrl.trim() || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        description: resDesc.trim(),
        uploadedBy: profileName,
      });
      const created = resp.resource;
      setResourcesList((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setShowAddResourceModal(false);
      setResTitle("");
      setResUrl("");
      setResDesc("");
      setActiveCourseTab("resources");
      setSelectedCourseFilter(targetCourse);
      showToast(`Resource "${created.title}" published!`);
    } catch (err: any) {
      showToast(err.message || "Failed to add resource.");
    } finally {
      setIsSubmittingRes(false);
    }
  };

  const handleDeleteResource = async (id: string, title: string) => {
    try {
      await deleteResource(id);
      setResourcesList((prev) => prev.filter((r) => r.id !== id));
      showToast(`Resource "${title}" removed successfully.`);
    } catch (err: any) {
      showToast(err.message || "Failed to remove resource.");
    }
  };

  const handleClearAllResources = async () => {
    if (!window.confirm("Are you sure you want to remove ALL resources from the dashboard?")) {
      return;
    }
    await clearAllResources();
    setResourcesList([]);
    showToast("All resources removed from dashboard.");
  };

  const handleAddMCQ = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourse = mcqCourseId || selectedMcqCourse || (coursesList[0]?.id ?? "c1");
    const existingCount = mcqsList.filter((q) => q.courseId === targetCourse).length;
    if (existingCount >= 10) {
      showToast("Cannot add question: Maximum limit of 10 questions reached for this course!");
      return;
    }
    if (!mcqQuestion.trim() || !mcqTopic.trim()) {
      showToast("Please provide both Question text and Topic category.");
      return;
    }
    if (!mcqOptionA.trim() || !mcqOptionB.trim() || !mcqOptionC.trim() || !mcqOptionD.trim()) {
      showToast("Please provide all 4 multiple choice options.");
      return;
    }

    setIsSubmittingMcq(true);
    try {
      const resp = await createCourseMCQ({
        courseId: targetCourse,
        question: mcqQuestion.trim(),
        topic: mcqTopic.trim(),
        options: [mcqOptionA.trim(), mcqOptionB.trim(), mcqOptionC.trim(), mcqOptionD.trim()],
        answer: Number(mcqAnswer) || 0,
        explanation: mcqExplanation.trim(),
      });
      if (resp.ok && resp.mcq) {
        setMcqsList((prev) => [...prev, resp.mcq!]);
        setShowAddMcqModal(false);
        setMcqQuestion("");
        setMcqTopic("");
        setMcqOptionA("");
        setMcqOptionB("");
        setMcqOptionC("");
        setMcqOptionD("");
        setMcqExplanation("");
        setMcqAnswer(0);
        showToast(resp.message || "MCQ question saved successfully!");
      } else {
        showToast(resp.message || "Failed to add question.");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving question.");
    } finally {
      setIsSubmittingMcq(false);
    }
  };

  const handleDeleteMCQ = async (id: string, qText: string) => {
    if (!window.confirm(`Delete question: "${qText.slice(0, 50)}..."?`)) return;
    try {
      await deleteCourseMCQ(id);
      setMcqsList((prev) => prev.filter((q) => q.id !== id));
      showToast("Question removed from assessment bank.");
    } catch (err: any) {
      showToast(err.message || "Failed to delete question.");
    }
  };

  // Assignments state
  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    { id: "a1", name: "DSA Problem Set 1: Balanced BSTs", class: "Data Structures", date: "Sep 20, 2024", sub: "62/62", score: "79%", status: "Graded" },
    { id: "a2", name: "DBMS Schema Normalization Project", class: "Database Management", date: "Sep 25, 2024", sub: "58/60", score: "75%", status: "Grading" },
    { id: "a3", name: "Operating Systems Process Synchronization", class: "Operating Systems", date: "Sep 28, 2024", sub: "45/58", score: "—", status: "Open" },
  ]);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClass, setNewClass] = useState("Data Structures");
  const [newDueDate, setNewDueDate] = useState("Oct 05, 2024");

  // Grades state - derived from live student enrolled grades
  const [grades, setGrades] = useState<StudentGradeRow[]>([
    { name: "Rahul Sharma", a1: 88, a2: 92, mid: 85, final: "—" },
  ]);

  // Proctoring incidents state from central registry
  const [incidents, setIncidents] = useState<ProctorIncident[]>(() => getProctorIncidents());
  const [selectedIncident, setSelectedIncident] = useState<ProctorIncident | null>(null);

  // Selected student for cognitive insight preview
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; dept: string; cgpa: number; focus: string } | null>(null);

  // Profile form state
  const [profileName, setProfileName] = useState(activeUser?.name || "Prof. Kavitha Nair");
  const [profileEmail, setProfileEmail] = useState(activeUser?.email || "kavitha@aaes.edu");
  const [profileDept, setProfileDept] = useState(activeUser?.department || "Computer Science");
  const [profileHours, setProfileHours] = useState("Mon, Wed 2:00 PM – 4:00 PM");

  const teacherInitials = profileName
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TC";

  const perfData = [
    { week: "W1", avg: 68 }, { week: "W2", avg: 72 }, { week: "W3", avg: 70 },
    { week: "W4", avg: 75 }, { week: "W5", avg: 78 },
  ];

  const assignmentData = [
    { name: "DSA PS1", avg: 79 },
    { name: "DSA PS2", avg: 81 },
    { name: "DBMS PS1", avg: 75 },
    { name: "DBMS PS2", avg: 77 },
  ];

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newAssn: AssignmentItem = {
      id: "a" + (assignments.length + 1),
      name: newTitle.trim(),
      class: newClass,
      date: newDueDate,
      sub: "0/62",
      score: "—",
      status: "Open",
    };
    setAssignments((prev) => [newAssn, ...prev]);
    setShowNewAssignmentModal(false);
    setNewTitle("");
    showToast(`Assignment "${newAssn.name}" created and dispatched to class.`);
  };

  const handleUpdateGrade = (index: number, field: "a1" | "a2" | "mid", val: string) => {
    const num = parseInt(val) || 0;
    setGrades((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: Math.min(100, Math.max(0, num)) } : row))
    );
  };

  const handleSaveGrades = () => {
    showToast("Gradebook successfully updated and synced with college LMS registry.");
  };

  const handleResolveIncident = (id: string | number, resolution: string) => {
    resolveProctorIncident(id, resolution);
    setIncidents(getProctorIncidents());
    setSelectedIncident(null);
    showToast(`Incident #${id} resolved: ${resolution}`);
  };

  // Render Functions
  const renderOverview = () => {
    const teacherStats = computeTeacherRealStats(activeUser?.id || "u2", coursesList, studentGrades);
    // Real student roster quick links from studentGrades
    const activeRoster = studentGrades.slice(0, 4);

    return (
      <main className="flex-1 overflow-y-auto px-8 py-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Faculty Academic Command Center</h1>
            <p className="text-slate-500 text-xs mt-0.5">Welcome, {profileName} · Academic Year 2024–25 · Real Student Performance</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshGrades}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>↺</span> Sync Student Data
            </button>
            <button
              onClick={() => setSection("grades")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              📊 View Subject Gradebook
            </button>
          </div>
        </div>

        {/* Urgent Proctoring Malpractice Alert Banner */}
        {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white border border-rose-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-xs animate-pulse">
                🚨
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                    Urgent Proctoring Malpractice Alert
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length} Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  AI camera scanning flagged exam cheating (head movements / looking aside / missing candidate). Review incidents immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSection("proctoring")}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Inspect Incident Reports →</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Courses", value: String(teacherStats.activeCourses), icon: "📚", color: "from-indigo-500 to-indigo-600" },
            { label: "Enrolled Students", value: String(teacherStats.totalStudents), icon: "👥", color: "from-purple-500 to-purple-600" },
            { label: "Passed & Finished (≥7/10)", value: `${teacherStats.totalCompletions}`, icon: "🎓", color: "from-emerald-500 to-emerald-600" },
            { label: "Cohort Average Score", value: teacherStats.cohortAverage, icon: "📊", color: "from-blue-500 to-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} mb-3 text-white text-base shadow-xs`}>
                {s.icon}
              </div>
              <div className="text-2xl font-extrabold text-slate-800 mb-0.5">{s.value}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-800 text-sm font-bold">Class Performance Trajectory</h3>
                <p className="text-slate-400 text-xs">Weekly benchmark trend across all active course batches</p>
              </div>
              <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                Active Cohort
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[60, 85]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div
              onClick={() => setSection("grades")}
              className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 cursor-pointer hover:bg-indigo-100/70 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-indigo-800 text-xs font-bold uppercase tracking-wider">Live Gradebook</span>
                <span className="text-xs text-indigo-700">Open →</span>
              </div>
              <div className="text-3xl font-extrabold text-indigo-900 mb-0.5">
                {studentGrades.length} Records
              </div>
              <p className="text-indigo-700 text-xs">Real student scores, study status, and assessment completions.</p>
            </div>

            <div
              onClick={() => setSection("proctoring")}
              className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 cursor-pointer hover:bg-rose-100/70 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-rose-800 text-xs font-bold uppercase tracking-wider">AI Proctoring Flags</span>
                <span className="text-xs text-rose-700">Inspect →</span>
              </div>
              <div className="text-3xl font-extrabold text-rose-900 mb-0.5">
                {incidents.filter((i) => i.status.includes("Pending")).length} Flagged
              </div>
              <p className="text-rose-700 text-xs">Exams flagged by automated webcam & audio sentinel.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-slate-800 text-sm font-bold mb-1">Assignment Performance Breakdown</h3>
            <p className="text-slate-400 text-xs mb-3">Average marks scored across recent problem sets</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={assignmentData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="avg" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-800 text-sm font-bold">Class Roster Quick Links</h3>
                <span className="text-xs text-indigo-600 font-semibold cursor-pointer" onClick={() => setSection("grades")}>
                  View All in Gradebook →
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-3">Real enrolled students, subject marks, and completion status</p>
              <div className="space-y-2">
                {activeRoster.map((s) => (
                  <div
                    key={`${s.studentId}-${s.courseId}`}
                    onClick={() => {
                      setGradeFilterCourse(s.courseId);
                      setSection("grades");
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{s.name} ({s.rollNo})</div>
                        <div className="text-[10px] text-slate-400">
                          {s.courseCode} · {s.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-600 block">
                        {s.score !== undefined ? `${s.score}/10 (${s.percentage}%)` : "Studying"}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                          s.passed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : s.status === "Review Required"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.passed ? "Passed ✓" : s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const renderCourses = () => {
    const filteredResources = resourcesList.filter((r) => {
      const matchCourse =
        selectedCourseFilter === "all" ||
        coursesList.some(
          (c) =>
            (c.id === selectedCourseFilter ||
              c.code.toLowerCase() === selectedCourseFilter.toLowerCase() ||
              c.name.toLowerCase() === selectedCourseFilter.toLowerCase()) &&
            matchResourceToCourse(r, c)
        ) ||
        r.courseId === selectedCourseFilter ||
        (r.courseId && r.courseId.toLowerCase() === selectedCourseFilter.toLowerCase());

      const q = resourceSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.courseId && r.courseId.toLowerCase().includes(q));

      return matchCourse && matchSearch;
    });

    return (
      <main className="flex-1 overflow-y-auto px-8 py-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Curriculum & Study Resources</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Faculty course catalog, syllabus distribution, lecture notes, and student learning assets
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (coursesList.length > 0) {
                  setMcqCourseId(selectedMcqCourse || coursesList[0].id);
                }
                setShowAddMcqModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Upload MCQ Question
            </button>
            <button
              onClick={() => {
                if (coursesList.length > 0 && !resCourseId) {
                  setResCourseId(coursesList[0].id);
                }
                setShowAddResourceModal(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Upload Resource
            </button>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Create Course
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveCourseTab("courses")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeCourseTab === "courses"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Courses Catalog ({coursesList.length})
          </button>
          <button
            onClick={() => setActiveCourseTab("resources")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeCourseTab === "resources"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Study Resources & Materials ({resourcesList.length})
          </button>
          <button
            onClick={() => setActiveCourseTab("mcqs")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeCourseTab === "mcqs"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Assessment MCQs (Max 10 per Course) ({mcqsList.length})
          </button>
        </div>

        {activeCourseTab === "courses" ? (
          <div className="grid grid-cols-2 gap-5">
            {coursesList.map((c) => {
              const courseResources = resourcesList.filter((r) => matchResourceToCourse(r, c));
              const courseMcqs = mcqsList.filter((q) => q.courseId === c.id || q.courseId === c.code);
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {c.code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Semester {c.semester || 3}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {c.credits} Credits
                        </span>
                        <button
                          onClick={() => handleDeleteCourse(c.id, c.name)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove Course"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-1">{c.name}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                      {c.description || `${c.department || "Computer Science"} core departmental curriculum.`}
                    </p>

                    {(() => {
                      const cStats = computeCourseRealStats(c.id, studentGrades);
                      return (
                        <div className="grid grid-cols-4 gap-2 py-2.5 border-y border-slate-100 text-xs text-slate-600 mb-3 bg-slate-50/50 rounded-xl px-3">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Total Enrolled</span>
                            <span className="font-bold text-indigo-600">{cStats.enrolled} Students</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Ongoing</span>
                            <span className="font-bold text-blue-600">{cStats.ongoing} Active</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Finished (≥7/10)</span>
                            <span className="font-bold text-emerald-600">{cStats.completed} ({cStats.completionRate}%)</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Assessment MCQs</span>
                            <span className={`font-semibold ${courseMcqs.length >= 10 ? "text-emerald-600" : "text-amber-600"}`}>
                              {courseMcqs.length} / 10 Qs
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* WITHIN-COURSE STUDY RESOURCES SECTION */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>📁</span> Course Resources ({courseResources.length})
                          </span>
                          {courseResources.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setResCourseId(c.id);
                            setShowAddResourceModal(true);
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title={`Upload lecture notes or video directly to ${c.code}`}
                        >
                          <span>+</span> Upload to {c.code}
                        </button>
                      </div>

                      {courseResources.length === 0 ? (
                        <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-xl p-3 text-center">
                          <p className="text-[11px] text-slate-500 mb-1.5">
                            No study materials attached to this course yet.
                          </p>
                          <button
                            onClick={() => {
                              setResCourseId(c.id);
                              setShowAddResourceModal(true);
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            + Attach PDF / Video to {c.code}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {courseResources.map((res) => {
                            const badge =
                              res.type === "pdf"
                                ? { text: "PDF", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: "📄" }
                                : res.type === "video"
                                ? { text: "VIDEO", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: "🎥" }
                                : res.type === "notes"
                                ? { text: "NOTES", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: "📝" }
                                : { text: "LINK", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: "🔗" };

                            return (
                              <div
                                key={res.id}
                                className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/70 rounded-xl text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${badge.cls}`}>
                                    {badge.icon} {badge.text}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 truncate text-[11px]" title={res.title}>
                                      {res.title}
                                    </p>
                                    {res.description && (
                                      <p className="text-[10px] text-slate-400 truncate">{res.description}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  {res.type === "pdf" || res.type === "notes" ? (
                                    <button
                                      type="button"
                                      onClick={() => setViewingPdf(getStudyPdfForCourse(c.code || res.courseId))}
                                      className="px-2 py-0.5 text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs transition-all flex items-center gap-0.5 cursor-pointer"
                                      title="Preview verified study PDF"
                                    >
                                      <span>📄 PDF</span>
                                    </button>
                                  ) : res.url ? (
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded-lg shadow-2xs hover:bg-indigo-50 transition-all flex items-center gap-0.5"
                                      title="Open resource"
                                    >
                                      <span>Open</span>
                                      <span>↗</span>
                                    </a>
                                  ) : null}
                                  <button
                                    onClick={() => handleDeleteResource(res.id, res.title)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Delete resource"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 gap-2 flex-wrap border-t border-slate-100 mt-2">
                    <button
                      onClick={() => {
                        setStudentFilterCourse(c.id);
                        setSection("students");
                      }}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>👥</span> View Enrolled
                    </button>
                    <button
                      onClick={() => {
                        setGradeFilterCourse(c.id);
                        setSection("grades");
                      }}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>📊</span> Gradebook
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMcqCourse(c.id);
                        setActiveCourseTab("mcqs");
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>📝</span> MCQs ({courseMcqs.length}/10)
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCourseFilter(c.id);
                        setActiveCourseTab("resources");
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                    >
                      All Resources ({courseResources.length}) →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeCourseTab === "resources" ? (
          <div>
            {/* Filter & Search Bar */}
            <div className="flex items-center justify-between gap-4 mb-5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Course Filter:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                >
                  <option value="all">All Courses ({resourcesList.length} total resources)</option>
                  {coursesList.map((c) => {
                    const cResCount = resourcesList.filter((r) => matchResourceToCourse(r, c)).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} ({cResCount} {cResCount === 1 ? "resource" : "resources"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 w-52 focus:outline-hidden focus:border-indigo-500"
                />
                {resourcesList.length > 0 && (
                  <button
                    onClick={handleClearAllResources}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    title="Remove all resources from dashboard"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="text-3xl mb-2">📁</div>
                <h3 className="text-sm font-bold text-slate-700">No resources found</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4 max-w-md mx-auto">
                  {selectedCourseFilter !== "all"
                    ? `No learning materials found under ${coursesList.find((c) => c.id === selectedCourseFilter)?.name || selectedCourseFilter}. You can upload lecture notes, videos, or PDFs now.`
                    : "No resources found matching your search. Click below to add study materials."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {selectedCourseFilter !== "all" && (
                    <button
                      onClick={() => setSelectedCourseFilter("all")}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Show All Courses ({resourcesList.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (selectedCourseFilter !== "all") {
                        setResCourseId(selectedCourseFilter);
                      }
                      setShowAddResourceModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                  >
                    + Upload Resource {selectedCourseFilter !== "all" ? `to ${coursesList.find((c) => c.id === selectedCourseFilter)?.code || ""}` : ""}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredResources.map((r) => {
                  const parentCourse = coursesList.find((c) => matchResourceToCourse(r, c));
                  const typeColors = {
                    pdf: "bg-rose-50 text-rose-700 border-rose-200",
                    video: "bg-purple-50 text-purple-700 border-purple-200",
                    link: "bg-blue-50 text-blue-700 border-blue-200",
                    notes: "bg-amber-50 text-amber-700 border-amber-200",
                  };
                  const typeIcons = {
                    pdf: "📄 PDF",
                    video: "🎥 VIDEO",
                    link: "🔗 LINK",
                    notes: "📝 NOTES",
                  };

                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              typeColors[r.type] || typeColors.pdf
                            }`}
                          >
                            {typeIcons[r.type] || "DOCUMENT"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {parentCourse ? `${parentCourse.code} · ${parentCourse.name}` : r.courseId}
                            </span>
                            <button
                              onClick={() => handleDeleteResource(r.id, r.title)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Resource"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 mb-1 line-clamp-1">{r.title}</h4>
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">
                          {r.description || "Course material uploaded for student learning and exam review."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 text-[10px]">
                          By {r.uploadedBy || "Faculty"}
                        </span>
                        {r.type === "pdf" || r.type === "notes" ? (
                          <button
                            type="button"
                            onClick={() => setViewingPdf(getStudyPdfForCourse(parentCourse?.code || r.courseId))}
                            className="font-bold text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer"
                          >
                            <span>📄 View Real Study PDF</span>
                            <span>📖</span>
                          </button>
                        ) : r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`font-bold text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                              r.type === "video"
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            }`}
                          >
                            <span>{r.type === "video" ? "▶ Watch Video" : "🔗 Open Link"}</span>
                            <span>↗</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">Available in Portal</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* MCQ Assessment Question Bank Manager */}
            <div className="flex items-center justify-between gap-4 mb-5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Select Subject / Course:</span>
                <select
                  value={selectedMcqCourse}
                  onChange={(e) => setSelectedMcqCourse(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500 bg-slate-50"
                >
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                {(() => {
                  const currentCourse = coursesList.find((c) => c.id === selectedMcqCourse);
                  const currentCourseMcqs = mcqsList.filter(
                    (q) => q.courseId === selectedMcqCourse || (currentCourse && (q.courseId === currentCourse.id || q.courseId === currentCourse.code))
                  );
                  const isMaxReached = currentCourseMcqs.length >= 10;
                  return (
                    <>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                          isMaxReached
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {currentCourseMcqs.length} / 10 MCQs Uploaded {isMaxReached ? "(Max limit reached)" : ""}
                      </span>

                      <button
                        onClick={() => {
                          setMcqCourseId(selectedMcqCourse);
                          setShowAddMcqModal(true);
                        }}
                        disabled={isMaxReached}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        title={isMaxReached ? "Maximum 10 questions per course limit reached" : "Add new MCQ question"}
                      >
                        <span>+</span> Add MCQ Question
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Restore standard curriculum assessment questions for all courses?")) {
                            resetCourseMCQs();
                            fetchCourseMCQs().then(setMcqsList);
                            showToast("Restored standard assessment questions.");
                          }
                        }}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        title="Reset question bank"
                      >
                        ↺ Reset Defaults
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Assessment Rules Banner */}
            <div className="mb-4 bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-900">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📋</span>
                <div className="leading-relaxed">
                  <span className="font-bold">Faculty Assessment Policy:</span> Maximum <strong>10 Multiple Choice Questions (MCQs)</strong> per course.
                  Students can only attend the assessment <strong>after completing all study resources</strong>.
                  Average pass mark is <strong>7 / 10 (70%)</strong>. If score is below 7, the AI diagnoses weak areas and shows resources again.
                </div>
              </div>
            </div>

            {/* Questions List */}
            {(() => {
              const currentCourse = coursesList.find((c) => c.id === selectedMcqCourse);
              const currentCourseMcqs = mcqsList.filter(
                (q) => q.courseId === selectedMcqCourse || (currentCourse && (q.courseId === currentCourse.id || q.courseId === currentCourse.code))
              );

              if (currentCourseMcqs.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
                    <div className="text-4xl mb-3">📝</div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">No Questions Added for this Course</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      Faculty members can create up to 10 multiple-choice questions for students to complete their final subject assessment.
                    </p>
                    <button
                      onClick={() => {
                        setMcqCourseId(selectedMcqCourse);
                        setShowAddMcqModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      + Create First Question
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {currentCourseMcqs.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Question {idx + 1} of {currentCourseMcqs.length}</span>
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">
                            Topic: {q.topic || "Core Subject"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteMCQ(q.id, q.question)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mb-3 leading-relaxed">
                        {q.question}
                      </h4>

                      <div className="grid grid-cols-2 gap-2.5 mb-3">
                        {(q.options || []).map((opt, oIdx) => {
                          const isCorrect = q.answer === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                  : "bg-slate-50/60 border-slate-200/80 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  ✓ Correct Option
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-start gap-2">
                          <span className="text-xs">💡</span>
                          <div>
                            <span className="font-bold text-slate-700">Explanation / Rationale: </span>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </main>
    );
  };

  const renderAssignments = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Assignment Management</h1>
          <p className="text-slate-500 text-xs mt-0.5">Create, schedule, and grade course assignments</p>
        </div>
        <button
          onClick={() => setShowNewAssignmentModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          + New Assignment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3.5">Assignment Title</th>
              <th className="px-6 py-3.5">Course</th>
              <th className="px-6 py-3.5">Submission Deadline</th>
              <th className="px-6 py-3.5">Submissions</th>
              <th className="px-6 py-3.5">Cohort Average</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{a.name}</td>
                <td className="px-6 py-4 text-slate-600">{a.class}</td>
                <td className="px-6 py-4 text-slate-500">{a.date}</td>
                <td className="px-6 py-4 font-semibold text-slate-700">{a.sub}</td>
                <td className="px-6 py-4 font-bold text-indigo-600">{a.score}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      a.status === "Graded"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : a.status === "Grading"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </main>
  );

  const renderGrades = () => {
    // Filter student grades based on selected subject, status filter, and search query
    const filteredGrades = studentGrades.filter((g) => {
      const matchCourse =
        gradeFilterCourse === "all" ||
        g.courseId === gradeFilterCourse ||
        g.courseCode === gradeFilterCourse;

      const matchStatus =
        gradeStatusFilter === "all" ||
        (gradeStatusFilter === "passed" && g.passed) ||
        (gradeStatusFilter === "review" && g.status === "Review Required") ||
        (gradeStatusFilter === "ready" && g.status === "Ready for Test") ||
        (gradeStatusFilter === "studying" && g.status === "Studying");

      const matchSearch =
        !gradeSearchQuery.trim() ||
        g.name.toLowerCase().includes(gradeSearchQuery.toLowerCase()) ||
        g.rollNo.toLowerCase().includes(gradeSearchQuery.toLowerCase()) ||
        g.courseCode.toLowerCase().includes(gradeSearchQuery.toLowerCase()) ||
        g.courseName.toLowerCase().includes(gradeSearchQuery.toLowerCase());

      return matchCourse && matchStatus && matchSearch;
    });

    const activeCourseStats = computeCourseRealStats(gradeFilterCourse, studentGrades);
    const passedCount = studentGrades.filter(
      (g) => (gradeFilterCourse === "all" || g.courseId === gradeFilterCourse || g.courseCode === gradeFilterCourse) && g.passed
    ).length;
    const reviewCount = studentGrades.filter(
      (g) => (gradeFilterCourse === "all" || g.courseId === gradeFilterCourse || g.courseCode === gradeFilterCourse) && g.status === "Review Required"
    ).length;
    const readyCount = studentGrades.filter(
      (g) => (gradeFilterCourse === "all" || g.courseId === gradeFilterCourse || g.courseCode === gradeFilterCourse) && g.status === "Ready for Test"
    ).length;
    const studyingCount = studentGrades.filter(
      (g) => (gradeFilterCourse === "all" || g.courseId === gradeFilterCourse || g.courseCode === gradeFilterCourse) && g.status === "Studying"
    ).length;

    const selectedCourseObj = coursesList.find((c) => c.id === gradeFilterCourse || c.code === gradeFilterCourse);

    return (
      <main className="flex-1 overflow-y-auto px-8 py-7">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Subject Roster & Interactive Gradebook</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Real-time student attendance, resource study completion, MCQ assessment marks (Pass: 7/10), and verified certificates.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshGrades}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>↺</span> Sync Latest Test Submissions
            </button>
            <button
              onClick={() => {
                showToast("Gradebook exported to college registry cache.");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>📥</span> Export Gradebook
            </button>
          </div>
        </div>

        {/* Filter & Subject Selection Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-5 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Subject Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Filter by Subject:</span>
              <select
                value={gradeFilterCourse}
                onChange={(e) => setGradeFilterCourse(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500 bg-slate-50"
              >
                <option value="all">All Subjects ({coursesList.length} Courses)</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search student name or roll no..."
                value={gradeSearchQuery}
                onChange={(e) => setGradeSearchQuery(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 w-64 focus:outline-hidden focus:border-indigo-500"
              />
              {gradeSearchQuery && (
                <button
                  onClick={() => setGradeSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Status Filter:</span>
            {[
              { id: "all", label: `All (${studentGrades.length})` },
              { id: "passed", label: `Passed (≥7/10) (${passedCount})`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { id: "review", label: `Needs Review (<7/10) (${reviewCount})`, color: "text-amber-700 bg-amber-50 border-amber-200" },
              { id: "ready", label: `Test Ready (${readyCount})`, color: "text-blue-700 bg-blue-50 border-blue-200" },
              { id: "studying", label: `Studying (${studyingCount})`, color: "text-slate-600 bg-slate-100 border-slate-200" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGradeStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  gradeStatusFilter === tab.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : tab.color || "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Statistical Summary Ribbon for Selected Filter */}
        {/* Urgent Proctoring Malpractice Alert Banner */}
        {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white border border-rose-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-xs animate-pulse">
                🚨
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                    Urgent Proctoring Malpractice Alert
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length} Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  AI camera scanning flagged exam cheating (head movements / looking aside / missing candidate). Review incidents immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSection("proctoring")}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Inspect Incident Reports →</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Students Enrolled</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {activeCourseStats.enrolled}
            </div>
            <span className="text-[11px] text-slate-500">
              {selectedCourseObj ? `${selectedCourseObj.code} batch` : "Across all subjects"}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider">Passed & Certified</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {activeCourseStats.completed}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {activeCourseStats.completionRate}% completion rate (≥7/10)
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-amber-700 block text-[10px] uppercase font-bold tracking-wider">Needs Review / Retake</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {reviewCount}
            </div>
            <span className="text-[11px] text-amber-600">Scored &lt;7/10 — AI revising weak areas</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-indigo-700 block text-[10px] uppercase font-bold tracking-wider">Cohort Average Mark</span>
            <div className="text-2xl font-extrabold text-indigo-700 mt-1">
              {activeCourseStats.avgScore} / 10
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold">{activeCourseStats.avgPercent}% aggregate</span>
          </div>
        </div>

        {/* Scroll Helper Notice */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-bold text-slate-700">Course Assessment & Gradebook Records ({filteredGrades.length})</span>
          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <span>⇄</span> Scroll horizontally (swipe or Shift+Scroll) to view all columns
          </span>
        </div>

        {/* Gradebook Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredGrades.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="text-sm font-bold text-slate-700">No student records match the current filter</h3>
              <p className="text-xs text-slate-400 mt-1">Try selecting "All Subjects" or clearing your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1360px] text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5 min-w-[200px]">Student Name</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Roll No & Dept</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Subject / Course</th>
                    <th className="px-6 py-3.5 min-w-[170px]">Study Resources</th>
                    <th className="px-6 py-3.5 min-w-[130px]">MCQ Score</th>
                    <th className="px-6 py-3.5 min-w-[110px]">Attempts</th>
                    <th className="px-6 py-3.5 min-w-[160px]">Status</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Certificate</th>
                    <th className="px-6 py-3.5 min-w-[280px]">AI Weak Area Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredGrades.map((g) => (
                  <tr key={`${g.studentId}-${g.courseId}`} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {g.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{g.name}</div>
                          <div className="text-[11px] text-slate-400">{g.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Roll No */}
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-700 text-xs">{g.rollNo}</div>
                      <div className="text-[10px] text-slate-400">{g.department}</div>
                    </td>

                    {/* Course */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                        {g.courseCode}
                      </span>
                      <div className="text-slate-600 text-[11px] mt-0.5 font-medium line-clamp-1">{g.courseName}</div>
                    </td>

                    {/* Study Material */}
                    <td className="px-6 py-4">
                      {g.studied ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          ✓ All Studied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          ⏳ In Progress
                        </span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      {g.score !== undefined ? (
                        <div>
                          <span
                            className={`text-sm font-extrabold ${
                              g.passed ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {g.score} / 10
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1.5 font-medium">({g.percentage}%)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not Taken</span>
                      )}
                    </td>

                    {/* Attempts */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {g.attempts > 0 ? `${g.attempts} attempt${g.attempts > 1 ? "s" : ""}` : "0"}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          g.passed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : g.status === "Review Required"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : g.status === "Ready for Test"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {g.passed && "✓ "}
                        {g.status === "Review Required" && "⚠️ "}
                        {g.status}
                      </span>
                    </td>

                    {/* Certificate */}
                    <td className="px-6 py-4">
                      {g.certificateId ? (
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {g.certificateId}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>

                    {/* AI Weak Area Diagnosis */}
                    <td className="px-6 py-4">
                      {g.weakTopics && g.weakTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {g.weakTopics.map((topic) => (
                            <span
                              key={topic}
                              className="text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      ) : g.passed ? (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <span>✓</span> Mastered Core Topics
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Assessment pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </main>
    );
  };

  const renderStudents = () => {
    const targetCourseObj = coursesList.find((c) => c.id === studentFilterCourse || c.code === studentFilterCourse);

    const filteredEnrollments = studentGrades.filter((g) => {
      const matchCourse =
        studentFilterCourse === "all" ||
        g.courseId === studentFilterCourse ||
        g.courseCode === studentFilterCourse;

      const q = studentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.rollNo.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.courseName.toLowerCase().includes(q) ||
        g.courseCode.toLowerCase().includes(q);

      const matchStatus =
        studentFilterStatus === "all" ||
        (studentFilterStatus === "finished" && (g.passed || g.status === "Finished")) ||
        (studentFilterStatus === "ongoing" && (!g.passed && g.status !== "Finished")) ||
        (studentFilterStatus === "review" && (g.score !== undefined && g.score < 7)) ||
        (studentFilterStatus === "studying" && (!g.studied && g.attempts === 0));

      return matchCourse && matchSearch && matchStatus;
    });

    const currentCourseStats = computeCourseRealStats(
      studentFilterCourse === "all" ? "" : studentFilterCourse,
      studentFilterCourse === "all" ? studentGrades : studentGrades.filter((g) => g.courseId === studentFilterCourse || g.courseCode === studentFilterCourse)
    );

    const totalEnrolled = studentFilterCourse === "all" ? studentGrades.length : currentCourseStats.enrolled;
    const totalFinished = studentFilterCourse === "all" ? studentGrades.filter((g) => g.passed || g.status === "Finished").length : currentCourseStats.finished;
    const totalOngoing = totalEnrolled - totalFinished;
    const reviewNeeded = studentGrades.filter(
      (g) => (studentFilterCourse === "all" || g.courseId === studentFilterCourse || g.courseCode === studentFilterCourse) &&
             g.score !== undefined && g.score < 7
    ).length;

    return (
      <main className="flex-1 overflow-y-auto px-8 py-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Enrolled Students & Course Roster</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Live tracking of registered students: who is enrolled, ongoing with study/retest, and who finished with passing marks (≥7/10)
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshGrades}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>↺</span> Sync Live Roster
            </button>
            <button
              onClick={() => setSection("courses")}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              📚 Manage Courses
            </button>
          </div>
        </div>

        {/* Real-time Status Notice */}
        <div className="mb-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/90 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              👥
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Real-Time Institution Enrollment Directory
              </div>
              <div className="text-[11px] text-slate-500">
                Only genuine registered students appear here. When a student registers their profile and enrolls in a subject, their status updates automatically.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Reactive Sync
          </span>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-5 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Filter Course:</span>
              <select
                value={studentFilterCourse}
                onChange={(e) => setStudentFilterCourse(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500 bg-slate-50"
              >
                <option value="all">All Courses ({coursesList.length} Subjects)</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search student by name, roll no, email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 w-72 focus:outline-hidden focus:border-indigo-500"
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch("")}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Progression Status:</span>
            {[
              { id: "all", label: `All Enrolled (${totalEnrolled})` },
              { id: "ongoing", label: `Ongoing (${totalOngoing})`, color: "text-blue-700 bg-blue-50 border-blue-200" },
              { id: "finished", label: `Finished & Passed (${totalFinished})`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { id: "review", label: `Review / Retake (${reviewNeeded})`, color: "text-amber-700 bg-amber-50 border-amber-200" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStudentFilterStatus(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  studentFilterStatus === tab.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : tab.color || "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Cards */}
        {/* Urgent Proctoring Malpractice Alert Banner */}
        {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white border border-rose-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-xs animate-pulse">
                🚨
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                    Urgent Proctoring Malpractice Alert
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length} Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  AI camera scanning flagged exam cheating (head movements / looking aside / missing candidate). Review incidents immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSection("proctoring")}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Inspect Incident Reports →</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Enrolled</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalEnrolled} Students</div>
            <span className="text-[11px] text-slate-500">{targetCourseObj ? targetCourseObj.code : "Across all curriculum"}</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-blue-700 block text-[10px] uppercase font-bold tracking-wider">Ongoing Progress</span>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">{totalOngoing} Active</div>
            <span className="text-[11px] text-blue-600">Studying materials or remedial retest</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider">Finished & Certified</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{totalFinished} Passed</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Passed with ≥ 7/10 marks</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-amber-700 block text-[10px] uppercase font-bold tracking-wider">Needs Retake / Review</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{reviewNeeded}</div>
            <span className="text-[11px] text-amber-600">Scored &lt;7/10 — AI reviewing weak areas</span>
          </div>
        </div>

        {/* Scroll Helper Notice */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-bold text-slate-700">Enrolled Students Roster ({filteredEnrollments.length})</span>
          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <span>⇄</span> Scroll horizontally (swipe or Shift+Scroll) to view all columns
          </span>
        </div>

        {/* Table of Enrolled Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-sm font-bold text-slate-700">No students match current filter</h3>
              <p className="text-xs text-slate-400 mt-1">
                {studentGrades.length === 0
                  ? "No real students have enrolled in courses yet. When a registered student enrolls, they appear here instantly."
                  : "Try clearing search or changing the course filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1360px] text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5 min-w-[220px]">Student</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Roll No & Dept</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Enrolled Course</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Course Material Status</th>
                    <th className="px-6 py-3.5 min-w-[170px]">Progression Status</th>
                    <th className="px-6 py-3.5 min-w-[130px]">Latest Score</th>
                    <th className="px-6 py-3.5 min-w-[110px]">Attempts</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Certificate</th>
                    <th className="px-6 py-3.5 min-w-[280px]">AI Weak Areas / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((e) => (
                    <tr key={`${e.studentId}-${e.courseId}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {e.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{e.name}</div>
                            <div className="text-[11px] text-slate-400">{e.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-700">{e.rollNo}</div>
                        <div className="text-[10px] text-slate-400">{e.department}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                          {e.courseCode}
                        </span>
                        <div className="text-slate-700 text-xs font-semibold mt-0.5">{e.courseName}</div>
                      </td>

                      <td className="px-6 py-4">
                        {e.studied ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            ✓ Completed All Resources
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            ⏳ Studying In Progress
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {e.passed || e.status === "Finished" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
                            ✓ Finished & Certified
                          </span>
                        ) : e.score !== undefined && e.score < 7 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                            ⚠️ Ongoing (Needs Retake)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap">
                            ⏳ Ongoing (Studying)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {e.score !== undefined ? (
                          <div>
                            <span className={`text-xs font-bold ${e.passed ? "text-emerald-700" : "text-amber-700"}`}>
                              {e.score} / 10 marks
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">({e.percentage}%)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not attempted</span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">
                        {e.attempts > 0 ? `${e.attempts} attempt${e.attempts > 1 ? "s" : ""}` : "0"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {e.certificateId ? (
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {e.certificateId}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {e.weakTopics && e.weakTopics.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {e.weakTopics.map((topic) => (
                              <span key={topic} className="text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                                {topic}
                              </span>
                            ))}
                          </div>
                        ) : e.passed ? (
                          <span className="text-[11px] text-emerald-600 font-medium whitespace-nowrap">✓ Passed Exam Benchmark</span>
                        ) : (
                          <span className="text-slate-400 text-[11px] whitespace-nowrap">Preparing for exam</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    );
  };

  const renderProctoring = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6">
        <h1 className="text-slate-800 text-2xl font-bold tracking-tight">AI Proctoring Incident Review</h1>
        <p className="text-slate-500 text-xs mt-0.5">Inspect automated flags, webcam anomaly timestamps, and resolve sessions</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3.5">Student</th>
              <th className="px-6 py-3.5">Exam Session</th>
              <th className="px-6 py-3.5">Anomaly Detected</th>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Severity</th>
              <th className="px-6 py-3.5">Current Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incidents.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-3.5">
                  <div className="font-bold text-slate-800">{inc.student}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{inc.rollNo || inc.studentId}</div>
                </td>
                <td className="px-6 py-3.5 text-slate-600 font-medium">{inc.exam}</td>
                <td className="px-6 py-3.5">
                  <span className="text-slate-800 font-semibold">{inc.type}</span>
                  {inc.details && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{inc.details}</div>}
                </td>
                <td className="px-6 py-3.5 text-slate-500 font-mono text-[10px] whitespace-nowrap">{inc.timestamp}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === "Critical" || inc.severity === "High"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : inc.severity === "Medium"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      inc.status.includes("Terminated")
                        ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                        : inc.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {inc.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={() => setSelectedIncident(inc)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Review Incident →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </main>
  );

  const renderProfile = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6">
        <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Faculty Profile & Settings</h1>
        <p className="text-slate-500 text-xs mt-0.5">Manage credentials, department affiliation, and office hours</p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name</label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Institutional Email</label>
          <input
            type="email"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
          <input
            type="text"
            value={profileDept}
            onChange={(e) => setProfileDept(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Office Hours Availability</label>
          <input
            type="text"
            value={profileHours}
            onChange={(e) => setProfileHours(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => showToast("Faculty profile credentials updated successfully.")}
          className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </main>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Fixed & Non-Scrollable */}
      <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 h-screen select-none z-20">
        <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-bold font-mono">B</span>
            </div>
            <div>
              <div className="text-slate-800 text-sm font-bold tracking-tight">Adaptive LMS</div>
              <div className="text-slate-400 text-[10px]">Teacher Portal</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100/80 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
              {teacherInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-800 text-xs font-semibold truncate">{profileName}</div>
              <div className="text-slate-400 text-[10px] truncate">Faculty · {profileDept}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {[
            { label: "Overview", id: "overview", icon: "⊞" },
            { label: "Courses & Resources", id: "courses", icon: "📚" },
            { label: "Enrolled Students", id: "students", icon: "👥" },
            { label: "Grade Book", id: "grades", icon: "📊" },
            { label: "Assignments", id: "assignments", icon: "📝" },
            { label: "Proctoring Logs", id: "proctoring", icon: "🔍" },
            { label: "Faculty Profile", id: "profile", icon: "⚙️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as TeacherSection)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                section === item.id
                  ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/70"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom Actions with Modern Transparent Sign Out */}
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
            onClick={() => onNavigate("student")}
            className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>View as Student</span>
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

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Content Sections */}
      {section === "overview" && renderOverview()}
      {section === "courses" && renderCourses()}
      {section === "students" && renderStudents()}
      {section === "grades" && renderGrades()}
      {section === "assignments" && renderAssignments()}
      {section === "proctoring" && renderProctoring()}
      {section === "profile" && renderProfile()}

      {/* New Assignment Modal */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateAssignment} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Create New Assignment</h3>
            <p className="text-xs text-slate-400 mb-4">Set title, target course batch, and submission deadline.</p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Graph Cycle Detection Problem Set"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Course</label>
                <select
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Data Structures">Data Structures & Algorithms (CS301)</option>
                  <option value="Database Management">Database Management Systems (CS302)</option>
                  <option value="Operating Systems">Operating Systems (CS401)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowNewAssignmentModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Publish Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Incident Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Review Proctoring Anomaly</h3>
            <p className="text-xs text-slate-500 mb-4">
              Incident #{selectedIncident.id} · Student: {selectedIncident.student}
            </p>
            <div className="bg-slate-50 rounded-xl p-3.5 text-xs space-y-1.5 mb-6 border border-slate-200/80 font-mono">
              <div><strong>Incident ID:</strong> {selectedIncident.id}</div>
              <div><strong>Exam Session:</strong> {selectedIncident.exam}</div>
              <div><strong>Anomaly Type:</strong> <span className="text-rose-600 font-bold">{selectedIncident.type}</span></div>
              <div><strong>Timestamp:</strong> {selectedIncident.timestamp}</div>
              <div><strong>Severity:</strong> <span className="font-bold text-red-700">{selectedIncident.severity}</span></div>
              <div><strong>Current Status:</strong> <span className="font-bold text-slate-800">{selectedIncident.status}</span></div>
              {selectedIncident.details && (
                <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px] font-sans">
                  <strong>Telemetry Log:</strong> {selectedIncident.details}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleResolveIncident(selectedIncident.id, "Approved for Supervised Retake")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Clear Malpractice Flag & Authorize Retake
              </button>
              <button
                onClick={() => handleResolveIncident(selectedIncident.id, "Oral Viva Required")}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Request Oral Viva Verification
              </button>
              <button
                onClick={() => handleResolveIncident(selectedIncident.id, "Disqualification Upheld (Zero Marks)")}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirm Disqualification & 0 Marks
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                className="w-full py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Quick View Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-400">{selectedStudent.dept} · CGPA: {selectedStudent.cgpa}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 text-base cursor-pointer">
                ×
              </button>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 mb-4 text-xs text-indigo-950">
              <div className="font-bold mb-1">Cognitive Profile Insight:</div>
              <div>{selectedStudent.focus}</div>
            </div>
            <button
              onClick={() => { setSelectedStudent(null); onNavigate("cognitive"); }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Open Full Cognitive Map →
            </button>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCourse}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add New Course</h3>
                <p className="text-xs text-slate-400">Register a new accredited subject in the curriculum</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS405"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={courseDept}
                    onChange={(e) => setCourseDept(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Syllabus Overview</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of course topics and learning objectives..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCourse}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCourse ? "Saving..." : "Add Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddResource}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Attach Study Resource</h3>
                <p className="text-xs text-slate-400">Publish lecture notes, problem sets, video lectures, or reference links</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddResourceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Course *</label>
                <select
                  value={resCourseId}
                  onChange={(e) => setResCourseId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Dijkstra Shortest Path Notes"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Resource Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="pdf">📄 PDF Document</option>
                    <option value="video">🎥 Video Lecture</option>
                    <option value="notes">📝 Lecture Notes</option>
                    <option value="link">🔗 Reference Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Resource URL / Link</label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/..."
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Study Notes</label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students, chapter coverage, formulas..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddResourceModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRes}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRes ? "Publishing..." : "Publish Resource"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add MCQ Modal (Teacher Only) */}
      {showAddMcqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMCQ}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    TEACHER QUESTION BANK
                  </span>
                  <span className="text-slate-400 text-xs">Max 10 MCQs / Course</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1">Upload Assessment MCQ Question</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMcqModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Course *</label>
                <select
                  value={mcqCourseId}
                  onChange={(e) => setMcqCourseId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500 bg-slate-50"
                >
                  {coursesList.map((c) => {
                    const count = mcqsList.filter((q) => q.courseId === c.id || q.courseId === c.code).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name} ({count}/10 MCQs)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Knowledge Topic / Concept Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balanced Trees & AVL, Graph Traversals, Normalization..."
                  value={mcqTopic}
                  onChange={(e) => setMcqTopic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  AI diagnostic engine uses this topic tag to suggest study resources if the student scores &lt; 7/10.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Question Statement *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter the MCQ question clearly..."
                  value={mcqQuestion}
                  onChange={(e) => setMcqQuestion(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    placeholder="Choice A text"
                    value={mcqOptionA}
                    onChange={(e) => setMcqOptionA(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    placeholder="Choice B text"
                    value={mcqOptionB}
                    onChange={(e) => setMcqOptionB(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Option C *</label>
                  <input
                    type="text"
                    required
                    placeholder="Choice C text"
                    value={mcqOptionC}
                    onChange={(e) => setMcqOptionC(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Option D *</label>
                  <input
                    type="text"
                    required
                    placeholder="Choice D text"
                    value={mcqOptionD}
                    onChange={(e) => setMcqOptionD(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Correct Answer Choice *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 0, label: "Option A" },
                    { val: 1, label: "Option B" },
                    { val: 2, label: "Option C" },
                    { val: 3, label: "Option D" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.val}
                      onClick={() => setMcqAnswer(opt.val)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        mcqAnswer === opt.val
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ✓ {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Explanation / Pedagogical Rationale (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Why is this option correct? Concept explanation shown to student during review..."
                  value={mcqExplanation}
                  onChange={(e) => setMcqExplanation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddMcqModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingMcq}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingMcq ? "Saving Question..." : "Save MCQ Question"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Real Study PDF Viewer Modal */}
      {viewingPdf && (
        <StudyPdfViewerModal
          pdfData={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
}
