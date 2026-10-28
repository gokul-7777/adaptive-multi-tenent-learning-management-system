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
  fetchAllStudentGrades,
  computeCourseRealStats,
  getRegisteredStudents,
  saveRegisteredUser,
  getStudentEnrollments,
  onLmsDataChange,
  type StudentCourseGrade,
  type RegisteredUser,
  matchResourceToCourse,
  getProctorIncidents,
  type ProctorIncident,
} from "../services/api";
import { COURSES, type Course, RESOURCES, type Resource } from "../data";

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

type AdminSection = "overview" | "students" | "courses" | "assessments" | "proctoring" | "ai" | "reports" | "settings";

const perfData = [
  { week: "W1", avg: 68 }, { week: "W2", avg: 71 }, { week: "W3", avg: 69 },
  { week: "W4", avg: 74 }, { week: "W5", avg: 76 }, { week: "W6", avg: 73 }, { week: "W7", avg: 78 },
];

const courseData = [
  { course: "DSA (CS301)", avg: 74 },
  { course: "DBMS (CS302)", avg: 78 },
  { course: "OS (CS401)", avg: 82 },
];

const INSTITUTIONS = ["ABC Engineering College", "XYZ Institute of Technology", "Global University"];

export default function AdminDashboard({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const adminName = activeUser?.name || "Dr. Rajesh Kumar";
  const adminRole = activeUser?.role === "admin" ? "Super Administrator" : "Administrator";
  const adminInitials = adminName
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";
  const [section, setSection] = useState<AdminSection>("overview");
  const [institution, setInstitution] = useState(INSTITUTIONS[0]);

  // Global toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Student grades state
  const [studentGrades, setStudentGrades] = useState<StudentCourseGrade[]>([]);

  // Students state & search - Using actual registered profiles only
  const [studentSearch, setStudentSearch] = useState("");
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredUser[]>(() => getRegisteredStudents());
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentDept, setNewStudentDept] = useState("Computer Science");
  const [newStudentId, setNewStudentId] = useState("");

  // Course Roster Modal for Admin
  const [rosterCourse, setRosterCourse] = useState<Course | null>(null);

  // Additional Admin UI state
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [gradingPolicy, setGradingPolicy] = useState("Relative Grading (Bell Curve)");
  const [proctoringStrictness, setProctoringStrictness] = useState("Strict (Audio + Face + Lockdown)");
  const [allowRetakes, setAllowRetakes] = useState(true);

  const filteredStudents = registeredStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.rollNo || s.userId).toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentId.trim()) {
      showToast("Please provide Student Name and Roll Number.");
      return;
    }
    const newUser: RegisteredUser = {
      id: `u_${Date.now()}`,
      userId: newStudentId.trim(),
      rollNo: newStudentId.trim().toUpperCase(),
      name: newStudentName.trim(),
      email: `${newStudentId.trim().toLowerCase()}@academic.edu`,
      password: "student123",
      role: "student",
      department: newStudentDept,
      createdAt: new Date().toISOString(),
    };
    saveRegisteredUser(newUser);
    setRegisteredStudents(getRegisteredStudents());
    setShowAddStudentModal(false);
    setNewStudentName("");
    setNewStudentId("");
    showToast(`Student "${newUser.name}" registered in institution records!`);
  };

  // Courses & Resources state
  const [coursesList, setCoursesList] = useState<Course[]>(COURSES);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [activeCourseTab, setActiveCourseTab] = useState<"courses" | "resources">("courses");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [resourceSearch, setResourceSearch] = useState<string>("");

  // Course Modal state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseInstructor, setNewCourseInstructor] = useState("Prof. Kavitha Nair");
  const [newCourseCredits, setNewCourseCredits] = useState(4);
  const [newCourseDept, setNewCourseDept] = useState("Computer Science");
  const [newCourseSemester, setNewCourseSemester] = useState(3);
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Resource Modal state
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [resCourseId, setResCourseId] = useState("c1");
  const [resTitle, setResTitle] = useState("");
  const [resType, setResType] = useState<"pdf" | "video" | "link" | "notes">("pdf");
  const [resUrl, setResUrl] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [incidents, setIncidents] = useState<ProctorIncident[]>(() => getProctorIncidents());

  useEffect(() => {
    let isMounted = true;
    const syncData = () => {
      fetchCourses().then((res) => {
        if (isMounted && Array.isArray(res)) setCoursesList(res);
      });
      fetchResources().then((res) => {
        if (isMounted && Array.isArray(res)) setResourcesList(res);
      });
      fetchAllStudentGrades().then((res) => {
        if (isMounted && res) setStudentGrades(res);
      });
      if (isMounted) {
        setRegisteredStudents(getRegisteredStudents());
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

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseName.trim()) {
      showToast("Please provide both Course Code and Course Title.");
      return;
    }
    setIsSubmittingCourse(true);
    try {
      const resp = await createCourse({
        code: newCourseCode.trim().toUpperCase(),
        name: newCourseName.trim(),
        credits: Number(newCourseCredits) || 3,
        department: newCourseDept.trim() || "Computer Science",
        semester: Number(newCourseSemester) || 3,
        instructor: newCourseInstructor.trim() || "Faculty",
        facultyId: "u2",
        description: newCourseDesc.trim(),
      });
      const created = resp.course || {
        id: "c" + Date.now(),
        code: newCourseCode.trim().toUpperCase(),
        name: newCourseName.trim(),
        credits: Number(newCourseCredits) || 3,
        department: newCourseDept.trim() || "Computer Science",
        semester: Number(newCourseSemester) || 3,
        instructor: newCourseInstructor.trim() || "Faculty",
        facultyId: "u2",
        enrolled: 45,
        description: newCourseDesc.trim(),
      };
      setCoursesList((prev) => [created, ...prev]);
      setShowAddCourseModal(false);
      setNewCourseCode("");
      setNewCourseName("");
      setNewCourseDesc("");
      showToast(`Course "${created.name}" registered and opened for enrollment!`);
    } catch (err: any) {
      showToast(err.message || "Failed to register course.");
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete course "${name}" and all associated study materials?`)) {
      return;
    }
    try {
      await deleteCourse(id);
      setCoursesList((prev) => prev.filter((c) => c.id !== id && c.code !== id));
      setResourcesList((prev) => prev.filter((r) => r.courseId !== id));
      showToast(`Course "${name}" deleted from institutional curriculum.`);
    } catch (err: any) {
      showToast(err.message || "Failed to delete course.");
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
        uploadedBy: adminName,
      });
      const created = resp.resource;
      setResourcesList((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setShowAddResourceModal(false);
      setResTitle("");
      setResUrl("");
      setResDesc("");
      setActiveCourseTab("resources");
      setSelectedCourseFilter(targetCourse);
      showToast(`Resource "${created.title}" published to catalog!`);
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
      showToast(`Resource "${title}" removed.`);
    } catch (err: any) {
      showToast(err.message || "Failed to delete resource.");
    }
  };

  const handleClearAllResources = async () => {
    if (!window.confirm("Are you sure you want to remove ALL resources from the dashboard?")) {
      return;
    }
    await clearAllResources();
    setResourcesList([]);
    showToast("All study resources removed from catalog.");
  };

  const handleSaveSettings = () => {
    showToast("Institution academic parameters saved and propagated across campus tenants.");
  };

  // Section Renders
  const renderOverview = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Institution Central Analytics</h1>
          <p className="text-slate-500 text-xs mt-0.5">Academic Operations Dashboard · Super Administrator View</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <span className="text-slate-400 text-xs">🏛️</span>
            <select
              value={institution}
              onChange={(e) => {
                setInstitution(e.target.value);
                showToast(`Switched active tenant to ${e.target.value}`);
              }}
              className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              {INSTITUTIONS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">Multi-Tenant</span>
          </div>
          <button
            onClick={() => onNavigate("overview")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer"
          >
            System Architecture →
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
                  Central Campus Malpractice Warning
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length} Disqualified Candidate(s)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                AI camera proctoring detected suspicious activity during examination (headshake / gaze deviation / candidate missing). Inspect proctoring logs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSection("proctoring")}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Inspect Proctoring Audits →</span>
          </button>
        </div>
      )}

      {(() => {
        const uniqueStudentCount = registeredStudents.length;
        const totalCompletedCount = studentGrades.filter((g) => g.passed || g.status === "Finished").length;
        const totalOngoingCount = studentGrades.length - totalCompletedCount;
        const withScores = studentGrades.filter((g) => g.score !== undefined);
        const avgScorePercent = withScores.length > 0
          ? Math.round((withScores.reduce((sum, g) => sum + (g.score || 0), 0) / withScores.length) * 10) + "%"
          : "0.0%";

        return (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Registered Students", value: String(uniqueStudentCount), icon: "👥", color: "from-indigo-500 to-indigo-600" },
              { label: "Active Courses", value: String(coursesList.length), icon: "📚", color: "from-purple-500 to-purple-600" },
              { label: "Course Completions", value: `${totalCompletedCount} Finished`, icon: "🎓", color: "from-emerald-500 to-emerald-600" },
              { label: "Ongoing Enrollments", value: `${totalOngoingCount} Active`, icon: "⏳", color: "from-blue-500 to-blue-600" },
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
        );
      })()}

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-800 text-sm font-bold">Institution Performance Trend</h3>
              <p className="text-slate-400 text-xs">Weighted GPA average across 7 academic weeks</p>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Optimal Trajectory
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={perfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[55, 90]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 flex flex-col justify-between">
          <div
            onClick={() => setShowAiModal(true)}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-md cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">AI Early-Warning System</h3>
            </div>
            <p className="text-xs text-white/90 leading-relaxed mb-3">
              Identified 14 students with declining engagement patterns in numerical concepts. Click to inspect AI recommendations.
            </p>
            <span className="text-xs font-bold text-indigo-200 underline">View AI Cohort Interventions →</span>
          </div>

          <div
            onClick={() => setSection("students")}
            className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Directory Management</span>
              <span>Open →</span>
            </div>
            <p className="text-xs text-slate-500">Manage student records, batch allocations, and course schedules.</p>
          </div>
        </div>
      </div>
    </main>
  );

  const renderStudents = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Student Directory & Academic Records</h1>
          <p className="text-slate-500 text-xs mt-0.5">Active directory across all branches and academic batches</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs w-64 focus:outline-hidden focus:border-indigo-500"
          />
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            + Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3.5">Roll No</th>
              <th className="px-6 py-3.5">Student Name</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Enrolled Subjects</th>
              <th className="px-6 py-3.5">Academic Progress</th>
              <th className="px-6 py-3.5">Account Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                  No registered students found matching search.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => {
                const sRoll = s.rollNo || s.userId;
                const studentEnrs = getStudentEnrollments(sRoll);
                const passedCount = studentEnrs.filter((e) => e.passed).length;
                const ongoingCount = studentEnrs.length - passedCount;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{sRoll}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.department || "Computer Science"}</td>
                    <td className="px-6 py-4">
                      {studentEnrs.length > 0 ? (
                        <div>
                          <span className="font-bold text-indigo-700">{studentEnrs.length} Subjects</span>
                          <div className="text-[10px] text-slate-400">
                            {passedCount} Finished · {ongoingCount} Ongoing
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No enrollments yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {passedCount > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ✓ {passedCount} Completed
                        </span>
                      ) : studentEnrs.length > 0 ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          ⏳ Ongoing
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          Registered
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Profile
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </main>
  );

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
            <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Curriculum & Course Catalog</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Super-Administrator curriculum governance, syllabus management, course registers, and study resources
            </p>
          </div>
          <div className="flex items-center gap-2.5">
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
              <span>+</span> Register Course
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
        </div>

        {activeCourseTab === "courses" ? (
          <div className="grid grid-cols-2 gap-4">
            {coursesList.map((c) => {
              const courseResources = resourcesList.filter((r) => matchResourceToCourse(r, c));
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
                        <h3 className="text-sm font-bold text-slate-800">{c.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
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

                    <p className="text-xs text-slate-500 mb-3">
                      Lead Faculty: <span className="font-semibold text-slate-700">{c.instructor || "Faculty"}</span> · {c.department || "Computer Science"} · Semester {c.semester || 3}
                    </p>

                    {(() => {
                      const cStats = computeCourseRealStats(c.id, studentGrades);
                      return (
                        <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 text-xs text-slate-600 mb-3 bg-slate-50/50 rounded-xl px-3">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Total Enrolled</span>
                            <span className="font-bold text-indigo-700">{cStats.enrolled} Students</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Ongoing</span>
                            <span className="font-bold text-blue-600">{cStats.ongoing} Active</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Finished (≥7/10)</span>
                            <span className="font-bold text-emerald-600">{cStats.completed} Passed</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Pass Rate</span>
                            <span className="font-bold text-purple-600">{cStats.completionRate}%</span>
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
                                  {res.url ? (
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
                      onClick={() => setRosterCourse(c)}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>👥</span> View Enrolled ({computeCourseRealStats(c.id, studentGrades).enrolled})
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
        ) : (
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
                    title="Remove all resources from catalog"
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
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`font-bold text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                              r.type === "pdf"
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : r.type === "video"
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            }`}
                          >
                            <span>{r.type === "pdf" ? "📄 Open PDF" : r.type === "video" ? "▶ Watch Video" : "🔗 Open Link"}</span>
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
        )}
      </main>
    );
  };

  const renderReports = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6">
        <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Institutional Reports & Audits</h1>
        <p className="text-slate-500 text-xs mt-0.5">Export verified academic records, NAAC compliance reports, and audit logs</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { title: "Semester Comprehensive GPA Audit", desc: "Official grade distribution report for Semester 5 batches.", date: "Aug 2024" },
          { title: "Proctoring Integrity Compliance Log", desc: "Full log of all flag events, biometric checks, and instructor overrides.", date: "Aug 2024" },
          { title: "Curriculum Adaptation Index", desc: "Analysis of how students progress through personalized AI learning modules.", date: "Aug 2024" },
          { title: "Faculty Load & Attendance Audit", desc: "Teacher lecture hours, proctoring hours, and grading turnarounds.", date: "Aug 2024" },
        ].map((r, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">PDF / CSV</span>
                <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveReport(r.title)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Inspect Report Preview →
              </button>
              <button
                onClick={() => showToast(`Report "${r.title}" generated and exported.`)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  const renderSettings = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6">
        <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Campus & Multi-Tenant Governance</h1>
        <p className="text-slate-500 text-xs mt-0.5">Configure institutional policy, proctoring parameters, and grading standards</p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Grading & Normalization Policy</label>
          <select
            value={gradingPolicy}
            onChange={(e) => setGradingPolicy(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
          >
            <option>Relative Grading (Bell Curve)</option>
            <option>Absolute Standard Scale (90-80-70)</option>
            <option>Custom Weighted Competency Model</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">AI Automated Proctoring Strictness</label>
          <select
            value={proctoringStrictness}
            onChange={(e) => setProctoringStrictness(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
          >
            <option>Strict (Audio + Face + Lockdown)</option>
            <option>Standard (Webcam Periodic Checks)</option>
            <option>Honor Code Mode (Lockdown Browser Only)</option>
          </select>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowRetakes}
              onChange={(e) => setAllowRetakes(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">
              Allow adaptive remedial practice exam retakes for at-risk candidates
            </span>
          </label>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Save & Publish Policy
        </button>
      </div>
    </main>
  );

  const renderProctoring = () => (
    <main className="flex-1 overflow-y-auto px-8 py-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-2xl font-bold tracking-tight">AI Proctoring Malpractice Audits</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Centralized security audit log of automated camera scans, head movements, and exam disqualifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {incidents.filter((i) => i.status.includes("Terminated")).length} Disqualified Session(s)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Incident ID</th>
                <th className="px-6 py-3.5">Candidate Details</th>
                <th className="px-6 py-3.5">Course Exam</th>
                <th className="px-6 py-3.5">Detected Cheating / Anomaly</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Sanction / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                    No proctoring violations recorded in database.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 text-[11px]">{inc.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{inc.student}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inc.rollNo || inc.studentId}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{inc.exam}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-rose-700">{inc.type}</div>
                      {inc.details && <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs">{inc.details}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">{inc.timestamp}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === "Critical" || inc.severity === "High"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          inc.status.includes("Terminated")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : inc.status === "Resolved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              <div className="text-slate-400 text-[10px]">Admin Dashboard</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100/80 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
              {adminInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-800 text-xs font-semibold truncate">{adminName}</div>
              <div className="text-slate-400 text-[10px] truncate">{adminRole}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {[
            { label: "Overview", id: "overview", icon: "⊞" },
            { label: "Students", id: "students", icon: "👥" },
            { label: "Courses", id: "courses", icon: "📚" },
            {
              label: "Proctoring Audits",
              id: "proctoring",
              icon: "🛡️",
              badge: incidents.filter((i) => i.status.includes("Terminated") || i.status.includes("Under Review")).length,
            },
            { label: "Reports & Audits", id: "reports", icon: "📊" },
            { label: "Settings", id: "settings", icon: "⚙️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as AdminSection)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                section === item.id
                  ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/70"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Bottom Actions with Modern Transparent Sign Out Button */}
        <div className="p-3.5 border-t border-slate-100/90 flex-shrink-0 space-y-2 bg-slate-50/40">
          <button
            onClick={() => onNavigate("student")}
            className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              <span>Switch to Student View</span>
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

      {/* Main Section Routing */}
      {section === "overview" && renderOverview()}
      {section === "students" && renderStudents()}
      {section === "courses" && renderCourses()}
      {section === "proctoring" && renderProctoring()}
      {section === "reports" && renderReports()}
      {section === "settings" && renderSettings()}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Enroll New Student</h3>
            <p className="text-xs text-slate-400 mb-4">Register candidate credentials and assign department.</p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Pooja Sharma"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Roll Number / Student ID</label>
                <input
                  type="text"
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="e.g. CS2022007"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={newStudentDept}
                  onChange={(e) => setNewStudentDept(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="Maths">Applied Mathematics</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Enroll Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddCourse} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Register New Course</h3>
                <p className="text-xs text-slate-400">Add curriculum course to institutional registry.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CS405"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourseCredits}
                    onChange={(e) => setNewCourseCredits(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Distributed Cloud Computing"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={newCourseDept}
                    onChange={(e) => setNewCourseDept(e.target.value)}
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
                    value={newCourseSemester}
                    onChange={(e) => setNewCourseSemester(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Lead Instructor</label>
                <input
                  type="text"
                  value={newCourseInstructor}
                  onChange={(e) => setNewCourseInstructor(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Syllabus</label>
                <textarea
                  rows={2}
                  placeholder="Course topics, modules, and goals..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
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
                {isSubmittingCourse ? "Saving..." : "Register Course"}
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
                <h3 className="text-lg font-bold text-slate-800">Attach Course Resource</h3>
                <p className="text-xs text-slate-400">Publish study assets directly to institutional catalog</p>
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
                  placeholder="e.g. End-Semester Question Bank & Solutions"
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
                    placeholder="https://..."
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Instructions or scope of the material..."
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
                {isSubmittingRes ? "Saving..." : "Publish Resource"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Interventions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="text-lg font-bold text-slate-800">AI Early-Warning Interventions</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 text-base cursor-pointer">
                ×
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              The AMLE Predictive Cognition Engine identified a performance divergence pattern in 14 candidates. Automated pedagogical scaffolding has been provisioned.
            </p>
            <div className="space-y-2 mb-6">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Recommended Action 1:</strong> Trigger targeted 15-minute remedial concept checks on Recurrence Relations.
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                <strong>Recommended Action 2:</strong> Schedule peer-mentoring pairing with high-performing students.
              </div>
            </div>
            <button
              onClick={() => {
                setShowAiModal(false);
                showToast("Automated AI intervention tasks scheduled across targeted cohorts.");
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Approve Automated Scaffolding Plan
            </button>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800">{activeReport}</h3>
              <button onClick={() => setActiveReport(null)} className="text-slate-400 hover:text-slate-600 text-base cursor-pointer">
                ×
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Verified by AMLE Multi-Tenant Academic Engine. Hash: SHA256-9b841a
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono space-y-1.5 border border-slate-200 mb-4">
              <div>Institution: {institution}</div>
              <div>Period: Academic Year 2024–25 (Sem 5)</div>
              <div>Audit Status: 100% Data Integrity Guaranteed</div>
              <div>Proctored Exams Included: 8</div>
              <div>Average Attendance Compliance: 88.4%</div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  showToast(`Downloaded: ${activeReport}`);
                  setActiveReport(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Download CSV / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Enrolled Students Roster Modal */}
      {rosterCourse && (() => {
        const cEnrollments = studentGrades.filter(
          (g) => g.courseId === rosterCourse.id || g.courseCode === rosterCourse.code
        );
        const cStats = computeCourseRealStats(rosterCourse.id, studentGrades);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                      {rosterCourse.code}
                    </span>
                    <span className="text-xs text-slate-400">Department: {rosterCourse.department || "Computer Science"}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{rosterCourse.name} — Enrolled Student Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Faculty Instructor: {rosterCourse.instructor || "Faculty"} · Active Curriculum Enrollment Records
                  </p>
                </div>
                <button
                  onClick={() => setRosterCourse(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Enrolled</span>
                  <span className="text-lg font-extrabold text-indigo-700">{cStats.enrolled} Students</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase block">Ongoing</span>
                  <span className="text-lg font-extrabold text-blue-700">{cStats.ongoing} Active</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Finished (≥7/10)</span>
                  <span className="text-lg font-extrabold text-emerald-700">{cStats.completed} Passed</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200">
                  <span className="text-[10px] text-purple-700 font-bold uppercase block">Completion Rate</span>
                  <span className="text-lg font-extrabold text-purple-700">{cStats.completionRate}%</span>
                </div>
              </div>

              {/* Roster Table */}
              {cEnrollments.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                  <div className="text-3xl mb-2">👥</div>
                  <h4 className="text-sm font-bold text-slate-700">No students enrolled yet</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    When registered students enroll in {rosterCourse.code} via the Student Portal, their profile, study progress, and assessment marks will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[1100px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Roll No</th>
                        <th className="px-5 py-3">Study Status</th>
                        <th className="px-5 py-3">Course Status</th>
                        <th className="px-5 py-3">Score</th>
                        <th className="px-5 py-3">Attempts</th>
                        <th className="px-5 py-3">Certificate</th>
                        <th className="px-5 py-3">AI Weak Areas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cEnrollments.map((e) => (
                        <tr key={e.studentId} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-800">{e.name}</div>
                            <div className="text-[10px] text-slate-400">{e.email}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-700">{e.rollNo}</td>
                          <td className="px-5 py-3.5">
                            {e.studied ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                ✓ Materials Studied
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                ⏳ In Progress
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {e.passed || e.status === "Finished" ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                ✓ Finished
                              </span>
                            ) : e.score !== undefined && e.score < 7 ? (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                ⚠️ Ongoing (Retake)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                ⏳ Ongoing
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-800">
                            {e.score !== undefined ? `${e.score} / 10 (${e.percentage}%)` : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">{e.attempts || 0}</td>
                          <td className="px-5 py-3.5">
                            {e.certificateId ? (
                              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {e.certificateId}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {e.weakTopics && e.weakTopics.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {e.weakTopics.map((t) => (
                                  <span key={t} className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            ) : e.passed ? (
                              <span className="text-[10px] text-emerald-600 font-semibold">✓ None</span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setRosterCourse(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
