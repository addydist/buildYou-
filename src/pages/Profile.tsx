import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Dumbbell,
  Edit2,
  ExternalLink,
  Flame,
  Github,
  Globe,
  Library,
  Linkedin,
  MapPin,
  Save,
  Star,
  Trophy,
  Twitter,
  X,
  Zap,
} from "lucide-react";
import type { Category } from "../types/task";
import type { ResourceKey } from "../types/city";
import { useCityStore, selectStage } from "../store/cityStore";
import { useTaskStore } from "../store/taskStore";
import { profileService, emptyProfile, type ProfilePayload } from "../services/profileService";
import { Panel } from "../components/ui/Panel";

// ─── helpers ──────────────────────────────────────────────────────────────────

const getLevel = (population: number) => Math.max(1, Math.floor(Math.sqrt(population / 10)) + 1);

const getTotalXP = (resources: Record<ResourceKey, number>) =>
  Object.values(resources).reduce((sum, v) => sum + v, 0);

const getBMI = (heightCm: number | null, weightKg: number | null) => {
  if (!heightCm || !weightKg) return null;
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
};

const progressPct = (current: number | null, goal: number | null) => {
  if (!current || !goal || goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
};

const categoryIcons: Record<Category, typeof Dumbbell> = {
  Study: BookOpen,
  Work: BriefcaseBusiness,
  Fitness: Dumbbell,
  Reading: Library,
};

const categoryColors: Record<Category, string> = {
  Study: "text-blue-600",
  Work: "text-purple-600",
  Fitness: "text-emerald-600",
  Reading: "text-amber-600",
};

const difficultyXP: Record<string, number> = { Easy: 10, Medium: 25, Hard: 50 };

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Star;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function MetricField({ label, value, unit, onChange, editing }: {
  label: string;
  value: number | null;
  unit: string;
  onChange: (v: number | null) => void;
  editing: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      {editing ? (
        <input
          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          min={0}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          step="0.1"
          type="number"
          value={value ?? ""}
        />
      ) : (
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          {value !== null ? `${value} ${unit}` : <span className="text-slate-400 dark:text-slate-600">—</span>}
        </p>
      )}
    </div>
  );
}

function GoalBar({ label, current, goal, unit, color }: {
  label: string;
  current: number | null;
  goal: number | null;
  unit: string;
  color: string;
}) {
  const pct = progressPct(current, goal);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {current !== null ? current : "—"} / {goal !== null ? goal : "—"} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const SOCIAL_FIELDS: Array<{ key: string; label: string; icon: typeof Github; placeholder: string }> = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "linkedin.com/in/username" },
  { key: "github", label: "GitHub", icon: Github, placeholder: "github.com/username" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "x.com/username" },
  { key: "website", label: "Website", icon: Globe, placeholder: "yoursite.com" },
];

// ─── main component ───────────────────────────────────────────────────────────

