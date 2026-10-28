import { useState } from "react";
import { COURSES, USERS } from "../data";

export default function CoursesList() {
  const [search, setSearch] = useState("");

  const filtered = COURSES.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.department.toLowerCase().includes(q);
  });

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Curriculum</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Courses</h1>
        </div>
        <button className="bg-[#0f2044] hover:bg-[#1a3568] text-white text-xs px-4 py-2.5 transition-colors font-medium">
          + Add Course
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name, or department…"
          className="border border-[#d4d9e4] px-3 py-2 text-sm flex-1 max-w-sm focus:outline-none focus:border-[#1a56db]"
        />
        <span className="text-[#6b7589] font-mono text-[10px] ml-auto">{filtered.length} courses</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-[#d4d9e4]">
        {filtered.map((course) => {
          const faculty = USERS.find((u) => u.id === course.facultyId);
          return (
            <div key={course.id} className="bg-white p-5 hover:bg-[#f8f9fb] transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-[11px] text-[#1a56db] bg-[#1a56db]/8 px-2 py-0.5">{course.code}</span>
                <span className="text-[#6b7589] font-mono text-[10px]">{course.credits} cr</span>
              </div>
              <h3 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-sm font-bold mb-1 leading-snug group-hover:text-[#1a56db] transition-colors">
                {course.name}
              </h3>
              <p className="text-[#6b7589] text-xs mb-3">{course.department}</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#6b7589]">{faculty?.name ?? "Unassigned"}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[#0d1117] font-mono font-medium">{course.enrolled}</span>
                  <span className="text-[#6b7589]">enrolled</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#e8ecf2] flex items-center gap-3 text-[10px] font-mono text-[#6b7589]">
                <span>Sem {course.semester}</span>
                <span className="text-[#d4d9e4]">·</span>
                <span>AY 2024–25</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
