import React, { useState } from "react";
import { type RealStudyPdf, type StudyUnit } from "../data/realStudyPdfs";

interface Props {
  pdfData: RealStudyPdf;
  onClose: () => void;
  onLaunchAssessment?: () => void;
}

export default function StudyPdfViewerModal({
  pdfData,
  onClose,
  onLaunchAssessment,
}: Props) {
  const [activeUnitTab, setActiveUnitTab] = useState<number | "all" | "formulas" | "practice">("all");
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [themeMode, setThemeMode] = useState<"paper" | "slate" | "dark">("paper");

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${pdfData.courseCode} - ${pdfData.title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 860px; margin: 40px auto; padding: 0 20px; }
  h1 { color: #1e1b4b; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
  h2 { color: #312e81; margin-top: 30px; }
  h3 { color: #4338ca; }
  pre { background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; }
  .badge { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
  .formula-box { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 12px 0; }
  .meta-bar { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 24px; }
  @media print { body { margin: 15mm; max-width: 100%; } }
</style>
</head>
<body>
  <div class="meta-bar">
    <strong>${pdfData.department}</strong><br>
    Course: ${pdfData.courseCode} — ${pdfData.courseName} (${pdfData.credits} Credits) | Faculty: ${pdfData.instructor}<br>
    Document: ${pdfData.officialDocNumber} | ${pdfData.academicYear}
  </div>
  <h1>${pdfData.title}</h1>
  <p><em>${pdfData.subtitle}</em></p>
  <hr>
  ${pdfData.units
    .map(
      (u) => `
    <h2>Unit ${u.unitNumber}: ${u.unitTitle}</h2>
    <p><strong>Overview:</strong> ${u.summary}</p>
    ${u.sections
      .map(
        (s) => `
      <h3>${s.title}</h3>
      <p>${s.content}</p>
      ${s.codeOrDiagram ? `<pre>${s.codeOrDiagram}</pre>` : ""}
      ${
        s.keyPoints
          ? `<ul>${s.keyPoints.map((kp) => `<li>${kp}</li>`).join("")}</ul>`
          : ""
      }
    `
      )
      .join("")}
  `
    )
    .join("")}
  <h2>Faculty Exam Formula Sheet</h2>
  ${pdfData.examFormulas
    .map(
      (f) => `
    <div class="formula-box">
      <strong>${f.name}:</strong> <code>${f.formula}</code><br>
      <small>${f.description}</small>
    </div>
  `
    )
    .join("")}
  <h2>Verified Practice Problems & Solutions</h2>
  ${pdfData.practiceQuestions
    .map(
      (pq, i) => `
    <div style="margin-bottom: 16px;">
      <strong>Q${i + 1}: ${pq.question}</strong><br>
      <span style="color: #047857; font-weight: bold;">Answer: ${pq.answer}</span><br>
      <small style="color: #64748b;">Explanation: ${pq.explanation}</small>
    </div>
  `
    )
    .join("")}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdfData.courseCode}_Official_Study_Guide.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const textSizeClass =
    fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-base" : "text-sm";

  const themeClasses =
    themeMode === "dark"
      ? "bg-slate-900 text-slate-100"
      : themeMode === "slate"
      ? "bg-slate-50 text-slate-800"
      : "bg-amber-50/30 text-slate-800"; // Paper mode

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden my-auto">
        {/* Top Control Bar & Document Meta */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-lg flex-shrink-0">
              📄
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded">
                  {pdfData.courseCode}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {pdfData.courseName}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.2 rounded-full hidden sm:inline-block">
                  ✓ VERIFIED ACADEMIC PDF
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {pdfData.officialDocNumber} · {pdfData.instructor} · {pdfData.credits} Academic Credits
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Print / Save to PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Print or Save as real PDF file"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            {/* Download Standalone File Button */}
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="Download standalone HTML document"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors cursor-pointer ml-1"
              title="Close PDF Viewer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Reader Preferences Bar */}
        <div className="px-5 py-2 bg-slate-100 border-b border-slate-200/90 flex items-center justify-between gap-3 text-xs flex-shrink-0 select-none overflow-x-auto">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveUnitTab("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                activeUnitTab === "all"
                  ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Full Study Guide
            </button>
            {pdfData.units.map((u) => (
              <button
                key={u.unitNumber}
                onClick={() => setActiveUnitTab(u.unitNumber)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs whitespace-nowrap ${
                  activeUnitTab === u.unitNumber
                    ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                Unit {u.unitNumber}
              </button>
            ))}
            <button
              onClick={() => setActiveUnitTab("formulas")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs whitespace-nowrap ${
                activeUnitTab === "formulas"
                  ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              📐 Formulas ({pdfData.examFormulas.length})
            </button>
            <button
              onClick={() => setActiveUnitTab("practice")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs whitespace-nowrap ${
                activeUnitTab === "practice"
                  ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              🎯 Practice ({pdfData.practiceQuestions.length})
            </button>
          </div>

          {/* Reader Controls: Font & Theme */}
          <div className="flex items-center gap-3">
            {/* Font Size Selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setFontSize("sm")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === "sm" ? "bg-indigo-600 text-white" : "text-slate-600"
                }`}
                title="Small text"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("base")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === "base" ? "bg-indigo-600 text-white" : "text-slate-600"
                }`}
                title="Normal text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === "lg" ? "bg-indigo-600 text-white" : "text-slate-600"
                }`}
                title="Large text"
              >
                A+
              </button>
            </div>

            {/* Reading Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setThemeMode("paper")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  themeMode === "paper" ? "bg-amber-100 text-amber-900 font-bold" : "text-slate-600"
                }`}
                title="Paper Reading Mode"
              >
                📜 Paper
              </button>
              <button
                onClick={() => setThemeMode("slate")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  themeMode === "slate" ? "bg-indigo-100 text-indigo-900 font-bold" : "text-slate-600"
                }`}
                title="Clean White Mode"
              >
                ⚪ Clean
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  themeMode === "dark" ? "bg-slate-900 text-white font-bold" : "text-slate-600"
                }`}
                title="Night Mode"
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div
          id="academic-study-pdf-print"
          className={`flex-1 overflow-y-auto p-6 sm:p-10 transition-colors ${themeClasses}`}
        >
          {/* Document Cover Header */}
          <div className="border-b-2 border-indigo-600/30 pb-6 mb-8 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                🏛️ {pdfData.department}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {pdfData.academicYear} · {pdfData.edition}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2 text-indigo-950">
              {pdfData.title}
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-2xl">
              {pdfData.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                Course: <span className="text-indigo-700 font-bold">{pdfData.courseCode} — {pdfData.courseName}</span>
              </span>
              <span>•</span>
              <span>Instructor: <strong>{pdfData.instructor}</strong></span>
              <span>•</span>
              <span>Credits: <strong>{pdfData.credits} Units</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Verified Exam Material
              </span>
            </div>
          </div>

          {/* Unit Sections */}
          {pdfData.units
            .filter((u) => activeUnitTab === "all" || activeUnitTab === u.unitNumber)
            .map((unit) => (
              <section key={unit.unitNumber} className="mb-10 last:mb-6">
                {/* Unit Header */}
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-indigo-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {unit.unitNumber}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                        Unit {unit.unitNumber}: {unit.unitTitle}
                      </h2>
                      <span className="text-[11px] text-slate-400">
                        Estimated Reading & Retention: {unit.readingTime}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 hidden sm:inline-block">
                    Curriculum Core
                  </span>
                </div>

                {/* Unit Summary Callout */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 mb-6 text-xs text-indigo-950 leading-relaxed shadow-2xs">
                  <strong className="block text-indigo-900 font-bold mb-1 uppercase text-[10px] tracking-wide">
                    📌 Module Objective & Core Overview:
                  </strong>
                  {unit.summary}
                </div>

                {/* Subsections */}
                <div className="space-y-6">
                  {unit.sections.map((sec, idx) => (
                    <article key={idx} className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                      <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {sec.title}
                      </h3>

                      <p className={`leading-relaxed text-slate-700 mb-4 ${textSizeClass}`}>
                        {sec.content}
                      </p>

                      {sec.codeOrDiagram && (
                        <div className="mb-4">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>Visual Architecture & Algorithmic Tracing</span>
                            <span className="font-mono text-indigo-600">ASCII / Code Trace</span>
                          </div>
                          <pre className="bg-slate-900 text-indigo-200 text-xs p-4 rounded-xl font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                            {sec.codeOrDiagram}
                          </pre>
                        </div>
                      )}

                      {sec.keyPoints && sec.keyPoints.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 text-xs text-slate-700">
                          <strong className="block text-slate-900 font-bold mb-1.5 uppercase text-[10px] tracking-wide">
                            ⭐ Critical Exam Insights & Invariants:
                          </strong>
                          <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                            {sec.keyPoints.map((kp, kIdx) => (
                              <li key={kIdx} className="text-slate-600">
                                {kp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}

          {/* Formulas Sheet Section */}
          {(activeUnitTab === "all" || activeUnitTab === "formulas") && (
            <section className="mb-10 pt-4 border-t-2 border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📐</span> High-Yield Examination Formula Reference Sheet
                </h2>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Quick Revision
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pdfData.examFormulas.map((f, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div className="text-xs font-bold text-indigo-900 mb-1">{f.name}</div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 font-mono text-xs font-bold text-indigo-700 mb-1.5">
                      {f.formula}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">{f.description}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Practice Solved Problems Section */}
          {(activeUnitTab === "all" || activeUnitTab === "practice") && (
            <section className="mb-6 pt-4 border-t-2 border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🎯</span> Model Faculty Exam Questions & Worked Solutions
                </h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Solved Examples
                </span>
              </div>

              <div className="space-y-3">
                {pdfData.practiceQuestions.map((pq, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 mb-2">
                      <span className="text-indigo-600 font-bold mr-1">Q{i + 1}.</span> {pq.question}
                    </div>
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-950 font-medium mb-1.5">
                      <strong className="text-emerald-800 font-bold block text-[10px] uppercase">Official Answer:</strong>
                      {pq.answer}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-slate-700 font-semibold">Faculty Explanation:</strong> {pq.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom Stamp of Academic Verification */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className="font-semibold text-slate-600">Official Courseware Authorization</span>
            </div>
            <p className="text-[11px]">
              This comprehensive study document is officially verified for {pdfData.courseName} ({pdfData.courseCode}).
              Prepared by {pdfData.instructor} · Department of Computer Science & Engineering.
            </p>
          </div>
        </div>

        {/* Footer Bar with Action to Assessment */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0 select-none">
          <div className="text-xs text-slate-500 hidden sm:block">
            Finished reading the study document? Head to the timed assessment.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close Reader
            </button>

            {onLaunchAssessment && (
              <button
                onClick={() => {
                  onClose();
                  onLaunchAssessment();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>⏱️</span>
                <span>Proceed to MCQ Exam (10 Questions) →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