export function Profile() {
  const { user, isLoaded } = useUser();
  const { population, resources, streak, cityName } = useCityStore();
  const tasks = useTaskStore((s) => s.tasks);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfilePayload>(emptyProfile());
  const [form, setForm] = useState<ProfilePayload>(emptyProfile());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    profileService.load().then((data) => {
      if (data) {
        setProfile(data);
        setForm(data);
      }
    }).catch(console.error);
  }, []);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      await user.setProfileImage({ file });
    } catch (err) {
      console.error("Photo upload failed", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await profileService.save(form);
      setProfile(saved);
      setEditing(false);
    } catch (err) {
      console.error("Profile save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
  };

  const setFormField = <K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setSocialLink = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));

  // ── computed stats ──
  const level = getLevel(population);
  const totalXP = getTotalXP(resources);
  const completedTasks = tasks.filter((t) => t.completed);
  const stage = selectStage(population);

  // fitness tasks done this week (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const fitnessThisWeek = completedTasks.filter(
    (t) => t.category === "Fitness" && t.createdAt >= weekAgo,
  ).length;

  const bmi = getBMI(
    editing ? form.heightCm : profile.heightCm,
    editing ? form.weightKg : profile.weightKg,
  );

  const displayName = user?.fullName ?? user?.firstName ?? "Adventurer";
  const avatarUrl = user?.imageUrl;

  if (!isLoaded) return null;

  return (
    <div className="space-y-4 pb-8">
      {/* ── hero header ── */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* gradient banner */}
        <div className="h-32 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400" />

        <div className="px-6 pb-6">
          {/* avatar row */}
          <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md dark:border-slate-900 dark:bg-slate-700">
                {avatarUrl ? (
                  <img alt="Profile" className="h-full w-full object-cover" src={avatarUrl} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-400">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <button
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow disabled:opacity-50"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                title="Change photo"
                type="button"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                ref={fileInputRef}
                type="file"
              />
            </div>

            <div className="flex items-center gap-2 pb-1">
              {editing ? (
                <>
                  <button
                    className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={handleCancel}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    className="flex h-9 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
                    disabled={saving}
                    onClick={handleSave}
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setEditing(true)}
                  type="button"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* name + meta */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{displayName}</h2>
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">{stage} · {cityName}</p>

              {editing ? (
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  onChange={(e) => setFormField("bio", e.target.value)}
                  placeholder="Write a short bio…"
                  value={form.bio ?? ""}
                />
              ) : (
                profile.bio && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{profile.bio}</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                {editing ? (
                  <input
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    onChange={(e) => setFormField("location", e.target.value)}
                    placeholder="Location"
                    value={form.location ?? ""}
                  />
                ) : (
                  profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.location}
                    </span>
                  )
                )}
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {streak} day streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── stats row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Star} label="Level" value={level} color="text-amber-600" />
        <StatCard icon={Zap} label="Total XP" value={totalXP.toLocaleString()} color="text-teal-600" />
        <StatCard icon={Trophy} label="Tasks Done" value={completedTasks.length} color="text-purple-600" />
        <StatCard icon={Flame} label="Day Streak" value={streak} color="text-orange-500" />
      </div>

      {/* ── metrics + goals ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* body metrics */}
        <Panel title="Body Metrics">
          <div className="grid grid-cols-2 gap-3">
            <MetricField
              editing={editing}
              label="Height"
              onChange={(v) => setFormField("heightCm", v)}
              unit="cm"
              value={editing ? form.heightCm : profile.heightCm}
            />
            <MetricField
              editing={editing}
              label="Weight"
              onChange={(v) => setFormField("weightKg", v)}
              unit="kg"
              value={editing ? form.weightKg : profile.weightKg}
            />
            <MetricField
              editing={editing}
              label="Body Fat"
              onChange={(v) => setFormField("bodyFatPercent", v)}
              unit="%"
              value={editing ? form.bodyFatPercent : profile.bodyFatPercent}
            />
            <MetricField
              editing={editing}
              label="Muscle Mass"
              onChange={(v) => setFormField("muscleMassKg", v)}
              unit="kg"
              value={editing ? form.muscleMassKg : profile.muscleMassKg}
            />
          </div>
          {bmi && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-teal-50 px-4 py-2 dark:bg-teal-900/30">
              <span className="text-sm font-semibold text-teal-800 dark:text-teal-300">BMI</span>
              <span className="text-xl font-bold text-teal-900 dark:text-teal-200">{bmi}</span>
            </div>
          )}
        </Panel>

        {/* goals */}
        <Panel title="Goals">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Targets</p>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Goal Weight (kg)</label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      min={0}
                      onChange={(e) => setFormField("goalWeightKg", e.target.value === "" ? null : Number(e.target.value))}
                      step="0.5"
                      type="number"
                      value={form.goalWeightKg ?? ""}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Goal Body Fat (%)</label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      min={0}
                      onChange={(e) => setFormField("goalBodyFat", e.target.value === "" ? null : Number(e.target.value))}
                      step="0.5"
                      type="number"
                      value={form.goalBodyFat ?? ""}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Workout days / week</label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      max={7}
                      min={1}
                      onChange={(e) => setFormField("goalWorkoutDays", Number(e.target.value))}
                      type="number"
                      value={form.goalWorkoutDays ?? 5}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Daily Calories (kcal)</label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      min={0}
                      onChange={(e) => setFormField("goalDailyCalories", Number(e.target.value))}
                      step={50}
                      type="number"
                      value={form.goalDailyCalories ?? 2200}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <GoalBar
                    color="bg-emerald-500"
                    current={profile.weightKg}
                    goal={profile.goalWeightKg}
                    label="Goal Weight"
                    unit="kg"
                  />
                  <GoalBar
                    color="bg-orange-500"
                    current={profile.bodyFatPercent}
                    goal={profile.goalBodyFat}
                    label="Body Fat %"
                    unit="%"
                  />
                  <GoalBar
                    color="bg-teal-500"
                    current={fitnessThisWeek}
                    goal={profile.goalWorkoutDays ?? 5}
                    label="Workout Days (this week)"
                    unit="days"
                  />
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* ── social + recent activity ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* social links */}
        <Panel title="Social & Profiles">
          <div className="space-y-3">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => {
              const url = editing ? form.socialLinks[key] ?? "" : profile.socialLinks[key] ?? "";
              return (
                <div className="flex items-center gap-3" key={key}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  {editing ? (
                    <input
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      onChange={(e) => setSocialLink(key, e.target.value)}
                      placeholder={placeholder}
                      value={url}
                    />
                  ) : url ? (
                    <a
                      className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                      href={url.startsWith("http") ? url : `https://${url}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-600">Not set</span>
                  )}
                  <span className="hidden shrink-0 text-xs font-semibold text-slate-500 sm:block dark:text-slate-400">{label}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* recent activity */}
        <Panel title="Recent Activity">
          {completedTasks.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No completed tasks yet. Go crush some goals!</p>
          ) : (
            <div className="space-y-2">
              {completedTasks.slice(0, 8).map((task) => {
                const Icon = categoryIcons[task.category];
                const xp = difficultyXP[task.difficulty] ?? 0;
                const dateStr = new Date(task.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                    key={task.id}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className={`h-4 w-4 shrink-0 ${categoryColors[task.category]}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{task.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dateStr} · {task.difficulty}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-teal-700 dark:text-teal-400">+{xp} XP</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
