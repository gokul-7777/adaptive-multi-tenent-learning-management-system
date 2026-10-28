export type TopicStatus = "done" | "current" | "pending";

export interface CognitiveMetric {
  label: string;
  value: number;
  color: string;
  percentile: number;
  description: string;
  studyStrategy: string;
  recommendedResource?: {
    title: string;
    platform: string;
    type: string;
    description: string;
  };
}

export interface TopicPreparation {
  recommendedCourse: {
    title: string;
    platform: string;
    instructor?: string;
    level: string;
    badge: string;
    description: string;
    linkUrl?: string;
  };
  textbook: {
    title: string;
    chapter: string;
    authors: string;
    pageRef?: string;
  };
  interactiveTool: {
    name: string;
    platform: string;
    feature: string;
  };
  practicePlatform: {
    title: string;
    curatedProblems: string[];
  };
  keyExamTips: string[];
}

export interface LearningTopic {
  id: string;
  label: string;
  status: TopicStatus;
  difficulty: "Foundation" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  summary: string;
  codeSnippet?: string;
  practiceProblem?: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
  prepMaterials: TopicPreparation;
}

export interface LearningPhase {
  label: string;
  topics: string[];
  done: number;
}

export interface AiProfileResult {
  metrics: CognitiveMetric[];
  strengths: string[];
  improvements: string[];
  insight: string;
  disclaimer: string;
}

export interface LearningPlanResult {
  phases: LearningPhase[];
  topics: LearningTopic[];
  recommendation: {
    title: string;
    difficulty: string;
    description: string;
    matchScore: number;
    estimatedTime: string;
    recommendedCourse?: TopicPreparation["recommendedCourse"];
    textbook?: TopicPreparation["textbook"];
  };
  progressPercent: number;
  estimate: string;
}

export interface ProctoringStatus {
  checks: Array<{ label: string; ok: boolean; warn?: boolean }>;
  integrityScore: number;
  statusText: string;
  suspiciousText: string;
  sessionMinutes: number;
}

export interface ExamQuestion {
  id: number;
  no: number;
  question: string;
  text: string;
  topic: string;
  options: string[];
  correct: number;
  answer: number;
  marks: number;
  explanation: string;
}

export interface ExamInsightResult {
  summary: {
    overallScore: number;
    grade: string;
    correctAnswers: string;
    timeTaken: string;
  };
  topicData: Array<{ topic: string; score: number }>;
  pieData: Array<{ name: string; value: number; color: string }>;
  insight: string;
  classComparison: {
    rank: string;
    classAverage: number;
    highest: number;
    score: number;
  };
}

export interface DashboardAiSuggestion {
  title: string;
  body: string;
  cta: string;
}

export const INITIAL_COGNITIVE_METRICS: CognitiveMetric[] = [
  {
    label: "Logical Reasoning",
    value: 84,
    color: "#6366f1",
    percentile: 88,
    description: "Evaluates recursive thinking, invariant proofs, and structural deduction.",
    studyStrategy: "Use tree diagrams and state transition tables when solving recurrence relations.",
    recommendedResource: {
      title: "MIT 6.042J: Mathematics for Computer Science — Invariants & Induction",
      platform: "MIT OpenCourseWare",
      type: "Free Academic Course",
      description: "Rigorous proofs, structural induction, and recurrence relations for algorithmic deduction.",
    },
  },
  {
    label: "Memory & Retention",
    value: 89,
    color: "#8b5cf6",
    percentile: 94,
    description: "Measures recall of algorithmic templates, syntax tokens, and standard library APIs.",
    studyStrategy: "Leverage spaced repetition flashcards for graph traversal and sorting complexity tables.",
    recommendedResource: {
      title: "Anki Mastery Deck: Data Structures & Algorithms Core Invariants",
      platform: "AnkiWeb Spaced Repetition",
      type: "Active Recall Tool",
      description: "High-yield cards covering asymptotic bounds, tree rotations, and sorting stability.",
    },
  },
  {
    label: "Attention & Focus",
    value: 78,
    color: "#3b82f6",
    percentile: 79,
    description: "Sustained vigilance during dry-running complex code loops and edge cases.",
    studyStrategy: "Adopt 25-minute Pomodoro coding sprints with zero-notification periods.",
    recommendedResource: {
      title: "Deep Work Protocol for Software Systems & Algorithm Analysis",
      platform: "Academic Productivity Guild",
      type: "Study Framework",
      description: "Structured interval focus training designed to eliminate distraction during dry-run tracing.",
    },
  },
  {
    label: "Problem Solving",
    value: 72,
    color: "#f59e0b",
    percentile: 73,
    description: "Ability to decompose novel open-ended problems into optimal subproblems.",
    studyStrategy: "Practice classifying competitive programming problems into greedy, divide & conquer, or DP.",
    recommendedResource: {
      title: "Competitive Programmer's Handbook: Decomposition & Paradigms",
      platform: "University of Helsinki / CSES",
      type: "Open Textbook & Guide",
      description: "Comprehensive breakdown of problem decomposition, greedy heuristics, and dynamic programming.",
    },
  },
  {
    label: "Numerical Ability",
    value: 68,
    color: "#ef4444",
    percentile: 65,
    description: "Asymptotic math analysis, master theorem calculations, and discrete probability.",
    studyStrategy: "Work through 5 Master Theorem log substitutions daily before starting code implementations.",
    recommendedResource: {
      title: "Master Theorem & Asymptotic Analysis Drills (Discrete Math Foundations)",
      platform: "Stanford Lagunita",
      type: "Problem Set & Video Tutorials",
      description: "Step-by-step master theorem practice sets with log-base substitution proofs.",
    },
  },
  {
    label: "Processing Speed",
    value: 81,
    color: "#10b981",
    percentile: 84,
    description: "Rapid mental simulation of pointer mutations, array indexing, and memory offsets.",
    studyStrategy: "Timed debug drills: locate off-by-one errors in snippet cards within 60 seconds.",
    recommendedResource: {
      title: "Timed Algorithmic Drills & Pointer Manipulation Sprints",
      platform: "LeetCode Fast Track",
      type: "Interactive Drills",
      description: "60-second pointer debug challenges to elevate mental simulation velocity.",
    },
  },
];

export function buildCognitiveProfile(customMetrics?: CognitiveMetric[]): AiProfileResult {
  const metrics = customMetrics || INITIAL_COGNITIVE_METRICS;
  const sorted = [...metrics].sort((a, b) => b.value - a.value);

  return {
    metrics,
    strengths: sorted.slice(0, 2).map((m) => m.label),
    improvements: sorted.slice(-2).map((m) => m.label),
    insight: `Your profile highlights exceptional ${sorted[0].label} (${sorted[0].value}%) and ${sorted[1].label} (${sorted[1].value}%). We have aligned your AI curriculum to scaffold ${sorted[sorted.length - 1].label} via step-by-step interactive proofs and curated open-access materials.`,
    disclaimer: "Educational learning profile generated by AMLE AI Cognitive Engine. Formatted for adaptive pedagogical scaffolding.",
  };
}

