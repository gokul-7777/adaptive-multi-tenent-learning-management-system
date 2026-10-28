export type Role = "admin" | "faculty" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  rollNo?: string;
  employeeId?: string;
}

export const USERS: User[] = [
  { id: "u1", name: "Dr. Priya Ramesh", email: "admin@aaes.edu", role: "admin", department: "Administration" },
  { id: "u2", name: "Prof. Kavitha Nair", email: "kavitha@aaes.edu", role: "faculty", department: "Computer Science", employeeId: "FAC-2021-011" },
  { id: "u3", name: "Prof. Arun Menon", email: "arun@aaes.edu", role: "faculty", department: "Mathematics", employeeId: "FAC-2019-004" },
  { id: "u4", name: "Rahul Sharma", email: "rahul@aaes.edu", role: "student", department: "Computer Science", rollNo: "CS2022001" },
];

export const DEMO_LOGINS: { email: string; password: string; userId: string }[] = [
  { email: "admin@aaes.edu", password: "admin123", userId: "admin" },
  { email: "kavitha@aaes.edu", password: "faculty123", userId: "kavitha" },
  { email: "arun@aaes.edu", password: "faculty123", userId: "arun" },
  { email: "rahul@aaes.edu", password: "student123", userId: "CS2022001" },
];

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: number;
  facultyId: string;
  instructor?: string;
  enrolled: number;
  description?: string;
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: "pdf" | "video" | "link" | "notes";
  url?: string;
  description?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export const COURSES: Course[] = [
  {
    id: "c1",
    code: "CS301",
    name: "Data Structures & Algorithms",
    credits: 4,
    department: "Computer Science",
    semester: 3,
    facultyId: "u2",
    instructor: "Prof. Kavitha Nair",
    enrolled: 1,
    description: "Core curriculum covering Trees, AVL balancing, Binary Heaps, Graph traversals, Dijkstra shortest paths, and Dynamic Programming.",
  },
  {
    id: "c2",
    code: "CS302",
    name: "Database Management Systems",
    credits: 3,
    department: "Computer Science",
    semester: 3,
    facultyId: "u2",
    instructor: "Prof. Kavitha Nair",
    enrolled: 1,
    description: "Relational algebra, SQL aggregation, B+ tree indexing, ACID transaction isolation, and database normalization up to BCNF.",
  },
  {
    id: "c4",
    code: "CS401",
    name: "Operating Systems",
    credits: 4,
    department: "Computer Science",
    semester: 4,
    facultyId: "u2",
    instructor: "Prof. Kavitha Nair",
    enrolled: 1,
    description: "CPU scheduling, synchronization semaphores, Coffman deadlocks, Banker's avoidance, MMU paging, and Belady's anomaly.",
  },
];

