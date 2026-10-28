import dns from "node:dns";
import express from "express";
import cors from "cors";

// Fix for Windows & ISP (Jio/Airtel/etc.) "querySrv ECONNREFUSED" with MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (dnsErr) {
  console.warn("ℹ️ [DNS Notice]:", dnsErr.message);
}

// Optional dotenv loader
try {
  const dotenv = await import("dotenv");
  dotenv.default?.config();
} catch {}

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const MONGODB_URI = process.env.MONGODB_URI;
const FALLBACK_MONGODB_URI = process.env.MONGODB_DIRECT_URI;

app.use(cors());
app.use(express.json());

let isDbConnected = false;
let UserModel = null;
let CourseModel = null;
let ResourceModel = null;

// Initialize MongoDB connection and auto-seed initial users, courses, and resources
async function initMongoDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is required to connect to MongoDB.");
    }
    const mongooseModule = await import("mongoose");
    const mongoose = mongooseModule.default;

    const userSchema = new mongoose.Schema({
      userId: { type: String, required: true, unique: true, trim: true },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      role: { type: String, enum: ["admin", "faculty", "student"], default: "student" },
      department: { type: String, default: "Computer Science" },
      rollNo: { type: String },
      employeeId: { type: String },
      createdAt: { type: Date, default: Date.now },
    });

    const courseSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      code: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      credits: { type: Number, default: 3 },
      department: { type: String, default: "Computer Science" },
      semester: { type: Number, default: 3 },
      facultyId: { type: String, default: "u2" },
      instructor: { type: String, default: "Prof. Kavitha Nair" },
      enrolled: { type: Number, default: 45 },
      description: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    });

    const resourceSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      courseId: { type: String, required: true },
      title: { type: String, required: true, trim: true },
      type: { type: String, enum: ["pdf", "video", "link", "notes"], default: "pdf" },
      url: { type: String, default: "" },
      description: { type: String, default: "" },
      uploadedBy: { type: String, default: "Faculty" },
      createdAt: { type: Date, default: Date.now },
    });

    UserModel = mongoose.models.User || mongoose.model("User", userSchema);
    CourseModel = mongoose.models.Course || mongoose.model("Course", courseSchema);
    ResourceModel = mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

    // Set public DNS servers before connection attempt
    try {
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    } catch {}

    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 6000,
      });
    } catch (primaryErr) {
      if (primaryErr.message && primaryErr.message.includes("querySrv")) {
        console.warn("ℹ️ [MongoDB Atlas] Retrying with Cloudflare DNS resolver...");
        try {
          dns.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8"]);
          await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 6000,
          });
        } catch (srvRetryErr) {
          if (!FALLBACK_MONGODB_URI) {
            throw srvRetryErr;
          }
          console.warn("ℹ️ [MongoDB Atlas] SRV DNS blocked by local network. Trying direct connection...");
          await mongoose.connect(FALLBACK_MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
          });
        }
      } else {
        throw primaryErr;
      }
    }

    isDbConnected = true;
    console.log("\n=======================================================");
    console.log("☁️  [MongoDB Atlas] Connected successfully to Cluster0!");
    console.log("🚀  Academic Management Backend is ACTIVE and READY!");
    console.log("=======================================================");

    // Auto-seed initial users if collection is empty
    const count = await UserModel.countDocuments();
    if (count === 0) {
      console.log("🌱 [MongoDB Atlas] Seeding default admin, faculty, and student users...");
      await UserModel.insertMany([
        {
          userId: "admin",
          name: "Dr. Priya Ramesh",
          email: "admin@aaes.edu",
          password: "admin123",
          role: "admin",
          department: "Administration",
        },
        {
          userId: "kavitha",
          name: "Prof. Kavitha Nair",
          email: "kavitha@aaes.edu",
          password: "faculty123",
          role: "faculty",
          department: "Computer Science",
          employeeId: "FAC-2021-011",
        },
        {
          userId: "arun",
          name: "Prof. Arun Menon",
          email: "arun@aaes.edu",
          password: "faculty123",
          role: "faculty",
          department: "Mathematics",
          employeeId: "FAC-2019-004",
        },
        {
          userId: "CS2022001",
          name: "Rahul Sharma",
          email: "rahul@aaes.edu",
          password: "student123",
          role: "student",
          department: "Computer Science",
          rollNo: "CS2022001",
        },
        {
          userId: "CS2022002",
          name: "Divya Krishnan",
          email: "divya@aaes.edu",
          password: "student123",
          role: "student",
          department: "Computer Science",
          rollNo: "CS2022002",
        },
      ]);
      console.log("✅ [MongoDB Atlas] Default user accounts seeded into MongoDB Atlas!");
    } else {
      console.log(`👥 [MongoDB Atlas] Loaded ${count} user accounts from cloud database.`);
    }

    // Auto-seed initial courses if collection is empty
    const courseCount = await CourseModel.countDocuments();
    if (courseCount === 0) {
      console.log("🌱 [MongoDB Atlas] Seeding default course catalog...");
      await CourseModel.insertMany(initialCourses);
      console.log("✅ [MongoDB Atlas] Course catalog seeded into MongoDB Atlas!");
    } else {
      console.log(`📚 [MongoDB Atlas] Loaded ${courseCount} courses from cloud database.`);
    }
  } catch (error) {
    isDbConnected = false;
    console.warn(`ℹ️ [MongoDB Atlas] Notice: ${error.message}`);
    console.warn("ℹ️ [MongoDB Atlas] Running in fallback mode. All default accounts work out of the box!");
  }
}