export const INITIAL_TOPICS: LearningTopic[] = [
  {
    id: "arrays",
    label: "Arrays & Dynamic Buffers",
    status: "done",
    difficulty: "Foundation",
    estimatedMinutes: 30,
    summary: "Contiguous memory layout, cache locality, amortized O(1) resizing, and prefix sums.",
    codeSnippet: `// Prefix Sum Array Optimization
const prefix = new Array(arr.length + 1).fill(0);
for (let i = 0; i < arr.length; i++) {
  prefix[i + 1] = prefix[i] + arr[i];
}
const rangeSum = (L, R) => prefix[R + 1] - prefix[L];`,
    practiceProblem: {
      question: "What is the amortized cost of inserting an element into a dynamic array that doubles in size?",
      options: ["O(n)", "O(1)", "O(log n)", "O(n^2)"],
      answer: 1,
      explanation: "Although resizing takes O(n), it occurs infrequently. Spreading the cost over n insertions yields an amortized O(1) time complexity.",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "MIT 6.006: Introduction to Algorithms — Lecture 2: Data Structures & Dynamic Arrays",
        platform: "MIT OpenCourseWare",
        instructor: "Prof. Erik Demaine & Prof. Srini Devadas",
        level: "Undergraduate Core",
        badge: "Free University Course",
        description: "Covers contiguous allocation, pointer math, geometric resizing proof, and memory hierarchy caching benefits.",
        linkUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      },
      textbook: {
        title: "Introduction to Algorithms (CLRS), 4th Edition",
        chapter: "Chapter 17: Amortized Analysis & Dynamic Tables",
        authors: "T. Cormen, C. Leiserson, R. Rivest, C. Stein",
        pageRef: "pp. 450–475",
      },
      interactiveTool: {
        name: "VisuAlgo Dynamic Array & Vector Simulator",
        platform: "VisuAlgo.net",
        feature: "Interactive step-by-step memory allocation, vector geometric growth, and prefix sum indexing.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Two Sum (LeetCode #1)", "Product of Array Except Self (#238)", "Subarray Sum Equals K (#560)"],
      },
      keyExamTips: [
        "Contiguous indexing is strictly O(1) due to direct memory offset calculation: base + (index * size).",
        "Geometric doubling gives amortized O(1) append; arithmetic growth (adding a fixed k elements) degrades to O(n).",
      ],
    },
  },
  {
    id: "linked",
    label: "Singly & Doubly Linked Lists",
    status: "done",
    difficulty: "Foundation",
    estimatedMinutes: 35,
    summary: "Pointer manipulations, two-pointer Floyd cycle detection, and reverse sub-list algorithms.",
    codeSnippet: `// Floyd's Cycle Detection Algorithm (Tortoise and Hare)
let slow = head, fast = head;
while (fast && fast.next) {
  slow = slow.next;
  fast = fast.next.next;
  if (slow === fast) return true; // Cycle detected!
}
return false;`,
    practiceProblem: {
      question: "In Floyd's cycle detection algorithm, if a loop exists, what is the relative speed difference?",
      options: ["1 step per iteration", "2 steps per iteration", "log(n) steps", "Zero difference"],
      answer: 0,
      explanation: "Fast moves 2 nodes and slow moves 1 node, so the gap closes by exactly 1 node every loop iteration.",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "Algorithms, Part I: Analysis & Elementary Data Structures",
        platform: "Princeton University / Coursera",
        instructor: "Prof. Robert Sedgewick & Kevin Wayne",
        level: "Foundational CS",
        badge: "Top-Rated Academic Course",
        description: "Rigorous coverage of reference-based memory structures, resizing bags, and circular pointer invariants.",
        linkUrl: "https://www.coursera.org/learn/algorithms-part1",
      },
      textbook: {
        title: "Algorithms, 4th Edition",
        chapter: "Section 1.3: Bags, Queues, and Stacks via Linked Lists",
        authors: "Robert Sedgewick & Kevin Wayne",
        pageRef: "pp. 120–165",
      },
      interactiveTool: {
        name: "Visualgo Singly & Doubly Linked List Visualizer",
        platform: "VisuAlgo.net",
        feature: "Visual animation of pointer rewire operations, head/tail insertion, and cycle detection.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Reverse Linked List (LeetCode #206)", "Linked List Cycle II (#142)", "Merge Two Sorted Lists (#21)"],
      },
      keyExamTips: [
        "Always instantiate a dummy/sentinel node (`dummy.next = head`) to eliminate null-check edge cases.",
        "Floyd's algorithm detects circular cycles in O(n) time and O(1) auxiliary space without hash table overhead.",
      ],
    },
  },
  {
    id: "stacks",
    label: "Stacks, Queues & Monotonic Deques",
    status: "done",
    difficulty: "Foundation",
    estimatedMinutes: 40,
    summary: "LIFO/FIFO guarantees, Monotonic Stack for Next Greater Element, and Sliding Window Max.",
    codeSnippet: `// Monotonic Stack for Next Greater Element
const result = new Array(arr.length).fill(-1);
const stack = []; // indices
for (let i = 0; i < arr.length; i++) {
  while (stack.length && arr[stack[stack.length - 1]] < arr[i]) {
    result[stack.pop()] = arr[i];
  }
  stack.push(i);
}`,
    practiceProblem: {
      question: "Which data structure is optimal for evaluating mathematical expressions in Postfix notation?",
      options: ["Queue", "Stack", "Binary Heap", "Hash Map"],
      answer: 1,
      explanation: "A Stack allows operand storage until an operator is encountered to pop the last two operands.",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "Stanford CS106B: Programming Abstractions — Stacks & Queues",
        platform: "Stanford Online",
        instructor: "Prof. Julie Zelenski & Prof. Jerry Cain",
        level: "Intermediate CS",
        badge: "Free University Course",
        description: "Explores LIFO/FIFO guarantees, call stack unwinding, postfix arithmetic parsing, and monotonic deques.",
        linkUrl: "https://web.stanford.edu/class/cs106b/",
      },
      textbook: {
        title: "Introduction to Algorithms (CLRS), 4th Edition",
        chapter: "Chapter 10: Elementary Data Structures (Stacks & Queues)",
        authors: "T. Cormen, C. Leiserson, R. Rivest, C. Stein",
        pageRef: "pp. 232–245",
      },
      interactiveTool: {
        name: "Algorithm Visualizer: Monotonic Stack Simulator",
        platform: "algorithm-visualizer.org",
        feature: "Real-time step-by-step state display of monotonic stacks resolving next-greater-element index queries.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Valid Parentheses (LeetCode #20)", "Min Stack (#155)", "Sliding Window Maximum (#239)"],
      },
      keyExamTips: [
        "A monotonic decreasing stack finds the next greater element in aggregate linear O(n) time.",
        "Postfix evaluation scans tokens left-to-right: push numbers onto stack, pop top two when seeing an operator.",
      ],
    },
  },
  {
    id: "trees",
    label: "Binary Search Trees & AVL Balancing",
    status: "current",
    difficulty: "Intermediate",
    estimatedMinutes: 45,
    summary: "Tree traversals, height-balanced BST invariants, and LL/RR/LR/RL rotation mechanisms.",
    codeSnippet: `// In-Order Traversal (Sorted order for BST)
function inOrder(node, visited = []) {
  if (!node) return visited;
  inOrder(node.left, visited);
  visited.push(node.val);
  inOrder(node.right, visited);
  return visited;
}`,
    practiceProblem: {
      question: "What is the maximum height difference permitted between subtrees in an AVL tree?",
      options: ["0", "1", "2", "log(n)"],
      answer: 1,
      explanation: "By AVL definition, the balance factor (height(left) - height(right)) must be in {-1, 0, +1}.",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "UC Berkeley CS61B: Data Structures — Balanced Search Trees & AVL Rotations",
        platform: "UC Berkeley EECS Open Courseware",
        instructor: "Prof. Josh Hug",
        level: "Undergraduate Core",
        badge: "Renowned University Curriculum",
        description: "Comprehensive breakdown of BST invariants, single/double tree rotations (LL/RR/LR/RL), and logarithmic bounds.",
        linkUrl: "https://sp21.datastructur.es/",
      },
      textbook: {
        title: "Introduction to Algorithms (CLRS), 4th Edition",
        chapter: "Chapter 12 (BSTs) & Chapter 13 (Height-Balanced Trees)",
        authors: "T. Cormen, C. Leiserson, R. Rivest, C. Stein",
        pageRef: "pp. 286–338",
      },
      interactiveTool: {
        name: "USFCA AVL Tree Interactive Rotation Simulator",
        platform: "University of San Francisco (USFCA Visualizations)",
        feature: "Live interactive animation showing auto-balancing single and double rotations when balance factor exceeds 1.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Validate Binary Search Tree (LeetCode #98)", "Lowest Common Ancestor of a BST (#235)", "Balance a BST (#1382)"],
      },
      keyExamTips: [
        "In-order traversal of any valid Binary Search Tree strictly produces keys in sorted non-decreasing order.",
        "AVL balance factor is strictly defined as `height(left) - height(right)`. Valid values are only -1, 0, and +1.",
      ],
    },
  },
  {
    id: "heaps",
    label: "Binary Heaps & Priority Queues",
    status: "pending",
    difficulty: "Intermediate",
    estimatedMinutes: 40,
    summary: "Complete binary tree representation in arrays, heapify up/down, and building heaps in O(n).",
    codeSnippet: `// Heap parent & children formulas in 0-indexed array
const parent = (i) => Math.floor((i - 1) / 2);
const leftChild = (i) => 2 * i + 1;
const rightChild = (i) => 2 * i + 2;`,
    practiceProblem: {
      question: "What is the time complexity to build a binary heap from an unsorted array of n elements?",
      options: ["O(n log n)", "O(n)", "O(1)", "O(n^2)"],
      answer: 1,
      explanation: "Using bottom-up heapify, the sum of node heights converges to O(n) linear time.",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "MIT 6.006: Introduction to Algorithms — Lecture 4: Heaps & Heap Sort",
        platform: "MIT OpenCourseWare",
        instructor: "Prof. Erik Demaine",
        level: "Undergraduate Core",
        badge: "Free University Course",
        description: "Array-backed binary tree representation, max/min heap properties, sift-up, sift-down, and the linear-time build proof.",
        linkUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/lecture-4-heaps-and-heap-sort/",
      },
      textbook: {
        title: "Introduction to Algorithms (CLRS), 4th Edition",
        chapter: "Chapter 6: Heapsort & Priority Queues",
        authors: "T. Cormen, C. Leiserson, R. Rivest, C. Stein",
        pageRef: "pp. 151–170",
      },
      interactiveTool: {
        name: "VisuAlgo Binary Heap & Priority Queue Interactive Sandbox",
        platform: "VisuAlgo.net",
        feature: "Interactive array tree index mapping, step-by-step heapify sift-down, and priority queue extract-min demo.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Kth Largest Element in an Array (LeetCode #215)", "Top K Frequent Elements (#347)", "Find Median from Data Stream (#295)"],
      },
      keyExamTips: [
        "Building a heap from an unordered array using bottom-up sift-down takes O(n) time, NOT O(n log n).",
        "In a 0-indexed array: parent(i) = floor((i - 1) / 2), left(i) = 2i + 1, right(i) = 2i + 2.",
      ],
    },
  },
  {
    id: "graphs",
    label: "Graph Traversals (BFS, DFS & Topo Sort)",
    status: "pending",
    difficulty: "Advanced",
    estimatedMinutes: 50,
    summary: "Adjacency lists, cycle detection in directed graphs, Kahn's algorithm, and bipartite matching.",
    codeSnippet: `// Topological Sort using Kahn's Algorithm (BFS + In-degree)
const inDegree = new Array(V).fill(0);
// fill inDegree ...
const queue = [];
for (let i = 0; i < V; i++) if (inDegree[i] === 0) queue.push(i);
// process zero in-degree queue...`,
    practiceProblem: {
      question: "Which condition must be met for a graph to have a valid Topological Sort?",
      options: ["Must be undirected", "Must be a DAG (Directed Acyclic Graph)", "Must be fully connected", "Must contain Euler cycle"],
      answer: 1,
      explanation: "Topological ordering is only possible on Directed Acyclic Graphs without circular dependencies.",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "Stanford CS161: Design and Analysis of Algorithms — Graph Search & DAGs",
        platform: "Stanford Online",
        instructor: "Prof. Mary Wootters & Prof. Moses Charikar",
        level: "Upper-Division CS",
        badge: "Flagship Algorithm Course",
        description: "Formal proofs and implementations of BFS shortest paths, DFS discovery/finish times, and topological DAG scheduling.",
        linkUrl: "https://web.stanford.edu/class/cs161/",
      },
      textbook: {
        title: "Introduction to Algorithms (CLRS), 4th Edition",
        chapter: "Chapter 22: Elementary Graph Algorithms",
        authors: "T. Cormen, C. Leiserson, R. Rivest, C. Stein",
        pageRef: "pp. 589–620",
      },
      interactiveTool: {
        name: "CS Academy Graph Editor & Topological Sort Simulator",
        platform: "CS Academy",
        feature: "Interactive DAG topological sort simulation, cycle detection highlight, and adjacency matrix/list generator.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Course Schedule I & II (LeetCode #207, #210)", "Number of Islands (#200)", "Clone Graph (#133)"],
      },
      keyExamTips: [
        "Topological Sort is strictly valid only on Directed Acyclic Graphs (DAGs). Back edges during DFS indicate cycles.",
        "Kahn's algorithm uses an in-degree array: initialize with nodes of in-degree 0; decrement neighbor in-degrees on pop.",
      ],
    },
  },
  {
    id: "dp",
    label: "Dynamic Programming Foundations",
    status: "pending",
    difficulty: "Advanced",
    estimatedMinutes: 60,
    summary: "Overlapping subproblems, optimal substructure, memoization vs bottom-up tabulation.",
    codeSnippet: `// 0/1 Knapsack Bottom-Up Table
const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
for (let i = 1; i <= n; i++) {
  for (let w = 0; w <= W; w++) {
    dp[i][w] = wt[i-1] <= w ? Math.max(val[i-1] + dp[i-1][w-wt[i-1]], dp[i-1][w]) : dp[i-1][w];
  }
}`,
    practiceProblem: {
      question: "What is the space complexity of bottom-up Fibonacci with state compression?",
      options: ["O(n)", "O(1)", "O(log n)", "O(2^n)"],
      answer: 1,
      explanation: "Since each state only requires the last two values (prev1 and prev2), space reduces to O(1).",
    },
    prepMaterials: {
      recommendedCourse: {
        title: "MIT 6.006: Introduction to Algorithms — Dynamic Programming I & II",
        platform: "MIT OpenCourseWare",
        instructor: "Prof. Erik Demaine",
        level: "Undergraduate Core",
        badge: "World-Class Algorithm Lecture",
        description: "Mastering the 5-step DP framework: subproblem definition, recurrence relation, DAG order, base cases, and solution extraction.",
        linkUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      },
      textbook: {
        title: "Algorithms",
        chapter: "Chapter 6: Dynamic Programming (Knapsack & Sequence Alignment)",
        authors: "S. Dasgupta, C. Papadimitriou, and U. Vazirani",
        pageRef: "pp. 156–187",
      },
      interactiveTool: {
        name: "VisuAlgo Dynamic Programming Tabulation Sandbox",
        platform: "VisuAlgo.net",
        feature: "Interactive 2D matrix cell fill animation for 0/1 Knapsack and Longest Common Subsequence.",
      },
      practicePlatform: {
        title: "Curated High-Yield Practice Problems",
        curatedProblems: ["Climbing Stairs (LeetCode #70)", "Coin Change (#322)", "Longest Increasing Subsequence (#300)"],
      },
      keyExamTips: [
        "Distinguish between Top-Down (Memoization with recursion stack) and Bottom-Up (Tabulation with iterative array/matrix).",
        "Identify state-compression opportunities: if state `dp[i]` depends only on `dp[i-1]`, reduce space from O(n) to O(1).",
      ],
    },
  },
];

