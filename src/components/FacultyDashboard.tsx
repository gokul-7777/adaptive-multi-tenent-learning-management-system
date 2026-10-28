import { COURSES, STUDENTS, ANNOUNCEMENTS, User } from "../data";

interface Props { user: User; }

export default function FacultyDashboard({ user }: Props) {
  const myCourses = COURSES.filter((c) => c.facultyId === user.id);
  const totalStudents = myCourses.reduce((a, c) => a + c.enrolled, 0);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Faculty Portal</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="text-[#6b7589] text-xs mt-1">{user.department} · {user.employeeId}</p>
        </div>
        <div className="text-right">
          <div className="text-[#6b7589] font-mono text-[10px]">Academic Year</div>
          <div className="text-[#0f2044] font-mono text-sm font-medium">2024–25 · Sem III</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-[#d4d9e4]">
        {[
          { label: "Courses Handled", value: String(myCourses.length), color: "border-[#1a56db]" },
          { label: "Total Students", value: String(totalStudents), color: "border-emerald-500" },
          { label: "Pending Tasks", value: "3", color: "border-amber-500" },
        ].map((s) => (
          <div key={s.label} className={`bg-white p-5 border-t-2 ${s.color}`}>
            <div className="text-[#6b7589] font-mono text-[10px] uppercase tracking-wider mb-2">{s.label}</div>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My courses */}
        <div className="border border-[#d4d9e4]">
          <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">My Courses</h2>
          </div>
          <div className="divide-y divide-[#d4d9e4]">
            {myCourses.map((c) => (
              <div key={c.id} className="px-5 py-4 hover:bg-[#f8f9fb] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-[#1a56db] bg-[#1a56db]/8 px-1.5 py-0.5">{c.code}</span>
                      <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">{c.name}</span>
                    </div>
                    <span className="text-[#6b7589] font-mono text-[10px]">Sem {c.semester} · {c.credits} credits</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#0d1117] font-mono text-sm font-bold">{c.enrolled}</div>
                    <div className="text-[#6b7589] font-mono text-[9px]">enrolled</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + announcements */}
        <div className="space-y-4">
          <div className="border border-[#d4d9e4]">
            <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
              <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {[
                "Mark Today's Attendance",
                "Enter Internal Marks",
                "Download Student List",
                "View Timetable",
              ].map((action) => (
                <button
                  key={action}
                  className="border border-[#d4d9e4] px-3 py-2.5 text-xs text-left text-[#0d1117] hover:bg-[#f0f4ff] hover:border-[#1a56db] transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[#d4d9e4]">
            <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
              <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Notices</h2>
            </div>
            <div className="divide-y divide-[#d4d9e4]">
              {ANNOUNCEMENTS.slice(0, 3).map((a) => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-sm text-[#0d1117] leading-snug">{a.title}</p>
                  <p className="text-[#6b7589] font-mono text-[10px] mt-1">{a.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
