import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignIn, useAuth, UserButton } from "@clerk/clerk-react";
import { Check, Hammer, Home, Landmark, Moon, Sun, Trophy, User, Zap } from "lucide-react";
import { xpToLevel, overallRank } from "./components/CharacterSheet";
import { Dashboard } from "./pages/Dashboard";
import { Tasks } from "./pages/Tasks";
import { BuildingShop, City } from "./pages/City";
import { Profile } from "./pages/Profile";
import { Integrations } from "./pages/Integrations";
import { Leaderboard } from "./pages/Leaderboard";
import { ResourceBar } from "./components/ResourceBar";
import { Panel } from "./components/ui/Panel";
import { useCityStore, selectCityPaused } from "./store/cityStore";
import { useTaskStore } from "./store/taskStore";
import { setTokenGetter } from "./services/apiClient";
import { useTheme } from "./hooks/useTheme";
import { RotateCcw } from "lucide-react";

type Screen = "dashboard" | "tasks" | "city" | "shop" | "profile" | "integrations" | "leaderboard";

function TopBar({
  screen,
  onScreenChange,
}: {
  screen: Screen;
  onScreenChange: (s: Screen) => void;
}) {
  const { dark, toggle } = useTheme();

  const tabs: Array<{ id: Screen; label: string; icon: typeof Home }> = [
    { id: "dashboard",    label: "Dashboard",    icon: Home },
    { id: "tasks",        label: "Tasks",        icon: Check },
    { id: "city",         label: "City",         icon: Landmark },
    { id: "shop",         label: "Shop",         icon: Hammer },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "leaderboard",  label: "Leaderboard",  icon: Trophy },
    { id: "profile",      label: "Profile",      icon: User },
  ];

  return (
    <header className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
          Future self builder
        </p>
        <h1 className="text-3xl font-bold leading-tight text-slate-950 dark:text-white">LifeForge</h1>
      </div>
      <div className="flex items-center gap-3">
        <nav className="grid grid-cols-7 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = screen === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white dark:bg-teal-600"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
                onClick={() => onScreenChange(tab.id)}
                title={tab.label}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          type="button"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <UserButton />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
      <a
        className="font-semibold text-slate-500 transition hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        href="https://github.com/addydist"
        rel="noopener noreferrer"
        target="_blank"
      >
        Made with care by Aditya
      </a>
    </footer>
  );
}

const STAT_ICONS: Record<string, string> = {
  strength: "💪", intelligence: "🧠", wealth: "💰", wisdom: "📚", willpower: "🔥",
};

function SidePanel() {
  const { resources, population, streak, rareDrops, resetCity, lastActiveDate, characterStats } = useCityStore();
  const resetTasks = useTaskStore((s) => s.resetTasks);
  const cityPaused = selectCityPaused(lastActiveDate);
  const stats = characterStats ?? { strength: 0, intelligence: 0, wealth: 0, wisdom: 0, willpower: 0 };
  const avgLevel = Math.floor(
    Object.values(stats).reduce((s, xp) => s + xpToLevel(xp), 0) / Object.keys(stats).length
  );

  const handleReset = () => {
    resetCity();
    resetTasks();
  };

  const stages = [
    { label: "Village",    active: population < 100,                           range: "0 – 100"   },
    { label: "Town",       active: population >= 100  && population < 500,     range: "100 – 500" },
    { label: "City",       active: population >= 500  && population < 5000,    range: "500 – 5k"  },
    { label: "Metropolis", active: population >= 5000,                         range: "5k+"       },
  ] as const;

  return (
    <aside className="space-y-4">
      <Panel title="Resources">
        <ResourceBar resources={resources} compact />
      </Panel>
      <Panel title="Character">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{overallRank(avgLevel)}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Lv {avgLevel}</p>
          </div>
          <p className={`text-sm font-semibold ${cityPaused ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
            {cityPaused ? "Paused" : `🔥 ${streak} streak`}
          </p>
        </div>
        <div className="space-y-1.5">
          {Object.entries(stats).map(([key, xp]) => {
            const level = xpToLevel(xp);
            return (
              <div className="flex items-center justify-between gap-2" key={key}>
                <span className="text-sm">{STAT_ICONS[key]} <span className="text-xs capitalize text-slate-600 dark:text-slate-400">{key}</span></span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Lv {level}</span>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Rare Collection">
        {rareDrops.length ? (
          <div className="space-y-2">
            {rareDrops.slice(0, 4).map((drop) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-900/20"
                key={drop.id}
              >
                <span className="text-sm font-bold text-amber-900 dark:text-amber-300">{drop.name}</span>
                <span className="text-xs text-amber-700 dark:text-amber-400">{drop.chance}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">No rare monuments yet.</p>
        )}
      </Panel>
      <button
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={handleReset}
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
        Reset demo
      </button>
    </aside>
  );
}

function AppInner() {
  const { getToken } = useAuth();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [ready, setReady] = useState(false);
  const loadCity        = useCityStore((s) => s.loadCity);
  const loadTasks       = useTaskStore((s) => s.loadTasks);
  const checkDailyReset = useTaskStore((s) => s.checkDailyReset);

  useEffect(() => {
    setTokenGetter(getToken);
    Promise.all([loadCity(), loadTasks()]).then(async () => {
      await checkDailyReset();
    }).finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading city…</p>
      </main>
    );
  }

  const isFullWidth = screen === "profile" || screen === "integrations" || screen === "leaderboard";

  return (
    <main className="min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <TopBar screen={screen} onScreenChange={setScreen} />
        {isFullWidth ? (
          screen === "profile" ? <Profile /> : screen === "integrations" ? <Integrations /> : <Leaderboard />
        ) : (
          <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0">
              {screen === "dashboard" && <Dashboard onNavigate={setScreen} />}
              {screen === "tasks"     && <Tasks />}
              {screen === "city"      && <City onOpenShop={() => setScreen("shop")} />}
              {screen === "shop"      && <BuildingShop />}
            </section>
            <SidePanel />
          </div>
        )}
        <Footer />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        <AppInner />
      </SignedIn>
    </>
  );
}
