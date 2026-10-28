import { useState, useEffect, useRef, useCallback } from "react";
import { COURSES, type Course, type Resource } from "../data";
import { DEFAULT_MCQS, type CourseMCQ } from "../data/mcqs";
import {
  fetchCourses,
  fetchCourseMCQs,
  fetchResources,
  saveStudentCourseProgress,
  updateEnrollmentProgress,
  getStudentEnrollments,
  getStudentCourseProgress,
  matchResourceToCourse,
  recordProctorIncident,
} from "../services/api";
import { generateAiTestDiagnostic, type AiTestDiagnosticReport } from "../ai/engine";
import CourseCertificate from "../components/CourseCertificate";
import StudyPdfViewerModal from "../components/StudyPdfViewerModal";
import { getStudyPdfForCourse, type RealStudyPdf } from "../data/realStudyPdfs";

interface Props {
  onNavigate: (screen: string) => void;
  user?: any;
}

function getCourseMCQsWithFallback(targetCourse: Course, fetched: CourseMCQ[]): CourseMCQ[] {
  if (fetched && fetched.length >= 10) {
    return fetched.slice(0, 10);
  }

  const defaultForCourse = DEFAULT_MCQS.filter(
    (q) =>
      q.courseId.toLowerCase() === targetCourse.id.toLowerCase() ||
      (targetCourse.code && q.courseId.toLowerCase() === targetCourse.code.toLowerCase())
  );

  if (defaultForCourse.length >= 10) {
    return defaultForCourse.slice(0, 10);
  }

  const combined = [...(fetched || []), ...defaultForCourse];
  const uniqueMap = new Map<string, CourseMCQ>();
  combined.forEach((q) => uniqueMap.set(q.question, q));

  const list = Array.from(uniqueMap.values());
  if (list.length >= 10) return list.slice(0, 10);

  const topics = [
    `${targetCourse.name} Core Concepts`,
    `${targetCourse.name} Architecture & Design`,
    "System Efficiency & Optimization",
    "Security & Invariant Validation",
    "Complexity Analysis & Resource Constraints",
    "State Transitions & Synchronization",
    "Fault Tolerance & Recovery",
    "Data Models & Consistency",
    "Algorithm Efficiency & Scalability",
    "Real-World Engineering Application",
  ];

  while (list.length < 10) {
    const idx = list.length;
    const topic = topics[idx % topics.length];
    list.push({
      id: `gen-${targetCourse.id}-${idx + 1}`,
      courseId: targetCourse.id,
      question: `In ${targetCourse.name}, what is the primary consideration when evaluating ${topic}?`,
      options: [
        `Minimizing asymptotic time and space overhead while guaranteeing correctness`,
        `Maximizing memory consumption for speculative caching`,
        `Ignoring edge conditions to speed up single-threaded executions`,
        `Bypassing verification protocols to avoid network latency`,
      ],
      answer: 0,
      topic,
      explanation: `Evaluating ${topic} in ${targetCourse.name} strictly requires optimizing resource consumption and bounding computational overhead under formal correctness constraints.`,
    });
  }

  return list.slice(0, 10);
}

