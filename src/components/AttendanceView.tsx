import { useState } from "react";
import { STUDENTS, COURSES, ATTENDANCE, User } from "../data";

interface Props {
  user: User;
}

export default function AttendanceView({ user }: Props) {
  const isFaculty = user.role === "faculty";
  const isStudent = user.role === "student";

  const [selectedCourse, setSelectedCourse] = useState(COURSES[0].id);
  const [viewDate, setViewDate] = useState("2024-08-22");

  const relevantCourses = isFaculty
    ? COURSES.filter((c) => c.facultyId === user.id)
    : COURSES.slice(0, 3);

  const course = COURSES.find((c) => c.id === selectedCourse)!;

  // For student view, show their own attendance across courses
  if (isStudent) {
    const studentId = "s1"; // logged-in student's data
    return (
      <div className="p-8 h-full overflow-auto">
        <div className="mb-6">
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">My Records</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Attendance</h1>
        </div>

        <div className="grid grid-cols-3 gap-px bg-[#d4d9e4] mb-6">
          {[
            { label: "Classes Attended", value: "42", of: "/ 50", color: "border-emerald-500" },
            { label: "Attendance %", value: "84%", of: "", color: "border-[#1a56db]" },
            { label: "Leaves / Absent", value: "8", of: "days", color: "border-amber-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white p-5 border-t-2 ${s.color}`}>
              <div className="text-[#6b7589] font-mono text-[10px] uppercase tracking-wider mb-1">{s.label}</div>
              <div style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-3xl font-bold">
                {s.value}<span className="text-base text-[#6b7589] font-normal ml-1">{s.of}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {COURSES.slice(0, 3).map((c) => {
            const recs = ATTENDANCE.filter((a) => a.studentId === studentId && a.courseId === c.id);
            const present = recs.filter((a) => a.status === "present" || a.status === "late").length;
            const total = recs.length;
            const pct = total ? Math.round((present / total) * 100) : 0;
            return (
              <div key={c.id} className="border border-[#d4d9e4] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-mono text-[10px] text-[#1a56db] bg-[#1a56db]/8 px-1.5 py-0.5 mr-2">{c.code}</span>
                    <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-bold ${pct >= 75 ? "text-emerald-600" : "text-red-600"}`}>{pct}%</span>
                    <span className="text-[#6b7589] font-mono text-[10px] ml-1">{present}/{total}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#e8ecf2]">
                  <div className={`h-full ${pct >= 75 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </div>
                {pct < 75 && (
                  <p className="text-red-600 text-xs mt-2">⚠ Below 75% attendance threshold</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {recs.map((r) => (
                    <span
                      key={r.date}
                      title={r.date}
                      className={`w-5 h-5 text-[8px] font-mono flex items-center justify-center ${
                        r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "late" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.status === "present" ? "P" : r.status === "late" ? "L" : "A"}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Faculty / Admin view — mark attendance
  const studentsInCourse = STUDENTS.slice(0, 6);
  const [marks, setMarks] = useState<Record<string, "present" | "absent" | "late">>(
    Object.fromEntries(studentsInCourse.map((s) => [s.id, "present"]))
  );

  const toggle = (id: string) => {
    setMarks((prev) => {
      const cur = prev[id];
      const next = cur === "present" ? "absent" : cur === "absent" ? "late" : "present";
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Faculty</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Mark Attendance</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border border-[#d4d9e4] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a56db] text-[#0d1117]"
        >
          {relevantCourses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
          className="border border-[#d4d9e4] px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]"
        />
        <div className="ml-auto flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 border border-emerald-300" />Present</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-300" />Absent</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 border border-amber-300" />Late</span>
        </div>
      </div>

      <div className="border border-[#d4d9e4]">
        <div className="px-5 py-3 border-b border-[#d4d9e4] bg-[#f8f9fb] flex items-center justify-between">
          <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">{course?.name}</span>
          <span className="text-[#6b7589] font-mono text-[10px]">{viewDate} · {studentsInCourse.length} students</span>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
              <th className="px-5 py-2.5 text-left">Roll No.</th>
              <th className="px-5 py-2.5 text-left">Name</th>
              <th className="px-5 py-2.5 text-center">Status</th>
              <th className="px-5 py-2.5 text-center">Toggle</th>
            </tr>
          </thead>
          <tbody>
            {studentsInCourse.map((s, i) => {
              const st = marks[s.id] ?? "present";
              return (
                <tr key={s.id} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#6b7589]">{s.rollNo}</td>
                  <td className="px-5 py-3 text-sm text-[#0d1117] font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-mono text-[9px] px-2 py-0.5 uppercase tracking-wide ${
                      st === "present" ? "bg-emerald-50 text-emerald-700" :
                      st === "absent" ? "bg-red-50 text-red-600" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {st}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggle(s.id)}
                      className="text-[#1a56db] font-mono text-[10px] hover:underline"
                    >
                      Change
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#d4d9e4] flex items-center justify-between">
          <span className="text-[#6b7589] font-mono text-[10px]">
            Present: {Object.values(marks).filter((v) => v === "present").length} ·
            Absent: {Object.values(marks).filter((v) => v === "absent").length} ·
            Late: {Object.values(marks).filter((v) => v === "late").length}
          </span>
          <button className="bg-[#0f2044] hover:bg-[#1a3568] text-white text-xs px-5 py-2 transition-colors font-medium">
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
