import { useState } from "react";
import { STUDENTS, COURSES, MARKS, User } from "../data";

interface Props {
  user: User;
}

export default function MarksView({ user }: Props) {
  const isStudent = user.role === "student";
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0].id);

  if (isStudent) {
    const studentId = "s1";
    const studentCourses = COURSES.slice(0, 3);

    return (
      <div className="p-8 h-full overflow-auto">
        <div className="mb-6">
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Academic Performance</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Marks & Grades</h1>
        </div>

        <div className="space-y-4">
          {studentCourses.map((course) => {
            const courseMarks = MARKS.filter((m) => m.studentId === studentId && m.courseId === course.id);
            const totalObtained = courseMarks.reduce((a, b) => a + b.obtained, 0);
            const totalMax = courseMarks.reduce((a, b) => a + b.maxMarks, 0);
            const pct = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;
            const grade = pct >= 90 ? "O" : pct >= 80 ? "A+" : pct >= 70 ? "A" : pct >= 60 ? "B+" : pct >= 50 ? "B" : "F";

            return (
              <div key={course.id} className="border border-[#d4d9e4]">
                <div className="px-5 py-4 border-b border-[#d4d9e4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#1a56db] bg-[#1a56db]/8 px-2 py-0.5">{course.code}</span>
                    <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] font-bold text-sm">{course.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[#6b7589] font-mono text-[9px] uppercase">Total</div>
                      <div className="text-[#0d1117] font-mono text-sm font-bold">{totalObtained}/{totalMax}</div>
                    </div>
                    <div className="w-10 h-10 bg-[#0f2044] flex items-center justify-center">
                      <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-white text-sm font-bold">{grade}</span>
                    </div>
                  </div>
                </div>
                {courseMarks.length > 0 ? (
                  <table className="w-full data-table">
                    <thead>
                      <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
                        <th className="px-5 py-2.5 text-left">Component</th>
                        <th className="px-5 py-2.5 text-right">Max Marks</th>
                        <th className="px-5 py-2.5 text-right">Obtained</th>
                        <th className="px-5 py-2.5 text-right">%</th>
                        <th className="px-5 py-2.5 text-left">Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseMarks.map((m, i) => {
                        const p = Math.round((m.obtained / m.maxMarks) * 100);
                        return (
                          <tr key={m.component} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                            <td className="px-5 py-3 text-sm text-[#0d1117]">{m.component}</td>
                            <td className="px-5 py-3 text-right font-mono text-sm text-[#6b7589]">{m.maxMarks}</td>
                            <td className="px-5 py-3 text-right font-mono text-sm font-medium text-[#0d1117]">{m.obtained}</td>
                            <td className="px-5 py-3 text-right font-mono text-sm text-[#6b7589]">{p}%</td>
                            <td className="px-5 py-3">
                              <div className="h-1.5 bg-[#e8ecf2] w-full">
                                <div className={`h-full ${p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-[#1a56db]" : "bg-red-500"}`} style={{ width: `${p}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-5 py-5 text-[#6b7589] text-sm">Marks not published yet.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Faculty / Admin — enter marks
  const facultyCourses = user.role === "faculty"
    ? COURSES.filter((c) => c.facultyId === user.id)
    : COURSES;

  const course = facultyCourses.find((c) => c.id === selectedCourse) ?? facultyCourses[0];
  const studentsInCourse = STUDENTS.slice(0, 6);
  const [component, setComponent] = useState("Internal 1");
  const [maxMarks, setMaxMarks] = useState("50");
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(studentsInCourse.map((s) => [s.id, ""]))
  );

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Assessment</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Enter Marks</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border border-[#d4d9e4] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a56db] text-[#0d1117]"
        >
          {facultyCourses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
        <select
          value={component}
          onChange={(e) => setComponent(e.target.value)}
          className="border border-[#d4d9e4] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a56db] text-[#0d1117]"
        >
          {["Internal 1", "Internal 2", "Assignment", "End Semester"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-[#6b7589] text-xs font-mono">Max:</label>
          <input
            type="number"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            className="border border-[#d4d9e4] px-2 py-2 text-sm w-16 focus:outline-none focus:border-[#1a56db] text-center"
          />
        </div>
      </div>

      <div className="border border-[#d4d9e4]">
        <div className="px-5 py-3 border-b border-[#d4d9e4] bg-[#f8f9fb]">
          <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold">
            {course?.name} — {component}
          </span>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
              <th className="px-5 py-2.5 text-left">Roll No.</th>
              <th className="px-5 py-2.5 text-left">Name</th>
              <th className="px-5 py-2.5 text-center">Marks (/{maxMarks})</th>
              <th className="px-5 py-2.5 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {studentsInCourse.map((s, i) => {
              const score = scores[s.id] ?? "";
              const pct = score && maxMarks ? Math.round((Number(score) / Number(maxMarks)) * 100) : null;
              return (
                <tr key={s.id} className={`border-b border-[#d4d9e4] last:border-0 ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"}`}>
                  <td className="px-5 py-2.5 font-mono text-[11px] text-[#6b7589]">{s.rollNo}</td>
                  <td className="px-5 py-2.5 text-sm text-[#0d1117] font-medium">{s.name}</td>
                  <td className="px-5 py-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      max={maxMarks}
                      value={score}
                      onChange={(e) => setScores((p) => ({ ...p, [s.id]: e.target.value }))}
                      placeholder="—"
                      className="border border-[#d4d9e4] w-16 px-2 py-1 text-center text-sm font-mono focus:outline-none focus:border-[#1a56db]"
                    />
                  </td>
                  <td className="px-5 py-2.5 text-center font-mono text-sm text-[#6b7589]">
                    {pct !== null ? `${pct}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#d4d9e4] flex items-center justify-end gap-3">
          <button className="border border-[#d4d9e4] text-[#6b7589] text-xs px-4 py-2 hover:border-[#0f2044] hover:text-[#0d1117] transition-colors font-medium">
            Save Draft
          </button>
          <button className="bg-[#0f2044] hover:bg-[#1a3568] text-white text-xs px-5 py-2 transition-colors font-medium">
            Publish Marks
          </button>
        </div>
      </div>
    </div>
  );
}
