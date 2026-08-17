import { useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Home, Plus, ClipboardList, User, Trophy, HeartPulse } from "lucide-react";
import HomeScreen from "./screens/Home";
import LogWorkout from "./screens/LogWorkout";
import ExerciseDetail from "./screens/ExerciseDetail";
import Plans from "./screens/Plans";
import Profile from "./screens/Profile";
import PRs from "./screens/PRs";
import Cardio from "./screens/Cardio";
import History from "./screens/History";
import LogSheet from "./components/LogSheet";
import OnboardingName from "./components/OnboardingName";
import { OpenLogContext } from "./hooks/useOpenLog";
import { WeightUnitProvider } from "./hooks/useWeightUnit";
import { ThemeProvider } from "./hooks/useTheme";
import { LocalUserProvider, useLocalUser } from "./hooks/useLocalUser";

function BottomNav({ onLog }) {
  const tabs = [
    { to: "/prs", label: "PRs", icon: Trophy },
    { to: "/plans", label: "Plans", icon: ClipboardList },
    { to: "/cardio", label: "Cardio", icon: HeartPulse },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="flex shrink-0 bg-bg-2 border-t border-line pt-2.5 pb-safe">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center gap-1 text-[10px] ${isActive ? "text-accent" : "text-ink-3"}`
        }
      >
        <Home size={20} strokeWidth={2} />
        <span>Home</span>
      </NavLink>

      <button
        type="button"
        onClick={onLog}
        className="flex-1 flex flex-col items-center gap-1 text-[10px] text-ink-3"
      >
        <span className="w-10 h-7 -mt-0.5 mb-0.5 rounded-full bg-accent text-bg flex items-center justify-center">
          <Plus size={18} strokeWidth={2.5} />
        </span>
        <span>Log</span>
      </button>

      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 text-[10px] ${isActive ? "text-accent" : "text-ink-3"}`
          }
        >
          <Icon size={20} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppRoutes({ logOpen, setLogOpen }) {
  const location = useLocation();
  const inSession = location.pathname === "/log/session";

  return (
    <OpenLogContext.Provider value={() => setLogOpen(true)}>
      <div className="bg-bg h-dvh flex justify-center">
        <div className="w-full max-w-[480px] h-dvh flex flex-col bg-bg relative">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/history" element={<History />} />
              <Route path="/log" element={<Navigate to="/" replace />} />
              <Route path="/log/session" element={<LogWorkout />} />
              <Route path="/prs" element={<PRs />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/cardio" element={<Cardio />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
          {!inSession && <BottomNav onLog={() => setLogOpen(true)} />}
          {logOpen && <LogSheet onClose={() => setLogOpen(false)} />}
        </div>
      </div>
    </OpenLogContext.Provider>
  );
}

function AppShell() {
  const [logOpen, setLogOpen] = useState(false);
  const { name, ready } = useLocalUser();

  if (!ready) {
    return <div className="bg-bg h-dvh" />;
  }

  if (!name) {
    return (
      <div className="bg-bg h-dvh flex justify-center">
        <div className="w-full max-w-[480px] h-dvh flex flex-col bg-bg">
          <OnboardingName />
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <AppRoutes logOpen={logOpen} setLogOpen={setLogOpen} />
    </HashRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WeightUnitProvider>
        <LocalUserProvider>
          <AppShell />
        </LocalUserProvider>
      </WeightUnitProvider>
    </ThemeProvider>
  );
}