export function buildLearningPlan(topicsState?: LearningTopic[]): LearningPlanResult {
  const topics = topicsState || INITIAL_TOPICS;
  const doneCount = topics.filter((t) => t.status === "done").length;
  const totalCount = topics.length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  const phases: LearningPhase[] = [
    {
      label: "Foundation",
      topics: ["Arrays & Dynamic Buffers", "Singly & Doubly Linked Lists", "Stacks, Queues & Monotonic Deques"],
      done: topics.filter((t) => ["arrays", "linked", "stacks"].includes(t.id) && t.status === "done").length,
    },
    {
      label: "Intermediate",
      topics: ["Binary Search Trees & AVL Balancing", "Binary Heaps & Priority Queues"],
      done: topics.filter((t) => ["trees", "heaps"].includes(t.id) && t.status === "done").length,
    },
    {
      label: "Advanced",
      topics: ["Graph Traversals (BFS, DFS & Topo Sort)", "Dynamic Programming Foundations"],
      done: topics.filter((t) => ["graphs", "dp"].includes(t.id) && t.status === "done").length,
    },
  ];

  const currentTopic = topics.find((t) => t.status === "current") || topics.find((t) => t.status === "pending") || topics[0];

  return {
    phases,
    topics,
    recommendation: {
      title: currentTopic.label,
      difficulty: currentTopic.difficulty,
      description: `Recommended by AI engine based on your 89% Memory score and recent assessment data. Mastering ${currentTopic.label} will elevate your Problem Solving dimension.`,
      matchScore: 94,
      estimatedTime: `${currentTopic.estimatedMinutes} minutes`,
      recommendedCourse: currentTopic.prepMaterials?.recommendedCourse,
      textbook: currentTopic.prepMaterials?.textbook,
    },
    progressPercent,
    estimate: `${Math.max(1, Math.ceil((totalCount - doneCount) * 0.8))} weeks remaining`,
  };
}

