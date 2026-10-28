import React, { useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import StudentDashboard from "./screens/StudentDashboard";
import TeacherDashboard from "./screens/TeacherDashboard";
import CognitiveProfile from "./screens/CognitiveProfile";
import LearningPath from "./screens/LearningPath";
import ExamScreen from "./screens/ExamScreen";
import ResultsScreen from "./screens/ResultsScreen";
import AdminDashboard from "./screens/AdminDashboard";
import SystemOverview from "./screens/SystemOverview";

type Screen = "login" | "student" | "teacher" | "cognitive" | "learning" | "exam" | "results" | "admin" | "overview";

export interface AppUser {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: "admin" | "faculty" | "student";
  department?: string;
  rollNo?: string;
  employeeId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-4 border border-amber-500/30">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Display Recovery Handled</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            The portal encountered a transient render error. Your examination responses and academic progress remain safely preserved.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              ← Return to Student Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              ↻ Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role === "faculty" ? "teacher" : (parsed.role as Screen);
      }
    } catch {}
    return "login";
  });

  const navigate = (s: string) => {
    if (s === "login") {
      try {
        localStorage.removeItem("lms_current_user");
      } catch {}
      setCurrentUser(null);
    }
    setScreen(s as Screen);
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("lms_current_user", JSON.stringify(user));
    } catch {}
    const targetScreen = user.role === "faculty" ? "teacher" : user.role;
    setScreen(targetScreen as Screen);
  };

  const renderScreen = () => {
    switch (screen) {
      case "login":
        return <LoginScreen onLogin={handleLogin} />;
      case "student":
        return <StudentDashboard onNavigate={navigate} user={currentUser} />;
      case "teacher":
        return <TeacherDashboard onNavigate={navigate} user={currentUser} />;
      case "cognitive":
        return <CognitiveProfile onNavigate={navigate} user={currentUser} />;
      case "learning":
        return <LearningPath onNavigate={navigate} user={currentUser} />;
      case "exam":
        return <ExamScreen onNavigate={navigate} user={currentUser} />;
      case "results":
        return <ResultsScreen onNavigate={navigate} user={currentUser} />;
      case "admin":
        return <AdminDashboard onNavigate={navigate} user={currentUser} />;
      case "overview":
        return <SystemOverview onNavigate={navigate} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <ErrorBoundary onReset={() => setScreen("student")}>
      {renderScreen()}
    </ErrorBoundary>
  );
}
