export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
      <h2 className="mb-4 text-base font-bold text-slate-950 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}
