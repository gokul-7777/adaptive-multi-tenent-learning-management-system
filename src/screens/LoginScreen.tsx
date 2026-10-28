import { useState, useEffect } from "react";
import { loginUser, registerUser, checkBackendHealth } from "../services/api";

interface Props {
  onLogin: (user: any) => void;
}

const INSTITUTIONS = [
  "ABC Engineering College",
  "XYZ Institute of Technology",
  "Global University",
];

export default function LoginScreen({ onLogin }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState<string>("Checking backend...");
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regUserId, setRegUserId] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"student" | "faculty" | "admin">("student");
  const [regDepartment, setRegDepartment] = useState("Computer Science");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  useEffect(() => {
    const fetchStatus = () => {
      checkBackendHealth()
        .then((res) => {
          setBackendStatus(res.database || "Connected to MongoDB Atlas");
          setIsDbConnected(res.dbType === "mongodb");
        })
        .catch(() => {
          setBackendStatus("Backend Offline (Run 'npm run server' in terminal)");
          setIsDbConnected(false);
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter both your User ID and Password.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const loginResponse = await loginUser(identifier, password);
      onLogin(loginResponse.user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Login failed. Please check your User ID / Password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regUserId.trim() || !regName.trim() || !regPassword) {
      setRegError("Please enter User ID, Full Name, and Password.");
      return;
    }
    setRegLoading(true);

    try {
      const fallbackEmail = regEmail.trim() || `${regUserId.trim().toLowerCase()}@academic.edu`;
      const res = await registerUser({
        userId: regUserId.trim(),
        name: regName.trim(),
        email: fallbackEmail,
        password: regPassword,
        role: regRole,
        department: regDepartment.trim() || "Computer Science",
      });

      setSuccessMessage(res.message || "Account registered successfully! You can now sign in.");
      setIdentifier(regUserId.trim());
      setPassword(regPassword);
      setShowRegisterModal(false);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">A</span>
        </div>
        <div>
          <div className="text-white text-sm font-bold tracking-tight">Adaptive LMS</div>
          <div className="text-white/40 text-[10px]">Multi-Tenant Learning Management System</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Left: Hero */}
          <div className="text-white space-y-6">
            <h1 className="text-4xl font-extrabold leading-tight">
              Adaptive<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Multi-Tenant</span><br />
              Learning Management System
            </h1>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-indigo-300 text-xs font-semibold mb-3 uppercase tracking-wider">Three Core Innovations</p>
              <div className="space-y-2.5">
                {[
                  { icon: "🏛️", label: "Multi-Tenant LMS", desc: "Isolated data per institution" },
                  { icon: "🧠", label: "AI Cognitive Profiling", desc: "Adaptive learning based on your profile" },
                  { icon: "👁️", label: "Automated Proctoring", desc: "AI-monitored secure examinations" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <div>
                      <div className="text-white text-xs font-semibold">{f.label}</div>
                      <div className="text-white/40 text-[11px]">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-indigo-300 text-xs italic border-l-2 border-indigo-500 pl-3">
              "One platform. Multiple institutions. Securely isolated data."
            </p>
          </div>

          {/* Right: Login form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[#0f172a] text-xl font-bold">Sign in</h2>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + Register New User
              </button>
            </div>
            <p className="text-slate-500 text-xs mb-6">Enter your User ID and Password to continue</p>

            {successMessage ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">User ID</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your User ID"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200 mb-4 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            {/* Database status */}
            <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-2 mt-4">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className={`w-2 h-2 rounded-full ${isDbConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
                <span className="font-medium">Database:</span> {backendStatus}
              </div>
              <span className="text-[10px] text-slate-400">Port 5000</span>
            </div>
          </div>

          {/* Registration Modal */}
          {showRegisterModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-slate-800 text-lg font-bold">Register New User</h3>
                    <p className="text-slate-400 text-xs">Create an account saved directly in MongoDB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                {regError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">User ID</label>
                    <input
                      type="text"
                      required
                      value={regUserId}
                      onChange={(e) => setRegUserId(e.target.value)}
                      placeholder="Choose a User ID (e.g. gokul, student1, etc.)"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Gokul V"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Select Role</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 bg-white"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Teacher / Faculty</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                      <input
                        type="text"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        placeholder="e.g. Agricultural Engg"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. gokul@example.com (optional)"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {regLoading ? "Saving to MongoDB..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