export function buildProctorStatus(): ProctoringStatus {
  return {
    checks: [
      { label: "Biometric Face Recognition", ok: true },
      { label: "Identity & Roll No Verified", ok: true },
      { label: "Single Candidate In View", ok: true },
      { label: "Full Screen Lockdown", ok: true },
      { label: "Audio Environment: Quiet", ok: true },
      { label: "Secondary Monitor Blocked", ok: true },
    ],
    integrityScore: 96,
    statusText: "Proctoring AI: Monitoring Active · 0 Violations",
    suspiciousText: "Session is running under compliant proctoring conditions. Webcam and audio feeds are continuously analyzed.",
    sessionMinutes: 42,
  };
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    no: 1,
    question: "What is the worst-case time complexity of searching for an element in a balanced AVL Tree with n nodes?",
    text: "What is the worst-case time complexity of searching for an element in a balanced AVL Tree with n nodes?",
    topic: "Balanced Trees",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct: 1,
    answer: 1,
    marks: 2,
    explanation: "Because an AVL tree strictly maintains |height(left) - height(right)| <= 1, tree height is mathematically bounded to 1.44 log2(n), guaranteeing O(log n) worst-case search.",
  },
  {
    id: 2,
    no: 2,
    question: "In a min-heap with n elements stored in a 0-indexed array, where is the right child of the element at index i located?",
    text: "In a min-heap with n elements stored in a 0-indexed array, where is the right child of the element at index i located?",
    topic: "Heaps",
    options: ["2 * i", "2 * i + 1", "2 * i + 2", "i / 2"],
    correct: 2,
    answer: 2,
    marks: 2,
    explanation: "For any 0-indexed array representation of a complete binary tree, the left child is at 2*i + 1 and the right child is at 2*i + 2.",
  },
  {
    id: 3,
    no: 3,
    question: "Which of the following conditions is REQUIRED for a graph to possess a valid Topological Sort?",
    text: "Which of the following conditions is REQUIRED for a graph to possess a valid Topological Sort?",
    topic: "Graphs",
    options: [
      "The graph must be undirected and connected",
      "The graph must be a Directed Acyclic Graph (DAG)",
      "The graph must contain at least one Eulerian cycle",
      "The graph must be complete with V*(V-1)/2 edges",
    ],
    correct: 1,
    answer: 1,
    marks: 2,
    explanation: "Topological sorting is an ordering of vertices such that for every directed edge u -> v, u appears before v. Circular dependencies prevent this, so it is only valid on DAGs.",
  },
  {
    id: 4,
    no: 4,
    question: "What is the optimal time complexity to build a Binary Heap from an unsorted array of n elements?",
    text: "What is the optimal time complexity to build a Binary Heap from an unsorted array of n elements?",
    topic: "Heaps",
    options: ["O(1)", "O(n)", "O(n log n)", "O(n^2)"],
    correct: 1,
    answer: 1,
    marks: 2,
    explanation: "Using bottom-up heap construction (sifting down from floor(n/2) down to 0), the sum of node heights converges to O(n) linear time.",
  },
  {
    id: 5,
    no: 5,
    question: "In the 0/1 Knapsack problem with n items and maximum capacity W, what is the standard dynamic programming table size?",
    text: "In the 0/1 Knapsack problem with n items and maximum capacity W, what is the standard dynamic programming table size?",
    topic: "Dynamic Programming",
    options: ["(n) x (W)", "(n + 1) x (W + 1)", "(2^n) x (W)", "(n) x (log W)"],
    correct: 1,
    answer: 1,
    marks: 2,
    explanation: "To account for 0 items and 0 capacity base cases, the bottom-up DP table is structured as (n + 1) rows and (W + 1) columns.",
  },
  {
    id: 6,
    no: 6,
    question: "Floyd's Cycle Detection Algorithm (Tortoise & Hare) detects a cycle in a linked list using what space complexity?",
    text: "Floyd's Cycle Detection Algorithm (Tortoise & Hare) detects a cycle in a linked list using what space complexity?",
    topic: "Linked Lists",
    options: ["O(n)", "O(log n)", "O(1)", "O(k) where k is cycle length"],
    correct: 2,
    answer: 2,
    marks: 2,
    explanation: "Floyd's algorithm uses only two pointer variables (slow and fast), requiring O(1) auxiliary space.",
  },
  {
    id: 7,
    no: 7,
    question: "Which data structure is most appropriate to evaluate an arithmetic expression in Reverse Polish Notation (Postfix)?",
    text: "Which data structure is most appropriate to evaluate an arithmetic expression in Reverse Polish Notation (Postfix)?",
    topic: "Stacks & Queues",
    options: ["FIFO Queue", "Monotonic Deque", "LIFO Stack", "Max-Heap"],
    correct: 2,
    answer: 2,
    marks: 2,
    explanation: "In postfix evaluation, operands are pushed onto a LIFO stack. When an operator is encountered, the two most recent operands are popped, evaluated, and the result is pushed back.",
  },
  {
    id: 8,
    no: 8,
    question: "What is the amortized cost per append operation for a dynamic array that doubles its capacity when full?",
    text: "What is the amortized cost per append operation for a dynamic array that doubles its capacity when full?",
    topic: "Arrays",
    options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
    correct: 2,
    answer: 2,
    marks: 2,
    explanation: "Although copying takes O(n) when doubling, this occurs infrequently. The aggregate cost of n insertions is ~3n, yielding an amortized O(1) cost per insertion.",
  },
  {
    id: 9,
    no: 9,
    question: "Which tree traversal of a Binary Search Tree (BST) visits nodes in strictly ascending non-decreasing order?",
    text: "Which tree traversal of a Binary Search Tree (BST) visits nodes in strictly ascending non-decreasing order?",
    topic: "Trees",
    options: ["Pre-Order", "In-Order", "Post-Order", "Level-Order"],
    correct: 1,
    answer: 1,
    marks: 2,
    explanation: "In-order traversal visits left subtree, root, then right subtree. Since all keys in left < root < right in a BST, in-order yields sorted order.",
  },
  {
    id: 10,
    no: 10,
    question: "Kahn's Algorithm for Topological Sorting uses which data structure to keep track of ready vertices?",
    text: "Kahn's Algorithm for Topological Sorting uses which data structure to keep track of ready vertices?",
    topic: "Graphs",
    options: [
      "A Queue holding vertices with in-degree equal to 0",
      "A Stack holding vertices with out-degree equal to 0",
      "A Min-Heap of edge weights",
      "A Disjoint Set Union (DSU) structure",
    ],
    correct: 0,
    answer: 0,
    marks: 2,
    explanation: "Kahn's algorithm computes the in-degree of all vertices and enqueues those with in-degree 0. As vertices are dequeued, neighbor in-degrees are decremented.",
  },
];

