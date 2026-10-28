import { User } from "../data";

type AdminPage = "dashboard" | "students" | "courses" | "faculty" | "attendance" | "marks" | "reports" | "announcements";
type FacultyPage = "dashboard" | "my-courses" | "attendance" | "marks" | "reports";
type StudentPage = "dashboard" | "courses" | "attendance" | "marks" | "schedule";

export type Page = AdminPage | FacultyPage | StudentPage;

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "students", label: "Student Records", icon: "◻" },
  { id: "courses", label: "Courses", icon: "◻" },
  { id: "faculty", label: "Faculty", icon: "◻" },
  { id: "attendance", label: "Attendance", icon: "◻" },
  { id: "marks", label: "Marks & Grades", icon: "◻" },
  { id: "reports", label: "Reports", icon: "◻" },
  { id: "announcements", label: "Announcements", icon: "◻" },
];

const FACULTY_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "my-courses", label: "My Courses", icon: "◻" },
  { id: "attendance", label: "Mark Attendance", icon: "◻" },
  { id: "marks", label: "Enter Marks", icon: "◻" },
  { id: "reports", label: "Reports", icon: "◻" },
];

const STUDENT_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "courses", label: "My Courses", icon: "◻" },
  { id: "attendance", label: "Attendance", icon: "◻" },
  { id: "marks", label: "Marks & Grades", icon: "◻" },
  { id: "schedule", label: "Schedule", icon: "◻" },
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "Administrator", cls: "bg-[#1a56db]/10 text-[#1a56db]" },
  faculty: { label: "Faculty", cls: "bg-emerald-500/10 text-emerald-700" },
  student: { label: "Student", cls: "bg-violet-500/10 text-violet-700" },
};

interface SidebarProps {
  user: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activePage, onNavigate, onLogout }: SidebarProps) {
  const nav = user.role === "admin" ? ADMIN_NAV : user.role === "faculty" ? FACULTY_NAV : STUDENT_NAV;
  const badge = ROLE_BADGE[user.role];

  return (
    <aside className="w-60 bg-[#0f2044] flex flex-col h-screen flex-shrink-0 select-none">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1a56db] flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="text-white text-[11px] font-bold font-mono">A</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-white text-sm font-bold tracking-wide leading-none">AAES</div>
            <div className="text-white/40 text-[9px] font-mono mt-0.5">Academic Workflow</div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-3.5 border-b border-white/10 flex-shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold shadow-xs">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{user.name}</div>
            <div className={`text-[9px] font-mono mt-0.5 inline-block px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</div>
          </div>
        </div>
        {(user.rollNo || user.employeeId) && (
          <div className="mt-2 text-white/40 text-[10px] font-mono">{user.rollNo || user.employeeId}</div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {nav.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                active
                  ? "bg-white/10 text-white font-semibold shadow-xs border border-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className={`text-[8px] ${active ? "text-[#3b82f6]" : "text-white/30"}`}>●</span>
              <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout - Clean & Structured Transparent Modern UI Button */}
      <div className="p-3.5 border-t border-white/10 flex-shrink-0 bg-white/[0.02]">
        <button
          onClick={onLogout}
          className="group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-white/70 hover:text-rose-300 bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 backdrop-blur-sm transition-all duration-200 active:scale-[0.98] shadow-xs cursor-pointer"
          title="Sign Out"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-rose-500/20 border border-white/10 group-hover:border-rose-500/30 flex items-center justify-center transition-colors shadow-xs">
              <svg
                className="w-3.5 h-3.5 text-white/60 group-hover:text-rose-300 transition-colors"
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
            <span className="font-semibold tracking-tight">Sign out</span>
          </div>
          <svg
            className="w-3.5 h-3.5 text-white/30 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all duration-200"
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
  );
}
