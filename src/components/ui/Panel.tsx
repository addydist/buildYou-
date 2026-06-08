export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}
