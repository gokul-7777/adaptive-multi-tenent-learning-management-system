import { COURSES, MARKS, ATTENDANCE, ANNOUNCEMENTS, User } from "../data";

interface Props { user: User; }

const SCHEDULE = [
  { time: "08:00", course: "CS301", name: "Data Structures & Algorithms", room: "LH-204" },
  { time: "10:00", course: "MA201", name: "Engineering Mathematics III", room: "LH-101" },
  { time: "14:00", course: "CS302", name: "Database Management Systems", room: "LH-205" },
];

export default function StudentDashboard({ user }: Props) {
  const studentId = "s1";
  const myCourses = COURSES.slice(0, 3);

  const totalPresent = ATTENDANCE.filter((a) => a.studentId === studentId && (a.status === "present" || a.status === "late")).length;
  const totalClasses = ATTENDANCE.filter((a) => a.studentId === studentId).length;
  const attPct = totalClasses ? Math.round((totalPresent / totalClasses) * 100) : 0;

  const myMarks = MARKS.filter((m) => m.studentId === studentId);
  const totalObtained = myMarks.reduce((a, b) => a + b.obtained, 0);
  const totalMax = myMarks.reduce((a, b) => a + b.maxMarks, 0);
  const marksPct = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Student Portal</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">
            Hello, {user.name.split(" ")[0]}
          </h1>
          <p className="text-[#6b7589] text-xs mt-1">{user.rollNo} · {user.department} · Semester 3</p>
        </div>
        <div className="text-right">
          <div className="text-[#6b7589] font-mono text-[10px]">Today</div>
          <div className="text-[#0f2044] font-mono text-sm font-medium">Friday, Aug 22</div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#d4d9e4]">
        {[
          { label: "Attendance", value: `${attPct}%`, sub: `${totalPresent}/${totalClasses} classes`, color: attPct >= 75 ? "border-emerald-500" : "border-red-500" },
          { label: "Overall Marks", value: `${marksPct}%`, sub: `${totalObtained}/${totalMax} pts`, color: "border-[#1a56db]" },
          { label: "CGPA", value: "8.7", sub: "Current", color: "border-violet-500" },
          { label: "Courses", value: String(myCourses.length), sub: "This semester", color: "border-amber-500" },
        ].map((s) => (
          <div key={s.label} className={`bg-white p-5 border-t-2 ${s.color}`}>
            <div className="text-[#6b7589] font-mono text-[10px] uppercase tracking-wider mb-2">{s.label}</div>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-3xl font-bold mb-0.5">{s.value}</div>
            <div className="text-[#6b7589] text-xs">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="border border-[#d4d9e4]">
          <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Today's Schedule</h2>
          </div>
          <div className="divide-y divide-[#d4d9e4]">
            {SCHEDULE.map((s) => (
              <div key={s.time} className="px-5 py-3.5 flex items-center gap-4">
                <div className="text-[#1a56db] font-mono text-[10px] w-10 flex-shrink-0">{s.time}</div>
                <div className="border-l border-[#d4d9e4] pl-3 flex-1 min-w-0">
                  <div className="text-[#0d1117] text-sm font-medium truncate">{s.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[9px] text-[#1a56db] bg-[#1a56db]/8 px-1.5 py-0.5">{s.course}</span>
                    <span className="text-[#6b7589] font-mono text-[9px]">{s.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My courses */}
        <div className="border border-[#d4d9e4]">
          <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">My Courses</h2>
          </div>
          <div className="divide-y divide-[#d4d9e4]">
            {myCourses.map((c) => {
              const recs = ATTENDANCE.filter((a) => a.studentId === studentId && a.courseId === c.id);
              const present = recs.filter((a) => a.status === "present" || a.status === "late").length;
              const pct = recs.length ? Math.round((present / recs.length) * 100) : 0;
              return (
                <div key={c.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[9px] text-[#1a56db] bg-[#1a56db]/8 px-1.5 py-0.5">{c.code}</span>
                      <div className="text-[#0d1117] text-xs font-medium mt-1 leading-snug">{c.name}</div>
                    </div>
                    <span className={`font-mono text-xs font-bold flex-shrink-0 ml-2 ${pct >= 75 ? "text-emerald-600" : "text-red-600"}`}>{pct}%</span>
                  </div>
                  <div className="mt-2 h-1 bg-[#e8ecf2]">
                    <div className={`h-full ${pct >= 75 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notices */}
        <div className="border border-[#d4d9e4]">
          <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Notices</h2>
          </div>
          <div className="divide-y divide-[#d4d9e4]">
            {ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="px-5 py-3.5">
                <div className="flex items-start gap-2">
                  {a.urgent && <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />}
                  <div>
                    <p className="text-sm text-[#0d1117] leading-snug">{a.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[#6b7589]">{a.date}</span>
                      <span className="font-mono text-[9px] bg-[#f0f2f6] px-1.5 py-0.5 text-[#6b7589]">{a.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