initMongoDB();

const users = [
  { id: "u1", name: "Dr. Priya Ramesh", email: "admin@aaes.edu", role: "admin", department: "Administration" },
  { id: "u2", name: "Prof. Kavitha Nair", email: "kavitha@aaes.edu", role: "faculty", department: "Computer Science", employeeId: "FAC-2021-011" },
  { id: "u3", name: "Prof. Arun Menon", email: "arun@aaes.edu", role: "faculty", department: "Mathematics", employeeId: "FAC-2019-004" },
  { id: "u4", name: "Rahul Sharma", email: "rahul@aaes.edu", role: "student", department: "Computer Science", rollNo: "CS2022001" },
  { id: "u5", name: "Divya Krishnan", email: "divya@aaes.edu", role: "student", department: "Computer Science", rollNo: "CS2022002" },
];

const demoLogins = [
  { email: "admin@aaes.edu", password: "admin123", userId: "u1" },
  { email: "kavitha@aaes.edu", password: "faculty123", userId: "u2" },
  { email: "arun@aaes.edu", password: "faculty123", userId: "u3" },
  { email: "rahul@aaes.edu", password: "student123", userId: "u4" },
  { email: "divya@aaes.edu", password: "student123", userId: "u5" },
];

const initialCourses = [
  {
    id: "c1",
    code: "CS301",
    name: "Data Structures & Algorithms",
    credits: 4,
    department: "Computer Science",
    semester: 3,
    facultyId: "u2",
    instructor: "Prof. Kavitha Nair",
    enrolled: 62,
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
    enrolled: 60,
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
    enrolled: 58,
    description: "CPU scheduling, synchronization semaphores, Coffman deadlocks, Banker's avoidance, MMU paging, and Belady's anomaly.",
  },
];

let courses = [...initialCourses];

