export interface StudyUnit {
  unitNumber: number;
  unitTitle: string;
  readingTime: string;
  summary: string;
  sections: {
    title: string;
    content: string;
    codeOrDiagram?: string;
    keyPoints?: string[];
  }[];
}

export interface RealStudyPdf {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  department: string;
  instructor: string;
  academicYear: string;
  title: string;
  subtitle: string;
  edition: string;
  officialDocNumber: string;
  verifiedSyllabus: boolean;
  units: StudyUnit[];
  examFormulas: { name: string; formula: string; description: string }[];
  practiceQuestions: { question: string; answer: string; explanation: string }[];
}

export const REAL_STUDY_PDFS: Record<string, RealStudyPdf> = {
  // =========================================================================
  // SUBJECT 1: CS301 — Data Structures & Algorithms
  // =========================================================================
  c1: {
    courseId: "c1",
    courseCode: "CS301",
    courseName: "Data Structures & Algorithms",
    credits: 4,
    department: "Department of Computer Science & Engineering",
    instructor: "Prof. Kavitha Nair",
    academicYear: "Academic Year 2024–2025 (Semester III)",
    title: "Comprehensive Academic Course Guide: Data Structures & Algorithms",
    subtitle: "Complete Lecture Notes, Algorithmic Analysis, Tree Rotations & Graph Theorems",
    edition: "Faculty Authorized 4th Revised Edition",
    officialDocNumber: "DOC-CS301-REV4-2024",
    verifiedSyllabus: true,
    units: [
      {
        unitNumber: 1,
        unitTitle: "Trees, Balanced Search Trees (AVL) & Binary Heaps",
        readingTime: "45 mins",
        summary:
          "Explores non-linear hierarchical data structures. Covers Binary Search Tree (BST) invariants, self-balancing AVL balance factors, rotation mechanics (LL, RR, LR, RL), Priority Queues, and array-backed binary min/max heaps.",
        sections: [
          {
            title: "1.1 Binary Search Tree (BST) Properties & Degenerate Degeneration",
            content:
              "A Binary Search Tree is a binary tree where for every node X: all keys in the left subtree are strictly less than Key(X), and all keys in the right subtree are strictly greater than Key(X). While average-case search, insert, and delete operate in O(log n), inserting sorted keys degrades the tree into a skewed linked-list with O(n) worst-case time complexity. Self-balancing trees eliminate this vulnerability.",
            keyPoints: [
              "In-order traversal of a BST always yields sorted keys in ascending order.",
              "Search / Insert / Delete time complexity: O(h) where h is the tree height.",
              "Balanced height: h = ⌊log₂ n⌋; Skewed height: h = n.",
            ],
          },
          {
            title: "1.2 AVL Tree Balancing & The Four Fundamental Rotations",
            content:
              "An AVL tree is a strictly height-balanced BST named after Georgy Adelson-Velsky and Evgenii Landis (1962). For every node, the Balance Factor (BF) is defined as BF(N) = Height(LeftSubtree) - Height(RightSubtree). The AVL invariant mandates that BF(N) ∈ {-1, 0, +1}. When an insertion or deletion causes |BF(N)| > 1, balance is restored using one of 4 rotation operations in O(1) time.",
            codeOrDiagram: `[Left-Left (LL) Case: Right Rotation]
         Z (BF=+2)                 Y (BF=0)
        / \\                       / \\
       Y   T4       ======>       X   Z
      / \\                       / \\ / \\
     X   T3                    T1 T2 T3 T4
    / \\
   T1  T2

[Left-Right (LR) Case: Left Rotate Y, then Right Rotate Z]
       Z (BF=+2)                 Z (BF=+2)               X (BF=0)
      / \\                       / \\                     / \\
     Y   T4       ======>      X   T4     ======>       Y   Z
    / \\                       / \\                     / \\ / \\
   T1  X                     Y   T3                  T1 T2 T3 T4
      / \\                   / \\
     T2  T3                T1 T2`,
            keyPoints: [
              "LL Imbalance: Single Right Rotation at node Z.",
              "RR Imbalance: Single Left Rotation at node Z.",
              "LR Imbalance: Left rotation at child Y, followed by Right rotation at node Z.",
              "RL Imbalance: Right rotation at child Y, followed by Left rotation at node Z.",
              "Maximum height of an AVL tree with n nodes is bounded by 1.44 · log₂ n.",
            ],
          },
          {
            title: "1.3 Binary Heaps & Priority Queues",
            content:
              "A Binary Heap is a complete binary tree stored compactly in a contiguous 1D array without pointer overhead. In a Max-Heap, every parent node is greater than or equal to its children; in a Min-Heap, every parent is less than or equal to its children. For a node at index i (0-based indexing): Parent = ⌊(i - 1) / 2⌋, Left Child = 2i + 1, Right Child = 2i + 2. Building a heap takes O(n) time via bottom-up heapify, and extracting the root takes O(log n) time.",
            codeOrDiagram: `// Min-Heap Array Representation:
// Array: [4, 10, 8, 15, 20, 12, 22]
// Tree structure:
//          4 (index 0)
//        /   \\
//    10 (1)   8 (2)
//    /   \\   /   \\
//  15(3) 20(4) 12(5) 22(6)

Parent(i)     = Math.floor((i - 1) / 2)
LeftChild(i)  = 2 * i + 1
RightChild(i) = 2 * i + 2`,
            keyPoints: [
              "Complete binary tree invariant ensures optimal contiguous array storage.",
              "Build-Heap operation runs in O(n) time, NOT O(n log n).",
              "Insert and Extract-Min/Max operate in O(log n) time.",
            ],
          },
        ],
      },
      {
        unitNumber: 2,
        unitTitle: "Graph Traversals, Kahn's Topological Sort & Dijkstra's Shortest Path",
        readingTime: "50 mins",
        summary:
          "Graph representations (Adjacency Matrix vs List), Queue-driven Breadth-First Search (BFS), Recursive Depth-First Search (DFS), Directed Acyclic Graphs (DAG), In-Degree Topological Sort, and Greedy Single-Source Shortest Path.",
        sections: [
          {
            title: "2.1 Graph Storage Representations & Traversal Mechanics",
            content:
              "Graphs G = (V, E) can be represented using an Adjacency Matrix of size |V| × |V| (O(V²) space, O(1) edge lookup) or an Adjacency List (O(V + E) space, optimal for sparse graphs). Breadth-First Search (BFS) explores vertices level-by-level using a FIFO Queue and computes the shortest path in unweighted graphs in O(V + E). Depth-First Search (DFS) explores vertices deeply along each branch using recursion or a LIFO stack in O(V + E) and is critical for topological sorting, cycle detection, and strongly connected components (SCC).",
            keyPoints: [
              "BFS uses a Queue; DFS uses a Stack (or function call stack recursion).",
              "Both BFS and DFS visit every reachable vertex and edge in O(V + E) time.",
              "BFS guarantees shortest path in unweighted graphs.",
            ],
          },
          {
            title: "2.2 Kahn's Algorithm for Topological Sorting (DAG)",
            content:
              "A Topological Sort of a Directed Acyclic Graph (DAG) is a linear ordering of vertices such that for every directed edge u → v, vertex u comes before vertex v. Kahn's Algorithm computes this ordering using in-degree arrays. If the count of processed vertices is less than |V|, the graph contains a cycle.",
            codeOrDiagram: `// Kahn's Algorithm (Topological Sort)
1. Compute in-degree for all vertices.
2. Initialize Queue Q with all vertices having in-degree = 0.
3. While Q is not empty:
     u = Q.dequeue();
     Add u to topo_order;
     For each neighbor v of u:
       in_degree[v]--;
       if (in_degree[v] === 0) Q.enqueue(v);
4. If topo_order.length !== |V|:
     Cycle detected! Graph is not a DAG.`,
            keyPoints: [
              "Topological sorting is strictly defined ONLY on Directed Acyclic Graphs (DAGs).",
              "Time complexity: O(V + E) with O(V) auxiliary space.",
              "Provides an elegant mechanism to detect cycles in directed graphs.",
            ],
          },
          {
            title: "2.3 Dijkstra's Single-Source Shortest Path Algorithm",
            content:
              "Dijkstra's algorithm finds the shortest distance from a starting source vertex to all other vertices in a weighted graph with non-negative edge weights. It operates greedily: at each step, it extracts the unvisited vertex with the minimum tentative distance using a Min-Priority Queue, and relaxes all of its outgoing edges.",
            codeOrDiagram: `// Edge Relaxation Condition:
if (dist[u] + weight(u, v) < dist[v]) {
    dist[v] = dist[u] + weight(u, v);
    priorityQueue.insertOrDecreaseKey(v, dist[v]);
}

// Time Complexity:
// - With Binary Min-Heap: O((V + E) log V)
// - With Fibonacci Heap: O(E + V log V)`,
            keyPoints: [
              "Dijkstra FAILS on graphs with negative edge weights; Bellman-Ford must be used instead.",
              "Greedy Choice Property: Once a vertex is extracted from the min-heap, its shortest path is final.",
            ],
          },
        ],
      },
      {
        unitNumber: 3,
        unitTitle: "Dynamic Programming: Formulations, Memoization & Recurrence Relations",
        readingTime: "40 mins",
        summary:
          "Principles of Dynamic Programming: Overlapping Subproblems and Optimal Substructure. Master the 0/1 Knapsack Problem, Longest Common Subsequence (LCS), and table space optimization.",
        sections: [
          {
            title: "3.1 Core Invariants of Dynamic Programming",
            content:
              "Dynamic Programming (DP) solves complex problems by breaking them down into simpler subproblems, storing results in a lookup table to prevent redundant re-computation. Two essential prerequisites are: (1) Optimal Substructure: An optimal solution to the problem contains optimal solutions to subproblems; (2) Overlapping Subproblems: The recursive formulation revisits the same subproblems repeatedly.",
            keyPoints: [
              "Top-down approach: Recursion + Memoization (caching return values).",
              "Bottom-up approach: Iteration + Tabulation (filling an n-dimensional grid).",
              "Converts exponential O(2ⁿ) naive recursive solutions into polynomial O(n · W) solutions.",
            ],
          },
          {
            title: "3.2 The 0/1 Knapsack Problem Formulation",
            content:
              "Given n items, each with weight w[i] and profit v[i], and a knapsack of capacity W, find the maximum profit subset of items that fit into the knapsack where each item can either be taken (1) or excluded (0).",
            codeOrDiagram: `// Recurrence Relation:
DP[i][w] = DP[i - 1][w]                           if w[i] > w (Cannot include item i)
DP[i][w] = max(
             DP[i - 1][w],                         // Exclude item i
             DP[i - 1][w - w[i]] + v[i]            // Include item i
           )                                      otherwise

// Time Complexity: O(n * W)
// Space Complexity: O(n * W), optimizable to O(W) using 1D rolling array.`,
            keyPoints: [
              "Pseudo-polynomial time complexity: O(n · W) depends on numeric value W.",
              "Fractional Knapsack can be solved greedily in O(n log n); 0/1 Knapsack requires DP.",
            ],
          },
        ],
      },
    ],
    examFormulas: [
      {
        name: "AVL Height Bound",
        formula: "h < 1.4404 · log₂(n + 2) - 0.328",
        description: "Upper bound on the height of an AVL tree with n nodes.",
      },
      {
        name: "Heap Array Indices (0-based)",
        formula: "Parent = ⌊(i - 1)/2⌋, Left = 2i + 1, Right = 2i + 2",
        description: "Direct index arithmetic for complete binary heaps.",
      },
      {
        name: "Dijkstra Priority Queue Complexity",
        formula: "T(V, E) = O((V + E) · log V)",
        description: "Runtime using a binary min-heap for sparse to moderate graphs.",
      },
      {
        name: "0/1 Knapsack State Transition",
        formula: "DP[i][w] = max(DP[i-1][w], DP[i-1][w - wᵢ] + vᵢ)",
        description: "Optimal profit choice when deciding to include or omit item i.",
      },
    ],
    practiceQuestions: [
      {
        question:
          "An AVL tree contains keys [10, 20, 30] inserted in increasing order. What rotation restores balance at root 10?",
        answer: "Single Left Rotation (RR Imbalance)",
        explanation:
          "Node 10 has BF = -2 (right-heavy) and child 20 has BF = -1. A single left rotation brings 20 to the root with left child 10 and right child 30.",
      },
      {
        question:
          "Why does Dijkstra's algorithm fail to produce correct shortest paths in graphs with negative edge weights?",
        answer: "Violation of the greedy choice invariant",
        explanation:
          "Dijkstra assumes that once a vertex is marked visited (extracted from min-heap), its distance cannot be decreased further. A negative edge encountered later could lower an already finalized distance.",
      },
      {
        question:
          "What is the time complexity of building a Binary Heap of n elements from an unordered array?",
        answer: "O(n) linear time",
        explanation:
          "Using bottom-up heapify from index ⌊n/2⌋ down to 0, nodes near the leaves have very short sift-down distances. Summing h · (n / 2ʰ) over all levels evaluates to O(n).",
      },
    ],
  },

  // =========================================================================
  // SUBJECT 2: CS302 — Database Management Systems
  // =========================================================================
  c2: {
    courseId: "c2",
    courseCode: "CS302",
    courseName: "Database Management Systems",
    credits: 3,
    department: "Department of Computer Science & Engineering",
    instructor: "Prof. Kavitha Nair",
    academicYear: "Academic Year 2024–2025 (Semester III)",
    title: "Comprehensive Academic Course Guide: Database Management Systems",
    subtitle: "Relational Schema Normalization, Concurrency Control, 2PL & B+ Tree Indexing",
    edition: "Faculty Authorized 4th Revised Edition",
    officialDocNumber: "DOC-CS302-REV4-2024",
    verifiedSyllabus: true,
    units: [
      {
        unitNumber: 1,
        unitTitle: "Functional Dependencies, Schema Decomposition & Normal Forms (1NF–BCNF)",
        readingTime: "45 mins",
        summary:
          "Rigorous treatment of relational design theory. Covers Functional Dependencies (FDs), Armstrong's Axioms, Candidate Key Derivation, Attribute Closure (X⁺), 1NF, 2NF, 3NF, BCNF, and lossless join decomposition tests.",
        sections: [
          {
            title: "1.1 Functional Dependencies & Armstrong's Inference Rules",
            content:
              "A Functional Dependency (FD) X → Y on relation R specifies that if two tuples agree on attributes X, they must also agree on attributes Y. Armstrong's Axioms form a sound and complete inference system for deriving all valid FDs: (1) Reflexivity: If Y ⊆ X, then X → Y; (2) Augmentation: If X → Y, then XZ → YZ; (3) Transitivity: If X → Y and Y → Z, then X → Z. Secondary rules include Union, Decomposition, and Pseudo-transitivity.",
            keyPoints: [
              "Soundness: Every FD derived using the axioms is guaranteed to hold.",
              "Completeness: All valid FDs can be derived using these axioms.",
              "Attribute Closure X⁺: The set of all attributes functionally determined by X under FD set F.",
            ],
          },
          {
            title: "1.2 Candidate Key Finding Algorithm Using Attribute Closure",
            content:
              "To find all Candidate Keys of relation R with attribute set U and FD set F: (1) Compute essential attributes that never appear on the RHS of any FD; they MUST be in every candidate key; (2) If their closure equals U, they form the sole candidate key; (3) Otherwise, systematically test minimal attribute combinations until closure equals U.",
            codeOrDiagram: `// Example: Relation R(A, B, C, D, E)
// FDs = { A -> BC, CD -> E, B -> D, E -> A }

1. RHS Attributes = { A, B, C, D, E }
2. Attribute Closure of A:
   A⁺ = { A }
   Apply A -> BC  ==> A⁺ = { A, B, C }
   Apply B -> D   ==> A⁺ = { A, B, C, D }
   Apply CD -> E  ==> A⁺ = { A, B, C, D, E } = U
3. Therefore, A is a Candidate Key!
4. Since E -> A, E⁺ = U ==> E is also a Candidate Key.
5. Since CD -> E, (CD)⁺ = U ==> CD is also a Candidate Key.`,
            keyPoints: [
              "Prime Attribute: Any attribute that is a member of at least one Candidate Key.",
              "Non-Prime Attribute: An attribute that does not belong to ANY Candidate Key.",
            ],
          },
          {
            title: "1.3 Normal Forms Hierarchy: 1NF, 2NF, 3NF & Boyce-Codd (BCNF)",
            content:
              "Normalization eliminates insertion, deletion, and update anomalies while preserving data integrity. Each normal form enforces progressively stricter mathematical constraints.",
            codeOrDiagram: `[Normal Form Hierarchy]
        1NF (Atomic domain values)
         ▲
        2NF (1NF + No Partial Dependency)
         ▲
        3NF (2NF + No Transitive Dependency)
         ▲
       BCNF (Strict: Every Determinant is a Superkey)`,
            keyPoints: [
              "1NF: All attribute values must be atomic; no multi-valued or composite attributes.",
              "2NF: No non-prime attribute may be partially dependent on a proper subset of any candidate key.",
              "3NF: For every non-trivial FD X → A, either X is a Superkey OR A is a Prime Attribute.",
              "BCNF: For every non-trivial FD X → A, X must be a Superkey (strictly eliminates redundancy).",
              "3NF always guarantees Lossless Join AND Dependency Preservation; BCNF guarantees Lossless Join but may NOT preserve dependencies.",
            ],
          },
        ],
      },
      {
        unitNumber: 2,
        unitTitle: "Transaction Processing, ACID Guarantees, Serializability & Two-Phase Locking",
        readingTime: "50 mins",
        summary:
          "Explores concurrent database execution. Details Atomicity, Consistency, Isolation, Durability (ACID), conflict serializability, precedence graphs, cascading aborts, and Two-Phase Locking protocols (2PL).",
        sections: [
          {
            title: "2.1 The ACID Paradigm & Concurrency Anomalies",
            content:
              "A transaction is an atomic unit of program execution. The database management system guarantees ACID: Atomicity (all-or-nothing execution), Consistency (preserves database integrity constraints), Isolation (concurrent transactions execute without interference), and Durability (committed updates persist permanently despite crashes). Without concurrency control, anomalies occur: Dirty Read (reading uncommitted data), Non-repeatable Read (rereading modified data), Lost Update (concurrent overwrite), and Phantom Read.",
            keyPoints: [
              "Dirty Read: T2 reads data modified by T1 before T1 commits, and T1 subsequently aborts.",
              "Lost Update: T1 and T2 read the same value and write back, overwriting one update.",
              "Write-Ahead Logging (WAL): Log records must reach non-volatile disk BEFORE dirty data pages.",
            ],
          },
          {
            title: "2.2 Conflict Serializability & Precedence Graphs",
            content:
              "A schedule S of concurrent transactions is conflict serializable if it is conflict-equivalent to some serial schedule. Two operations conflict if they belong to different transactions, access the same data item, and at least one is a write. A schedule is conflict serializable if and only if its Precedence Graph (Serialization Graph) contains NO directed cycles.",
            codeOrDiagram: `// Constructing Precedence Graph G = (V, E):
// Nodes V = All transactions in schedule S.
// Directed Edge Tᵢ -> Tⱼ if:
//   1. Tᵢ reads Q before Tⱼ writes Q, OR
//   2. Tᵢ writes Q before Tⱼ reads Q, OR
//   3. Tᵢ writes Q before Tⱼ writes Q.

// Cycle Check:
// If Graph has NO cycle  ===> Schedule is Conflict Serializable.
// If Graph HAS a cycle   ===> Non-serializable (Data inconsistency).`,
            keyPoints: [
              "Topological sort of the acyclic precedence graph gives the equivalent serial schedule.",
              "View serializability is NP-complete to test; Conflict serializability is verifiable in O(V + E).",
            ],
          },
          {
            title: "2.3 Two-Phase Locking (2PL) Protocols",
            content:
              "The Two-Phase Locking (2PL) protocol ensures conflict serializability by constraining lock acquisitions and releases into two phases: (1) Growing Phase: Transaction may obtain locks but cannot release any; (2) Shrinking Phase: Transaction may release locks but cannot acquire any new locks. Once a lock is released, the transaction can never acquire another lock.",
            keyPoints: [
              "Basic 2PL: Guarantees conflict serializability, but is vulnerable to cascading aborts and deadlocks.",
              "Strict 2PL: Holds all exclusive (write) locks until commit/abort; guarantees cascadeless recovery.",
              "Rigorous 2PL: Holds ALL locks (shared and exclusive) until commit; guarantees strict order.",
            ],
          },
        ],
      },
      {
        unitNumber: 3,
        unitTitle: "B+ Tree Indexing Structures & Query Execution",
        readingTime: "40 mins",
        summary:
          "Physical storage, clustered vs unclustered indexing, B+ Tree self-balancing multi-way search trees, node splitting mechanics, and relational algebra query optimization.",
        sections: [
          {
            title: "3.1 B+ Tree Invariants & Structural Advantages",
            content:
              "A B+ Tree of order m is a balanced search tree designed for block-oriented storage. Invariants: (1) All actual data records or record pointers reside exclusively in the leaf nodes; (2) Internal nodes store only router search keys and child pointers; (3) All leaves are at the exact same depth; (4) Leaf nodes are linked sequentially via a doubly-linked list, allowing high-speed range scans in O(log_m N + k) time.",
            codeOrDiagram: `[B+ Tree Architecture]
                  [ 50 | 100 ]            <-- Root / Internal Router
                 /      |     \\
       [ 20 | 35 ]  [ 70 | 85 ]  [ 120 | 150 ]   <-- Internal Nodes
        /    |   \\    /   |   \\    /    |    \\
     [Leaves linked sequentially via next/prev pointers]
     [10,20] <-> [30,35] <-> [55,70] <-> [80,85] <-> [110,120] <-> [130,150]`,
            keyPoints: [
              "High fan-out m reduces tree height (typically 3 to 4 levels for millions of records).",
              "Range queries: Find start key in O(log N), then traverse leaf sequential pointers.",
              "Node split: When a node exceeds m - 1 keys, it splits evenly and pushes median key up.",
            ],
          },
        ],
      },
    ],
    examFormulas: [
      {
        name: "3NF Test Condition",
        formula: "X → A ∈ F ⟹ (X is Superkey) ∨ (A is Prime Attribute)",
        description: "Criterion for relation schema to be in Third Normal Form.",
      },
      {
        name: "BCNF Test Condition",
        formula: "X → A ∈ F ⟹ (X is Superkey)",
        description: "Strict criterion for Boyce-Codd Normal Form.",
      },
      {
        name: "Lossless Join Test (Binary Decomposition)",
        formula: "(R₁ ∩ R₂) → R₁  ∨  (R₁ ∩ R₂) → R₂",
        description: "A decomposition of R into (R₁, R₂) is lossless if intersection determines either schema.",
      },
      {
        name: "B+ Tree Leaf Node Capacity",
        formula: "⌈(m - 1) / 2⌉ ≤ Keys ≤ m - 1",
        description: "Allowable keys per node in a B+ Tree of order m.",
      },
    ],
    practiceQuestions: [
      {
        question:
          "A relation R(A, B, C, D) has FDs: { A -> B, B -> C, C -> D, D -> A }. In which highest normal form is R?",
        answer: "Boyce-Codd Normal Form (BCNF)",
        explanation:
          "Since A → B → C → D → A, every single attribute is a candidate key (A, B, C, D). Therefore, for every FD, the determinant is a superkey, satisfying BCNF.",
      },
      {
        question:
          "What is the difference between Strict Two-Phase Locking and Basic Two-Phase Locking?",
        answer: "Holding exclusive locks until transaction commit",
        explanation:
          "In Basic 2PL, a transaction can release locks during the shrinking phase before committing. In Strict 2PL, all exclusive locks are held until transaction commit/abort, which prevents cascading aborts.",
      },
      {
        question:
          "Why are B+ Trees preferred over standard Binary Search Trees for disk-based database indexing?",
        answer: "High fan-out minimizes slow secondary storage disk I/O operations",
        explanation:
          "B+ Trees have orders of 100 to 1000+, keeping the tree height to 3-4 levels. In contrast, a binary tree would require log₂(N) levels, resulting in excessive random disk seeks.",
      },
    ],
  },
};

export function getStudyPdfForCourse(courseIdOrCode?: string): RealStudyPdf {
  const code = (courseIdOrCode || "").toUpperCase();
  if (code.includes("301") || code.includes("C1") || code.includes("DSA")) {
    return REAL_STUDY_PDFS.c1;
  }
  if (code.includes("302") || code.includes("C2") || code.includes("DBMS")) {
    return REAL_STUDY_PDFS.c2;
  }
  // Default to CS301
  return REAL_STUDY_PDFS.c1;
}
