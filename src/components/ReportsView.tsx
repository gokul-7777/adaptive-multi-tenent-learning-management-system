import { STUDENTS, COURSES, DEPARTMENTS } from "../data";

const REPORT_TYPES = [
  { id: "attendance", label: "Attendance Summary", desc: "Per-course attendance percentages for the current semester" },
  { id: "marks", label: "Marks Register", desc: "Consolidated marks register across all components" },
  { id: "cgpa", label: "CGPA Report", desc: "Department-wise CGPA distribution and topper list" },
  { id: "defaulters", label: "Defaulters List", desc: "Students with attendance below 75% threshold" },
  { id: "result", label: "Result Analysis", desc: "Pass/fail statistics and grade distribution by course" },
];

const toppers = STUDENTS.slice().sort((a, b) => b.cgpa - a.cgpa).slice(0, 5);

export default function ReportsView() {
  return (
    <div className="p-8 h-full overflow-auto">
      <div className="mb-6">
        <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Analytics</p>
        <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Reports</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report types */}
        <div className="lg:col-span-1 space-y-2">
          <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold mb-3">Generate Report</h2>
          {REPORT_TYPES.map((r) => (
            <button
              key={r.id}
              className="w-full border border-[#d4d9e4] p-4 text-left hover:border-[#1a56db] hover:bg-[#f0f4ff] transition-colors group"
            >
              <div style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-semibold group-hover:text-[#1a56db] transition-colors">{r.label}</div>
              <p className="text-[#6b7589] text-xs mt-0.5 leading-snug">{r.desc}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-mono text-[#6b7589] bg-[#f0f2f6] px-2 py-0.5 hover:bg-[#e8ecf2]">PDF</span>
                <span className="text-[10px] font-mono text-[#6b7589] bg-[#f0f2f6] px-2 py-0.5">CSV</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Department summary */}
          <div className="border border-[#d4d9e4]">
            <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
              <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Department Summary</h2>
            </div>
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
                  <th className="px-5 py-2.5 text-left">Department</th>
                  <th className="px-5 py-2.5 text-right">Students</th>
                  <th className="px-5 py-2.5 text-right">Avg. CGPA</th>
                  <th className="px-5 py-2.5 text-right">Avg. Att.</th>
                  <th className="px-5 py-2.5 text-right">Defaulters</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dept: "Computer Science", students: 62, cgpa: 8.32, att: 81.4, def: 4 },
                  { dept: "Mathematics", students: 48, cgpa: 7.9, att: 78.2, def: 6 },
                  { dept: "Electronics", students: 55, cgpa: 8.1, att: 83.7, def: 3 },
                  { dept: "Mechanical", students: 50, cgpa: 7.7, att: 76.9, def: 7 },
                ].map((d, i) => (
                  <tr key={d.dept} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                    <td className="px-5 py-3 text-sm text-[#0d1117] font-medium">{d.dept}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#0d1117]">{d.students}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#0d1117]">{d.cgpa.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#0d1117]">{d.att}%</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono text-sm text-red-600">{d.def}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Toppers */}
          <div className="border border-[#d4d9e4]">
            <div className="px-5 py-3.5 border-b border-[#d4d9e4]">
              <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">Top Performers</h2>
            </div>
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
                  <th className="px-5 py-2.5 text-center">Rank</th>
                  <th className="px-5 py-2.5 text-left">Name</th>
                  <th className="px-5 py-2.5 text-left">Roll No.</th>
                  <th className="px-5 py-2.5 text-left">Department</th>
                  <th className="px-5 py-2.5 text-right">CGPA</th>
                </tr>
              </thead>
              <tbody>
                {toppers.map((s, i) => (
                  <tr key={s.id} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-mono text-xs font-bold ${i === 0 ? "text-amber-600" : i === 1 ? "text-[#6b7589]" : i === 2 ? "text-amber-700" : "text-[#6b7589]"}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#0d1117] font-medium">{s.name}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-[#6b7589]">{s.rollNo}</td>
                    <td className="px-5 py-3 text-sm text-[#6b7589]">{s.department}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm font-bold text-[#0f2044]">{s.cgpa.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
