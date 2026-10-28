import { useState } from "react";
import { DEMO_LOGINS, USERS, User } from "../data";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const match = DEMO_LOGINS.find(
        (d) => d.email === email && d.password === password
      );
      if (match) {
        const user = USERS.find((u) => u.id === match.userId)!;
        onLogin(user);
      } else {
        setError("Invalid credentials. Check the demo accounts below.");
      }
      setLoading(false);
    }, 400);
  };

  const quickLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-[#0f2044] flex flex-col">
      {/* Header bar */}
      <div className="border-b border-white/10 px-8 py-4 flex items-center gap-3">
        <div className="w-7 h-7 bg-[#1a56db] flex items-center justify-center">
          <span className="text-white text-xs font-bold font-mono">A</span>
        </div>
        <span style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-white font-semibold tracking-wide text-sm">
          AAES
        </span>
        <span className="text-white/30 text-xs ml-1">Automated Academic Workflow System</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left panel */}
          <div className="p-10 flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-[#1a56db] font-mono text-xs tracking-widest uppercase mb-3">Academic Year 2024–25</p>
              <h1 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-white text-4xl font-bold leading-tight mb-4">
                Centralized<br />Academic<br />Management
              </h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Role-based access for administrators, faculty, and students. Manage records, attendance, marks, and reports from a single platform.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: "Admin", email: "admin@aaes.edu", password: "admin123", color: "bg-[#1a56db]" },
                { label: "Faculty", email: "kavitha@aaes.edu", password: "faculty123", color: "bg-emerald-600" },
                { label: "Student", email: "rahul@aaes.edu", password: "student123", color: "bg-violet-600" },
              ].map((demo) => (
                <button
                  key={demo.label}
                  onClick={() => quickLogin(demo.email, demo.password)}
                  className="flex items-center gap-3 text-left w-full group"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${demo.color} group-hover:scale-125 transition-transform`} />
                  <span className="text-white/40 text-xs group-hover:text-white/70 transition-colors font-mono">
                    {demo.email} · {demo.password}
                  </span>
                  <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${demo.color} text-white opacity-60 group-hover:opacity-100 transition-opacity`}>
                    {demo.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="bg-white p-10 flex flex-col justify-center">
            <h2 style={{ fontFamily: "'Instrument Sans', sans-serif" }} className="text-[#0f2044] text-xl font-bold mb-1">Sign in</h2>
            <p className="text-[#6b7589] text-xs mb-8">Use your institutional email address</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[#0d1117] text-xs font-medium mb-1.5 font-mono uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aaes.edu"
                  required
                  className="w-full border border-[#d4d9e4] px-3 py-2.5 text-sm text-[#0d1117] placeholder-[#adb4c2] focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#0d1117] text-xs font-medium mb-1.5 font-mono uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-[#d4d9e4] px-3 py-2.5 text-sm text-[#0d1117] placeholder-[#adb4c2] focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0f2044] hover:bg-[#1a3568] text-white text-sm font-medium py-3 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  "Sign in to AAES"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#d4d9e4]">
              <p className="text-[#6b7589] text-xs">
                Contact your system administrator if you cannot access your account.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-white/20 text-xs font-mono">v2.4.1</span>
        <span className="text-white/20 text-xs">© 2024 Academic Workflows Division</span>
      </div>
    </div>
  );
}