export function buildExamInsights(
  answers?: Record<number, number>,
  customQuestions?: Array<{
    id: string | number;
    no?: number;
    question?: string;
    text?: string;
    topic: string;
    answer?: number;
    correct?: number;
    options?: string[];
    explanation?: string;
  }>,
  timeTakenStr?: string
): ExamInsightResult {
  const qs = customQuestions && customQuestions.length > 0 ? customQuestions : EXAM_QUESTIONS;
  let correct = 0;
  const total = qs.length || 10;

  if (answers) {
    qs.forEach((q, idx) => {
      const choice = answers[idx] !== undefined ? answers[idx] : answers[q.id as any];
      const correctAns = q.correct !== undefined ? q.correct : q.answer !== undefined ? q.answer : 0;
      if (choice === correctAns) correct++;
    });
  } else {
    correct = 8;
  }

  const overallScore = Math.round((correct / total) * 100);

  const topicScores: Record<string, { total: number; correct: number }> = {};
  qs.forEach((q, idx) => {
    const t = q.topic || "Core Concepts";
    if (!topicScores[t]) topicScores[t] = { total: 0, correct: 0 };
    topicScores[t].total += 1;
    const choice = answers ? (answers[idx] !== undefined ? answers[idx] : answers[q.id as any]) : undefined;
    const correctAns = q.correct !== undefined ? q.correct : q.answer !== undefined ? q.answer : 0;
    if (answers && choice === correctAns) {
      topicScores[t].correct += 1;
    } else if (!answers) {
      topicScores[t].correct += idx <= 7 ? 1 : 0;
    }
  });

  const topicData = Object.entries(topicScores).map(([topic, data]) => ({
    topic,
    score: Math.round((data.correct / (data.total || 1)) * 100),
  }));

  const pieData = [
    { name: "Correct", value: correct, color: "#10b981" },
    { name: "Incorrect", value: Math.max(0, total - correct), color: "#ef4444" },
  ];

  let grade = "A";
  if (overallScore >= 90) grade = "A+";
  else if (overallScore >= 80) grade = "A";
  else if (overallScore >= 70) grade = "B+";
  else if (overallScore >= 60) grade = "C";
  else grade = "Re-eval";

  const weakTopics = Object.entries(topicScores)
    .filter(([_, data]) => data.correct < data.total)
    .map(([topic]) => topic);

  let insight = "";
  if (overallScore >= 70) {
    insight = `Outstanding conceptual grasp across fundamental principles (Score: ${overallScore}%). Verified competency benchmarks achieved for all required topic areas.`;
  } else {
    insight = `Assessment score is ${overallScore}% (Passing threshold: 70% / 7 marks). AI diagnostic analysis pinpointed weak accuracy in: ${
      weakTopics.join(", ") || "Core Concepts"
    }. Review the faculty study materials and retake the assessment.`;
  }

  return {
    summary: {
      overallScore,
      grade,
      correctAnswers: `${correct}/${total}`,
      timeTaken: timeTakenStr || "18 min",
    },
    topicData: topicData.length
      ? topicData
      : [
          { topic: "Trees", score: 85 },
          { topic: "Heaps", score: 100 },
          { topic: "Graphs", score: 75 },
          { topic: "Dynamic Programming", score: 65 },
          { topic: "Arrays & Lists", score: 90 },
        ],
    pieData,
    insight,
    classComparison: {
      rank:
        overallScore >= 90
          ? "2 / 62"
          : overallScore >= 80
          ? "4 / 62"
          : overallScore >= 70
          ? "11 / 62"
          : "28 / 62",
      classAverage: 73,
      highest: 98,
      score: overallScore,
    },
  };
}

export function buildDashboardSuggestion(): DashboardAiSuggestion {
  return {
    title: "AI Recommendation",
    body: "Your DSA consistency is at 84%, but Graph and DP accuracy can be strengthened. We synthesized a 20-minute adaptive practice session on BST Rotations.",
    cta: "Start 20-Min Practice",
  };
}

export function askAiTutor(prompt: string): string {
  const p = prompt.trim().toLowerCase();

  // 1. Natural Greetings & Chit-chat
  if (p === "hi" || p === "hello" || p === "hey" || p.startsWith("hi ") || p.startsWith("hello ") || p.startsWith("hey ") || p === "good morning" || p === "good afternoon" || p === "good evening") {
    return "Hello! I am your AI Academic Advisor. How can I help you with your studies today? Feel free to ask about your course topics, weak areas diagnosed from your test, study strategies, or how to earn your subject certificate!";
  }

  if (p.includes("how are you") || p.includes("how r u")) {
    return "I'm doing great and ready to assist you! Are you preparing for an upcoming assessment or reviewing study materials uploaded by your professors?";
  }

  if (p.includes("who are you") || p.includes("what can you do") || p.includes("what is your role")) {
    return "I am your integrated Academic AI Advisor. I monitor your study progress across all enrolled subjects, analyze your test performance against the pass benchmark (7/10), diagnose weak topics, recommend specific teacher resources for revision, and guide you until you complete and earn your course certificates.";
  }

  if (p.includes("thank") || p === "thanks" || p === "thx") {
    return "You're very welcome! Keep up the great work. Remember: consistent study and reviewing faculty notes will ensure high scores in all your assessments!";
  }

  // 2. Assessment Rules, Weak Areas, Retakes & Passing Score
  if (p.includes("pass mark") || p.includes("passing score") || p.includes("pass") && p.includes("mark")) {
    return "The passing requirement for each course assessment is 7 out of 10 marks (70%).\n• Once you study all course materials uploaded by your teacher, the 10-question MCQ test unlocks.\n• If you score 7 or above, the course is marked Completed and you receive an official verified Certificate.\n• If you score below 7, I identify your weak topics so you can review the teacher's resources and take the test again!";
  }

  if (p.includes("weak") || p.includes("failed") || p.includes("low score") || p.includes("below 7") || p.includes("improve") || p.includes("retake") || p.includes("retry")) {
    return "Here is how to recover and boost your score:\n1. Check your diagnostic feedback: Any questions answered incorrectly highlight specific weak topics.\n2. Review the teacher-uploaded study materials (PDFs, lecture notes, video links) specifically for those focus areas.\n3. Re-take the 10-question MCQ assessment. As soon as you hit 7/10 or higher, you pass and unlock your Certificate with your name and unique ID!";
  }

  if (p.includes("certificate") || p.includes("cert") || p.includes("degree") || p.includes("completion")) {
    return "To earn your official Course Certificate:\n1. Open your enrolled course and study the required resources.\n2. Attend the 10-question faculty assessment.\n3. Score at least 7/10 (70%).\n4. Your Certificate of Completion will be generated immediately with your name, course title, and verified serial code!";
  }

  // 3. Curriculum Resources & Reference Materials
  if (p.includes("reference") || p.includes("material") || p.includes("course") || p.includes("book") || p.includes("resource") || p.includes("pdf")) {
    return "Here are the top academic resources for your curriculum:\n• Teacher Uploads: Review the PDFs, slides, and reference links published directly by your faculty on the Course Hub.\n• Standard Textbooks: 'Introduction to Algorithms' (CLRS), 'Database System Concepts' (Silberschatz), 'Computer Networking' (Kurose & Ross).\n• Visualizers: VisuAlgo.net & CS Academy for step-by-step algorithms, memory diagrams, and tree rotations.";
  }

  // 4. Subject Specific Concepts
  if (p.includes("dijkstra") || p.includes("shortest path")) {
    return "Dijkstra's Algorithm finds the shortest path from a single source vertex to all other vertices in a non-negative weighted graph. Key mechanics: It maintains a priority queue of unvisited nodes and iteratively relaxes edges, achieving O((V + E) log V) time complexity using a min-heap.";
  }

  if (p.includes("avl") || p.includes("binary search tree") || p.includes("bst") || p.includes("tree rotation")) {
    return "An AVL tree is a self-balancing Binary Search Tree where the balance factor (height(left) - height(right)) of every node must be -1, 0, or +1. If an insertion or deletion violates this property, standard rotations (Single: LL, RR; Double: LR, RL) restore O(log n) height balance in O(1) time.";
  }

  if (p.includes("dynamic programming") || p.includes(" dp ") || p === "dp" || p.includes("memoization")) {
    return "Dynamic Programming solves complex optimization problems by breaking them into overlapping subproblems with optimal substructure. Key steps: (1) Define state variables, (2) Formulate the recurrence relation, (3) Specify base conditions, and (4) Implement either memoization (top-down) or tabulation (bottom-up).";
  }

  if (p.includes("sql") || p.includes("database") || p.includes("dbms") || p.includes("normalization")) {
    return "In Database Management Systems, Normalization minimizes data redundancy and avoids update anomalies. Remember the progression: 1NF requires atomic values, 2NF removes partial key dependencies, and 3NF eliminates transitive dependencies (every non-key attribute must depend directly on the primary key).";
  }

  if (p.includes("operating system") || p.includes("deadlock") || p.includes("paging") || p.includes("virtual memory")) {
    return "In Operating Systems, deadlocks occur when four Coffman conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one condition prevents deadlocks. Virtual Memory utilizes demand paging and page tables with TLBs to provide processes with contiguous virtual address spaces.";
  }

  if (p.includes("network") || p.includes("tcp") || p.includes("udp") || p.includes("osi")) {
    return "Computer Networks relies on the layered protocol stack. TCP provides connection-oriented, reliable, in-order byte stream delivery with flow and congestion control (3-way handshake SYN/SYN-ACK/ACK). UDP is connectionless, minimal overhead, and ideal for real-time video or gaming where latency matters more than packet loss recovery.";
  }

  if (p.includes("exam") || p.includes("test") || p.includes("prepare") || p.includes("tips") || p.includes("strategy")) {
    return "To excel in your course assessment:\n1. Carefully read the faculty notes and lecture PDFs uploaded for your subject.\n2. Focus on conceptual definitions, algorithmic runtimes, and practical trade-offs.\n3. Take your time during the 10 MCQs—each question is worth 1 mark, and you need 7 marks to pass and earn your certificate!";
  }

  if (p.includes("cgpa") || p.includes("grade") || p.includes("gpa")) {
    return "Your Cumulative CGPA is dynamically computed from your verified assessment marks across all completed subjects. Maintaining a score of 8/10 or higher keeps your CGPA in the distinguished First Class with Distinction tier (8.0+ / 10).";
  }

  // 5. Intelligent Conversational Fallback
  return `I understand you're asking about "${prompt}".\n\nTo help you effectively: make sure to review the lecture resources uploaded by your teacher under this course. After studying the materials, take the 10-question MCQ assessment. If you need clarification on any specific formula, concept, or algorithm from this subject, feel free to ask me!`;
}

