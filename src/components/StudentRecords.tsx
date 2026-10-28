import { useState } from "react";
import { STUDENTS, DEPARTMENTS, Student } from "../data";

export default function StudentRecords() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = STUDENTS.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchDept = dept === "All" || s.department === dept;
    const matchStatus = status === "All" || s.status === status;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[#6b7589] font-mono text-[10px] uppercase tracking-widest mb-1">Records</p>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-2xl font-bold">Student Records</h1>
        </div>
        <button className="bg-[#0f2044] hover:bg-[#1a3568] text-white text-xs px-4 py-2.5 transition-colors font-medium">
          + Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, roll no., or email…"
          className="border border-[#d4d9e4] px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:border-[#1a56db]"
        />
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="border border-[#d4d9e4] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a56db] text-[#0d1117]"
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-[#d4d9e4] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1a56db] text-[#0d1117]"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-[#6b7589] font-mono text-[10px] ml-auto">{filtered.length} records</span>
      </div>

      <div className="border border-[#d4d9e4]">
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-[#d4d9e4] bg-[#f8f9fb]">
              <th className="px-5 py-2.5 text-left">Roll No.</th>
              <th className="px-5 py-2.5 text-left">Name</th>
              <th className="px-5 py-2.5 text-left">Email</th>
              <th className="px-5 py-2.5 text-left">Department</th>
              <th className="px-5 py-2.5 text-left">Batch</th>
              <th className="px-5 py-2.5 text-center">Sem</th>
              <th className="px-5 py-2.5 text-right">CGPA</th>
              <th className="px-5 py-2.5 text-center">Status</th>
              <th className="px-5 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr
                key={s.id}
                className={`border-b border-[#d4d9e4] last:border-0 hover:bg-[#f0f4ff] cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-[#f8f9fb]/50"} ${selected?.id === s.id ? "bg-[#eff4ff]" : ""}`}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
              >
                <td className="px-5 py-3 font-mono text-[11px] text-[#6b7589]">{s.rollNo}</td>
                <td className="px-5 py-3 text-sm text-[#0d1117] font-medium">{s.name}</td>
                <td className="px-5 py-3 text-sm text-[#6b7589]">{s.email}</td>
                <td className="px-5 py-3 text-sm text-[#6b7589]">{s.department}</td>
                <td className="px-5 py-3 font-mono text-[11px] text-[#6b7589]">{s.batch}</td>
                <td className="px-5 py-3 text-center font-mono text-sm text-[#0d1117]">{s.semester}</td>
                <td className="px-5 py-3 text-right font-mono text-sm font-medium text-[#0d1117]">{s.cgpa.toFixed(1)}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`font-mono text-[9px] px-2 py-0.5 uppercase tracking-wide ${s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="text-[#1a56db] text-xs hover:underline font-mono">Edit</button>
                    <span className="text-[#d4d9e4]">·</span>
                    <button className="text-red-500 text-xs hover:underline font-mono">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[#6b7589] text-sm">No records match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-5 border border-[#d4d9e4] bg-[#f8f9fb] p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-base font-bold">{selected.name}</h3>
              <p className="text-[#6b7589] font-mono text-[11px] mt-0.5">{selected.rollNo} · {selected.department}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#6b7589] hover:text-[#0d1117] text-sm font-mono">✕ Close</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Email", value: selected.email },
              { label: "Batch", value: selected.batch },
              { label: "Semester", value: String(selected.semester) },
              { label: "CGPA", value: selected.cgpa.toFixed(2) },
              { label: "Status", value: selected.status.toUpperCase() },
              { label: "Department", value: selected.department },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[#6b7589] font-mono text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
                <div className="text-[#0d1117] text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
