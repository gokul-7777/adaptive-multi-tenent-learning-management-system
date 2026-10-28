import React from "react";
import type { Course } from "../data";

interface Props {
  course: Course;
  studentName: string;
  studentId: string;
  score: number;
  completedAt?: string;
  certificateId?: string;
  onClose: () => void;
}

export default function CourseCertificate({
  course,
  studentName,
  studentId,
  score,
  completedAt,
  certificateId,
  onClose,
}: Props) {
  const issueDate = completedAt
    ? new Date(completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const certCode = certificateId || `CERT-${course.code}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-2 shadow-2xl border border-slate-200 my-auto">
        {/* Certificate Container with Ornamental Double Border */}
        <div
          id="academic-certificate-print"
          className="relative bg-gradient-to-b from-amber-50/40 via-white to-amber-50/30 border-8 border-double border-amber-600/40 rounded-2xl p-8 sm:p-12 text-center select-none shadow-inner"
        >
          {/* Corner Ornaments */}
          <div className="absolute top-3 left-3 text-amber-600/50 text-xl font-serif">❖</div>
          <div className="absolute top-3 right-3 text-amber-600/50 text-xl font-serif">❖</div>
          <div className="absolute bottom-3 left-3 text-amber-600/50 text-xl font-serif">❖</div>
          <div className="absolute bottom-3 right-3 text-amber-600/50 text-xl font-serif">❖</div>

          {/* Institution Header */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-700 to-amber-600 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
              🏛️
            </div>
          </div>
          <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            Adaptive Academic Management System
          </div>
          <div className="text-xs font-semibold tracking-wider text-amber-800 uppercase mt-0.5">
            Board of Higher Technical Education & Examination
          </div>

          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-600/60 to-transparent mx-auto my-3" />

          {/* Certificate Title */}
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 tracking-wide mt-2">
            Certificate of Completion
          </h1>
          <p className="text-xs text-slate-500 italic mt-1 font-serif">
            This official credential confirms academic proficiency and successful course mastery
          </p>

          {/* Recipient Presentation */}
          <div className="my-6">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              This is to certify that
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-extrabold text-indigo-950 mt-1.5 tracking-tight border-b-2 border-indigo-100 pb-1.5 inline-block min-w-[280px]">
              {studentName}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Candidate Roll No: <span className="font-bold text-slate-700">{studentId}</span>
            </div>
          </div>

          {/* Course Details */}
          <div className="max-w-xl mx-auto my-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            has diligently studied all prescribed academic resources, fulfilled all curriculum requirements, and successfully passed the comprehensive subject assessment with a score of
            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mx-1.5">
              {score} / 10 ({score * 10}%)
            </span>
            for the accredited course
          </div>

          {/* Course Title Badge */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-amber-50/60 to-indigo-50/80 border border-indigo-100 rounded-xl py-3 px-6 inline-block my-2 shadow-xs">
            <div className="text-base sm:text-lg font-bold text-indigo-900 font-serif">
              {course.name}
            </div>
            <div className="text-xs text-indigo-600 font-mono mt-0.5">
              Course Code: {course.code} · {course.credits} Academic Credits · Dept: {course.department}
            </div>
          </div>

          {/* Seal and Signatures Footer */}
          <div className="grid grid-cols-3 items-end gap-4 mt-8 pt-6 border-t border-slate-200/80 text-left">
            {/* Faculty Instructor Signature */}
            <div className="text-center">
              <div className="font-serif italic text-base text-slate-800 border-b border-slate-300 pb-1 mb-1">
                {course.instructor || "Prof. Kavitha Nair"}
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Course Faculty Instructor
              </div>
              <div className="text-[9px] text-slate-400">Department of {course.department}</div>
            </div>

            {/* Official Gold Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-4 border-amber-200 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-xl">★</span>
                <span className="text-[8px] font-bold tracking-tighter uppercase font-mono">VERIFIED</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-1">ID: {certCode}</div>
            </div>

            {/* Controller of Examinations Signature */}
            <div className="text-center">
              <div className="font-serif italic text-base text-slate-800 border-b border-slate-300 pb-1 mb-1">
                Dr. Priya Ramesh
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Controller of Examinations
              </div>
              <div className="text-[9px] text-slate-400">Academic Evaluation Council</div>
            </div>
          </div>

          {/* Date of Issue */}
          <div className="mt-5 text-[10px] text-slate-400 font-medium">
            Issued on: {issueDate} · Certified by Adaptive Academic LMS
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Official verifiable transcript credential for <strong className="text-slate-700">{course.code}</strong>.
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