export interface WeakTopicAnalysis {
  topic: string;
  missedCount: number;
  missedQuestionsCount?: number;
  whatToStudy: string;
  howToPrepare: string[];
  recommendedResourceTitle?: string;
  recommendedResourceType?: string;
  recommendedResourceUrl?: string;
  matchedResource?: any;
}

export interface QuestionMistakeReview {
  questionIndex: number;
  questionNumber: number;
  questionText: string;
  topic: string;
  studentAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
  explanation: string;
  actionableTip: string;
}

export interface AiTestDiagnosticReport {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passMark: number;
  courseName: string;
  courseCode: string;
  summaryMessage: string;
  readinessVerdict: string;
  weakTopicsList: string[];
  weakTopics?: string[];
  topicsAnalysis: WeakTopicAnalysis[];
  mistakes: QuestionMistakeReview[];
}

export interface GenerateAiDiagnosticParams {
  courseName: string;
  courseCode: string;
  score: number;
  totalQuestions?: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    answer: number;
    topic: string;
    explanation: string;
  }>;
  selectedAnswers: Record<number, number>;
  availableResources?: Array<{
    id: string;
    title: string;
    type: "pdf" | "video" | "link" | "notes";
    url?: string;
    description?: string;
  }>;
}

export const TOPIC_PREPARATION_GUIDES: Record<
  string,
  {
    whatToStudy: string;
    howToPrepare: string[];
    keywords: string[];
    actionableTip: string;
  }
