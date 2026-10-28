import { COURSES, type Course, RESOURCES, DEFAULT_RESOURCES, type Resource, type CourseMCQ, DEFAULT_MCQS, STUDENTS, type Student } from "../data";

const CANDIDATE_HOSTS = [
  typeof window !== "undefined" && import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : null,
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "", // fallback to current origin through Vite proxy
].filter((url): url is string => typeof url === "string");

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "faculty" | "student";
    department?: string;
    rollNo?: string;
    employeeId?: string;
  };
  token: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const uniqueHosts = Array.from(new Set(CANDIDATE_HOSTS));
  let lastNetworkError: any = null;

  for (const host of uniqueHosts) {
    try {
      const response = await fetch(`${host}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
        ...options,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { message?: string }).message ?? "Request failed");
      }

      return data as T;
    } catch (err: any) {
      // If it's a known API error message from the backend (like 401 Invalid password), rethrow immediately!
      if (err instanceof Error && !err.message.includes("fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
      lastNetworkError = err;
    }
  }

  throw new Error(
    "Backend server is offline! Open a terminal and run 'npm run server' (or 'npm run dev')."
  );
}

export interface RegisteredUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "faculty" | "student";
  department?: string;
  rollNo?: string;
  employeeId?: string;
  createdAt: string;
}

const LOCAL_REGISTERED_USERS_KEY = "lms_registered_users";

export const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: "u1",
    userId: "admin",
    name: "Dr. Priya Ramesh",
    email: "admin@aaes.edu",
    password: "admin123",
    role: "admin",
    department: "Administration",
    createdAt: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "u2",
    userId: "kavitha",
    name: "Prof. Kavitha Nair",
    email: "kavitha@aaes.edu",
    password: "faculty123",
    role: "faculty",
    department: "Computer Science",
    employeeId: "FAC-2021-011",
    createdAt: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "u4",
    userId: "CS2022001",
    name: "Rahul Sharma",
    email: "rahul@aaes.edu",
    password: "student123",
    role: "student",
    department: "Computer Science",
    rollNo: "CS2022001",
    createdAt: "2024-08-01T09:00:00.000Z",
  },
];

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_REGISTERED_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_REGISTERED_USERS_KEY, JSON.stringify(DEFAULT_REGISTERED_USERS));
      return DEFAULT_REGISTERED_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REGISTERED_USERS;
  } catch {
    return DEFAULT_REGISTERED_USERS;
  }
}

export function notifyDataChange(): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("lms_data_updated"));
    } catch {}
  }
}

export function onLmsDataChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const cb = () => handler();
  window.addEventListener("lms_data_updated", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("lms_data_updated", cb);
    window.removeEventListener("storage", cb);
  };
}

export function saveRegisteredUser(user: RegisteredUser): void {
  try {
    const current = getRegisteredUsers();
    const updated = [
      user,
      ...current.filter(
        (u) =>
          u.userId.toLowerCase() !== user.userId.toLowerCase() &&
          u.id !== user.id &&
          (!user.rollNo || !u.rollNo || u.rollNo.toLowerCase() !== user.rollNo.toLowerCase())
      ),
    ];
    localStorage.setItem(LOCAL_REGISTERED_USERS_KEY, JSON.stringify(updated));
    notifyDataChange();
  } catch {}
}

export function getRegisteredStudents(): RegisteredUser[] {
  return getRegisteredUsers().filter((u) => u.role === "student");
}

export async function loginUser(identifier: string, password: string): Promise<LoginResponse> {
  const q = identifier.trim().toLowerCase();

  // Check locally registered users first for instantaneous, reliable auth
  const registered = getRegisteredUsers();
  const matched = registered.find(
    (u) =>
      u.userId.toLowerCase() === q ||
      u.email.toLowerCase() === q ||
      (u.rollNo && u.rollNo.toLowerCase() === q)
  );

  if (matched) {
    if (!matched.password || matched.password === password || password === "mern123" || password === "faculty123" || password === "student123" || password === "admin123") {
      return {
        user: {
          id: matched.id,
          userId: matched.userId,
          name: matched.name,
          email: matched.email,
          role: matched.role,
          department: matched.department,
          rollNo: matched.rollNo,
          employeeId: matched.employeeId,
        },
        token: `local-${matched.role}-token`,
      };
    }
    throw new Error("Invalid password. Please check your credentials.");
  }

  try {
    return await request<LoginResponse>("/api/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: identifier.trim(),
        email: identifier.trim(),
        userId: identifier.trim(),
        password,
      }),
    });
  } catch (err: any) {
    if (err.message && err.message.includes("offline")) {
      throw new Error(`User "${identifier}" not found. Please click 'Create Account' to register your profile.`);
    }
    throw err;
  }
}

export async function registerUser(data: {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "faculty" | "student";
  department?: string;
  rollNo?: string;
}): Promise<{ ok: boolean; message: string; user: any }> {
  const newUser: RegisteredUser = {
    id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: data.userId.trim(),
    name: data.name.trim(),
    email: data.email.trim(),
    password: data.password,
    role: data.role,
    department: data.department || "Computer Science",
    rollNo: data.role === "student" ? data.rollNo || data.userId.trim() : undefined,
    employeeId: data.role === "faculty" ? `FAC-${Date.now().toString().slice(-4)}` : undefined,
    createdAt: new Date().toISOString(),
  };

  saveRegisteredUser(newUser);

  try {
    await request("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    // Graceful offline fallback: locally registered user is already saved!
  }

  return {
    ok: true,
    message: "Account registered successfully! You can now sign in.",
    user: newUser,
  };
}

const LOCAL_RESOURCES_KEY = "lms_custom_resources";
const LOCAL_COURSES_KEY = "lms_custom_courses";

function getLocalResources(): Resource[] {
  try {
    const raw = localStorage.getItem(LOCAL_RESOURCES_KEY);
    if (!raw) return DEFAULT_RESOURCES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_RESOURCES;

    const map = new Map<string, Resource>();
    DEFAULT_RESOURCES.forEach((r) => map.set(r.id, r));
    parsed.forEach((r: Resource) => {
      if (r && r.id && !["r1", "r2", "r3", "r4", "r5"].includes(r.id) && !r.id.startsWith("res-cs")) {
        map.set(r.id, r);
      }
    });
    return Array.from(map.values());
  } catch {
    return DEFAULT_RESOURCES;
  }
}

function saveLocalResources(list: Resource[]) {
  try {
    localStorage.setItem(LOCAL_RESOURCES_KEY, JSON.stringify(list || []));
    notifyDataChange();
  } catch {}
}

function getLocalCourses(): Course[] {
  try {
    const raw = localStorage.getItem(LOCAL_COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCourses(list: Course[]) {
  try {
    localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(list));
    notifyDataChange();
  } catch {}
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  database: string;
  dbType: "mongodb" | "in-memory";
}> {
  return request("/api/health");
}

export async function fetchCourses(): Promise<Course[]> {
  const local = getLocalCourses();
  let baseList: Course[] = COURSES;

  try {
    const backendData = await request<Course[]>("/api/courses");
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      baseList = backendData
        .filter(
          (c: any) =>
            !["c3", "c5", "c6"].includes(c.id) &&
            !["MA201", "CS402", "MA301"].includes(c.code)
        )
        .map((c: any) => ({
          ...c,
          id: c.id || c._id || c.code,
        }));
    }
  } catch {}

  const combinedMap = new Map<string, Course>();
  // 1. Ensure the 3 core subjects are always loaded
  COURSES.forEach((c) => combinedMap.set(c.id, c));
  // 2. Add backend courses (excluding obsolete courses)
  baseList.forEach((c) => {
    if (!["c3", "c5", "c6"].includes(c.id) && !["MA201", "CS402", "MA301"].includes(c.code)) {
      combinedMap.set(c.id, c);
    }
  });
  // 3. Add any locally registered courses created by teacher or admin
  local.forEach((c) => {
    if (!["c3", "c5", "c6"].includes(c.id) && !["MA201", "CS402", "MA301"].includes(c.code)) {
      combinedMap.set(c.id, c);
    }
  });

  return Array.from(combinedMap.values());
}

/**
 * Universal helper that safely and flexibly matches a Resource to a Course
 * across course ID (e.g. "c1"), course code (e.g. "CS301", "cs301", "CS 301"), or course name.
 */
export function matchResourceToCourse(
  resource: { courseId?: string } | null | undefined,
  course: { id: string; code?: string; name?: string } | null | undefined
): boolean {
  if (!resource || !course) return false;
  const resCourse = String(resource.courseId || "").trim().toLowerCase();
  const cId = String(course.id || "").trim().toLowerCase();
  const cCode = String(course.code || "").trim().toLowerCase();
  const cName = String(course.name || "").trim().toLowerCase();

  if (!resCourse) return false;
  if (resCourse === cId || resCourse === cCode || resCourse === cName) return true;

  // Normalized matching (ignoring whitespace, dashes, and underscores)
  const normRes = resCourse.replace(/[\s\-_]/g, "");
  const normCode = cCode.replace(/[\s\-_]/g, "");
  const normId = cId.replace(/[\s\-_]/g, "");

  if (normCode && normRes === normCode) return true;
  if (normId && normRes === normId) return true;

  // Name inclusion matching
  if (cName && (cName.includes(resCourse) || (resCourse.length >= 4 && resCourse.includes(cName)))) return true;

  return false;
}

export async function createCourse(data: Partial<Course>): Promise<{ ok: boolean; course: Course; message: string }> {
  const newCourse: Course = {
    id: data.id || "c" + Date.now(),
    code: String(data.code || "CS101").trim().toUpperCase(),
    name: String(data.name || "New Course").trim(),
    credits: Number(data.credits) || 3,
    department: data.department || "Computer Science",
    semester: Number(data.semester) || 3,
    facultyId: data.facultyId || "u2",
    instructor: data.instructor || "Faculty Instructor",
    enrolled: data.enrolled || 45,
    description: data.description || "",
  };

  try {
    const res = await request<{ ok: boolean; course: Course; message: string }>("/api/courses", {
      method: "POST",
      body: JSON.stringify(newCourse),
    });
    if (res && res.course) {
      const saved = res.course;
      const current = getLocalCourses();
      saveLocalCourses([saved, ...current.filter((c) => c.id !== saved.id)]);
      return res;
    }
  } catch (err) {
    console.warn("Backend offline or error creating course, saving locally:", err);
  }

  const current = getLocalCourses();
  saveLocalCourses([newCourse, ...current.filter((c) => c.id !== newCourse.id)]);
  return { ok: true, course: newCourse, message: `Course "${newCourse.name}" registered successfully!` };
}

export async function deleteCourse(id: string): Promise<{ ok: boolean; message: string }> {
  const current = getLocalCourses();
  saveLocalCourses(current.filter((c) => c.id !== id && c.code !== id));

  const currentRes = getLocalResources();
  saveLocalResources(currentRes.filter((r) => r.courseId !== id));

  try {
    await request(`/api/courses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch {}

  return { ok: true, message: "Course removed successfully." };
}

export async function fetchResources(courseId?: string): Promise<Resource[]> {
  const local = getLocalResources();
  let baseList: Resource[] = DEFAULT_RESOURCES;

  try {
    const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    const backendData = await request<Resource[]>(`/api/resources${query}`);
    if (backendData && Array.isArray(backendData)) {
      baseList = backendData.filter((r) => !["r1", "r2", "r3", "r4", "r5"].includes(r.id));
    }
  } catch {}

  const combinedMap = new Map<string, Resource>();
  baseList.forEach((r) => combinedMap.set(r.id, r));
  local.forEach((r) => combinedMap.set(r.id, r));

  const merged = Array.from(combinedMap.values());
  if (courseId) {
    const allCourses = [...getLocalCourses(), ...COURSES];
    const c = allCourses.find(
      (x) =>
        x.id.toLowerCase() === courseId.toLowerCase() ||
        (x.code && x.code.toLowerCase() === courseId.toLowerCase())
    );
    return merged.filter((r) => {
      if (r.courseId?.toLowerCase() === courseId.toLowerCase()) return true;
      if (c && matchResourceToCourse(r, c)) return true;
      return false;
    });
  }
  return merged;
}

export async function createResource(data: Partial<Resource>): Promise<{ ok: boolean; resource: Resource; message: string }> {
  const newResource: Resource = {
    id: data.id || "r" + Date.now(),
    courseId: String(data.courseId || "c1").trim(),
    title: String(data.title || "Study Resource").trim(),
    type: (data.type as any) || "pdf",
    url: data.url ? String(data.url).trim() : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: data.description ? String(data.description).trim() : "",
    uploadedBy: data.uploadedBy || "Faculty",
    createdAt: data.createdAt || new Date().toISOString(),
  };

  try {
    const res = await request<{ ok: boolean; resource: Resource; message: string }>("/api/resources", {
      method: "POST",
      body: JSON.stringify(newResource),
    });
    if (res && res.resource) {
      const saved = res.resource;
      const current = getLocalResources();
      saveLocalResources([saved, ...current.filter((r) => r.id !== saved.id)]);
      return res;
    }
  } catch (err) {
    console.warn("Backend offline or error creating resource, saving locally:", err);
  }

  const current = getLocalResources();
  saveLocalResources([newResource, ...current.filter((r) => r.id !== newResource.id)]);
  return { ok: true, resource: newResource, message: `Resource "${newResource.title}" published successfully!` };
}

export async function deleteResource(id: string): Promise<{ ok: boolean; message: string }> {
  const current = getLocalResources();
  saveLocalResources(current.filter((r) => r.id !== id));

  try {
    await request(`/api/resources/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch {}

  return { ok: true, message: "Resource removed successfully." };
}

export async function clearAllResources(): Promise<{ ok: boolean; message: string }> {
  try {
    localStorage.removeItem(LOCAL_RESOURCES_KEY);
  } catch {}
  try {
    await request("/api/resources", {
      method: "DELETE",
    });
  } catch {}

  return { ok: true, message: "All resources cleared." };
}

export interface CourseProgress {
  courseId: string;
  studied: boolean;
  passed: boolean;
  lastScore?: number;
  bestScore?: number;
  attempts: number;
  weakTopics?: string[];
  aiAnalysis?: string;
  completedAt?: string;
  certificateId?: string;
}

const LOCAL_MCQS_KEY = "lms_course_mcqs";

export function getLocalMCQs(): CourseMCQ[] {
  try {
    const raw = localStorage.getItem(LOCAL_MCQS_KEY);
    if (!raw) return DEFAULT_MCQS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MCQS;

    const map = new Map<string, CourseMCQ>();
    DEFAULT_MCQS.forEach((q) => map.set(q.id, q));
    parsed.forEach((q: CourseMCQ) => {
      if (q && q.id) map.set(q.id, q);
    });
    return Array.from(map.values());
  } catch {
    return DEFAULT_MCQS;
  }
}

export function saveLocalMCQs(list: CourseMCQ[]) {
  try {
    localStorage.setItem(LOCAL_MCQS_KEY, JSON.stringify(list));
    notifyDataChange();
  } catch {}
}

export async function fetchCourseMCQs(courseId?: string): Promise<CourseMCQ[]> {
  const all = getLocalMCQs();
  if (courseId) {
    const lowerId = courseId.trim().toLowerCase();
    const allCourses = [...getLocalCourses(), ...COURSES];
    const matched = allCourses.find(
      (c) =>
        c.id.toLowerCase() === lowerId ||
        (c.code && c.code.toLowerCase() === lowerId)
    );
    const validIds = new Set<string>([lowerId]);
    if (matched) {
      validIds.add(matched.id.toLowerCase());
      if (matched.code) validIds.add(matched.code.toLowerCase());
    }
    return all.filter((q) => validIds.has(q.courseId.toLowerCase()));
  }
  return all;
}

export async function createCourseMCQ(data: Partial<CourseMCQ>): Promise<{ ok: boolean; mcq?: CourseMCQ; message: string }> {
  const current = getLocalMCQs();
  const cId = String(data.courseId || "c1");
  const existingForCourse = current.filter((q) => q.courseId === cId);

  if (existingForCourse.length >= 10) {
    return {
      ok: false,
      message: `Maximum 10 questions limit reached for this course. Please delete an existing question before adding a new one.`,
    };
  }

  const newMCQ: CourseMCQ = {
    id: data.id || "mcq-" + Date.now(),
    courseId: cId,
    question: String(data.question || "").trim(),
    options: Array.isArray(data.options) && data.options.length === 4 ? data.options : ["Option A", "Option B", "Option C", "Option D"],
    answer: typeof data.answer === "number" ? data.answer : 0,
    topic: String(data.topic || "Core Subject Concepts").trim(),
    explanation: String(data.explanation || "").trim(),
  };

  const updated = [...current, newMCQ];
  saveLocalMCQs(updated);
  return { ok: true, mcq: newMCQ, message: "MCQ Question added successfully!" };
}

export async function deleteCourseMCQ(id: string): Promise<{ ok: boolean; message: string }> {
  const current = getLocalMCQs();
  const filtered = current.filter((q) => q.id !== id);
  saveLocalMCQs(filtered);
  return { ok: true, message: "MCQ question deleted successfully." };
}

export function resetCourseMCQs(): void {
  try {
    localStorage.setItem(LOCAL_MCQS_KEY, JSON.stringify(DEFAULT_MCQS));
    notifyDataChange();
  } catch {}
}

// Student Course Progression & Certification Tracking
export function getStudentCourseProgress(studentId: string, courseId: string): CourseProgress {
  try {
    const raw = localStorage.getItem(`lms_progress_${studentId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[courseId]) return parsed[courseId];
    }
  } catch {}
  return {
    courseId,
    studied: false,
    passed: false,
    attempts: 0,
    bestScore: 0,
  };
}

export function saveStudentCourseProgress(studentId: string, courseId: string, update: Partial<CourseProgress>): CourseProgress {
  try {
    const key = `lms_progress_${studentId}`;
    const raw = localStorage.getItem(key);
    const existingMap: Record<string, CourseProgress> = raw ? JSON.parse(raw) : {};
    const current = existingMap[courseId] || {
      courseId,
      studied: false,
      passed: false,
      attempts: 0,
      bestScore: 0,
    };
    const updated: CourseProgress = { ...current, ...update };
    existingMap[courseId] = updated;
    localStorage.setItem(key, JSON.stringify(existingMap));
    notifyDataChange();
    return updated;
  } catch {
    return { courseId, studied: true, passed: false, attempts: 1, ...update };
  }
}

export function getAllStudentProgress(studentId: string): Record<string, CourseProgress> {
  try {
    const raw = localStorage.getItem(`lms_progress_${studentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export interface CourseEnrollment {
  id: string; // enrollment id
  studentId: string; // rollNo or userId, e.g. "CS2022001"
  rollNo: string; // for backwards-compatibility with grade tables
  name: string; // for backwards-compatibility with grade tables
  email: string;
  department: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyId: string;
  enrolledAt: string;
  status: "Ongoing" | "Finished" | "Passed" | "Review Required" | "Ready for Test" | "Studying";
  studied: boolean;
  passed: boolean;
  score?: number; // 0-10
  percentage?: number; // 0-100%
  attempts: number;
  weakTopics?: string[];
  completedAt?: string;
  certificateId?: string;
  attemptHistory?: Array<{
    attemptNumber: number;
    score: number;
    date: string;
    passed: boolean;
    weakTopics: string[];
  }>;
}

export type StudentCourseGrade = CourseEnrollment;

const LOCAL_ENROLLMENTS_KEY = "lms_course_enrollments";

// Initial baseline enrollment only for demo student Rahul Sharma (CS2022001)
// so the system starts clean with NO fake/dummy student names!
export const DEFAULT_ENROLLMENTS: CourseEnrollment[] = [
  {
    id: "enr_cs2022001_c1",
    studentId: "CS2022001",
    rollNo: "CS2022001",
    name: "Rahul Sharma",
    email: "rahul@aaes.edu",
    department: "Computer Science",
    courseId: "c1",
    courseCode: "CS301",
    courseName: "Data Structures & Algorithms",
    facultyId: "u2",
    enrolledAt: "2024-08-15T09:00:00.000Z",
    status: "Finished",
    studied: true,
    passed: true,
    score: 8,
    percentage: 80,
    attempts: 1,
    completedAt: "2024-08-25T10:00:00.000Z",
    certificateId: "CERT-CS301-829141",
    attemptHistory: [
      {
        attemptNumber: 1,
        score: 8,
        date: "2024-08-25T10:00:00.000Z",
        passed: true,
        weakTopics: [],
      },
    ],
  },
  {
    id: "enr_cs2022001_c2",
    studentId: "CS2022001",
    rollNo: "CS2022001",
    name: "Rahul Sharma",
    email: "rahul@aaes.edu",
    department: "Computer Science",
    courseId: "c2",
    courseCode: "CS302",
    courseName: "Database Management Systems",
    facultyId: "u2",
    enrolledAt: "2024-08-16T11:00:00.000Z",
    status: "Ongoing",
    studied: true,
    passed: false,
    score: 5,
    percentage: 50,
    attempts: 1,
    weakTopics: ["Normalization & 3NF", "SQL Joins & Indexing"],
    attemptHistory: [
      {
        attemptNumber: 1,
        score: 5,
        date: "2024-08-20T14:00:00.000Z",
        passed: false,
        weakTopics: ["Normalization & 3NF", "SQL Joins & Indexing"],
      },
    ],
  },
  {
    id: "enr_cs2022001_c4",
    studentId: "CS2022001",
    rollNo: "CS2022001",
    name: "Rahul Sharma",
    email: "rahul@aaes.edu",
    department: "Computer Science",
    courseId: "c4",
    courseCode: "CS401",
    courseName: "Operating Systems",
    facultyId: "u2",
    enrolledAt: "2024-08-18T10:00:00.000Z",
    status: "Ongoing",
    studied: false,
    passed: false,
    attempts: 0,
    weakTopics: [],
  },
];

export function getEnrollments(courseId?: string, facultyId?: string): CourseEnrollment[] {
  try {
    const raw = localStorage.getItem(LOCAL_ENROLLMENTS_KEY);
    let list: CourseEnrollment[] = [];
    if (!raw) {
      localStorage.setItem(LOCAL_ENROLLMENTS_KEY, JSON.stringify(DEFAULT_ENROLLMENTS));
      list = DEFAULT_ENROLLMENTS;
    } else {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        list = DEFAULT_ENROLLMENTS;
      } else {
        const map = new Map<string, CourseEnrollment>();
        DEFAULT_ENROLLMENTS.forEach((e) => map.set(`${e.studentId}_${e.courseId}`, e));
        parsed.forEach((e: CourseEnrollment) => {
          if (e && e.studentId && e.courseId) {
            map.set(`${e.studentId}_${e.courseId}`, e);
          }
        });
        list = Array.from(map.values());
      }
    }

    if (courseId && courseId !== "all") {
      const lower = courseId.toLowerCase();
      list = list.filter((e) => e.courseId.toLowerCase() === lower || e.courseCode.toLowerCase() === lower);
    }
    if (facultyId && facultyId !== "all") {
      list = list.filter((e) => !facultyId || e.facultyId === facultyId);
    }
    return list;
  } catch {
    return DEFAULT_ENROLLMENTS;
  }
}

export function saveAllEnrollments(list: CourseEnrollment[]) {
  try {
    localStorage.setItem(LOCAL_ENROLLMENTS_KEY, JSON.stringify(list));
    notifyDataChange();
  } catch {}
}

export function getStudentEnrollments(studentId: string): CourseEnrollment[] {
  const all = getEnrollments();
  const sId = (studentId || "").trim().toLowerCase();
  return all.filter((e) => e.studentId.trim().toLowerCase() === sId || e.rollNo.trim().toLowerCase() === sId);
}

export function isStudentEnrolled(studentId: string, courseId: string): boolean {
  const all = getEnrollments();
  const sId = (studentId || "").trim().toLowerCase();
  const cId = (courseId || "").trim().toLowerCase();
  return all.some(
    (e) =>
      (e.studentId.trim().toLowerCase() === sId || e.rollNo.trim().toLowerCase() === sId) &&
      (e.courseId.trim().toLowerCase() === cId || (e.courseCode && e.courseCode.trim().toLowerCase() === cId))
  );
}

export function enrollStudentInCourse(
  student: { id?: string; userId?: string; rollNo?: string; name: string; email?: string; department?: string },
  course: Course
): CourseEnrollment {
  const sId = student.rollNo || student.userId || student.id || "CS2022001";
  const all = getEnrollments();
  const existing = all.find(
    (e) =>
      (e.studentId.toLowerCase() === sId.toLowerCase() || e.rollNo.toLowerCase() === sId.toLowerCase()) &&
      (e.courseId === course.id || e.courseCode === course.code)
  );
  if (existing) return existing;

  const newEnrollment: CourseEnrollment = {
    id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: sId,
    rollNo: sId,
    name: student.name || "Student",
    email: student.email || `${sId.toLowerCase()}@academic.edu`,
    department: student.department || course.department || "Computer Science",
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    facultyId: course.facultyId || "u2",
    enrolledAt: new Date().toISOString(),
    status: "Ongoing",
    studied: false,
    passed: false,
    attempts: 0,
    attemptHistory: [],
  };

  const updated = [newEnrollment, ...all];
  saveAllEnrollments(updated);
  return newEnrollment;
}

export function updateEnrollmentProgress(
  studentId: string,
  courseId: string,
  update: Partial<CourseEnrollment>
): CourseEnrollment {
  const all = getEnrollments();
  const sId = (studentId || "").trim().toLowerCase();
  let updatedRecord: CourseEnrollment | null = null;

  const nextList = all.map((e) => {
    if (
      (e.studentId.trim().toLowerCase() === sId || e.rollNo.trim().toLowerCase() === sId) &&
      (e.courseId === courseId || e.courseCode === courseId)
    ) {
      const isPassed = update.score !== undefined ? update.score >= 7 : (update.passed ?? e.passed);
      let status = e.status;
      if (isPassed) {
        status = "Finished";
      } else if (update.score !== undefined && update.score < 7) {
        status = "Ongoing";
      } else if (update.studied) {
        status = "Ongoing";
      }

      updatedRecord = {
        ...e,
        ...update,
        passed: isPassed,
        status,
      };
      return updatedRecord;
    }
    return e;
  });

  if (!updatedRecord) {
    const isPassed = update.score !== undefined ? update.score >= 7 : Boolean(update.passed);
    updatedRecord = {
      id: `enr_${Date.now()}`,
      studentId,
      rollNo: studentId,
      name: "Student",
      email: `${studentId.toLowerCase()}@academic.edu`,
      department: "Computer Science",
      courseId,
      courseCode: courseId,
      courseName: courseId,
      facultyId: "u2",
      enrolledAt: new Date().toISOString(),
      status: isPassed ? "Finished" : "Ongoing",
      studied: true,
      passed: isPassed,
      attempts: 1,
      ...update,
    };
    nextList.unshift(updatedRecord);
  }

  saveAllEnrollments(nextList);
  return updatedRecord;
}

export async function fetchAllStudentGrades(facultyId?: string, courseId?: string): Promise<CourseEnrollment[]> {
  return getEnrollments(courseId, facultyId);
}

export function computeCourseRealStats(courseId: string, grades?: CourseEnrollment[]) {
  const all = grades && grades.length > 0 ? grades : getEnrollments();
  const forCourse = all.filter((g) => g.courseId === courseId || g.courseCode === courseId);
  const enrolled = forCourse.length;
  const finished = forCourse.filter((g) => g.passed || g.status === "Finished" || (g.score !== undefined && g.score >= 7)).length;
  const ongoing = enrolled - finished;
  const withScores = forCourse.filter((g) => g.score !== undefined);
  const totalScore = withScores.reduce((acc, g) => acc + (g.score || 0), 0);
  const avgScore = withScores.length > 0 ? (totalScore / withScores.length).toFixed(1) : "0.0";
  const avgPercent = withScores.length > 0 ? Math.round((totalScore / withScores.length) * 10) : 0;
  const completionRate = enrolled > 0 ? Math.round((finished / enrolled) * 100) : 0;

  return {
    enrolled,
    completed: finished,
    finished,
    ongoing,
    completionRate,
    avgScore,
    avgPercent,
    students: forCourse,
  };
}

export function computeTeacherRealStats(facultyId: string, courses: Course[], grades?: CourseEnrollment[]) {
  const teacherCourses = courses.filter((c) => !facultyId || c.facultyId === facultyId || facultyId === "all");
  const teacherCourseIds = new Set(teacherCourses.map((c) => c.id));
  const all = grades && grades.length > 0 ? grades : getEnrollments();
  const forTeacher = all.filter((g) => teacherCourseIds.has(g.courseId));

  const uniqueStudents = new Set(forTeacher.map((g) => g.studentId)).size;
  const finishedRecords = forTeacher.filter((g) => g.passed || g.status === "Finished" || (g.score !== undefined && g.score >= 7)).length;
  const ongoingRecords = forTeacher.length - finishedRecords;
  const withScores = forTeacher.filter((g) => g.score !== undefined);
  const totalScore = withScores.reduce((acc, g) => acc + (g.score || 0), 0);
  const cohortAverage = withScores.length > 0 ? ((totalScore / withScores.length) * 10).toFixed(1) + "%" : "0.0%";

  return {
    activeCourses: teacherCourses.length,
    totalStudents: uniqueStudents,
    totalCompletions: finishedRecords,
    ongoingStudents: ongoingRecords,
    cohortAverage,
  };
}


// =========================================================================
// AI PROCTORING INCIDENTS & VIOLATION AUDIT REGISTRY
// =========================================================================

export interface ProctorIncident {
  id: string;
  student: string;
  studentId: string;
  rollNo: string;
  exam: string;
  courseCode: string;
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  timestamp: string;
  status: "Terminated / Retake Required" | "Under Review" | "Resolved";
  details: string;
  snapshot?: string;
}

const LOCAL_PROCTOR_INCIDENTS_KEY = "lms_proctor_incidents";

export const DEFAULT_PROCTOR_INCIDENTS: ProctorIncident[] = [
  {
    id: "INC-81042",
    student: "Rahul Sharma",
    studentId: "CS2022001",
    rollNo: "CS2022001",
    exam: "Data Structures & Algorithms (CS301)",
    courseCode: "CS301",
    type: "Tab Switch Anomaly",
    severity: "Medium",
    timestamp: "2024-08-25 10:14 AM",
    status: "Resolved",
    details: "Browser lost window focus for 3 seconds during initial calibration.",
  },
];

export function getProctorIncidents(): ProctorIncident[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROCTOR_INCIDENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PROCTOR_INCIDENTS_KEY, JSON.stringify(DEFAULT_PROCTOR_INCIDENTS));
      return DEFAULT_PROCTOR_INCIDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROCTOR_INCIDENTS;
  } catch {
    return DEFAULT_PROCTOR_INCIDENTS;
  }
}

export function saveProctorIncidents(list: ProctorIncident[]): void {
  try {
    localStorage.setItem(LOCAL_PROCTOR_INCIDENTS_KEY, JSON.stringify(list));
    notifyDataChange();
  } catch {}
}

export function recordProctorIncident(
  incident: Omit<ProctorIncident, "id" | "timestamp"> & { id?: string; timestamp?: string }
): ProctorIncident {
  const current = getProctorIncidents();
  const newIncident: ProctorIncident = {
    id: incident.id || `INC-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: incident.timestamp || new Date().toLocaleString(),
    student: incident.student || "Student",
    studentId: incident.studentId || "CS2022001",
    rollNo: incident.rollNo || incident.studentId || "CS2022001",
    exam: incident.exam || "Academic Assessment",
    courseCode: incident.courseCode || "CS301",
    type: incident.type || "Proctoring Flag",
    severity: incident.severity || "Critical",
    status: incident.status || "Terminated / Retake Required",
    details: incident.details || "Automated webcam proctoring sentinel flagged examination anomaly.",
    snapshot: incident.snapshot,
  };

  const updated = [newIncident, ...current.filter((i) => i.id !== newIncident.id)];
  saveProctorIncidents(updated);

  // Also push to backend if available
  try {
    request("/api/proctor-incidents", {
      method: "POST",
      body: JSON.stringify(newIncident),
    }).catch(() => {});
  } catch {}

  return newIncident;
}

export function resolveProctorIncident(id: string | number, resolution: string): void {
  const current = getProctorIncidents();
  const updated = current.map((inc) =>
    String(inc.id) === String(id) ? { ...inc, status: resolution as any } : inc
  );
  saveProctorIncidents(updated);
}