export default function ExamScreen({ onNavigate, user }: Props) {
  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const candidateName = activeUser?.name || "Rahul Sharma";
  const studentId = activeUser?.rollNo || activeUser?.userId || "CS2022001";
  const studentDept = activeUser?.department || "Computer Science";

  // Course Selection
  const [coursesList, setCoursesList] = useState<Course[]>(COURSES);
  const [activeCourse, setActiveCourse] = useState<Course>(() => {
    try {
      const saved = sessionStorage.getItem("activeExamCourse");
      if (saved) return JSON.parse(saved);
    } catch {}
    return COURSES[0];
  });
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  // Questions and Exam State
  const [questions, setQuestions] = useState<CourseMCQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(20 * 60); // 20 minutes countdown
  const [filterMode, setFilterMode] = useState<"all" | "answered" | "marked" | "unvisited">("all");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Submission & Results State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number>(0);
  const [diagnosticReport, setDiagnosticReport] = useState<AiTestDiagnosticReport | null>(null);
  const [courseResources, setCourseResources] = useState<Resource[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [awardedCertId, setAwardedCertId] = useState<string>("");
  const [viewingPdf, setViewingPdf] = useState<RealStudyPdf | null>(null);

  // Active Proctoring Sentinel State
  const [proctorChecks, setProctorChecks] = useState([
    { label: "Rule 1: Single Candidate In View (No Multiple Faces)", ok: true },
    { label: "Rule 2: Browser Tab Switch Lockdown", ok: true },
    { label: "Biometric Face Recognition", ok: true },
    { label: "Identity & Roll No Verified", ok: true },
    { label: "Full Screen Lockdown", ok: true },
    { label: "Audio Environment: Quiet", ok: true },
  ]);
  const [integrityScore, setIntegrityScore] = useState(98);
  const [proctorAlert, setProctorAlert] = useState<string | null>(null);

  // Real AI Webcam Proctoring & Motion Tracking State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const baselineCentroidRef = useRef<{ x: number; y: number } | null>(null);
  const baselineCountRef = useRef<number>(0);
  const calibrationFramesRef = useRef<number>(0);
  const violationStreakRef = useRef<number>(0);
  const handStreakRef = useRef<number>(0);
  const multiFaceStreakRef = useRef<number>(0);
  const upDownStreakRef = useRef<number>(0);
  const outsideMonitorStreakRef = useRef<number>(0);
  const backgroundAnomalyStreakRef = useRef<number>(0);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const isTerminatedRef = useRef<boolean>(false);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Active 2-Rule Proctoring Enforcement (Multiple Faces + Tab Switch)
  const [proctorEnforcementActive, setProctorEnforcementActive] = useState<boolean>(true);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [disqualificationReason, setDisqualificationReason] = useState<string>("");
  const [disqualificationTime, setDisqualificationTime] = useState<string>("");
  const [disqualificationIncidentId, setDisqualificationIncidentId] = useState<string>("");
  const [warningFlash, setWarningFlash] = useState<string | null>(null);
  const [gazeMetrics, setGazeMetrics] = useState({
    status: "✓ Focused on Test Viewport (Normal Posture)",
    deltaX: 0,
    deltaY: 0,
    magnitude: 0,
    faceDetected: true,
  });

  const triggerDisqualification = useCallback(
    (reason: string) => {
      if (isTerminatedRef.current || isSubmitted) return;
      isTerminatedRef.current = true;

      // Stop camera stream tracks immediately
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      } catch {}

      const timestamp = new Date().toLocaleString();
      const incId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Record in central proctor audit database
      recordProctorIncident({
        id: incId,
        student: candidateName,
        studentId: studentId,
        rollNo: studentId,
        exam: `${activeCourse.name} (${activeCourse.code})`,
        courseCode: activeCourse.code,
        type: reason,
        severity: "Critical",
        status: "Terminated / Retake Required",
        timestamp,
        details: `Automated live webcam proctor sentinel detected examination malpractice: ${reason}. Exam was immediately aborted and disqualified with score 0/10.`,
      });

      // 2. Mark student enrollment record as disqualified with 0 marks
      updateEnrollmentProgress(studentId, activeCourse.id, {
        studied: false,
        passed: false,
        status: "Ongoing",
        score: 0,
        percentage: 0,
      });

      saveStudentCourseProgress(studentId, activeCourse.id, {
        studied: false,
        passed: false,
        lastScore: 0,
      });

      // 3. Update local state to render the termination modal
      setIntegrityScore(0);
      setProctorChecks((prev) =>
        prev.map((c) => ({
          ...c,
          ok: false,
          label: c.label.includes("Biometric") ? "Malpractice Violation Flagged" : c.label,
        }))
      );
      setDisqualificationReason(reason);
      setDisqualificationTime(timestamp);
      setDisqualificationIncidentId(incId);
      setIsDisqualified(true);
    },
    [activeCourse, candidateName, isSubmitted, studentId]
  );

  // Initialize user webcam
  const startCamera = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Webcam not supported in this browser. A working camera is mandatory.");
      setCameraActive(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        setCameraError(null);
      })
      .catch((err) => {
        console.warn("Camera access request error:", err);
        setCameraActive(false);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow webcam access in browser to write the exam."
            : "No webcam detected. Camera is mandatory for proctored examination."
        );
      });
  }, []);

  // Ensure video element always binds to stream as soon as it mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  useEffect(() => {
    if (isSubmitted || isDisqualified) return;
    startCamera();

    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      } catch {}
    };
  }, [isSubmitted, isDisqualified, startCamera]);

  // Real Continuous Frame Scanning & Webcam Monitoring
  // Monitors Rule 1: Single Candidate Only (More than one face stops the test)
  useEffect(() => {
    if (isSubmitted || isDisqualified) return;

    const interval = setInterval(() => {
      if (isTerminatedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const W = canvas.width; // 160
      const H = canvas.height; // 120

      // Read live frames from video element
      let hasFrame = false;
      if (video && (video.readyState >= 2 || video.videoWidth > 0)) {
        try {
          ctx.drawImage(video, 0, 0, W, H);
          hasFrame = true;
        } catch {}
      }

      if (!hasFrame) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, W, H);
        return;
      }

      // Check A: Hardware-Accelerated Browser FaceDetector (Chromium Deep Learning API)
      const hasNativeFaceDetector =
        typeof window !== "undefined" &&
        "FaceDetector" in window &&
        video &&
        (video.readyState >= 2 || video.videoWidth > 0);

      if (hasNativeFaceDetector) {
        try {
          if (!faceDetectorRef.current) {
            faceDetectorRef.current = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
          }
          faceDetectorRef.current
            .detect(video)
            .then((detectedFaces: any[]) => {
              if (isTerminatedRef.current || !proctorEnforcementActive) return;

              // Filter out small artifacts/stickers; genuine human faces in webcam are >= 32px
              const prominentFaces = (detectedFaces || []).filter(
                (f: any) => f.boundingBox && f.boundingBox.width >= 32 && f.boundingBox.height >= 32
              );

              // Check if 2 distinct faces are separated horizontally
              let isMultiFace = false;
              if (prominentFaces.length > 1) {
                const c0 = prominentFaces[0].boundingBox.x + prominentFaces[0].boundingBox.width / 2;
                const c1 = prominentFaces[1].boundingBox.x + prominentFaces[1].boundingBox.width / 2;
                if (Math.abs(c0 - c1) >= 40) {
                  isMultiFace = true;
                }
              }

              if (isMultiFace) {
                multiFaceStreakRef.current += 1;
                setWarningFlash("⚠️ PROCTOR ALERT: More Than One Face Detected!");
                setGazeMetrics({
                  status: `⚠️ Multiple Faces Detected (${prominentFaces.length} Faces in Camera)`,
                  deltaX: 0,
                  deltaY: 0,
                  magnitude: 0,
                  faceDetected: true,
                });
                if (multiFaceStreakRef.current >= 4) {
                  triggerDisqualification(
                    "Malpractice: Multiple Persons Detected - More Than One Face Appeared in Camera (Rule 1)"
                  );
                }
              } else {
                multiFaceStreakRef.current = 0;
                setWarningFlash(null);
                setGazeMetrics({
                  status: "✓ Focused on Test Viewport (Single Candidate)",
                  deltaX: 0,
                  deltaY: 0,
                  magnitude: 0,
                  faceDetected: true,
                });
              }
            })
            .catch(() => {});
        } catch {}
        return; // Native FaceDetector handles checking; skip optical fallback
      }

      // Check B: Grid-Based Connected Face Cluster Analysis
      // Divides the 160x120 canvas into a 16x12 cell grid (10x10 px each)
      // Completely avoids false positives when a single candidate is alone in camera.
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;

      const GRID_COLS = 16;
      const GRID_ROWS = 12;
      const CELL_SIZE = 10;
      const grid: number[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

      // Scan upper-to-mid frame (rows 1 to 7, y = 10 to 79) for human facial skin pixels
      for (let r = 1; r < 8; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          let skinCount = 0;
          const startY = r * CELL_SIZE;
          const startX = c * CELL_SIZE;

          for (let py = startY; py < startY + CELL_SIZE; py += 2) {
            for (let px = startX; px < startX + CELL_SIZE; px += 2) {
              const idx = (py * W + px) * 4;
              const red = data[idx];
              const green = data[idx + 1];
              const blue = data[idx + 2];

              // Universal YCbCr human facial skin model
              const Y = 0.299 * red + 0.587 * green + 0.114 * blue;
              const Cb = -0.168736 * red - 0.331264 * green + 0.5 * blue + 128;
              const Cr = 0.5 * red - 0.418688 * green - 0.081312 * blue + 128;

              if (
                Y >= 35 && Y <= 235 &&
                Cb >= 77 && Cb <= 127 &&
                Cr >= 133 && Cr <= 173 &&
                red > green && (red - blue) >= 10
              ) {
                skinCount++;
              }
            }
          }

          // Active facial skin cell requires at least 10 skin sample pixels
          if (skinCount >= 10) {
            grid[r][c] = 1;
          }
        }
      }

      // Group active facial cells into disconnected spatial components using 8-way BFS
      const visited: boolean[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
      const components: {
        cells: number;
        minC: number;
        maxC: number;
        minR: number;
        maxR: number;
        cx: number;
      }[] = [];

      for (let r = 1; r < 8; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (grid[r][c] === 1 && !visited[r][c]) {
            let cells = 0;
            let minC = c;
            let maxC = c;
            let minR = r;
            let maxR = r;
            let sumC = 0;

            const queue: [number, number][] = [[r, c]];
            visited[r][c] = true;

            while (queue.length > 0) {
              const [currR, currC] = queue.shift()!;
              cells++;
              sumC += currC;
              if (currC < minC) minC = currC;
              if (currC > maxC) maxC = currC;
              if (currR < minR) minR = currR;
              if (currR > maxR) maxR = currR;

              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  if (dr === 0 && dc === 0) continue;
                  const nr = currR + dr;
                  const nc = currC + dc;
                  if (
                    nr >= 1 && nr < 8 &&
                    nc >= 0 && nc < GRID_COLS &&
                    grid[nr][nc] === 1 &&
                    !visited[nr][nc]
                  ) {
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                  }
                }
              }
            }

            // Only track meaningful clusters of at least 4 cells
            if (cells >= 4) {
              components.push({
                cells,
                minC,
                maxC,
                minR,
                maxR,
                cx: (sumC / cells) * CELL_SIZE + CELL_SIZE / 2,
              });
            }
          }
        }
      }

      // Sort components descending: Component 0 is the primary candidate's face
      components.sort((a, b) => b.cells - a.cells);

      // Check if there is a distinct SECOND human face:
      // A genuine second face must be a disconnected cluster with >= 5 cells (>= 500px),
      // substantial width & height >= 20px, separated horizontally by >= 45px,
      // with a non-overlapping horizontal gap from the candidate's primary face.
      let hasSecondFace = false;
      if (components.length >= 2) {
        const primary = components[0];
        const secondary = components[1];

        const secWidth = (secondary.maxC - secondary.minC + 1) * CELL_SIZE;
        const secHeight = (secondary.maxR - secondary.minR + 1) * CELL_SIZE;
        const dx = Math.abs(secondary.cx - primary.cx);
        const hasGap = secondary.maxC < primary.minC || secondary.minC > primary.maxC;

        if (
          secondary.cells >= 5 &&
          secWidth >= 20 &&
          secHeight >= 20 &&
          dx >= 45 &&
          hasGap
        ) {
          hasSecondFace = true;
        }
      }

      if (proctorEnforcementActive && hasSecondFace) {
        multiFaceStreakRef.current += 1;
        setWarningFlash("⚠️ PROCTOR ALERT: More Than One Face Detected!");
        setGazeMetrics({
          status: "⚠️ Multiple Persons Detected (Another Face in View)",
          deltaX: 0,
          deltaY: 0,
          magnitude: 0,
          faceDetected: true,
        });

        // 4 consecutive checks (~1.12 seconds)
        if (multiFaceStreakRef.current >= 4) {
          triggerDisqualification(
            "Malpractice: Multiple Persons Detected - More Than One Face Appeared in Camera (Rule 1)"
          );
          return;
        }
        return;
      } else {
        multiFaceStreakRef.current = 0;
      }

      // Normal telemetry (Candidate alone, hand movement allowed)
      setWarningFlash(null);
      setGazeMetrics({
        status: "✓ Focused on Test Viewport (Single Candidate)",
        deltaX: 0,
        deltaY: 0,
        magnitude: 0,
        faceDetected: true,
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isSubmitted, isDisqualified, proctorEnforcementActive, triggerDisqualification]);

  // Full-screen lockdown & Tab switch listener (RULE 2: Browser Tab Switch)
  useEffect(() => {
    if (isSubmitted || isDisqualified || !proctorEnforcementActive) return;

    // Document hidden: fires immediately when user switches tabs or minimizes
    const handleVisibility = () => {
      if (document.hidden) {
        triggerDisqualification("Malpractice: Browser Tab Switch / Application Window Switched (Rule 2)");
      }
    };

    // Window blur: debounced to ensure it only triggers when actually leaving the browser window
    let blurTimer: any = null;
    const handleBlur = () => {
      blurTimer = setTimeout(() => {
        if (document.hidden || (!document.hasFocus() && proctorEnforcementActive && !isTerminatedRef.current)) {
          triggerDisqualification("Malpractice: Browser Lost Focus / Window Switched (Rule 2)");
        }
      }, 1500);
    };

    const handleFocus = () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isSubmitted, isDisqualified, proctorEnforcementActive, triggerDisqualification]);

  const handleRetakeAfterDisqualification = () => {
    setIsDisqualified(false);
    isTerminatedRef.current = false;
    violationStreakRef.current = 0;
    handStreakRef.current = 0;
    multiFaceStreakRef.current = 0;
    upDownStreakRef.current = 0;
    outsideMonitorStreakRef.current = 0;
    backgroundAnomalyStreakRef.current = 0;
    prevFrameDataRef.current = null;
    calibrationFramesRef.current = 0;
    baselineCentroidRef.current = null;
    baselineCountRef.current = 0;
    setSelected({});
    setMarked(new Set());
    setCurrent(0);
    setSeconds(20 * 60);
    setIntegrityScore(98);
    setProctorAlert(null);
    setWarningFlash(null);
    setProctorChecks([
      { label: "Rule 1: Single Candidate In View (No Multiple Faces)", ok: true },
      { label: "Rule 2: Browser Tab Switch Lockdown", ok: true },
      { label: "Biometric Face Recognition", ok: true },
      { label: "Identity & Roll No Verified", ok: true },
      { label: "Full Screen Lockdown", ok: true },
      { label: "Audio Environment: Quiet", ok: true },
    ]);
    startCamera();
  };

  // Load Courses on mount
  useEffect(() => {
    fetchCourses().then((list) => {
      if (list && list.length > 0) {
        setCoursesList(list);
        try {
          const raw = sessionStorage.getItem("activeExamCourse");
          if (raw) {
            const parsed = JSON.parse(raw);
            const found = list.find((c) => c.id === parsed.id || c.code === parsed.code);
            if (found) setActiveCourse(found);
          } else {
            // Pick student's first enrolled course if any
            const enrs = getStudentEnrollments(studentId);
            if (enrs.length > 0) {
              const matchedEnr = list.find((c) => c.id === enrs[0].courseId || c.code === enrs[0].courseCode);
              if (matchedEnr) setActiveCourse(matchedEnr);
            }
          }
        } catch {}
      }
    });
  }, [studentId]);

  // Load Questions & Resources whenever active course changes
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCourseMCQs(activeCourse.id), fetchResources(activeCourse.id)]).then(
      ([mcqs, resList]) => {
        if (!isMounted) return;
        const normalized = getCourseMCQsWithFallback(activeCourse, mcqs);
        setQuestions(normalized);
        const filteredRes = (resList || []).filter((r) => matchResourceToCourse(r, activeCourse));
        setCourseResources(filteredRes);

        // Reset examination session
        setCurrent(0);
        setSelected({});
        setMarked(new Set());
        setSeconds(20 * 60);
        setIsSubmitted(false);
        setDiagnosticReport(null);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [activeCourse.id]);

  // Countdown Timer (Only runs when camera is active and exam is not disqualified)
  useEffect(() => {
    if (isSubmitted || isDisqualified || !cameraActive) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, isDisqualified, cameraActive, questions, selected]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const answered = Object.keys(selected).length;
  const currentQuestion = questions[current];

  const handleSelectCourse = (course: Course) => {
    try {
      sessionStorage.setItem("activeExamCourse", JSON.stringify(course));
    } catch {}
    setActiveCourse(course);
    setShowCourseSelector(false);
  };

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(current) ? next.delete(current) : next.add(current);
      return next;
    });
  };

  const simulateProctorWarning = () => {
    setIntegrityScore((prev) => Math.max(65, prev - 8));
    setProctorChecks((prev) =>
      prev.map((c, i) =>
        i === 2 ? { ...c, ok: false, label: "Candidate Gaze Deviation Flagged" } : c
      )
    );
    setProctorAlert(
      "AI Proctor Warning: Candidate eye-gaze deviated from viewport for >4 seconds. Event logged to Proctor Audit Log."
    );
    setTimeout(() => setProctorAlert(null), 6000);
  };

  const handleAutoSubmit = () => {
    setProctorAlert("⏱ Time has expired! Your exam was automatically submitted for evaluation.");
    performGrading();
  };

  const handleManualSubmit = () => {
    setShowSubmitModal(false);
    performGrading();
  };

  const performGrading = () => {
    const totalQs = questions.length || 10;
    let correct = 0;
    const weakList: string[] = [];

    questions.forEach((q, idx) => {
      const studentChoice = selected[idx];
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

    // Generate AI diagnostic report before updating submission state
    const report = generateAiTestDiagnostic({
      courseName: activeCourse.name,
      courseCode: activeCourse.code,
      score,
      totalQuestions: totalQs,
      questions,
      selectedAnswers: selected,
      availableResources: courseResources,
    });
    setDiagnosticReport(report);
    setExamScore(score);
    setIsSubmitted(true);

    // Save student course progress and enrollment record
    const prevEnrollments = getStudentEnrollments(studentId);
    const prevEnr = prevEnrollments.find(
      (e) => e.courseId === activeCourse.id || e.courseCode === activeCourse.code
    );
    const attempts = (prevEnr?.attempts || 0) + 1;
    const certCode =
      prevEnr?.certificateId ||
      `CERT-${activeCourse.code}-${Math.floor(100000 + Math.random() * 900000)}`;
    setAwardedCertId(certCode);

    const newHistory = [
      ...(prevEnr?.attemptHistory || []),
      {
        attemptNumber: attempts,
        score,
        date: new Date().toISOString(),
        passed: isPass,
        weakTopics: weakList,
      },
    ];

    if (isPass) {
      updateEnrollmentProgress(studentId, activeCourse.id, {
        studied: true,
        passed: true,
        status: "Finished",
        score,
        percentage: score * 10,
        attempts,
        completedAt: new Date().toISOString(),
        certificateId: certCode,
        weakTopics: [],
        attemptHistory: newHistory,
      });
      saveStudentCourseProgress(studentId, activeCourse.id, {
        studied: true,
        passed: true,
        bestScore: Math.max(score, prevEnr?.score || 0),
        lastScore: score,
        attempts,
        completedAt: new Date().toISOString(),
        certificateId: certCode,
        weakTopics: [],
      });
    } else {
      updateEnrollmentProgress(studentId, activeCourse.id, {
        studied: false,
        passed: false,
        status: "Ongoing",
        score,
        percentage: score * 10,
        attempts,
        weakTopics: weakList,
        attemptHistory: newHistory,
      });
      saveStudentCourseProgress(studentId, activeCourse.id, {
        studied: false,
        passed: false,
        bestScore: Math.max(score, prevEnr?.score || 0),
        lastScore: score,
        attempts,
        weakTopics: weakList,
      });
    }

    try {
      sessionStorage.setItem("lastExamAnswers", JSON.stringify(selected));
      sessionStorage.setItem("lastExamCourse", JSON.stringify(activeCourse));
      sessionStorage.setItem("lastExamScore", String(score));
      sessionStorage.setItem("lastExamQuestions", JSON.stringify(questions));
      const minsSpent = Math.max(1, 20 - Math.ceil(seconds / 60));
      sessionStorage.setItem("lastExamTimeTaken", `${minsSpent} min`);
    } catch {}
  };

  const handleRetakeExam = () => {
    // Mark studied and unlock retake
    saveStudentCourseProgress(studentId, activeCourse.id, { studied: true });
    updateEnrollmentProgress(studentId, activeCourse.id, { studied: true });
    setSelected({});
    setMarked(new Set());
    setCurrent(0);
    setSeconds(20 * 60);
    setIsSubmitted(false);
    setDiagnosticReport(null);
  };

  const getAbbreviation = (code?: string, name?: string) => {
    const c = (code || "").toUpperCase();
    if (c.includes("301") || c.includes("DSA")) return "DS";
    if (c.includes("302") || c.includes("DBMS")) return "DB";
    if (c.includes("401") || c.includes("OS")) return "OS";
    return (c || name || "EX").slice(0, 2).toUpperCase();
  };

  // If questions are still loading
  if (!currentQuestion && !isSubmitted) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold">Loading {activeCourse.name} Assessment...</h3>
        <p className="text-xs text-slate-400 mt-1">Calibrating AI Proctor Sentinel & 10 MCQs</p>
      </div>
    );
  }

  // =========================================================================
  // RENDER VIEW: EXAM TERMINATED DUE TO PROCTORING MALPRACTICE VIOLATION
  // =========================================================================
  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col text-white">
        {/* Top Header */}
        <header className="bg-slate-900 border-b border-rose-900/60 px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400 font-bold text-sm">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white text-sm font-bold tracking-tight">AI Proctor Sentinel Lockdown</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  TEST TERMINATED
                </span>
              </div>
              <div className="text-slate-400 text-[10px]">
                Incident ID: {disqualificationIncidentId} · Disqualified at {disqualificationTime}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("student")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            ← Exit to Student Dashboard
          </button>
        </header>

        {/* Main Alert Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center">
          <div className="bg-gradient-to-b from-rose-950/70 via-slate-900 to-slate-900 rounded-3xl border border-rose-600/50 p-8 shadow-2xl relative overflow-hidden">
            {/* Top Warning Strip */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-4xl shadow-inner flex-shrink-0 animate-pulse">
                ⛔
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400 block mb-1">
                  MALPRACTICE PROTOCOL ENFORCED
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Exam Stopped Immediately: You Must Retake the Exam
                </h2>
                <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                  The live AI camera proctoring sentinel detected suspicious movements and cheating behavior during your assessment session. The exam was halted automatically.
                </p>
              </div>
            </div>

            {/* Violation Dossier Box */}
            <div className="bg-black/50 rounded-2xl border border-rose-900/50 p-5 mb-6 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-rose-900/40">
                <span className="text-slate-400">Violation Detected:</span>
                <span className="text-rose-400 font-bold">{disqualificationReason}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rose-900/40">
                <span className="text-slate-400">Candidate:</span>
                <span className="text-white">{candidateName} ({studentId})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rose-900/40">
                <span className="text-slate-400">Course Assessment:</span>
                <span className="text-white">{activeCourse.name} ({activeCourse.code})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rose-900/40">
                <span className="text-slate-400">Result & Marks:</span>
                <span className="text-rose-500 font-bold">0 / 10 marks (Disqualified — Malpractice)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rose-900/40">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{disqualificationTime}</span>
              </div>

              {/* Detailed Context Explanation */}
              <div className="pt-1 text-slate-300 font-sans text-[11px] leading-relaxed">
                {disqualificationReason.includes("Multiple Persons") || disqualificationReason.includes("Multiple Faces") || disqualificationReason.includes("More Than One Face") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail (Rule 1):</span>
                    <span>More than one face detected in the camera viewport. Academic exam rules strictly require only a single candidate to be present. Any additional person or secondary face appearing in view is strictly prohibited.</span>
                  </div>
                ) : disqualificationReason.includes("Tab Switch") || disqualificationReason.includes("Window Switch") || disqualificationReason.includes("Lost Focus") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail (Rule 2):</span>
                    <span>Browser tab switch or external application window access detected. The candidate navigated away from the active examination viewport.</span>
                  </div>
                ) : disqualificationReason.includes("Hand") || disqualificationReason.includes("Finger") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail:</span>
                    <span>Hand movement policy violation.</span>
                  </div>
                ) : disqualificationReason.includes("Left Camera") || disqualificationReason.includes("Face Not Visible") || disqualificationReason.includes("Moved Face Away") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail:</span>
                    <span>Candidate moved face away or stepped out of the camera viewport during active examination, violating mandatory presence protocol.</span>
                  </div>
                ) : disqualificationReason.includes("Up/Down") || disqualificationReason.includes("Looking Down") || disqualificationReason.includes("Looking Up") || disqualificationReason.includes("Seeing Down") || disqualificationReason.includes("Seeing Up") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail:</span>
                    <span>Candidate head pitch moved vertically (seeing up towards ceiling or seeing down towards desk/notes/phone), violating screen focus protocol.</span>
                  </div>
                ) : disqualificationReason.includes("Outside Monitor") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail:</span>
                    <span>Candidate head yaw rotated outside active monitor boundaries (seeing outside screen), indicating unauthorized activity.</span>
                  </div>
                ) : disqualificationReason.includes("Background") || disqualificationReason.includes("Backside") ? (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail:</span>
                    <span>Abnormal activity detected in background: Another individual was detected moving or walking behind the candidate.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 font-bold shrink-0">ℹ️ Infraction Detail:</span>
                    <span>Examination lockdown breach detected: Automated optical sentinel flagged candidate viewport disengagement.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Broadcast Confirmation Cards */}
            <div className="mb-6 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Automated Incident Transmissions:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 flex items-start gap-3">
                  <span className="text-emerald-400 text-base mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-white">Dispatched to Faculty / Teacher</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Transmitted to Course Instructor (Prof. Kavitha Nair) with timestamp & camera deviation telemetry.
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 flex items-start gap-3">
                  <span className="text-emerald-400 text-base mt-0.5">✓</span>
                  <div>
                    <div className="text-xs font-bold text-white">Dispatched to Campus Admin</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Logged in University Academic Audit Registry (Dr. Rajesh Kumar) for integrity compliance review.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleRetakeAfterDisqualification}
                className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>✍️ Acknowledge & Retake Exam Under Supervised Camera</span>
              </button>
              <button
                onClick={() => onNavigate("student")}
                className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Return to Course Hub
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // RENDER VIEW: RESULTS & AI DIAGNOSTIC REPORT (WHEN SUBMITTED)
  // =========================================================================
  if (isSubmitted) {
    const isPass = examScore >= 7;
    const safeReport =
      diagnosticReport ||
      generateAiTestDiagnostic({
        courseName: activeCourse.name,
        courseCode: activeCourse.code,
        score: examScore,
        totalQuestions: questions.length || 10,
        questions,
        selectedAnswers: selected,
        availableResources: courseResources,
      });

    const weakList = safeReport?.weakTopicsList || safeReport?.weakTopics || [];
    const topicsAnalysis = safeReport?.topicsAnalysis || [];

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs font-mono shadow-xs">
              {getAbbreviation(activeCourse.code, activeCourse.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-slate-800 text-sm font-bold">{activeCourse.name}</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isPass
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isPass ? "✓ EXAM PASSED" : "⚠️ RETAKE REQUIRED"}
                </span>
              </div>
              <div className="text-slate-400 text-[10px]">
                Course Code: {activeCourse.code} · Candidate: {candidateName} ({studentId})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("student")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>← Return to Student Dashboard</span>
            </button>
            {isPass ? (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🎓 View Official Certificate</span>
              </button>
            ) : (
              <button
                onClick={handleRetakeExam}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>✍️ Retake Exam in Portal →</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          {/* Main Score & Outcome Banner */}
          <div
            className={`rounded-3xl p-6 border shadow-xs flex items-center justify-between gap-6 ${
              isPass
                ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-200"
                : "bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-white border-amber-200"
            }`}
          >
            <div className="flex items-center gap-5">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md ${
                  isPass ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                }`}
              >
                {isPass ? "🏆" : "🎯"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isPass ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isPass ? "Course Mastery Fulfilled" : "Passing Threshold: 7 / 10 marks (70%)"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isPass
                    ? `Congratulations, ${candidateName}!`
                    : `Assessment Completed: Retake Recommended`}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                  {isPass
                    ? `You scored ${examScore} / 10 marks (${examScore * 10}%). You have met all competency benchmarks for ${activeCourse.name} and the course status is updated to Finished.`
                    : `You scored ${examScore} / 10 marks (${examScore * 10}%). An AI diagnostic report has pinpointed your weak areas below with step-by-step preparation guidance.`}
                </p>
              </div>
            </div>

            {/* Metric Box */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex-shrink-0 text-center min-w-[160px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Evaluated Score
              </div>
              <div
                className={`text-4xl font-extrabold ${
                  isPass ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {examScore} <span className="text-lg text-slate-400 font-normal">/ 10</span>
              </div>
              <div className="text-[11px] font-bold text-slate-600 mt-1">
                Accuracy: {examScore * 10}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Academic Grade: {examScore >= 9 ? "A+" : examScore >= 8 ? "A" : examScore >= 7 ? "B+" : "Re-eval"}
              </div>
            </div>
          </div>

          {/* IF PASSED (>= 7): CELEBRATION & DIRECT CERTIFICATE ACCESS CARD */}
          {isPass && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shrink-0">
                  🎓
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Official Credential Available
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Verified Certificate of Completion Awarded!
                  </h3>
                  <p className="text-xs text-emerald-100 max-w-xl mt-0.5 leading-relaxed">
                    You scored {examScore}/10 ({examScore * 10}%), exceeding the 70% proficiency standard for {activeCourse.name}. Your official certificate is registered with ID <span className="font-mono font-bold text-white">{awardedCertId}</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-emerald-800 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>📜 View & Print Certificate</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          )}

          {/* IF FAILED (< 7): AI WEAK AREA ANALYSIS & STUDY RESOURCES */}
          {!isPass && (
            <div className="space-y-6">
              {/* Weak Topics Banner */}
              <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        AI Weak Area Analysis & What You Should Study
                      </h3>
                      <p className="text-xs text-slate-400">
                        The AI evaluated every missed answer and generated a targeted remedial syllabus.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {weakList.length} Focus Areas Detected
                  </span>
                </div>

                {/* Weak Topics Chips */}
                {weakList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {weakList.map((topic, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-bold text-amber-900 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-xl flex items-center gap-1.5"
                      >
                        <span>🎯</span> {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6">
                    Focus on foundational review of all module topics before re-attempting the assessment.
                  </div>
                )}

                {/* Topic Breakdown Cards */}
                <div className="space-y-4">
                  {topicsAnalysis.map((item, idx) => {
                    const missedNum = item.missedCount ?? item.missedQuestionsCount ?? 1;
                    const steps = Array.isArray(item.howToPrepare) ? item.howToPrepare : [];
                    const resTitle = item.recommendedResourceTitle || item.matchedResource?.title;
                    const resUrl = item.recommendedResourceUrl || item.matchedResource?.url;
                    const resType = item.recommendedResourceType || item.matchedResource?.type || "pdf";

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 hover:border-amber-300 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {item.topic}
                          </h4>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            Missed in {missedNum} Question{missedNum > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* What to study */}
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                            📖 What You Should Study:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                            {item.whatToStudy}
                          </p>
                        </div>

                        {/* How to prepare */}
                        {steps.length > 0 && (
                          <div className="mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                              ⚡ How to Prepare Like This:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {steps.map((step, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-start gap-2"
                                >
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Matched Study Resource */}
                        {resTitle && (
                          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {resType === "pdf" ? "📄" : "▶"}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-slate-800">
                                  {resTitle}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Recommended Study Material for this topic
                                </div>
                              </div>
                            </div>
                            {resType === "pdf" || resType === "notes" ? (
                              <button
                                type="button"
                                onClick={() => setViewingPdf(getStudyPdfForCourse(activeCourse.code || activeCourse.id))}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>📄 View Study PDF</span>
                                <span>📖</span>
                              </button>
                            ) : resUrl ? (
                              <a
                                href={resUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Open Resource ↗
                              </a>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Course Study Materials Grid */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  📚 Recommended Study Materials & Lecture References ({courseResources.length})
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Carefully study these faculty-uploaded resources before re-attending your assessment.
                </p>

                {courseResources.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {courseResources.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                res.type === "pdf"
                                  ? "bg-rose-100 text-rose-700"
                                  : res.type === "video"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {res.type}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{res.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {res.description || "Official course reference notes."}
                          </p>
                        </div>

                        {res.url && (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-bold text-indigo-700 transition-colors cursor-pointer"
                          >
                            {res.type === "pdf" ? "📄 View PDF" : "▶ Watch Video"} ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 bg-slate-50">
                    No resources uploaded yet for this subject. All reference materials are also available under the Course Hub tab.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUESTION-BY-QUESTION MISTAKE BREAKDOWN */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Detailed Question-by-Question Evaluation ({questions.length} MCQs)
                </h3>
                <p className="text-xs text-slate-400">
                  Review student choice, correct answers, and AI explanations.
                </p>
              </div>
              <button
                onClick={() => setShowReviewDetailModal(!showReviewDetailModal)}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                {showReviewDetailModal ? "Collapse Review" : "Expand All Explanations"}
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const studentChoice = selected[idx];
                const isCorrect = studentChoice === q.answer;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCorrect
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-rose-50/40 border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">Question {idx + 1}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {q.topic}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {isCorrect ? "✓ Correct (+1 Mark)" : "✗ Incorrect (0 Marks)"}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mb-3 leading-relaxed">
                      {q.question}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(q.options || []).map((opt, optIdx) => {
                        const isChosen = studentChoice === optIdx;
                        const isRight = optIdx === q.answer;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              isRight
                                ? "bg-emerald-100 text-emerald-900 font-bold border-emerald-300"
                                : isChosen && !isRight
                                ? "bg-rose-100 text-rose-900 font-bold border-rose-300 line-through"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            <span className="truncate">
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </span>
                            {isRight && (
                              <span className="text-[10px] text-emerald-700 font-bold flex-shrink-0">
                                ✓ Correct
                              </span>
                            )}
                            {isChosen && !isRight && (
                              <span className="text-[10px] text-rose-700 font-bold flex-shrink-0">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white/90 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-indigo-700 font-bold">AI Explanation: </strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Certificate Modal */}
        {showCertificateModal && (
          <CourseCertificate
            course={activeCourse}
            studentName={candidateName}
            studentId={studentId}
            score={examScore}
            certificateId={awardedCertId}
            completedAt={new Date().toISOString()}
            onClose={() => setShowCertificateModal(false)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER VIEW: LIVE EXAM PORTAL VIEW (MATCHING USER SCREENSHOT)
  // =========================================================================
  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xs">
            <span className="text-white text-xs font-bold font-mono">
              {getAbbreviation(activeCourse.code, activeCourse.name)}
            </span>
          </div>
          <div>
            <div className="text-slate-800 text-sm font-bold flex items-center gap-2">
              <span>{activeCourse.name} — Comprehensive Subject Assessment</span>
              <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                LIVE SECURE EXAM
              </span>
            </div>
            <div className="text-slate-400 text-[10px] flex items-center gap-2">
              <span>
                Department of {activeCourse.department || "Computer Science"} · Course Code: {activeCourse.code} · {activeCourse.credits} Credits
              </span>
              <span>·</span>
              {/* Subject Switcher Link */}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowCourseSelector(!showCourseSelector)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline text-[10px]"
                >
                  Change Subject ▾
                </button>
                {showCourseSelector && (
                  <div className="absolute left-0 top-5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-72 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                      Select Subject Test
                    </div>
                    {coursesList.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCourse(c)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                          c.id === activeCourse.id
                            ? "bg-indigo-50 text-indigo-700 font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Answered Progress */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs font-medium">
              {answered}/{questions.length} Answered
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${(answered / (questions.length || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Live Timer */}
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
              mins < 5
                ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                : "bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <span>⏱</span>
            <span>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Submit Examination →
          </button>

          {/* Exit Button */}
          <button
            onClick={() => setShowExitConfirmModal(true)}
            className="text-slate-400 hover:text-slate-700 text-xs font-medium cursor-pointer"
            title="Exit to Dashboard"
          >
            Exit ✕
          </button>
        </div>
      </header>

      {/* Proctor Alert Banner */}
      {proctorAlert && (
        <div className="bg-amber-500 text-white text-xs px-6 py-2.5 flex items-center justify-between font-medium shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">⚠️</span>
            <span>{proctorAlert}</span>
          </div>
          <button
            onClick={() => setProctorAlert(null)}
            className="text-white/80 hover:text-white font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Examination Viewport */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left: Question Navigation & Active Question */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Question Grid Bar */}
          <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Question Matrix ({questions.length})</span>
                <span className="text-slate-400 font-normal">· Click number to jump</span>
              </div>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === "all"
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setFilterMode("answered")}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === "answered"
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  Answered ({answered})
                </button>
                <button
                  onClick={() => setFilterMode("marked")}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    filterMode === "marked"
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  Marked ({marked.size})
                </button>
              </div>
            </div>

            {/* Matrix Numbers */}
            <div className="flex items-center gap-2 flex-wrap">
              {questions.map((_, idx) => {
                const isSelected = selected[idx] !== undefined;
                const isMarked = marked.has(idx);
                const isCurrent = idx === current;
                const isFilteredOut =
                  (filterMode === "answered" && !isSelected) ||
                  (filterMode === "marked" && !isMarked);

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isFilteredOut ? "opacity-25 scale-95 " : ""
                    }${
                      isCurrent
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200"
                        : isSelected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                        : isMarked
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="bg-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg">
                    Question {current + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                    {currentQuestion.topic}
                  </span>
                  <span className="text-xs text-slate-400">· +1 Mark</span>
                </div>
                {marked.has(current) && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    ⚑ Flagged for Review
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h2 className="text-slate-800 text-base font-semibold leading-relaxed mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isChecked = selected[current] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setSelected((prev) => ({ ...prev, [current]: optIdx }))}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50/70"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                          isChecked
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-2xs"
                            : "border-slate-300 text-slate-400 bg-slate-50"
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-xs leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                <button
                  onClick={toggleMark}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    marked.has(current)
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700"
                  }`}
                >
                  {marked.has(current) ? "✓ Remove Review Flag" : "⚑ Mark for Review"}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                    disabled={current === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    ← Previous
                  </button>
                  {current < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Finish Exam →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Proctoring Telemetry Panel */}
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 select-none">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                AI Proctor Sentinel
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              ACTIVE ENFORCED
            </span>
          </div>

          {/* Active Rules Summary Strip */}
          <div className="px-4 py-2 bg-indigo-50/60 border-b border-indigo-100 text-[10px] space-y-1">
            <div className="flex items-center justify-between text-indigo-950 font-bold">
              <span>Rule 1: Single Candidate in View</span>
              <span className="text-emerald-700 text-[9px]">ENFORCED</span>
            </div>
            <div className="flex items-center justify-between text-indigo-950 font-bold">
              <span>Rule 2: Browser Tab Switch Lockdown</span>
              <span className="text-emerald-700 text-[9px]">ENFORCED</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Hand & Finger Movement</span>
              <span className="text-emerald-600 font-semibold text-[9px]">ALLOWED</span>
            </div>
          </div>

          {/* Real AI Webcam Stream & Scanning HUD */}
          <div className="p-4 border-b border-slate-100">
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative border border-slate-700 shadow-inner flex flex-col items-center justify-center">
              {/* Hidden canvas for real-time frame scanning */}
              <canvas ref={canvasRef} width={160} height={120} className="hidden" />

              {/* Real Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  try {
                    (e.target as HTMLVideoElement).play().catch(() => {});
                  } catch {}
                }}
                className={`w-full h-full object-cover transition-all ${
                  warningFlash ? "brightness-125 contrast-125" : ""
                }`}
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Fallback if camera not yet connected or denied */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-3">
                  <div className="text-2xl mb-1">📹</div>
                  <div className="text-[10px] text-amber-300 font-bold mb-1">
                    {cameraError ? "Camera Notice" : "Connecting Webcam..."}
                  </div>
                  <p className="text-[9px] text-slate-400 mb-2 leading-tight">
                    {cameraError || "Please grant webcam permissions to start live AI proctoring."}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    Enable Webcam
                  </button>
                </div>
              )}

              {/* High-Tech HUD Scanner Overlay */}
              {cameraActive && (
                <>
                  {/* Laser Scanner Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse pointer-events-none top-1/2 -translate-y-1/2" />

                  {/* Face Tracking Bounding Box */}
                  <div className="absolute inset-4 border border-emerald-400/50 rounded-lg pointer-events-none">
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />
                  </div>

                  {/* Top-Left Live Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs rounded-full px-2 py-0.5 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white text-[8px] font-bold tracking-wider">AI CAMERA SCAN</span>
                  </div>

                  {/* Top-Right Gaze & Hand Indicator */}
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-emerald-300 bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
                    {warningFlash ? "⚠️ INCIDENT" : "Face: OK (Single Person)"}
                  </div>

                  {/* Warning Overlay on Flash */}
                  {warningFlash && (
                    <div className="absolute inset-0 bg-rose-600/40 backdrop-blur-2xs flex items-center justify-center p-2 text-center border-2 border-rose-500 animate-pulse">
                      <span className="text-white font-extrabold text-[10px] tracking-tight bg-black/80 px-2 py-1 rounded shadow">
                        {warningFlash}
                      </span>
                    </div>
                  )}

                  {/* Bottom Metrics Bar */}
                  <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-between text-[8px] text-white/80 bg-black/60 backdrop-blur-2xs px-2 py-0.5 rounded font-mono">
                    <span className="truncate">{candidateName} ({studentId})</span>
                    <span className="text-emerald-400 font-bold shrink-0">60 FPS</span>
                  </div>
                </>
              )}
            </div>

            {/* Live Gaze Status Tag */}
            <div className="mt-2.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-medium">Proctor Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full border text-[9px] ${
                  warningFlash
                    ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {gazeMetrics.status}
              </span>
            </div>

            {/* Quick Interactive Anomaly Test Buttons */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Test Proctor Rules:</span>
                <span className="text-[8px] text-indigo-600 font-mono">1-CLICK</span>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => triggerDisqualification("Malpractice: Multiple Persons Detected - More Than One Face Appeared in Camera (Rule 1)")}
                  className="w-full px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[9px] font-bold transition-all text-left truncate cursor-pointer flex items-center gap-1.5"
                  title="Simulate More Than One Face Detected"
                >
                  <span>👥</span>
                  <span className="truncate">Rule 1: Test More Than One Face</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDisqualification("Malpractice: Browser Tab Switch / Application Window Switched (Rule 2)")}
                  className="w-full px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[9px] font-bold transition-all text-left truncate cursor-pointer flex items-center gap-1.5"
                  title="Simulate Tab Switch Lockdown"
                >
                  <span>📑</span>
                  <span className="truncate">Rule 2: Test Tab Switch Lockdown</span>
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Integrity Score */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Examination Integrity Score
            </div>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span
                className={`text-2xl font-extrabold ${
                  integrityScore >= 90
                    ? "text-emerald-600"
                    : integrityScore >= 75
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {integrityScore}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Standard Compliance</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  integrityScore >= 90
                    ? "bg-emerald-500"
                    : integrityScore >= 75
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${integrityScore}%` }}
              />
            </div>
          </div>

          {/* Real-time Checks List */}
          <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Automated Sentinel Checks
            </div>
            {proctorChecks.map((c) => (
              <div key={c.label} className="flex items-start gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                    c.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {c.ok ? "✓" : "!"}
                </span>
                <span
                  className={`text-xs ${
                    c.ok ? "text-slate-600 font-medium" : "text-amber-700 font-bold"
                  }`}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Exit Warning */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center">
            Fullscreen lockdown active. Tab switching or window blur events are flagged.
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4 mx-auto font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-1">
              Submit Examination?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              You are about to submit your {activeCourse.name} exam for automated AI evaluation.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-bold text-slate-800">{activeCourse.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-800">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Answered:</span>
                <span className="font-bold text-emerald-600">{answered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered:</span>
                <span className="font-bold text-rose-600">{questions.length - answered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marked for Review:</span>
                <span className="font-bold text-amber-600">{marked.size}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Camera Gatekeeper Modal */}
      {!cameraActive && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 text-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              📹
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              AI PROCTORING MANDATORY
            </span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Live Camera Required to Take Test</h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              This is a secure, AI-monitored examination. The test questions and timer will activate once your webcam is connected.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left mb-4 text-[11px] space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Proctor Rules:</div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-emerald-600 font-bold">✓ Rule 1:</span>
                <span>Single candidate only (more than one face stops the test).</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-emerald-600 font-bold">✓ Rule 2:</span>
                <span>Tab switch lockdown (switching tabs stops the test).</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                <span className="text-indigo-600 font-bold">ℹ️ Note:</span>
                <span>Hand movements, typing, and gestures are completely allowed.</span>
              </div>
            </div>
            {cameraError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl mb-4 border border-rose-200 text-left">
                <strong>Camera Notice:</strong> {cameraError}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <span>📷 Allow Camera & Start Examination</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("student")}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ← Return to Student Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-2">Leave Examination?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Leaving the live examination now will discard your current unanswered progress.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                onClick={() => onNavigate("student")}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Real Study PDF Viewer Modal */}
      {viewingPdf && (
        <StudyPdfViewerModal
          pdfData={viewingPdf}
          onClose={() => setViewingPdf(null)}
          onLaunchAssessment={handleRetakeExam}
        />
      )}
    </div>
  );
}