export const DEFAULT_RESOURCES: Resource[] = [
  // Subject 1: CS301 — Data Structures & Algorithms (c1)
  {
    id: "res-cs301-1",
    courseId: "c1",
    title: "Unit 1 & 2: Trees, AVL Rotations & Binary Heap Implementation Guide",
    type: "pdf",
    url: "https://www.cs.cmu.edu/~adamchik/15-121/lectures/Trees/trees.html",
    description: "In-depth guide covering binary search trees, AVL balance factor maintenance, single/double rotations, and min/max binary heap array structures.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-10T10:00:00.000Z",
  },
  {
    id: "res-cs301-2",
    courseId: "c1",
    title: "Unit 3: Graph Traversals (BFS, DFS), Kahn's Topo Sort & Shortest Paths",
    type: "video",
    url: "https://www.youtube.com/watch?v=pcKY4hjDrxk",
    description: "Detailed faculty video lecture on Directed Acyclic Graphs (DAG), topological sorting using in-degree arrays, cycle detection, and Dijkstra algorithms.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-12T14:30:00.000Z",
  },
  {
    id: "res-cs301-3",
    courseId: "c1",
    title: "Unit 4: Dynamic Programming Mastery — 0/1 Knapsack & Memoization Tables",
    type: "notes",
    url: "https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture12.pdf",
    description: "Comprehensive lecture notes on formulating recurrence relations, constructing (n+1) x (W+1) dynamic programming grids, and space-optimized solutions.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-15T09:15:00.000Z",
  },

  // Subject 2: CS302 — Database Management Systems (c2)
  {
    id: "res-cs302-1",
    courseId: "c2",
    title: "Unit 1: Relational Normalization Handbook (1NF, 2NF, 3NF & BCNF)",
    type: "pdf",
    url: "https://web.stanford.edu/class/cs145/lectures/04-design-theory.pdf",
    description: "Exhaustive normalization reference detailing functional dependency inference, candidate key derivation, partial dependency removal, and Boyce-Codd normal form.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-11T11:00:00.000Z",
  },
  {
    id: "res-cs302-2",
    courseId: "c2",
    title: "Unit 2: ACID Transactions, Concurrency Control & Two-Phase Locking (2PL)",
    type: "video",
    url: "https://www.youtube.com/watch?v=oou_616-uFk",
    description: "Master video lecture on serializability, dirty reads, lost updates, strict two-phase locking schedules, and Write-Ahead Logging (WAL) recovery.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-13T16:00:00.000Z",
  },
  {
    id: "res-cs302-3",
    courseId: "c2",
    title: "Unit 3: SQL Aggregations, Relational Algebra Joins & B+ Tree Indexing",
    type: "notes",
    url: "https://databasecourse.com/lectures/b-plus-trees",
    description: "Concise technical notes explaining GROUP BY with HAVING filters, Theta Joins vs Cross Product, and leaf-node sequential chaining in B+ Trees.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-16T08:45:00.000Z",
  },

  // Subject 3: CS401 — Operating Systems (c4)
  {
    id: "res-cs401-1",
    courseId: "c4",
    title: "Unit 1: CPU Scheduling Algorithms & Process Synchronization Notes",
    type: "pdf",
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf",
    description: "Detailed operating systems reference guide covering SJF starvation, Round Robin time quantum trade-offs, and counting semaphore synchronization mechanics.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-10T13:20:00.000Z",
  },
  {
    id: "res-cs401-2",
    courseId: "c4",
    title: "Unit 2: Deadlock Detection, Coffman Conditions & Banker's Algorithm",
    type: "video",
    url: "https://www.youtube.com/watch?v=2msbQ8ZhkK8",
    description: "Video lecture walking through the 4 Coffman deadlock conditions, resource allocation graphs, and Dijkstra Banker's safe state verification algorithm.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-14T15:10:00.000Z",
  },
  {
    id: "res-cs401-3",
    courseId: "c4",
    title: "Unit 3: Virtual Memory, MMU Hardware, Paging & Belady's Anomaly",
    type: "notes",
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf",
    description: "Lecture notes analyzing MMU address translation, page table structures, TLB caching, FIFO Belady anomaly, and page thrashing prevention.",
    uploadedBy: "Prof. Kavitha Nair",
    createdAt: "2024-08-17T11:30:00.000Z",
  },
];

export const RESOURCES: Resource[] = DEFAULT_RESOURCES;

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  batch: string;
  cgpa: number;
  status: "active" | "inactive";
}

export const STUDENTS: Student[] = [
  { id: "s1", rollNo: "CS2022001", name: "Rahul Sharma", email: "rahul@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 8.7, status: "active" },
];

export interface AttendanceRecord {
  studentId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "late";
}

export const ATTENDANCE: AttendanceRecord[] = [
  { studentId: "s1", courseId: "c1", date: "2024-08-01", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-05", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-12", status: "present" },
];

export interface Mark {
  studentId: string;
  courseId: string;
  component: string;
  maxMarks: number;
  obtained: number;
}

export const MARKS: Mark[] = [
  { studentId: "s1", courseId: "c1", component: "Internal 1", maxMarks: 50, obtained: 44 },
  { studentId: "s1", courseId: "c1", component: "Internal 2", maxMarks: 50, obtained: 41 },
  { studentId: "s1", courseId: "c1", component: "Assessment", maxMarks: 10, obtained: 8 },
];

export const DEPARTMENTS = ["Computer Science", "Mathematics", "Electronics", "Mechanical", "Civil"];

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  urgent: boolean;
  content: string;
  author: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "End Semester Examination Schedule Released",
    date: "2024-08-20",
    category: "Exam",
    urgent: true,
    content: "The official timetable for End Semester Examinations has been published on the student portal. Review your slots carefully.",
    author: "Office of Controller of Examinations",
  },
  {
    id: "a2",
    title: "Internal Assessment II — CS301 rescheduled to 2024-08-28",
    date: "2024-08-18",
    category: "Assessment",
    urgent: false,
    content: "Due to technical maintenance in Lab 3, CS301 Internal Assessment II is rescheduled to Aug 28 at 10:00 AM.",
    author: "Prof. Kavitha Nair",
  },
  {
    id: "a3",
    title: "Annual Sports Day — Registration Open",
    date: "2024-08-15",
    category: "Event",
    urgent: false,
    content: "Inter-department sports meet registrations are now live. Register for track and field events before Aug 25.",
    author: "Sports Council",
  },
  {
    id: "a4",
    title: "Faculty Development Programme — Sept 2–6",
    date: "2024-08-12",
    category: "Faculty",
    urgent: false,
    content: "Week-long hands-on workshop on AI integration in higher education curriculum for CS & Math departments.",
    author: "Academic Council",
  },
];

export type { CourseMCQ } from "./data/mcqs";
export { DEFAULT_MCQS } from "./data/mcqs";
