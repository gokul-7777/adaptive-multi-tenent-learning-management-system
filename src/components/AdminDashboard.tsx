import { STUDENTS, COURSES, USERS, ANNOUNCEMENTS } from "../data";

const stats = [
  { label: "Total Students", value: "847", delta: "+12 this semester", color: "border-[#1a56db]" },
  { label: "Active Courses", value: "64", delta: "6 departments", color: "border-emerald-500" },
  { label: "Faculty Members", value: "38", delta: "3 on leave", color: "border-violet-500" },
  { label: "Avg. Attendance", value: "82.4%", delta: "↑ 2.1% vs last month", color: "border-amber-500" },
];

const deptData = [
  { name: "Computer Science", students: 212, courses: 18, faculty: 9 },
  { name: "Mathematics", students: 178, courses: 12, faculty: 6 },
  { name: "Electronics", students: 195, courses: 16, faculty: 8 },
  { name: "Mechanical", students: 162, courses: 14, faculty: 8 },
  { name: "Civil", students: 100, courses: 10, faculty: 7 },
];

export default function AdminDashboard() {
  const activeStudents = STUDENTS.filter((s) => s.status === "active").length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Overview</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Academic Dashboard</h1>
        </div>
        <div className="text-right">
          <div className="text-[#6b7589] font-mono text-[10px]">Academic Year</div>
          <div className="text-[#0f2044] font-mono text-sm font-medium">2024–25 · Sem III</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#d4d9e4]">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white p-5 border-t-2 ${s.color}`}>
            <div className="text-[#6b7589] font-mono text-[10px] uppercase tracking-wider mb-2">{s.label}</div>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-3xl font-bold mb-1">{s.value}</div>
            <div className="text-[#6b7589] text-xs">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department breakdown */}
        <div className="lg:col-span-2 border border-[#d4d9e4]">
          <div className="px-5 py-3.5 border-b border-[#d4d9e4] flex items-center justify-between">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Department Overview</h2>
            <span className="text-[#6b7589] font-mono text-[10px]">AY 2024–25</span>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
                <th className="px-5 py-2.5 text-left">Department</th>
                <th className="px-5 py-2.5 text-right">Students</th>
                <th className="px-5 py-2.5 text-right">Courses</th>
                <th className="px-5 py-2.5 text-right">Faculty</th>
                <th className="px-5 py-2.5 text-left">Load</th>
              </tr>
            </thead>
            <tbody>
              {deptData.map((dept, i) => {
                const max = Math.max(...deptData.map((d) => d.students));
                const pct = Math.round((dept.students / max) * 100);
                return (
                  <tr key={dept.name} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                    <td className="px-5 py-3 text-sm text-[#0d1117] font-medium">{dept.name}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#0d1117]">{dept.students}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#6b7589]">{dept.courses}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#6b7589]">{dept.faculty}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-[#e8ecf2] flex-1">
                          <div className="h-full bg-[#1a56db]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[#6b7589] font-mono text-[10px] w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Announcements */}
        <div className="border border-[#d4d9e4]">
          <div className="px-5 py-3.5 border-b border-[#d4d9e4] flex items-center justify-between">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Announcements</h2>
            <button className="text-[#1a56db] text-[10px] font-mono hover:underline">+ New</button>
          </div>
          <div className="divide-y divide-[#d4d9e4]">
            {ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="px-5 py-3.5">
                <div className="flex items-start gap-2">
                  {a.urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />}
                  <div>
                    <p className="text-sm text-[#0d1117] leading-snug">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#6b7589] font-mono text-[10px]">{a.date}</span>
                      <span className="text-[#6b7589] font-mono text-[10px] bg-[#f0f2f6] px-1.5 py-0.5">{a.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="border border-[#d4d9e4]">
        <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
          <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Recent Student Records</h2>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
              <th className="px-5 py-2.5 text-left">Roll No.</th>
              <th className="px-5 py-2.5 text-left">Name</th>
              <th className="px-5 py-2.5 text-left">Department</th>
              <th className="px-5 py-2.5 text-left">Batch</th>
              <th className="px-5 py-2.5 text-right">CGPA</th>
              <th className="px-5 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.slice(0, 5).map((s, i) => (
              <tr key={s.id} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                <td className="px-5 py-3 font-mono text-[11px] text-[#6b7589]">{s.rollNo}</td>
                <td className="px-5 py-3 text-sm text-[#0d1117] font-medium">{s.name}</td>
                <td className="px-5 py-3 text-sm text-[#6b7589]">{s.department}</td>
                <td className="px-5 py-3 font-mono text-[11px] text-[#6b7589]">{s.batch}</td>
                <td className="px-5 py-3 text-right font-mono text-sm font-medium text-[#0d1117]">{s.cgpa.toFixed(1)}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`font-mono text-[9px] px-2 py-0.5 uppercase tracking-wide ${s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
