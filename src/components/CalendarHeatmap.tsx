import { useMemo } from "react";
import { useCityStore } from "../store/cityStore";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function cellColor(count: number) {
  if (count === 0) return "bg-slate-100 dark:bg-slate-800";
  if (count === 1) return "bg-teal-200 dark:bg-teal-900";
  if (count <= 3)  return "bg-teal-400 dark:bg-teal-700";
  return "bg-teal-600 dark:bg-teal-500";
}

type CalDay = { date: string; count: number; isToday: boolean } | null;

export function CalendarHeatmap() {
  const activityLog = useCityStore((s) => s.activityLog ?? {});
  const streak = useCityStore((s) => s.streak);

  const { weeks, monthLabels, totalThisYear } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Find Monday of current week
    const dow = now.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? 6 : dow - 1;

    const startDate = new Date(now);
    startDate.setDate(now.getDate() - mondayOffset - 15 * 7);
    // zero out time so date arithmetic is clean
    startDate.setHours(0, 0, 0, 0);

    const weeksArr: CalDay[][] = [];
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < 16; w++) {
      const week: CalDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        if (date.getTime() > now.getTime()) {
          week.push(null);
        } else {
          const key = date.toISOString().slice(0, 10);
          week.push({ date: key, count: activityLog[key] ?? 0, isToday: key === todayStr });
        }
      }
      weeksArr.push(week);

      // Month label: show when this week contains the 1st of a month
      const firstReal = week.find((d) => d !== null);
      if (firstReal) {
        const m = new Date(firstReal.date).getMonth();
        if (m !== lastMonth) {
          labels.push({ col: w, label: MONTHS[m] });
          lastMonth = m;
        }
      }
    }

    const thisYear = now.getFullYear().toString();
    const total = Object.entries(activityLog)
      .filter(([date]) => date.startsWith(thisYear))
      .reduce((sum, [, n]) => sum + n, 0);

    return { weeks: weeksArr, monthLabels: labels, totalThisYear: total };
  }, [activityLog]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">Activity</h2>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>{totalThisYear} tasks this year</span>
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            🔥 {streak} day streak
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels row */}
          <div className="mb-1 flex" style={{ paddingLeft: "30px" }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find((l) => l.col === wi);
              return (
                <div
                  key={wi}
                  className="w-[18px] shrink-0 text-[10px] leading-none text-slate-400 dark:text-slate-500"
                  style={{ marginRight: "2px" }}
                >
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="flex" style={{ gap: "2px" }}>
            {/* Day-of-week labels */}
            <div className="flex flex-col" style={{ gap: "2px", marginRight: "4px", width: "26px" }}>
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className="flex items-center justify-end"
                  style={{ height: "16px" }}
                >
                  {i % 2 === 0 && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-600">{day}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: "2px" }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day ? `${day.date}: ${day.count} task${day.count !== 1 ? "s" : ""}` : ""}
                    className={`rounded-[3px] ${
                      day === null
                        ? "invisible"
                        : `${cellColor(day.count)} ${day.isToday ? "ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-slate-900" : ""}`
                    }`}
                    style={{ width: "16px", height: "16px" }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <span>Less</span>
            {[0, 1, 2, 4].map((c) => (
              <div
                key={c}
                className={`rounded-[3px] ${cellColor(c)}`}
                style={{ width: "12px", height: "12px" }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