> = {
  "Balanced Trees & AVL": {
    whatToStudy:
      "AVL Tree balancing invariants: Balance Factor = height(left) - height(right) ∈ {-1, 0, 1}. Master Single Rotations (LL for left-heavy, RR for right-heavy) and Double Rotations (LR, RL). Memorize guaranteed worst-case search, insert, and delete complexity of O(log n).",
    howToPrepare: [
      "Open Unit 1 PDF: Review the rotation trees and balance factor calculations on pages 4–9.",
      "Trace step-by-step insertions on paper for keys [30, 20, 10] (requiring LL rotation) and [10, 30, 20] (requiring RL rotation).",
      "Verify node heights after each rotation to ensure balance factor is strictly within [-1, +1].",
      "Remember that In-Order traversal of any BST/AVL tree yields strictly sorted non-decreasing keys.",
    ],
    keywords: ["avl", "tree", "bst", "rotation"],
    actionableTip: "Draw the tree nodes on paper and calculate Balance Factor = Height(L) - Height(R) at every ancestor.",
  },
  "Heaps & Priority Queues": {
    whatToStudy:
      "Complete binary tree array mapping: left child at 2i + 1, right child at 2i + 2, parent at floor((i - 1) / 2) for 0-indexed heaps. Understand why bottom-up heapification achieves O(n) linear time via bounding node heights, whereas n sequential insertions take O(n log n).",
    howToPrepare: [
      "Study Unit 1 Binary Heap Implementation Guide: Note array index arithmetic and sift-down mechanics.",
      "Draw an unsorted array of 7 elements and trace sift-down starting from index floor(n/2) - 1 down to index 0.",
      "Practice min-heap vs max-heap property verification on paper.",
      "Memorize operation costs: Peek is O(1), Insert is O(log n), Extract-Min/Max is O(log n), Build-Heap is O(n).",
    ],
    keywords: ["heap", "priority queue", "sift", "binary heap"],
    actionableTip: "Remember that array indexing is 2i+1 (left) and 2i+2 (right) for 0-indexed heaps, and build-heap is O(n).",
  },
  "Graph Traversals & Topo Sort": {
    whatToStudy:
      "Topological Sorting mechanics and prerequisites: strictly valid only for Directed Acyclic Graphs (DAG). Kahn's Algorithm using in-degree array: initialize queue with all in-degree 0 nodes, repeatedly dequeue and decrement adjacent neighbors' in-degrees. Cycle detection via non-empty in-degree remaining.",
    howToPrepare: [
      "Watch Unit 2 Graph Traversals faculty video lecture focusing on Kahn's Algorithm and in-degree arrays.",
      "Draw a 5-node DAG, calculate the in-degree of every vertex, and trace Kahn's queue step-by-step.",
      "Practice identifying cycles using DFS back-edges vs BFS in-degree remaining counts.",
      "Contrast Dijkstra's non-negative edge requirement with Bellman-Ford for negative weights.",
    ],
    keywords: ["graph", "topological", "kahn", "dag", "bfs", "dfs", "dijkstra"],
    actionableTip: "Topological sort requires in-degree 0 start nodes and can ONLY exist on Directed Acyclic Graphs (DAGs).",
  },
  "Dynamic Programming": {
    whatToStudy:
      "0/1 Knapsack recurrence relation: dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]]). Grid dimensions require (n + 1) rows and (W + 1) columns to accommodate the base cases of 0 items and 0 capacity. Optimal substructure and overlapping subproblems.",
    howToPrepare: [
      "Read Stanford CS161 Unit 4 Dynamic Programming lecture notes on recurrence construction.",
      "Construct a small (4 x 5) DP grid on paper for 3 items and capacity 4, filling base row and column with 0.",
      "Practice transitioning from 2D matrix to 1D space-optimized array iterating capacity backwards from W to wt[i].",
      "Differentiate between top-down memoization and bottom-up iterative tabulation.",
    ],
    keywords: ["dynamic programming", "dp", "knapsack", "memoization"],
    actionableTip: "Always account for the 0-capacity and 0-item base cases, giving an (n+1) x (W+1) table dimension.",
  },
  "Linked Lists & Pointers": {
    whatToStudy:
      "Floyd's Tortoise and Hare Cycle Detection Algorithm: slow pointer advances by 1 step, fast pointer advances by 2 steps. Space complexity is strictly O(1) auxiliary constant space.",
    howToPrepare: [
      "Dry-run pointer steps on a linked list with a loop to observe how distance between slow and fast decreases by 1 each step.",
      "Review cycle start point algorithm: reset slow pointer to head and advance both slow and fast by 1 step until collision.",
      "Practice reversing singly linked lists iteratively in O(n) time and O(1) space.",
    ],
    keywords: ["linked list", "pointer", "floyd", "cycle"],
    actionableTip: "Floyd's algorithm uses only two pointers (slow and fast), so auxiliary space complexity is strictly O(1).",
  },
  "Stacks & Queues": {
    whatToStudy:
      "Postfix (Reverse Polish) expression evaluation using a LIFO Stack: push operands onto stack; upon operator, pop top 2 operands, apply operator, and push result back. Infix to postfix conversion rules and operator precedence.",
    howToPrepare: [
      "Evaluate '6 2 / 3 +' on paper using a vertical stack diagram.",
      "Review monotonic stacks for Next Greater Element and largest rectangle in histogram.",
      "Implement a circular queue using an array and modular arithmetic ((rear + 1) % capacity).",
    ],
    keywords: ["stack", "queue", "postfix", "lifo"],
    actionableTip: "In postfix evaluation, operands are pushed to a LIFO stack; operators pop two operands and push result.",
  },
  "Array Mechanics & Amortization": {
    whatToStudy:
      "Amortized complexity analysis via aggregate and accounting methods. Geometric doubling (multiplying capacity by 2) amortizes costly O(n) resizes over n insertions, giving O(1) amortized time per append.",
    howToPrepare: [
      "Calculate total copy operations across 16 sequential appends into a dynamic array starting at size 1.",
      "Understand why arithmetic capacity expansion (+c) yields O(n) per append while geometric expansion yields O(1) amortized.",
      "Review cache locality advantages of contiguous arrays over linked lists.",
    ],
    keywords: ["array", "amortized", "dynamic array"],
    actionableTip: "Geometric capacity doubling ensures total copying work is O(n) across n inserts, averaging O(1) amortized.",
  },
  "Relational Normalization": {
    whatToStudy:
      "Normalization anomalies (Insert, Update, Delete). 1NF (atomic attributes), 2NF (no partial functional dependencies on candidate keys), 3NF (no transitive dependencies), BCNF (for every non-trivial X -> Y, X must be a superkey).",
    howToPrepare: [
      "Read Stanford CS145 Relational Design Theory in Unit 1 Normalization Handbook PDF.",
      "Compute attribute closure (X+) to find all candidate keys of a relation.",
      "Practice testing BCNF violations where LHS is not a superkey and decomposing relations losslessly.",
      "Remember: 2NF eliminates partial dependencies; 3NF eliminates transitive dependencies; BCNF requires superkey LHS.",
    ],
    keywords: ["normalization", "normal form", "2nf", "3nf", "bcnf", "1nf", "functional dependency"],
    actionableTip: "2NF eliminates partial dependencies on candidate keys; BCNF strictly requires the LHS determinant to be a superkey.",
  },
  "Transaction Management & ACID": {
    whatToStudy:
      "ACID Transaction Properties: Atomicity (all-or-nothing), Consistency (integrity constraints satisfied), Isolation (serializable concurrent execution), Durability (committed changes persist). Write-Ahead Logging (WAL) protocol: log records must reach non-volatile storage before dirty data pages are flushed to disk.",
    howToPrepare: [
      "Watch Unit 2 ACID Transactions & WAL faculty video lecture.",
      "Review undo logging (reverting uncommitted aborts) vs redo logging (replaying committed updates).",
      "Study checkpointing mechanics to understand how DBMS bounds recovery time after a crash.",
      "Contrast isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.",
    ],
    keywords: ["acid", "transaction", "isolation", "wal", "logging", "durability", "atomicity"],
    actionableTip: "In ACID, 'I' stands for Isolation; WAL guarantees log records reach disk BEFORE dirty pages are flushed.",
  },
  "SQL Queries & Aggregation": {
    whatToStudy:
      "SQL clause evaluation order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY. Crucial distinction: WHERE filters rows prior to aggregation; HAVING filters aggregated groups (e.g. HAVING COUNT(*) > 2 or HAVING AVG(salary) >= 50000).",
    howToPrepare: [
      "Read Unit 3 SQL Aggregations & Joins technical notes.",
      "Write 3 sample SQL queries comparing WHERE on column values vs HAVING on aggregate metrics.",
      "Practice joining tables using INNER JOIN, LEFT OUTER JOIN, and CROSS JOIN.",
      "Review NULL handling in SQL aggregate functions (COUNT(*) includes nulls, AVG(col) ignores nulls).",
    ],
    keywords: ["sql", "having", "group by", "where", "aggregation"],
    actionableTip: "WHERE filters individual rows before grouping; HAVING filters aggregated group metrics after GROUP BY.",
  },
  "Indexing & B+ Trees": {
    whatToStudy:
      "B+ Tree architecture: internal nodes store strictly routing search keys and child pointers; ALL actual record pointers and data payloads reside in leaf nodes. Leaf nodes are linked sequentially as a doubly linked list, enabling ultra-fast range queries and scans.",
    howToPrepare: [
      "Review B+ Tree Indexing technical notes in Unit 3 study materials.",
      "Contrast B-Tree vs B+ Tree: B+ Trees have higher fan-out (more keys fit per disk page) and superior range scan speed.",
      "Trace search operations from root to leaf node following key bounds.",
      "Trace node splitting when a leaf node overflows its maximum key capacity.",
    ],
    keywords: ["b+ tree", "index", "indexing", "leaf node"],
    actionableTip: "In B+ Trees, all actual data record pointers reside strictly in leaf nodes, linked for fast range scans.",
  },
  "Concurrency Control": {
    whatToStudy:
      "Concurrency anomalies: Lost Update (two transactions overwrite without reading), Dirty Read (reading uncommitted data), Non-repeatable Read, Phantom Read. Two-Phase Locking (2PL): Growing Phase (acquire locks, release none), Shrinking Phase (release locks, acquire none). Guarantees conflict serializability.",
    howToPrepare: [
      "Watch Unit 2 Concurrency Control & 2PL video lecture.",
      "Draw serialization / precedence graphs for concurrent transaction schedules and check for cycles.",
      "Understand why standard 2PL guarantees conflict serializability but does NOT prevent deadlocks.",
      "Review Strict 2PL and how holding exclusive locks until commit eliminates cascading rollbacks.",
    ],
    keywords: ["concurrency", "2pl", "locking", "lost update", "dirty read", "serializability"],
    actionableTip: "2PL guarantees conflict serializability via growing & shrinking phases; Lost Updates occur when concurrent writes collide.",
  },
  "Relational Algebra": {
    whatToStudy:
      "Relational algebra operators: Selection (σ), Projection (π), Cartesian Product (×), Union (∪), Set Difference (-), Intersection (∩). Theta Join (⋈θ) is defined as Cartesian product followed by applying a conditional selection predicate: R ⋈θ S = σθ(R × S).",
    howToPrepare: [
      "Practice formulating relational algebra queries for employee-department schemas.",
      "Understand natural join (⋈) as equality join on common attribute names followed by projection.",
      "Review query optimization heuristics: pushing selections and projections down before Cartesian products.",
    ],
    keywords: ["relational algebra", "theta join", "projection", "selection", "cartesian"],
    actionableTip: "Theta Join is formally defined as Cartesian product (cross join) followed by selection condition predicate.",
  },
  "Data Modeling & ER Diagrams": {
    whatToStudy:
      "Entity-Relationship diagram symbols: Rectangles (Entity Sets), Double Rectangles (Weak Entity Sets - lacking primary key, dependent on identifying owner), Diamonds (Relationships), Double Diamonds (Identifying Relationships), Ellipses (Attributes), Double Ellipses (Multivalued attributes).",
    howToPrepare: [
      "Review ER modeling conventions in database notes.",
      "Practice identifying weak entity sets (e.g. Dependent entity owned by Employee entity).",
      "Map ER cardinalities (1:1, 1:N, M:N) to relational schema foreign keys and junction tables.",
    ],
    keywords: ["er diagram", "entity", "weak entity", "relationship"],
    actionableTip: "A double rectangle in an ER diagram represents a Weak Entity Set, which requires an identifying relationship.",
  },
  "CPU Scheduling": {
    whatToStudy:
      "Preemptive vs Non-preemptive scheduling algorithms. Shortest Job First (SJF) minimizes average waiting time but causes starvation for long burst jobs. Round Robin (RR) time quantum tuning: large quantum behaves like FCFS; too small causes excessive context-switch overhead.",
    howToPrepare: [
      "Read OSTEP CPU Scheduling chapter in Unit 1 PDF.",
      "Draw Gantt charts for SJF, SRTF (preemptive SJF), and Round Robin with given arrival and burst times.",
      "Calculate Turnaround Time (Completion - Arrival) and Waiting Time (Turnaround - Burst).",
      "Understand how Aging technique gradually increases priority of waiting processes to eliminate SJF starvation.",
    ],
    keywords: ["cpu scheduling", "sjf", "round robin", "starvation", "fcfs", "turnaround"],
    actionableTip: "SJF produces optimal average waiting time but leads to starvation for long burst processes; aging resolves this.",
  },
  "Deadlocks & Synchronization": {
    whatToStudy:
      "Four Coffman conditions necessary and sufficient for deadlock: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Banker's Algorithm for deadlock avoidance: calculates Need = Max - Allocation, determines safe sequence if Need <= Available. Semaphores: wait (decrement/block), signal (increment/unblock).",
    howToPrepare: [
      "Watch Unit 2 Deadlock Detection & Banker's Algorithm video lecture.",
      "Trace Banker's Algorithm safety check on paper with 3 processes and 3 resource types.",
      "Practice strategies to break each of the 4 Coffman conditions (e.g., resource ordering breaks circular wait).",
      "Construct Resource Allocation Graphs (RAG) and check for cycles.",
    ],
    keywords: ["deadlock", "coffman", "banker", "semaphore", "synchronization", "circular wait"],
    actionableTip: "The 4 Coffman conditions are Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Breaking any one prevents deadlock.",
  },
  "Memory Management & Paging": {
    whatToStudy:
      "Memory Management Unit (MMU) hardware address translation: translates virtual page numbers to physical page frames using page tables and Translation Lookaside Buffer (TLB). Belady's Anomaly: FIFO page replacement can produce MORE page faults when given MORE page frames. Thrashing: system spends more time swapping pages than executing instructions.",
    howToPrepare: [
      "Read OSTEP Virtual Memory & Paging notes in Unit 3 PDF.",
      "Calculate 32-bit address split given 4KB page size: 12-bit page offset and 20-bit page number.",
      "Simulate page replacement strings using FIFO, LRU, and Optimal (MIN) algorithms.",
      "Understand why stack-based algorithms like LRU and Optimal are immune to Belady's Anomaly.",
    ],
    keywords: ["mmu", "paging", "virtual memory", "belady", "thrashing", "tlb", "page fault"],
    actionableTip: "The MMU hardware translates virtual addresses to physical frames; Belady's anomaly occurs in FIFO page replacement.",
  },
};