const initialResources = [
  // Subject 1: CS301 (c1)
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
  // Subject 2: CS302 (c2)
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
  // Subject 3: CS401 (c4)
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
let resources = [...initialResources];

const students = [
  { id: "s1", rollNo: "CS2022001", name: "Rahul Sharma", email: "rahul@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 8.7, status: "active" },
  { id: "s2", rollNo: "CS2022002", name: "Divya Krishnan", email: "divya@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 9.1, status: "active" },
  { id: "s3", rollNo: "CS2022003", name: "Arjun Patel", email: "arjun@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 7.8, status: "active" },
  { id: "s4", rollNo: "CS2022004", name: "Sneha Reddy", email: "sneha@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 8.2, status: "active" },
  { id: "s5", rollNo: "CS2022005", name: "Mohammed Faiz", email: "faiz@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 6.9, status: "inactive" },
  { id: "s6", rollNo: "CS2022006", name: "Lakshmi Iyer", email: "lakshmi@aaes.edu", department: "Computer Science", semester: 3, batch: "2022–2026", cgpa: 9.4, status: "active" },
  { id: "s7", rollNo: "MA2022001", name: "Vikram Singh", email: "vikram@aaes.edu", department: "Mathematics", semester: 3, batch: "2022–2026", cgpa: 8.0, status: "active" },
  { id: "s8", rollNo: "MA2022002", name: "Ananya Das", email: "ananya@aaes.edu", department: "Mathematics", semester: 3, batch: "2022–2026", cgpa: 8.5, status: "active" },
];

const attendance = [
  { studentId: "s1", courseId: "c1", date: "2024-08-01", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-05", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-08", status: "absent" },
  { studentId: "s1", courseId: "c1", date: "2024-08-12", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-15", status: "late" },
  { studentId: "s1", courseId: "c1", date: "2024-08-19", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-22", status: "present" },
  { studentId: "s1", courseId: "c1", date: "2024-08-26", status: "present" },
  { studentId: "s1", courseId: "c2", date: "2024-08-02", status: "present" },
  { studentId: "s1", courseId: "c2", date: "2024-08-06", status: "present" },
  { studentId: "s1", courseId: "c2", date: "2024-08-09", status: "present" },
  { studentId: "s1", courseId: "c2", date: "2024-08-13", status: "absent" },
  { studentId: "s1", courseId: "c2", date: "2024-08-16", status: "present" },
  { studentId: "s1", courseId: "c2", date: "2024-08-20", status: "present" },
];

const marks = [
  { studentId: "s1", courseId: "c1", component: "Internal 1", maxMarks: 50, obtained: 44 },
  { studentId: "s1", courseId: "c1", component: "Internal 2", maxMarks: 50, obtained: 41 },
  { studentId: "s1", courseId: "c1", component: "Assignment", maxMarks: 20, obtained: 19 },
  { studentId: "s1", courseId: "c1", component: "End Semester", maxMarks: 100, obtained: 82 },
  { studentId: "s1", courseId: "c2", component: "Internal 1", maxMarks: 50, obtained: 46 },
  { studentId: "s1", courseId: "c2", component: "Internal 2", maxMarks: 50, obtained: 43 },
  { studentId: "s1", courseId: "c2", component: "Assignment", maxMarks: 20, obtained: 18 },
  { studentId: "s1", courseId: "c2", component: "End Semester", maxMarks: 100, obtained: 78 },
  { studentId: "s2", courseId: "c1", component: "Internal 1", maxMarks: 50, obtained: 48 },
  { studentId: "s2", courseId: "c1", component: "Internal 2", maxMarks: 50, obtained: 47 },
  { studentId: "s2", courseId: "c1", component: "Assignment", maxMarks: 20, obtained: 20 },
  { studentId: "s2", courseId: "c1", component: "End Semester", maxMarks: 100, obtained: 91 },
  { studentId: "s3", courseId: "c1", component: "Internal 1", maxMarks: 50, obtained: 32 },
  { studentId: "s3", courseId: "c1", component: "Internal 2", maxMarks: 50, obtained: 29 },
  { studentId: "s3", courseId: "c1", component: "Assignment", maxMarks: 20, obtained: 14 },
  { studentId: "s3", courseId: "c1", component: "End Semester", maxMarks: 100, obtained: 61 },
];

const announcements = [
  { id: "a1", title: "End Semester Examination Schedule Released", date: "2024-08-20", category: "Exam", urgent: true },
  { id: "a2", title: "Internal Assessment II — CS301 rescheduled to 2024-08-28", date: "2024-08-18", category: "Assessment", urgent: false },
  { id: "a3", title: "Annual Sports Day — Registration Open", date: "2024-08-15", category: "Event", urgent: false },
  { id: "a4", title: "Faculty Development Programme — Sept 2–6", date: "2024-08-12", category: "Faculty", urgent: false },
];

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Academic Management API",
    endpoints: [
      "/api/health",
      "/api/login",
      "/api/users",
      "/api/courses",
      "/api/students",
      "/api/attendance/:studentId",
      "/api/marks/:studentId",
      "/api/announcements",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Academic Management API is running",
    database: isDbConnected ? "Connected to MongoDB Atlas" : "In-Memory Fallback Mode",
    dbType: isDbConnected ? "mongodb" : "in-memory",
  });
});

app.post("/api/login", async (req, res) => {
  const { identifier, email, userId, password } = req.body || {};
  const query = (identifier || email || userId || "").trim().toLowerCase();

  if (!query || !password) {
    return res.status(400).json({ message: "User ID or Email, and password are required." });
  }

  // 1. Try MongoDB if connected
  if (isDbConnected && UserModel) {
    try {
      const userDoc = await UserModel.findOne({
        $or: [
          { email: query },
          { userId: query },
          { rollNo: query.toUpperCase() },
          { rollNo: query },
          { employeeId: query.toUpperCase() },
          { employeeId: query },
        ],
      });

      if (!userDoc || userDoc.password !== password) {
        return res.status(401).json({ message: "Invalid User ID/Email or password." });
      }

      return res.json({
        ok: true,
        user: {
          id: userDoc.userId || userDoc._id.toString(),
          userId: userDoc.userId,
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role,
          department: userDoc.department,
          rollNo: userDoc.rollNo,
          employeeId: userDoc.employeeId,
        },
        token: `mongo-token-${userDoc.userId || userDoc._id}`,
        storage: "mongodb",
      });
    } catch (err) {
      console.error("MongoDB login error:", err);
      // Fall through to in-memory check
    }
  }

  // 2. Fallback in-memory check
  const login = demoLogins.find((entry) => {
    const entryEmail = entry.email.toLowerCase();
    const entryId = entry.userId.toLowerCase();
    return (
      (entryEmail === query ||
        entryId === query ||
        entryEmail.split("@")[0] === query) &&
      entry.password === password
    );
  });

  if (!login) {
    return res.status(401).json({ message: "Invalid User ID/Email or password." });
  }

  const user = users.find((entry) => entry.id === login.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({
    ok: true,
    user,
    token: `demo-token-${user.id}`,
    storage: "in-memory",
  });
});

app.post("/api/register", async (req, res) => {
  const { userId, name, email, password, role, department, rollNo, employeeId } = req.body || {};

  if (!userId || !name || !email || !password) {
    return res.status(400).json({ message: "User ID, Name, Email, and Password are required." });
  }

  const cleanUserId = userId.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (isDbConnected && UserModel) {
    try {
      const existing = await UserModel.findOne({
        $or: [{ userId: cleanUserId }, { email: cleanEmail }],
      });
      if (existing) {
        return res.status(409).json({ message: "User with this User ID or Email already exists." });
      }

      const created = await UserModel.create({
        userId: cleanUserId,
        name: name.trim(),
        email: cleanEmail,
        password,
        role: role || "student",
        department: department || "Computer Science",
        rollNo: rollNo || cleanUserId,
        employeeId,
      });

      return res.status(201).json({
        ok: true,
        message: "Account created successfully in MongoDB!",
        user: {
          id: created.userId,
          userId: created.userId,
          name: created.name,
          email: created.email,
          role: created.role,
        },
      });
    } catch (err) {
      return res.status(500).json({ message: "Database registration error: " + err.message });
    }
  }

  // Fallback in-memory registration
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail || u.id === cleanUserId);
  if (existing) {
    return res.status(409).json({ message: "User with this User ID or Email already exists." });
  }

  const newUser = {
    id: cleanUserId,
    name: name.trim(),
    email: cleanEmail,
    role: role || "student",
    department: department || "Computer Science",
    rollNo: rollNo || cleanUserId,
  };
  users.push(newUser);
  demoLogins.push({ email: cleanEmail, password, userId: cleanUserId });

  return res.status(201).json({
    ok: true,
    message: "User registered in demo memory (connect MongoDB to persist).",
    user: newUser,
  });
});

app.get("/api/users", (req, res) => {
  res.json(users);
});

// Courses API
app.get("/api/courses", async (req, res) => {
  if (isDbConnected && CourseModel) {
    try {
      const dbCourses = await CourseModel.find().lean();
      if (dbCourses && dbCourses.length > 0) {
        return res.json(dbCourses);
      }
    } catch (err) {
      console.warn("MongoDB course fetch error, using cache:", err.message);
    }
  }
  res.json(courses);
});

app.post("/api/courses", async (req, res) => {
  const { code, name, credits, department, semester, facultyId, instructor, description } = req.body || {};
  if (!code || !name) {
    return res.status(400).json({ message: "Course Code and Name are required." });
  }

  const courseId = "c" + Date.now();
  const newCourse = {
    id: courseId,
    code: String(code).trim().toUpperCase(),
    name: String(name).trim(),
    credits: Number(credits) || 3,
    department: department ? String(department).trim() : "Computer Science",
    semester: Number(semester) || 3,
    facultyId: facultyId || "u2",
    instructor: instructor ? String(instructor).trim() : "Prof. Kavitha Nair",
    enrolled: 45,
    description: description ? String(description).trim() : "",
    createdAt: new Date(),
  };

  if (isDbConnected && CourseModel) {
    try {
      await CourseModel.create(newCourse);
    } catch (err) {
      console.warn("MongoDB course create warning:", err.message);
    }
  }

  courses.unshift(newCourse);
  res.status(201).json({ ok: true, course: newCourse, message: `Course "${newCourse.name}" created successfully!` });
});

app.delete("/api/courses/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Course ID is required." });
  }

  if (isDbConnected && CourseModel) {
    try {
      await CourseModel.deleteOne({ $or: [{ id }, { code: id }] });
      if (ResourceModel) {
        await ResourceModel.deleteMany({ courseId: id });
      }
    } catch (err) {
      console.warn("MongoDB course delete warning:", err.message);
    }
  }

  courses = courses.filter((c) => c.id !== id && c.code !== id);
  resources = resources.filter((r) => r.courseId !== id);

  res.json({ ok: true, message: "Course and associated resources removed successfully." });
});

// Resources API
app.get("/api/resources", async (req, res) => {
  const { courseId } = req.query;
  if (isDbConnected && ResourceModel) {
    try {
      const filter = courseId ? { courseId } : {};
      const dbResources = await ResourceModel.find(filter).lean();
      if (dbResources && dbResources.length > 0) {
        return res.json(dbResources);
      }
    } catch (err) {
      console.warn("MongoDB resource fetch error, using cache:", err.message);
    }
  }

  if (courseId) {
    return res.json(resources.filter((r) => r.courseId === courseId));
  }
  res.json(resources);
});

app.post("/api/resources", async (req, res) => {
  const { courseId, title, type, url, description, uploadedBy } = req.body || {};
  if (!courseId || !title) {
    return res.status(400).json({ message: "Course ID and Resource Title are required." });
  }

  const newResource = {
    id: "r" + Date.now(),
    courseId: String(courseId).trim(),
    title: String(title).trim(),
    type: ["pdf", "video", "link", "notes"].includes(type) ? type : "pdf",
    url: url ? String(url).trim() : "",
    description: description ? String(description).trim() : "",
    uploadedBy: uploadedBy ? String(uploadedBy).trim() : "Faculty",
    createdAt: new Date().toISOString(),
  };

  if (isDbConnected && ResourceModel) {
    try {
      await ResourceModel.create(newResource);
    } catch (err) {
      console.warn("MongoDB resource create warning:", err.message);
    }
  }

  resources.unshift(newResource);
  res.status(201).json({ ok: true, resource: newResource, message: `Resource "${newResource.title}" added successfully!` });
});

app.delete("/api/resources", async (req, res) => {
  if (isDbConnected && ResourceModel) {
    try {
      await ResourceModel.deleteMany({});
    } catch (err) {
      console.warn("MongoDB clear resources warning:", err.message);
    }
  }
  resources = [];
  res.json({ ok: true, message: "All study resources cleared successfully." });
});

app.delete("/api/resources/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Resource ID is required." });
  }

  if (isDbConnected && ResourceModel) {
    try {
      await ResourceModel.deleteOne({ id });
    } catch (err) {
      console.warn("MongoDB resource delete warning:", err.message);
    }
  }

  resources = resources.filter((r) => r.id !== id);
  res.json({ ok: true, message: "Resource removed successfully." });
});

