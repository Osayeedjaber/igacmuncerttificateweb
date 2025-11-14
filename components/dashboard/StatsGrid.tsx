type StatsGridProps = {
  totalEvents: number;
  totalCertificates: number;
  revokedCount: number;
  verificationCount: number;
};

const statsConfig = [
  {
    label: "Total Events",
    key: "totalEvents",
    accent: "from-cyan-500/20 to-cyan-500/0",
  },
  {
    label: "Certificates",
    key: "totalCertificates",
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
  {
    label: "Revoked",
    key: "revokedCount",
    accent: "from-rose-500/20 to-rose-500/0",
  },
  {
    label: "Verifications",
    key: "verificationCount",
    accent: "from-indigo-500/20 to-indigo-500/0",
  },
];

export default function StatsGrid(props: StatsGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => (
        <article
          key={stat.key}
          className="group rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/30 transition hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
        >
          <div className={`rounded-2xl bg-gradient-to-br ${stat.accent} p-4 transition group-hover:scale-105`}>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {Intl.NumberFormat().format(
                props[stat.key as keyof StatsGridProps]
              )}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