export function generateAiTestDiagnostic(params: GenerateAiDiagnosticParams): AiTestDiagnosticReport {
  const {
    courseName,
    courseCode,
    score,
    totalQuestions = 10,
    questions,
    selectedAnswers,
    availableResources = [],
  } = params;

  const passed = score >= 7;
  const percentage = Math.round((score / totalQuestions) * 100);

  // Analyze question mistakes
  const mistakes: QuestionMistakeReview[] = [];
  const weakTopicCounts: Record<string, number> = {};

  questions.forEach((q, idx) => {
    const studentChoice = selectedAnswers[idx];
    const isCorrect = studentChoice === q.answer;
    const topic = q.topic || "Core Subject Concepts";

    if (!isCorrect) {
      weakTopicCounts[topic] = (weakTopicCounts[topic] || 0) + 1;
    }

    const qOpts = Array.isArray(q.options) ? q.options : [];
    const studentAnswerText =
      typeof studentChoice === "number" && qOpts[studentChoice]
        ? qOpts[studentChoice]
        : "Unanswered / Skipped";
    const correctAnswerText = qOpts[q.answer] || `Option ${q.answer + 1}`;

    const topicGuide = TOPIC_PREPARATION_GUIDES[topic];
    const actionableTip =
      topicGuide?.actionableTip ||
      q.explanation ||
      `Review lecture notes covering ${topic} in detail.`;

    mistakes.push({
      questionIndex: idx,
      questionNumber: idx + 1,
      questionText: q.question,
      topic,
      studentAnswerText,
      correctAnswerText,
      isCorrect,
      explanation: q.explanation,
      actionableTip,
    });
  });

  const weakTopicsList = Object.keys(weakTopicCounts);

  // Build Topic-by-Topic preparation guidance
  const topicsAnalysis: WeakTopicAnalysis[] = weakTopicsList.map((topic) => {
    const guide = TOPIC_PREPARATION_GUIDES[topic];
    const missedCount = weakTopicCounts[topic];

    // Find best matching resource
    let matchedResource = availableResources.find((res) => {
      const text = `${res.title} ${res.description || ""}`.toLowerCase();
      const topicLower = topic.toLowerCase();
      if (text.includes(topicLower)) return true;
      if (guide?.keywords?.some((k) => text.includes(k))) return true;
      return false;
    });

    if (!matchedResource && availableResources.length > 0) {
      matchedResource = availableResources[0];
    }

    return {
      topic,
      missedCount,
      missedQuestionsCount: missedCount,
      whatToStudy:
        guide?.whatToStudy ||
        `Comprehensive revision required for ${topic}. Study foundational definitions, core theoretical proofs, and practical edge cases.`,
      howToPrepare: Array.isArray(guide?.howToPrepare) ? guide.howToPrepare : [
        `Step 1: Open the course study materials and re-read the chapter on ${topic}.`,
        `Step 2: Take handwritten notes on key formulas, algorithms, and invariants.`,
        `Step 3: Solve 3–5 sample problems before taking the retest assessment.`,
      ],
      recommendedResourceTitle: matchedResource?.title,
      recommendedResourceType: matchedResource?.type,
      recommendedResourceUrl: matchedResource?.url,
      matchedResource: matchedResource,
    };
  });

  const summaryMessage = passed
    ? `Congratulations! You scored ${score}/${totalQuestions} (${percentage}%), successfully surpassing the passing threshold (7/10). You have demonstrated strong mastery of ${courseName}.`
    : `You scored ${score}/${totalQuestions} (${percentage}%). The passing threshold is 7/10 (70%). To clear this subject and earn your official completion certificate, you must review the ${weakTopicsList.length} weak areas diagnosed below and retake the assessment.`;

  const readinessVerdict = passed
    ? "Verified for Course Completion & Certificate Issuance"
    : `Remedial Preparation Required: You need at least ${Math.max(0, 7 - score)} more mark${7 - score > 1 ? "s" : ""} to pass (Pass benchmark: 7/10).`;

  return {
    score,
    totalQuestions,
    percentage,
    passed,
    passMark: 7,
    courseName,
    courseCode,
    summaryMessage,
    readinessVerdict,
    weakTopicsList,
    weakTopics: weakTopicsList,
    topicsAnalysis,
    mistakes,
  };
}