// MCQs API (Faculty only - max 10 questions per course)
let serverMCQs = [];

app.get("/api/mcqs", (req, res) => {
  const { courseId } = req.query;
  if (courseId) {
    return res.json(serverMCQs.filter((q) => q.courseId === courseId));
  }
  res.json(serverMCQs);
});

app.post("/api/mcqs", (req, res) => {
  const { courseId, question, options, answer, topic, explanation } = req.body || {};
  if (!courseId || !question) {
    return res.status(400).json({ message: "Course ID and Question are required." });
  }

  const existingForCourse = serverMCQs.filter((q) => q.courseId === courseId);
  if (existingForCourse.length >= 10) {
    return res.status(400).json({
      message: "Maximum 10 questions limit reached for this course. Please delete an existing question.",
    });
  }

  const newMCQ = {
    id: "mcq-" + Date.now(),
    courseId: String(courseId).trim(),
    question: String(question).trim(),
    options: Array.isArray(options) && options.length === 4 ? options : ["Option A", "Option B", "Option C", "Option D"],
    answer: typeof answer === "number" ? answer : 0,
    topic: String(topic || "General Concepts").trim(),
    explanation: String(explanation || "").trim(),
    createdAt: new Date().toISOString(),
  };

  serverMCQs.push(newMCQ);
  res.status(201).json({ ok: true, mcq: newMCQ, message: "MCQ question saved successfully." });
});

app.delete("/api/mcqs/:id", (req, res) => {
  const { id } = req.params;
  serverMCQs = serverMCQs.filter((q) => q.id !== id);
  res.json({ ok: true, message: "MCQ question removed successfully." });
});

app.get("/api/students", (req, res) => {
  res.json(students);
});

app.get("/api/attendance/:studentId", (req, res) => {
  const { studentId } = req.params;
  res.json(attendance.filter((entry) => entry.studentId === studentId));
});

app.get("/api/marks/:studentId", (req, res) => {
  const { studentId } = req.params;
  res.json(marks.filter((entry) => entry.studentId === studentId));
});

app.get("/api/announcements", (req, res) => {
  res.json(announcements);
});

// Proctoring Incidents API
let serverProctorIncidents = [];

app.get("/api/proctor-incidents", (req, res) => {
  res.json(serverProctorIncidents);
});

app.post("/api/proctor-incidents", (req, res) => {
  const inc = req.body;
  if (!inc) return res.status(400).json({ message: "Incident payload required" });
  const newIncident = {
    id: inc.id || `INC-${Date.now().toString().slice(-6)}`,
    student: inc.student || "Student",
    studentId: inc.studentId || "CS2022001",
    rollNo: inc.rollNo || inc.studentId || "CS2022001",
    exam: inc.exam || "Assessment",
    courseCode: inc.courseCode || "CS301",
    type: inc.type || "Proctoring Flag",
    severity: inc.severity || "Critical",
    timestamp: inc.timestamp || new Date().toLocaleString(),
    status: inc.status || "Terminated / Retake Required",
    details: inc.details || "",
  };
  serverProctorIncidents.unshift(newIncident);
  res.status(201).json({ ok: true, incident: newIncident });
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const startServer = (port) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`🌐 Backend Server running at: http://localhost:${port}`);
      console.log(`📡 Ready for logins and API requests.`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.log(`ℹ️ Port ${port} is already running an active backend instance.`);
        return;
      }

      throw error;
    });
  };

  startServer(DEFAULT_PORT);
}
